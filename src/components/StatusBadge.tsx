// src/components/StatusBadge.tsx - Reusable status badge component
import type { LeadStatus } from '@/types';

type BadgeStatus = LeadStatus | 'Sent' | 'Failed' | 'Processing' | 'Idle' | 'Active' | 'Paused';

interface StatusBadgeProps {
  status: BadgeStatus;
  className?: string;
}

const statusConfig: Record<BadgeStatus, { bg: string; text: string; border: string }> = {
  New:        { bg: 'bg-[#3B82F620]', text: 'text-[#3B82F6]', border: 'border-[#3B82F640]' },
  Reached:    { bg: 'bg-[#8B5CF620]', text: 'text-[#8B5CF6]', border: 'border-[#8B5CF640]' },
  Warm:       { bg: 'bg-[#F59E0B20]', text: 'text-[#F59E0B]', border: 'border-[#F59E0B40]' },
  Hot:        { bg: 'bg-[#EF444420]', text: 'text-[#EF4444]', border: 'border-[#EF444440]' },
  Cold:       { bg: 'bg-[#6B728020]', text: 'text-[#6B7280]', border: 'border-[#6B728040]' },
  Sent:       { bg: 'bg-[#10B98120]', text: 'text-[#10B981]', border: 'border-[#10B98140]' },
  Failed:     { bg: 'bg-[#EF444420]', text: 'text-[#EF4444]', border: 'border-[#EF444440]' },
  Processing: { bg: 'bg-[#F59E0B20]', text: 'text-[#F59E0B]', border: 'border-[#F59E0B40]' },
  Idle:       { bg: 'bg-[#64748B20]', text: 'text-[#64748B]', border: 'border-[#64748B40]' },
  Active:     { bg: 'bg-[#10B98120]', text: 'text-[#10B981]', border: 'border-[#10B98140]' },
  Paused:     { bg: 'bg-[#F59E0B20]', text: 'text-[#F59E0B]', border: 'border-[#F59E0B40]' },
};

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.Idle;

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-1 rounded-md border
        text-[11px] font-semibold uppercase tracking-[0.04em]
        ${config.bg} ${config.text} ${config.border}
        ${className}
      `}
    >
      {status}
    </span>
  );
}
