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
import adminApprovalRouter from './server/routes/adminApproval.js';
import pushRouter from './server/routes/push.js';
import previewRouter from './server/routes/preview.js';
import channelsRouter from './server/routes/channels.js';
import cronRouter from './server/routes/cron.js';
import { initFollowerCronJob } from './server/services/followerSyncService.js';

const PORT = 3000;
const app = express();

// Trust proxy is required for secure cookies behind a reverse proxy (like in AI Studio and Vercel)
app.set('trust proxy', true);

const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cookieSession({
    name: 'session',
    keys: [process.env.SESSION_SECRET || process.env.COOKIE_SECRET || 'juijui-planner-secret'],
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    secure: isProd, 
    sameSite: 'lax',
    httpOnly: true 
}));

// Route mounting
app.use(authRouter);
app.use(driveRouter);
app.use(tagsRouter);
app.use(dashboardRouter);
app.use(chatRouter);
app.use(adminApprovalRouter);
app.use(pushRouter);
app.use(previewRouter);
app.use(channelsRouter);
app.use(cronRouter);

// Initialize background cron services (e.g. Daily Follower Sync at 08:00 AM)
if (!process.env.VERCEL) {
    try {
        initFollowerCronJob();
    } catch (err) {
        console.error('Failed to initialize Follower Cron Job:', err);
    }
}

async function startServer() {
    try {
        // โหลด dotenv เฉพาะเมื่อไม่ได้รันบน Vercel หรืออยู่ในสภาพแวดล้อม Development
        if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
            const { createServer: createViteServer } = await import('vite');
            const vite = await createViteServer({
                server: { middlewareMode: true, hmr: false },
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
    } catch (err) {
        console.error('Vite middleware startup error:', err);
    }

    if (!process.env.VERCEL) {
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    }
}

startServer().catch(err => {
    console.error('Fatal server startup error:', err);
});

export default app;