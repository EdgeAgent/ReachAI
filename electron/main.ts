// electron/main.ts - Main entry point for ReachAI
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import StoreModule from 'electron-store';
import { parse } from 'csv-parse/sync';
import fs from 'fs';

// electron-store v10 is ESM - handle both CJS and ESM imports
const Store = (StoreModule as any).default || StoreModule;

// Initialize store for config persistence
interface StoreSchema {
  business: { name: string; website: string; industry: string } | null;
  email: { smtpHost: string; smtpPort: number; smtpUser: string; smtpPass: string; fromName: string; fromEmail: string } | null;
  google: { tokens: Record<string, unknown>; sheetId: string; sheetName: string } | null;
  openrouter: { apiKey: string; model: string } | null;
  sheetMapping: { nameCol: string; emailCol: string; companyCol: string; statusCol: string; notesCol: string } | null;
  setupComplete: boolean;
}

const store = new (Store as any)<StoreSchema>({
  defaults: {
    business: null,
    email: null,
    google: null,
    openrouter: null,
    sheetMapping: null,
    setupComplete: false,
  },
});

// Google OAuth client config
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'PLACEHOLDER_CLIENT_ID';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'PLACEHOLDER_CLIENT_SECRET';
const REDIRECT_URI = 'http://localhost:3000/oauth/callback';

// Create main window
function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  });

  win.once('ready-to-show', () => win.show());

  // Load the renderer
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  return win;
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ===== IPC HANDLERS =====

// Store operations
ipcMain.handle('store-get', (_event, key: keyof StoreSchema) => store.get(key));
ipcMain.handle('store-set', (_event, key: keyof StoreSchema, value: unknown) => store.set(key, value));
ipcMain.handle('store-delete', (_event, key: keyof StoreSchema) => store.delete(key));
ipcMain.handle('store-get-all', () => store.store);

// Check if setup is complete
ipcMain.handle('check-setup', () => {
  return store.get('setupComplete', false);
});

// Complete setup
ipcMain.handle('complete-setup', () => {
  store.set('setupComplete', true);
  return true;
});

// Open external links
ipcMain.handle('open-external', (_event, url: string) => {
  shell.openExternal(url);
});

// ===== CSV PARSING =====
ipcMain.handle('parse-csv', async (_event, { filePath, fileContent }: { filePath?: string; fileContent?: string }) => {
  try {
    let content: string;
    if (fileContent) {
      content = fileContent;
    } else if (filePath) {
      content = fs.readFileSync(filePath, 'utf-8');
    } else {
      throw new Error('No CSV content provided');
    }

    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];

    return { success: true, data: records };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown CSV parsing error';
    return { success: false, error: errorMessage };
  }
});

// ===== EMAIL ENGINE (nodemailer) =====
ipcMain.handle('send-email', async (_event, { to, subject, body, isHtml = false }: { to: string; subject: string; body: string; isHtml?: boolean }) => {
  try {
    const emailConfig = store.get('email');
    if (!emailConfig) throw new Error('Email not configured');

    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: emailConfig.smtpHost,
      port: emailConfig.smtpPort,
      secure: emailConfig.smtpPort === 465,
      auth: { user: emailConfig.smtpUser, pass: emailConfig.smtpPass },
    });

    const result = await transporter.sendMail({
      from: `"${emailConfig.fromName}" <${emailConfig.fromEmail}>`,
      to,
      subject,
      [isHtml ? 'html' : 'text']: body,
    });

    return { success: true, messageId: result.messageId };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
});

// ===== GOOGLE OAUTH & SHEETS =====
ipcMain.handle('google-auth-url', () => {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.email',
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
});

ipcMain.handle('exchange-google-code', async (_event, code: string) => {
  try {
    const axios = (await import('axios')).default;
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI,
    });
    store.set('google.tokens', response.data);
    return { success: true, tokens: response.data as Record<string, unknown> };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
});

ipcMain.handle('fetch-sheet-data', async (_event, { sheetId, range }: { sheetId: string; range: string }) => {
  try {
    const { google } = await import('googleapis');
    const tokens = store.get('google.tokens');
    if (!tokens?.access_token) throw new Error('Not authenticated with Google');

    const auth = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI);
    auth.setCredentials(tokens as Record<string, string>);

    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range });

    return { success: true, data: response.data.values as string[][] };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
});

ipcMain.handle('update-sheet-status', async (_event, { sheetId, range, status }: { sheetId: string; row: number; status: string; column: string; range?: string }) => {
  try {
    const { google } = await import('googleapis');
    const tokens = store.get('google.tokens');
    const auth = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI);
    auth.setCredentials(tokens as Record<string, string>);

    const sheets = google.sheets({ version: 'v4', auth });
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: range || '',
      valueInputOption: 'RAW',
      requestBody: { values: [[status]] },
    });
    return { success: true };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
});

// ===== AI EMAIL GENERATION (OpenRouter) =====

// Email type descriptions for AI prompting
const typeDescriptions: Record<string, string> = {
  'cold-outreach': 'a cold outreach email to someone who has never heard of us',
  'warm-intro': 'a warm introduction email leveraging a mutual connection or previous interaction',
  'follow-up': 'a follow-up email to someone we previously contacted',
  're-engagement': 'a re-engagement email to revive a cold lead',
  'proposal': 'a proposal email offering specific services or solutions',
  'meeting-request': 'an email requesting a meeting or call',
};

ipcMain.handle('generate-email', async (_event, {
  leadInfo,
  tone,
  emailType,
  topicContext,
  purpose,
  additionalContext,
  template,
}: {
  leadInfo: {
    name: string;
    email: string;
    company: string;
    topic: string;
    notes: string;
  };
  tone: string;
  emailType?: string;
  topicContext?: string;
  purpose?: string;
  additionalContext?: string;
  template?: {
    subject: string;
    body: string;
  };
}) => {
  try {
    const aiConfig = store.get('openrouter');
    if (!aiConfig?.apiKey) throw new Error('AI not configured');

    const axios = (await import('axios')).default;
    const business = store.get('business');

    const systemPrompt = `You are an expert outreach email copywriter for ${business?.name || 'a business'}.
Write ${typeDescriptions[emailType || 'cold-outreach'] || 'an outreach email'}.
${topicContext ? `TOPIC CONTEXT: ${topicContext}` : ''}
Business: ${business?.name || ''} | Industry: ${business?.industry || ''}
Tone: ${tone}. Keep emails under 150 words. Natural, conversational style. Avoid spammy language.`;

    let userPrompt = `Write a ${tone.toLowerCase()} ${(emailType || 'cold-outreach').replace('-', ' ')} email to:
Name: ${leadInfo.name}
Company: ${leadInfo.company || 'Unknown'}
Topic: ${leadInfo.topic || 'General'}
${leadInfo.notes ? `Notes about lead: ${leadInfo.notes}` : ''}
${purpose ? `Purpose: ${purpose}` : ''}
${additionalContext ? `Additional context: ${additionalContext}` : ''}`;

    if (template) {
      userPrompt += `\n\nUse this template as a base:\nSubject: ${template.subject}\nBody: ${template.body}`;
    }

    userPrompt += `\n\nReturn ONLY a JSON object with this exact structure (no markdown, no backticks):\n{"subject": "email subject line", "body": "email body text with line breaks"}`;

    let modelId = aiConfig.model || 'openai/gpt-4o-mini:free';
    
    // Try the selected model first
    let response;
    try {
      response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: modelId,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 500,
      }, {
        headers: {
          'Authorization': `Bearer ${aiConfig.apiKey}`,
          'HTTP-Referer': 'https://reachai.app',
          'X-Title': 'ReachAI',
          'Content-Type': 'application/json',
        },
      });
    } catch (firstErr: unknown) {
      // If 403 Forbidden, retry with :free suffix (free-tier users)
      const axiosErr = firstErr as { response?: { status: number } };
      if (axiosErr?.response?.status === 403 && !modelId.includes(':free')) {
        modelId = `${modelId}:free`;
        response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
          model: modelId,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.8,
          max_tokens: 500,
        }, {
          headers: {
            'Authorization': `Bearer ${aiConfig.apiKey}`,
            'HTTP-Referer': 'https://reachai.app',
            'X-Title': 'ReachAI',
            'Content-Type': 'application/json',
          },
        });
      } else {
        throw firstErr;
      }
    }

    const content = response.data.choices[0].message.content as string;
    // Try to parse JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) as { subject: string; body: string } : { subject: 'Follow-up', body: content };

    return { success: true, email: parsed };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
});

// Get available OpenRouter models
ipcMain.handle('fetch-openrouter-models', async () => {
  try {
    const axios = (await import('axios')).default;
    const response = await axios.get('https://openrouter.ai/api/v1/models');
    interface OpenRouterModel {
      id: string;
      name: string;
      pricing?: { prompt: string; completion: string };
    }
    const freeCheap = (response.data.data as OpenRouterModel[]).filter((m: OpenRouterModel) =>
      m.pricing?.prompt === '0' || m.pricing?.completion === '0' ||
      (m.pricing?.prompt && parseFloat(m.pricing.prompt) < 0.00001)
    );
    return { success: true, models: freeCheap.slice(0, 20) };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
});