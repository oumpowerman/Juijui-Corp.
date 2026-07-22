// server.ts
import "dotenv/config";
import express7 from "express";
import cookieParser from "cookie-parser";
import cookieSession from "cookie-session";
import path from "path";

// server/routes/auth.ts
import express from "express";

// server/utils/google-client.ts
import { google } from "googleapis";
var SCOPES = ["https://www.googleapis.com/auth/drive.file"];
var getRedirectUri = (req) => {
  const PORT2 = 3e3;
  if (process.env.APP_URL) {
    return `${process.env.APP_URL.replace(/\/$/, "")}/auth/google/callback`;
  }
  if (req) {
    const rawHost = req.headers["x-forwarded-host"] || req.headers.host;
    const host = rawHost?.split(",")[0].trim();
    const protocol = req.headers["x-forwarded-proto"]?.split(",")[0].trim() || "https";
    if (host) {
      return `${protocol}://${host}/auth/google/callback`;
    }
  }
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${PORT2}`;
  return `${baseUrl.replace(/\/$/, "")}/auth/google/callback`;
};
var getGoogleOAuthClient = (req) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.VITE_GOOGLE_CLIENT_SECRET;
  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    getRedirectUri(req)
  );
};
async function getOrCreateFolder(drive, folderName, parentId) {
  let query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  }
  const response = await drive.files.list({
    q: query,
    fields: "files(id, name)",
    spaces: "drive"
  });
  if (response.data.files && response.data.files.length > 0) {
    return response.data.files[0].id;
  }
  const fileMetadata = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
    parents: parentId ? [parentId] : []
  };
  const folder = await drive.files.create({
    requestBody: fileMetadata,
    fields: "id"
  });
  return folder.data.id;
}

// server/routes/auth.ts
var router = express.Router();
router.get("/api/auth/google/url", (req, res) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.VITE_GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return res.status(400).json({
        error: "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32 GOOGLE_CLIENT_ID \u0E41\u0E25\u0E30 GOOGLE_CLIENT_SECRET \u0E43\u0E19 Environment Variables"
      });
    }
    const localOauthClient = getGoogleOAuthClient(req);
    const url = localOauthClient.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      prompt: "consent"
    });
    res.json({ url });
  } catch (error) {
    console.error("Error generating auth URL:", error);
    res.status(500).json({ error: error.message || "Failed" });
  }
});
router.get("/api/auth/google/status", (req, res) => {
  const tokens = req.session?.tokens;
  res.json({ connected: !!tokens });
});
router.get("/api/auth/google/token", async (req, res) => {
  const tokens = req.session?.tokens;
  if (!tokens) return res.status(401).json({ error: "Not connected" });
  try {
    const localAuthClient = getGoogleOAuthClient(req);
    localAuthClient.setCredentials(tokens);
    const { token } = await localAuthClient.getAccessToken();
    req.session.tokens = localAuthClient.credentials;
    res.json({ accessToken: token });
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(500).json({ error: "Failed to refresh token" });
  }
});
router.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;
  console.log("Received auth callback with code:", !!code);
  try {
    const localOauthClient = getGoogleOAuthClient(req);
    const { tokens } = await localOauthClient.getToken(code);
    console.log("Successfully obtained tokens");
    req.session.tokens = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
      token_type: tokens.token_type,
      scope: tokens.scope
    };
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
                            // Handle Success
                            const notifyAndClose = () => {
                                if (window.opener) {
                                    try {
                                        window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
                                    } catch (e) {
                                        console.error("postMessage failed", e);
                                    }
                                }
                                try {
                                    localStorage.setItem('GOOGLE_AUTH_TIMESTAMP', Date.now().toString());
                                } catch (e) {
                                    console.error("localStorage failed", e);
                                }
                                setTimeout(() => { window.close(); }, 500);
                            };
                            notifyAndClose();
                        </script>
                    </div>
                </body>
            </html>
        `);
  } catch (error) {
    console.error("Error getting tokens:", error);
    res.status(500).send(`
            <div style="padding: 20px; font-family: sans-serif; text-align: center;">
                <h2 style="color: #ef4444;">Authentication Failed</h2>
                <p>Something went wrong while connecting to Google Drive.</p>
                <pre style="text-align: left; background: #f1f5f9; padding: 15px; border-radius: 8px; font-size: 12px; overflow: auto;">${error.message || error}</pre>
                <button onclick="window.close()" style="padding: 8px 16px; background: #64748b; color: white; border: none; border-radius: 6px; cursor: pointer;">Close Window</button>
            </div>
        `);
  }
});
var auth_default = router;

// server/routes/drive.ts
import express2 from "express";
import multer from "multer";
import { google as google2 } from "googleapis";
import { Readable } from "stream";

// config/brand.ts
var BRAND_CONFIG = {
  name: "Kontent OS",
  companyName: "Kontent OS Co., Ltd.",
  title: "Kontent OS",
  tagline: "\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E04\u0E27\u0E32\u0E21\u0E27\u0E38\u0E48\u0E19\u0E27\u0E32\u0E22\u0E2B\u0E25\u0E31\u0E07\u0E1A\u0E49\u0E32\u0E19\u0E43\u0E2B\u0E49\u0E40\u0E1B\u0E47\u0E19\u0E23\u0E30\u0E1A\u0E1A\u0E23\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E1A",
  description: "\u0E41\u0E1E\u0E25\u0E15\u0E1F\u0E2D\u0E23\u0E4C\u0E21\u0E1A\u0E23\u0E34\u0E2B\u0E32\u0E23\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E07\u0E32\u0E19\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E2A\u0E23\u0E23\u0E04\u0E4C\u0E17\u0E35\u0E48\u0E40\u0E19\u0E49\u0E19 Workflow \u0E02\u0E2D\u0E07\u0E04\u0E23\u0E35\u0E40\u0E2D\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E42\u0E14\u0E22\u0E40\u0E09\u0E1E\u0E32\u0E30",
  supportEmail: "support@kontentos.ai",
  website: "https://kontentos.ai",
  copyright: "\xA9 2024 Kontent OS. All rights reserved.",
  madeBy: "Made with \u2665 by Content Creator for Creator",
  projectPlaceholder: "\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19\u0E27\u0E32\u0E07\u0E41\u0E1C\u0E19\u0E01\u0E25\u0E22\u0E38\u0E17\u0E18\u0E4C\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E14\u0E49\u0E27\u0E22\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E21\u0E37\u0E2D Kontent OS \u0E42\u0E14\u0E22\u0E01\u0E14\u0E1B\u0E38\u0E48\u0E21\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E42\u0E04\u0E23\u0E07\u0E01\u0E32\u0E23\u0E43\u0E2B\u0E21\u0E48\u0E14\u0E49\u0E32\u0E19\u0E1A\u0E19"
};

// server/routes/drive.ts
var router2 = express2.Router();
var upload = multer({ storage: multer.memoryStorage() });
router2.post("/api/upload/google-drive", upload.single("file"), async (req, res) => {
  const tokens = req.session?.tokens;
  if (!tokens) {
    return res.status(401).json({ error: "Not connected to Google Drive" });
  }
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  try {
    const localAuthClient = getGoogleOAuthClient(req);
    localAuthClient.setCredentials(tokens);
    const drive = google2.drive({ version: "v3", auth: localAuthClient });
    const rootFolderName = `${BRAND_CONFIG.name.replace(/\s+/g, "_")}_Assets`;
    const subFolderName = "Script_Images";
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
      media,
      fields: "id"
    });
    const fileId = file.data.id;
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: "reader",
        type: "anyone"
      }
    });
    const directLink = `https://lh3.googleusercontent.com/d/${fileId}`;
    res.json({
      id: fileId,
      url: directLink
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload to Google Drive" });
  }
});
router2.post("/api/export/google-docs", async (req, res) => {
  const tokens = req.session?.tokens;
  if (!tokens) {
    return res.status(401).json({ error: "Not connected to Google Drive" });
  }
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required" });
  }
  try {
    const localAuthClient = getGoogleOAuthClient(req);
    localAuthClient.setCredentials(tokens);
    const drive = google2.drive({ version: "v3", auth: localAuthClient });
    const rootFolderName = `${BRAND_CONFIG.name.replace(/\s+/g, "_")}_Assets`;
    const subFolderName = "Exported_Scripts";
    const rootFolderId = await getOrCreateFolder(drive, rootFolderName);
    const scriptFolderId = await getOrCreateFolder(drive, subFolderName, rootFolderId);
    const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body {
                        font-family: "Arial", "Inter", sans-serif;
                        font-size: 11pt;
                        line-height: 1.6;
                        color: #1e293b;
                        margin: 1in;
                    }
                    h1 {
                        font-family: "Arial", "Inter", sans-serif;
                        color: #1e1b4b;
                        font-size: 22pt;
                        font-weight: bold;
                        margin-bottom: 6px;
                    }
                    h2 {
                        font-family: "Arial", "Inter", sans-serif;
                        color: #4f46e5;
                        font-size: 15pt;
                        font-weight: bold;
                        border-bottom: 1.5px solid #e2e8f0;
                        padding-bottom: 6px;
                        margin-top: 24px;
                        margin-bottom: 12px;
                    }
                    p {
                        margin-top: 0;
                        margin-bottom: 10px;
                    }
                    strong {
                        font-weight: bold;
                        color: #0f172a;
                    }
                    ul, ol {
                        margin-top: 0;
                        margin-bottom: 10px;
                        padding-left: 20px;
                    }
                    li {
                        margin-bottom: 6px;
                    }
                </style>
            </head>
            <body>
                <h1>${title}</h1>
                <hr style="border: none; border-top: 1px solid #cbd5e1; margin-bottom: 24px;" />
                ${content}
            </body>
            </html>
        `;
    const fileMetadata = {
      name: title,
      mimeType: "application/vnd.google-apps.document",
      parents: [scriptFolderId]
    };
    const media = {
      mimeType: "text/html",
      body: Readable.from(htmlContent)
    };
    const file = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: "id, name, webViewLink"
    });
    res.json({
      id: file.data.id,
      name: file.data.name,
      webViewLink: file.data.webViewLink
    });
  } catch (error) {
    console.error("Export Google Docs error:", error);
    res.status(500).json({ error: error.message || "Failed to export script to Google Docs" });
  }
});
var drive_default = router2;

// server/routes/tags.ts
import express3 from "express";

// utils/tagIndexer.ts
import { createClient } from "@supabase/supabase-js";
var supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL || "https://ajkycqazreebczqjsfpv.supabase.co";
var supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqa3ljcWF6cmVlYmN6cWpzZnB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0OTM5MjMsImV4cCI6MjA4NDA2OTkyM30.VscG53hy5tT5_oT297RECiVzaCcCw51AYWQeme_PDRo";
var isMock = !process.env.REACT_APP_SUPABASE_URL && !process.env.SUPABASE_URL;
var supabaseClient = null;
if (!isMock) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
}
var EnterpriseTagIndex = class {
  constructor() {
    this.cache = [];
    this.lastRefreshed = 0;
    this.refreshIntervalMs = 60 * 1e3;
    // Refresh every 1 minute
    this.defaultTags = [
      { name: "Vlog", count: 4200 },
      { name: "Review", count: 3500 },
      { name: "Tiktok", count: 2800 },
      { name: "Shorts", count: 2300 },
      { name: "BehindTheScenes", count: 1850 },
      { name: "Prank", count: 1540 },
      { name: "Challenge", count: 1200 },
      { name: "Finance", count: 980 },
      { name: "Travel", count: 850 },
      { name: "Gaming", count: 720 },
      { name: "Cooking", count: 540 },
      { name: "Music", count: 430 }
    ];
  }
  /**
   * Rebuild index by querying Supabase tasks or falling back to in-memory datasets
   */
  async rebuildIndex() {
    try {
      if (isMock || !supabaseClient) {
        this.cache = [...this.defaultTags];
        this.lastRefreshed = Date.now();
        return;
      }
      console.log("[TagIndex] Querying Supabase for tag indexing...");
      const { data, error } = await supabaseClient.from("tasks").select("tags").limit(2e3);
      if (error) throw error;
      if (data && Array.isArray(data)) {
        const counts = {};
        data.forEach((row) => {
          const tags = row.tags;
          if (Array.isArray(tags)) {
            tags.forEach((tag) => {
              const trimmed = tag?.trim();
              if (trimmed) {
                counts[trimmed] = (counts[trimmed] || 0) + 1;
              }
            });
          }
        });
        this.cache = Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
        const existingNames = new Set(this.cache.map((t) => t.name.toLowerCase()));
        this.defaultTags.forEach((defTag) => {
          if (!existingNames.has(defTag.name.toLowerCase())) {
            this.cache.push(defTag);
          }
        });
        this.cache.sort((a, b) => b.count - a.count);
      } else {
        this.cache = [...this.defaultTags];
      }
      this.lastRefreshed = Date.now();
    } catch (err) {
      console.error("[TagIndex] Failed to rebuild tag index, using fallback tags:", err);
      this.cache = [...this.defaultTags];
      this.lastRefreshed = Date.now();
    }
  }
  /**
   * Fast prefix & substring matching for tag autocomplete
   */
  async searchTags(query, limit = 12) {
    if (this.cache.length === 0 || Date.now() - this.lastRefreshed > this.refreshIntervalMs) {
      await this.rebuildIndex();
    }
    const cleanQuery = query.toLowerCase().trim().replace(/^#/, "");
    if (!cleanQuery) {
      return this.cache.slice(0, limit);
    }
    return this.cache.filter((tag) => tag.name.toLowerCase().includes(cleanQuery)).slice(0, limit);
  }
  /**
   * Sync method allowing clients to notify tag changes for real-time reactivity
   */
  notifyUpdate() {
    this.lastRefreshed = 0;
  }
};
var tagIndexService = new EnterpriseTagIndex();

// server/routes/tags.ts
var router3 = express3.Router();
router3.get("/api/tags", async (req, res) => {
  const q = req.query.q || "";
  const limit = parseInt(req.query.limit) || 12;
  const startTime = process.hrtime();
  try {
    const matchedTags = await tagIndexService.searchTags(q, limit);
    const diff = process.hrtime(startTime);
    const speedMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(3);
    res.json({
      success: true,
      query: q,
      tags: matchedTags,
      speedMs: `${speedMs}ms`,
      indexedAt: Date.now()
    });
  } catch (err) {
    console.error("Tag search error:", err);
    res.status(500).json({ success: false, error: err.message || "Tag search failed" });
  }
});
router3.post("/api/tags/sync", (req, res) => {
  try {
    tagIndexService.notifyUpdate();
    res.json({ success: true, message: "Tag index sync trigger set successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Tag sync failed" });
  }
});
var tags_default = router3;

// server/routes/dashboard.ts
import express4 from "express";
import { isSameMonth, isAfter, addDays, isPast, isToday, isBefore } from "date-fns";

// server/utils/supabase.ts
import { createClient as createClient2 } from "@supabase/supabase-js";
var supabaseUrl2 = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL || "https://ajkycqazreebczqjsfpv.supabase.co";
var supabaseAnonKey2 = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqa3ljcWF6cmVlYmN6cWpzZnB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0OTM5MjMsImV4cCI6MjA4NDA2OTkyM30.VscG53hy5tT5_oT297RECiVzaCcCw51AYWQeme_PDRo";
var serverSupabase = createClient2(supabaseUrl2, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || supabaseAnonKey2);
var isTaskCompletedServer = (status) => {
  if (!status) return false;
  const s = status.trim().toUpperCase();
  if (s === "DONE" || s === "APPROVE" || s === "PASSED") return true;
  const COMPLETION_KEYWORDS = [
    "COMPLETE",
    "SUCCESS",
    "PUBLISH",
    "POSTED",
    "FINISH",
    "CLOSED",
    "ARCHIVE",
    "FINAL",
    "DONE",
    "APPROVED",
    "VERIFIED",
    "ACCEPTED",
    "PASS"
  ];
  return COMPLETION_KEYWORDS.some((k) => s.includes(k));
};
var mapDbToTaskServer = (data, type) => {
  const startDateVal = data.start_date || data.startDate || data.created_at;
  const endDateVal = data.end_date || data.endDate || data.created_at;
  let platforms = [];
  if (Array.isArray(data.target_platform)) {
    platforms = data.target_platform;
  } else if (data.target_platform) {
    platforms = [data.target_platform];
  }
  const reviews = (data.task_reviews || []).map((r) => ({
    id: r.id,
    taskId: r.content_id || r.task_id,
    round: r.round,
    scheduledAt: r.scheduled_at,
    reviewerId: r.reviewer_id,
    status: r.status,
    feedback: r.feedback,
    isCompleted: r.is_completed
  }));
  return {
    id: data.id,
    title: data.title,
    description: data.description || "",
    type,
    status: data.status,
    priority: type === "TASK" ? data.priority : void 0,
    tags: data.tags || [],
    pillar: data.pillar,
    contentFormats: data.content_formats || [],
    category: data.category,
    remark: data.remark,
    startDate: startDateVal,
    endDate: endDateVal,
    createdAt: data.created_at,
    updatedAt: data.updated_at || void 0,
    channelId: data.channel_id,
    targetPlatforms: platforms,
    scheduledTime: data.scheduled_time,
    isUnscheduled: data.is_unscheduled ?? false,
    assigneeIds: data.assignee_ids || [],
    ideaOwnerIds: data.idea_owner_ids || [],
    editorIds: data.editor_ids || [],
    assets: data.assets || [],
    reviews: reviews.sort((a, b) => (a.round || 0) - (b.round || 0)),
    logs: [],
    performance: data.performance || void 0,
    difficulty: data.difficulty || "MEDIUM",
    estimatedHours: data.estimated_hours || 0,
    assigneeType: data.assignee_type || "TEAM",
    targetPosition: data.target_position,
    caution: data.caution,
    importance: data.importance,
    publishedLinks: data.published_links || {},
    shootDate: data.shoot_date || void 0,
    shootLocation: data.shoot_location || void 0,
    shootTripId: data.shoot_trip_id || void 0,
    shootTimeStart: data.shoot_time_start || void 0,
    shootTimeEnd: data.shoot_time_end || void 0,
    shootNotes: data.shoot_notes || void 0,
    localPath: data.local_path || void 0,
    driveLabel: data.drive_label || void 0,
    isInShootQueue: data.is_in_shoot_queue || false,
    isSoftFinished: data.is_soft_finished || false,
    contentId: data.content_id,
    showOnBoard: data.show_on_board,
    parentContentTitle: data.contents?.title,
    roadmapId: data.roadmap_id,
    scriptId: data.script_id,
    sla_revert_count: data.sla_revert_count,
    is_penalized: data.is_penalized,
    last_penalized_at: data.last_penalized_at || void 0
  };
};

// server/routes/dashboard.ts
var router4 = express4.Router();
router4.get("/api/dashboard/stats", async (req, res) => {
  const timeRange = req.query.timeRange || "LAST_30";
  const customDays = parseInt(req.query.customDays) || 7;
  const viewScope = req.query.viewScope || "ALL";
  const userId = req.query.userId;
  try {
    const today = /* @__PURE__ */ new Date();
    const { data: configs, error: configError } = await serverSupabase.from("dashboard_configs").select("*").order("sort_order", { ascending: true });
    if (configError) throw configError;
    const { data: contents, error: contentError } = await serverSupabase.from("contents").select(`
                id, title, description, status, pillar, category, content_formats, tags,
                start_date, end_date, channel_id, created_at, updated_at, is_unscheduled, remark, scheduled_time,
                target_platform, assignee_ids, idea_owner_ids, editor_ids, shoot_trip_id,
                shoot_date, is_in_shoot_queue, is_soft_finished,
                task_reviews(id, round, status, is_completed),
                content_analytics(id, platform),
                sponsorship_details(is_sponsored, deal_value, requirements, payment_status, is_paid, invoice_url, client_id)
            `);
    if (contentError) throw contentError;
    const { data: dbTasks, error: dbTasksError } = await serverSupabase.from("tasks").select(`
                id, title, status, priority, start_date, end_date, created_at, updated_at, 
                assignee_ids, content_id, show_on_board, target_position, roadmap_id, 
                difficulty, assignee_type, estimated_hours, scheduled_time,
                contents(title), task_reviews(id, round, status, is_completed)
            `);
    if (dbTasksError) throw dbTasksError;
    const combined = [];
    if (contents) {
      contents.forEach((d) => {
        combined.push(mapDbToTaskServer(d, "CONTENT"));
      });
    }
    if (dbTasks) {
      dbTasks.forEach((d) => {
        combined.push(mapDbToTaskServer(d, "TASK"));
      });
    }
    const checkDateInRange = (dateVal) => {
      if (!dateVal) return false;
      const date = new Date(dateVal);
      switch (timeRange) {
        case "THIS_MONTH":
          return isSameMonth(date, today);
        case "LAST_30":
          return isAfter(date, addDays(today, -30));
        case "LAST_90":
          return isAfter(date, addDays(today, -90));
        case "CUSTOM":
          return isAfter(date, addDays(today, -customDays));
        case "ALL":
          return true;
        default:
          return true;
      }
    };
    const filtered = combined.filter((t) => {
      const isDone = isTaskCompletedServer(t.status);
      if (t.isUnscheduled && !isDone) {
        return false;
      }
      if (viewScope === "ME" && userId) {
        const isAssignee = t.assigneeIds?.includes(userId);
        const isOwner = t.ideaOwnerIds?.includes(userId);
        const isEditor = t.editorIds?.includes(userId);
        if (!isAssignee && !isOwner && !isEditor) return false;
      }
      if (timeRange === "ALL") return true;
      if (!t.endDate) return false;
      const endDateObj = new Date(t.endDate);
      const isInRange = checkDateInRange(endDateObj);
      if (isDone) {
        return isInRange;
      } else {
        return isInRange || isBefore(endDateObj, today);
      }
    });
    const cardStats = (configs || []).map((config) => {
      const statusKeys = config.status_keys || [];
      const filterType = config.filter_type || "STATUS";
      const matchingTasks = filtered.filter((t) => {
        if (filterType === "STATUS") {
          return statusKeys.includes(t.status || "");
        } else if (filterType === "FORMAT") {
          const formats = t.contentFormats || [];
          return statusKeys.some((key) => formats.includes(key));
        } else if (filterType === "PILLAR") {
          return statusKeys.includes(t.pillar || "");
        } else if (filterType === "CATEGORY") {
          return statusKeys.includes(t.category || "");
        }
        return false;
      });
      const urgentCount = matchingTasks.filter((t) => {
        const isDone = isTaskCompletedServer(t.status);
        if (isDone || t.isUnscheduled || !t.endDate) return false;
        const endDateObj = new Date(t.endDate);
        const isOverdue = isPast(endDateObj) && !isToday(endDateObj);
        const isDueSoon = isToday(endDateObj) || isBefore(endDateObj, addDays(/* @__PURE__ */ new Date(), 1));
        return isOverdue || isDueSoon;
      }).length;
      return {
        id: config.id,
        key: config.key,
        label: config.label,
        icon: config.icon,
        colorTheme: config.color_theme,
        statusKeys,
        filterType,
        sortOrder: config.sort_order,
        count: matchingTasks.length,
        urgentCount,
        tasks: matchingTasks
        // Provide mapped task items
      };
    });
    const totalFilteredTasks = filtered.length;
    const doneTasksCount = filtered.filter((t) => isTaskCompletedServer(t.status)).length;
    const progressPercentage = totalFilteredTasks > 0 ? Math.round(doneTasksCount / totalFilteredTasks * 100) : 0;
    const chartData = cardStats.map((stat) => ({
      name: stat.label,
      value: stat.count,
      colorTheme: stat.colorTheme || "blue"
    })).filter((d) => d.value > 0);
    res.json({
      success: true,
      cardStats,
      chartData,
      totalFilteredTasks,
      progressPercentage
    });
  } catch (err) {
    console.error("Server-side dashboard stats failed:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to aggregate dashboard stats" });
  }
});
var dashboard_default = router4;

// server/routes/chat.ts
import express5 from "express";
import { GoogleGenAI, Type } from "@google/genai";
var router5 = express5.Router();
router5.post("/api/chat/assist", async (req, res) => {
  const { message, tasks = [], channels = [] } = req.body;
  if (!process.env.GEMINI_API_KEY) {
    return res.json({
      text: "\u26A0\uFE0F [AI System] \u0E01\u0E23\u0E38\u0E13\u0E32\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32 GEMINI_API_KEY \u0E43\u0E19\u0E2B\u0E19\u0E49\u0E32 Settings > Secrets \u0E02\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E1A\u0E01\u0E48\u0E2D\u0E19\u0E19\u0E30\u0E04\u0E23\u0E31\u0E1A \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E1C\u0E39\u0E49\u0E0A\u0E48\u0E27\u0E22\u0E2D\u0E31\u0E08\u0E09\u0E23\u0E34\u0E22\u0E30\u0E04\u0E38\u0E22\u0E2A\u0E14\u0E01\u0E31\u0E1A\u0E40\u0E0B\u0E34\u0E23\u0E4C\u0E1F\u0E40\u0E27\u0E2D\u0E23\u0E4C",
      functionCalls: []
    });
  }
  try {
    const aiInstance = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
    const systemInstruction = `
\u0E04\u0E38\u0E13\u0E04\u0E37\u0E2D Juijui Assistant \u{1F916} \u0E1C\u0E39\u0E49\u0E0A\u0E48\u0E27\u0E22 AI \u0E2D\u0E31\u0E08\u0E09\u0E23\u0E34\u0E22\u0E30\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E04\u0E2D\u0E19\u0E40\u0E17\u0E19\u0E15\u0E4C KontentOS (\u0E23\u0E30\u0E1A\u0E1A\u0E1A\u0E23\u0E34\u0E2B\u0E32\u0E23\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E1E\u0E25\u0E47\u0E2D\u0E15 \u0E40\u0E25\u0E40\u0E2D\u0E32\u0E15\u0E4C \u0E1A\u0E17\u0E2A\u0E04\u0E23\u0E34\u0E1B\u0E15\u0E4C \u0E41\u0E25\u0E30\u0E2A\u0E37\u0E48\u0E2D\u0E27\u0E34\u0E14\u0E35\u0E42\u0E2D\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E42\u0E1B\u0E23\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E17\u0E35\u0E21\u0E04\u0E23\u0E35\u0E40\u0E2D\u0E40\u0E15\u0E2D\u0E23\u0E4C)

\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E04\u0E37\u0E2D:
1. \u0E43\u0E2B\u0E49\u0E04\u0E33\u0E1B\u0E23\u0E36\u0E01\u0E29\u0E32 \u0E41\u0E19\u0E30\u0E19\u0E33\u0E44\u0E2D\u0E40\u0E14\u0E35\u0E22\u0E17\u0E33\u0E04\u0E25\u0E34\u0E1B\u0E2A\u0E31\u0E49\u0E19 (TikTok/Shorts/Reels) \u0E23\u0E48\u0E32\u0E07\u0E1E\u0E25\u0E47\u0E2D\u0E15\u0E2A\u0E04\u0E23\u0E34\u0E1B\u0E15\u0E4C \u0E25\u0E33\u0E14\u0E31\u0E1A\u0E20\u0E32\u0E1E \u0E41\u0E25\u0E30\u0E08\u0E31\u0E14\u0E2A\u0E23\u0E23\u0E41\u0E04\u0E21\u0E40\u0E1B\u0E0D\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E01\u0E49\u0E32\u0E27\u0E2B\u0E19\u0E49\u0E32\u0E41\u0E25\u0E30\u0E21\u0E37\u0E2D\u0E2D\u0E32\u0E0A\u0E35\u0E1E
2. \u0E0A\u0E48\u0E27\u0E22\u0E1A\u0E23\u0E34\u0E2B\u0E32\u0E23\u0E23\u0E30\u0E1A\u0E1A\u0E07\u0E32\u0E19\u0E1C\u0E25\u0E34\u0E15 \u0E42\u0E14\u0E22\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E1A\u0E2D\u0E01\u0E40\u0E08\u0E15\u0E19\u0E32\u0E08\u0E30 "\u0E40\u0E1E\u0E34\u0E48\u0E21/\u0E08\u0E14\u0E07\u0E32\u0E19" \u0E2B\u0E23\u0E37\u0E2D "\u0E2A\u0E23\u0E49\u0E32\u0E07/\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E0A\u0E48\u0E2D\u0E07\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23" \u0E43\u0E2B\u0E49\u0E1E\u0E34\u0E08\u0E32\u0E23\u0E13\u0E32\u0E40\u0E23\u0E35\u0E22\u0E01\u0E43\u0E0A\u0E49 "Tools" \u0E2B\u0E23\u0E37\u0E2D Functions \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E17\u0E33\u0E01\u0E32\u0E23\u0E08\u0E31\u0E14\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E43\u0E2B\u0E49\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E0A\u0E32\u0E0D\u0E09\u0E25\u0E32\u0E14

\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19\u0E43\u0E19\u0E02\u0E13\u0E30\u0E19\u0E35\u0E49:
- \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E0A\u0E48\u0E2D\u0E07/\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 (Channels) \u0E17\u0E35\u0E48\u0E21\u0E35\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A: ${JSON.stringify(channels.map((c) => ({ id: c.id, name: c.name, platforms: c.platforms || [] })))}
- \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E07\u0E32\u0E19 (Tasks) \u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A\u0E02\u0E13\u0E30\u0E19\u0E35\u0E49: ${JSON.stringify(tasks.map((t) => ({ id: t.id, title: t.title, status: t.status, priority: t.priority })))}

\u0E2B\u0E32\u0E01\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E07\u0E32\u0E19 (\u0E40\u0E0A\u0E48\u0E19 "\u0E08\u0E14\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E49\u0E2B\u0E19\u0E48\u0E2D\u0E22\u0E25\u0E38\u0E22 \u0E16\u0E48\u0E32\u0E22\u0E23\u0E35\u0E27\u0E34\u0E27", "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E07\u0E32\u0E19\u0E40\u0E02\u0E35\u0E22\u0E19\u0E2A\u0E04\u0E23\u0E34\u0E1B\u0E15\u0E4C\u0E44\u0E2D\u0E40\u0E14\u0E35\u0E22\u0E41\u0E1A\u0E23\u0E19\u0E14\u0E4C\u0E2B\u0E23\u0E39") \u0E43\u0E2B\u0E49\u0E2A\u0E48\u0E07\u0E04\u0E33\u0E2A\u0E31\u0E48\u0E07\u0E15\u0E31\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01 'createTask' \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E01\u0E32\u0E23\u0E17\u0E31\u0E19\u0E17\u0E35
\u0E2B\u0E32\u0E01\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E0A\u0E48\u0E2D\u0E07\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E43\u0E2B\u0E21\u0E48 (\u0E40\u0E0A\u0E48\u0E19 "\u0E40\u0E1B\u0E34\u0E14\u0E0A\u0E48\u0E2D\u0E07 YouTube \u0E43\u0E2B\u0E21\u0E48\u0E0A\u0E37\u0E48\u0E2D \u0E08\u0E38\u0E4A\u0E22\u0E08\u0E38\u0E4A\u0E22\u0E1F\u0E35\u0E14", "\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E0A\u0E48\u0E2D\u0E07 TikTok \u0E41\u0E0B\u0E48\u0E1A\u0E40\u0E27\u0E48\u0E2D\u0E23\u0E4C") \u0E43\u0E2B\u0E49\u0E2A\u0E48\u0E07\u0E04\u0E33\u0E2A\u0E31\u0E48\u0E07 'createChannel'

\u0E23\u0E1A\u0E01\u0E27\u0E19\u0E15\u0E2D\u0E1A\u0E01\u0E25\u0E31\u0E1A\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E40\u0E1B\u0E47\u0E19\u0E20\u0E32\u0E29\u0E32\u0E44\u0E17\u0E22\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E20\u0E32\u0E1E \u0E21\u0E35\u0E40\u0E2A\u0E19\u0E48\u0E2B\u0E4C\u0E41\u0E1A\u0E1A\u0E04\u0E23\u0E35\u0E40\u0E2D\u0E17\u0E35\u0E1F \u0E04\u0E38\u0E22\u0E2A\u0E19\u0E38\u0E01 \u0E40\u0E1B\u0E47\u0E19\u0E01\u0E31\u0E19\u0E40\u0E2D\u0E07\u0E41\u0E15\u0E48\u0E40\u0E1B\u0E47\u0E19\u0E21\u0E37\u0E2D\u0E2D\u0E32\u0E0A\u0E35\u0E1E (\u0E43\u0E0A\u0E49 Emojis \u0E15\u0E01\u0E41\u0E15\u0E48\u0E07\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E1E\u0E2D\u0E14\u0E35\u0E07\u0E32\u0E21)
`;
    const createTaskDeclaration = {
      name: "createTask",
      description: "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48\u0E40\u0E02\u0E49\u0E32\u0E23\u0E30\u0E1A\u0E1A KontentOS \u0E44\u0E21\u0E48\u0E27\u0E48\u0E32\u0E08\u0E30\u0E40\u0E1B\u0E47\u0E19\u0E07\u0E32\u0E19\u0E40\u0E02\u0E35\u0E22\u0E19\u0E2A\u0E04\u0E23\u0E34\u0E1B\u0E15\u0E4C \u0E16\u0E48\u0E32\u0E22\u0E04\u0E25\u0E34\u0E1B \u0E2B\u0E23\u0E37\u0E2D\u0E15\u0E31\u0E14\u0E15\u0E48\u0E2D\u0E42\u0E1B\u0E23\u0E14\u0E31\u0E01\u0E0A\u0E31\u0E48\u0E19",
      parameters: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: "\u0E0A\u0E37\u0E48\u0E2D\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E01\u0E23\u0E30\u0E0A\u0E31\u0E1A \u0E0A\u0E31\u0E14\u0E40\u0E08\u0E19 \u0E40\u0E02\u0E49\u0E32\u0E43\u0E08\u0E07\u0E48\u0E32\u0E22\u0E43\u0E19\u0E17\u0E35\u0E21 (\u0E20\u0E32\u0E29\u0E32\u0E44\u0E17\u0E22)"
          },
          description: {
            type: Type.STRING,
            description: "\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E40\u0E19\u0E37\u0E49\u0E2D\u0E2B\u0E32\u0E2B\u0E23\u0E37\u0E2D\u0E2A\u0E34\u0E48\u0E07\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E15\u0E23\u0E35\u0E22\u0E21\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49"
          },
          priority: {
            type: Type.STRING,
            enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
            description: "\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E33\u0E04\u0E31\u0E0D\u0E40\u0E23\u0E48\u0E07\u0E14\u0E48\u0E27\u0E19\u0E02\u0E2D\u0E07\u0E07\u0E32\u0E19 (\u0E16\u0E49\u0E32\u0E44\u0E21\u0E48\u0E23\u0E30\u0E1A\u0E38\u0E43\u0E2B\u0E49\u0E15\u0E31\u0E49\u0E07 MEDIUM)"
          },
          channelId: {
            type: Type.STRING,
            description: "ID \u0E02\u0E2D\u0E07\u0E0A\u0E48\u0E2D\u0E07\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E40\u0E01\u0E35\u0E48\u0E22\u0E27\u0E02\u0E49\u0E2D\u0E07 \u0E04\u0E49\u0E19\u0E2B\u0E32\u0E08\u0E32\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E0A\u0E48\u0E2D\u0E07\u0E17\u0E35\u0E48\u0E21\u0E35\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A\u0E14\u0E49\u0E32\u0E19\u0E1A\u0E19 (\u0E2B\u0E32\u0E01\u0E44\u0E21\u0E48\u0E23\u0E30\u0E1A\u0E38\u0E43\u0E19\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21 \u0E43\u0E2B\u0E49\u0E1E\u0E22\u0E32\u0E22\u0E32\u0E21\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E17\u0E35\u0E48\u0E43\u0E01\u0E25\u0E49\u0E40\u0E04\u0E35\u0E22\u0E07)"
          }
        },
        required: ["title"]
      }
    };
    const createChannelDeclaration = {
      name: "createChannel",
      description: "\u0E17\u0E33\u0E01\u0E32\u0E23\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E0A\u0E48\u0E2D\u0E07\u0E04\u0E2D\u0E19\u0E40\u0E17\u0E19\u0E15\u0E4C\u0E2B\u0E23\u0E37\u0E2D\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E43\u0E2B\u0E21\u0E48\u0E1C\u0E39\u0E01\u0E01\u0E31\u0E1A\u0E41\u0E1E\u0E25\u0E15\u0E1F\u0E2D\u0E23\u0E4C\u0E21\u0E2B\u0E25\u0E31\u0E01\u0E40\u0E02\u0E49\u0E32\u0E23\u0E30\u0E1A\u0E1A",
      parameters: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: "\u0E0A\u0E37\u0E48\u0E2D\u0E0A\u0E48\u0E2D\u0E07/\u0E0A\u0E37\u0E48\u0E2D\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E04\u0E2D\u0E19\u0E40\u0E17\u0E19\u0E15\u0E4C\u0E43\u0E2B\u0E21\u0E48"
          },
          platform: {
            type: Type.STRING,
            enum: ["YOUTUBE", "TIKTOK", "FACEBOOK", "INSTAGRAM", "OTHER"],
            description: "\u0E41\u0E1E\u0E25\u0E15\u0E1F\u0E2D\u0E23\u0E4C\u0E21\u0E2B\u0E25\u0E31\u0E01\u0E02\u0E2D\u0E07\u0E0A\u0E48\u0E2D\u0E07\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E43\u0E2B\u0E21\u0E48"
          },
          description: {
            type: Type.STRING,
            description: "\u0E41\u0E19\u0E27\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2B\u0E23\u0E37\u0E2D\u0E0A\u0E48\u0E2D\u0E07\u0E19\u0E35\u0E49\u0E17\u0E33\u0E40\u0E01\u0E35\u0E48\u0E22\u0E27\u0E01\u0E31\u0E1A\u0E2D\u0E30\u0E44\u0E23\u0E2A\u0E31\u0E49\u0E19\u0E46"
          }
        },
        required: ["name", "platform"]
      }
    };
    const result = await aiInstance.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: [createTaskDeclaration, createChannelDeclaration] }]
      }
    });
    const candidate = result.candidates?.[0];
    const text = candidate?.content?.parts?.find((p) => p.text)?.text || "";
    const functionCalls = candidate?.content?.parts?.filter((p) => p.functionCall);
    res.json({
      text: text || "\u0E23\u0E31\u0E1A\u0E17\u0E23\u0E32\u0E1A\u0E04\u0E23\u0E31\u0E1A\u0E01\u0E23\u0E30\u0E1E\u0E23\u0E34\u0E1A\u0E15\u0E32\u0E40\u0E14\u0E35\u0E22\u0E27! \u0E01\u0E33\u0E25\u0E31\u0E07\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E20\u0E32\u0E23\u0E01\u0E34\u0E08\u0E19\u0E35\u0E49\u0E43\u0E2B\u0E49\u0E2D\u0E22\u0E39\u0E48\u0E19\u0E30\u0E04\u0E23\u0E31\u0E1A...",
      functionCalls: functionCalls ? functionCalls.map((f) => f.functionCall) : []
    });
  } catch (error) {
    console.error("Gemini Chat Assist Error on server:", error);
    res.status(500).json({
      text: "\u26A0\uFE0F \u0E02\u0E2D\u0E2D\u0E20\u0E31\u0E22\u0E04\u0E23\u0E31\u0E1A \u0E23\u0E30\u0E1A\u0E1A\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E2D\u0E31\u0E08\u0E09\u0E23\u0E34\u0E22\u0E30\u0E25\u0E31\u0E14\u0E27\u0E07\u0E08\u0E23\u0E0A\u0E31\u0E48\u0E27\u0E04\u0E23\u0E32\u0E27 \u0E25\u0E2D\u0E07\u0E2A\u0E48\u0E07\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E43\u0E2B\u0E21\u0E48\u0E2D\u0E35\u0E01\u0E17\u0E35\u0E19\u0E30\u0E04\u0E23\u0E31\u0E1A!"
    });
  }
});
var chat_default = router5;

// server/routes/adminApproval.ts
import express6 from "express";

// lib/supabase.ts
import { createClient as createClient3 } from "@supabase/supabase-js";
var getEnv = (key) => {
  let val = "";
  try {
    if (typeof import.meta !== "undefined" && import.meta.env) {
      if (key === "VITE_SUPABASE_URL") val = import.meta.env.VITE_SUPABASE_URL;
      if (key === "VITE_SUPABASE_ANON_KEY") val = import.meta.env.VITE_SUPABASE_ANON_KEY;
    }
  } catch (e) {
  }
  if (val) return val;
  try {
    if (typeof process !== "undefined" && process.env) {
      val = process.env[key] || process.env[key.replace("VITE_", "")];
    }
  } catch (e) {
  }
  return val || "";
};
var supabaseUrl3 = getEnv("VITE_SUPABASE_URL") || "https://ajkycqazreebczqjsfpv.supabase.co";
var supabaseAnonKey3 = getEnv("VITE_SUPABASE_ANON_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqa3ljcWF6cmVlYmN6cWpzZnB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0OTM5MjMsImV4cCI6MjA4NDA2OTkyM30.VscG53hy5tT5_oT297RECiVzaCcCw51AYWQeme_PDRo";
if (!supabaseUrl3 || !supabaseAnonKey3) {
  console.warn("\u26A0\uFE0F Supabase credentials missing. Please check your .env file.");
}
var supabase = createClient3(supabaseUrl3, supabaseAnonKey3);

// constants/attendanceRegistry.ts
var ATTENDANCE_REGISTRY = {
  SICK: {
    id: "SICK",
    label: "\u0E25\u0E32\u0E1B\u0E48\u0E27\u0E22",
    category: "LEAVE",
    colors: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-100", accent: "bg-rose-500" },
    rules: { isTimeSpecific: false, isSingleDay: false, requireAttachment: true },
    tags: {
      pending: "[SICK_LEAVE_PENDING]",
      approved: "[APPROVED SICK_LEAVE]",
      rejected: "[REJECTED SICK_LEAVE]"
    },
    placeholder: "\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E01\u0E32\u0E23\u0E25\u0E32\u0E1B\u0E48\u0E27\u0E22 (\u0E40\u0E0A\u0E48\u0E19 \u0E40\u0E1B\u0E47\u0E19\u0E44\u0E02\u0E49\u0E2B\u0E27\u0E31\u0E14 \u0E15\u0E31\u0E27\u0E23\u0E49\u0E2D\u0E19)..."
  },
  VACATION: {
    id: "VACATION",
    label: "\u0E25\u0E32\u0E1E\u0E31\u0E01\u0E23\u0E49\u0E2D\u0E19",
    category: "LEAVE",
    colors: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100", accent: "bg-emerald-500" },
    rules: { isTimeSpecific: false, isSingleDay: false },
    tags: {
      pending: "[VACATION_LEAVE_PENDING]",
      approved: "[APPROVED VACATION_LEAVE]",
      rejected: "[REJECTED VACATION_LEAVE]"
    },
    placeholder: "\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E01\u0E32\u0E23\u0E25\u0E32\u0E1E\u0E31\u0E01\u0E23\u0E49\u0E2D\u0E19..."
  },
  PERSONAL: {
    id: "PERSONAL",
    label: "\u0E25\u0E32\u0E01\u0E34\u0E08",
    category: "LEAVE",
    colors: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-100", accent: "bg-slate-500" },
    rules: { isTimeSpecific: false, isSingleDay: false },
    tags: {
      pending: "[PERSONAL_LEAVE_PENDING]",
      approved: "[APPROVED PERSONAL_LEAVE]",
      rejected: "[REJECTED PERSONAL_LEAVE]"
    },
    placeholder: "\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E01\u0E32\u0E23\u0E25\u0E32\u0E01\u0E34\u0E08 (\u0E40\u0E0A\u0E48\u0E19 \u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D\u0E17\u0E33\u0E18\u0E38\u0E23\u0E30\u0E23\u0E32\u0E0A\u0E01\u0E32\u0E23)..."
  },
  EMERGENCY: {
    id: "EMERGENCY",
    label: "\u0E25\u0E32\u0E09\u0E38\u0E01\u0E40\u0E09\u0E34\u0E19",
    category: "LEAVE",
    colors: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-100", accent: "bg-rose-500" },
    rules: { isTimeSpecific: false, isSingleDay: true, forceTodayDate: true },
    tags: {
      pending: "[EMERGENCY_LEAVE_PENDING]",
      approved: "[APPROVED EMERGENCY_LEAVE]",
      rejected: "[REJECTED EMERGENCY_LEAVE]"
    },
    placeholder: "\u0E23\u0E30\u0E1A\u0E38\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E40\u0E2B\u0E15\u0E38\u0E09\u0E38\u0E01\u0E40\u0E09\u0E34\u0E19..."
  },
  UNPAID: {
    id: "UNPAID",
    label: "\u0E25\u0E32\u0E01\u0E34\u0E08\u0E44\u0E21\u0E48\u0E23\u0E31\u0E1A\u0E04\u0E48\u0E32\u0E08\u0E49\u0E32\u0E07 (Unpaid Leave)",
    category: "LEAVE",
    colors: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-100", accent: "bg-slate-500" },
    rules: { isTimeSpecific: false, isSingleDay: false },
    tags: {
      pending: "[UNPAID_LEAVE_PENDING]",
      approved: "[APPROVED UNPAID_LEAVE]",
      rejected: "[REJECTED UNPAID_LEAVE]"
    },
    placeholder: "\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E25\u0E32\u0E01\u0E34\u0E08\u0E44\u0E21\u0E48\u0E23\u0E31\u0E1A\u0E04\u0E48\u0E32\u0E08\u0E49\u0E32\u0E07..."
  },
  LATE_ENTRY: {
    id: "LATE_ENTRY",
    label: "\u0E02\u0E2D\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E32\u0E22",
    category: "CORRECTION",
    colors: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-100", accent: "bg-violet-500" },
    rules: { isTimeSpecific: true, isSingleDay: true, isProvisionalAllowed: true, defaultTargetTime: "09:00", forceTodayDate: true },
    tags: {
      provisional: "[PROVISIONAL_LATE_ENTRY]",
      pending: "[LATE_ENTRY_PENDING]",
      approved: "[APPROVED LATE_ENTRY]",
      rejected: "[REJECTED LATE_ENTRY]"
    },
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E23\u0E16\u0E15\u0E34\u0E14\u0E2B\u0E19\u0E31\u0E01\u0E21\u0E32\u0E01\u0E17\u0E35\u0E48\u0E41\u0E22\u0E01...",
    approvalBehavior: {
      correctionTarget: "CHECKIN_ONLY",
      verifyLateness: true,
      updateProfileOnline: true,
      refundHpOnAbsent: true,
      refundHpOnCorrection: true,
      refundDescriptionAbsent: "\u0E08\u0E32\u0E01\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E02\u0E32\u0E14\u0E07\u0E32\u0E19\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48",
      refundDescriptionPenalized: "\u0E08\u0E32\u0E01\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E40\u0E27\u0E25\u0E32\u0E2D\u0E2D\u0E01\u0E07\u0E32\u0E19\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48"
    }
  },
  OVERTIME: {
    id: "OVERTIME",
    label: "\u0E41\u0E08\u0E49\u0E07\u0E17\u0E33\u0E07\u0E32\u0E19\u0E25\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32 (OT)",
    category: "SPECIAL",
    colors: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-100", accent: "bg-indigo-500" },
    rules: { isTimeSpecific: true, isSingleDay: true, defaultTargetTime: "18:30", defaultEndTime: "20:30" },
    tags: {
      pending: "[OVERTIME_PENDING]",
      approved: "[APPROVED OVERTIME]",
      rejected: "[REJECTED OVERTIME]"
    },
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E40\u0E23\u0E48\u0E07\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 Project A..."
  },
  FORGOT_CHECKIN: {
    id: "FORGOT_CHECKIN",
    label: "\u0E25\u0E37\u0E21\u0E40\u0E0A\u0E47\u0E04\u0E2D\u0E34\u0E19 (\u0E25\u0E37\u0E21\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E40\u0E02\u0E49\u0E32\u0E07\u0E32\u0E19)",
    category: "CORRECTION",
    colors: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100", accent: "bg-amber-500" },
    rules: { isTimeSpecific: true, isSingleDay: true, isProvisionalAllowed: true, defaultTargetTime: "09:00" },
    tags: {
      provisional: "[PROVISIONAL_FORGOT_CHECKIN]",
      pending: "[FORGOT_CHECKIN_PENDING]",
      approved: "[APPROVED FORGOT_CHECKIN]",
      rejected: "[REJECTED FORGOT_CHECKIN]"
    },
    placeholder: "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E23\u0E30\u0E1A\u0E38\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E17\u0E33\u0E43\u0E19\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32\u0E19\u0E31\u0E49\u0E19\u0E41\u0E25\u0E30\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E22\u0E49\u0E2D\u0E19\u0E2B\u0E25\u0E31\u0E07\u0E42\u0E14\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14 \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E43\u0E2B\u0E49\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E44\u0E14\u0E49...",
    approvalBehavior: {
      correctionTarget: "CHECKIN_ONLY",
      verifyLateness: true,
      updateProfileOnline: true,
      refundHpOnAbsent: true,
      refundHpOnCorrection: true,
      refundDescriptionAbsent: "\u0E08\u0E32\u0E01\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E02\u0E32\u0E14\u0E07\u0E32\u0E19\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48",
      refundDescriptionPenalized: "\u0E08\u0E32\u0E01\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E40\u0E27\u0E25\u0E32\u0E2D\u0E2D\u0E01\u0E07\u0E32\u0E19\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48"
    }
  },
  FORGOT_CHECKOUT: {
    id: "FORGOT_CHECKOUT",
    label: "\u0E25\u0E37\u0E21\u0E40\u0E0A\u0E47\u0E04\u0E40\u0E2D\u0E32\u0E17\u0E4C (\u0E25\u0E37\u0E21\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E2D\u0E2D\u0E01\u0E07\u0E32\u0E19)",
    category: "CORRECTION",
    colors: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100", accent: "bg-amber-500" },
    rules: { isTimeSpecific: true, isSingleDay: true, isProvisionalAllowed: true, defaultTargetTime: "18:00" },
    tags: {
      provisional: "[PROVISIONAL_CHECKOUT]",
      pending: "[FORGOT_CHECKOUT_PENDING]",
      approved: "[APPROVED FORGOT_CHECKOUT]",
      rejected: "[REJECTED FORGOT_CHECKOUT]"
    },
    placeholder: "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E23\u0E30\u0E1A\u0E38\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E17\u0E33\u0E43\u0E19\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32\u0E19\u0E31\u0E49\u0E19\u0E41\u0E25\u0E30\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E22\u0E49\u0E2D\u0E19\u0E2B\u0E25\u0E31\u0E07\u0E42\u0E14\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14 \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E43\u0E2B\u0E49\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E44\u0E14\u0E49...",
    approvalBehavior: {
      correctionTarget: "CHECKOUT_ONLY",
      verifyLateness: false,
      updateProfileOnline: true,
      refundHpOnAbsent: true,
      refundHpOnCorrection: true,
      refundDescriptionAbsent: "\u0E08\u0E32\u0E01\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E40\u0E27\u0E25\u0E32\u0E2D\u0E2D\u0E01\u0E07\u0E32\u0E19\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48",
      refundDescriptionPenalized: "\u0E08\u0E32\u0E01\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E40\u0E27\u0E25\u0E32\u0E2D\u0E2D\u0E01\u0E07\u0E32\u0E19\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48"
    }
  },
  FORGOT_BOTH: {
    id: "FORGOT_BOTH",
    label: "\u0E25\u0E37\u0E21\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E27\u0E25\u0E32\u0E17\u0E31\u0E49\u0E07\u0E40\u0E02\u0E49\u0E32\u0E41\u0E25\u0E30\u0E2D\u0E2D\u0E01",
    category: "CORRECTION",
    colors: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100", accent: "bg-amber-500" },
    rules: { isTimeSpecific: true, isSingleDay: true, defaultTargetTime: "09:00", defaultEndTime: "18:00" },
    tags: {
      pending: "[FORGOT_BOTH_PENDING]",
      approved: "[APPROVED FORGOT_BOTH]",
      rejected: "[REJECTED FORGOT_BOTH]"
    },
    placeholder: "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E23\u0E30\u0E1A\u0E38\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E17\u0E33\u0E43\u0E19\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32\u0E19\u0E31\u0E49\u0E19\u0E41\u0E25\u0E30\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E22\u0E49\u0E2D\u0E19\u0E2B\u0E25\u0E31\u0E07\u0E42\u0E14\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14 \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E43\u0E2B\u0E49\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E44\u0E14\u0E49...",
    approvalBehavior: {
      correctionTarget: "BOTH",
      verifyLateness: false,
      updateProfileOnline: false,
      refundHpOnAbsent: true,
      refundHpOnCorrection: true,
      refundDescriptionAbsent: "\u0E08\u0E32\u0E01\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E02\u0E32\u0E14\u0E07\u0E32\u0E19\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48",
      refundDescriptionPenalized: "\u0E08\u0E32\u0E01\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E40\u0E27\u0E25\u0E32\u0E2D\u0E2D\u0E01\u0E07\u0E32\u0E19\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48"
    }
  },
  WFH: {
    id: "WFH",
    label: "\u0E02\u0E2D\u0E17\u0E33\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E1A\u0E49\u0E32\u0E19 (WFH)",
    category: "SPECIAL",
    colors: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-100", accent: "bg-sky-500" },
    rules: { isTimeSpecific: false, isSingleDay: false, isProvisionalAllowed: true },
    tags: {
      provisional: "[PROVISIONAL_WFH]",
      pending: "[WFH_PENDING]",
      approved: "[APPROVED WFH]",
      rejected: "[REJECTED WFH]"
    },
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E40\u0E04\u0E25\u0E35\u0E22\u0E23\u0E4C\u0E07\u0E32\u0E19\u0E15\u0E31\u0E14\u0E15\u0E48\u0E2D\u0E17\u0E35\u0E48\u0E1A\u0E49\u0E32\u0E19...",
    reasonLabel: "\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E08\u0E30\u0E17\u0E33 (Task)"
  },
  ONSITE: {
    id: "ONSITE",
    label: "\u0E17\u0E33\u0E07\u0E32\u0E19\u0E19\u0E2D\u0E01\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48 (On Site)",
    category: "SPECIAL",
    colors: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-100", accent: "bg-orange-500" },
    rules: { isTimeSpecific: false, isSingleDay: false, isProvisionalAllowed: true },
    tags: {
      provisional: "[PROVISIONAL_ONSITE]",
      pending: "[ONSITE_PENDING]",
      approved: "[APPROVED ONSITE]",
      rejected: "[REJECTED ONSITE]"
    },
    placeholder: "\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E01\u0E32\u0E23\u0E17\u0E33\u0E07\u0E32\u0E19\u0E19\u0E2D\u0E01\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48...",
    reasonLabel: "\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E08\u0E30\u0E17\u0E33 (Task)"
  },
  OUT_OF_RANGE_CHECKOUT: {
    id: "OUT_OF_RANGE_CHECKOUT",
    label: "\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E19\u0E2D\u0E01\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48 (Out of Range)",
    category: "CORRECTION",
    colors: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-100", accent: "bg-orange-500" },
    rules: { isTimeSpecific: true, isSingleDay: true, isProvisionalAllowed: true, requireAttachment: true, defaultTargetTime: "18:00" },
    tags: {
      provisional: "[PROVISIONAL_CHECKOUT]",
      pending: "[OUT_OF_RANGE_CHECKOUT_PENDING]",
      approved: "[APPROVED OUT_OF_RANGE_CHECKOUT]",
      rejected: "[REJECTED OUT_OF_RANGE_CHECKOUT]"
    },
    placeholder: "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E23\u0E30\u0E1A\u0E38\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E08\u0E35\u0E1E\u0E35\u0E40\u0E2D\u0E2A\u0E17\u0E35\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07 \u0E41\u0E25\u0E30\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E42\u0E14\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E27\u0E48\u0E32\u0E17\u0E33\u0E44\u0E21\u0E16\u0E36\u0E07\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E43\u0E19\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E17\u0E35\u0E48\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E44\u0E14\u0E49\u0E43\u0E19\u0E40\u0E27\u0E25\u0E32\u0E19\u0E31\u0E49\u0E19 \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E23\u0E27\u0E14\u0E40\u0E23\u0E47\u0E27\u0E43\u0E19\u0E01\u0E32\u0E23\u0E1E\u0E34\u0E08\u0E32\u0E23\u0E13\u0E32\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34...",
    approvalBehavior: {
      correctionTarget: "CHECKOUT_ONLY",
      verifyLateness: false,
      updateProfileOnline: false,
      refundHpOnAbsent: true,
      refundHpOnCorrection: true,
      refundDescriptionAbsent: "\u0E08\u0E32\u0E01\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E40\u0E27\u0E25\u0E32\u0E2D\u0E2D\u0E01\u0E19\u0E2D\u0E01\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48",
      refundDescriptionPenalized: "\u0E08\u0E32\u0E01\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E40\u0E27\u0E25\u0E32\u0E2D\u0E2D\u0E01\u0E19\u0E2D\u0E01\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48"
    }
  },
  GPS_SPOOF_APPEAL: {
    id: "GPS_SPOOF_APPEAL",
    label: "\u0E2D\u0E38\u0E17\u0E18\u0E23\u0E13\u0E4C\u0E1E\u0E34\u0E01\u0E31\u0E14 GPS \u0E1C\u0E34\u0E14\u0E1B\u0E01\u0E15\u0E34",
    category: "SPECIAL",
    colors: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-100", accent: "bg-rose-500" },
    rules: { isTimeSpecific: false, isSingleDay: true, isProvisionalAllowed: true, requireAttachment: true },
    tags: {
      provisional: "[PROVISIONAL_GPS_SPOOF_APPEAL]",
      pending: "[GPS_SPOOF_APPEAL_PENDING]",
      approved: "[APPROVED GPS_SPOOF_APPEAL]",
      rejected: "[REJECTED GPS_SPOOF_APPEAL]"
    },
    placeholder: "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E23\u0E30\u0E1A\u0E38\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E02\u0E49\u0E2D\u0E40\u0E17\u0E47\u0E08\u0E08\u0E23\u0E34\u0E07\u0E41\u0E25\u0E30\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E17\u0E35\u0E48\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E1C\u0E34\u0E14\u0E1B\u0E01\u0E15\u0E34 \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E43\u0E2B\u0E49\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E22\u0E49\u0E2D\u0E19\u0E2B\u0E25\u0E31\u0E07..."
  }
};
var getRegistryItem = (type) => {
  return ATTENDANCE_REGISTRY[type];
};

// services/adminApprovalService.ts
import { format as format4 } from "date-fns";

// utils/otCalculator.ts
import { format, isValid } from "date-fns";
var calculateEstimatedPayout = (baseSalary, hours, multiplier) => {
  if (!baseSalary || baseSalary <= 0 || !hours || hours <= 0) return 0;
  const dailyWage = baseSalary / 30;
  const hourlyRate = dailyWage / 8;
  return Number((hourlyRate * multiplier * hours).toFixed(2));
};
var alignOtHoursWithClockOut = (dateStr, startTime, endTime, requestedHours, actualCheckOutTime) => {
  if (!actualCheckOutTime) {
    return {
      finalHours: 0,
      message: " (\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E40\u0E27\u0E25\u0E32\u0E2A\u0E41\u0E01\u0E19\u0E40\u0E0A\u0E47\u0E04\u0E40\u0E2D\u0E32\u0E17\u0E4C\u0E08\u0E23\u0E34\u0E07\u0E02\u0E2D\u0E07\u0E27\u0E31\u0E19\u0E19\u0E31\u0E49\u0E19)"
    };
  }
  const checkOutDate = new Date(actualCheckOutTime);
  const reqStart = /* @__PURE__ */ new Date(`${dateStr}T${startTime}`);
  const reqEnd = /* @__PURE__ */ new Date(`${dateStr}T${endTime}`);
  if (!isValid(checkOutDate) || !isValid(reqStart) || !isValid(reqEnd)) {
    return {
      finalHours: requestedHours,
      message: " (\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E27\u0E31\u0E19\u0E40\u0E27\u0E25\u0E32\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07 \u0E43\u0E0A\u0E49\u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07\u0E15\u0E32\u0E21\u0E17\u0E35\u0E48\u0E02\u0E2D)"
    };
  }
  if (checkOutDate < reqStart) {
    return {
      finalHours: 0,
      message: " (\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19\u0E40\u0E0A\u0E47\u0E04\u0E40\u0E2D\u0E32\u0E17\u0E4C\u0E2D\u0E2D\u0E01\u0E01\u0E48\u0E2D\u0E19\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32\u0E40\u0E23\u0E34\u0E48\u0E21 OT)"
    };
  } else if (checkOutDate < reqEnd) {
    const diffMs = checkOutDate.getTime() - reqStart.getTime();
    const actualHours = Number((diffMs / (1e3 * 60 * 60)).toFixed(2));
    return {
      finalHours: actualHours,
      message: ` (\u0E01\u0E25\u0E31\u0E1A\u0E01\u0E48\u0E2D\u0E19\u0E40\u0E27\u0E25\u0E32\u0E17\u0E35\u0E48\u0E02\u0E2D! \u0E04\u0E4D\u0E32\u0E19\u0E27\u0E13\u0E08\u0E23\u0E34\u0E07\u0E15\u0E32\u0E21\u0E40\u0E27\u0E25\u0E32\u0E2A\u0E41\u0E01\u0E19\u0E2D\u0E2D\u0E01: ${actualHours} \u0E0A\u0E21.)`
    };
  } else {
    return {
      finalHours: requestedHours,
      message: " (\u0E2A\u0E41\u0E01\u0E19\u0E40\u0E0A\u0E47\u0E04\u0E40\u0E2D\u0E32\u0E17\u0E4C\u0E15\u0E32\u0E21\u0E40\u0E27\u0E25\u0E32\u0E08\u0E23\u0E34\u0E07 \u0E04\u0E23\u0E1A\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E02\u0E2D)"
    };
  }
};

// services/attendanceService.ts
var attendanceService = {
  /**
   * Fetches combined standard leave requests and dedicated OT requests.
   */
  async fetchCombinedRequests(userId, options = {}) {
    let query = supabase.from("leave_requests").select(`
                *,
                profiles:profiles!leave_requests_user_id_fkey (id, full_name, avatar_url, position)
            `).order("created_at", { ascending: false });
    if (!options.all && userId) {
      query = query.eq("user_id", userId);
    }
    if (options.startDate) {
      query = query.gte("start_date", options.startDate);
    }
    if (options.endDate) {
      query = query.lte("start_date", options.endDate);
    }
    const { data: leaveData, error: leaveError } = await query;
    if (leaveError) throw leaveError;
    const leaves = (leaveData || []).filter((r) => r.type !== "OVERTIME").map((r) => ({
      id: r.id,
      userId: r.user_id,
      type: r.type,
      startDate: new Date(r.start_date),
      endDate: new Date(r.end_date),
      reason: r.reason,
      attachmentUrl: r.attachment_url,
      status: r.status,
      approverId: r.approver_id,
      createdAt: new Date(r.created_at),
      rejectionReason: r.rejection_reason,
      user: r.profiles ? {
        id: r.profiles.id,
        name: r.profiles.full_name,
        avatarUrl: r.profiles.avatar_url,
        position: r.profiles.position
      } : void 0
    }));
    let ots = [];
    if (options.all && options.isAdmin) {
      let otQuery = supabase.from("ot_requests").select(`
                    *,
                    profiles:profiles!ot_requests_user_id_fkey (id, full_name, avatar_url, position)
                `).order("created_at", { ascending: false });
      if (options.startDate) {
        otQuery = otQuery.gte("date", options.startDate);
      }
      if (options.endDate) {
        otQuery = otQuery.lte("date", options.endDate);
      }
      const { data: otData, error: otError } = await otQuery;
      if (otError) throw otError;
      if (otData) {
        ots = otData.map((r) => ({
          id: r.id,
          userId: r.user_id,
          type: "OVERTIME",
          startDate: /* @__PURE__ */ new Date(r.date + "T" + r.start_time),
          endDate: /* @__PURE__ */ new Date(r.date + "T" + r.end_time),
          reason: `[OT:${r.duration_hours}hr] ${r.reason}`,
          attachmentUrl: r.attachment_url,
          status: r.status,
          createdAt: new Date(r.created_at),
          rejectionReason: r.rejection_reason,
          isFixed: r.is_fixed,
          is_fixed: r.is_fixed,
          user: r.profiles ? {
            id: r.profiles.id,
            name: r.profiles.full_name,
            avatarUrl: r.profiles.avatar_url,
            position: r.profiles.position
          } : void 0
        }));
      }
    } else if (userId) {
      let otQuery = supabase.from("ot_requests").select("*").eq("user_id", userId).order("created_at", { ascending: false });
      if (options.startDate) {
        otQuery = otQuery.gte("date", options.startDate);
      }
      if (options.endDate) {
        otQuery = otQuery.lte("date", options.endDate);
      }
      const { data: otData, error: otError } = await otQuery;
      if (otError) throw otError;
      if (otData) {
        ots = otData.map((r) => ({
          id: r.id,
          userId: r.user_id,
          type: "OVERTIME",
          startDate: /* @__PURE__ */ new Date(r.date + "T" + r.start_time),
          endDate: /* @__PURE__ */ new Date(r.date + "T" + r.end_time),
          reason: `[OT:${r.duration_hours}hr] ${r.reason}`,
          attachmentUrl: r.attachment_url,
          status: r.status,
          createdAt: new Date(r.created_at),
          rejectionReason: r.rejection_reason,
          isFixed: r.is_fixed,
          is_fixed: r.is_fixed,
          user: void 0
          // Will be matched with current user at hooks layer if needed
        }));
      }
    }
    const combined = [...leaves, ...ots];
    combined.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return combined;
  },
  /**
   * Inserts a new leave request.
   */
  async insertLeaveRequest(payload) {
    const { data, error } = await supabase.from("leave_requests").insert(payload).select().single();
    if (error) throw error;
    return data;
  },
  /**
   * Inserts a new OT request.
   */
  async insertOtRequest(payload) {
    const { data, error } = await supabase.from("ot_requests").insert(payload).select().single();
    if (error) throw error;
    return data;
  },
  /**
   * Updates an OT request status (APPROVED / REJECTED) and associated variables.
   */
  async updateOtRequestStatus(id, status, updateFields) {
    const { data, error } = await supabase.from("ot_requests").update({
      status,
      ...updateFields,
      // Map camelCase if needed, but db expects snake_case:
      duration_hours: updateFields.duration_hours,
      computed_payout: updateFields.computed_payout,
      approved_by: updateFields.approved_by,
      approved_at: updateFields.approved_at,
      rejection_reason: updateFields.rejection_reason,
      start_time: updateFields.start_time,
      end_time: updateFields.end_time
    }).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  /**
   * Updates a standard leave request status (APPROVED / REJECTED).
   */
  async updateLeaveRequestStatus(id, status, updateFields) {
    const { data, error } = await supabase.from("leave_requests").update({
      status,
      approver_id: updateFields.approver_id,
      rejection_reason: updateFields.rejection_reason
    }).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  /**
   * Fetches standard leave history for a specific user.
   */
  async getUserLeaveHistory(userId) {
    const { data, error } = await supabase.from("leave_requests").select("*").eq("user_id", userId).order("start_date", { ascending: false });
    if (error) throw error;
    return (data || []).map((r) => ({
      id: r.id,
      userId: r.user_id,
      type: r.type,
      startDate: new Date(r.start_date),
      endDate: new Date(r.end_date),
      reason: r.reason,
      attachmentUrl: r.attachment_url,
      status: r.status,
      approverId: r.approver_id,
      createdAt: new Date(r.created_at),
      rejectionReason: r.rejection_reason
    }));
  }
};

// utils/adminApprovalHelpers.ts
import { eachDayOfInterval, isValid as isValid2 } from "date-fns";

// utils/judgeUtils.ts
import { format as format2, addDays as addDays2, isBefore as isBefore2, startOfDay } from "date-fns";

// lib/attendanceUtils.ts
import { differenceInMinutes, addMinutes, isBefore as isBefore3, setHours, setMinutes } from "date-fns";
var mergeAttendanceNotes = (existing, incoming) => {
  const oldNote = (existing || "").trim();
  const newNote = (incoming || "").trim();
  if (!oldNote) return newNote;
  if (!newNote) return oldNote;
  if (oldNote.includes(newNote)) return oldNote;
  if (newNote.includes(oldNote)) return newNote;
  return `${oldNote} | ${newNote}`.trim();
};
var calculateCheckOutStatus = (checkInTime, currentTime, minHours = 9) => {
  const durationMinutes = differenceInMinutes(currentTime, checkInTime);
  const hoursWorked = durationMinutes / 60;
  const requiredMinutes = minHours * 60;
  const requiredEndTime = addMinutes(checkInTime, requiredMinutes);
  const isDurationMet = !isBefore3(currentTime, requiredEndTime);
  const missingMinutes = isDurationMet ? 0 : differenceInMinutes(requiredEndTime, currentTime);
  const status = isDurationMet ? "COMPLETED" : "EARLY_LEAVE";
  return {
    status,
    isDurationMet,
    missingMinutes,
    hoursWorked,
    requiredEndTime
  };
};
var checkIsLate = (checkInTime, startTimeStr, bufferMinutes = 0) => {
  if (!checkInTime) return false;
  try {
    const checkIn = typeof checkInTime === "string" ? new Date(checkInTime) : checkInTime;
    const [targetHour, targetMinute] = startTimeStr.split(":").map(Number);
    const targetTime = setMinutes(setHours(checkIn, targetHour), targetMinute + bufferMinutes);
    return isBefore3(targetTime, checkIn);
  } catch (e) {
    console.error("Error parsing start time", e);
    return false;
  }
};
var getLateMinutes = (checkInTime, startTimeStr, bufferMinutes = 0) => {
  if (!checkInTime) return 0;
  try {
    const checkIn = typeof checkInTime === "string" ? new Date(checkInTime) : checkInTime;
    const [targetHour, targetMinute] = startTimeStr.split(":").map(Number);
    const officialStartTime = setMinutes(setHours(checkIn, targetHour), targetMinute);
    const lateLimitTime = setMinutes(setHours(checkIn, targetHour), targetMinute + bufferMinutes);
    if (isBefore3(lateLimitTime, checkIn)) {
      return Math.max(0, differenceInMinutes(checkIn, officialStartTime));
    }
    return 0;
  } catch (e) {
    return 0;
  }
};
var resolveAttendanceLogStatus = (checkInTime, checkOutTime, note, currentStatus) => {
  const noteText = note || "";
  if (currentStatus === "LEAVE") return "LEAVE";
  if (currentStatus === "ABSENT" && !checkInTime && !checkOutTime) return "ABSENT";
  const hasRejectedCheckIn = noteText.includes("[REJECTED FORGOT_CHECKIN]");
  const hasRejectedCheckOut = noteText.includes("[REJECTED OUT_OF_RANGE_CHECKOUT]") || noteText.includes("[REJECTED FORGOT_CHECKOUT]");
  const isCheckInApproved = noteText.includes("[APPROVED FORGOT_CHECKIN]") || noteText.includes("[APPROVED LATE_ENTRY]") || noteText.includes("[APPROVED FORGOT_BOTH]");
  const isCheckOutApproved = noteText.includes("[APPROVED OUT_OF_RANGE_CHECKOUT]") || noteText.includes("[APPROVED FORGOT_CHECKOUT]") || noteText.includes("[APPROVED FORGOT_BOTH]");
  const isCheckInResolved = !!checkInTime && (!hasRejectedCheckIn || isCheckInApproved);
  const isCheckOutResolved = !!checkOutTime && (!hasRejectedCheckOut || isCheckOutApproved);
  if (hasRejectedCheckIn && !isCheckInResolved || hasRejectedCheckOut && !isCheckOutResolved) {
    return "ACTION_REQUIRED";
  }
  const hasProvisionalCheckIn = noteText.includes("[PROVISIONAL_FORGOT_CHECKIN]") && !noteText.includes("[APPROVED FORGOT_CHECKIN]") && !noteText.includes("[REJECTED FORGOT_CHECKIN]") || noteText.includes("[PROVISIONAL_LATE_ENTRY]") && !noteText.includes("[APPROVED LATE_ENTRY]") && !noteText.includes("[REJECTED LATE_ENTRY]") || noteText.includes("[PROVISIONAL_WFH]") && !noteText.includes("[APPROVED WFH]") && !noteText.includes("[REJECTED_WFH]") || noteText.includes("[PROVISIONAL_ONSITE]") && !noteText.includes("[APPROVED ONSITE]") && !noteText.includes("[REJECTED_ONSITE]");
  const hasProvisionalCheckOut = noteText.includes("[PROVISIONAL_CHECKOUT]") && !noteText.includes("[APPROVED FORGOT_CHECKOUT]") && !noteText.includes("[APPROVED OUT_OF_RANGE_CHECKOUT]") && !noteText.includes("[REJECTED FORGOT_CHECKOUT]") && !noteText.includes("[REJECTED OUT_OF_RANGE_CHECKOUT]");
  const isPendingVerify = currentStatus === "PENDING_VERIFY" || hasProvisionalCheckIn || hasProvisionalCheckOut;
  if (isPendingVerify) {
    return "PENDING_VERIFY";
  }
  if (checkInTime && checkOutTime) {
    if (noteText.includes("[APPROVED LATE_ENTRY]") || noteText.includes("[LATE]")) {
      return "LATE";
    }
    return "COMPLETED";
  }
  if (checkInTime) {
    return "WORKING";
  }
  return currentStatus || "ACTION_REQUIRED";
};

// utils/adminApprovalHelpers.ts
function buildOtAuditLog(origStart, origEnd, origHours, newStart, newEnd, finalHours, adminNote, isTimeModified) {
  let auditLogText = "";
  if (isTimeModified) {
    const origStartStr = origStart.substring(0, 5);
    const origEndStr = origEnd.substring(0, 5);
    const newStartStr = newStart.substring(0, 5);
    const newEndStr = newEnd.substring(0, 5);
    auditLogText = `\u2699\uFE0F [\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19\u0E41\u0E01\u0E49\u0E44\u0E02\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E41\u0E25\u0E30\u0E40\u0E27\u0E25\u0E32\u0E1B\u0E0F\u0E34\u0E1A\u0E31\u0E15\u0E34\u0E07\u0E32\u0E19]
\u2022 \u0E40\u0E27\u0E25\u0E32\u0E40\u0E14\u0E34\u0E21: ${origStartStr} - ${origEndStr} \u0E19. (${origHours.toFixed(2)} \u0E0A\u0E21.)
\u2022 \u0E40\u0E27\u0E25\u0E32\u0E43\u0E2B\u0E21\u0E48: ${newStartStr} - ${newEndStr} \u0E19. (${finalHours.toFixed(2)} \u0E0A\u0E21.)`;
  }
  let finalDbNote = "";
  if (auditLogText) {
    finalDbNote = auditLogText;
    if (adminNote) {
      finalDbNote += `
----------------------------------
\u{1F4DD} \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E08\u0E32\u0E01\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19: ${adminNote}`;
    }
  } else if (adminNote) {
    finalDbNote = adminNote;
  }
  return { auditLogText, finalDbNote };
}
function buildAttendanceCorrectionPayload({
  userId,
  date,
  type,
  checkInTime,
  checkOutTime,
  reason = "",
  originalStatusNote = "",
  existingNote = "",
  leaveType = "",
  isLate = false,
  existingWorkType
}) {
  let resolvedWorkType = "OFFICE";
  const noteStr = existingNote || "";
  if (existingWorkType === "WFH" || existingWorkType === "ONSITE") {
    resolvedWorkType = existingWorkType;
  } else if (noteStr.includes("[PROVISIONAL_WFH]")) {
    resolvedWorkType = "WFH";
  } else if (noteStr.includes("[PROVISIONAL_ONSITE]")) {
    resolvedWorkType = "ONSITE";
  }
  if (type === "FORGOT_BOTH") {
    const finalNote = mergeAttendanceNotes(existingNote, `${originalStatusNote}[APPROVED FORGOT_BOTH] ${reason}`);
    const resolvedStatus = resolveAttendanceLogStatus(checkInTime, checkOutTime, finalNote);
    return {
      user_id: userId,
      date,
      check_in_time: checkInTime,
      check_out_time: checkOutTime,
      work_type: resolvedWorkType,
      status: resolvedStatus,
      note: finalNote
    };
  } else if (type === "FORGOT_CHECKIN" || type === "LATE_ENTRY") {
    const finalNote = mergeAttendanceNotes(existingNote, `${originalStatusNote}[APPROVED ${type}] ${reason}`);
    const payload = {
      user_id: userId,
      date,
      check_in_time: checkInTime,
      work_type: resolvedWorkType,
      note: finalNote
    };
    if (checkOutTime) {
      payload.check_out_time = checkOutTime;
      const resolvedStatus = resolveAttendanceLogStatus(checkInTime, checkOutTime, finalNote);
      payload.status = resolvedStatus === "COMPLETED" && (type === "LATE_ENTRY" || isLate) ? "LATE" : resolvedStatus;
    } else {
      payload.status = "WORKING";
    }
    return payload;
  } else {
    return {
      user_id: userId,
      date,
      work_type: "LEAVE",
      status: "LEAVE",
      note: mergeAttendanceNotes(existingNote, `[APPROVED LEAVE: ${leaveType}] ${reason}`)
    };
  }
}

// services/admin-approval/approvalFlows.ts
import { format as format3, eachDayOfInterval as eachDayOfInterval2 } from "date-fns";

// services/admin-approval/communicationHelpers.ts
async function sendApprovalNotification(userId, title, message, relatedId, metadata) {
  return supabase.from("notifications").insert({
    user_id: userId,
    type: "INFO",
    title,
    message,
    is_read: false,
    link_path: "ATTENDANCE",
    related_id: relatedId || null,
    metadata: metadata || null
  });
}
async function sendRejectionNotification(userId, title, message, relatedId, metadata) {
  return supabase.from("notifications").insert({
    user_id: userId,
    type: "INFO",
    title,
    message,
    is_read: false,
    link_path: "ATTENDANCE",
    related_id: relatedId || null,
    metadata: metadata || null
  });
}
async function publishToTeamChannel(content) {
  return supabase.from("team_messages").insert({
    content,
    is_bot: true,
    message_type: "TEXT",
    user_id: null
  });
}

// services/admin-approval/approvalFlows.ts
async function approveSpecialWorkRequest({
  request,
  customOtHours,
  customStartTime,
  customEndTime,
  adminNote,
  masterOptions = [],
  processAction
}) {
  let finalDbNote = adminNote || "";
  let isTimeModified = false;
  let updatedReason = request.reason;
  if (request.type === "OVERTIME") {
    isTimeModified = customStartTime !== void 0 || customEndTime !== void 0 || customOtHours !== void 0;
    if (isTimeModified) {
      let cleanReasonText = request.reason || "";
      const otRangeMatch = cleanReasonText.match(/\[OT:(\d{2}:\d{2}-\d{2}:\d{2})\]/);
      const originalTimeRange = otRangeMatch ? otRangeMatch[1] : "18:30-20:30";
      const [origStart, origEnd] = originalTimeRange.split("-");
      const otHoursMatch = cleanReasonText.match(/\(([\d\.]+)hr\)/) || cleanReasonText.match(/\[OT:([\d\.]+)hr\]/);
      const origHours = otHoursMatch ? parseFloat(otHoursMatch[1]) : 2;
      cleanReasonText = cleanReasonText.replace(/\[OT:\d{2}:\d{2}-\d{2}:\d{2}\]\s*\([\d\.]+hr\)\s*/g, "").replace(/\[OT:[\d\.]+hr\]\s*/g, "").replace(/\[OT_MINUTES:\d+\]/g, "").trim();
      const newStart = customStartTime || origStart;
      const newEnd = customEndTime || origEnd;
      const newHours = customOtHours !== void 0 ? customOtHours : origHours;
      updatedReason = `[OT:${newStart}-${newEnd}] (${newHours}hr) ${cleanReasonText}`;
      const { finalDbNote: computedDbNote } = buildOtAuditLog(
        origStart,
        origEnd,
        origHours,
        newStart,
        newEnd,
        newHours,
        adminNote,
        true
      );
      finalDbNote = computedDbNote;
    }
  }
  if (request.type === "OVERTIME" && isTimeModified) {
    await supabase.from("leave_requests").update({ reason: updatedReason }).eq("id", request.id);
  }
  if (request.type === "WFH" || request.type === "ONSITE") {
    const shiftDateStr = format3(request.startDate, "yyyy-MM-dd");
    const { data: freshLog } = await supabase.from("attendance_logs").select("id, note, check_out_time, check_in_time").eq("user_id", request.userId).eq("date", shiftDateStr).maybeSingle();
    if (freshLog) {
      let newNote = freshLog.note || "";
      const registryItem = getRegistryItem(request.type);
      if (registryItem) {
        const tagsToClean = [registryItem.tags.pending, registryItem.tags.provisional, "[APPEAL_PENDING]"].filter(Boolean);
        tagsToClean.forEach((tag) => {
          const escaped = tag.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
          const regex = new RegExp(escaped, "g");
          newNote = newNote.replace(regex, "");
        });
        newNote = newNote.replace(/\s+/g, " ").trim();
      }
      const targetStatus = freshLog.check_out_time ? "COMPLETED" : "WORKING";
      await supabase.from("attendance_logs").update({
        note: newNote,
        status: targetStatus
      }).eq("id", freshLog.id);
      if (freshLog.check_in_time) {
        const checkInDate = new Date(freshLog.check_in_time);
        const configData = masterOptions.filter((o) => o.type === "WORK_CONFIG");
        const startTimeStr = configData?.find((c) => c.key === "START_TIME")?.label || "10:00";
        const buffer = parseInt(configData?.find((c) => c.key === "LATE_BUFFER")?.label || "15");
        const isLate = checkIsLate(checkInDate, startTimeStr, buffer);
        const lateMinutes = isLate ? getLateMinutes(checkInDate, startTimeStr, buffer) : 0;
        await processAction(request.userId, "ATTENDANCE_CHECK_IN", {
          status: isLate ? "LATE" : "ON_TIME",
          time: format3(checkInDate, "HH:mm"),
          lateMinutes,
          date: checkInDate
        });
      }
    }
    if (request.type === "WFH") {
      await publishToTeamChannel(`\u{1F3E0} **${request.user?.name}** \u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34 WFH (\u0E2D\u0E22\u0E48\u0E32\u0E25\u0E37\u0E21 Check-in \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E40\u0E23\u0E34\u0E48\u0E21\u0E07\u0E32\u0E19\u0E19\u0E30!)`);
    } else if (request.type === "ONSITE") {
      await publishToTeamChannel(`\u{1F4CD} **${request.user?.name}** \u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E1B\u0E0F\u0E34\u0E1A\u0E31\u0E15\u0E34\u0E07\u0E32\u0E19 Onsite \u0E19\u0E2D\u0E01\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48\u0E41\u0E25\u0E49\u0E27`);
    }
  } else if (request.type === "OVERTIME") {
    const shiftDateStr = format3(request.startDate, "yyyy-MM-dd");
    const { data: freshLog } = await supabase.from("attendance_logs").select("id, note").eq("user_id", request.userId).eq("date", shiftDateStr).maybeSingle();
    if (freshLog) {
      const newNote = (freshLog.note || "").replace("[OT_PENDING:", "[OT_APPROVED:").trim();
      await supabase.from("attendance_logs").update({ note: newNote }).eq("id", freshLog.id);
    }
    let otHours = 0;
    if (customOtHours !== void 0) {
      otHours = customOtHours;
    } else {
      const otMinutesMatch = request.reason ? request.reason.match(/\[OT_MINUTES:(\d+)\]/) : null;
      const otMinutes = otMinutesMatch ? parseInt(otMinutesMatch[1], 10) : 60;
      otHours = parseFloat((otMinutes / 60).toFixed(1));
    }
    await processAction(request.userId, "ATTENDANCE_OVERTIME", {
      hours: otHours,
      id: `OT_REWARD:${request.id}`
    });
  }
  return { finalDbNote, updatedReason, isTimeModified };
}
async function approveAttendanceCorrection({
  request,
  customStartTime,
  masterOptions = [],
  processAction
}) {
  const timeMatch = request.reason.match(/\[TIME:(\d{2}:\d{2})(-\d{2}:\d{2})?\]/);
  const timeStr = customStartTime || (timeMatch ? timeMatch[1] : "00:00");
  const endTimeStr = timeMatch && timeMatch[2] ? timeMatch[2].substring(1) : null;
  const shiftDateStr = format3(request.startDate, "yyyy-MM-dd");
  const { data: freshLog } = await supabase.from("attendance_logs").select("*").eq("user_id", request.userId).eq("date", shiftDateStr).maybeSingle();
  const registryItem = getRegistryItem(request.type);
  const behavior = registryItem?.approvalBehavior;
  let finalReason = request.reason;
  if (behavior?.correctionTarget === "CHECKIN_ONLY" && customStartTime) {
    finalReason = request.reason.replace(/\[TIME:\d{2}:\d{2}\]/g, `[TIME:${customStartTime}]`);
    await supabase.from("leave_requests").update({ reason: finalReason }).eq("id", request.id);
  }
  if (request.type === "LATE_ENTRY" && freshLog) {
    const actualCheckInDateTime = freshLog.check_in_time ? new Date(freshLog.check_in_time) : null;
    const approvedLateDateTime = /* @__PURE__ */ new Date(`${shiftDateStr}T${timeStr}:00`);
    let isActuallyLate = false;
    if (actualCheckInDateTime && actualCheckInDateTime > approvedLateDateTime) {
      isActuallyLate = true;
    }
    let newNote = `${freshLog.note || ""} [APPROVED LATE_ENTRY] ${request.reason}`;
    newNote = newNote.replace("[APPEAL_PENDING]", "");
    if (registryItem?.tags?.provisional) {
      const innerText = registryItem.tags.provisional.replace(/^\[|\]$/g, "");
      const escapedInner = innerText.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      const regex = new RegExp(`\\[${escapedInner}(:.*?)?\\]`, "g");
      newNote = newNote.replace(regex, "");
    }
    newNote = newNote.replace(/\s+/g, " ").trim();
    const targetStatus = freshLog.check_out_time ? isActuallyLate ? "LATE" : "COMPLETED" : "WORKING";
    await supabase.from("attendance_logs").update({ status: targetStatus, note: newNote }).eq("id", freshLog.id);
  } else if (behavior?.correctionTarget === "BOTH") {
    const checkInDateTime = /* @__PURE__ */ new Date(`${shiftDateStr}T${timeStr}:00`);
    const checkOutDateTime = /* @__PURE__ */ new Date(`${shiftDateStr}T${endTimeStr || "18:00"}:00`);
    const originalStatusNote = freshLog?.status === "ABSENT" ? "[ORIGINALLY: ABSENT] " : "";
    const payload = buildAttendanceCorrectionPayload({
      userId: request.userId,
      date: shiftDateStr,
      type: "FORGOT_BOTH",
      checkInTime: checkInDateTime.toISOString(),
      checkOutTime: checkOutDateTime.toISOString(),
      reason: request.reason,
      originalStatusNote,
      existingNote: freshLog?.note,
      existingWorkType: freshLog?.work_type
    });
    await supabase.from("attendance_logs").upsert(payload, { onConflict: "user_id, date" });
  } else if (behavior?.correctionTarget === "CHECKIN_ONLY") {
    const checkInDateTime = /* @__PURE__ */ new Date(`${shiftDateStr}T${timeStr}:00`);
    const originalStatusNote = freshLog?.status === "ABSENT" ? "[ORIGINALLY: ABSENT] " : "";
    let cleanedNote = freshLog?.note || "";
    if (registryItem?.tags?.provisional) {
      const innerText = registryItem.tags.provisional.replace(/^\[|\]$/g, "");
      const escapedInner = innerText.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      const regex = new RegExp(`\\[${escapedInner}(:.*?)?\\]`, "g");
      cleanedNote = cleanedNote.replace(regex, "");
    }
    cleanedNote = cleanedNote.replace(/\s+/g, " ").trim();
    const configData = masterOptions.filter((o) => o.type === "WORK_CONFIG");
    const startTimeStr = configData?.find((c) => c.key === "START_TIME")?.label || "10:00";
    const buffer = parseInt(configData?.find((c) => c.key === "LATE_BUFFER")?.label || "15");
    const isLate = checkIsLate(checkInDateTime, startTimeStr, buffer);
    const payload = buildAttendanceCorrectionPayload({
      userId: request.userId,
      date: shiftDateStr,
      type: request.type,
      checkInTime: checkInDateTime.toISOString(),
      checkOutTime: freshLog?.check_out_time || void 0,
      isLate,
      reason: finalReason,
      originalStatusNote,
      existingNote: cleanedNote,
      existingWorkType: freshLog?.work_type
    });
    await supabase.from("attendance_logs").upsert(payload, { onConflict: "user_id, date" });
  } else if (behavior?.correctionTarget === "CHECKOUT_ONLY") {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const checkOutDateTime = new Date(request.startDate);
    checkOutDateTime.setHours(hours, minutes, 0, 0);
    if (hours < 5) checkOutDateTime.setDate(checkOutDateTime.getDate() + 1);
    const { data: freshLogCheckout } = await supabase.from("attendance_logs").select("id, note, status, check_in_time").eq("user_id", request.userId).eq("date", shiftDateStr).maybeSingle();
    if (freshLogCheckout) {
      let cleanedNoteStr = freshLogCheckout.note || "";
      if (registryItem?.tags?.provisional) {
        const innerText = registryItem.tags.provisional.replace(/^\[|\]$/g, "");
        const escapedInner = innerText.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
        const regex = new RegExp(`\\[${escapedInner}(:.*?)?\\]`, "g");
        cleanedNoteStr = cleanedNoteStr.replace(regex, "");
      }
      cleanedNoteStr = cleanedNoteStr.replace(/\s+/g, " ").trim();
      const approvedTag = registryItem?.tags.approved || "[APPROVED CORRECTION]";
      const finalNote = mergeAttendanceNotes(cleanedNoteStr, `${approvedTag} ${request.reason}`);
      const resolvedStatus = resolveAttendanceLogStatus(
        freshLogCheckout.check_in_time,
        checkOutDateTime.toISOString(),
        finalNote
      );
      await supabase.from("attendance_logs").update({
        check_out_time: checkOutDateTime.toISOString(),
        status: resolvedStatus,
        note: finalNote
      }).eq("id", freshLogCheckout.id);
      await processAction(request.userId, "ATTENDANCE_CHECK_OUT", {
        time: timeStr,
        date: shiftDateStr
      });
      const isCheckoutLateSub = request.reason.includes("[LATE_SUBMISSION]");
      if (!isCheckoutLateSub) {
        const absentDesc = behavior?.refundDescriptionAbsent ? `\u0E04\u0E37\u0E19\u0E04\u0E48\u0E32 HP ${behavior.refundDescriptionAbsent} ${shiftDateStr}` : `\u0E04\u0E37\u0E19\u0E04\u0E48\u0E32 HP \u0E08\u0E32\u0E01\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E40\u0E27\u0E25\u0E32\u0E2D\u0E2D\u0E01\u0E07\u0E32\u0E19\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 ${shiftDateStr}`;
        const penalizedDesc = behavior?.refundDescriptionPenalized ? `\u0E04\u0E37\u0E19\u0E04\u0E48\u0E32 HP ${behavior.refundDescriptionPenalized} ${shiftDateStr}` : `\u0E04\u0E37\u0E19\u0E04\u0E48\u0E32 HP \u0E08\u0E32\u0E01\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E40\u0E27\u0E25\u0E32\u0E2D\u0E2D\u0E01\u0E07\u0E32\u0E19\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 ${shiftDateStr}`;
        if (freshLogCheckout.status === "ABSENT") {
          await processAction(request.userId, "ATTENDANCE_ABSENT_REFUND", {
            originalDescription: absentDesc
          });
        } else if (freshLogCheckout.note?.includes("[SYSTEM] Penalized")) {
          await processAction(request.userId, "ATTENDANCE_CORRECTION_REFUND", {
            originalDescription: penalizedDesc
          });
        }
      }
    } else {
      const defaultStart = new Date(request.startDate);
      defaultStart.setHours(10, 0, 0, 0);
      await supabase.from("attendance_logs").insert({
        user_id: request.userId,
        date: shiftDateStr,
        check_in_time: defaultStart.toISOString(),
        check_out_time: checkOutDateTime.toISOString(),
        work_type: "OFFICE",
        status: "COMPLETED",
        note: `[AUTO-CREATED FOR ${request.type}] ${request.reason}`
      });
    }
  }
  if (behavior?.updateProfileOnline !== false && !freshLog?.check_out_time) {
    await supabase.from("profiles").update({ work_status: "ONLINE" }).eq("id", request.userId);
  }
  if (behavior?.correctionTarget !== "CHECKOUT_ONLY") {
    const isLateSubmission = request.reason.includes("[LATE_SUBMISSION]");
    if (!isLateSubmission) {
      const absentDesc = behavior?.refundDescriptionAbsent ? `\u0E04\u0E37\u0E19\u0E04\u0E48\u0E32 HP ${behavior.refundDescriptionAbsent} ${shiftDateStr}` : `\u0E04\u0E37\u0E19\u0E04\u0E48\u0E32 HP \u0E08\u0E32\u0E01\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E02\u0E32\u0E14\u0E07\u0E32\u0E19\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 ${shiftDateStr}`;
      const penalizedDesc = behavior?.refundDescriptionPenalized ? `\u0E04\u0E37\u0E19\u0E04\u0E48\u0E32 HP ${behavior.refundDescriptionPenalized} ${shiftDateStr}` : `\u0E04\u0E37\u0E19\u0E04\u0E48\u0E32 HP \u0E08\u0E32\u0E01\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E40\u0E27\u0E25\u0E32\u0E2D\u0E2D\u0E01\u0E07\u0E32\u0E19\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 ${shiftDateStr}`;
      if (freshLog?.status === "ABSENT") {
        await processAction(request.userId, "ATTENDANCE_ABSENT_REFUND", {
          originalDescription: absentDesc
        });
      } else if (freshLog?.note?.includes("[SYSTEM] Penalized")) {
        await processAction(request.userId, "ATTENDANCE_CORRECTION_REFUND", {
          originalDescription: penalizedDesc
        });
      }
    }
  }
  if (behavior?.correctionTarget !== "CHECKOUT_ONLY") {
    const configData = masterOptions.filter((o) => o.type === "WORK_CONFIG");
    const startTimeStr = configData?.find((c) => c.key === "START_TIME")?.label || "10:00";
    const buffer = parseInt(configData?.find((c) => c.key === "LATE_BUFFER")?.label || "15");
    const checkInDateTime = /* @__PURE__ */ new Date(`${shiftDateStr}T${timeStr}:00`);
    const isLate = checkIsLate(checkInDateTime, startTimeStr, buffer);
    let lateMinutes = 0;
    let calculatedStatus = "ON_TIME";
    let checkInTimeForAction = timeStr;
    if (request.type === "LATE_ENTRY") {
      const actualCheckInDateTime = freshLog?.check_in_time ? new Date(freshLog.check_in_time) : null;
      const approvedLateDateTime = /* @__PURE__ */ new Date(`${shiftDateStr}T${timeStr}:00`);
      if (actualCheckInDateTime) {
        try {
          const hours = String(actualCheckInDateTime.getHours()).padStart(2, "0");
          const minutes = String(actualCheckInDateTime.getMinutes()).padStart(2, "0");
          checkInTimeForAction = `${hours}:${minutes}`;
        } catch (e) {
          checkInTimeForAction = timeStr;
        }
        if (actualCheckInDateTime > approvedLateDateTime) {
          calculatedStatus = "LATE";
          lateMinutes = Math.max(0, Math.ceil((actualCheckInDateTime.getTime() - approvedLateDateTime.getTime()) / (1e3 * 60)));
        } else {
          calculatedStatus = "ON_TIME";
          lateMinutes = 0;
        }
      } else {
        calculatedStatus = "ON_TIME";
        lateMinutes = 0;
      }
    } else if (behavior?.verifyLateness && isLate) {
      calculatedStatus = "LATE";
      lateMinutes = getLateMinutes(checkInDateTime, startTimeStr, buffer);
    }
    await processAction(request.userId, "ATTENDANCE_CHECK_IN", {
      status: calculatedStatus,
      time: checkInTimeForAction,
      lateMinutes
    });
    if (behavior?.correctionTarget === "BOTH") {
      await processAction(request.userId, "ATTENDANCE_CHECK_OUT", {
        time: endTimeStr || "18:00",
        date: shiftDateStr
      });
    }
  }
}
async function approveOutOfRangeCheckoutRequest({
  request,
  processAction
}) {
  await approveAttendanceCorrection({
    request,
    processAction
  });
}
async function approveStandardLeave({
  request,
  processAction
}) {
  const days = eachDayOfInterval2({ start: request.startDate, end: request.endDate });
  const dateStrings = days.map((d) => format3(d, "yyyy-MM-dd"));
  const { data: existingLogs } = await supabase.from("attendance_logs").select("date, note").eq("user_id", request.userId).in("date", dateStrings);
  const logs = days.map((day) => {
    const dateStr = format3(day, "yyyy-MM-dd");
    const existing = existingLogs?.find((l) => l.date === dateStr);
    return buildAttendanceCorrectionPayload({
      userId: request.userId,
      date: dateStr,
      type: "LEAVE",
      reason: request.reason,
      existingNote: existing?.note,
      leaveType: request.type
    });
  });
  await supabase.from("attendance_logs").upsert(logs, { onConflict: "user_id, date" });
  await processAction(request.userId, "ATTENDANCE_LEAVE", { type: request.type });
}
async function approveGpsSpoofAppealRequest({
  request,
  masterOptions = [],
  processAction
}) {
  const shiftDateStr = format3(request.startDate, "yyyy-MM-dd");
  const { data: freshLog } = await supabase.from("attendance_logs").select("*").eq("user_id", request.userId).eq("date", shiftDateStr).maybeSingle();
  if (freshLog) {
    let cleanedNoteStr = freshLog.note || "";
    const registryItem = getRegistryItem(request.type);
    if (registryItem) {
      const tagsToClean = [registryItem.tags.pending, registryItem.tags.provisional].filter(Boolean);
      tagsToClean.forEach((tag) => {
        const escaped = tag.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
        const regex = new RegExp(escaped, "g");
        cleanedNoteStr = cleanedNoteStr.replace(regex, "");
      });
      cleanedNoteStr = cleanedNoteStr.replace(/\s+/g, " ").trim();
    }
    const finalStatus = freshLog.check_out_time ? "COMPLETED" : "WORKING";
    await supabase.from("attendance_logs").update({
      status: finalStatus,
      note: mergeAttendanceNotes(cleanedNoteStr, `[APPROVED GPS_SPOOF_APPEAL] \u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E22\u0E37\u0E48\u0E19\u0E2D\u0E38\u0E17\u0E18\u0E23\u0E13\u0E4C\u0E1E\u0E34\u0E01\u0E31\u0E14 GPS: ${request.reason}`)
    }).eq("id", freshLog.id);
    if (freshLog.check_in_time) {
      const checkInDate = new Date(freshLog.check_in_time);
      const configData = masterOptions.filter((o) => o.type === "WORK_CONFIG");
      const startTimeStr = configData?.find((c) => c.key === "START_TIME")?.label || "10:00";
      const buffer = parseInt(configData?.find((c) => c.key === "LATE_BUFFER")?.label || "15");
      const isLate = checkIsLate(checkInDate, startTimeStr, buffer);
      const lateMinutes = isLate ? getLateMinutes(checkInDate, startTimeStr, buffer) : 0;
      await processAction(request.userId, "ATTENDANCE_CHECK_IN", {
        status: isLate ? "LATE" : "ON_TIME",
        time: format3(checkInDate, "HH:mm"),
        lateMinutes,
        date: checkInDate
      });
    }
  }
}

// services/admin-approval/rejectionFlows.ts
async function rejectWfhOnsiteRequest({
  req,
  reason,
  rejectionMode,
  customCheckInTime,
  masterOptions,
  processAction
}) {
  const { data: freshLog } = await supabase.from("attendance_logs").select("*").eq("user_id", req.user_id).eq("date", req.start_date).maybeSingle();
  if (freshLog) {
    const mode = rejectionMode || "ABSENT";
    let cleanedNote = freshLog.note || "";
    if (mode !== "ACTION_REQUIRED") {
      cleanedNote = cleanedNote.replace(/\[PROVISIONAL_WFH\]/g, "").replace(/\[PROVISIONAL_ONSITE\]/g, "").replace(/\[PROVISIONAL_CHECKOUT\]/g, "").replace(/\[UNAUTHORIZED_WFH\]/g, "").replace(/\[UNAUTHORIZED_ONSITE\]/g, "").replace(/\s+/g, " ").trim();
    }
    if (mode === "ABSENT") {
      cleanedNote = mergeAttendanceNotes(cleanedNote, `[REJECTED_PROVISIONAL_ABSENT] \u0E1B\u0E0F\u0E34\u0E40\u0E2A\u0E18\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E22\u0E49\u0E2D\u0E19\u0E2B\u0E25\u0E31\u0E07\u0E41\u0E25\u0E30\u0E1B\u0E23\u0E31\u0E1A\u0E40\u0E1B\u0E47\u0E19\u0E02\u0E32\u0E14\u0E07\u0E32\u0E19: ${reason}`);
      await supabase.from("attendance_logs").update({
        status: "ABSENT",
        check_in_time: null,
        check_out_time: null,
        note: cleanedNote
      }).eq("id", freshLog.id);
      await supabase.from("profiles").update({ work_status: "OFFLINE" }).eq("id", req.user_id);
      try {
        await processAction(req.user_id, "ATTENDANCE_ABSENT");
      } catch (gameErr) {
        console.error("Failed to process ATTENDANCE_ABSENT gamification action:", gameErr);
      }
    } else if (mode === "ACTION_REQUIRED") {
      cleanedNote = mergeAttendanceNotes(cleanedNote, `[REJECTED_PROVISIONAL_CORRECTION] \u0E1B\u0E0F\u0E34\u0E40\u0E2A\u0E18\u0E04\u0E33\u0E23\u0E49\u0E2D\u0E07\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E43\u0E2B\u0E49\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19\u0E22\u0E37\u0E48\u0E19\u0E2A\u0E48\u0E07\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E43\u0E2B\u0E21\u0E48: ${reason}`);
      await supabase.from("attendance_logs").update({
        status: "ACTION_REQUIRED",
        note: cleanedNote
      }).eq("id", freshLog.id);
    } else if (mode === "KEEP_WORKING") {
      const configData = masterOptions.filter((o) => o.type === "WORK_CONFIG");
      const startTimeStr = configData?.find((c) => c.key === "START_TIME")?.label || "10:00";
      const buffer = parseInt(configData?.find((c) => c.key === "LATE_BUFFER")?.label || "15");
      let timeStr = "10:00";
      if (customCheckInTime) {
        timeStr = customCheckInTime;
      } else if (freshLog.check_in_time) {
        try {
          const d = new Date(freshLog.check_in_time);
          const hours = String(d.getHours()).padStart(2, "0");
          const minutes = String(d.getMinutes()).padStart(2, "0");
          timeStr = `${hours}:${minutes}`;
        } catch (e) {
          timeStr = "10:00";
        }
      }
      const checkInDateTime = /* @__PURE__ */ new Date(`${req.start_date}T${timeStr}:00`);
      const isLate = checkIsLate(checkInDateTime, startTimeStr, buffer);
      let lateMinutes = 0;
      let calculatedStatus = "ON_TIME";
      if (isLate) {
        calculatedStatus = "LATE";
        lateMinutes = getLateMinutes(checkInDateTime, startTimeStr, buffer);
      }
      try {
        await processAction(req.user_id, "ATTENDANCE_CHECK_IN", {
          status: calculatedStatus,
          time: timeStr,
          lateMinutes
        });
      } catch (gameErr) {
        console.error("Failed to process ATTENDANCE_CHECK_IN gamification action:", gameErr);
      }
      const tag = req.type === "WFH" ? "[REJECTED_WFH]" : "[REJECTED_ONSITE]";
      cleanedNote = mergeAttendanceNotes(cleanedNote, `${tag} (\u0E1B\u0E23\u0E31\u0E1A\u0E40\u0E27\u0E25\u0E32\u0E40\u0E1B\u0E47\u0E19: ${timeStr}) \u0E1B\u0E0F\u0E34\u0E40\u0E2A\u0E18\u0E01\u0E32\u0E23\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E22\u0E49\u0E2D\u0E19\u0E2B\u0E25\u0E31\u0E07\u0E41\u0E25\u0E30\u0E43\u0E2B\u0E49\u0E17\u0E33\u0E07\u0E32\u0E19\u0E15\u0E48\u0E2D: ${reason}`);
      await supabase.from("attendance_logs").update({
        status: calculatedStatus === "LATE" ? "LATE" : "WORKING",
        check_in_time: checkInDateTime.toISOString(),
        note: cleanedNote
      }).eq("id", freshLog.id);
    } else {
      const tag = req.type === "WFH" ? "[REJECTED_WFH]" : "[REJECTED_ONSITE]";
      cleanedNote = mergeAttendanceNotes(cleanedNote, `${tag} \u0E1B\u0E0F\u0E34\u0E40\u0E2A\u0E18\u0E01\u0E32\u0E23\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E22\u0E49\u0E2D\u0E19\u0E2B\u0E25\u0E31\u0E07: ${reason}`);
      await supabase.from("attendance_logs").update({
        note: cleanedNote
      }).eq("id", freshLog.id);
    }
  }
}
async function rejectForgotCheckInRequest({
  req,
  reason,
  customCheckInTime,
  masterOptions,
  processAction
}) {
  const { data: freshLog } = await supabase.from("attendance_logs").select("*").eq("user_id", req.user_id).eq("date", req.start_date).maybeSingle();
  if (freshLog) {
    if (freshLog.check_out_time) {
      let cleanedNote = freshLog.note || "";
      cleanedNote = cleanedNote.replace(/\[PROVISIONAL_FORGOT_CHECKIN\]/g, "").replace(/\s+/g, " ").trim();
      const updatedNote = mergeAttendanceNotes(
        cleanedNote,
        `[REJECTED FORGOT_CHECKIN] \u0E1B\u0E0F\u0E34\u0E40\u0E2A\u0E18\u0E04\u0E33\u0E23\u0E49\u0E2D\u0E07\u0E02\u0E2D\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E40\u0E02\u0E49\u0E32\u0E07\u0E32\u0E19: ${reason}`
      );
      await supabase.from("attendance_logs").update({
        check_in_time: null,
        status: "ACTION_REQUIRED",
        note: updatedNote
      }).eq("id", freshLog.id);
    } else {
      const { error: deleteError } = await supabase.from("attendance_logs").delete().eq("id", freshLog.id);
      if (deleteError) {
        console.warn("Delete failed, falling back to clearing check-in details via update:", deleteError);
        let cleanedNote = freshLog.note || "";
        cleanedNote = cleanedNote.replace(/\[PROVISIONAL_FORGOT_CHECKIN\]/g, "").replace(/\s+/g, " ").trim();
        const updatedNote = mergeAttendanceNotes(
          cleanedNote,
          `[REJECTED FORGOT_CHECKIN] \u0E1B\u0E0F\u0E34\u0E40\u0E2A\u0E18\u0E04\u0E33\u0E23\u0E49\u0E2D\u0E07\u0E02\u0E2D\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E40\u0E02\u0E49\u0E32\u0E07\u0E32\u0E19: ${reason}`
        );
        await supabase.from("attendance_logs").update({
          check_in_time: null,
          status: "ACTION_REQUIRED",
          note: updatedNote
        }).eq("id", freshLog.id);
      }
    }
    await supabase.from("profiles").update({ work_status: "OFFLINE" }).eq("id", req.user_id);
  }
}
async function rejectLateEntryRequest({
  req,
  reason,
  masterOptions,
  processAction
}) {
  const { data: freshLog } = await supabase.from("attendance_logs").select("*").eq("user_id", req.user_id).eq("date", req.start_date).maybeSingle();
  if (freshLog) {
    let actualCheckInDateTime = null;
    let actualTimeStr = "10:00";
    if (freshLog.check_in_time) {
      try {
        actualCheckInDateTime = new Date(freshLog.check_in_time);
        const hours = String(actualCheckInDateTime.getHours()).padStart(2, "0");
        const minutes = String(actualCheckInDateTime.getMinutes()).padStart(2, "0");
        actualTimeStr = `${hours}:${minutes}`;
      } catch (e) {
        actualCheckInDateTime = null;
      }
    }
    const configData = masterOptions.filter((o) => o.type === "WORK_CONFIG");
    const startTimeStr = configData?.find((c) => c.key === "START_TIME")?.label || "10:00";
    const buffer = parseInt(configData?.find((c) => c.key === "LATE_BUFFER")?.label || "15");
    let isLate = false;
    let lateMinutes = 0;
    let calculatedStatus = "ON_TIME";
    if (actualCheckInDateTime) {
      isLate = checkIsLate(actualCheckInDateTime, startTimeStr, buffer);
      if (isLate) {
        calculatedStatus = "LATE";
        lateMinutes = getLateMinutes(actualCheckInDateTime, startTimeStr, buffer);
      }
    }
    try {
      await processAction(req.user_id, "ATTENDANCE_CHECK_IN", {
        status: calculatedStatus,
        time: actualTimeStr,
        lateMinutes
      });
    } catch (gameErr) {
      console.error("Failed to process ATTENDANCE_CHECK_IN gamification action on late entry rejection:", gameErr);
    }
    let cleanedNote = freshLog.note || "";
    cleanedNote = cleanedNote.replace(/\[APPEAL_PENDING\]/g, "").replace(/\[PROVISIONAL_LATE_ENTRY(:.*?)?\]/g, "").replace(/\s+/g, " ").trim();
    const updatedNote = mergeAttendanceNotes(cleanedNote, `[REJECTED LATE_ENTRY] \u0E1B\u0E0F\u0E34\u0E40\u0E2A\u0E18\u0E04\u0E33\u0E23\u0E49\u0E2D\u0E07\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E32\u0E22 (\u0E2A\u0E32\u0E22\u0E08\u0E23\u0E34\u0E07\u0E08\u0E32\u0E01\u0E40\u0E01\u0E13\u0E11\u0E4C\u0E1B\u0E01\u0E15\u0E34: ${lateMinutes} \u0E19\u0E32\u0E17\u0E35) \u0E40\u0E2B\u0E15\u0E38 flow-\u0E1B\u0E01\u0E15\u0E34: ${reason}`);
    const targetLogStatus = freshLog.check_out_time ? calculatedStatus === "LATE" ? "LATE" : "COMPLETED" : "WORKING";
    await supabase.from("attendance_logs").update({
      status: targetLogStatus,
      note: updatedNote
    }).eq("id", freshLog.id);
  }
}
async function rejectForgotCheckOutRequest({
  req,
  reason,
  masterOptions,
  processAction
}) {
  const { data: freshLog } = await supabase.from("attendance_logs").select("*").eq("user_id", req.user_id).eq("date", req.start_date).maybeSingle();
  if (freshLog) {
    const noteText = freshLog.note || "";
    const isProvisionalCheckout = noteText.includes("[PROVISIONAL_CHECKOUT]");
    const isEarlyLeaveAppeal = isProvisionalCheckout && !req.reason?.includes("(Location Mismatch)");
    if (isEarlyLeaveAppeal) {
      let missingMinutes = 0;
      let checkOutDate = /* @__PURE__ */ new Date();
      if (freshLog.check_in_time && freshLog.check_out_time) {
        const checkInDate = new Date(freshLog.check_in_time);
        checkOutDate = new Date(freshLog.check_out_time);
        const configData = masterOptions.filter((o) => o.type === "WORK_CONFIG");
        const minHoursStr = configData?.find((c) => c.key === "MIN_HOURS")?.label || "9";
        const minHours = parseFloat(minHoursStr) || 9;
        const calcResult = calculateCheckOutStatus(checkInDate, checkOutDate, minHours);
        missingMinutes = Math.round(calcResult.missingMinutes || 0);
      }
      let cleanedNote = noteText.replace(/\[PROVISIONAL_CHECKOUT\]/g, "").replace(/\s+/g, " ").trim();
      const updatedNote = mergeAttendanceNotes(
        cleanedNote,
        `[REJECTED EARLY_LEAVE_APPEAL] \u0E1B\u0E0F\u0E34\u0E40\u0E2A\u0E18\u0E01\u0E32\u0E23\u0E22\u0E01\u0E40\u0E27\u0E49\u0E19\u0E42\u0E17\u0E29\u0E01\u0E25\u0E31\u0E1A\u0E01\u0E48\u0E2D\u0E19\u0E40\u0E27\u0E25\u0E32 (\u0E02\u0E32\u0E14 ${missingMinutes} \u0E19\u0E32\u0E17\u0E35) \u0E1B\u0E23\u0E31\u0E1A\u0E2B\u0E31\u0E01\u0E04\u0E30\u0E41\u0E19\u0E19: ${reason}`
      );
      await supabase.from("attendance_logs").update({
        status: "COMPLETED",
        note: updatedNote
      }).eq("id", freshLog.id);
      if (missingMinutes > 0 && processAction) {
        try {
          await processAction(req.user_id, "ATTENDANCE_EARLY_LEAVE", {
            missingMinutes,
            date: checkOutDate
          });
        } catch (gameErr) {
          console.error("Failed to process ATTENDANCE_EARLY_LEAVE gamification action on early checkout rejection:", gameErr);
        }
      }
    } else {
      let cleanedNote = noteText.replace(/\[PROVISIONAL_CHECKOUT\]/g, "").replace(/\s+/g, " ").trim();
      const tag = "[REJECTED FORGOT_CHECKOUT]";
      const label = "\u0E1B\u0E0F\u0E34\u0E40\u0E2A\u0E18\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E40\u0E27\u0E25\u0E32\u0E2D\u0E2D\u0E01";
      const updatedNote = mergeAttendanceNotes(
        cleanedNote,
        `${tag} ${label}: ${reason}`
      );
      await supabase.from("attendance_logs").update({
        status: "ACTION_REQUIRED",
        note: updatedNote
      }).eq("id", freshLog.id);
    }
    await supabase.from("profiles").update({ work_status: "OFFLINE" }).eq("id", req.user_id);
  }
}
async function rejectOutOfRangeCheckoutRequest({
  req,
  reason
}) {
  const { data: freshLog } = await supabase.from("attendance_logs").select("*").eq("user_id", req.user_id).eq("date", req.start_date).maybeSingle();
  if (freshLog) {
    const noteText = freshLog.note || "";
    let cleanedNote = noteText.replace(/\[PROVISIONAL_CHECKOUT\]/g, "").replace(/\s+/g, " ").trim();
    const tag = "[REJECTED OUT_OF_RANGE_CHECKOUT]";
    const label = "\u0E1B\u0E0F\u0E34\u0E40\u0E2A\u0E18\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E40\u0E27\u0E25\u0E32\u0E2D\u0E2D\u0E01\u0E19\u0E2D\u0E01\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48";
    const updatedNote = mergeAttendanceNotes(
      cleanedNote,
      `${tag} ${label}: ${reason}`
    );
    await supabase.from("attendance_logs").update({
      status: "ACTION_REQUIRED",
      note: updatedNote
    }).eq("id", freshLog.id);
    await supabase.from("profiles").update({ work_status: "OFFLINE" }).eq("id", req.user_id);
  }
}
async function rejectGpsSpoofAppealRequest({
  req,
  reason
}) {
  const { data: freshLog } = await supabase.from("attendance_logs").select("*").eq("user_id", req.user_id).eq("date", req.start_date).maybeSingle();
  if (freshLog) {
    const noteText = freshLog.note || "";
    let cleanedNote = noteText.replace(/\[PROVISIONAL_GPS_SPOOF_APPEAL\]/g, "").replace(/\[GPS_SPOOF_APPEAL_PENDING\]/g, "").replace(/\s+/g, " ").trim();
    const tag = "[REJECTED GPS_SPOOF_APPEAL]";
    const label = "\u0E1B\u0E0F\u0E34\u0E40\u0E2A\u0E18\u0E01\u0E32\u0E23\u0E22\u0E37\u0E48\u0E19\u0E2D\u0E38\u0E17\u0E18\u0E23\u0E13\u0E4C\u0E1E\u0E34\u0E01\u0E31\u0E14 GPS";
    const updatedNote = mergeAttendanceNotes(
      cleanedNote,
      `${tag} ${label}: ${reason}`
    );
    await supabase.from("attendance_logs").update({
      status: "ACTION_REQUIRED",
      note: updatedNote
    }).eq("id", freshLog.id);
  }
}

// services/adminApprovalService.ts
function translateRequestType(type) {
  const mapping = {
    "SICK": "\u0E25\u0E32\u0E1B\u0E48\u0E27\u0E22",
    "VACATION": "\u0E1E\u0E31\u0E01\u0E23\u0E49\u0E2D\u0E19",
    "PERSONAL": "\u0E25\u0E32\u0E01\u0E34\u0E08",
    "EMERGENCY": "\u0E25\u0E32\u0E09\u0E38\u0E01\u0E40\u0E09\u0E34\u0E19",
    "WFH": "Work From Home (WFH)",
    "OVERTIME": "\u0E02\u0E2D\u0E1B\u0E0F\u0E34\u0E1A\u0E31\u0E15\u0E34\u0E07\u0E32\u0E19\u0E25\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32 (OT)",
    "ONSITE": "\u0E1B\u0E0F\u0E34\u0E1A\u0E31\u0E15\u0E34\u0E07\u0E32\u0E19\u0E19\u0E2D\u0E01\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48",
    "LATE_ENTRY": "\u0E41\u0E08\u0E49\u0E07\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E32\u0E22 / \u0E41\u0E01\u0E49\u0E44\u0E02\u0E40\u0E27\u0E25\u0E32\u0E40\u0E02\u0E49\u0E32\u0E07\u0E32\u0E19",
    "FORGOT_CHECKIN": "\u0E25\u0E37\u0E21\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E40\u0E02\u0E49\u0E32 (Forgot Check-in)",
    "FORGOT_CHECKOUT": "\u0E25\u0E37\u0E21\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E2D\u0E2D\u0E01 (Forgot Check-out)",
    "FORGOT_BOTH": "\u0E25\u0E37\u0E21\u0E17\u0E31\u0E49\u0E07\u0E40\u0E02\u0E49\u0E32-\u0E2D\u0E2D\u0E01 (Forgot Both)",
    "UNPAID": "\u0E25\u0E32\u0E44\u0E21\u0E48\u0E23\u0E31\u0E1A\u0E04\u0E48\u0E32\u0E08\u0E49\u0E32\u0E07 (Unpaid Leave)",
    "OUT_OF_RANGE_CHECKOUT": "\u0E2A\u0E41\u0E01\u0E19\u0E2D\u0E2D\u0E01\u0E19\u0E2D\u0E01\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48 (Out of Range Checkout)",
    "GPS_SPOOF_APPEAL": "\u0E2D\u0E38\u0E17\u0E18\u0E23\u0E13\u0E4C\u0E1E\u0E34\u0E01\u0E31\u0E14 GPS \u0E04\u0E25\u0E32\u0E14\u0E40\u0E04\u0E25\u0E37\u0E48\u0E2D\u0E19"
  };
  return mapping[type] || type;
}
var adminApprovalService = {
  /**
   * Approves a dedicated OT request (from the `ot_requests` table).
   */
  async approveOtRequestTransaction({
    otReq,
    currentUser,
    customOtHours,
    customStartTime,
    customEndTime,
    adminNote,
    processAction
  }) {
    const isFixedOt = otReq.isFixed || otReq.reason && otReq.reason.includes("[OT:FIXED]");
    let finalHours = otReq.durationHours;
    let checkOutMsg = "";
    if (customOtHours !== void 0) {
      finalHours = customOtHours;
    } else if (isFixedOt) {
      finalHours = 0;
      checkOutMsg = "";
    } else {
      const { data: attendanceLogs } = await supabase.from("attendance_logs").select("*").eq("user_id", otReq.userId);
      const employeeLog = (attendanceLogs || []).find(
        (log) => log.user_id === otReq.userId && log.date === otReq.date
      );
      const aligned = alignOtHoursWithClockOut(
        otReq.date,
        otReq.startTime,
        otReq.endTime,
        otReq.durationHours,
        employeeLog?.check_out_time
      );
      finalHours = aligned.finalHours;
      checkOutMsg = aligned.message;
    }
    const baseSalary = otReq.baseSalaryAtTime || 0;
    let multiplier = 1.5;
    if (otReq.type === "HOLIDAY_OVERTIME") multiplier = 3;
    else if (otReq.type === "HOLIDAY") multiplier = 2;
    const finalPayout = isFixedOt ? 0 : calculateEstimatedPayout(baseSalary, finalHours, multiplier);
    const updatePayload = {
      duration_hours: finalHours,
      computed_payout: finalPayout,
      approved_by: currentUser.id,
      approved_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (customStartTime) updatePayload.start_time = customStartTime;
    if (customEndTime) updatePayload.end_time = customEndTime;
    const isTimeModified = customStartTime && customStartTime !== otReq.startTime || customEndTime && customEndTime !== otReq.endTime || customOtHours !== void 0 && customOtHours !== otReq.durationHours;
    const { finalDbNote } = buildOtAuditLog(
      otReq.startTime,
      otReq.endTime,
      otReq.durationHours,
      customStartTime || otReq.startTime,
      customEndTime || otReq.endTime,
      finalHours,
      adminNote,
      isTimeModified
    );
    if (finalDbNote) {
      updatePayload.rejection_reason = finalDbNote;
    }
    await attendanceService.updateOtRequestStatus(otReq.id, "APPROVED", updatePayload);
    const dateDisplay = format4(new Date(otReq.date), "d MMM yyyy");
    let notifMsg = `\u0E04\u0E33\u0E02\u0E2D OT \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48: ${dateDisplay} (${finalHours} \u0E0A\u0E21.) \u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E41\u0E25\u0E49\u0E27
\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E40\u0E14\u0E34\u0E21: ${otReq.reason}`;
    if (isTimeModified) {
      const origStartStr = otReq.startTime.substring(0, 5);
      const origEndStr = otReq.endTime.substring(0, 5);
      const newStartStr = (customStartTime || otReq.startTime).substring(0, 5);
      const newEndStr = (customEndTime || otReq.endTime).substring(0, 5);
      notifMsg += `

\u2699\uFE0F [\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19\u0E41\u0E01\u0E49\u0E44\u0E02\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E41\u0E25\u0E30\u0E40\u0E27\u0E25\u0E32\u0E1B\u0E0F\u0E34\u0E1A\u0E31\u0E15\u0E34\u0E07\u0E32\u0E19]
\u2022 \u0E40\u0E27\u0E25\u0E32\u0E40\u0E14\u0E34\u0E21: ${origStartStr} - ${origEndStr} \u0E19. (${otReq.durationHours} \u0E0A\u0E21.)
\u2022 \u0E40\u0E27\u0E25\u0E32\u0E43\u0E2B\u0E21\u0E48: ${newStartStr} - ${newEndStr} \u0E19. (${finalHours} \u0E0A\u0E21.)`;
    }
    if (adminNote) {
      notifMsg += `

\u{1F4DD} \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E08\u0E32\u0E01\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19: ${adminNote}`;
    }
    await sendApprovalNotification(otReq.userId, "\u2705 \u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E04\u0E33\u0E02\u0E2D\u0E1E\u0E34\u0E40\u0E28\u0E29 (OT)", notifMsg, otReq.id, { request_type: "OT" });
    await publishToTeamChannel(`\u2705 \u0E04\u0E33\u0E02\u0E2D OT \u0E02\u0E2D\u0E07 **${otReq.user?.name || "\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19"}** \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 ${dateDisplay} (${finalHours} \u0E0A\u0E21.) \u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E41\u0E25\u0E49\u0E27${checkOutMsg}${adminNote ? `
\u{1F4DD} \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01: ${adminNote}` : ""}`);
    return { success: true, checkOutMsg };
  },
  /**
   * Approves a leave or attendance correction request (from the `leave_requests` table).
   */
  async approveLeaveOrCorrectionTransaction({
    request,
    currentUser,
    customOtHours,
    customStartTime,
    customEndTime,
    adminNote,
    masterOptions,
    annualHolidays,
    calendarExceptions,
    processAction
  }) {
    const LEAVE_TYPES = Object.values(ATTENDANCE_REGISTRY).filter((item) => item.category === "LEAVE").map((item) => item.id);
    const CORRECTION_TYPES = Object.values(ATTENDANCE_REGISTRY).filter((item) => item.category === "CORRECTION" || item.id === "GPS_SPOOF_APPEAL").map((item) => item.id);
    const SPECIAL_TYPES = Object.values(ATTENDANCE_REGISTRY).filter((item) => item.category === "SPECIAL" && item.id !== "GPS_SPOOF_APPEAL").map((item) => item.id);
    let finalDbNote = adminNote || "";
    let isTimeModified = false;
    let updatedReason = request.reason;
    if (SPECIAL_TYPES.includes(request.type)) {
      const res = await approveSpecialWorkRequest({
        request,
        customOtHours,
        customStartTime,
        customEndTime,
        adminNote,
        masterOptions,
        processAction
      });
      finalDbNote = res.finalDbNote;
      updatedReason = res.updatedReason;
      isTimeModified = res.isTimeModified;
    } else if (CORRECTION_TYPES.includes(request.type)) {
      if (request.type === "OUT_OF_RANGE_CHECKOUT") {
        await approveOutOfRangeCheckoutRequest({
          request,
          processAction
        });
      } else if (request.type === "GPS_SPOOF_APPEAL") {
        await approveGpsSpoofAppealRequest({
          request,
          masterOptions,
          processAction
        });
      } else {
        await approveAttendanceCorrection({
          request,
          customStartTime,
          masterOptions,
          processAction
        });
      }
    } else if (LEAVE_TYPES.includes(request.type)) {
      await approveStandardLeave({
        request,
        processAction
      });
    }
    await attendanceService.updateLeaveRequestStatus(request.id, "APPROVED", {
      approver_id: currentUser.id,
      rejection_reason: finalDbNote
    });
    let notifTitle = "\u2705 \u0E04\u0E33\u0E02\u0E2D\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34";
    if (CORRECTION_TYPES.includes(request.type)) notifTitle = "\u{1F6E0}\uFE0F \u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E44\u0E02\u0E40\u0E27\u0E25\u0E32";
    if (SPECIAL_TYPES.includes(request.type)) notifTitle = "\u2728 \u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E04\u0E33\u0E02\u0E2D\u0E1E\u0E34\u0E40\u0E28\u0E29";
    const dateDisplay = format4(request.startDate, "d MMM yyyy");
    const fullDateDisplay = request.startDate.getTime() === request.endDate.getTime() ? dateDisplay : `${dateDisplay} - ${format4(request.endDate, "d MMM yyyy")}`;
    let notifMsg = `\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23: ${translateRequestType(request.type)}
\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48: ${fullDateDisplay}`;
    if (request.type === "OVERTIME" && isTimeModified) {
      notifMsg += `

\u2699\uFE0F [\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19\u0E41\u0E01\u0E49\u0E44\u0E02\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E41\u0E25\u0E30\u0E40\u0E27\u0E25\u0E32\u0E1B\u0E0F\u0E34\u0E1A\u0E31\u0E15\u0E34\u0E07\u0E32\u0E19]
\u2022 \u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E40\u0E14\u0E34\u0E21: ${request.reason}
\u2022 \u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E43\u0E2B\u0E21\u0E48: ${updatedReason}`;
    } else {
      notifMsg += `
\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14: ${request.reason || "-"}`;
    }
    if (adminNote) {
      notifMsg += `

\u{1F4DD} \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E08\u0E32\u0E01\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19: ${adminNote}`;
    }
    await sendApprovalNotification(request.userId, notifTitle, notifMsg, request.id, { request_type: request.type });
    await publishToTeamChannel(`\u2705 \u0E04\u0E33\u0E02\u0E2D\u0E02\u0E2D\u0E07 **${request.user?.name}** (${translateRequestType(request.type)}) \u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E41\u0E25\u0E49\u0E27`);
    return { success: true, type: request.type };
  },
  /**
   * Rejects any request (either from `ot_requests` or `leave_requests`).
   */
  async rejectRequestTransaction({
    id,
    reason,
    currentUser,
    isDedicatedOtRequest,
    otReq,
    targetReq,
    customCheckInTime,
    masterOptions,
    processAction,
    rejectionMode
  }) {
    if (isDedicatedOtRequest) {
      if (!otReq) throw new Error("\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E04\u0E33\u0E02\u0E2D OT");
      await supabase.from("ot_requests").update({
        status: "REJECTED",
        rejection_reason: reason,
        approved_by: currentUser.id,
        approved_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", id);
      const dateDisplay = format4(new Date(otReq.date), "d MMM yyyy");
      await sendRejectionNotification(otReq.userId, "\u274C \u0E1B\u0E0F\u0E34\u0E40\u0E2A\u0E18\u0E04\u0E33\u0E02\u0E2D\u0E1E\u0E34\u0E40\u0E28\u0E29 (OT)", `\u0E04\u0E33\u0E02\u0E2D OT \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48: ${dateDisplay} \u0E16\u0E39\u0E01\u0E1B\u0E0F\u0E34\u0E40\u0E2A\u0E18
\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25: ${reason}`, otReq.id, { request_type: "OT" });
      return { success: true };
    }
    const { data: req } = await supabase.from("leave_requests").select("*").eq("id", id).single();
    await attendanceService.updateLeaveRequestStatus(id, "REJECTED", {
      approver_id: currentUser.id,
      rejection_reason: reason
    });
    if (req && req.type === "FORGOT_CHECKOUT") {
      await rejectForgotCheckOutRequest({
        req,
        reason,
        masterOptions,
        processAction
      });
    }
    if (req && req.type === "OUT_OF_RANGE_CHECKOUT") {
      await rejectOutOfRangeCheckoutRequest({
        req,
        reason
      });
    }
    if (req && (req.type === "WFH" || req.type === "ONSITE")) {
      await rejectWfhOnsiteRequest({
        req,
        reason,
        rejectionMode,
        customCheckInTime,
        masterOptions,
        processAction
      });
    }
    if (req && req.type === "FORGOT_CHECKIN") {
      await rejectForgotCheckInRequest({
        req,
        reason,
        customCheckInTime,
        masterOptions,
        processAction
      });
    }
    if (req && req.type === "LATE_ENTRY") {
      await rejectLateEntryRequest({
        req,
        reason,
        masterOptions,
        processAction
      });
    }
    if (req && req.type === "GPS_SPOOF_APPEAL") {
      await rejectGpsSpoofAppealRequest({
        req,
        reason
      });
    }
    if (req && req.type === "OVERTIME") {
      const dateStr = req.start_date;
      const { data: freshLog } = await supabase.from("attendance_logs").select("id, note").eq("user_id", req.user_id).eq("date", dateStr).maybeSingle();
      if (freshLog) {
        const newNote = (freshLog.note || "").replace("[OT_PENDING:", "[OT_REJECTED:").trim();
        await supabase.from("attendance_logs").update({ note: newNote }).eq("id", freshLog.id);
      }
    }
    if (targetReq) {
      const dateDisplay = format4(targetReq.startDate, "d MMM yyyy");
      await sendRejectionNotification(targetReq.userId, "\u274C \u0E1B\u0E0F\u0E34\u0E40\u0E2A\u0E18\u0E04\u0E33\u0E02\u0E2D", `\u0E04\u0E33\u0E02\u0E2D\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17: ${translateRequestType(targetReq.type)} \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48: ${dateDisplay} \u0E16\u0E39\u0E01\u0E1B\u0E0F\u0E34\u0E40\u0E2A\u0E18
\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25: ${reason}`, targetReq.id, { request_type: targetReq.type });
      await publishToTeamChannel(`\u274C \u0E04\u0E33\u0E02\u0E2D\u0E02\u0E2D\u0E07 **${targetReq.user?.name || "\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19"}** (${translateRequestType(targetReq.type)}) \u0E16\u0E39\u0E01\u0E1B\u0E0F\u0E34\u0E40\u0E2A\u0E18`);
    }
    return { success: true };
  }
};

// lib/gameLogic.ts
import { differenceInDays, format as format5 } from "date-fns";
import th from "date-fns/locale/th";
var DEFAULT_GAME_CONFIG = {
  GLOBAL_MULTIPLIERS: {
    XP_PER_HOUR: 20,
    COIN_BONUS_EARLY: 20,
    COIN_DUTY: 5,
    COIN_ATTENDANCE: 5,
    COIN_TASK: 10,
    BASE_XP_PER_LEVEL: 1e3,
    // New Flexible Keys
    XP_BONUS_EARLY: 50,
    XP_DUTY_COMPLETE: 20,
    XP_ATTENDANCE: 10,
    XP_TASK_COMPLETE: 200,
    XP_DUTY_LATE_SUBMIT: 5,
    XP_DUTY_ASSIST: 10,
    OT_JP_RATE_PER_HOUR: 10
  },
  // XP Calculation
  DIFFICULTY_XP: {
    EASY: 100,
    MEDIUM: 200,
    HARD: 300
  },
  // Penalty Rates
  PENALTY_RATES: {
    HP_PENALTY_LATE: 5,
    // Base damage per day
    HP_PENALTY_LATE_MULTIPLIER: 2,
    // Progressive multiplier (Compound damage)
    HP_PENALTY_MISSED_DUTY: 20,
    // Updated from 10 to 20 for consistency
    COIN_PENALTY_LATE_PER_DAY: 5,
    // New Stepped Duty Penalty Keys
    HP_REFUND_DUTY_REDEEM: 10,
    HP_PENALTY_DUTY_LATE_SUBMIT: 5,
    HP_PENALTY_EARLY_LEAVE_RATE: 1,
    HP_PENALTY_EARLY_LEAVE_INTERVAL: 10,
    HP_PENALTY_UNAUTHORIZED_WFH: 5,
    LATE_MODE_DYNAMIC: 0,
    EARLY_LEAVE_MODE_DYNAMIC: 1,
    HP_PENALTY_LATE_INTERVAL: 10,
    HP_PENALTY_LATE_RATE: 1
  },
  // Attendance Rules
  ATTENDANCE_RULES: {
    ON_TIME: { xp: 15, hp: 0, coins: 5 },
    LATE: { xp: 0, hp: -5, coins: 0 },
    APPEAL: { xp: 0, hp: 0, coins: 0 },
    // New: Pending Appeal (Neutral)
    ABSENT: { xp: 0, hp: -20, coins: -50 },
    NO_SHOW: { xp: 0, hp: -100, coins: -100 },
    LEAVE: { xp: 0, hp: 0, coins: 0 },
    WFH: { xp: 10, hp: 0, coins: 0 },
    SITE: { xp: 20, hp: 0, coins: 10 },
    FORGOT_CHECKOUT: { xp: 0, hp: -10, coins: 0 },
    CORRECTION_REFUND: { xp: 0, hp: 5, coins: 0 },
    ABSENT_REFUND: { xp: 0, hp: 15, coins: 0 }
    // Partial refund for absence correction (15/20)
  },
  // KPI Rewards (New Section)
  KPI_REWARDS: {
    A: { xp: 1e3, coins: 500 },
    B: { xp: 500, coins: 200 },
    C: { xp: 200, coins: 50 },
    D: { xp: 0, coins: 0 }
  },
  // New Dynamic Configs
  LEVELING_SYSTEM: {
    formula: "LINEAR",
    base_xp_per_level: 1e3,
    max_level: 100,
    level_up_bonus_coins: 500
  },
  ITEM_MECHANICS: {
    time_warp_refund_cap_hp: 20,
    time_warp_refund_percent: 100,
    shop_tax_rate: 0
  },
  AUTO_JUDGE_CONFIG: {
    negligence_penalty_hp: 20,
    lookback_days_check: 60,
    allow_holiday_penalty: false,
    negligence_threshold_days: 1,
    duty_grace_hour: 10
  },
  SYSTEM_MAINTENANCE: {
    duty_cleanup_days: 180,
    logs_cleanup_days: 365,
    notification_cleanup_days: 30
  },
  REVIEW_JUDGE_CONFIG: {
    expiry_days: 3,
    auto_revert_status: "TODO",
    enabled: true,
    last_run_at: null
  },
  ATTENDANCE_GRADING_RULES: [
    { grade: "A+", max_late: 0, color: "bg-green-100 text-green-700", label: "Excellent" },
    { grade: "A", max_late: 1, color: "bg-emerald-100 text-emerald-700", label: "Good" },
    { grade: "B", max_late: 2, color: "bg-blue-100 text-blue-700", label: "Fair" },
    { grade: "C", max_late: 4, color: "bg-yellow-100 text-yellow-700", label: "Warning" },
    { grade: "F", max_late: 999, color: "bg-red-100 text-red-700", label: "Critical" }
  ],
  TRIBUNAL_CONFIG: {
    enabled: true,
    reward_hp: 10,
    reward_points: 50,
    penalty_hp: 20,
    false_report_penalty_hp: 15,
    categories: [
      { id: "toilet", label: "\u{1F6BD} \u0E2A\u0E38\u0E02\u0E32", severity: "LOW" },
      { id: "kitchen", label: "\u{1F37D}\uFE0F \u0E2B\u0E49\u0E2D\u0E07\u0E04\u0E23\u0E31\u0E27", severity: "MEDIUM" },
      { id: "behavior", label: "\u{1F5E3}\uFE0F \u0E1E\u0E24\u0E15\u0E34\u0E01\u0E23\u0E23\u0E21", severity: "HIGH" },
      { id: "property", label: "\u{1F528} \u0E02\u0E2D\u0E07\u0E1E\u0E31\u0E07", severity: "CRITICAL" },
      { id: "other", label: "\u{1F4DD} \u0E2D\u0E37\u0E48\u0E19\u0E46", severity: "LOW" }
    ]
  }
};
var getConfigSection = (config, section, fallback) => {
  const userSection = config?.[section];
  if (!userSection) return fallback;
  return { ...fallback, ...userSection };
};
var calculateLevel = (xp, config = DEFAULT_GAME_CONFIG) => {
  const levelling = getConfigSection(config, "LEVELING_SYSTEM", DEFAULT_GAME_CONFIG.LEVELING_SYSTEM);
  const globals = getConfigSection(config, "GLOBAL_MULTIPLIERS", DEFAULT_GAME_CONFIG.GLOBAL_MULTIPLIERS);
  const base = levelling?.base_xp_per_level || globals?.BASE_XP_PER_LEVEL || 1e3;
  return Math.floor(xp / base) + 1;
};
var formatDate = (date) => {
  if (!date) return "";
  try {
    return format5(new Date(date), "d MMM", { locale: th });
  } catch (e) {
    return "";
  }
};
var calculateTaskXP = (task, completionDate, config = DEFAULT_GAME_CONFIG) => {
  const diffXP = getConfigSection(config, "DIFFICULTY_XP", DEFAULT_GAME_CONFIG.DIFFICULTY_XP);
  const globals = getConfigSection(config, "GLOBAL_MULTIPLIERS", DEFAULT_GAME_CONFIG.GLOBAL_MULTIPLIERS);
  const difficulty = task.difficulty || "MEDIUM";
  const estimatedHours = task.estimatedHours || 0;
  const endDate = task.endDate;
  const base = diffXP[difficulty] || globals.XP_TASK_COMPLETE || 200;
  let hourly = 0;
  if (estimatedHours > 0) {
    hourly = Math.floor(estimatedHours * (globals.XP_PER_HOUR || 20));
  }
  let early = 0;
  if (endDate) {
    const finalSubmitDate = completionDate ? new Date(completionDate) : /* @__PURE__ */ new Date();
    const isEarly = differenceInDays(new Date(endDate), finalSubmitDate) >= 1;
    if (isEarly) {
      early = globals.XP_BONUS_EARLY || 50;
    }
  }
  return {
    base,
    hourly,
    early,
    total: base + hourly + early
  };
};
var evaluateAction = (action, context, config = DEFAULT_GAME_CONFIG) => {
  const cfg = config || DEFAULT_GAME_CONFIG;
  const diffXP = getConfigSection(cfg, "DIFFICULTY_XP", DEFAULT_GAME_CONFIG.DIFFICULTY_XP);
  const penalties = getConfigSection(cfg, "PENALTY_RATES", DEFAULT_GAME_CONFIG.PENALTY_RATES);
  const attendanceRules = getConfigSection(cfg, "ATTENDANCE_RULES", DEFAULT_GAME_CONFIG.ATTENDANCE_RULES);
  const globals = getConfigSection(cfg, "GLOBAL_MULTIPLIERS", DEFAULT_GAME_CONFIG.GLOBAL_MULTIPLIERS);
  const kpiRewards = getConfigSection(cfg, "KPI_REWARDS", DEFAULT_GAME_CONFIG.KPI_REWARDS);
  switch (action) {
    case "TASK_COMPLETE": {
      const { title, manualBonus } = context;
      const taskName = title || "\u0E07\u0E32\u0E19";
      const breakdown = calculateTaskXP(context, context.completionDate, cfg);
      const baseXP = breakdown.total;
      const adjustment = Number(manualBonus || 0);
      const xp = Math.max(0, baseXP + adjustment);
      const isEarly = breakdown.early > 0;
      let coins = globals.COIN_TASK || 10;
      if (isEarly) {
        coins += globals.COIN_BONUS_EARLY || 20;
      }
      return {
        xp,
        hp: 0,
        coins,
        message: isEarly ? `\u{1F680} \u0E2A\u0E48\u0E07\u0E07\u0E32\u0E19\u0E44\u0E27\u0E2A\u0E38\u0E14\u0E22\u0E2D\u0E14!: ${taskName}` : `\u2705 \u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08: ${taskName}`,
        details: `+${xp} XP (${baseXP}${adjustment >= 0 ? "+" : ""}${adjustment}), +${coins} JP`
      };
    }
    case "TASK_LATE": {
      const basePenalty = penalties.HP_PENALTY_LATE || 5;
      const hpPenalty = context.customPenalty ? Math.abs(context.customPenalty) : basePenalty;
      const daysLate = context.daysLate || 1;
      const daysLateText = daysLate > 0 ? ` (\u0E0A\u0E49\u0E32 ${daysLate} \u0E27\u0E31\u0E19)` : "";
      const taskTitle = context.title ? `"${context.title}"` : "\u0E07\u0E32\u0E19";
      return {
        xp: 0,
        hp: -hpPenalty,
        coins: -(penalties.COIN_PENALTY_LATE_PER_DAY || 5),
        message: `\u0E42\u0E14\u0E19\u0E2B\u0E31\u0E01\u0E04\u0E30\u0E41\u0E19\u0E19! ${taskTitle} \u0E25\u0E48\u0E32\u0E0A\u0E49\u0E32${daysLateText}`,
        details: `-${hpPenalty} HP`
      };
    }
    case "DUTY_COMPLETE": {
      const xpReward = globals.XP_DUTY_COMPLETE || 20;
      const coinReward = globals.COIN_DUTY || 5;
      const dateStr = context.date ? ` (${formatDate(context.date)})` : "";
      return {
        xp: xpReward,
        hp: 0,
        coins: coinReward,
        message: `\u0E17\u0E33\u0E40\u0E27\u0E23\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E2A\u0E34\u0E49\u0E19${dateStr} \u0E40\u0E22\u0E35\u0E48\u0E22\u0E21\u0E21\u0E32\u0E01!`,
        details: `+${xpReward} XP, +${coinReward} JP`
      };
    }
    case "DUTY_ASSIST": {
      const xpReward = globals.XP_DUTY_ASSIST || 30;
      const coinReward = globals.COIN_DUTY || 5;
      const targetName = context.targetName || "\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E19";
      return {
        xp: xpReward,
        hp: 0,
        coins: coinReward,
        message: `\u0E2A\u0E38\u0E14\u0E22\u0E2D\u0E14! \u0E0A\u0E48\u0E27\u0E22\u0E17\u0E33\u0E40\u0E27\u0E23\u0E41\u0E17\u0E19 ${targetName}`,
        details: `Hero Bonus: +${xpReward} XP`
      };
    }
    case "DUTY_MISSED": {
      const dateStr = context.date ? ` (${formatDate(context.date)})` : "";
      const penalty = context.customPenalty ? Math.abs(context.customPenalty) : penalties.HP_PENALTY_MISSED_DUTY || 10;
      const message = context.description || `\u0E25\u0E37\u0E21\u0E17\u0E33\u0E40\u0E27\u0E23!${dateStr} \u0E23\u0E30\u0E27\u0E31\u0E07\u0E2B\u0E25\u0E31\u0E07\u0E40\u0E14\u0E32\u0E30\u0E19\u0E30`;
      return {
        xp: 0,
        hp: -penalty,
        coins: 0,
        message,
        details: `-${penalty} HP`
      };
    }
    case "DUTY_LATE_SUBMIT": {
      const lateXp = globals.XP_DUTY_LATE_SUBMIT || 5;
      const dateStr = context.date ? ` (${formatDate(context.date)})` : "";
      const isAbandoned = context.penaltyStatus === "ABANDONED" || context.penalty_status === "ABANDONED";
      const refundValue = penalties.HP_REFUND_DUTY_REDEEM || 10;
      const latePenaltyValue = penalties.HP_PENALTY_DUTY_LATE_SUBMIT || 5;
      const hpChange = isAbandoned ? refundValue : -latePenaltyValue;
      const message = isAbandoned ? `\u0E01\u0E39\u0E49\u0E04\u0E37\u0E19\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E40\u0E27\u0E23\u0E17\u0E35\u0E48\u0E17\u0E2D\u0E14\u0E17\u0E34\u0E49\u0E07!${dateStr}` : `\u0E2A\u0E48\u0E07\u0E40\u0E27\u0E23\u0E25\u0E48\u0E32\u0E0A\u0E49\u0E32 (\u0E0A\u0E48\u0E27\u0E07\u0E1C\u0E48\u0E2D\u0E19\u0E1C\u0E31\u0E19)${dateStr}`;
      return {
        xp: lateXp,
        hp: hpChange,
        coins: 0,
        message,
        details: `${hpChange > 0 ? "+" : ""}${hpChange} HP, +${lateXp} XP`
      };
    }
    case "ATTENDANCE_CHECK_IN": {
      const status = context.status;
      let rule = { ...attendanceRules[status] || attendanceRules.ON_TIME };
      if (status === "ON_TIME") {
        if (globals.XP_ATTENDANCE !== void 0) rule.xp = globals.XP_ATTENDANCE;
        if (globals.COIN_ATTENDANCE !== void 0) rule.coins = globals.COIN_ATTENDANCE;
      }
      let hpChange = rule.hp;
      let detailsStr = `${rule.xp > 0 ? `+${rule.xp} XP` : ""} ${rule.hp < 0 ? `${rule.hp} HP` : ""}`.trim();
      if (status === "LATE") {
        const lateModeDynamic = penalties.LATE_MODE_DYNAMIC !== void 0 ? penalties.LATE_MODE_DYNAMIC : 0;
        if (lateModeDynamic === 1) {
          const lateMinutes = context.lateMinutes || 0;
          const interval = penalties.HP_PENALTY_LATE_INTERVAL || 10;
          const rate = penalties.HP_PENALTY_LATE_RATE || 1;
          const penalty = Math.ceil(lateMinutes / interval) * rate;
          hpChange = -penalty;
          detailsStr = `-${penalty} HP (\u0E2A\u0E32\u0E22 ${lateMinutes} \u0E19\u0E32\u0E17\u0E35) ${rule.xp > 0 ? `+${rule.xp} XP` : ""}`.trim();
        }
      }
      const timeStr = context.time ? ` @ ${context.time}` : "";
      const dateStr = context.date ? ` (${formatDate(context.date)})` : "";
      let msg = "";
      if (status === "LATE") {
        const lateMinutes = context.lateMinutes || 0;
        msg = `\u0E40\u0E02\u0E49\u0E32\u0E07\u0E32\u0E19\u0E2A\u0E32\u0E22${timeStr}${lateMinutes > 0 ? ` (\u0E2A\u0E32\u0E22 ${lateMinutes} \u0E19\u0E32\u0E17\u0E35)` : ""}${dateStr}`;
      } else if (status === "APPEAL") {
        msg = `\u0E40\u0E02\u0E49\u0E32\u0E07\u0E32\u0E19 (\u0E23\u0E2D\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E2A\u0E32\u0E22)${timeStr}`;
      } else {
        msg = `\u0E40\u0E02\u0E49\u0E32\u0E07\u0E32\u0E19\u0E15\u0E23\u0E07\u0E40\u0E27\u0E25\u0E32${timeStr}`;
      }
      return {
        xp: rule.xp,
        hp: hpChange,
        coins: rule.coins,
        message: msg,
        details: detailsStr
      };
    }
    case "ATTENDANCE_CHECK_OUT": {
      const xpReward = globals.XP_ATTENDANCE || 10;
      const coinReward = globals.COIN_ATTENDANCE || 5;
      const timeStr = context.time ? ` @ ${context.time}` : "";
      const dateStr = context.date ? ` (${formatDate(context.date)})` : "";
      return {
        xp: xpReward,
        hp: 0,
        coins: coinReward,
        message: `\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E2D\u0E2D\u0E01\u0E07\u0E32\u0E19\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22${timeStr}${dateStr}`,
        details: `+${xpReward} XP, +${coinReward} JP`
      };
    }
    case "ATTENDANCE_ABSENT": {
      const rule = attendanceRules.ABSENT;
      const dateStr = context.date ? ` (${formatDate(context.date)})` : "";
      return {
        xp: rule.xp,
        hp: rule.hp,
        coins: rule.coins,
        message: `\u0E02\u0E32\u0E14\u0E07\u0E32\u0E19!${dateStr}`,
        details: `${rule.hp} HP`
      };
    }
    case "ATTENDANCE_LATE": {
      const rule = attendanceRules.LATE;
      let hpChange = rule.hp;
      let detailsStr = `${rule.hp} HP`;
      const lateModeDynamic = penalties.LATE_MODE_DYNAMIC !== void 0 ? penalties.LATE_MODE_DYNAMIC : 0;
      if (lateModeDynamic === 1) {
        const lateMinutes = context.lateMinutes || 0;
        const interval = penalties.HP_PENALTY_LATE_INTERVAL || 10;
        const rate = penalties.HP_PENALTY_LATE_RATE || 1;
        const penalty = Math.ceil(lateMinutes / interval) * rate;
        hpChange = -penalty;
        detailsStr = `-${penalty} HP (\u0E2A\u0E32\u0E22 ${lateMinutes} \u0E19\u0E32\u0E17\u0E35)`;
      }
      const dateStr = context.date ? ` (${formatDate(context.date)})` : "";
      return {
        xp: rule.xp,
        hp: hpChange,
        coins: rule.coins,
        message: `\u0E21\u0E32\u0E2A\u0E32\u0E22 (\u0E04\u0E33\u0E02\u0E2D\u0E16\u0E39\u0E01\u0E1B\u0E0F\u0E34\u0E40\u0E2A\u0E18)${dateStr}`,
        details: detailsStr
      };
    }
    case "ATTENDANCE_NO_SHOW": {
      const rule = attendanceRules.NO_SHOW;
      const dateStr = context.date ? ` (${formatDate(context.date)})` : "";
      return {
        xp: rule.xp,
        hp: rule.hp,
        coins: rule.coins,
        message: `\u0E2B\u0E32\u0E22\u0E15\u0E31\u0E27\u0E44\u0E1B\u0E40\u0E25\u0E22 (No Show)${dateStr}`,
        details: "CRITICAL PENALTY"
      };
    }
    case "ATTENDANCE_FORGOT_CHECKOUT": {
      const rule = attendanceRules.FORGOT_CHECKOUT || { xp: 0, hp: -10, coins: 0 };
      const dateStr = context.date ? ` (${formatDate(context.date)})` : "";
      return {
        xp: rule.xp,
        hp: rule.hp,
        coins: rule.coins,
        message: `\u0E25\u0E37\u0E21\u0E15\u0E2D\u0E01\u0E1A\u0E31\u0E15\u0E23\u0E2D\u0E2D\u0E01\u0E02\u0E49\u0E32\u0E21\u0E27\u0E31\u0E19!${dateStr}`,
        details: `${rule.hp} HP`
      };
    }
    case "ATTENDANCE_CORRECTION_REFUND": {
      const rule = attendanceRules.CORRECTION_REFUND || { xp: 0, hp: 5, coins: 0 };
      return {
        xp: rule.xp,
        hp: rule.hp,
        coins: rule.coins,
        message: context.originalDescription || `\u0E04\u0E37\u0E19\u0E04\u0E48\u0E32 HP \u0E08\u0E32\u0E01\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E40\u0E27\u0E25\u0E32\u0E2D\u0E2D\u0E01\u0E07\u0E32\u0E19`,
        details: `+${rule.hp} HP`
      };
    }
    case "ATTENDANCE_ABSENT_REFUND": {
      const rule = attendanceRules.ABSENT_REFUND || { xp: 0, hp: 15, coins: 0 };
      return {
        xp: rule.xp,
        hp: rule.hp,
        coins: rule.coins,
        message: context.originalDescription || `\u0E04\u0E37\u0E19\u0E04\u0E48\u0E32 HP \u0E08\u0E32\u0E01\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E02\u0E32\u0E14\u0E07\u0E32\u0E19`,
        details: `+${rule.hp} HP`
      };
    }
    case "ATTENDANCE_EARLY_LEAVE": {
      const earlyLeaveModeDynamic = penalties.EARLY_LEAVE_MODE_DYNAMIC !== void 0 ? penalties.EARLY_LEAVE_MODE_DYNAMIC : 1;
      let hpChange = 0;
      let detailsStr = "";
      if (earlyLeaveModeDynamic === 1) {
        const interval = penalties.HP_PENALTY_EARLY_LEAVE_INTERVAL || 10;
        const rate = penalties.HP_PENALTY_EARLY_LEAVE_RATE || 1;
        const penalty = Math.ceil((context.missingMinutes || 0) / interval) * rate;
        hpChange = -penalty;
        detailsStr = `-${penalty} HP`;
      } else {
        hpChange = attendanceRules.EARLY_LEAVE?.hp || 0;
        detailsStr = `${hpChange} HP`;
      }
      const missingStr = context.missingMinutes ? ` (\u0E02\u0E32\u0E14 ${context.missingMinutes} \u0E19\u0E32\u0E17\u0E35)` : "";
      return {
        xp: 0,
        hp: hpChange,
        coins: 0,
        message: `\u0E01\u0E25\u0E31\u0E1A\u0E01\u0E48\u0E2D\u0E19\u0E40\u0E27\u0E25\u0E32${missingStr}`,
        details: detailsStr
      };
    }
    case "ATTENDANCE_LEAVE": {
      const leaveTypeMap = {
        "SICK": "\u0E25\u0E32\u0E1B\u0E48\u0E27\u0E22",
        "VACATION": "\u0E25\u0E32\u0E1E\u0E31\u0E01\u0E23\u0E49\u0E2D\u0E19",
        "PERSONAL": "\u0E25\u0E32\u0E01\u0E34\u0E08",
        "EMERGENCY": "\u0E40\u0E2B\u0E15\u0E38\u0E09\u0E38\u0E01\u0E40\u0E09\u0E34\u0E19",
        "LATE_ENTRY": "\u0E02\u0E2D\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E32\u0E22",
        "OVERTIME": "\u0E02\u0E2D OT",
        "FORGOT_CHECKIN": "\u0E25\u0E37\u0E21\u0E40\u0E0A\u0E47\u0E04\u0E2D\u0E34\u0E19",
        "FORGOT_CHECKOUT": "\u0E25\u0E37\u0E21\u0E40\u0E0A\u0E47\u0E04\u0E2D\u0E2D\u0E01",
        "WFH": "Work From Home"
      };
      const typeLabel = leaveTypeMap[context.type] || context.type;
      const rule = attendanceRules[context.type] || { xp: 0, hp: 0, coins: 0 };
      return {
        xp: rule.xp || 0,
        hp: rule.hp || 0,
        coins: rule.coins || 0,
        message: `\u0E43\u0E0A\u0E49\u0E27\u0E31\u0E19\u0E25\u0E32: ${typeLabel}`,
        details: `${rule.xp > 0 ? `+${rule.xp} XP ` : ""}${rule.hp < 0 ? `${rule.hp} HP` : ""}`.trim()
      };
    }
    case "ATTENDANCE_UNAUTHORIZED_WFH":
    case "ATTENDANCE_UNAUTHORIZED_ONSITE": {
      const penalty = penalties.HP_PENALTY_UNAUTHORIZED_WFH || 5;
      const isSite = action === "ATTENDANCE_UNAUTHORIZED_ONSITE" || context?.workType === "SITE" || context?.type === "ONSITE" || context?.workType === "ONSITE";
      const workTypeLabel = isSite ? "On-site (\u0E1B\u0E0F\u0E34\u0E1A\u0E31\u0E15\u0E34\u0E07\u0E32\u0E19\u0E19\u0E2D\u0E01\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48)" : "WFH";
      return {
        xp: 0,
        hp: -penalty,
        coins: 0,
        message: `\u0E2B\u0E31\u0E01\u0E04\u0E30\u0E41\u0E19\u0E19! \u0E40\u0E0A\u0E47\u0E04\u0E2D\u0E34\u0E19 ${workTypeLabel} \u0E42\u0E14\u0E22\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E02\u0E2D\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15\u0E25\u0E48\u0E27\u0E07\u0E2B\u0E19\u0E49\u0E32`,
        details: `-${penalty} HP`
      };
    }
    case "SHOP_PURCHASE":
      return {
        xp: 0,
        hp: 0,
        coins: context.cost ? -context.cost : 0,
        message: `\u0E0B\u0E37\u0E49\u0E2D\u0E44\u0E2D\u0E40\u0E17\u0E21: ${context.itemName || "\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32"}`,
        details: `-${context.cost} JP`
      };
    case "ITEM_USE": {
      let effectDesc = "";
      if (context.effectValue) {
        if (context.effectType === "HEAL_HP") effectDesc = ` (HP +${context.effectValue})`;
      }
      return {
        xp: 0,
        hp: 0,
        coins: 0,
        message: `\u0E43\u0E0A\u0E49\u0E44\u0E2D\u0E40\u0E17\u0E21: ${context.itemName}${effectDesc}`,
        details: ""
      };
    }
    case "MANUAL_ADJUST":
      return {
        xp: context.xp || 0,
        hp: context.hp || 0,
        coins: context.coins || 0,
        message: `\u{1F451} GM ${context.adminName || "Admin"} \u0E1B\u0E23\u0E31\u0E1A\u0E04\u0E48\u0E32: ${context.reason || "No Reason"}`,
        details: "Manual Adjustment"
      };
    case "TIME_WARP_REFUND":
      return {
        xp: 0,
        hp: context.hp || 0,
        coins: context.coins || 0,
        message: `\u23F0 Time Warp: \u0E22\u0E49\u0E2D\u0E19\u0E40\u0E27\u0E25\u0E32\u0E25\u0E49\u0E32\u0E07\u0E42\u0E17\u0E29 "${context.originalDescription || "Unknown"}"`,
        details: "Refunded"
      };
    case "KPI_REWARD": {
      const grade = context.grade || "D";
      const r = kpiRewards[grade] || kpiRewards["D"] || { xp: 0, coins: 0 };
      return {
        xp: r.xp,
        hp: 0,
        coins: r.coins,
        message: `KPI Reward: Grade ${grade}`,
        details: `+${r.xp} XP, +${r.coins} JP`
      };
    }
    case "TRIBUNAL_REWARD": {
      const { category, reason } = context;
      const tribunalCfg = cfg.TRIBUNAL_CONFIG || DEFAULT_GAME_CONFIG.TRIBUNAL_CONFIG;
      const xp = 0;
      const hp = tribunalCfg.reward_hp || 10;
      const coins = tribunalCfg.reward_points || 50;
      return {
        xp,
        hp,
        coins,
        message: `\u2696\uFE0F \u0E23\u0E32\u0E07\u0E27\u0E31\u0E25\u0E41\u0E08\u0E49\u0E07\u0E40\u0E2B\u0E15\u0E38: ${category}`,
        details: `+${hp} HP, +${coins} JP`
      };
    }
    case "TRIBUNAL_PENALTY": {
      const { category, reason, isFalseReport } = context;
      const tribunalCfg = cfg.TRIBUNAL_CONFIG || DEFAULT_GAME_CONFIG.TRIBUNAL_CONFIG;
      const hpPenalty = isFalseReport ? tribunalCfg.false_report_penalty_hp || 15 : tribunalCfg.penalty_hp || 20;
      return {
        xp: 0,
        hp: -hpPenalty,
        coins: 0,
        message: isFalseReport ? `\u2696\uFE0F \u0E01\u0E0E\u0E41\u0E2B\u0E48\u0E07\u0E01\u0E23\u0E23\u0E21! \u0E41\u0E08\u0E49\u0E07\u0E40\u0E2B\u0E15\u0E38\u0E40\u0E17\u0E47\u0E08: ${category}` : `\u2696\uFE0F \u0E1A\u0E17\u0E25\u0E07\u0E42\u0E17\u0E29: ${category}`,
        details: `-${hpPenalty} HP`
      };
    }
    case "SYSTEM_BURIAL":
      return {
        xp: context.xpChange || -100,
        hp: context.hpChange || 0,
        coins: context.pointsChange || 0,
        message: `\u{1F480} Permanent Burial: ${context.description || "\u0E1E\u0E49\u0E19\u0E2A\u0E20\u0E32\u0E1E\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19"}`,
        details: "Game Over"
      };
    case "ATTENDANCE_OVERTIME": {
      const hours = context.hours || 0;
      const rate = globals.OT_JP_RATE_PER_HOUR !== void 0 ? globals.OT_JP_RATE_PER_HOUR : 10;
      const coins = Math.round(hours * rate);
      const xp = Math.round(hours * rate);
      return {
        xp,
        hp: 0,
        coins,
        message: `\u{1F389} \u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E42\u0E1A\u0E19\u0E31\u0E2A\u0E01\u0E32\u0E23\u0E17\u0E33\u0E07\u0E32\u0E19\u0E25\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32 +${coins} JP (${hours} \u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07)`,
        details: `+${xp} XP, +${coins} JP`
      };
    }
    default:
      return { xp: 0, hp: 0, coins: 0, message: "", details: "" };
  }
};

// lib/gamification/gameStats.ts
var updateGameStats = async (userId, action, context = {}, config) => {
  try {
    const result = evaluateAction(action, context, config);
    if (result.xp === 0 && result.hp === 0 && result.coins === 0 && !result.message) return result;
    const { data: user, error: fetchError } = await supabase.from("profiles").select("xp, hp, available_points, level, max_hp, death_count").eq("id", userId).single();
    if (fetchError || !user) throw new Error("User not found for gamification update");
    const newXp = Math.max(0, user.xp + result.xp);
    const newHp = Math.min(user.max_hp || 100, user.hp + result.hp);
    const newLevel = calculateLevel(newXp, config);
    const isLevelUp = newLevel > user.level;
    const isDeath = user.hp > 0 && newHp <= 0;
    const levelUpBonus = config.LEVELING_SYSTEM?.level_up_bonus_coins ?? 500;
    const bonusCoins = isLevelUp ? levelUpBonus : 0;
    const newCoins = Math.max(0, user.available_points + result.coins + bonusCoins);
    const profileUpdates = {
      xp: newXp,
      hp: newHp,
      available_points: newCoins,
      level: newLevel
    };
    if (isDeath) {
      profileUpdates.death_count = (user.death_count || 0) + 1;
    }
    const { error: updateError } = await supabase.from("profiles").update(profileUpdates).eq("id", userId);
    if (updateError) throw updateError;
    return {
      ...result,
      isLevelUp,
      isDeath,
      newLevel,
      newXp,
      newHp,
      newCoins,
      bonusCoins,
      deathCount: profileUpdates.death_count || user.death_count
    };
  } catch (err) {
    console.error("Game Stats Update Error:", err);
    throw err;
  }
};

// utils/gamificationUtils.ts
var toValidUuid = (str) => {
  if (!str) return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(str)) return str;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(12, "0");
  return `00000000-0000-0000-0000-${hex}`;
};

// lib/gamification/gameLogs.ts
var logGameAction = async (userId, action, result, context = {}, bonusCoins = 0) => {
  try {
    let baseMsg = context.description || result.message;
    const cleanReason = (reason) => {
      if (!reason) return "";
      const r = reason.trim();
      if (r.startsWith("ABSENT_DATE:") || r.startsWith("FORGOT_OUT_DATE:") || r === "NEGLIGENCE_PROTOCOL" || r === "ABANDONED_DUTY") {
        return "";
      }
      if (/^[A-Z0-9_/:-]+$/.test(r)) {
        return "";
      }
      return r;
    };
    const reasonSuffix = context.reason ? cleanReason(context.reason) : "";
    const description = reasonSuffix && !baseMsg.includes(reasonSuffix) ? `${baseMsg} (${reasonSuffix})` : baseMsg;
    const { error: logError } = await supabase.from("game_logs").insert({
      user_id: userId,
      action_type: action,
      xp_change: result.xp,
      hp_change: result.hp,
      jp_change: result.coins + bonusCoins,
      description,
      related_id: toValidUuid(context.id || null)
    });
    if (logError) {
      if (logError.code === "23505") {
        console.warn(`[Idempotency] Game log for ${action} with related_id ${context.id} already exists. Skipping.`);
        return;
      }
      console.error("\u274C Failed to insert game log:", logError);
    }
    const isPenalty = result.hp < 0 || result.coins < 0 && action !== "SHOP_PURCHASE";
    const isSignificantReward = result.isLevelUp || result.xp > 100 || action === "KPI_REWARD";
    const isAdminAdjust = action === "MANUAL_ADJUST";
    if (isPenalty || isSignificantReward || isAdminAdjust) {
      let title = isPenalty ? "\u{1F4C9} \u0E42\u0E14\u0E19\u0E2B\u0E31\u0E01\u0E04\u0E30\u0E41\u0E19\u0E19!" : "\u{1F389} \u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E23\u0E32\u0E07\u0E27\u0E31\u0E25!";
      if (isAdminAdjust) title = result.xp >= 0 && result.hp >= 0 && result.coins + bonusCoins >= 0 ? "\u{1F381} GM \u0E21\u0E2D\u0E1A\u0E23\u0E32\u0E07\u0E27\u0E31\u0E25\u0E43\u0E2B\u0E49!" : "\u{1F4C9} GM \u0E1B\u0E23\u0E31\u0E1A\u0E25\u0E14\u0E2A\u0E16\u0E32\u0E19\u0E30!";
      if (action === "ATTENDANCE_FORGOT_CHECKOUT") title = "\u26A0\uFE0F \u0E25\u0E37\u0E21\u0E15\u0E2D\u0E01\u0E1A\u0E31\u0E15\u0E23\u0E2D\u0E2D\u0E01";
      if (action === "ATTENDANCE_ABSENT") title = "\u274C \u0E02\u0E32\u0E14\u0E07\u0E32\u0E19";
      if (action === "TASK_LATE") title = "\u23F0 \u0E2A\u0E48\u0E07\u0E07\u0E32\u0E19\u0E25\u0E48\u0E32\u0E0A\u0E49\u0E32";
      if (action === "ATTENDANCE_EARLY_LEAVE") title = "\u{1F552} \u0E01\u0E25\u0E31\u0E1A\u0E01\u0E48\u0E2D\u0E19\u0E40\u0E27\u0E25\u0E32";
      if (action === "DUTY_MISSED") title = "\u{1F6AB} \u0E40\u0E1E\u0E34\u0E01\u0E40\u0E09\u0E22\u0E40\u0E27\u0E23";
      if (action === "DUTY_LATE_SUBMIT") title = "\u23F0 \u0E2A\u0E48\u0E07\u0E40\u0E27\u0E23\u0E25\u0E48\u0E32\u0E0A\u0E49\u0E32";
      const scoreParts = [];
      if (result.hp !== 0) scoreParts.push(`${result.hp > 0 ? "+" : ""}${result.hp} HP`);
      if (result.xp !== 0) scoreParts.push(`${result.xp > 0 ? "+" : ""}${result.xp} XP`);
      const totalCoins = result.coins + bonusCoins;
      if (totalCoins !== 0) scoreParts.push(`${totalCoins > 0 ? "+" : ""}${totalCoins} JP`);
      const richMessage = scoreParts.length > 0 ? `${description} (${scoreParts.join(", ")})` : description;
      await supabase.from("notifications").insert({
        user_id: userId,
        type: isPenalty ? "GAME_PENALTY" : "GAME_REWARD",
        title,
        message: richMessage,
        is_read: false,
        link_path: "DASHBOARD"
      });
    }
    if (result.isLevelUp) {
      await supabase.from("game_logs").insert({
        user_id: userId,
        action_type: "LEVEL_UP",
        xp_change: 0,
        hp_change: 0,
        jp_change: bonusCoins,
        description: `\u{1F389} LEVEL UP! \u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E40\u0E1B\u0E47\u0E19 Lv.${result.newLevel} (\u0E23\u0E31\u0E1A\u0E42\u0E1A\u0E19\u0E31\u0E2A +${bonusCoins} JP)`
      });
    }
  } catch (err) {
    console.error("Game Log Error:", err);
  }
};

// lib/gamification/deathSystem.ts
import { differenceInDays as differenceInDays2 } from "date-fns";
var handleDeathSequence = async (userId, deathNumber, stats) => {
  try {
    const { data: tasks } = await supabase.from("tasks").select("id, title, end_date, assignee_ids").contains("assignee_ids", [userId]).neq("status", "DONE").lt("end_date", (/* @__PURE__ */ new Date()).toISOString());
    const overdueTasks = (tasks || []).map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.end_date,
      delayDays: differenceInDays2(/* @__PURE__ */ new Date(), new Date(t.end_date))
    }));
    const { data: recentLogs } = await supabase.from("game_logs").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(10);
    const snapshotData = {
      overdueTasks,
      recentPenalties: (recentLogs || []).map((l) => ({
        actionType: l.action_type,
        hpChange: l.hp_change,
        description: l.description,
        createdAt: l.created_at
      })),
      statsAtDeath: stats
    };
    await supabase.from("hp_death_logs").insert({
      user_id: userId,
      death_number: deathNumber,
      snapshot_data: snapshotData
    });
    await supabase.from("notifications").insert({
      user_id: userId,
      type: "GAME_PENALTY",
      title: "\u{1F480} HP \u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E2B\u0E21\u0E14\u0E25\u0E07\u0E41\u0E25\u0E49\u0E27!",
      message: `\u0E04\u0E38\u0E13\u0E15\u0E38\u0E22\u0E40\u0E1B\u0E47\u0E19\u0E04\u0E23\u0E31\u0E49\u0E07\u0E17\u0E35\u0E48 ${deathNumber} \u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E14\u0E49\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E04\u0E27\u0E32\u0E21\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E44\u0E27\u0E49\u0E41\u0E25\u0E49\u0E27`,
      is_read: false
    });
  } catch (err) {
    console.error("Death sequence failed:", err);
  }
};

// server/routes/adminApproval.ts
var router6 = express6.Router();
async function seedMasterOption() {
  try {
    const { data, error } = await serverSupabase.from("master_options").select("id").eq("type", "WORK_CONFIG").eq("key", "LINE_APPROVAL_MODE").maybeSingle();
    if (error) {
      console.error("[Seeding] Error checking LINE_APPROVAL_MODE master option:", error);
      return;
    }
    if (!data) {
      console.log("[Seeding] Inserting default LINE_APPROVAL_MODE master option...");
      const { error: insertErr } = await serverSupabase.from("master_options").insert({
        type: "WORK_CONFIG",
        key: "LINE_APPROVAL_MODE",
        label: "INTERACTIVE",
        is_active: true,
        sort_order: 10,
        description: "\u0E42\u0E2B\u0E21\u0E14\u0E1B\u0E38\u0E48\u0E21\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E1C\u0E48\u0E32\u0E19 LINE: INTERACTIVE (\u0E40\u0E1B\u0E34\u0E14\u0E1B\u0E38\u0E48\u0E21) \u0E2B\u0E23\u0E37\u0E2D SIMPLE_NOTIF (\u0E2A\u0E48\u0E07\u0E1B\u0E01\u0E15\u0E34)"
      });
      if (insertErr) {
        console.error("[Seeding] Error inserting LINE_APPROVAL_MODE:", insertErr);
      } else {
        console.log("[Seeding] Successfully inserted LINE_APPROVAL_MODE option.");
      }
    }
  } catch (err) {
    console.error("[Seeding] Unexpected error during seeding:", err);
  }
}
seedMasterOption();
async function fetchServerGameConfig() {
  try {
    const { data, error } = await serverSupabase.from("game_configs").select("*");
    if (error || !data) {
      return DEFAULT_GAME_CONFIG;
    }
    const configMap = data.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    return {
      ...DEFAULT_GAME_CONFIG,
      ...configMap
    };
  } catch (err) {
    console.error("Failed to load game config server-side:", err);
    return DEFAULT_GAME_CONFIG;
  }
}
async function processActionServer(userId, action, context = {}) {
  try {
    const targetId = toValidUuid(context.id || null);
    if (targetId) {
      const { data: existingLog } = await serverSupabase.from("game_logs").select("id").eq("user_id", userId).eq("related_id", targetId).maybeSingle();
      if (existingLog) {
        console.log(`[Server-Gamification] Action ${action} for ${userId} with key ${targetId} already exists. Skipping.`);
        return null;
      }
    }
    const config = await fetchServerGameConfig();
    const result = await updateGameStats(userId, action, context, config);
    if (result) {
      await logGameAction(userId, action, result, context, result.bonusCoins);
      if (result.isDeath) {
        await handleDeathSequence(userId, result.deathCount, result);
      }
    }
    return result;
  } catch (error) {
    console.error("Server Gamification Action Error:", error);
    return null;
  }
}
var handleLineAction = async (req, res) => {
  const authHeader = req.headers.authorization;
  const lineAdminSecret = process.env.LINE_ADMIN_SECRET || "JUIJUI_SECRET_12345";
  if (!authHeader || authHeader !== `Bearer ${lineAdminSecret}`) {
    console.warn("[Line-Action API] Unauthorized attempt with header:", authHeader);
    return res.status(401).json({ success: false, error: "Unauthorized handshake signature" });
  }
  const action = req.body.action;
  const requestId = req.body.requestId || req.body.id;
  const requestType = req.body.requestType || req.body.type || "WFH";
  const notificationId = req.body.notificationId;
  const adminProfile = req.body.adminProfile;
  if (!action || !requestId || !adminProfile || !adminProfile.id) {
    return res.status(400).json({ success: false, error: "Missing required request parameters (action, requestId, adminProfile)" });
  }
  try {
    console.log(`[Line-Action API] Admin ${adminProfile.full_name || adminProfile.name} is performing ${action} on request ${requestId}`);
    let { data: leaveReqData } = await serverSupabase.from("leave_requests").select("*").eq("id", requestId).maybeSingle();
    let reqData = leaveReqData;
    let isDedicatedOt = false;
    let otReqData = null;
    if (reqData && reqData.user_id) {
      const { data: userProf } = await serverSupabase.from("profiles").select("id, full_name, avatar_url, position").eq("id", reqData.user_id).maybeSingle();
      if (userProf) {
        reqData.profiles = userProf;
      }
    }
    if (!reqData) {
      const { data: otData } = await serverSupabase.from("ot_requests").select("*").eq("id", requestId).maybeSingle();
      if (otData) {
        isDedicatedOt = true;
        otReqData = otData;
        if (otReqData.user_id) {
          const { data: userProf } = await serverSupabase.from("profiles").select("id, full_name, avatar_url, position").eq("id", otReqData.user_id).maybeSingle();
          if (userProf) {
            otReqData.profiles = userProf;
          }
        }
      }
    }
    if (!reqData && !otReqData) {
      console.error("[Line-Action API] Request not found in leave_requests or ot_requests:", requestId);
      return res.status(404).json({ success: false, error: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E04\u0E33\u0E02\u0E2D\u0E25\u0E32\u0E2B\u0E23\u0E37\u0E2D\u0E04\u0E33\u0E02\u0E2D\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A" });
    }
    const currentStatus = isDedicatedOt ? otReqData.status : reqData.status;
    if (currentStatus !== "PENDING") {
      const actionVerb = currentStatus === "APPROVED" ? "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34" : "\u0E1B\u0E0F\u0E34\u0E40\u0E2A\u0E18";
      const approverId = isDedicatedOt ? otReqData.approver_id || otReqData.reviewed_by : reqData.approver_id || reqData.approved_by || reqData.reviewed_by;
      let approverName = "\u0E1C\u0E39\u0E49\u0E14\u0E39\u0E41\u0E25\u0E23\u0E30\u0E1A\u0E1A";
      if (approverId) {
        const { data: approverProfile } = await serverSupabase.from("profiles").select("full_name").eq("id", approverId).maybeSingle();
        if (approverProfile?.full_name) {
          approverName = approverProfile.full_name;
        }
      }
      console.log(`[Line-Action API] Request ${requestId} was already processed. Status: ${currentStatus}`);
      return res.status(400).json({
        success: false,
        error: `\u0E04\u0E33\u0E02\u0E2D\u0E19\u0E35\u0E49\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E01\u0E32\u0E23${actionVerb}\u0E41\u0E25\u0E49\u0E27\u0E42\u0E14\u0E22\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19\u0E04\u0E38\u0E13 ${approverName} \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E1B\u0E25\u0E2D\u0E14\u0E20\u0E31\u0E22\u0E08\u0E36\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15\u0E43\u0E2B\u0E49\u0E17\u0E33\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E0B\u0E49\u0E33\u0E0B\u0E49\u0E2D\u0E19\u0E04\u0E48\u0E30`
      });
    }
    const { data: masterOptions } = await serverSupabase.from("master_options").select("*");
    const { data: annualHolidays } = await serverSupabase.from("annual_holidays").select("*");
    const { data: calendarExceptions } = await serverSupabase.from("calendar_exceptions").select("*");
    const currentUser = {
      id: adminProfile.id,
      role: "ADMIN",
      name: adminProfile.full_name || adminProfile.name
    };
    const targetEmployeeName = isDedicatedOt ? otReqData.profiles?.full_name || "\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19" : reqData.profiles?.full_name || "\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19";
    if (isDedicatedOt) {
      if (action === "approve") {
        await adminApprovalService.approveOtRequestTransaction({
          otReq: otReqData,
          currentUser,
          adminNote: "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E04\u0E33\u0E02\u0E2D OT \u0E1C\u0E48\u0E32\u0E19 LINE Interactive",
          processAction: processActionServer
        });
      } else if (action === "reject") {
        await adminApprovalService.rejectRequestTransaction({
          id: requestId,
          reason: "\u0E1B\u0E0F\u0E34\u0E40\u0E2A\u0E18\u0E04\u0E33\u0E02\u0E2D OT \u0E1C\u0E48\u0E32\u0E19 LINE Interactive",
          currentUser,
          isDedicatedOtRequest: true,
          otReq: otReqData,
          masterOptions: masterOptions || [],
          processAction: processActionServer
        });
      } else {
        return res.status(400).json({ success: false, error: "Invalid action specified" });
      }
    } else {
      const mappedRequest = {
        id: reqData.id,
        userId: reqData.user_id,
        type: reqData.type,
        startDate: new Date(reqData.start_date),
        endDate: new Date(reqData.end_date),
        reason: reqData.reason,
        attachmentUrl: reqData.attachment_url,
        status: reqData.status,
        approverId: reqData.approver_id,
        createdAt: new Date(reqData.created_at),
        rejectionReason: reqData.rejection_reason,
        user: reqData.profiles ? {
          id: reqData.profiles.id,
          name: reqData.profiles.full_name,
          avatarUrl: reqData.profiles.avatar_url,
          position: reqData.profiles.position
        } : void 0
      };
      if (action === "approve") {
        await adminApprovalService.approveLeaveOrCorrectionTransaction({
          request: mappedRequest,
          currentUser,
          adminNote: "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E04\u0E33\u0E02\u0E2D\u0E1C\u0E48\u0E32\u0E19 LINE Interactive",
          masterOptions: masterOptions || [],
          annualHolidays: annualHolidays || [],
          calendarExceptions: calendarExceptions || [],
          processAction: processActionServer
        });
      } else if (action === "reject") {
        await adminApprovalService.rejectRequestTransaction({
          id: requestId,
          reason: "\u0E1B\u0E0F\u0E34\u0E40\u0E2A\u0E18\u0E04\u0E33\u0E02\u0E2D\u0E1C\u0E48\u0E32\u0E19 LINE Interactive",
          currentUser,
          isDedicatedOtRequest: false,
          targetReq: mappedRequest,
          masterOptions: masterOptions || [],
          processAction: processActionServer
        });
      } else {
        return res.status(400).json({ success: false, error: "Invalid action specified" });
      }
    }
    const actionLabel = action === "approve" ? "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34" : "\u0E1B\u0E0F\u0E34\u0E40\u0E2A\u0E18";
    const nowTimeStr = (/* @__PURE__ */ new Date()).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
    const adminName = adminProfile.full_name || adminProfile.name;
    const updatedMsg = `[${actionLabel}\u0E41\u0E25\u0E49\u0E27] \u0E04\u0E33\u0E02\u0E2D (${requestType}) \u0E02\u0E2D\u0E07\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19 ${targetEmployeeName} \u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E01\u0E32\u0E23${actionLabel}\u0E41\u0E25\u0E49\u0E27\u0E42\u0E14\u0E22\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19\u0E04\u0E38\u0E13 ${adminName} \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E40\u0E27\u0E25\u0E32 ${nowTimeStr} \u0E19.`;
    await serverSupabase.from("notifications").update({
      is_read: true,
      message: updatedMsg,
      title: `\u2705 \u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E01\u0E32\u0E23${actionLabel}\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22`
    }).eq("related_id", requestId);
    const reqReason = isDedicatedOt ? otReqData?.reason || otReqData?.title || "-" : reqData?.reason || "-";
    const leaveTypeOpt = masterOptions?.find((o) => o.type === "LEAVE_TYPE" && o.key === reqData?.type);
    const displayRequestType = isDedicatedOt ? "\u0E02\u0E2D\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34 OT" : leaveTypeOpt?.label || reqData?.type || requestType || "\u0E04\u0E33\u0E02\u0E2D";
    return res.json({
      success: true,
      message: `\u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E01\u0E32\u0E23${actionLabel}\u0E04\u0E33\u0E02\u0E2D\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13 ${targetEmployeeName} \u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22\u0E41\u0E25\u0E49\u0E27\u0E04\u0E48\u0E30`,
      details: {
        employeeName: targetEmployeeName,
        requestType: displayRequestType,
        reason: reqReason,
        actionLabel,
        adminName
      }
    });
  } catch (err) {
    console.error("[Line-Action API] Transaction execution failure:", err);
    return res.status(500).json({ success: false, error: `\u0E23\u0E30\u0E1A\u0E1A\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E25\u0E49\u0E21\u0E40\u0E2B\u0E25\u0E27: ${err.message}` });
  }
};
router6.post("/api/admin-approval/line-action", handleLineAction);
router6.post("/api/admin-approval/process-line-action", handleLineAction);
var adminApproval_default = router6;

// server.ts
var PORT = 3e3;
var app = express7();
app.set("trust proxy", 1);
app.use(express7.json());
app.use(cookieParser());
app.use(cookieSession({
  name: "session",
  keys: [process.env.SESSION_SECRET || process.env.COOKIE_SECRET || "juijui-planner-secret"],
  maxAge: 24 * 60 * 60 * 1e3,
  // 24 hours
  secure: true,
  sameSite: "none",
  httpOnly: true
}));
app.use(auth_default);
app.use(drive_default);
app.use(tags_default);
app.use(dashboard_default);
app.use(chat_default);
app.use(adminApproval_default);
async function startServer() {
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express7.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}
startServer();
var server_default = app;

// api/index.ts
var api_default = server_default;
export {
  api_default as default
};
