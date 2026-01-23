
import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';

// Define types for global Google API objects to avoid TS errors
declare global {
    interface Window {
        gapi: any;
        google: any;
    }
}

// NOTE: You must replace these with your actual Google Cloud Project credentials
// Get them from: https://console.cloud.google.com/apis/credentials
const CLIENT_ID = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || ''; 
const API_KEY = (import.meta as any).env.VITE_GOOGLE_PICKER_API_KEY || (import.meta as any).env.VITE_GEMINI_API_KEY || ''; // Fallback to Gemini Key if enabled for Drive

// Scopes required for Picker
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

export const useGoogleDrive = () => {
    const [isReady, setIsReady] = useState(false);
    const [tokenClient, setTokenClient] = useState<any>(null);
    const { showToast } = useToast();

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
                callback: '', // Defined at request time
            });
            setTokenClient(client);
        }).catch(err => {
            console.error("Failed to load Google Scripts", err);
        });
    }, []);

    const openDrivePicker = (onSelect: (file: { name: string, url: string, mimeType: string }) => void) => {
        if (!isReady || !tokenClient) {
            showToast('Google Drive API ยังไม่พร้อม', 'error');
            return;
        }

        // 1. Request Access Token
        tokenClient.callback = async (response: any) => {
            if (response.error !== undefined) {
                console.error(response);
                showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ Google Drive', 'error');
                return;
            }
            
            const accessToken = response.access_token;
            createPicker(accessToken, onSelect);
        };

        // Trigger OAuth flow (Popup)
        // Skip if we already have a valid token (Optimization possible here)
        tokenClient.requestAccessToken({ prompt: '' });
    };

    const createPicker = (accessToken: string, onSelect: (file: any) => void) => {
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
                    onSelect(fileData);
                }
            })
            .build();
        
        picker.setVisible(true);
    };

    return {
        openDrivePicker,
        isReady
    };
};
