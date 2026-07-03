# ReachAI v1.0.0

AI-powered automated email outreach desktop app. Send personalized AI-generated emails, sync with Google Sheets, manage leads, and track campaigns.

## Features

- **AI Email Generation** - Generate personalized outreach emails using OpenRouter AI (16 models, 13 free)
- **Google Sheets Sync** - Connect via OAuth, auto-import leads, update statuses
- **CSV Import** - Drag-and-drop CSV upload with topic grouping
- **Campaign Management** - Multi-step email sequences with AI generation
- **Lead Pipeline** - Track leads: New > Reached > Warm > Hot > Cold
- **SMTP Email Sending** - Send emails via your own email provider
- **Dark Premium UI** - Professional dark theme with smooth animations
- **One-Time Purchase** - No subscriptions

## Tech Stack

- Electron + React 19 + TypeScript
- Tailwind CSS + shadcn/ui
- nodemailer (SMTP)
- Google Sheets API v4 + OAuth2
- OpenRouter API (AI models)
- electron-store (encrypted local storage)

## Quick Start

```bash
# 1. Clone
git clone https://github.com/EdgeAgent/ReachAI.git
cd ReachAI

# 2. Install
npm install

# 3. Build
npm run build

# 4. Run
npm start
```

## Build Installer

```bash
npm install @electron-forge/cli --save-dev
npx electron-forge import
npx electron-forge make
```

## Configuration

### OpenRouter AI (Required for AI features)
1. Go to https://openrouter.ai/keys
2. Create a free API key
3. Paste it in the app's Setup Wizard or Settings > AI

### SMTP Email (Required for sending)
1. **Gmail**: Use smtp.gmail.com:587 with App Password
2. **Outlook**: Use smtp.office365.com:587
3. Enter details in Settings > Email

### Google Sheets (Optional)
1. Create a Google Sheet with columns: Name, Email, Company, Status, Topic, Notes
2. Share it publicly
3. Paste the URL in Settings > Google Sheets

## License

Proprietary - Edge Agency
