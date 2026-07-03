import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from '@/lib/framer-motion-shim';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Play,
  Pause,
  Pencil,
  Trash2,
  Eye,
  ArrowLeft,
  LayoutDashboard,
  ListOrdered,
  Users,
  BarChart3,
  Settings2,
  Send,
  EyeIcon,
  MessageCircle,
  UserCheck,
  Clock,
  Sparkles,
  X,
  ChevronDown,
  GripVertical,
  Mail,
  CheckCircle2,
  AlertCircle,
  Zap,
  Calendar,
  TrendingUp,
  RotateCcw,
  Copy,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatusBadge from '@/components/StatusBadge';
import type { Campaign, CampaignStatus, EmailStep } from '@/types';
import { mockCampaigns, mockLeads, mockActivityLogs } from '@/lib/mockData';

/* ------------------------------------------------------------------ */
/*  Constants & helpers                                               */
/* ------------------------------------------------------------------ */

const easing = [0.16, 1, 0.3, 1] as [number, number, number, number];

const statusFilters: ('all' | CampaignStatus)[] = ['all', 'draft', 'active', 'paused', 'completed'];

const toneOptions = ['Professional', 'Friendly', 'Direct', 'Casual', 'Enthusiastic'];

const delayOptions = [
  { label: 'No delay', value: 0 },
  { label: '1 hour', value: 1 },
  { label: '3 hours', value: 3 },
  { label: '6 hours', value: 6 },
  { label: '1 day', value: 24 },
  { label: '2 days', value: 48 },
  { label: '3 days', value: 72 },
  { label: '5 days', value: 120 },
  { label: '1 week', value: 168 },
];

const toneColors: Record<string, string> = {
  Professional: '#3B82F6',
  Friendly: '#10B981',
  Direct: '#F59E0B',
  Casual: '#8B5CF6',
  Enthusiastic: '#EF4444',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

/* ------------------------------------------------------------------ */
/*  Mock chart data generators                                         */
/* ------------------------------------------------------------------ */

function generateDailySendData(campaign: Campaign) {
  const days = 7;
  const data = [];
  const baseDate = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - i);
    const daySent = Math.floor(Math.random() * (campaign.leadsSent / days)) + 1;
    const dayOpened = Math.floor(daySent * (campaign.openRate / 100));
    const dayReplied = Math.floor(daySent * (campaign.replyRate / 100));
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sent: daySent,
      opened: dayOpened,
      replied: dayReplied,
    });
  }
  return data;
}

function generateLeadStatusData() {
  return [
    { name: 'New', value: mockLeads.filter(l => l.status === 'New').length, color: '#3B82F6' },
    { name: 'Reached', value: mockLeads.filter(l => l.status === 'Reached').length, color: '#8B5CF6' },
    { name: 'Warm', value: mockLeads.filter(l => l.status === 'Warm').length, color: '#F59E0B' },
    { name: 'Hot', value: mockLeads.filter(l => l.status === 'Hot').length, color: '#EF4444' },
    { name: 'Cold', value: mockLeads.filter(l => l.status === 'Cold').length, color: '#6B7280' },
  ];
}

const bestSubjectLines = [
  { subject: 'Quick question about {company}', rate: 42 },
  { subject: 'Following up on our conversation', rate: 38 },
  { subject: 'Partnership opportunity with {company}', rate: 35 },
  { subject: 'Introducing our new AI feature', rate: 31 },
  { subject: 'Ideas for {company} growth', rate: 28 },
];

/* ------------------------------------------------------------------ */
/*  Campaigns Page                                                    */
/* ------------------------------------------------------------------ */

export default function Campaigns() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  useEffect(() => {
    window.electronAPI?.storeGet('campaigns').then((val: unknown) => {
      if (val && Array.isArray(val)) setCampaigns(val as Campaign[]);
    });
  }, []);
  useEffect(() => {
    if (campaigns.length > 0 && campaigns !== mockCampaigns) {
      window.electronAPI?.storeSet('campaigns', campaigns);
    }
  }, [campaigns]);
  const [statusFilter, setStatusFilter] = useState<'all' | CampaignStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(id || null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');

  /* ----- Derived state ----- */
  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [campaigns, statusFilter, searchQuery]);

  const stats = useMemo(() => ({
    total: campaigns.length,
    active: campaigns.filter(c => c.status === 'active').length,
    completed: campaigns.filter(c => c.status === 'completed').length,
    totalSent: campaigns.reduce((acc, c) => acc + c.leadsSent, 0),
  }), [campaigns]);

  /* ----- Send Campaign Emails ----- */
  const sendCampaignEmails = useCallback(async (campaign: Campaign) => {
    if (!campaign.sequence.length || !campaign.leadIds?.length) {
      toast.error('Campaign has no sequence steps or no leads assigned');
      return;
    }

    // Get leads from storage
    const allLeads = (await window.electronAPI?.storeGet('leads')) as Array<{ id: string; name: string; email: string; company: string; topic?: string; notes?: string }> || [];
    const campaignLeads = allLeads.filter(l => campaign.leadIds?.includes(l.id));
    if (!campaignLeads.length) {
      toast.error('No valid leads found for this campaign');
      return;
    }

    // Use the first step for initial send
    const step = campaign.sequence[0];
    let sentCount = 0;

    toast.info(`Sending "${campaign.name}" to ${campaignLeads.length} leads...`);

    for (const lead of campaignLeads) {
      try {
        // Personalize subject and body with lead data
        const subject = step.subject
          .replace(/{name}/g, lead.name)
          .replace(/{company}/g, lead.company)
          .replace(/{email}/g, lead.email)
          .replace(/{topic}/g, lead.topic || '');
        const body = step.body
          .replace(/{name}/g, lead.name)
          .replace(/{company}/g, lead.company)
          .replace(/{email}/g, lead.email)
          .replace(/{topic}/g, lead.topic || '');

        const result = await window.electronAPI?.sendEmail({
          to: lead.email,
          subject,
          body,
          isHtml: false,
        });

        if (result?.success) {
          sentCount++;
        }
      } catch {
        // Skip failed sends, continue with next lead
      }
    }

    // Update campaign stats
    setCampaigns(prev => prev.map(c => {
      if (c.id !== campaign.id) return c;
      return {
        ...c,
        leadsSent: c.leadsSent + sentCount,
        updatedAt: new Date().toISOString(),
      };
    }));

    if (sentCount > 0) {
      toast.success(`Sent ${sentCount} email${sentCount > 1 ? 's' : ''} for "${campaign.name}"`);
    } else {
      toast.error('No emails were sent. Check your email settings.');
    }
  }, []);

  /* ----- Actions ----- */
  const toggleStatus = useCallback((campaignId: string) => {
    setCampaigns(prev => {
      const campaign = prev.find(c => c.id === campaignId);
      if (!campaign) return prev;

      // Going from draft -> active: send emails
      if (campaign.status === 'draft') {
        sendCampaignEmails(campaign);
        return prev.map(c => c.id === campaignId ? { ...c, status: 'active' as CampaignStatus, updatedAt: new Date().toISOString() } : c);
      }

      // Toggle between active <-> paused
      const next: CampaignStatus = campaign.status === 'active' ? 'paused' : campaign.status === 'paused' ? 'active' : campaign.status;
      return prev.map(c => c.id === campaignId ? { ...c, status: next, updatedAt: new Date().toISOString() } : c);
    });
  }, [sendCampaignEmails]);

  const duplicateCampaign = useCallback((campaign: Campaign) => {
    const newCampaign: Campaign = {
      ...campaign,
      id: generateId(),
      name: `${campaign.name} (Copy)`,
      status: 'draft' as CampaignStatus,
      leadsSent: 0,
      leadsOpened: 0,
      leadsReplied: 0,
      openRate: 0,
      replyRate: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCampaigns(prev => [newCampaign, ...prev]);
  }, []);

  const deleteCampaign = useCallback((campaignId: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== campaignId));
    if (selectedCampaignId === campaignId) setSelectedCampaignId(null);
  }, [selectedCampaignId]);

  const updateCampaignName = useCallback((campaignId: string, name: string) => {
    setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, name, updatedAt: new Date().toISOString() } : c));
  }, []);

  const addCampaign = useCallback((campaign: Campaign) => {
    setCampaigns(prev => [campaign, ...prev]);
  }, []);

  /* ----- Select a campaign ----- */
  const selectCampaign = useCallback((campaignId: string) => {
    setSelectedCampaignId(campaignId);
  }, []);

  const backToList = useCallback(() => {
    setSelectedCampaignId(null);
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Render: Campaign Detail View                                    */
  /* ---------------------------------------------------------------- */
  if (selectedCampaign) {
    return (
      <CampaignDetail
        campaign={selectedCampaign}
        onBack={backToList}
        onToggleStatus={() => toggleStatus(selectedCampaign.id)}
        onDuplicate={() => duplicateCampaign(selectedCampaign)}
        onDelete={() => deleteCampaign(selectedCampaign.id)}
        onUpdateName={(name) => updateCampaignName(selectedCampaign.id, name)}
        onUpdateCampaign={(updated) => {
          setCampaigns(prev => prev.map(c => c.id === updated.id ? updated : c));
        }}
        onSendCampaign={() => sendCampaignEmails(selectedCampaign)}
        editingName={editingName === selectedCampaign.id}
        editNameValue={editNameValue}
        onStartEditingName={() => {
          setEditingName(selectedCampaign.id);
          setEditNameValue(selectedCampaign.name);
        }}
        onNameInputChange={setEditNameValue}
        onSaveName={() => {
          if (editNameValue.trim()) {
            updateCampaignName(selectedCampaign.id, editNameValue.trim());
          }
          setEditingName(null);
        }}
        onCancelEdit={() => setEditingName(null)}
      />
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Render: Campaign List View                                      */
  /* ---------------------------------------------------------------- */
  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 pt-8 pb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-[24px] font-semibold text-text-primary tracking-tight">Campaigns</h1>
          <span className="text-[13px] text-text-muted bg-bg-tertiary px-2.5 py-0.5 rounded-full">
            {stats.total} campaigns
          </span>
        </div>
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-accent-blue text-white hover:brightness-110 hover:-translate-y-px transition-all duration-200">
              <Plus className="w-4 h-4" />
              <span className="text-[13px] font-semibold">New Campaign</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-bg-secondary border-border-default">
            <CreateCampaignModal
              onCreate={(campaign) => {
                addCampaign(campaign);
                setCreateModalOpen(false);
              }}
              onCancel={() => setCreateModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-4 gap-4 px-8 mb-6">
        <StatCard label="Total Campaigns" value={stats.total} icon={<Mail className="w-4 h-4 text-accent-blue" />} />
        <StatCard label="Active" value={stats.active} icon={<Play className="w-4 h-4 text-[#10B981]" />} accent="#10B981" />
        <StatCard label="Completed" value={stats.completed} icon={<CheckCircle2 className="w-4 h-4 text-[#3B82F6]" />} accent="#3B82F6" />
        <StatCard label="Total Emails Sent" value={stats.totalSent} icon={<Send className="w-4 h-4 text-accent-cyan" />} accent="#22D3EE" />
      </div>

      {/* Filter bar */}
      <div className="flex items-center justify-between px-8 mb-4">
        <div className="flex items-center gap-1 bg-bg-tertiary rounded-lg p-0.5">
          {statusFilters.map(filter => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`
                px-3 py-1.5 rounded-md text-[12px] font-medium transition-all duration-150
                ${statusFilter === filter
                  ? 'bg-bg-elevated text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
                }
              `}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
          <Input
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 w-[240px] bg-bg-secondary border-border-subtle text-text-primary text-[13px] placeholder:text-text-muted"
          />
        </div>
      </div>

      {/* Campaign grid */}
      <div className="flex-1 overflow-y-auto px-8 pb-8">
        {filteredCampaigns.length === 0 ? (
          <EmptyState onCreate={() => setCreateModalOpen(true)} />
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <AnimatePresence>
              {filteredCampaigns.map((campaign, i) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, delay: i * 0.08, ease: easing }}
                >
                  <CampaignCard
                    campaign={campaign}
                    onClick={() => selectCampaign(campaign.id)}
                    onToggleStatus={() => toggleStatus(campaign.id)}
                    onDuplicate={() => duplicateCampaign(campaign)}
                    onDelete={() => deleteCampaign(campaign.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat Card                                                         */
/* ------------------------------------------------------------------ */
function StatCard({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent?: string }) {
  return (
    <div className="bg-bg-secondary border border-border-subtle rounded-[10px] p-4 hover:border-border-default transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted">{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accent || '#0EA5E9'}15` }}>
          {icon}
        </div>
      </div>
      <p className="text-[22px] font-semibold text-text-primary leading-tight">{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Campaign Card                                                     */
/* ------------------------------------------------------------------ */
function CampaignCard({
  campaign,
  onClick,
  onToggleStatus,
  onDuplicate,
  onDelete,
}: {
  campaign: Campaign;
  onClick: () => void;
  onToggleStatus: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const progress = campaign.leadsTotal > 0 ? Math.round((campaign.leadsSent / campaign.leadsTotal) * 100) : 0;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className="bg-bg-secondary border border-border-subtle rounded-[10px] p-5 cursor-pointer hover:border-border-default hover:shadow-[0_4px_16px_#00000020] hover:-translate-y-0.5 transition-all duration-200 relative group"
    >
      {/* Action overlay on hover */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute top-3 right-3 flex items-center gap-1 z-10"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={onToggleStatus}
              className="w-7 h-7 rounded-md bg-bg-elevated border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-border-default transition-all"
              title={campaign.status === 'active' ? 'Pause' : campaign.status === 'draft' ? 'Start Campaign' : 'Resume'}
            >
              {campaign.status === 'active' ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
            <button
              onClick={onDuplicate}
              className="w-7 h-7 rounded-md bg-bg-elevated border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-border-default transition-all"
              title="Duplicate"
            >
              <Copy className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Delete this campaign? This cannot be undone.')) onDelete();
              }}
              className="w-7 h-7 rounded-md bg-[#EF444420] border border-[#EF444440] flex items-center justify-center text-[#EF4444] hover:bg-[#EF444430] transition-all"
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-[15px] font-semibold text-text-primary truncate pr-16">{campaign.name}</h3>
        <StatusBadge status={campaign.status === 'active' ? 'Active' : campaign.status === 'paused' ? 'Paused' : campaign.status === 'completed' ? 'Sent' : 'Idle'} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-[13px] text-text-primary font-medium">{campaign.leadsSent}/{campaign.leadsTotal}</p>
          <p className="text-[11px] text-text-muted mt-0.5">Sent</p>
        </div>
        <div>
          <p className="text-[13px] text-text-primary font-medium">{campaign.openRate}%</p>
          <p className="text-[11px] text-text-muted mt-0.5">Open Rate</p>
        </div>
        <div>
          <p className="text-[13px] text-text-primary font-medium">{campaign.replyRate}%</p>
          <p className="text-[11px] text-text-muted mt-0.5">Reply Rate</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 h-1 bg-bg-tertiary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #0EA5E9, #22D3EE)' }}
          />
        </div>
        <span className="text-[11px] text-text-muted shrink-0">{progress}%</span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[11px] text-text-muted">
        <span>Created {formatDate(campaign.createdAt)}</span>
        <span>{campaign.leadsTotal} leads</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty State                                                       */
/* ------------------------------------------------------------------ */
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-60 h-48 bg-bg-tertiary rounded-xl flex items-center justify-center mb-6">
        <Mail className="w-16 h-16 text-text-muted opacity-30" />
      </div>
      <h3 className="text-[18px] font-semibold text-text-primary mb-2">No campaigns yet</h3>
      <p className="text-[13px] text-text-secondary mb-6 max-w-sm text-center">
        Create your first outreach campaign and let AI handle the rest.
      </p>
      <Button
        onClick={onCreate}
        className="flex items-center gap-2 bg-accent-blue text-white hover:brightness-110 hover:-translate-y-px transition-all duration-200"
      >
        <Plus className="w-4 h-4" />
        <span className="text-[13px] font-semibold">Create Campaign</span>
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Create Campaign Modal                                             */
/* ------------------------------------------------------------------ */
function CreateCampaignModal({ onCreate, onCancel }: { onCreate: (c: Campaign) => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [step, setStep] = useState(1);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [generateAI, setGenerateAI] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sequence, setSequence] = useState<EmailStep[]>([]);

  const toggleLead = (id: string) => {
    setSelectedLeads(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleGenerateSequence = async () => {
    setGenerating(true);
    toast.info('AI is generating your campaign sequence...');
    try {
      // Generate 3 steps: initial, follow-up, breakup
      const steps: EmailStep[] = [];
      const stepConfigs = [
        { order: 1, delay: 0, tone: 'Professional', type: 'cold-outreach' as const, desc: 'Initial cold outreach' },
        { order: 2, delay: 72, tone: 'Friendly', type: 'follow-up' as const, desc: 'Follow-up email' },
        { order: 3, delay: 120, tone: 'Direct', type: 're-engagement' as const, desc: 'Final breakup email' },
      ];

      for (const cfg of stepConfigs) {
        const result = await window.electronAPI?.generateEmail({
          leadInfo: { name: '{name}', email: '{email}', company: '{company}', topic: name || 'general', notes: description || '' },
          tone: cfg.tone,
          emailType: cfg.type,
          topicContext: name || '',
          purpose: cfg.desc,
          additionalContext: description || '',
        });
        if (result?.success && result.email) {
          steps.push({
            id: generateId(),
            order: cfg.order,
            subject: result.email.subject,
            body: result.email.body,
            delay: cfg.delay,
            aiGenerated: true,
            tone: cfg.tone,
          });
        }
      }

      if (steps.length > 0) {
        setSequence(steps);
        toast.success(`Generated ${steps.length} email steps with AI`);
        setStep(3);
      } else {
        toast.error('AI generation failed. Check your API key in Settings.');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    }
    setGenerating(false);
  };

  const handleCreate = () => {
    const seq = sequence.length > 0 ? sequence : [
      { id: generateId(), order: 1, subject: '', body: '', delay: 0, aiGenerated: false, tone: 'Professional' },
    ];
    const campaign: Campaign = {
      id: generateId(),
      name,
      status: 'draft',
      leadsTotal: selectedLeads.size || 0,
      leadsSent: 0,
      leadsOpened: 0,
      leadsReplied: 0,
      openRate: 0,
      replyRate: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sequence: seq,
      leadIds: selectedLeads.size > 0 ? Array.from(selectedLeads) : undefined,
    };
    onCreate(campaign);
  };

  return (
    <div className="bg-bg-secondary rounded-[14px] p-6">
      <DialogHeader>
        <DialogTitle className="text-[20px] font-semibold text-text-primary">Create New Campaign</DialogTitle>
      </DialogHeader>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mt-4 mb-6">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold ${s === step ? 'bg-accent-blue text-white' : s < step ? 'bg-[#10B981] text-white' : 'bg-bg-tertiary text-text-muted'}`}>
              {s < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : s}
            </div>
            {s < 3 && <div className={`w-12 h-0.5 ${s < step ? 'bg-[#10B981]' : 'bg-bg-tertiary'}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted mb-1.5 block">Campaign Name *</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Q1 Outreach Campaign"
              className="bg-bg-primary border-border-subtle text-text-primary placeholder:text-text-muted"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted mb-1.5 block">Objective / Description</label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What outcome do you want? This helps AI generate better emails..."
              rows={3}
              className="bg-bg-primary border-border-subtle text-text-primary placeholder:text-text-muted"
            />
          </div>
          {description && generateAI && (
            <div className="bg-[#22D3EE10] border border-[#22D3EE30] rounded-lg p-3 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-accent-cyan shrink-0 mt-0.5" />
              <p className="text-[12px] text-text-secondary">
                AI will generate a 3-step email sequence based on your description.
              </p>
            </div>
          )}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Switch checked={generateAI} onCheckedChange={setGenerateAI} />
              <span className="text-[12px] text-text-secondary">Generate AI sequence</span>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={onCancel} className="text-text-secondary">Cancel</Button>
            <Button
              onClick={() => generateAI && description ? handleGenerateSequence() : setStep(2)}
              disabled={!name.trim()}
              className="bg-accent-blue text-white hover:brightness-110"
            >
              {generateAI && description ? (
                generating ? 'Generating...' : (
                  <span className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" />Generate Sequence</span>
                )
              ) : 'Continue'}
            </Button>
          </div>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted">Select Leads</label>
            <span className="text-[12px] text-text-muted">{selectedLeads.size} selected</span>
          </div>
          <div className="max-h-[300px] overflow-y-auto border border-border-subtle rounded-lg">
            {mockLeads.map(lead => (
              <label
                key={lead.id}
                className="flex items-center gap-3 px-3 py-2.5 border-b border-border-subtle last:border-0 hover:bg-bg-tertiary cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedLeads.has(lead.id)}
                  onChange={() => toggleLead(lead.id)}
                  className="rounded border-border-subtle"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-text-primary truncate">{lead.name}</p>
                  <p className="text-[11px] text-text-muted">{lead.email}</p>
                </div>
                <StatusBadge status={lead.status} />
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setStep(1)} className="text-text-secondary">Back</Button>
            <Button onClick={() => setStep(3)} className="bg-accent-blue text-white hover:brightness-110">Continue</Button>
          </div>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {sequence.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-accent-cyan" />
                <span className="text-[13px] text-text-primary font-medium">AI-Generated Sequence</span>
              </div>
              {sequence.map((step, i) => (
                <div key={step.id} className="bg-bg-primary border border-border-subtle rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-bg-tertiary flex items-center justify-center text-[11px] font-semibold text-text-secondary">
                      {step.order}
                    </div>
                    <span className="text-[12px] font-medium text-text-primary flex-1 truncate">{step.subject}</span>
                    {step.aiGenerated && (
                      <span className="text-[10px] font-semibold text-accent-cyan bg-[#22D3EE20] px-1.5 py-0.5 rounded">AI</span>
                    )}
                  </div>
                  <p className="text-[11px] text-text-secondary line-clamp-2 ml-8">{step.body}</p>
                  {i < sequence.length - 1 && (
                    <div className="flex items-center gap-2 mt-2 ml-8">
                      <Clock className="w-3 h-3 text-text-muted" />
                      <span className="text-[11px] text-text-muted">Wait {step.delay}h</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-text-muted text-[13px]">
              Manual sequence — you can add steps after creation.
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setStep(2)} className="text-text-secondary">Back</Button>
            <Button onClick={handleCreate} className="bg-accent-blue text-white hover:brightness-110">
              Create Campaign
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
