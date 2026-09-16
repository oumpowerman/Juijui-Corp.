import React from 'react';
import { 
  BookOpen, 
  FileText, 
  FolderOpen, 
  Figma, 
  Hash, 
  Globe, 
  Link as LinkIcon 
} from 'lucide-react';
import { BrandLinkType } from '../../../types';

export interface BrandLinkServiceConfig {
  type: BrandLinkType;
  label: string;
  description: string;
  icon: React.ElementType;
  // Colors for badges and cards
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  cardHoverBorder: string;
  cardBg: string;
  iconContainerBg: string;
  iconColor: string;
  placeholderTitle: string;
  placeholderUrl: string;
}

export const BRAND_LINK_SERVICES: Record<BrandLinkType, BrandLinkServiceConfig> = {
  NOTION: {
    type: 'NOTION',
    label: 'Notion',
    description: 'คู่มือ SOP, Workspace, Content Tracker',
    icon: BookOpen,
    badgeBg: 'bg-slate-900',
    badgeText: 'text-white',
    borderColor: 'border-slate-200',
    cardHoverBorder: 'hover:border-slate-900/40',
    cardBg: 'bg-white hover:bg-slate-50/80',
    iconContainerBg: 'bg-slate-900 text-white',
    iconColor: 'text-white',
    placeholderTitle: 'เช่น คู่มือทำคอนเทนต์ (Notion SOP)',
    placeholderUrl: 'https://notion.so/workspace/...',
  },
  GOOGLE_DOCS: {
    type: 'GOOGLE_DOCS',
    label: 'Google Docs',
    description: 'เอกสารบรีฟ, Script, ข้อกำหนดแบรนด์',
    icon: FileText,
    badgeBg: 'bg-blue-600',
    badgeText: 'text-white',
    borderColor: 'border-blue-200',
    cardHoverBorder: 'hover:border-blue-400',
    cardBg: 'bg-blue-50/40 hover:bg-blue-50/80',
    iconContainerBg: 'bg-blue-600 text-white',
    iconColor: 'text-white',
    placeholderTitle: 'เช่น บรีฟงาน / Mood & Tone Guide',
    placeholderUrl: 'https://docs.google.com/document/d/...',
  },
  GOOGLE_DRIVE: {
    type: 'GOOGLE_DRIVE',
    label: 'Google Drive',
    description: 'โฟลเดอร์ Asset, ฟอนต์, โลโก้, ฟุตเทจดิบ',
    icon: FolderOpen,
    badgeBg: 'bg-emerald-600',
    badgeText: 'text-white',
    borderColor: 'border-emerald-200',
    cardHoverBorder: 'hover:border-emerald-400',
    cardBg: 'bg-emerald-50/40 hover:bg-emerald-50/80',
    iconContainerBg: 'bg-emerald-600 text-white',
    iconColor: 'text-white',
    placeholderTitle: 'เช่น รวมฟอนต์ & โลโก้แบรนด์ (Drive)',
    placeholderUrl: 'https://drive.google.com/drive/folders/...',
  },
  FIGMA: {
    type: 'FIGMA',
    label: 'Figma',
    description: 'CI Guidelines, Design System, Artwork',
    icon: Figma,
    badgeBg: 'bg-purple-600',
    badgeText: 'text-white',
    borderColor: 'border-purple-200',
    cardHoverBorder: 'hover:border-purple-400',
    cardBg: 'bg-purple-50/40 hover:bg-purple-50/80',
    iconContainerBg: 'bg-purple-600 text-white',
    iconColor: 'text-white',
    placeholderTitle: 'เช่น CI & Cover Template (Figma)',
    placeholderUrl: 'https://figma.com/file/...',
  },
  SLACK: {
    type: 'SLACK',
    label: 'Slack',
    description: 'ช่องสื่อสารประจำทีม / แชทประสานงาน',
    icon: Hash,
    badgeBg: 'bg-teal-600',
    badgeText: 'text-white',
    borderColor: 'border-teal-200',
    cardHoverBorder: 'hover:border-teal-400',
    cardBg: 'bg-teal-50/40 hover:bg-teal-50/80',
    iconContainerBg: 'bg-teal-600 text-white',
    iconColor: 'text-white',
    placeholderTitle: 'เช่น แชททีมคอนเทนต์ (#content-team)',
    placeholderUrl: 'https://app.slack.com/client/...',
  },
  WEBSITE: {
    type: 'WEBSITE',
    label: 'Website',
    description: 'เว็บไซต์ทางการ / Landing Page',
    icon: Globe,
    badgeBg: 'bg-indigo-600',
    badgeText: 'text-white',
    borderColor: 'border-indigo-200',
    cardHoverBorder: 'hover:border-indigo-400',
    cardBg: 'bg-indigo-50/40 hover:bg-indigo-50/80',
    iconContainerBg: 'bg-indigo-600 text-white',
    iconColor: 'text-white',
    placeholderTitle: 'เช่น เว็บไซต์ทางการของแบรนด์',
    placeholderUrl: 'https://brand-website.com',
  },
  OTHER: {
    type: 'OTHER',
    label: 'เอกสารอื่นๆ',
    description: 'ลิงก์และเอกสารอ้างอิงอื่นๆ',
    icon: LinkIcon,
    badgeBg: 'bg-slate-600',
    badgeText: 'text-white',
    borderColor: 'border-slate-200',
    cardHoverBorder: 'hover:border-slate-400',
    cardBg: 'bg-slate-50/60 hover:bg-slate-100/60',
    iconContainerBg: 'bg-slate-600 text-white',
    iconColor: 'text-white',
    placeholderTitle: 'เช่น ข้อมูลคู่มือการทำงาน',
    placeholderUrl: 'https://...',
  },
};

export const BRAND_LINK_SERVICE_OPTIONS = Object.values(BRAND_LINK_SERVICES);

/**
 * Format and ensure full URL with protocol
 */
export const normalizeUrl = (rawUrl?: string): string => {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

/**
 * Safely extract display domain from URL
 */
export const extractDomain = (rawUrl?: string): string => {
  if (!rawUrl) return '';
  try {
    const full = normalizeUrl(rawUrl);
    const parsed = new URL(full);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return rawUrl.trim();
  }
};
