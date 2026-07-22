import { google } from 'googleapis';
import express from 'express';

export const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

export const getRedirectUri = (req?: express.Request) => {
    // 1. Priority: Fixed Env Var (set this in Vercel to your custom domain or app URL)
    if (process.env.APP_URL && process.env.APP_URL.trim() !== '') {
        return `${process.env.APP_URL.trim().replace(/\/$/, '')}/auth/google/callback`;
    }
    
    // 2. Secondary: Current Request Host (Best for dynamic environments like Vercel previews)
    if (req) {
        const rawHost = (req.headers['x-forwarded-host'] as string) || req.headers.host;
        const host = rawHost?.split(',')[0].trim();
        const protocol = (req.headers['x-forwarded-proto'] as string)?.split(',')[0].trim() || (req.secure ? 'https' : 'http');
        if (host) {
            return `${protocol}://${host}/auth/google/callback`;
        }
    }

    // 3. Fallback for Vercel environment inference
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}/auth/google/callback`;
    }

    // 4. Default fallback for local development
    const PORT = process.env.PORT || 3000;
    return `http://localhost:${PORT}/auth/google/callback`;
};

export const getGoogleOAuthClient = (req?: express.Request) => {
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.VITE_GOOGLE_CLIENT_SECRET;
    return new google.auth.OAuth2(
        clientId,
        clientSecret,
        getRedirectUri(req)
    );
};

export async function getOrCreateFolder(drive: any, folderName: string, parentId?: string) {
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
