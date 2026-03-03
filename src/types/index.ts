export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface BrandProject {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'generating' | 'completed' | 'exported';
  messages: Message[];
  branding?: BrandBranding;
  canGenerate?: boolean;
}

export interface BrandBranding {
  brandName: string;
  tagline: string;
  logo: string;
  colors: BrandColor[];
  typography: TypographySet;
  icons: BrandIcon[];
  proposals: BrandProposal[];
  selectedProposalId?: number;
  selectedComponents?: {
    colorProposalId?: number;
    typographyProposalId?: number;
    moodProposalId?: number;
  };
}

export interface BrandColor {
  name: string;
  hex: string;
  usage: string;
}

export interface TypographySet {
  heading: FontChoice;
  body: FontChoice;
}

export interface FontChoice {
  name: string;
  fontFamily: string;
  usage: string;
  googleFont: string;
}

export interface BrandIcon {
  name: string;
  svg: string;
  description: string;
}

export interface BrandProposal {
  id: number;
  name: string;
  description: string;
  colorScheme: string[];
  typography: {
    titulo: string;
    cuerpo: string;
  };
  mood: string;
  applications: string[];
  logo?: string;
  icons?: BrandIcon[];
}

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
}

export interface AppSettings {
  openaiApiKey: string;
  theme: 'light' | 'dark';
  language: string;
  webhooks: WebhookConfig[];
}
