// Mock data for NEXUS Dashboard

export interface GazetteEntry {
  id: string;
  source: string;
  icon: string;
  content: string;
  timestamp: string;
  type: 'insolvency' | 'grant' | 'procurement' | 'regulation';
}

export interface WatchlistItem {
  id: string;
  name: string;
  change: number;
  changeType: 'up' | 'down' | 'flat' | 'new';
  lastUpdate: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  type: 'paper' | 'hiring' | 'grant' | 'investment' | 'regulation';
}

export interface GapAnalysisSector {
  name: string;
  gap: number; // percentage
  opportunity: 'high' | 'medium' | 'low';
}

export interface NetworkNode {
  id: string;
  label: string;
  type: 'user' | 'vc' | 'startup' | 'organization';
  x: number;
  y: number;
}

export interface NetworkEdge {
  from: string;
  to: string;
  strength: number;
}

export const gazetteEntries: GazetteEntry[] = [
  {
    id: '1',
    source: 'London Gazette',
    icon: '🇬🇧',
    content: '3 insolvencies today (tech sector)',
    timestamp: '8m ago',
    type: 'insolvency'
  },
  {
    id: '2',
    source: 'EIC Accelerator',
    icon: '🟢',
    content: 'New grant: €2.5M · Quantum Computing',
    timestamp: '12m ago',
    type: 'grant'
  },
  {
    id: '3',
    source: 'OJEU',
    icon: '📰',
    content: '12 new procurement notices · Clean Energy',
    timestamp: '18m ago',
    type: 'procurement'
  },
  {
    id: '4',
    source: 'Federal Register',
    icon: '🇺🇸',
    content: 'Proposed SEC climate disclosure rule',
    timestamp: '25m ago',
    type: 'regulation'
  },
  {
    id: '5',
    source: 'UKRI',
    icon: '🔬',
    content: 'EPSRC call: £15M · Advanced Materials',
    timestamp: '32m ago',
    type: 'grant'
  },
  {
    id: '6',
    source: 'Innovate UK',
    icon: '💡',
    content: 'Smart Grants open: £500K-£2M · Deep Tech',
    timestamp: '45m ago',
    type: 'grant'
  }
];

export const watchlistItems: WatchlistItem[] = [
  {
    id: '1',
    name: 'Helios Tandem',
    change: 12,
    changeType: 'up',
    lastUpdate: 'New patent filed'
  },
  {
    id: '2',
    name: 'Solid State Labs',
    change: 0,
    changeType: 'flat',
    lastUpdate: 'Series B rumors'
  },
  {
    id: '3',
    name: 'Orbital AI',
    change: -3,
    changeType: 'down',
    lastUpdate: 'Launch delay news'
  },
  {
    id: '4',
    name: 'Lattice Forge',
    change: 0,
    changeType: 'new',
    lastUpdate: 'Just added'
  }
];

export const timelineEvents: TimelineEvent[] = [
  {
    id: '1',
    date: 'Oct 2025',
    title: 'Paper spike (perovskite)',
    description: '3 papers this week',
    confidence: 'HIGH',
    type: 'paper'
  },
  {
    id: '2',
    date: 'Nov 2025',
    title: 'Hiring wave',
    description: '12 roles in quantum sector',
    confidence: 'MEDIUM',
    type: 'hiring'
  },
  {
    id: '3',
    date: 'Dec 2025',
    title: 'Grant announcement',
    description: '£50M program expected',
    confidence: 'HIGH',
    type: 'grant'
  },
  {
    id: '4',
    date: 'Jan 2026',
    title: 'Investment cluster',
    description: 'VC activity predicted in battery tech',
    confidence: 'MEDIUM',
    type: 'investment'
  }
];

export const gapAnalysisData: GapAnalysisSector[] = [
  { name: 'Quantum Computing', gap: 82, opportunity: 'high' },
  { name: 'Batteries & Storage', gap: 71, opportunity: 'high' },
  { name: 'AI Chips', gap: 65, opportunity: 'medium' },
  { name: 'Carbon Capture', gap: 58, opportunity: 'medium' },
  { name: 'Semiconductors', gap: 54, opportunity: 'medium' },
  { name: 'Biotech', gap: 42, opportunity: 'low' }
];

export const networkNodes: NetworkNode[] = [
  { id: 'user', label: 'Your Org', type: 'user', x: 200, y: 150 },
  { id: 'vc1', label: 'Deep Tech VC', type: 'vc', x: 100, y: 80 },
  { id: 'vc2', label: 'Quantum Fund', type: 'vc', x: 300, y: 80 },
  { id: 's1', label: 'Helios Tandem', type: 'startup', x: 50, y: 200 },
  { id: 's2', label: 'Solid State Labs', type: 'startup', x: 350, y: 200 },
  { id: 'org1', label: 'Imperial College', type: 'organization', x: 200, y: 250 }
];

export const networkEdges: NetworkEdge[] = [
  { from: 'user', to: 'vc1', strength: 0.8 },
  { from: 'user', to: 'vc2', strength: 0.6 },
  { from: 'vc1', to: 's1', strength: 0.9 },
  { from: 'vc2', to: 's2', strength: 0.7 },
  { from: 'user', to: 'org1', strength: 0.5 },
  { from: 'org1', to: 's1', strength: 0.4 }
];

export const heatmapRegions = [
  { name: 'London', value: 95, x: 45, y: 38 },
  { name: 'Cambridge', value: 88, x: 48, y: 36 },
  { name: 'Oxford', value: 82, x: 46, y: 37 },
  { name: 'Manchester', value: 65, x: 43, y: 34 },
  { name: 'Edinburgh', value: 72, x: 47, y: 30 },
  { name: 'Bristol', value: 58, x: 44, y: 39 },
  { name: 'Birmingham', value: 52, x: 44, y: 35 },
  { name: 'Berlin', value: 78, x: 55, y: 33 },
  { name: 'Paris', value: 70, x: 53, y: 36 },
  { name: 'Amsterdam', value: 68, x: 54, y: 32 }
];

export const pricingTiers = [
  {
    name: 'Explorer',
    price: 'FREE',
    period: '',
    features: [
      '10 searches/day',
      '2 sectors tracked',
      'Weekly email alerts',
      'View templates only',
      'Community access'
    ],
    cta: 'Start Free',
    popular: false
  },
  {
    name: 'Pro',
    price: '£49',
    period: '/month',
    features: [
      'Unlimited searches',
      '10 sectors tracked',
      'Real-time alerts',
      '5 auto-filled apps/mo',
      'Export reports',
      'Priority support'
    ],
    cta: 'Start Pro Trial',
    popular: true
  },
  {
    name: 'Team',
    price: '£199',
    period: '/month',
    features: [
      'Everything in Pro',
      '25 auto-filled apps/mo',
      'Up to 10 users',
      'Collaboration tools',
      'Shared watchlists',
      'API access (read)'
    ],
    cta: 'Contact Sales',
    popular: false
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    features: [
      'Unlimited everything',
      'Full API access',
      'Dedicated support',
      'SLA guarantee',
      'Custom integrations',
      'On-premise option'
    ],
    cta: 'Talk to Us',
    popular: false
  }
];

export const testimonials = [
  {
    quote: "NEXUS cut our grant writing time by 94%. We've won £2.4M in 6 months.",
    author: "Dr. Sarah Chen",
    role: "CTO",
    company: "Quantum Materials Ltd"
  },
  {
    quote: "The gazette monitor alone is worth 10x the subscription. We never miss an opportunity.",
    author: "James Mitchell",
    role: "Head of Innovation",
    company: "GreenTech Ventures"
  },
  {
    quote: "From 16 hours to 17 minutes. Our team can now focus on research, not paperwork.",
    author: "Prof. Elena Rodriguez",
    role: "Principal Investigator",
    company: "Imperial College London"
  }
];

export const features = [
  {
    title: 'Universal Document Parser',
    icon: 'FileText',
    description: 'Parse PDFs, Word docs, XML schemas, HTML portals, scanned forms automatically',
    tags: ['OCR', 'NLP', 'Vision AI']
  },
  {
    title: 'Entity Knowledge Graph',
    icon: 'Network',
    description: 'Knows everything about your company, team, funding history, patents',
    tags: ['Graph DB', 'Auto-fill', 'Real-time']
  },
  {
    title: '98% Automation Engine',
    icon: 'Zap',
    description: 'Auto-generate abstracts, impact statements, risk assessments with LLM',
    tags: ['GPT-4', 'Claude', 'Fine-tuned Models']
  },
  {
    title: 'Gazette Monitor',
    icon: 'Newspaper',
    description: 'Live parsing of London Gazette, OJEU, Federal Register, global portals',
    tags: ['Real-time', 'Multi-source', 'Alerts']
  },
  {
    title: 'Submission Gateway',
    icon: 'Send',
    description: 'Submit via API, RPA browser automation, or file upload packages',
    tags: ['API', 'RPA', 'Proof-of-Capture']
  },
  {
    title: 'Intelligence Dashboard',
    icon: 'BarChart3',
    description: 'Heatmaps, gap analysis, predictive signals, competitor tracking',
    tags: ['Analytics', 'ML Predictions', 'Alerts']
  }
];
