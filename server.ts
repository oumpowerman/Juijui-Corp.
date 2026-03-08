
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { google } from 'googleapis';
import multer from 'multer';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 5173;
const app = express();

// Trust proxy is required for secure cookies behind a reverse proxy (like in AI Studio)
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(session({
    secret: 'juijui-planner-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: true, 
        sameSite: 'none',
        httpOnly: true 
    }
}));

// Google OAuth Configuration
const getRedirectUri = () => {
    const baseUrl = process.env.APP_URL || `http://localhost:${PORT}`;
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
                <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f0f4f8;">
                    <div style="background: white; padding: 2rem; border-radius: 1rem; shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center;">
                        <h2 style="color: #4f46e5;">Connected to Google Drive!</h2>
                        <p>This window will close automatically.</p>
                        <script>
                            if (window.opener) {
                                window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
                                window.close();
                            } else {
                                window.location.href = '/';
                            }
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

        const fileMetadata = {
            name: `juijui-upload-${Date.now()}-${req.file.originalname}`,
            parents: [] // You could specify a folder ID here
        };

        const media = {
            mimeType: req.file.mimetype,
            body: Readable.from(req.file.buffer)
        };

        const file = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, webViewLink, webContentLink'
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

        // Construct a direct link (Note: Google Drive direct links can be tricky)
        // This is a common pattern for direct image display
        const directLink = `https://lh3.googleusercontent.com/u/0/d/${fileId}`;
        // Alternative: https://drive.google.com/uc?export=view&id=${fileId}
        const fallbackLink = `https://drive.google.com/uc?export=view&id=${fileId}`;

        res.json({ 
            id: fileId,
            url: fallbackLink 
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload to Google Drive' });
    }
});

// Vite middleware for development
if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
    });
    app.use(vite.middlewares);
} else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
