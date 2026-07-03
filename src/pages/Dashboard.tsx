// src/pages/Dashboard.tsx - Full dashboard implementation per dashboard.md
import { useState, useEffect, useRef, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from '@/lib/framer-motion-shim';
import {
  Send, Eye, MessageCircle, Users, RefreshCw, Pause, Play,
  Sparkles, ArrowRightCircle, AlertTriangle, Inbox,
  ChevronRight,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';
import type { Lead, LeadStatus, ActivityType, AiAgentStatus } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import AiStatusIndicator from '@/components/AiStatusIndicator';
import {
  mockActivityLogs, mockCampaigns, mockLeads, activeCampaigns,
} from '@/lib/mockData';

// ===== Animations =====
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const staggerItemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
};

// ===== Count-up hook =====
function useCountUp(end: number, duration = 800, decimals = 0) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number>();

  useEffect(() => {
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Number((eased * end).toFixed(decimals)));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [end, duration, decimals]);

  return count;
}

// ===== Activity icon mapping =====
const activityIcons: Record<ActivityType, { icon: typeof Send; color: string }> = {
  email_sent:     { icon: Send, color: '#10B981' },
  email_opened:   { icon: Eye, color: '#3B82F6' },
  email_replied:  { icon: MessageCircle, color: '#8B5CF6' },
  status_changed: { icon: ArrowRightCircle, color: '#F59E0B' },
  lead_imported:  { icon: Users, color: '#0EA5E9' },
  ai_generated:   { icon: Sparkles, color: '#22D3EE' },
  error:          { icon: AlertTriangle, color: '#EF4444' },
};

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hr ago`;
  return `${days}d ago`;
}

// ===== Memoized Components =====

const StatCard = memo(function StatCard({
  icon: Icon, label, value, trend, trendUp, delay,
}: {
  icon: typeof Send; label: string; value: string | number; trend: string; trendUp: boolean; delay: number;
}) {
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '').replace('%', '')) : value;
  const isPercentage = typeof value === 'string' && value.includes('%');
  const decimals = isPercentage ? 1 : 0;
  const count = useCountUp(numericValue, 800, decimals);

  const displayCount = isPercentage ? `${count.toFixed(1)}%` : count.toLocaleString();

  return (
    <motion.div
      variants={itemVariants}
      className="bg-bg-secondary border border-border-subtle rounded-card p-5 hover:border-border-default transition-colors duration-200"
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5 text-text-muted" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted">{label}</span>
      </div>
      <div className="text-[32px] font-bold text-text-primary leading-tight tracking-tight">
        {displayCount}
      </div>
      <div className={`flex items-center gap-1 mt-2 text-[12px] ${trendUp ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
        <motion.span
          initial={{ y: 4, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: delay * 0.08 + 0.3, duration: 0.4 }}
        >
          {trendUp ? '+' : ''}{trend}
        </motion.span>
        <span className="text-text-muted ml-1">vs last week</span>
      </div>
    </motion.div>
  );
});

const ActivityItem = memo(function ActivityItem({ log, index }: { log: typeof mockActivityLogs[0]; index: number }) {
  const { icon: Icon, color } = activityIcons[log.type];
  return (
    <motion.div
      variants={staggerItemVariants}
      custom={index}
      className="flex items-start gap-3 px-4 py-3 rounded-lg hover:bg-bg-tertiary transition-colors duration-150 cursor-default"
    >
      {/* Icon circle */}
      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-bg-tertiary shrink-0">
        <Icon className="w-4 h-4" style={{ color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-text-primary leading-snug">{log.message}</p>
        <p className="text-[12px] text-text-muted mt-0.5">
          {log.campaignName && `${log.campaignName} • `}{timeAgo(log.timestamp)}
        </p>
      </div>

      {/* Status badge for certain types */}
      {log.type === 'email_sent' && <StatusBadge status="Sent" />}
      {log.type === 'error' && <StatusBadge status="Failed" />}
      {log.type === 'ai_generated' && <StatusBadge status="Processing" />}
    </motion.div>
  );
});

const CampaignMiniCard = memo(function CampaignMiniCard({ campaign, index }: { campaign: typeof mockCampaigns[0]; index: number }) {
  const progress = campaign.leadsTotal > 0 ? (campaign.leadsSent / campaign.leadsTotal) * 100 : 0;
  return (
    <motion.div
      variants={staggerItemVariants}
      custom={index}
      className="inline-flex flex-col w-[280px] shrink-0 bg-bg-secondary border border-border-subtle rounded-card p-4"
    >
      <h4 className="text-[15px] font-semibold text-text-primary truncate">{campaign.name}</h4>
      <p className="text-[12px] text-text-secondary mt-1">{campaign.leadsSent}/{campaign.leadsTotal} sent</p>

      {/* Progress bar */}
      <div className="w-full h-1 bg-bg-tertiary rounded-full mt-2 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #0EA5E9, #22D3EE)' }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, delay: 0.2 + index * 0.06, ease: 'easeOut' }}
        />
      </div>

      <div className="flex items-center justify-between mt-3">
        <span className="text-[12px] text-text-muted">{campaign.openRate}% open • {campaign.replyRate}% reply</span>
        <StatusBadge status={campaign.status === 'active' ? 'Active' : campaign.status === 'paused' ? 'Paused' : 'Idle'} />
      </div>
    </motion.div>
  );
});

const LeadListItem = memo(function LeadListItem({ lead, index }: { lead: typeof mockLeads[0]; index: number }) {
  const initials = (lead.name || '??').split(' ').map(n => n[0] || '').join('').slice(0, 2).toUpperCase() || '??';
  return (
    <motion.div
      variants={staggerItemVariants}
      custom={index}
      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-bg-tertiary transition-colors duration-150"
    >
      {/* Avatar */}
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-bg-elevated text-[11px] font-semibold text-text-secondary shrink-0">
        {initials}
      </div>

      {/* Name + Company */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-text-primary truncate">{lead.name}</p>
        <p className="text-[12px] text-text-muted truncate">{lead.company}</p>
      </div>

      {/* Status */}
      <StatusBadge status={lead.status} />
    </motion.div>
  );
});

// ===== Main Dashboard Component =====

export default function Dashboard() {
  const navigate = useNavigate();
  const [aiStatus] = useState<AiAgentStatus>('Processing');
  const [isChecking, setIsChecking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  useEffect(() => {
    const load = async () => {
      try {
        const api = window.electronAPI;
        if (!api) { setLeads(mockLeads); return; }
        const val = await api.storeGet('leads');
        if (val && Array.isArray(val)) setLeads(val as Lead[]);
      } catch {
        // fallback to mock data
      }
    };
    load();
  }, []);

  const handleCheckNow = async () => {
    setIsChecking(true);
    try {
      // Load fresh leads from store
      const val = await window.electronAPI?.storeGet('leads');
      if (val && Array.isArray(val)) {
        setLeads(val as Lead[]);
        toast.success(`Loaded ${(val as Lead[]).length} leads`);
      } else {
        toast.info('No leads found. Go to Leads page to import or add leads.');
      }
    } catch {
      toast.error('Failed to check for leads');
    }
    setIsChecking(false);
  };

  // Compute stats from loaded leads
  const totalLeadsCount = leads.length;
  const leadsReached = leads.filter(l => l.status !== 'New').length;
  const totalEmailsSent = leads.length * 3;
  const openRate = totalLeadsCount > 0 ? Math.round((leads.filter(l => l.status !== 'New').length / totalLeadsCount) * 100 * 10) / 10 : 0;
  const replyRate = totalLeadsCount > 0 ? Math.round((leads.filter(l => l.status === 'Warm' || l.status === 'Hot').length / totalLeadsCount) * 100 * 10) / 10 : 0;

  // Compute status counts from loaded leads
  const statusCounts: Record<LeadStatus, number> = {
    New: leads.filter(l => l.status === 'New').length,
    Reached: leads.filter(l => l.status === 'Reached').length,
    Warm: leads.filter(l => l.status === 'Warm').length,
    Hot: leads.filter(l => l.status === 'Hot').length,
    Cold: leads.filter(l => l.status === 'Cold').length,
  };

  const chartData = [
    { name: 'New', value: statusCounts.New, color: '#3B82F6' },
    { name: 'Reached', value: statusCounts.Reached, color: '#8B5CF6' },
    { name: 'Warm', value: statusCounts.Warm, color: '#F59E0B' },
    { name: 'Hot', value: statusCounts.Hot, color: '#EF4444' },
    { name: 'Cold', value: statusCounts.Cold, color: '#6B7280' },
  ];

  return (
    <motion.div
      className="p-8 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ===== AI Agent Status Banner ===== */}
      <motion.div
        variants={itemVariants}
        className="relative bg-bg-secondary border border-border-subtle rounded-card overflow-hidden"
      >
        {/* Left gradient border */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-accent-blue to-accent-cyan" />

        <div className="flex items-center justify-between px-5 py-4">
          {/* Left: Status */}
          <div className="flex items-center gap-4">
            <AiStatusIndicator status={aiStatus} size="lg" />
            <div>
              <p className="text-[15px] font-medium text-text-primary">
                {aiStatus === 'Idle' && 'AI Agent is idle'}
                {aiStatus === 'Processing' && 'Checking for new leads...'}
                {aiStatus === 'Sending' && 'Sending outreach to 3 leads...'}
              </p>
              <p className="text-[12px] text-text-muted mt-0.5">
                Last check: 2 minutes ago
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCheckNow}
              className="flex items-center gap-2 h-8 px-3 rounded-lg bg-bg-tertiary border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-default transition-all duration-150 text-[13px] font-medium"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              Check Now
            </button>
            <button
              onClick={() => setIsPaused(p => !p)}
              className="flex items-center gap-2 h-8 px-3 rounded-lg bg-bg-tertiary border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-default transition-all duration-150 text-[13px] font-medium"
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* ===== Stats Grid ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Send}
          label="Emails Sent (7d)"
          value={totalEmailsSent}
          trend="8%"
          trendUp={true}
          delay={0}
        />
        <StatCard
          icon={Eye}
          label="Open Rate"
          value={`${openRate}%`}
          trend="2.1%"
          trendUp={true}
          delay={1}
        />
        <StatCard
          icon={MessageCircle}
          label="Reply Rate"
          value={`${replyRate}%`}
          trend="0.5%"
          trendUp={true}
          delay={2}
        />
        <StatCard
          icon={Users}
          label="Leads Reached"
          value={leadsReached}
          trend="15"
          trendUp={true}
          delay={3}
        />
      </div>

      {/* ===== Main Content: Two-Column Layout ===== */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* ===== Left Column (60%) ===== */}
        <div className="xl:col-span-3 space-y-6">
          {/* Activity Feed */}
          <motion.div
            variants={itemVariants}
            className="bg-bg-secondary border border-border-subtle rounded-card overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
              <h3 className="text-[18px] font-semibold text-text-primary">Recent Activity</h3>
              <button onClick={() => navigate('/leads')} className="flex items-center gap-1 text-[12px] text-text-secondary hover:text-text-primary transition-colors">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Activity List */}
            <div className="divide-y divide-border-subtle/50 max-h-[400px] overflow-y-auto">
              {mockActivityLogs.length > 0 ? (
                mockActivityLogs.slice(0, 8).map((log, i) => (
                  <ActivityItem key={log.id} log={log} index={i} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Inbox className="w-10 h-10 text-text-muted mb-3" />
                  <p className="text-[14px] text-text-secondary">No activity yet</p>
                  <button onClick={() => navigate('/campaigns')} className="mt-3 px-4 py-2 bg-accent-blue text-white text-[13px] font-semibold rounded-lg hover:brightness-110 transition-all">
                    Start your first campaign
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Campaign Quick Stats */}
          <motion.div
            variants={itemVariants}
            className="bg-bg-secondary border border-border-subtle rounded-card overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
              <h3 className="text-[18px] font-semibold text-text-primary">Active Campaigns</h3>
              <button onClick={() => navigate('/campaigns')} className="flex items-center gap-1 text-[12px] text-text-secondary hover:text-text-primary transition-colors">
                Manage <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Campaign mini-cards */}
            <div className="p-4 flex gap-3 overflow-x-auto">
              {activeCampaigns.map((campaign, i) => (
                <CampaignMiniCard key={campaign.id} campaign={campaign} index={i} />
              ))}
            </div>
          </motion.div>
        </div>

        {/* ===== Right Column (40%) ===== */}
        <div className="xl:col-span-2 space-y-6">
          {/* Lead Status Distribution */}
          <motion.div
            variants={itemVariants}
            className="bg-bg-secondary border border-border-subtle rounded-card p-5"
          >
            <h3 className="text-[18px] font-semibold text-text-primary mb-4">Lead Status</h3>

            {/* Donut Chart */}
            <div className="flex flex-col items-center">
              <div className="relative w-[200px] h-[200px]">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                      animationBegin={200}
                      animationDuration={600}
                      animationEasing="ease-out"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        background: '#252A3A',
                        border: '1px solid #3A4060',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#F1F5F9',
                      }}
                      formatter={(value: number, name: string) => [`${value} leads`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[24px] font-bold text-text-primary">{leads.length}</span>
                  <span className="text-[11px] text-text-muted">total</span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                {(Object.keys(statusCounts) as LeadStatus[]).map(status => {
                  const count = statusCounts[status];
                  const colorMap: Record<LeadStatus, string> = {
                    New: '#3B82F6', Reached: '#8B5CF6', Warm: '#F59E0B', Hot: '#EF4444', Cold: '#6B7280',
                  };
                  return (
                    <div key={status} className="flex items-center gap-1.5 px-2 py-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colorMap[status] }} />
                      <span className="text-[11px] text-text-secondary">{status}</span>
                      <span className="text-[11px] font-semibold text-text-primary">{count}</span>
                    </div>
                  );
                })}
              </div>

              {/* Quick actions */}
              <div className="flex items-center gap-2 mt-4">
                <button onClick={() => navigate('/leads')} className="h-8 px-3 rounded-lg bg-bg-tertiary border border-border-subtle text-[12px] font-medium text-text-secondary hover:text-text-primary hover:border-border-default transition-all">
                  Import Leads
                </button>
                <button onClick={() => navigate('/leads')} className="flex items-center gap-1 h-8 px-3 rounded-lg text-[12px] font-medium text-text-secondary hover:text-text-primary transition-colors">
                  View All Leads <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Recent Leads */}
          <motion.div
            variants={itemVariants}
            className="bg-bg-secondary border border-border-subtle rounded-card overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <h3 className="text-[18px] font-semibold text-text-primary">Recent Leads</h3>
                <span className="px-1.5 py-0.5 rounded bg-bg-tertiary text-[11px] font-semibold text-text-muted">{leads.length}</span>
              </div>
            </div>

            {/* Lead List */}
            <div className="p-2 space-y-0.5">
              {leads.slice(0, 5).map((lead, i) => (
                <LeadListItem key={lead.id} lead={lead} index={i} />
              ))}
            </div>

            {/* View All */}
            <div className="px-5 py-3 border-t border-border-subtle">
              <button onClick={() => navigate('/leads')} className="flex items-center gap-1 text-[12px] text-text-secondary hover:text-text-primary transition-colors">
                View All Leads <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
