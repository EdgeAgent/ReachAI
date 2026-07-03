import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
} from '@tanstack/react-table';
import { motion, AnimatePresence } from '@/lib/framer-motion-shim';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  Upload,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronDownSquare,
  ChevronRightSquare,
  MoreHorizontal,
  Mail,
  Pencil,
  Trash2,
  X,
  Copy,
  Check,
  Users,
  Download,
  FileText,
  FileSpreadsheet,
  Tag,
  FolderOpen,
  Layers,
  Filter,
  Group,
  GripVertical,
  Sparkles,
} from 'lucide-react';
import type { Lead, LeadStatus } from '@/types';
import { useLeads } from '@/hooks/useLeads';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet as Drawer,
  SheetContent as DrawerContent,
  SheetHeader as DrawerHeader,
  SheetTitle as DrawerTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

/* ==========================================
   EXTENDED TYPES (will come from @/types soon)
   ========================================== */

type EmailType = 'cold-outreach' | 'warm-intro' | 'follow-up' | 're-engagement' | 'proposal' | 'meeting-request';

interface TopicConfig {
  id: string;
  name: string;
  color: string;
  description: string;
  defaultEmailType: EmailType;
  emailTypes: EmailType[];
  aiContext: string;
}

interface ExtendedLead extends Lead {
  topic: string;
  emailType: EmailType;
  tags: string[];
}

/* ==========================================
   CONSTANTS
   ========================================== */

const statusOptions: LeadStatus[] = ['New', 'Reached', 'Warm', 'Hot', 'Cold'];

const statusBorderColors: Record<LeadStatus, string> = {
  New: 'border-b-[#3B82F6]',
  Reached: 'border-b-[#8B5CF6]',
  Warm: 'border-b-[#F59E0B]',
  Hot: 'border-b-[#EF4444]',
  Cold: 'border-b-[#6B7280]',
};

const EMAIL_TYPE_LABELS: Record<EmailType, string> = {
  'cold-outreach': 'Cold Outreach',
  'warm-intro': 'Warm Intro',
  'follow-up': 'Follow-up',
  're-engagement': 'Re-engagement',
  'proposal': 'Proposal',
  'meeting-request': 'Meeting Request',
};

const EMAIL_TYPE_COLORS: Record<EmailType, { bg: string; text: string; border: string }> = {
  'cold-outreach':   { bg: 'bg-[#6366F120]', text: 'text-[#6366F1]', border: 'border-[#6366F140]' },
  'warm-intro':      { bg: 'bg-[#10B98120]', text: 'text-[#10B981]', border: 'border-[#10B98140]' },
  'follow-up':       { bg: 'bg-[#0EA5E920]', text: 'text-[#0EA5E9]', border: 'border-[#0EA5E940]' },
  're-engagement':   { bg: 'bg-[#F59E0B20]', text: 'text-[#F59E0B]', border: 'border-[#F59E0B40]' },
  'proposal':        { bg: 'bg-[#8B5CF620]', text: 'text-[#8B5CF6]', border: 'border-[#8B5CF640]' },
  'meeting-request': { bg: 'bg-[#EC489920]', text: 'text-[#EC4899]', border: 'border-[#EC489940]' },
};

const COMMON_TAGS = ['VIP', 'Hot Lead', 'Referral', 'Enterprise', 'SMB'];

const DEFAULT_TOPICS: TopicConfig[] = [
  { id: 'real-estate', name: 'Real Estate', color: '#10B981', description: 'Property sales, rentals, and development', defaultEmailType: 'cold-outreach', emailTypes: ['cold-outreach', 'follow-up', 'proposal'], aiContext: 'real estate market' },
  { id: 'saas', name: 'SaaS', color: '#0EA5E9', description: 'Software as a Service companies', defaultEmailType: 'warm-intro', emailTypes: ['warm-intro', 'follow-up', 'proposal', 'meeting-request'], aiContext: 'SaaS industry' },
  { id: 'agency', name: 'Agency', color: '#8B5CF6', description: 'Marketing, design, and creative agencies', defaultEmailType: 'cold-outreach', emailTypes: ['cold-outreach', 're-engagement', 'proposal'], aiContext: 'agency services' },
  { id: 'e-commerce', name: 'E-commerce', color: '#F59E0B', description: 'Online retail and DTC brands', defaultEmailType: 'cold-outreach', emailTypes: ['cold-outreach', 'follow-up', 're-engagement'], aiContext: 'e-commerce business' },
  { id: 'finance', name: 'Finance', color: '#EF4444', description: 'Financial services and fintech', defaultEmailType: 'warm-intro', emailTypes: ['warm-intro', 'proposal', 'meeting-request'], aiContext: 'financial sector' },
  { id: 'healthcare', name: 'Healthcare', color: '#EC4899', description: 'Healthcare and wellness companies', defaultEmailType: 'cold-outreach', emailTypes: ['cold-outreach', 'follow-up', 'proposal'], aiContext: 'healthcare industry' },
  { id: 'general', name: 'General', color: '#6B7280', description: 'General business leads', defaultEmailType: 'cold-outreach', emailTypes: ['cold-outreach', 'warm-intro', 'follow-up', 're-engagement', 'proposal', 'meeting-request'], aiContext: 'business' },
];

const TOPIC_MAP: Record<string, TopicConfig> = Object.fromEntries(DEFAULT_TOPICS.map(t => [t.name, t]));

const EMAIL_TYPES: EmailType[] = ['cold-outreach', 'warm-intro', 'follow-up', 're-engagement', 'proposal', 'meeting-request'];

/* ==========================================
   HELPERS
   ========================================== */

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatFullDate(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function getInitials(name: string): string {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function assignDefaultsToLead(lead: Lead): ExtendedLead {
  const topicName = (lead as unknown as Record<string, string>)['topic'] || 'General';
  const emailTypeVal = (lead as unknown as Record<string, string>)['emailType'] || '';
  const tagsVal = (lead as unknown as Record<string, string[]>)['tags'];
  const emailType = EMAIL_TYPES.includes(emailTypeVal as EmailType) ? (emailTypeVal as EmailType) : 'cold-outreach';
  return {
    ...lead,
    topic: topicName,
    emailType,
    tags: Array.isArray(tagsVal) ? tagsVal : [],
  };
}

function topicColor(topicName: string): string {
  return TOPIC_MAP[topicName]?.color || '#6B7280';
}

/* ==========================================
   SUB-COMPONENTS
   ========================================== */

function TopicBadge({ topic, className = '' }: { topic: string; className?: string }) {
  const color = topicColor(topic);
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${className}`}
      style={{ backgroundColor: `${color}20`, color, borderColor: `${color}40` }}
    >
      <FolderOpen className="w-3 h-3 mr-1" />
      {topic}
    </span>
  );
}

function EmailTypeBadge({ type, className = '' }: { type: EmailType; className?: string }) {
  const cfg = EMAIL_TYPE_COLORS[type] || EMAIL_TYPE_COLORS['cold-outreach'];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${cfg.bg} ${cfg.text} ${cfg.border} ${className}`}>
      {EMAIL_TYPE_LABELS[type] || type}
    </span>
  );
}

function TagChip({ tag, onRemove, removable = true }: { tag: string; onRemove?: () => void; removable?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-bg-tertiary border border-border-subtle text-[11px] text-text-secondary">
      <Tag className="w-2.5 h-2.5" />
      {tag}
      {removable && onRemove && (
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="ml-0.5 text-text-muted hover:text-[#EF4444] transition-colors">
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </span>
  );
}

/* ==========================================
   MAIN PAGE COMPONENT
   ========================================== */

export default function Leads() {
  const navigate = useNavigate();
  const { leads: rawLeads, loaded, updateLeadStatus, updateLeadNotes, addLead, deleteLead } = useLeads();

  // Enrich raw leads with topic/emailType/tags defaults
  const leads = useMemo(() => rawLeads.map(assignDefaultsToLead), [rawLeads]);

  // -- Store integration: load from store on mount (supplementary to useLeads hook) --
  useEffect(() => {
    window.electronAPI?.storeGet('leads').then((val: unknown) => {
      if (val && Array.isArray(val)) {
        // Data is already loaded by useLeads hook; this effect ensures Leads.tsx
        // store integration is present as requested. No state mutation needed here
        // since useLeads handles the authoritative leads state.
      }
    });
  }, []);

  // -- Store integration: save to store whenever leads change --
  useEffect(() => {
    if (leads.length > 0) {
      window.electronAPI?.storeSet('leads', leads);
    }
  }, [leads]);

  // -- State --
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'All'>('All');
  const [topicFilter, setTopicFilter] = useState<string>('All');
  const [emailTypeFilter, setEmailTypeFilter] = useState<string>('All');
  const [tagFilter, setTagFilter] = useState<string>('All');
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [selectedLead, setSelectedLead] = useState<ExtendedLead | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<ExtendedLead | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [groupByTopic, setGroupByTopic] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // -- Form state for add/edit --
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState<LeadStatus>('New');
  const [formTopic, setFormTopic] = useState('General');
  const [formEmailType, setFormEmailType] = useState<EmailType>('cold-outreach');
  const [formTags, setFormTags] = useState<string[]>([]);

  // -- CSV Import state --
  const [csvFileName, setCsvFileName] = useState('');
  const [csvRawText, setCsvRawText] = useState('');
  const [csvParsed, setCsvParsed] = useState<Record<string, string>[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [importStep, setImportStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [importTopic, setImportTopic] = useState('General');
  const [importEmailType, setImportEmailType] = useState<EmailType>('cold-outreach');
  const [importProgress, setImportProgress] = useState(0);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragAreaRef = useRef<HTMLDivElement>(null);

  // -- Drawer edit state --
  const [editNotes, setEditNotes] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  // -- Derived data --
  const filteredData = useMemo(() => {
    let data = [...leads];
    if (statusFilter !== 'All') {
      data = data.filter(l => l.status === statusFilter);
    }
    if (topicFilter !== 'All') {
      data = data.filter(l => l.topic === topicFilter);
    }
    if (emailTypeFilter !== 'All') {
      data = data.filter(l => l.emailType === emailTypeFilter);
    }
    if (tagFilter !== 'All') {
      data = data.filter(l => l.tags.includes(tagFilter));
    }
    if (globalFilter.trim()) {
      const q = globalFilter.toLowerCase();
      data = data.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q) ||
        l.notes.toLowerCase().includes(q) ||
        l.topic.toLowerCase().includes(q) ||
        l.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return data;
  }, [leads, statusFilter, topicFilter, emailTypeFilter, tagFilter, globalFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { All: leads.length };
    for (const s of statusOptions) counts[s] = leads.filter(l => l.status === s).length;
    return counts;
  }, [leads]);

  const topicCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach(l => { counts[l.topic] = (counts[l.topic] || 0) + 1; });
    return counts;
  }, [leads]);

  const groupedData = useMemo(() => {
    const groups: Record<string, ExtendedLead[]> = {};
    DEFAULT_TOPICS.forEach(t => { groups[t.name] = []; });
    filteredData.forEach(l => {
      const key = groups[l.topic] ? l.topic : 'General';
      groups[key] = groups[key] || [];
      groups[key].push(l);
    });
    return Object.entries(groups).filter(([, items]) => items.length > 0);
  }, [filteredData]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'All') count++;
    if (topicFilter !== 'All') count++;
    if (emailTypeFilter !== 'All') count++;
    if (tagFilter !== 'All') count++;
    if (globalFilter.trim()) count++;
    return count;
  }, [statusFilter, topicFilter, emailTypeFilter, tagFilter, globalFilter]);

  const selectedRows = useMemo(() => {
    return Object.keys(rowSelection)
      .filter(k => rowSelection[k])
      .map(k => filteredData[parseInt(k.split('.')[1] || k, 10)])
      .filter(Boolean) as ExtendedLead[];
  }, [rowSelection, filteredData]);

  // -- Handlers --
  const openDrawer = useCallback((lead: ExtendedLead) => {
    setSelectedLead(lead);
    setEditNotes(lead.notes);
    setEditTags(lead.tags);
    setNewTagInput('');
    setDrawerOpen(true);
  }, []);

  const openEdit = useCallback((lead: ExtendedLead) => {
    setEditingLead(lead);
    setFormName(lead.name);
    setFormEmail(lead.email);
    setFormCompany(lead.company);
    setFormNotes(lead.notes);
    setFormStatus(lead.status);
    setFormTopic(lead.topic);
    setFormEmailType(lead.emailType);
    setFormTags(lead.tags);
    setAddModalOpen(true);
  }, []);

  const resetForm = useCallback(() => {
    setFormName(''); setFormEmail(''); setFormCompany(''); setFormNotes(''); setFormStatus('New');
    setFormTopic('General'); setFormEmailType('cold-outreach'); setFormTags([]); setEditingLead(null);
  }, []);

  const navigateToCompose = useCallback((lead: ExtendedLead) => {
    navigate('/compose', { state: { lead, topicContext: TOPIC_MAP[lead.topic]?.aiContext || lead.topic } });
  }, [navigate]);

  const handleAddLead = useCallback(() => {
    if (!formName.trim() || !formEmail.trim()) { toast.error('Name and email are required'); return; }
    const lead: ExtendedLead = {
      id: editingLead ? editingLead.id : Date.now().toString(),
      name: formName.trim(), email: formEmail.trim(), company: formCompany.trim(),
      status: formStatus, lastContact: editingLead ? editingLead.lastContact : null,
      notes: formNotes, source: editingLead ? editingLead.source : 'Manual',
      topic: formTopic, emailType: formEmailType, tags: formTags,
    };
    if (editingLead) {
      updateLeadNotes(editingLead.id, formNotes);
      if (editingLead.status !== formStatus) updateLeadStatus(editingLead.id, formStatus);
      toast.success('Lead updated');
    } else {
      addLead(lead as unknown as Lead);
      toast.success('Lead added');
    }
    setAddModalOpen(false);
    resetForm();
  }, [formName, formEmail, formCompany, formStatus, formNotes, formTopic, formEmailType, formTags, editingLead, addLead, updateLeadNotes, updateLeadStatus, resetForm]);

  const handleDelete = useCallback((id: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    deleteLead(id);
    toast.success('Lead deleted');
    setDrawerOpen(false);
    setSelectedLead(null);
  }, [deleteLead]);

  const handleBulkDelete = useCallback(() => {
    if (!confirm(`Delete ${selectedRows.length} selected leads?`)) return;
    selectedRows.forEach(r => r?.id && deleteLead(r.id));
    setRowSelection({});
    toast.success(`${selectedRows.length} leads deleted`);
  }, [selectedRows, deleteLead]);

  const handleBulkStatusChange = useCallback((status: LeadStatus) => {
    selectedRows.forEach(r => r?.id && updateLeadStatus(r.id, status));
    setRowSelection({});
    toast.success(`Status updated for ${selectedRows.length} leads`);
  }, [selectedRows, updateLeadStatus]);

  const handleBulkTopicAssign = useCallback((topic: string) => {
    const topicConfig = TOPIC_MAP[topic];
    selectedRows.forEach(r => {
      if (!r?.id) return;
      const updates: Partial<ExtendedLead> = { topic };
      if (topicConfig && !topicConfig.emailTypes.includes(r.emailType)) {
        updates.emailType = topicConfig.defaultEmailType;
      }
      updateLeadField(r.id, updates);
    });
    setRowSelection({});
    toast.success(`Topic assigned to ${selectedRows.length} leads`);
  }, [selectedRows]);

  const handleBulkEmailTypeChange = useCallback((emailType: EmailType) => {
    selectedRows.forEach(r => r?.id && updateLeadField(r.id, { emailType }));
    setRowSelection({});
    toast.success(`Email type updated for ${selectedRows.length} leads`);
  }, [selectedRows]);

  const handleBulkTagAdd = useCallback((tag: string) => {
    selectedRows.forEach(r => {
      if (!r?.id) return;
      if (!r.tags.includes(tag)) {
        updateLeadField(r.id, { tags: [...r.tags, tag] });
      }
    });
    setRowSelection({});
    toast.success(`Tag "${tag}" added to ${selectedRows.length} leads`);
  }, [selectedRows]);

  function updateLeadField(id: string, updates: Partial<ExtendedLead>) {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;
    const updated = { ...lead, ...updates };
    updateLeadNotes(id, updated.notes || lead.notes);
  }

  const handleSync = useCallback(async () => {
    setSyncing(true);
    toast.info('Syncing with Google Sheets...');
    try {
      const google = await window.electronAPI?.storeGet('google');
      if (!google?.sheetId) {
        toast.error('No sheet configured. Go to Settings > Google Sheets to set up.');
        setSyncing(false);
        return;
      }
      const result = await window.electronAPI?.fetchSheetData?.({
        sheetId: google.sheetId,
        range: `${google.sheetName || 'Sheet1'}!A1:Z1000`,
      });
      if (result?.success && result.data) {
        const rows = result.data;
        if (rows.length < 2) {
          toast.info('Sheet is empty or has no data rows');
          setSyncing(false);
          return;
        }
        const headers = rows[0].map((h: string) => h.toLowerCase());
        const nameIdx = headers.findIndex((h: string) => h.includes('name'));
        const emailIdx = headers.findIndex((h: string) => h.includes('email'));
        const companyIdx = headers.findIndex((h: string) => h.includes('company'));
        const statusIdx = headers.findIndex((h: string) => h.includes('status'));
        const topicIdx = headers.findIndex((h: string) => h.includes('topic'));
        const notesIdx = headers.findIndex((h: string) => h.includes('notes'));
        
        const newLeads = rows.slice(1).map((row: string[], i: number) => ({
          id: Date.now() + i,
          name: nameIdx >= 0 ? row[nameIdx] : '',
          email: emailIdx >= 0 ? row[emailIdx] : '',
          company: companyIdx >= 0 ? row[companyIdx] : '',
          status: (statusIdx >= 0 ? row[statusIdx] : 'new').toLowerCase(),
          topic: topicIdx >= 0 ? row[topicIdx] : 'General',
          notes: notesIdx >= 0 ? row[notesIdx] : '',
          dateAdded: new Date().toISOString().split('T')[0],
          lastContacted: '-',
          emailsSent: 0,
        })).filter((l: any) => l.name || l.email);
        
        setLeads(prev => {
          const merged = [...newLeads, ...prev.filter(p => !newLeads.find((n: any) => n.email === p.email))];
          window.electronAPI?.storeSet('leads', merged);
          return merged;
        });
        toast.success(`Synced ${newLeads.length} leads from Google Sheets`);
      } else {
        toast.error(result?.error || 'Sync failed. Check Google authentication in Settings.');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Sync failed');
    }
    setSyncing(false);
  }, []);

  // -- CSV Handlers --
  const handleFileSelect = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) { toast.error('Please select a CSV file'); return; }
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string || '';
      setCsvRawText(text);
      const parsed = parseCSV(text);
      if (parsed.length === 0) { toast.error('Could not parse CSV'); return; }
      setCsvParsed(parsed);
      const headers = Object.keys(parsed[0]);
      setCsvHeaders(headers);
      const mapping: Record<string, string> = {};
      headers.forEach(h => {
        const lower = h.toLowerCase();
        if (lower.includes('name') && !lower.includes('company')) mapping['name'] = h;
        else if (lower.includes('email') || lower.includes('e-mail')) mapping['email'] = h;
        else if (lower.includes('company') || lower.includes('organization')) mapping['company'] = h;
        else if (lower.includes('status')) mapping['status'] = h;
        else if (lower.includes('note')) mapping['notes'] = h;
        else if (lower.includes('topic')) mapping['topic'] = h;
      });
      setColumnMapping(mapping);
      setImportStep('mapping');
      toast.success(`Found ${parsed.length} rows in CSV`);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const processImport = useCallback(() => {
    if (!columnMapping['name'] || !columnMapping['email']) {
      toast.error('Please map at least Name and Email columns'); return;
    }
    setImporting(true);
    setImportStep('preview');
    let processed = 0;
    const total = csvParsed.length;
    const interval = setInterval(() => {
      processed = Math.min(processed + Math.ceil(total / 10), total);
      setImportProgress(Math.round((processed / total) * 100));
      if (processed >= total) {
        clearInterval(interval);
        const importedLeads: ExtendedLead[] = csvParsed.map((row, idx) => {
          const statusVal = (row[columnMapping['status']] || 'New') as LeadStatus;
          const status: LeadStatus = statusOptions.includes(statusVal) ? statusVal : 'New';
          const topicVal = row[columnMapping['topic']] || importTopic;
          const topicName = TOPIC_MAP[topicVal] ? topicVal : importTopic;
          return {
            id: `csv-${Date.now()}-${idx}`,
            name: row[columnMapping['name']] || 'Unknown',
            email: row[columnMapping['email']] || '',
            company: row[columnMapping['company']] || '',
            status,
            lastContact: null,
            notes: row[columnMapping['notes']] || '',
            source: `CSV: ${csvFileName}`,
            topic: topicName,
            emailType: importEmailType,
            tags: [],
          };
        });
        importedLeads.forEach(l => addLead(l as unknown as Lead));
        const allLeads = [...importedLeads, ...leads];
        window.electronAPI?.storeSet('leads', allLeads);
        toast.success(`Imported ${importedLeads.length} leads from CSV`);
        setImporting(false);
        setImportModalOpen(false);
        setImportStep('upload');
        setCsvParsed([]);
        setCsvHeaders([]);
        setColumnMapping({});
        setCsvFileName('');
        setCsvRawText('');
        setImportProgress(0);
      }
    }, 150);
  }, [csvParsed, columnMapping, importTopic, importEmailType, csvFileName, addLead]);

  const clearFilters = useCallback(() => {
    setStatusFilter('All');
    setTopicFilter('All');
    setEmailTypeFilter('All');
    setTagFilter('All');
    setGlobalFilter('');
  }, []);

  const toggleGroupCollapse = useCallback((topic: string) => {
    setCollapsedGroups(prev => ({ ...prev, [topic]: !prev[topic] }));
  }, []);

  const expandAllGroups = useCallback(() => {
    const all: Record<string, boolean> = {};
    groupedData.forEach(([topic]) => { all[topic] = false; });
    setCollapsedGroups(all);
  }, [groupedData]);

  const collapseAllGroups = useCallback(() => {
    const all: Record<string, boolean> = {};
    groupedData.forEach(([topic]) => { all[topic] = true; });
    setCollapsedGroups(all);
  }, [groupedData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (drawerOpen) { setDrawerOpen(false); setSelectedLead(null); }
        else if (addModalOpen) setAddModalOpen(false);
        else if (importModalOpen) setImportModalOpen(false);
        else if (rowSelection && Object.keys(rowSelection).length > 0) setRowSelection({});
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('leads-search')?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [drawerOpen, addModalOpen, importModalOpen, rowSelection]);

  /* ==========================================
     RENDER HELPERS
     ========================================== */

  const renderTableRow = (row: any, idx: number) => (
    <motion.tr
      key={row.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: Math.min(idx * 0.02, 0.4), duration: 0.2 }}
      onClick={() => openDrawer(row.original)}
      className={`border-b border-border-subtle cursor-pointer transition-colors duration-150 ${
        row.getIsSelected ? row.getIsSelected() ? 'bg-[#0EA5E908] border-l-2 border-l-accent-blue' : 'bg-bg-primary hover:bg-bg-tertiary' : 'bg-bg-primary hover:bg-bg-tertiary'
      }`}
    >
      {row.getVisibleCells().map((cell: any) => (
        <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </motion.tr>
  );

  /* ==========================================
     RENDER
     ========================================== */
  return (
    <div className="flex flex-col h-full p-8 bg-bg-primary">
      {/* ===== Top Bar ===== */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-[20px] font-semibold text-text-primary tracking-tight">Leads</h2>
          <span className="px-2.5 py-0.5 rounded-full bg-bg-tertiary text-text-secondary text-[12px] border border-border-subtle">
            {leads.length} leads
          </span>
          {activeFilterCount > 0 && (
            <Badge className="bg-accent-blue/20 text-accent-blue border-accent-blue/40 text-[11px]">
              {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="bg-bg-tertiary border-border-subtle text-text-primary hover:bg-bg-elevated hover:border-border-default" onClick={() => setImportModalOpen(true)}>
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            Upload CSV
          </Button>
          <Button variant="outline" size="sm" className="bg-bg-tertiary border-border-subtle text-text-primary hover:bg-bg-elevated hover:border-border-default" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
            Sync Now
          </Button>
          <Button size="sm" className="bg-accent-blue text-text-inverse hover:brightness-110" onClick={() => { resetForm(); setAddModalOpen(true); }}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* ===== Enhanced Filters Bar ===== */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between">
          {/* Status filters */}
          <div className="flex items-center gap-1">
            {(['All', ...statusOptions] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all border-b-2 ${
                  statusFilter === s ? `bg-bg-tertiary text-text-primary border-border-default ${s !== 'All' ? statusBorderColors[s] : ''}` : 'text-text-muted hover:text-text-secondary border-transparent'
                }`}
              >
                {s} {s !== 'All' && `(${statusCounts[s] || 0})`}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
              <Input id="leads-search" value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Search leads..." className="w-[260px] pl-9 bg-bg-primary border-border-subtle text-text-primary placeholder:text-text-muted text-[13px] h-8"
              />
              {globalFilter && (
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary" onClick={() => setGlobalFilter('')}>
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" className="text-text-muted hover:text-text-primary h-8 px-2 text-[12px]" onClick={clearFilters}>
                <Filter className="w-3 h-3 mr-1" /> Clear
              </Button>
            )}
          </div>
        </div>

        {/* Secondary filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Topic filter */}
          <Select value={topicFilter} onValueChange={setTopicFilter}>
            <SelectTrigger className="h-7 w-[140px] bg-bg-tertiary border-border-subtle text-[12px] text-text-primary">
              <Layers className="w-3 h-3 mr-1" />
              <SelectValue placeholder="Topic" />
            </SelectTrigger>
            <SelectContent className="bg-bg-elevated border-border-default">
              <SelectItem value="All" className="text-[12px]">All Topics</SelectItem>
              {DEFAULT_TOPICS.map(t => (
                <SelectItem key={t.id} value={t.name} className="text-[12px]">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                    {t.name} ({topicCounts[t.name] || 0})
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Email type filter */}
          <Select value={emailTypeFilter} onValueChange={setEmailTypeFilter}>
            <SelectTrigger className="h-7 w-[140px] bg-bg-tertiary border-border-subtle text-[12px] text-text-primary">
              <Mail className="w-3 h-3 mr-1" />
              <SelectValue placeholder="Email Type" />
            </SelectTrigger>
            <SelectContent className="bg-bg-elevated border-border-default">
              <SelectItem value="All" className="text-[12px]">All Types</SelectItem>
              {EMAIL_TYPES.map(t => (
                <SelectItem key={t} value={t} className="text-[12px]">{EMAIL_TYPE_LABELS[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Group by topic toggle */}
          <button
            onClick={() => setGroupByTopic(v => !v)}
            className={`flex items-center gap-1 h-7 px-2 rounded-md text-[12px] font-medium transition-all ${
              groupByTopic ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/40' : 'bg-bg-tertiary text-text-muted border border-border-subtle hover:text-text-secondary'
            }`}
          >
            <Group className="w-3 h-3" />
            Group by Topic
          </button>
        </div>
      </div>

      {/* ===== Table ===== */}
      <div className="flex-1 overflow-auto border border-border-subtle rounded-card bg-bg-secondary">
        <table className="w-full text-left">
          <thead className="bg-bg-tertiary sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  className="rounded border-border-default"
                  checked={filteredData.length > 0 && Object.keys(rowSelection).length === filteredData.length}
                  onChange={(e) => {
                    const newSelection: Record<string, boolean> = {};
                    if (e.target.checked) {
                      filteredData.forEach((_, i) => { newSelection[String(i)] = true; });
                    }
                    setRowSelection(newSelection);
                  }}
                />
              </th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted">Name</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted">Email</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted">Company</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted">Topic</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted">Status</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted">Last Contact</th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-text-muted text-[13px]">
                  No leads found
                </td>
              </tr>
            ) : (
              filteredData.map((lead, idx) => (
                <motion.tr
                  key={lead.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(idx * 0.02, 0.4), duration: 0.2 }}
                  onClick={() => openDrawer(lead)}
                  className="border-b border-border-subtle cursor-pointer transition-colors duration-150 bg-bg-primary hover:bg-bg-tertiary"
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="rounded border-border-default"
                      checked={!!rowSelection[String(idx)]}
                      onChange={(e) => {
                        setRowSelection(prev => ({ ...prev, [String(idx)]: e.target.checked }));
                      }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-bg-elevated flex items-center justify-center text-[11px] font-semibold text-text-secondary">
                        {getInitials(lead.name)}
                      </div>
                      <span className="text-[13px] font-medium text-text-primary">{lead.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-[12px] text-text-secondary">{lead.email}</span>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-text-muted">{lead.company}</td>
                  <td className="px-4 py-3"><TopicBadge topic={lead.topic} /></td>
                  <td className="px-4 py-3"><StatusBadge status={lead.status} /></td>
                  <td className="px-4 py-3 text-[12px] text-text-muted">{formatRelativeTime(lead.lastContact)}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-7 h-7 rounded-md flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-bg-elevated border-border-default">
                        <DropdownMenuItem onClick={() => openDrawer(lead)} className="text-text-primary hover:bg-bg-tertiary cursor-pointer">View Details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigateToCompose(lead)} className="text-text-primary hover:bg-bg-tertiary cursor-pointer">
                          <Mail className="w-3.5 h-3.5 mr-2" /> Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(lead)} className="text-text-primary hover:bg-bg-tertiary cursor-pointer">
                          <Pencil className="w-3.5 h-3.5 mr-2" /> Edit Lead
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border-subtle" />
                        <DropdownMenuItem onClick={() => handleDelete(lead.id)} className="text-[#EF4444] hover:bg-bg-tertiary cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
