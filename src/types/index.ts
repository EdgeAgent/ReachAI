// src/types/index.ts - Shared TypeScript types for ReachAI

export type LeadStatus = 'New' | 'Reached' | 'Warm' | 'Hot' | 'Cold';

export type EmailType =
  | 'cold-outreach'
  | 'warm-intro'
  | 'follow-up'
  | 're-engagement'
  | 'proposal'
  | 'meeting-request';

export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  status: LeadStatus;
  lastContact: string | null;
  notes: string;
  source: string;
  rowIndex?: number;
  // NEW FIELDS:
  topic: string;           // e.g., "Real Estate", "SaaS", "Agency", "E-commerce"
  emailType: EmailType;    // type of email for this lead
  tags: string[];          // additional tags for grouping
}

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';

export interface EmailStep {
  id: string;
  order: number;
  subject: string;
  body: string;
  delay: number; // hours
  aiGenerated: boolean;
  tone: string;
}

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  leadsTotal: number;
  leadsSent: number;
  leadsOpened: number;
  leadsReplied: number;
  openRate: number;
  replyRate: number;
  createdAt: string;
  updatedAt: string;
  sequence: EmailStep[];
  leadIds?: string[];
}

export interface BusinessConfig {
  name: string;
  website: string;
  industry: string;
  description: string;
}

export interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  fromName: string;
  fromEmail: string;
}

export interface GoogleConfig {
  tokens: Record<string, unknown>;
  sheetId: string;
  sheetName: string;
}

export interface OpenRouterConfig {
  apiKey: string;
  model: string;
}

export interface SheetMapping {
  nameCol: string;
  emailCol: string;
  companyCol: string;
  statusCol: string;
  notesCol: string;
}

export type ActivityType =
  | 'email_sent'
  | 'email_opened'
  | 'email_replied'
  | 'status_changed'
  | 'lead_imported'
  | 'ai_generated'
  | 'error';

export interface ActivityLog {
  id: string;
  type: ActivityType;
  message: string;
  leadName?: string;
  campaignName?: string;
  timestamp: string;
}

export type AiAgentStatus = 'Idle' | 'Processing' | 'Sending';

// Email template for a specific topic + type combination
export interface EmailTemplate {
  id: string;
  topic: string;           // e.g., "Real Estate"
  emailType: EmailType;
  name: string;            // display name
  subject: string;
  body: string;
  tone: string;
  aiPrompt?: string;       // extra context for AI generation
  variables: string[];     // available variables like {{name}}, {{company}}
  createdAt: string;
  updatedAt: string;
}

// Topic configuration
export interface TopicConfig {
  id: string;
  name: string;
  color: string;           // hex color for topic badge
  description: string;
  defaultEmailType: EmailType;
  emailTypes: EmailType[]; // which email types are available
  aiContext: string;       // context passed to AI for this topic
}

// AI generation request with topic context
export interface AIGenerateRequest {
  leadInfo: {
    name: string;
    email: string;
    company: string;
    topic: string;
    notes: string;
  };
  tone: string;
  emailType: EmailType;
  topicContext: string;
  purpose?: string;
  additionalContext?: string;
  template?: EmailTemplate;
}
