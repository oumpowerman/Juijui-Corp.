import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cookieSession from 'cookie-session';
import path from 'path';

// Import modular routers
import authRouter from './server/routes/auth.js';
import driveRouter from './server/routes/drive.js';
import tagsRouter from './server/routes/tags.js';
import dashboardRouter from './server/routes/dashboard.js';
import chatRouter from './server/routes/chat.js';

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

// Route mounting
app.use(authRouter);
app.use(driveRouter);
app.use(tagsRouter);
app.use(dashboardRouter);
app.use(chatRouter);

async function startServer() {
    // Vite middleware for development
    if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
        const { createServer: createViteServer } = await import('vite');
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: 'spa',
        });
        app.use(vite.middlewares);
    } else if (!process.env.VERCEL) {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*all', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    if (!process.env.VERCEL) {
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    }
}

startServer();

export default app;
