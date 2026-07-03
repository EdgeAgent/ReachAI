// src/components/AiStatusIndicator.tsx - AI agent status indicator with animation
import { memo } from 'react';
import type { AiAgentStatus } from '@/types';

interface AiStatusIndicatorProps {
  status: AiAgentStatus;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<AiAgentStatus, { color: string; label: string; animate: boolean }> = {
  Idle:       { color: '#64748B', label: 'Idle',       animate: false },
  Processing: { color: '#F59E0B', label: 'Processing', animate: true },
  Sending:    { color: '#22D3EE', label: 'Sending',    animate: true },
};

function AiStatusIndicator({ status, showLabel = true, size = 'md' }: AiStatusIndicatorProps) {
  const config = statusConfig[status];
  const isActive = config.animate;

  const sizeMap = {
    sm: { dot: 6, ring: 12 },
    md: { dot: 8, ring: 16 },
    lg: { dot: 10, ring: 20 },
  };
  const s = sizeMap[size];

  return (
    <div className="flex items-center gap-2">
      {/* Dot with pulse */}
      <div className="relative flex items-center justify-center" style={{ width: s.ring, height: s.ring }}>
        {/* Pulse ring */}
        {isActive && (
          <div
            className="absolute rounded-full animate-pulse-glow"
            style={{
              width: s.dot,
              height: s.dot,
              backgroundColor: config.color,
            }}
          />
        )}
        {/* Center dot */}
        <div
          className="relative rounded-full"
          style={{
            width: s.dot,
            height: s.dot,
            backgroundColor: config.color,
            boxShadow: isActive ? `0 0 ${s.dot * 1.5}px ${config.color}60` : 'none',
          }}
        />
      </div>

      {/* Label */}
      {showLabel && (
        <span className="text-[12px] font-medium text-text-secondary">
          {config.label}
        </span>
      )}
    </div>
  );
}

export default memo(AiStatusIndicator);
