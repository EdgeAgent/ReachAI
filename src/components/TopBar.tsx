// src/components/TopBar.tsx - Top navigation bar
import { Search, Bell } from 'lucide-react';

interface TopBarProps {
  title: string;
}

export default function TopBar({ title }: TopBarProps) {
  return (
    <header className="flex items-center justify-between h-[52px] px-6 bg-bg-primary border-b border-border-subtle shrink-0">
      {/* Left: Page Title */}
      <h1 className="text-[20px] font-semibold text-text-primary tracking-tight leading-tight">
        {title}
      </h1>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Search Button */}
        <button className="flex items-center gap-2 h-8 px-3 rounded-lg bg-bg-tertiary border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-default transition-all duration-150">
          <Search className="w-3.5 h-3.5" />
          <span className="text-[12px]">Search</span>
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-bg-primary border border-border-subtle text-[10px] text-text-muted font-mono">
            Cmd+K
          </kbd>
        </button>

        {/* Notification Bell */}
        <button className="relative flex items-center justify-center w-8 h-8 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-all duration-150">
          <Bell className="w-[18px] h-[18px]" />
          {/* Unread badge */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-blue" />
        </button>

        {/* User Avatar */}
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-bg-elevated border border-border-subtle text-[12px] font-semibold text-text-secondary">
          RA
        </div>
      </div>
    </header>
  );
}
