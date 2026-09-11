import React from 'react';
import { 
  BookOpen, 
  FileText, 
  FolderGit2, 
  Palette, 
  Sparkles, 
  Globe, 
  Link2,
  ExternalLink,
  HardDrive
} from 'lucide-react';
import { BrandLinkType } from '../../types';

export interface BrandTypeConfig {
  type: BrandLinkType;
  label: string;
  icon: React.ElementType;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  domainKeywords: string[];
}

export const BRAND_LINK_CONFIGS: Record<BrandLinkType, BrandTypeConfig> = {
  NOTION: {
    type: 'NOTION',
    label: 'Notion',
    icon: BookOpen,
    badgeBg: 'bg-slate-900',
    badgeText: 'text-white',
    badgeBorder: 'border-slate-800',
    domainKeywords: ['notion.so', 'notion.site'],
  },
  GOOGLE_DOC: {
    type: 'GOOGLE_DOC',
    label: 'Google Docs',
    icon: FileText,
    badgeBg: 'bg-blue-600',
    badgeText: 'text-white',
    badgeBorder: 'border-blue-700',
    domainKeywords: ['docs.google.com/document', 'docs.google.com/document/d/'],
  },
  GOOGLE_DRIVE: {
    type: 'GOOGLE_DRIVE',
    label: 'Google Drive / Sheet',
    icon: HardDrive,
    badgeBg: 'bg-amber-600',
    badgeText: 'text-white',
    badgeBorder: 'border-amber-700',
    domainKeywords: ['drive.google.com', 'docs.google.com/spreadsheets', 'docs.google.com/presentation', 'docs.google.com/forms'],
  },
  FIGMA: {
    type: 'FIGMA',
    label: 'Figma',
    icon: Palette,
    badgeBg: 'bg-purple-600',
    badgeText: 'text-white',
    badgeBorder: 'border-purple-700',
    domainKeywords: ['figma.com'],
  },
  CANVA: {
    type: 'CANVA',
    label: 'Canva',
    icon: Sparkles,
    badgeBg: 'bg-teal-600',
    badgeText: 'text-white',
    badgeBorder: 'border-teal-700',
    domainKeywords: ['canva.com'],
  },
  WEBSITE: {
    type: 'WEBSITE',
    label: 'Website / Hub',
    icon: Globe,
    badgeBg: 'bg-sky-600',
    badgeText: 'text-white',
    badgeBorder: 'border-sky-700',
    domainKeywords: ['http', 'www', '.com', '.co', '.org', '.io', '.net'],
  },
  OTHER: {
    type: 'OTHER',
    label: 'Other Link',
    icon: Link2,
    badgeBg: 'bg-slate-600',
    badgeText: 'text-white',
    badgeBorder: 'border-slate-700',
    domainKeywords: [],
  },
};

export const detectBrandLinkType = (url: string): BrandLinkType => {
  if (!url || typeof url !== 'string') return 'OTHER';
  const lower = url.toLowerCase().trim();

  if (lower.includes('notion.so') || lower.includes('notion.site')) {
    return 'NOTION';
  }
  if (lower.includes('docs.google.com/document')) {
    return 'GOOGLE_DOC';
  }
  if (
    lower.includes('drive.google.com') ||
    lower.includes('docs.google.com/spreadsheets') ||
    lower.includes('docs.google.com/presentation') ||
    lower.includes('docs.google.com/forms')
  ) {
    return 'GOOGLE_DRIVE';
  }
  if (lower.includes('figma.com')) {
    return 'FIGMA';
  }
  if (lower.includes('canva.com')) {
    return 'CANVA';
  }
  if (/^https?:\/\//i.test(lower) || lower.includes('.com') || lower.includes('.co')) {
    return 'WEBSITE';
  }

  return 'OTHER';
};

export const sanitizeUrl = (url: string): string => {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

export const PRESET_GUIDELINE_TITLES = [
  'Brand Identity & CI Guideline',
  'SOP ขั้นตอนการถ่ายทำ & ผลิต',
  'SOP ขั้นตอนการตัดต่อ & กราฟิก',
  'Notion Production Workspace',
  'Google Drive Assets & Footage',
  'Figma Design System & Moodboard',
  'Canva Social Media Templates',
  'Target Audience & Persona Guide',
];
