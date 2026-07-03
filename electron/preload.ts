// electron/preload.ts - Preload script for secure IPC communication
import { contextBridge, ipcRenderer } from 'electron';
import type { EmailTemplate } from '@/types';

export interface ElectronAPI {
  storeGet: (key: string) => Promise<unknown>;
  storeSet: (key: string, value: unknown) => Promise<void>;
  storeDelete: (key: string) => Promise<void>;
  storeGetAll: () => Promise<Record<string, unknown>>;
  checkSetup: () => Promise<boolean>;
  completeSetup: () => Promise<boolean>;
  openExternal: (url: string) => Promise<void>;
  sendEmail: (params: { to: string; subject: string; body: string; isHtml?: boolean }) =>
    Promise<{ success: boolean; messageId?: string; error?: string }>;
  parseCsv: (params: { filePath?: string; fileContent?: string }) =>
    Promise<{ success: boolean; data?: Record<string, string>[]; error?: string }>;
  getGoogleAuthUrl: () => Promise<string>;
  exchangeGoogleCode: (code: string) => Promise<{ success: boolean; tokens?: Record<string, unknown>; error?: string }>;
  fetchSheetData: (params: { sheetId: string; range: string }) =>
    Promise<{ success: boolean; data?: string[][]; error?: string }>;
  updateSheetStatus: (params: { sheetId: string; row: number; status: string; column: string }) =>
    Promise<{ success: boolean; error?: string }>;
  generateEmail: (params: {
    leadInfo: { name: string; email: string; company: string; topic: string; notes: string };
    tone: string;
    emailType?: string;
    topicContext?: string;
    purpose?: string;
    additionalContext?: string;
    template?: EmailTemplate;
  }) => Promise<{ success: boolean; email?: { subject: string; body: string }; error?: string }>;
  fetchOpenRouterModels: () => Promise<{ success: boolean; models?: Array<Record<string, unknown>>; error?: string }>;
  onMessage: (callback: (event: unknown, message: unknown) => void) => () => void;
}

const api: ElectronAPI = {
  storeGet: (key: string) => ipcRenderer.invoke('store-get', key),
  storeSet: (key: string, value: unknown) => ipcRenderer.invoke('store-set', key, value),
  storeDelete: (key: string) => ipcRenderer.invoke('store-delete', key),
  storeGetAll: () => ipcRenderer.invoke('store-get-all'),
  checkSetup: () => ipcRenderer.invoke('check-setup'),
  completeSetup: () => ipcRenderer.invoke('complete-setup'),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  sendEmail: (params) => ipcRenderer.invoke('send-email', params),
  parseCsv: (params) => ipcRenderer.invoke('parse-csv', params),
  getGoogleAuthUrl: () => ipcRenderer.invoke('google-auth-url'),
  exchangeGoogleCode: (code: string) => ipcRenderer.invoke('exchange-google-code', code),
  fetchSheetData: (params) => ipcRenderer.invoke('fetch-sheet-data', params),
  updateSheetStatus: (params) => ipcRenderer.invoke('update-sheet-status', params),
  generateEmail: (params) => ipcRenderer.invoke('generate-email', params),
  fetchOpenRouterModels: () => ipcRenderer.invoke('fetch-openrouter-models'),
  onMessage: (callback) => {
    ipcRenderer.on('main-message', callback);
    return () => ipcRenderer.removeListener('main-message', callback);
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
