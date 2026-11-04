export interface MarketingRoute {
  path: string;
  title: string;
  shortDescription: string;
  category: 'product' | 'resources' | 'legal' | 'support';
}

export const MARKETING_ROUTES: MarketingRoute[] = [
  {
    path: '/about',
    title: 'About',
    shortDescription: 'Our mission, grounded research philosophy, and who builds Learning Partner.',
    category: 'product',
  },
  {
    path: '/features',
    title: 'Features',
    shortDescription: 'Complete tour of sources, grounding, three study modes, and studio synthesizers.',
    category: 'product',
  },
  {
    path: '/how-it-works',
    title: 'How It Works',
    shortDescription: 'Three clear steps with GSAP storytelling and an under-the-hood retrieval walkthrough.',
    category: 'product',
  },
  {
    path: '/connect-ai',
    title: 'Connect Your AI',
    shortDescription: 'Step-by-step BYOK setup for Gemini Free Tier, ChatGPT Plus/Pro, Anthropic, OpenAI, and custom endpoints.',
    category: 'resources',
  },
  {
    path: '/pricing',
    title: 'Pricing & Cost Guide',
    shortDescription: 'Zero software platform fees, transparent provider API costs, and tier comparison.',
    category: 'product',
  },
  {
    path: '/faq',
    title: 'FAQ',
    shortDescription: 'Frequently asked questions about citations, BYOK encryption, limits, and privacy.',
    category: 'resources',
  },
  {
    path: '/use-cases',
    title: 'Use Cases',
    shortDescription: 'Real study workflows: exam prep, textbook problem solving, research summarization, and audio commuting.',
    category: 'resources',
  },
  {
    path: '/help',
    title: 'Help Center',
    shortDescription: 'Comprehensive documentation, step-by-step guides, troubleshooting, and search.',
    category: 'support',
  },
  {
    path: '/contact',
    title: 'Contact',
    shortDescription: 'Send a message or support inquiry to the Learning Partner maintainer.',
    category: 'support',
  },
  {
    path: '/feedback',
    title: 'Report a Bug / Feedback',
    shortDescription: 'Report bugs with optional screenshots, suggest feature ideas, or share experience.',
    category: 'support',
  },
  {
    path: '/security',
    title: 'Security',
    shortDescription: 'AES-256-GCM encryption, tenant isolation, SSRF defenses, and vulnerability disclosure.',
    category: 'legal',
  },
  {
    path: '/privacy',
    title: 'Privacy Policy',
    shortDescription: 'How your sources, account data, API keys, and memory are handled and protected.',
    category: 'legal',
  },
  {
    path: '/terms',
    title: 'Terms of Service',
    shortDescription: 'Acceptable use, AI study disclaimer, provider responsibilities, and governing law.',
    category: 'legal',
  },
];

export const FOOTER_SECTIONS = [
  {
    title: 'Product',
    routes: MARKETING_ROUTES.filter((r) => r.category === 'product'),
  },
  {
    title: 'Resources',
    routes: MARKETING_ROUTES.filter((r) => r.category === 'resources'),
  },
  {
    title: 'Support',
    routes: MARKETING_ROUTES.filter((r) => r.category === 'support'),
  },
  {
    title: 'Legal & Security',
    routes: MARKETING_ROUTES.filter((r) => r.category === 'legal'),
  },
];

