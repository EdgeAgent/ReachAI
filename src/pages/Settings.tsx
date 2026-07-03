import { useState, useEffect, useCallback } from 'react';
import { motion } from '@/lib/framer-motion-shim';
import { toast } from 'sonner';
import {
  Building2, Mail, Lock, Key, Save, CheckCircle2, AlertCircle,
  RefreshCw, Link, Unlink, ChevronRight, Shield, Sparkles,
  Palette, Bell, HardDrive, Eye, EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/* ==========================================
   TYPES
   ========================================== */

interface SettingsState {
  // Business Profile
  businessName: string;
  website: string;
  industry: string;
  description: string;

  // Email (SMTP)
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;
  fromName: string;
  fromEmail: string;

  // Google Sheets
  googleConnected: boolean;
  sheetId: string;
  sheetName: string;

  // OpenRouter
  openRouterKey: string;
  openRouterModel: string;

  // App Preferences
  darkMode: boolean;
  notifications: boolean;
  autoCheckInterval: string;
  timezone: string;
}

/* ==========================================
   DEFAULTS
   ========================================== */

const DEFAULT_SETTINGS: SettingsState = {
  businessName: '',
  website: '',
  industry: '',
  description: '',
  smtpHost: '',
  smtpPort: '587',
  smtpUser: '',
  smtpPass: '',
  fromName: '',
  fromEmail: '',
  googleConnected: false,
  sheetId: '',
  sheetName: 'Sheet1',
  openRouterKey: '',
  openRouterModel: 'anthropic/claude-sonnet-4-20250514',
  darkMode: true,
  notifications: true,
  autoCheckInterval: '30',
  timezone: 'America/New_York',
};

/* ==========================================
   MAIN COMPONENT
   ========================================== */

export default function Settings() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  /* ---- Load settings from store ---- */
  useEffect(() => {
    const load = async () => {
      try {
        const val = await window.electronAPI?.storeGet('settings');
        if (val && typeof val === 'object') {
          setSettings(prev => ({ ...prev, ...val }));
        }
      } catch {
        // Use defaults
      }
      setLoading(false);
    };
    load();
  }, []);

  /* ---- Auto-save when settings change ---- */
  useEffect(() => {
    if (!loading) {
      const timeout = setTimeout(() => {
        window.electronAPI?.storeSet('settings', settings);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [settings, loading]);

  const updateField = useCallback(<K extends keyof SettingsState>(field: K, value: SettingsState[K]) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await window.electronAPI?.storeSet('settings', settings);
      toast.success('Settings saved successfully');
    } catch {
      toast.error('Failed to save settings');
    }
    setSaving(false);
  }, [settings]);

  const handleTestEmail = useCallback(async () => {
    if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPass) {
      toast.error('Please fill in all SMTP fields first');
      return;
    }
    setTestingEmail(true);
    try {
      await window.electronAPI?.saveEmailConfig({
        smtpHost: settings.smtpHost,
        smtpPort: parseInt(settings.smtpPort) || 587,
        smtpUser: settings.smtpUser,
        smtpPass: settings.smtpPass,
        fromName: settings.fromName,
        fromEmail: settings.fromEmail,
      });
      toast.success('SMTP configuration saved');
    } catch {
      toast.error('Failed to save SMTP config');
    }
    setTestingEmail(false);
  }, [settings]);

  const handleConnectGoogle = useCallback(async () => {
    try {
      const result = await window.electronAPI?.googleAuth?.();
      if (result?.success) {
        updateField('googleConnected', true);
        toast.success('Google account connected');
      } else {
        toast.error(result?.error || 'Failed to connect Google account');
      }
    } catch {
      toast.error('Google auth failed');
    }
  }, [updateField]);

  const handleDisconnectGoogle = useCallback(async () => {
    try {
      await window.electronAPI?.storeSet('google', null);
      updateField('googleConnected', false);
      updateField('sheetId', '');
      toast.success('Google account disconnected');
    } catch {
      toast.error('Failed to disconnect');
    }
  }, [updateField]);

  const handleSaveOpenRouter = useCallback(async () => {
    try {
      await window.electronAPI?.storeSet('openrouter', {
        apiKey: settings.openRouterKey,
        model: settings.openRouterModel,
      });
      toast.success('OpenRouter settings saved');
    } catch {
      toast.error('Failed to save OpenRouter settings');
    }
  }, [settings]);

  const handleSaveBusinessProfile = useCallback(async () => {
    try {
      await window.electronAPI?.storeSet('business', {
        name: settings.businessName,
        website: settings.website,
        industry: settings.industry,
        description: settings.description,
      });
      toast.success('Business profile saved');
    } catch {
      toast.error('Failed to save business profile');
    }
  }, [settings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-6 h-6 border-2 border-accent-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="mb-6">
          <h1 className="text-[24px] font-semibold text-text-primary tracking-tight">Settings</h1>
          <p className="text-[13px] text-text-secondary mt-1">Configure your ReachAI workspace</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-bg-secondary border border-border-subtle">
            <TabsTrigger value="profile" className="text-[12px] data-[state=active]:bg-bg-elevated data-[state=active]:text-text-primary">
              <Building2 className="w-3.5 h-3.5 mr-1.5" /> Profile
            </TabsTrigger>
            <TabsTrigger value="email" className="text-[12px] data-[state=active]:bg-bg-elevated data-[state=active]:text-text-primary">
              <Mail className="w-3.5 h-3.5 mr-1.5" /> Email
            </TabsTrigger>
            <TabsTrigger value="google" className="text-[12px] data-[state=active]:bg-bg-elevated data-[state=active]:text-text-primary">
              <Link className="w-3.5 h-3.5 mr-1.5" /> Google
            </TabsTrigger>
            <TabsTrigger value="ai" className="text-[12px] data-[state=active]:bg-bg-elevated data-[state=active]:text-text-primary">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" /> AI
            </TabsTrigger>
            <TabsTrigger value="app" className="text-[12px] data-[state=active]:bg-bg-elevated data-[state=active]:text-text-primary">
              <Palette className="w-3.5 h-3.5 mr-1.5" /> App
            </TabsTrigger>
          </TabsList>

          {/* ---- Profile Tab ---- */}
          <TabsContent value="profile" className="space-y-4">
            <SettingsCard title="Business Profile" description="Used to personalize AI-generated emails" icon={<Building2 className="w-5 h-5 text-accent-blue" />}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted mb-1.5 block">Business Name</Label>
                  <Input value={settings.businessName} onChange={e => updateField('businessName', e.target.value)}
                    placeholder="Acme Inc." className="bg-bg-primary border-border-subtle text-text-primary placeholder:text-text-muted" />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted mb-1.5 block">Website</Label>
                  <Input value={settings.website} onChange={e => updateField('website', e.target.value)}
                    placeholder="https://acme.com" className="bg-bg-primary border-border-subtle text-text-primary placeholder:text-text-muted" />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted mb-1.5 block">Industry</Label>
                  <Input value={settings.industry} onChange={e => updateField('industry', e.target.value)}
                    placeholder="e.g., SaaS, Real Estate" className="bg-bg-primary border-border-subtle text-text-primary placeholder:text-text-muted" />
                </div>
              </div>
              <div>
                <Label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted mb-1.5 block">Description</Label>
                <textarea value={settings.description} onChange={e => updateField('description', e.target.value)}
                  placeholder="Brief description of your business..."
                  rows={3} className="w-full bg-bg-primary border border-border-subtle rounded-lg px-3 py-2 text-[13px] text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-border-default" />
              </div>
              <Button onClick={handleSaveBusinessProfile} className="bg-accent-blue text-white hover:brightness-110">
                <Save className="w-3.5 h-3.5 mr-1.5" /> Save Profile
              </Button>
            </SettingsCard>
          </TabsContent>

          {/* ---- Email Tab ---- */}
          <TabsContent value="email" className="space-y-4">
            <SettingsCard title="SMTP Configuration" description="Configure your email server for sending outreach" icon={<Mail className="w-5 h-5 text-[#EF4444]" />}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted mb-1.5 block">SMTP Host</Label>
                  <Input value={settings.smtpHost} onChange={e => updateField('smtpHost', e.target.value)}
                    placeholder="smtp.gmail.com" className="bg-bg-primary border-border-subtle text-text-primary placeholder:text-text-muted" />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted mb-1.5 block">SMTP Port</Label>
                  <Input value={settings.smtpPort} onChange={e => updateField('smtpPort', e.target.value)}
                    placeholder="587" className="bg-bg-primary border-border-subtle text-text-primary placeholder:text-text-muted" />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted mb-1.5 block">Username</Label>
                  <Input value={settings.smtpUser} onChange={e => updateField('smtpUser', e.target.value)}
                    placeholder="your-email@gmail.com" className="bg-bg-primary border-border-subtle text-text-primary placeholder:text-text-muted" />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted mb-1.5 block">Password</Label>
                  <div className="relative">
                    <Input type={showSmtpPass ? 'text' : 'password'} value={settings.smtpPass} onChange={e => updateField('smtpPass', e.target.value)}
                      placeholder="App-specific password" className="bg-bg-primary border-border-subtle text-text-primary placeholder:text-text-muted pr-10" />
                    <button onClick={() => setShowSmtpPass(!showSmtpPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                      {showSmtpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted mb-1.5 block">From Name</Label>
                  <Input value={settings.fromName} onChange={e => updateField('fromName', e.target.value)}
                    placeholder="John Doe" className="bg-bg-primary border-border-subtle text-text-primary placeholder:text-text-muted" />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted mb-1.5 block">From Email</Label>
                  <Input value={settings.fromEmail} onChange={e => updateField('fromEmail', e.target.value)}
                    placeholder="john@acme.com" className="bg-bg-primary border-border-subtle text-text-primary placeholder:text-text-muted" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleTestEmail} disabled={testingEmail} className="bg-accent-blue text-white hover:brightness-110">
                  {testingEmail ? <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />}
                  Save & Test
                </Button>
              </div>
            </SettingsCard>
          </TabsContent>

          {/* ---- Google Tab ---- */}
          <TabsContent value="google" className="space-y-4">
            <SettingsCard title="Google Sheets" description="Connect your Google account to sync leads" icon={<Link className="w-5 h-5 text-[#10B981]" />}>
              <div className="flex items-center justify-between p-4 bg-bg-primary border border-border-subtle rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${settings.googleConnected ? 'bg-[#10B98120]' : 'bg-bg-tertiary'}`}>
                    {settings.googleConnected ? <CheckCircle2 className="w-5 h-5 text-[#10B981]" /> : <Unlink className="w-5 h-5 text-text-muted" />}
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-text-primary">Google Account</p>
                    <p className="text-[11px] text-text-muted">{settings.googleConnected ? 'Connected' : 'Not connected'}</p>
                  </div>
                </div>
                {settings.googleConnected ? (
                  <Button variant="outline" size="sm" onClick={handleDisconnectGoogle} className="bg-bg-tertiary border-border-subtle text-[#EF4444] hover:bg-[#EF444420]">
                    <Unlink className="w-3.5 h-3.5 mr-1.5" /> Disconnect
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleConnectGoogle} className="bg-[#10B981] text-white hover:brightness-110">
                    <Link className="w-3.5 h-3.5 mr-1.5" /> Connect
                  </Button>
                )}
              </div>
              {settings.googleConnected && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted mb-1.5 block">Sheet ID</Label>
                    <Input value={settings.sheetId} onChange={e => updateField('sheetId', e.target.value)}
                      placeholder="Google Sheet ID" className="bg-bg-primary border-border-subtle text-text-primary placeholder:text-text-muted" />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted mb-1.5 block">Sheet Name</Label>
                    <Input value={settings.sheetName} onChange={e => updateField('sheetName', e.target.value)}
                      placeholder="Sheet1" className="bg-bg-primary border-border-subtle text-text-primary placeholder:text-text-muted" />
                  </div>
                </div>
              )}
            </SettingsCard>
          </TabsContent>

          {/* ---- AI Tab ---- */}
          <TabsContent value="ai" className="space-y-4">
            <SettingsCard title="OpenRouter AI" description="Configure your AI model for email generation" icon={<Sparkles className="w-5 h-5 text-[#8B5CF6]" />}>
              <div>
                <Label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted mb-1.5 block">API Key</Label>
                <div className="relative">
                  <Input type={showApiKey ? 'text' : 'password'} value={settings.openRouterKey} onChange={e => updateField('openRouterKey', e.target.value)}
                    placeholder="sk-or-..." className="bg-bg-primary border-border-subtle text-text-primary placeholder:text-text-muted pr-10 font-mono" />
                  <button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted mb-1.5 block">Model</Label>
                <Input value={settings.openRouterModel} onChange={e => updateField('openRouterModel', e.target.value)}
                  placeholder="anthropic/claude-sonnet-4-20250514" className="bg-bg-primary border-border-subtle text-text-primary placeholder:text-text-muted font-mono" />
              </div>
              <Button onClick={handleSaveOpenRouter} className="bg-accent-blue text-white hover:brightness-110">
                <Save className="w-3.5 h-3.5 mr-1.5" /> Save AI Settings
              </Button>
            </SettingsCard>
          </TabsContent>

          {/* ---- App Tab ---- */}
          <TabsContent value="app" className="space-y-4">
            <SettingsCard title="Preferences" description="Customize your app experience" icon={<Palette className="w-5 h-5 text-[#F59E0B]" />}>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-[13px] font-medium text-text-primary">Notifications</p>
                    <p className="text-[11px] text-text-muted">Show toast notifications for actions</p>
                  </div>
                  <Switch checked={settings.notifications} onCheckedChange={v => updateField('notifications', v)} />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-[13px] font-medium text-text-primary">Auto-check Interval</p>
                    <p className="text-[11px] text-text-muted">Minutes between lead checks</p>
                  </div>
                  <Input type="number" value={settings.autoCheckInterval} onChange={e => updateField('autoCheckInterval', e.target.value)}
                    className="w-20 bg-bg-primary border-border-subtle text-text-primary text-center" min="5" max="120" />
                </div>
              </div>
            </SettingsCard>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

/* ==========================================
   SUB-COMPONENTS
   ========================================== */

function SettingsCard({ title, description, icon, children }: {
  title: string; description: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="bg-bg-secondary border border-border-subtle rounded-card p-6 space-y-4">
      <div className="flex items-center gap-3 pb-4 border-b border-border-subtle">
        <div className="w-10 h-10 rounded-lg bg-bg-tertiary flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h3 className="text-[16px] font-semibold text-text-primary">{title}</h3>
          <p className="text-[12px] text-text-muted">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
