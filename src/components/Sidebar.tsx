// src/components/Sidebar.tsx - Sidebar navigation component
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Mail,
  Sparkles,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Sheet,
} from 'lucide-react';
import type { AiAgentStatus } from '@/types';
import AiStatusIndicator from './AiStatusIndicator';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/leads', label: 'Leads', icon: Users },
  { to: '/campaigns', label: 'Campaigns', icon: Mail },
  { to: '/compose', label: 'AI Composer', icon: Sparkles },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const location = useLocation();
  const aiStatus: AiAgentStatus = 'Processing';
  const googleConnected = true;

  return (
    <aside
      className={`
        flex flex-col h-screen bg-bg-secondary border-r border-border-subtle
        transition-all duration-200 ease-out relative z-20
        ${collapsed ? 'w-16' : 'w-[220px]'}
      `}
    >
      {/* Logo Area */}
      <div className="flex items-center h-[52px] px-4 border-b border-border-subtle shrink-0">
        {collapsed ? (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-cyan flex items-center justify-center mx-auto">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-accent-blue to-accent-cyan flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[15px] font-bold text-text-primary tracking-tight">ReachAI</span>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to || (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={`
                flex items-center h-10 rounded-lg transition-all duration-150 ease-out
                relative group
                ${collapsed ? 'justify-center px-0 mx-auto w-10' : 'px-3 mx-2'}
                ${isActive
                  ? 'bg-[#0EA5E915] text-accent-blue'
                  : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                }
              `}
              onMouseEnter={() => setHoveredItem(item.to)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {/* Active indicator - left border */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-accent-blue rounded-r-full" />
              )}
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && (
                <span className="ml-3 text-[13px] font-medium">{item.label}</span>
              )}
              {/* Tooltip for collapsed state */}
              {collapsed && hoveredItem === item.to && (
                <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-bg-elevated border border-border-default rounded-md text-[12px] text-text-primary whitespace-nowrap z-50 shadow-modal">
                  {item.label}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="shrink-0 border-t border-border-subtle py-3 px-2 space-y-2">
        {/* Google Sheets Sync Indicator */}
        <div className={`flex items-center gap-2 ${collapsed ? 'justify-center' : 'px-2'}`}>
          <Sheet className={`w-3.5 h-3.5 ${googleConnected ? 'text-[#10B981]' : 'text-text-muted'}`} />
          {!collapsed && (
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${googleConnected ? 'bg-[#10B981]' : 'bg-text-muted'}`} />
              <span className="text-[11px] text-text-muted">
                {googleConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          )}
        </div>

        {/* AI Agent Status */}
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'px-2'}`}>
          <AiStatusIndicator status={aiStatus} showLabel={!collapsed} size="sm" />
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className={`
            flex items-center gap-2 w-full h-8 rounded-lg
            text-text-muted hover:text-text-primary hover:bg-bg-tertiary
            transition-all duration-150
            ${collapsed ? 'justify-center px-0' : 'px-2'}
          `}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <>
              <PanelLeftClose className="w-4 h-4" />
              <span className="text-[12px]">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
