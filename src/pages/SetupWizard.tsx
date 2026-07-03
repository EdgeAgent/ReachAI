import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from '@/lib/framer-motion-shim';
import { toast } from 'sonner';
import {
  CheckCircle2, Circle, ChevronRight, Building2, Mail, Key,
  Sparkles, ArrowRight, ArrowLeft, Save, Loader2, Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: typeof Building2;
}

const steps: WizardStep[] = [
  { id: 'profile', title: 'Business Profile', description: 'Tell us about your business', icon: Building2 },
  { id: 'email', title: 'Email Setup', description: 'Configure your email server', icon: Mail },
  { id: 'ai', title: 'AI Configuration', description: 'Set up your AI model', icon: Sparkles },
  { id: 'done', title: 'All Set!', description: 'You are ready to go', icon: CheckCircle2 },
];

export default function SetupWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Form state
  const [businessName, setBusinessName] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [description, setDescription] = useState('');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [fromName, setFromName] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [openRouterModel, setOpenRouterModel] = useState('anthropic/claude-sonnet-4-20250514');

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const canProceed =
    currentStep === 0 ? businessName.trim() :
    currentStep === 1 ? smtpHost.trim() && smtpUser.trim() && smtpPass.trim() :
    currentStep === 2 ? openRouterKey.trim() :
    true;

  const handleNext = async () => {
    if (isLastStep) {
      navigate('/dashboard');
      return;
    }
    if (currentStep === steps.length - 2) {
      // Save all settings on last real step
      setSaving(true);
      try {
        await window.electronAPI?.storeSet('settings', {
          businessName, website, industry, description,
          smtpHost, smtpPort, smtpUser, smtpPass, fromName, fromEmail,
          openRouterKey, openRouterModel,
        });
        await window.electronAPI?.storeSet('business', { name: businessName, website, industry, description });
        await window.electronAPI?.storeSet('openrouter', { apiKey: openRouterKey, model: openRouterModel });
        toast.success('Setup complete!');
      } catch {
        toast.error('Failed to save some settings');
      }
      setSaving(false);
    }
    setCurrentStep(s => Math.min(s + 1, steps.length - 1));
  };

  const handleBack = () => {
    setCurrentStep(s => Math.max(s - 1, 0));
  };

  const skipWizard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg-primary p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-blue to-accent-cyan flex items-center justify-center shadow-glow-blue">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="ml-3 text-[22px] font-bold text-text-primary tracking-tight">ReachAI</span>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-8 px-4">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold transition-all ${
                  i < currentStep ? 'bg-[#10B981] text-white' :
                  i === currentStep ? 'bg-accent-blue text-white' :
                  'bg-bg-tertiary text-text-muted'
                }`}>
                  {i < currentStep ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-[10px] mt-1.5 font-medium ${i === currentStep ? 'text-text-primary' : 'text-text-muted'}`}>
                  {s.title}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-2 mt-[-14px] ${i < currentStep ? 'bg-[#10B981]' : 'bg-bg-tertiary'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-bg-secondary border border-border-subtle rounded-card p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Step 0: Business Profile */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <Building2 className="w-10 h-10 text-accent-blue mx-auto mb-3" />
                    <h2 className="text-[20px] font-semibold text-text-primary">Business Profile</h2>
                    <p className="text-[13px] text-text-secondary mt-1">Tell us about your business for AI personalization</p>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted mb-1.5 block">Business Name *</label>
                    <Input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Acme Inc."
                      className="bg-bg-primary border-border-subtle text-text-primary placeholder:text-text-muted" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted mb-1.5 block">Website</label>
                    <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://acme.com"
                      className="bg-bg-primary border-border-subtle text-text-primary placeholder:text-text-muted" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted mb-1.5 block">Industry</label>
                    <Input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g., SaaS, Real Estate"
                      className="bg-bg-primary border-border-subtle text-text-primary placeholder:text-text-muted" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted mb-1.5 block">Description</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What does your business do?"
                      rows={3} className="w-full bg-bg-primary border border-border-subtle rounded-lg px-3 py-2 text-[13px] text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-border-default" />
                  </div>
                </div>
              )}

              {/* Step 1: Email Setup */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <Mail className="w-10 h-10 text-[#EF4444] mx-auto mb-3" />
                    <h2 className="text-[20px] font-semibold text-text-primary">Email Setup</h2>
                    <p className="text-[13px] text-text-secondary mt-1">Configure your email server for sending</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted mb-1.5 block">SMTP Host *</label>
                      <Input value={smtpHost} onChange={e => setSmtpHost(e.target.value)} placeholder="smtp.gmail.com"
                        className="bg-bg-primary border-border-subtle text-text-primary placeholder:text-text-muted" />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted mb-1.5 block">SMTP Port</label>
                      <Input value={smtpPort} onChange={e => setSmtpPort(e.target.value)} placeholder="587"
                        className="bg-bg-primary border-border-subtle text-text-primary placeholder:text-text-muted" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted mb-1.5 block">Username *</label>
                    <Input value={smtpUser} onChange={e => setSmtpUser(e.target.value)} placeholder="your-email@gmail.com"
                      className="bg-bg-primary border-border-subtle text-text-primary placeholder:text-text-muted" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted mb-1.5 block">Password *</label>
                    <Input type="password" value={smtpPass} onChange={e => setSmtpPass(e.target.value)} placeholder="App-specific password"
                      className="bg-bg-primary border-border-subtle text-text-primary placeholder:text-text-muted" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted mb-1.5 block">From Name</label>
                      <Input value={fromName} onChange={e => setFromName(e.target.value)} placeholder="John Doe"
                        className="bg-bg-primary border-border-subtle text-text-primary placeholder:text-text-muted" />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted mb-1.5 block">From Email</label>
                      <Input value={fromEmail} onChange={e => setFromEmail(e.target.value)} placeholder="john@acme.com"
                        className="bg-bg-primary border-border-subtle text-text-primary placeholder:text-text-muted" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: AI Config */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <Sparkles className="w-10 h-10 text-[#8B5CF6] mx-auto mb-3" />
                    <h2 className="text-[20px] font-semibold text-text-primary">AI Configuration</h2>
                    <p className="text-[13px] text-text-secondary mt-1">Connect your AI model for email generation</p>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted mb-1.5 block">OpenRouter API Key *</label>
                    <Input type="password" value={openRouterKey} onChange={e => setOpenRouterKey(e.target.value)} placeholder="sk-or-..."
                      className="bg-bg-primary border-border-subtle text-text-primary placeholder:text-text-muted font-mono" />
                    <p className="text-[11px] text-text-muted mt-1">Get your key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">openrouter.ai/keys</a></p>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted mb-1.5 block">AI Model</label>
                    <Input value={openRouterModel} onChange={e => setOpenRouterModel(e.target.value)} placeholder="anthropic/claude-sonnet-4-20250514"
                      className="bg-bg-primary border-border-subtle text-text-primary placeholder:text-text-muted font-mono" />
                  </div>
                </div>
              )}

              {/* Step 3: Done */}
              {currentStep === 3 && (
                <div className="text-center py-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  >
                    <CheckCircle2 className="w-16 h-16 text-[#10B981] mx-auto mb-4" />
                  </motion.div>
                  <h2 className="text-[22px] font-semibold text-text-primary mb-2">You are all set!</h2>
                  <p className="text-[14px] text-text-secondary mb-6 max-w-sm mx-auto">
                    ReachAI is configured and ready to help you reach more leads with AI-powered outreach.
                  </p>
                  <Button onClick={() => navigate('/dashboard')} className="bg-accent-blue text-white hover:brightness-110 text-[14px] px-6 py-2.5 h-auto">
                    Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          {currentStep < 3 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border-subtle">
              <div>
                {currentStep > 0 ? (
                  <Button variant="ghost" onClick={handleBack} className="text-text-secondary hover:text-text-primary">
                    <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={skipWizard} className="text-text-muted hover:text-text-secondary text-[12px]">
                    Skip for now
                  </Button>
                )}
              </div>
              <Button onClick={handleNext} disabled={!canProceed || saving}
                className="bg-accent-blue text-white hover:brightness-110 transition-all">
                {saving ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving...</span>
                ) : (
                  <span className="flex items-center gap-2">{currentStep === steps.length - 2 ? 'Finish' : 'Continue'} <ArrowRight className="w-4 h-4" /></span>
                )}
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
