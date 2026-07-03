import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-motion-shim';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Send,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  User,
  Building2,
  Loader2,
  Settings2,
  Hash,
  Type,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Copy,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  Tag,
  FolderOpen,
  Palette,
  Info,
  BookOpen,
  Zap,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { mockLeads } from '@/lib/mockData';
import type { Lead } from '@/types';

/* ================================================================== */
/*  CONSTANTS                                                         */
/* ================================================================== */

const toneOptions = [
  { value: 'Professional', label: 'Professional', desc: 'Polite, formal, direct' },
  { value: 'Friendly', label: 'Friendly', desc: 'Warm, conversational, approachable' },
  { value: 'Enthusiastic', label: 'Enthusiastic', desc: 'Energetic, exciting, passionate' },
  { value: 'Direct', label: 'Direct', desc: 'Short, to-the-point, no fluff' },
  { value: 'Casual', label: 'Casual', desc: 'Relaxed, informal, brief' },
];

const EMAIL_TYPES = [
  { value: 'cold-outreach', label: 'Cold Outreach', desc: 'First contact with a new prospect', icon: MessageSquare },
  { value: 'warm-intro', label: 'Warm Intro', desc: 'Following a referral or warm lead', icon: User },
  { value: 'follow-up', label: 'Follow-up', desc: 'Following up on a previous email', icon: RotateCcw },
  { value: 're-engagement', label: 'Re-engagement', desc: 'Reactivating an inactive lead', icon: RefreshCw },
  { value: 'proposal', label: 'Proposal', desc: 'Presenting a specific offer or deal', icon: BookOpen },
  { value: 'meeting-request', label: 'Meeting Request', desc: 'Scheduling a call or demo', icon: Zap },
] as const;

type EmailTypeValue = typeof EMAIL_TYPES[number]['value'];

const MAX_CHARS = 4000;

const VARIABLES = [
  { key: '{{name}}', desc: 'Lead full name' },
  { key: '{{company}}', desc: 'Company name' },
  { key: '{{email}}', desc: 'Lead email address' },
  { key: '{{topic}}', desc: 'Lead topic/industry' },
  { key: '{{myName}}', desc: 'Your name (from Settings)' },
  { key: '{{myCompany}}', desc: 'Your company (from Settings)' },
  { key: '{{date}}', desc: 'Current date' },
];

const TEMPLATES: Record<string, Record<string, { subject: string; body: string }>> = {
  'cold-outreach': {
    Professional: {
      subject: 'Partnership opportunity with {{company}}',
      body: `Hi {{name}},\n\nI hope this message finds you well. I'm reaching out because I've been following {{company}} and I'm impressed by your work in the {{topic}} space.\n\nI believe there may be a valuable partnership opportunity between our companies. I'd love to schedule a brief call to explore how we can work together.\n\nWould you be open to a 15-minute conversation next week?\n\nBest regards,\n{{myName}}`,
    },
    Friendly: {
      subject: 'Quick question about {{company}}',
      body: `Hey {{name}},\n\nI came across {{company}} recently and was really impressed by what you're building in the {{topic}} space.\n\nI'm working on something that could be a great fit for you — would love to chat and see if there's a good opportunity here.\n\nGot 10 minutes this week for a quick call?\n\nCheers,\n{{myName}}`,
    },
  },
  'follow-up': {
    Professional: {
      subject: 'Following up: {{company}} partnership',
      body: `Hi {{name}},\n\nI wanted to follow up on my previous email regarding a potential partnership between {{company}} and {{myCompany}}.\n\nI understand you may be busy, but I believe this could be mutually beneficial. Would you have a few minutes for a brief call this week?\n\nLooking forward to hearing from you.\n\nBest,\n{{myName}}`,
    },
    Friendly: {
      subject: 'Just following up, {{name}}',
      body: `Hey {{name}},\n\nJust wanted to bump this to the top of your inbox in case you missed my last message.\n\nI'd still love to explore how we can work with {{company}} — no pressure at all, just thought it might be worth another shot!\n\nLet me know if you'd be open to a quick chat.\n\nCheers,\n{{myName}}`,
    },
  },
};

/* ================================================================== */
/*  MAIN COMPONENT                                                    */
/* ================================================================== */

export default function AiComposer() {
  const location = useLocation();

  /* ---- State ---- */
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [tone, setTone] = useState('Professional');
  const [emailType, setEmailType] = useState<EmailTypeValue>('cold-outreach');
  const [purpose, setPurpose] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('lead');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [includeCallToAction, setIncludeCallToAction] = useState(true);
  const [personalizationLevel, setPersonalizationLevel] = useState(2);
  const [showVariables, setShowVariables] = useState(false);
  const [templatePreview, setTemplatePreview] = useState<{subject: string; body: string} | null>(null);

  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  /* ---- Load leads ---- */
  useEffect(() => {
    window.electronAPI?.storeGet('leads').then((val: unknown) => {
      if (val && Array.isArray(val) && (val as Lead[]).length > 0) setLeads(val as Lead[]);
    });
  }, []);

  /* ---- Route state (from Leads page "Send Email") ---- */
  useEffect(() => {
    if (location.state?.lead) {
      const lead = location.state.lead;
      setSelectedLeadId(lead.id);
      setPurpose(`Send ${emailType.replace(/-/g, ' ')} to ${lead.name}`);
      setAdditionalContext(location.state?.topicContext || '');
      setExpandedSection('ai');
    }
  }, [location.state]);

  const selectedLead = leads.find(l => l.id === selectedLeadId) || null;

  const charCount = subject.length + body.length;
  const charWarning = charCount > MAX_CHARS * 0.8;
  const charError = charCount > MAX_CHARS;

  /* ---- Lead selection ---- */
  const toggleSection = useCallback((section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  }, []);

  const insertVariable = useCallback((variable: string) => {
    if (bodyRef.current) {
      const el = bodyRef.current;
      const start = el.selectionStart || 0;
      const end = el.selectionEnd || 0;
      const newBody = body.slice(0, start) + variable + body.slice(end);
      setBody(newBody);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start + variable.length, start + variable.length);
      });
    }
  }, [body]);

  /* ---- AI Generate ---- */
  const handleGenerate = useCallback(async () => {
    if (!selectedLead && !purpose) {
      setError('Please select a lead or enter a purpose');
      return;
    }
    if (body.trim().length > 0) {
      if (!confirm('This will replace your current email. Continue?')) return;
    }

    setGenerating(true);
    setError('');
    setGenerated(false);

    try {
      const result = await window.electronAPI?.generateEmail({
        leadInfo: selectedLead
          ? { name: selectedLead.name, email: selectedLead.email, company: selectedLead.company, topic: (selectedLead as any).topic || '', notes: selectedLead.notes }
          : { name: '{name}', email: '{email}', company: '{company}', topic: '', notes: '' },
        tone,
        emailType,
        topicContext: additionalContext || (selectedLead ? (selectedLead as any).topic || '' : ''),
        purpose: purpose || undefined,
        additionalContext: additionalContext || undefined,
      });

      if (result?.success && result.email) {
        setSubject(result.email.subject);
        setBody(result.email.body);
        setGenerated(true);
        setExpandedSection('preview');
        toast.success('Email generated successfully');
      } else {
        setError(result?.error || 'Generation failed. Check API key in Settings.');
        toast.error(result?.error || 'Generation failed');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error or API unavailable';
      setError(msg);
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  }, [selectedLead, purpose, tone, emailType, additionalContext, body]);

  const handleRegenerate = useCallback(async () => {
    const ctx = additionalContext || purpose;
    setAdditionalContext(`${ctx}\n\n[Please try a different approach or angle]`);
    await handleGenerate();
  }, [handleGenerate, additionalContext, purpose]);

  /* ---- Send ---- */
  const handleSend = useCallback(async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error('Subject and body are required');
      return;
    }
    if (charError) {
      toast.error(`Email exceeds ${MAX_CHARS} characters`);
      return;
    }
    if (!selectedLead) {
      toast.error('Please select a lead first');
      return;
    }
    if (!selectedLead.email) {
      toast.error('Selected lead has no email address');
      return;
    }

    const personalizedBody = body
      .replace(/{{name}}/g, selectedLead.name)
      .replace(/{{company}}/g, selectedLead.company)
      .replace(/{{email}}/g, selectedLead.email)
      .replace(/{{topic}}/g, (selectedLead as any).topic || '');

    const personalizedSubject = subject
      .replace(/{{name}}/g, selectedLead.name)
      .replace(/{{company}}/g, selectedLead.company);

    const result = await window.electronAPI?.sendEmail({
      to: selectedLead.email,
      subject: personalizedSubject,
      body: personalizedBody,
      isHtml: false,
    });

    if (result?.success) {
      toast.success('Email sent successfully');
      setSubject('');
      setBody('');
      setGenerated(false);
    } else {
      toast.error(result?.error || 'Failed to send email');
    }
  }, [subject, body, selectedLead, charError]);

  /* ---- Copy ---- */
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  }, [subject, body]);

  /* ---- Preview with variables replaced ---- */
  const previewSubject = useMemo(() => {
    if (!selectedLead) return subject;
    return subject
      .replace(/{{name}}/g, selectedLead.name)
      .replace(/{{company}}/g, selectedLead.company)
      .replace(/{{email}}/g, selectedLead.email)
      .replace(/{{topic}}/g, (selectedLead as any).topic || '');
  }, [subject, selectedLead]);

  const previewBody = useMemo(() => {
    if (!selectedLead) return body;
    return body
      .replace(/{{name}}/g, selectedLead.name)
      .replace(/{{company}}/g, selectedLead.company)
      .replace(/{{email}}/g, selectedLead.email)
      .replace(/{{topic}}/g, (selectedLead as any).topic || '');
  }, [body, selectedLead]);

  /* ---- Load template ---- */
  const loadTemplate = useCallback((type: string, templateTone: string) => {
    const templates = TEMPLATES[type]?.[templateTone];
    if (templates) {
      setSubject(templates.subject);
      setBody(templates.body);
      setTone(templateTone);
      setEmailType(type as EmailTypeValue);
      setGenerated(true);
      setTemplatePreview(templates);
      setShowTemplates(false);
      toast.success(`${templateTone} ${type.replace(/-/g, ' ')} template loaded`);
    }
  }, []);

  /* ================================================================== */
  /*  RENDER                                                            */
  /* ================================================================== */
  return (
    <div className="flex h-full bg-bg-primary">
      {/* ===== Left Panel: Lead Selector ===== */}
      <div className="w-[280px] border-r border-border-subtle bg-bg-secondary flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
          <h3 className="text-[14px] font-semibold text-text-primary">Leads</h3>
          <span className="text-[11px] text-text-muted">{leads.length}</span>
        </div>
        <ScrollArea className="flex-1">
          {leads.map(lead => (
            <button
              key={lead.id}
              onClick={() => setSelectedLeadId(lead.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                selectedLeadId === lead.id ? 'bg-[#0EA5E915] border-l-2 border-l-accent-blue' : 'hover:bg-bg-tertiary border-l-2 border-l-transparent'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center text-[11px] font-semibold text-text-secondary shrink-0">
                {lead.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-text-primary truncate">{lead.name}</p>
                <p className="text-[11px] text-text-muted truncate">{lead.company}</p>
              </div>
              {selectedLeadId === lead.id && <Check className="w-4 h-4 text-accent-blue shrink-0" />}
            </button>
          ))}
        </ScrollArea>
      </div>

      {/* ===== Center: Composer ===== */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border-subtle">
          <h2 className="text-[18px] font-semibold text-text-primary">AI Email Composer</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="bg-bg-tertiary border-border-subtle text-text-primary hover:bg-bg-elevated" onClick={() => setShowTemplates(true)}>
              <BookOpen className="w-3.5 h-3.5 mr-1.5" />
              Templates
            </Button>
            <Button variant="outline" size="sm" className="bg-bg-tertiary border-border-subtle text-text-primary hover:bg-bg-elevated" onClick={() => setShowSettings(!showSettings)}>
              <Settings2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 p-6 max-w-3xl mx-auto w-full space-y-4">
          {/* --- Section 1: Lead Info --- */}
          <div className="border border-border-subtle rounded-card overflow-hidden">
            <button
              onClick={() => toggleSection('lead')}
              className="flex items-center justify-between w-full px-5 py-3 hover:bg-bg-tertiary transition-colors"
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-accent-blue" />
                <span className="text-[14px] font-semibold text-text-primary">Lead Information</span>
                {selectedLead && (
                  <Badge className="bg-accent-blue/20 text-accent-blue text-[11px] border-accent-blue/40 ml-2">
                    {selectedLead.name}
                  </Badge>
                )}
              </div>
              {expandedSection === 'lead' ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
            </button>
            {expandedSection === 'lead' && selectedLead && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-5 pb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted mb-1 block">Name</label>
                    <p className="text-[13px] text-text-primary">{selectedLead.name}</p>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted mb-1 block">Email</label>
                    <p className="text-[13px] text-text-secondary font-mono">{selectedLead.email}</p>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted mb-1 block">Company</label>
                    <p className="text-[13px] text-text-primary">{selectedLead.company}</p>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted mb-1 block">Topic</label>
                    <p className="text-[13px] text-text-primary">{(selectedLead as any).topic || 'General'}</p>
                  </div>
                </div>
                {selectedLead.notes && (
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted mb-1 block">Notes</label>
                    <p className="text-[12px] text-text-secondary bg-bg-tertiary rounded-md p-2">{selectedLead.notes}</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* --- Section 2: Email Type & Tone --- */}
          <div className="border border-border-subtle rounded-card overflow-hidden">
            <button onClick={() => toggleSection('type')} className="flex items-center justify-between w-full px-5 py-3 hover:bg-bg-tertiary transition-colors">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-accent-cyan" />
                <span className="text-[14px] font-semibold text-text-primary">Email Type & Tone</span>
              </div>
              {expandedSection === 'type' ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
            </button>
            {expandedSection === 'type' && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="px-5 pb-4 space-y-4">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted mb-2 block">Email Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {EMAIL_TYPES.map(et => {
                      const Icon = et.icon;
                      return (
                        <button key={et.value} onClick={() => setEmailType(et.value)}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${
                            emailType === et.value ? 'border-accent-blue bg-[#0EA5E915]' : 'border-border-subtle hover:border-border-default'
                          }`}
                        >
                          <Icon className="w-4 h-4 text-text-muted shrink-0" />
                          <div>
                            <p className="text-[12px] font-medium text-text-primary">{et.label}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted mb-2 block">Tone</label>
                  <div className="flex flex-wrap gap-2">
                    {toneOptions.map(t => (
                      <button key={t.value} onClick={() => setTone(t.value)}
                        className={`px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-all ${
                          tone === t.value ? 'border-accent-blue bg-[#0EA5E915] text-accent-blue' : 'border-border-subtle text-text-secondary hover:border-border-default'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* --- Section 3: AI Context --- */}
          <div className="border border-border-subtle rounded-card overflow-hidden">
            <button onClick={() => toggleSection('ai')} className="flex items-center justify-between w-full px-5 py-3 hover:bg-bg-tertiary transition-colors">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#F59E0B]" />
                <span className="text-[14px] font-semibold text-text-primary">AI Generation Settings</span>
              </div>
              {expandedSection === 'ai' ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
            </button>
            {expandedSection === 'ai' && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="px-5 pb-4 space-y-4">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted mb-1.5 block">Purpose / Goal</label>
                  <Input value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="e.g., Schedule a demo call with the prospect..."
                    className="bg-bg-primary border-border-subtle text-text-primary placeholder:text-text-muted" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted mb-1.5 block">Additional Context</label>
                  <Textarea value={additionalContext} onChange={e => setAdditionalContext(e.target.value)} placeholder="Add any details the AI should know..."
                    rows={3} className="bg-bg-primary border-border-subtle text-text-primary placeholder:text-text-muted resize-none" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch checked={includeCallToAction} onCheckedChange={setIncludeCallToAction} />
                    <span className="text-[12px] text-text-secondary">Include call-to-action</span>
                  </div>
                  <Button onClick={handleGenerate} disabled={generating}
                    className="bg-gradient-to-r from-accent-blue to-accent-cyan text-white hover:brightness-110 transition-all">
                    {generating ? (
                      <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Generating...</span>
                    ) : (
                      <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" />Generate</span>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </div>

          {/* --- Section 4: Subject --- */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted mb-1.5 block">Subject Line</label>
            <Input ref={subjectRef} value={subject} onChange={e => setSubject(e.target.value)} placeholder="Enter email subject..."
              className="bg-bg-primary border-border-subtle text-text-primary placeholder:text-text-muted" />
          </div>

          {/* --- Section 5: Body --- */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted">Email Body</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowVariables(!showVariables)}
                  className={`text-[11px] font-medium ${showVariables ? 'text-accent-blue' : 'text-text-muted hover:text-text-secondary'} transition-colors`}>
                  Variables
                </button>
                <span className={`text-[11px] ${charError ? 'text-[#EF4444]' : charWarning ? 'text-[#F59E0B]' : 'text-text-muted'}`}>
                  {charCount}/{MAX_CHARS}
                </span>
              </div>
            </div>
            <Textarea ref={bodyRef} value={body} onChange={e => setBody(e.target.value)} placeholder="Enter email body..."
              rows={12} className="bg-bg-primary border-border-subtle text-text-primary placeholder:text-text-muted resize-none font-mono text-[13px] leading-relaxed" />
            {charWarning && (
              <p className={`text-[11px] mt-1 ${charError ? 'text-[#EF4444]' : 'text-[#F59E0B]'}`}>
                {charError ? `Email exceeds ${MAX_CHARS} character limit` : `${Math.round((charCount / MAX_CHARS) * 100)}% of limit used`}
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-[#EF4444] text-[13px] bg-[#EF444415] border border-[#EF444440] rounded-lg px-4 py-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              {generated && (
                <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={generating}
                  className="bg-bg-tertiary border-border-subtle text-text-primary hover:bg-bg-elevated">
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  Regenerate
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleCopy}
                className="bg-bg-tertiary border-border-subtle text-text-primary hover:bg-bg-elevated">
                {copied ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <Button onClick={handleSend} disabled={!subject.trim() || !body.trim() || charError || !selectedLead}
              className="bg-accent-blue text-white hover:brightness-110 transition-all">
              <Send className="w-4 h-4 mr-2" />
              Send Email
            </Button>
          </div>
        </div>
      </div>

      {/* ===== Right Panel: Live Preview ===== */}
      <div className="w-[380px] border-l border-border-subtle bg-bg-secondary flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
          <h3 className="text-[14px] font-semibold text-text-primary">Preview</h3>
          <Badge className="bg-accent-blue/20 text-accent-blue text-[11px] border-accent-blue/40">
            {emailType.replace(/-/g, ' ')}
          </Badge>
        </div>
        <ScrollArea className="flex-1 p-4">
          {/* Email preview card */}
          <div className="bg-bg-primary border border-border-subtle rounded-card p-5 space-y-4">
            {/* From */}
            <div className="flex items-center gap-3 pb-4 border-b border-border-subtle">
              <div className="w-10 h-10 rounded-full bg-bg-elevated flex items-center justify-center text-[14px] font-semibold text-text-secondary">
                ME
              </div>
              <div>
                <p className="text-[13px] font-medium text-text-primary">Your Name</p>
                <p className="text-[11px] text-text-muted">your.email@company.com</p>
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.04em] text-text-muted">Subject</label>
              <p className="text-[14px] text-text-primary font-medium mt-0.5">{previewSubject || <span className="text-text-muted italic">No subject</span>}</p>
            </div>

            {/* Body */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.04em] text-text-muted">Body</label>
              <div className="mt-1 text-[13px] text-text-primary whitespace-pre-wrap leading-relaxed">
                {previewBody || <span className="text-text-muted italic">No content yet</span>}
              </div>
            </div>
          </div>

          {/* Lead context */}
          {selectedLead && (
            <div className="mt-4 bg-bg-primary border border-border-subtle rounded-card p-4">
              <h4 className="text-[12px] font-semibold text-text-muted uppercase tracking-[0.04em] mb-2">Lead Context</h4>
              <div className="space-y-1.5 text-[12px]">
                <p><span className="text-text-muted">Name:</span> <span className="text-text-primary">{selectedLead.name}</span></p>
                <p><span className="text-text-muted">Company:</span> <span className="text-text-primary">{selectedLead.company}</span></p>
                <p><span className="text-text-muted">Topic:</span> <span className="text-text-primary">{(selectedLead as any).topic || 'General'}</span></p>
                <p><span className="text-text-muted">Status:</span> <span className="text-text-primary">{selectedLead.status}</span></p>
              </div>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
