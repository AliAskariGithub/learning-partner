/**
 * Central Site Configuration
 * 
 * IMPORTANT: Every page in Learning Partner describes ONLY what this codebase
 * actually does. No invented statistics, no testimonials, no fake team members,
 * no certifications (e.g. never claim SOC 2, ISO, bank-grade or military-grade),
 * no fake user counts, and no promises the product doesn't keep.
 * 
 * Unresolved facts must use the format [[ CONFIRM: topic ]] (without extra space).
 * Run `npm run check:placeholders` to audit all unresolved placeholders.
 */

export const siteConfig = {
  name: 'Learning Partner',
  shortName: 'LP',
  tagline: 'Grounded AI Study Workspace with Verifiable Citations',
  description:
    'Free, open study partner that answers strictly from your own sources with exact citation chips, interactive Socratic learning, active recall quizzes, and multi-format studio synthesizers.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  
  // Owner & Governance
  owner: {
    displayName: 'Ali Askari',
    legalName: '[[CONFIRM: legal owner or entity name]]',
    contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || '[[CONFIRM: contact email address]]',
    adminNotificationEmail: process.env.CONTACT_TO_EMAIL || '[[CONFIRM: admin recipient email]]',
    githubUrl: 'https://github.com/AliAskariGithub/learning-partner',
    portfolioUrl: 'https://aliaskari.xyz/',
    linkedinUrl: 'https://www.linkedin.com/in/aliaskaridev/',
    xUrl: 'https://x.com/aliaskaridev',
    instagramUrl: 'https://www.instagram.com/aliaskaridev/',
    facebookUrl: 'https://www.facebook.com/aliaskaridev/',
    expectedResponseTime: 'Within 24 to 48 business hours',
    governingJurisdiction: '[[CONFIRM: governing law jurisdiction]]',
  },

  // Public Social Handles
  socials: [
    { label: 'Portfolio', href: 'https://aliaskari.xyz/' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/aliaskaridev/' },
    { label: 'X', href: 'https://x.com/aliaskaridev' },
    { label: 'Instagram', href: 'https://www.instagram.com/aliaskaridev/' },
    { label: 'Facebook', href: 'https://www.facebook.com/aliaskaridev/' },
  ],

  // Compliance & Demographics
  compliance: {
    minimumAge: '[[CONFIRM: minimum user age (e.g. 13 or 16)]]',
    privacyPolicyEffectiveDate: '[[CONFIRM: policy effective date]]',
    privacyPolicyLastUpdated: 'November 4, 2026',
    termsEffectiveDate: '[[CONFIRM: terms effective date]]',
    termsLastUpdated: 'November 4, 2026',
  },

  // Infrastructure & Service Providers (Ground truth from codebase)
  infrastructure: {
    hosting: {
      provider: 'Vercel',
      region: 'iad1 (Washington, D.C., USA)',
    },
    database: {
      provider: 'Neon Serverless Postgres',
      region: 'AWS us-east-1 (N. Virginia, USA)',
    },
    authentication: {
      provider: 'Neon Auth (OAuth & Passwordless / Email Session)',
    },
    storage: {
      provider: 'Vercel Blob Storage with Local Disk development fallback',
    },
    email: {
      provider: 'Resend',
    },
  },

  // Data Retention Periods (Ground truth)
  retention: {
    userAccountData: 'Retained indefinitely until manually exported or deleted by the user from Settings.',
    notebookContent: 'Stored in Neon Postgres and file storage until deleted by the user.',
    ipHashSpamLogsDays: 30,
    contactMessagesDays: 365,
    feedbackReportsDays: 365,
  },

  // Feature Flags
  features: {
    // Never write "free forever" unless this flag is explicitly true
    promiseFreeForever: false,
    
    // ChatGPT OAuth connection status
    chatGptEnabled: process.env.NEXT_PUBLIC_ENABLE_CHATGPT === 'true',
    
    // Cloudflare Turnstile anti-bot verification
    turnstileEnabled: Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY),
    
    // Sender confirmation email
    confirmationEmailEnabled: process.env.ENABLE_CONFIRMATION_EMAIL === 'true',

    // Email delivery active
    emailDeliveryEnabled: Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_TO_EMAIL),
  },

  // Study workspace capabilities (ground truth limits)
  capabilities: {
    maxFileSizeMb: 25,
    maxSourcesPerNotebook: 50,
    supportedFileFormats: ['.pdf', '.docx', '.txt', '.md', 'Web URLs'],
    supportedImageFormats: ['PNG', 'JPEG', 'WebP'],
    maxImagesPerLearningMessage: 5,
    modes: [
      { id: 'chat', label: 'Chat', description: 'Grounded research and synthesis from sources.' },
      { id: 'learn', label: 'Learn', description: 'Socratic step-by-step guidance with optional textbook image uploads.' },
      { id: 'quiz', label: 'Quiz', description: 'Active recall tests with live instant scoring and explanation.' },
    ],
    studioOutputs: [
      { id: 'quiz', label: 'Quiz', description: 'Interactive multiple choice active recall questions.' },
      { id: 'flashcards', label: 'Flashcards', description: 'Spaced recall cards with front/back flip.' },
      { id: 'study-guide', label: 'Study Guide', description: 'Structured serif curriculum with key terms.' },
      { id: 'summary', label: 'Summary', description: 'Concise executive briefing document.' },
      { id: 'mindmap', label: 'Mind Map', description: 'Zoomable, collapsible hierarchical concept graph.' },
      { id: 'report', label: 'Report', description: 'Formal academic briefing essay with citations.' },
      { id: 'voice', label: 'Voice Overview', description: 'Two co-hosts (Alex and Jordan) discussing sources or solo narrator.' },
    ],
  },
} as const;

export type SiteConfig = typeof siteConfig;
