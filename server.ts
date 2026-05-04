
import express from 'express';
import { google } from 'googleapis';
import multer from 'multer';
import cookieParser from 'cookie-parser';
import cookieSession from 'cookie-session';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const app = express();

// Trust proxy is required for secure cookies behind a reverse proxy (like in AI Studio)
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cookieSession({
    name: 'session',
    keys: ['juijui-planner-secret'],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: true, 
    sameSite: 'none',
    httpOnly: true 
}));

// Google OAuth Configuration
const getRedirectUri = () => {
    const baseUrl = process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${PORT}`);
    // Ensure no trailing slash before appending path
    return `${baseUrl.replace(/\/$/, '')}/auth/google/callback`;
};

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    getRedirectUri()
);

// Listen for token refreshes and update the session
oauth2Client.on('tokens', (tokens) => {
    // This is tricky because we don't have access to the 'req' object here
    // However, the googleapis library will use the new tokens for the current request.
    // To persist them, we'd ideally need a database.
    // For now, we'll log it and hope the session-based approach is sufficient for the short term.
    console.log('Tokens refreshed');
});

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

// --- API Routes ---

// 0. Health Check (To verify API is alive)
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', environment: process.env.NODE_ENV || 'development' });
});

// 1. Auth URL
app.get('/api/auth/google/url', (req, res) => {
    try {
        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
            throw new Error('Google Client ID or Secret is missing in environment variables');
        }
        
        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            prompt: 'consent'
        });
        res.json({ url });
    } catch (error: any) {
        console.error('Error generating auth URL:', error);
        res.status(500).json({ error: error.message || 'Failed to generate auth URL' });
    }
});

// 2. Google Callback
app.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    try {
        const { tokens } = await oauth2Client.getToken(code as string);
        // In a real app, store these tokens in a database linked to the user
        // For this demo, we'll use session (note: session might be lost on server restart)
        (req.session as any).tokens = tokens;
        
        res.send(`
            <html>
                <head>
                    <title>Authentication Successful</title>
                    <style>
                        body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f0f4f8; margin: 0; }
                        .card { background: white; padding: 2.5rem; border-radius: 1.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center; max-width: 400px; }
                        h2 { color: #4f46e5; margin-top: 0; }
                        p { color: #64748b; line-height: 1.5; }
                        .loader { border: 3px solid #f3f3f3; border-top: 3px solid #4f46e5; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin: 20px auto; }
                        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <div class="loader"></div>
                        <h2>Connected!</h2>
                        <p>Google Drive has been successfully connected. This window will close automatically.</p>
                        <script>
                            // 1. Try to notify opener via postMessage
                            const opener = window.opener;
                            if (opener) {
                                try {
                                    opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
                                } catch (e) {
                                    console.error("postMessage failed", e);
                                }
                            }

                            // 2. Fallback via localStorage (more robust across some redirects)
                            try {
                                localStorage.setItem('GOOGLE_AUTH_TIMESTAMP', Date.now().toString());
                            } catch (e) {
                                console.error("localStorage failed", e);
                            }

                            // 3. Try to close
                            setTimeout(() => {
                                window.close();
                                // If it didn't close after 1s, redirect to home as last resort
                                setTimeout(() => {
                                    if (!window.closed) {
                                        window.location.href = '/';
                                    }
                                }, 1000);
                            }, 500);
                        </script>
                    </div>
                </body>
            </html>
        `);
    } catch (error) {
        console.error('Error getting tokens:', error);
        res.status(500).send('Authentication failed');
    }
});

// 3. Check Auth Status
app.get('/api/auth/google/status', (req, res) => {
    const tokens = (req.session as any).tokens;
    res.json({ connected: !!tokens });
});

// 3.5 Get Access Token
app.get('/api/auth/google/token', async (req, res) => {
    const tokens = (req.session as any).tokens;
    if (!tokens) return res.status(401).json({ error: 'Not connected' });
    
    try {
        const localAuthClient = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            getRedirectUri()
        );
        localAuthClient.setCredentials(tokens);
        const { token } = await localAuthClient.getAccessToken();
        
        // Update session with potentially refreshed tokens
        (req.session as any).tokens = localAuthClient.credentials;
        
        res.json({ accessToken: token });
    } catch (error) {
        console.error('Error refreshing token:', error);
        res.status(500).json({ error: 'Failed to refresh token' });
    }
});

// Helper function to get or create a folder
async function getOrCreateFolder(drive: any, folderName: string, parentId?: string) {
    let query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    if (parentId) {
        query += ` and '${parentId}' in parents`;
    }

    const response = await drive.files.list({
        q: query,
        fields: 'files(id, name)',
        spaces: 'drive',
    });

    if (response.data.files && response.data.files.length > 0) {
        return response.data.files[0].id;
    }

    const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : []
    };

    const folder = await drive.files.create({
        requestBody: fileMetadata,
        fields: 'id',
    });

    return folder.data.id;
}

// 4. Upload to Google Drive
const upload = multer({ storage: multer.memoryStorage() });
app.post('/api/upload/google-drive', upload.single('file'), async (req, res) => {
    const tokens = (req.session as any).tokens;
    if (!tokens) {
        return res.status(401).json({ error: 'Not connected to Google Drive' });
    }

    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        // Create a local OAuth2 client for this specific request to avoid race conditions
        const localAuthClient = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            getRedirectUri()
        );
        localAuthClient.setCredentials(tokens);
        
        const drive = google.drive({ version: 'v3', auth: localAuthClient });

        // Professional Folder Structure: Juijui_Planner_Assets -> Script_Images
        const rootFolderName = 'Juijui_Planner_Assets';
        const subFolderName = 'Script_Images';

        const rootFolderId = await getOrCreateFolder(drive, rootFolderName);
        const scriptFolderId = await getOrCreateFolder(drive, subFolderName, rootFolderId);

        const fileMetadata = {
            name: `script-img-${Date.now()}-${req.file.originalname}`,
            mimeType: req.file.mimetype,
            parents: [scriptFolderId] 
        };

        const media = {
            mimeType: req.file.mimetype,
            body: Readable.from(req.file.buffer)
        };

        const file = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id'
        });

        const fileId = file.data.id;

        // Make file public so it can be viewed in the editor
        await drive.permissions.create({
            fileId: fileId!,
            requestBody: {
                role: 'reader',
                type: 'anyone'
            }
        });

        // Construct a direct link using lh3.googleusercontent.com which is more reliable for embedding
        const directLink = `https://lh3.googleusercontent.com/d/${fileId}`;
        
        res.json({ 
            id: fileId,
            url: directLink 
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload to Google Drive' });
    }
});

// Vite middleware for development
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
    });
    app.use(vite.middlewares);
} else if (!process.env.VERCEL) {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
}

export default app;

if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
