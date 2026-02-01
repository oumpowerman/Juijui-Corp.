
import { useState, useEffect, useRef } from 'react';
import { useToast } from '../context/ToastContext';

// Define types for global Google API objects to avoid TS errors
declare global {
    interface Window {
        gapi: any;
        google: any;
    }
}

// NOTE: You must replace these with your actual Google Cloud Project credentials
const CLIENT_ID = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || ''; 
const API_KEY = (import.meta as any).env.VITE_GOOGLE_PICKER_API_KEY || (import.meta as any).env.VITE_GEMINI_API_KEY || ''; 

// 'https://www.googleapis.com/auth/drive.file' allows accessing/creating files AND FOLDERS opened or created by this app
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

// Name of the root folder
const MAIN_FOLDER_NAME = 'Juijui_Uploads';

export const useGoogleDrive = () => {
    const [isReady, setIsReady] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [tokenClient, setTokenClient] = useState<any>(null);
    const { showToast } = useToast();

    // Refs to store state between token callback
    const pendingAction = useRef<'PICK' | 'UPLOAD' | null>(null);
    const pendingFile = useRef<File | null>(null);
    const pendingCallback = useRef<((result: any) => void) | null>(null);
    const pendingFolderPath = useRef<string[]>([]); // New: Store folder path

    useEffect(() => {
        if (!CLIENT_ID || !API_KEY) {
            console.warn("Google Drive API Keys missing in .env");
            return;
        }

        const loadScript = (src: string) => {
            return new Promise((resolve, reject) => {
                if (document.querySelector(`script[src="${src}"]`)) {
                    resolve(true);
                    return;
                }
                const script = document.createElement('script');
                script.src = src;
                script.async = true;
                script.defer = true;
                script.onload = resolve;
                script.onerror = reject;
                document.body.appendChild(script);
            });
        };

        Promise.all([
            loadScript('https://apis.google.com/js/api.js'),
            loadScript('https://accounts.google.com/gsi/client'),
        ]).then(() => {
            window.gapi.load('picker', () => {
                setIsReady(true);
            });

            const client = window.google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: (response: any) => handleTokenCallback(response),
            });
            setTokenClient(client);
        }).catch(err => {
            console.error("Failed to load Google Scripts", err);
        });
    }, []);

    const handleTokenCallback = (response: any) => {
        if (response.error !== undefined) {
            console.error(response);
            showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ Google Drive', 'error');
            setIsUploading(false);
            return;
        }
        
        const accessToken = response.access_token;

        if (pendingAction.current === 'PICK') {
            createPicker(accessToken, pendingCallback.current);
        } else if (pendingAction.current === 'UPLOAD' && pendingFile.current) {
            performUpload(accessToken, pendingFile.current, pendingCallback.current, pendingFolderPath.current);
        }
    };

    // --- HELPER: Find or Create Folder (Recursive-ready) ---
    const ensureFolder = async (accessToken: string, folderName: string, parentId?: string): Promise<string> => {
        try {
            // 1. Search for existing folder
            let q = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
            if (parentId) {
                q += ` and '${parentId}' in parents`;
            }

            const searchResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`, {
                headers: { 'Authorization': 'Bearer ' + accessToken }
            });
            const searchData = await searchResponse.json();

            if (searchData.files && searchData.files.length > 0) {
                return searchData.files[0].id;
            }

            // 2. If not found, Create new folder
            const metadata: any = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder'
            };
            if (parentId) {
                metadata.parents = [parentId];
            }

            const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
                method: 'POST',
                headers: { 
                    'Authorization': 'Bearer ' + accessToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(metadata)
            });
            const folderData = await createResponse.json();
            return folderData.id;

        } catch (error) {
            console.error(`Error finding/creating folder '${folderName}':`, error);
            return ''; // Fallback to root if fails
        }
    };

    // --- PICKER LOGIC ---
    const openDrivePicker = (onSelect: (file: { name: string, url: string, mimeType: string, iconUrl?: string }) => void) => {
        if (!isReady || !tokenClient) {
            showToast('Google Drive API ยังไม่พร้อม', 'error');
            return;
        }
        pendingAction.current = 'PICK';
        pendingCallback.current = onSelect;
        tokenClient.requestAccessToken({ prompt: '' });
    };

    const createPicker = (accessToken: string, onSelect: ((file: any) => void) | null) => {
        const view = new window.google.picker.View(window.google.picker.ViewId.DOCS);
        view.setMimeTypes('image/png,image/jpeg,video/mp4,application/pdf,application/vnd.google-apps.document,application/vnd.google-apps.spreadsheet');
        
        const picker = new window.google.picker.PickerBuilder()
            .addView(view)
            .setOAuthToken(accessToken)
            .setDeveloperKey(API_KEY)
            .setCallback((data: any) => {
                if (data[window.google.picker.Response.ACTION] === window.google.picker.Action.PICKED) {
                    const doc = data[window.google.picker.Response.DOCUMENTS][0];
                    const fileData = {
                        name: doc[window.google.picker.Document.NAME],
                        url: doc[window.google.picker.Document.URL],
                        mimeType: doc[window.google.picker.Document.MIME_TYPE],
                        iconUrl: doc[window.google.picker.Document.ICON_URL]
                    };
                    if (onSelect) onSelect(fileData);
                }
            })
            .build();
        
        picker.setVisible(true);
    };

    // --- UPLOAD LOGIC ---
    const uploadFileToDrive = (
        file: File, 
        onComplete: (result: { name: string, url: string, mimeType: string, downloadUrl?: string, thumbnailUrl?: string }) => void,
        folderPath: string[] = [] // Optional nested path e.g. ['Work', '2023']
    ) => {
        if (!isReady || !tokenClient) {
            showToast('Google Drive API ยังไม่พร้อม', 'error');
            return;
        }
        pendingAction.current = 'UPLOAD';
        pendingFile.current = file;
        pendingCallback.current = onComplete;
        pendingFolderPath.current = folderPath; // Store path
        
        setIsUploading(true);
        tokenClient.requestAccessToken({ prompt: '' });
    };

    const performUpload = async (accessToken: string, file: File, onComplete: ((result: any) => void) | null, folderPath: string[]) => {
        try {
            // 1. Get/Create Root Folder (Juijui_Uploads)
            let currentParentId = await ensureFolder(accessToken, MAIN_FOLDER_NAME);

            // 2. Iterate and create sub-folders
            for (const folderName of folderPath) {
                if (currentParentId) {
                    const nextId = await ensureFolder(accessToken, folderName, currentParentId);
                    if (nextId) currentParentId = nextId;
                }
            }

            // 3. Prepare Metadata
            const metadata: any = {
                name: file.name,
                mimeType: file.type,
            };
            
            // If folder exists, set parent
            if (currentParentId) {
                metadata.parents = [currentParentId];
            }

            const formData = new FormData();
            formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            formData.append('file', file);

            // 4. Upload File
            // Requesting extra fields: thumbnailLink, webContentLink
            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink,thumbnailLink,name', {
                method: 'POST',
                headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');
            const data = await response.json();

            // 5. Make it readable by anyone with the link
            try {
                await fetch(`https://www.googleapis.com/drive/v3/files/${data.id}/permissions`, {
                    method: 'POST',
                    headers: new Headers({ 
                        'Authorization': 'Bearer ' + accessToken,
                        'Content-Type': 'application/json'
                    }),
                    body: JSON.stringify({
                        role: 'reader',
                        type: 'anyone'
                    })
                });
            } catch (permErr) {
                console.warn("Could not set public permission:", permErr);
            }

            // 6. Enhance Thumbnail Link (Google returns small s220 size, we hack it to s1000 for high res view)
            let largeThumbnailUrl = null;
            if (data.thumbnailLink) {
                // e.g. "https://lh3.googleusercontent.com/...=s220" -> replace with "=s1200"
                largeThumbnailUrl = data.thumbnailLink.replace(/=s\d+$/, '=s1200');
            }

            if (onComplete) {
                onComplete({
                    name: data.name,
                    url: data.webViewLink, // Standard View Link (Opens Drive UI)
                    mimeType: file.type,
                    downloadUrl: data.webContentLink, // Force Download Link
                    thumbnailUrl: largeThumbnailUrl // Direct Image Link (Great for <img src>)
                });
            }
            
            // Show destination in toast
            const destPath = [MAIN_FOLDER_NAME, ...folderPath].join('/');
            showToast(`อัปโหลดไฟล์ไปที่ ${destPath} เรียบร้อย 📂`, 'success');

        } catch (error: any) {
            console.error('Drive Upload Error:', error);
            showToast('อัปโหลดไป Drive ไม่สำเร็จ', 'error');
        } finally {
            setIsUploading(false);
            pendingFile.current = null;
            pendingFolderPath.current = [];
        }
    };

    return {
        openDrivePicker,
        uploadFileToDrive,
        isReady,
        isUploading
    };
};
