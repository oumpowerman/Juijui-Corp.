
import { Platform, ContentPillar, ContentFormat, AssetCategory, Difficulty, WorkStatus } from '../types';
import { Youtube, Facebook, Instagram, Video, Globe, FileText, Image, Film, Receipt, Link as LinkIcon, LucideIcon } from 'lucide-react';
import React from 'react';

export const PLATFORM_ICONS: Record<Platform, any> = {
  YOUTUBE: Youtube,
  FACEBOOK: Facebook,
  INSTAGRAM: Instagram,
  TIKTOK: Video,
  OTHER: Globe,
  ALL: Globe,
};

export const DIFFICULTY_LABELS: Record<Difficulty, { label: string, xp: number, color: string }> = {
    EASY: { label: 'Easy (ง่าย)', xp: 100, color: 'bg-green-100 text-green-700' },
    MEDIUM: { label: 'Medium (กลาง)', xp: 200, color: 'bg-yellow-100 text-yellow-700' },
    HARD: { label: 'Hard (ยาก)', xp: 300, color: 'bg-red-100 text-red-700' },
};

export const CONTENT_PILLARS: Record<ContentPillar, string> = {
    COMEDY: '😂 Comedy / Situational Humor',
    STREET: '🎯 Street Interaction / Social Game',
    DEEP_TALK: '🧠 Deep Talk / Thought-Provoking Fun',
    BEHIND: '🎥 Behind the Scenes / Team Culture',
    FAN_INTERACTION: '❤️ Fan Interaction / Community Play',
    EDUCATION: '📚 Education / Knowledge',
    ENTERTAINMENT: '🎬 Entertainment',
    LIFESTYLE: '🌱 Lifestyle / Vlog',
    PROMO: '📢 Promo / Advertising',
    OTHER: 'Other (อื่นๆ)',
    REALTIME: '⚡ Realtime / News'
};

export const CONTENT_FORMATS: Record<ContentFormat, string> = {
    SHORT_FORM: 'Short Form (สั้น)',
    LONG_FORM: 'Long Form (ยาว)',
    PICTURE: 'Picture (ภาพเดี่ยว)',
    ALBUM: 'Album (อัลบั้ม)',
    REELS: 'Reels/TikTok',
    STORY: 'Story',
    POST_H: 'Post (H)',
    OTHER: 'Other'
};

export const ASSET_CATEGORIES: Record<AssetCategory, { label: string, icon: LucideIcon | React.ElementType, color: string }> = {
    SCRIPT: { label: 'บท / Script', icon: FileText, color: 'bg-yellow-100 text-yellow-700' },
    THUMBNAIL: { label: 'ปก / Artwork', icon: Image, color: 'bg-purple-100 text-purple-700' },
    VIDEO_DRAFT: { label: 'Draft Video', icon: Film, color: 'bg-blue-100 text-blue-700' },
    INVOICE: { label: 'ใบวางบิล / เอกสาร', icon: Receipt, color: 'bg-gray-100 text-gray-700' },
    REF: { label: 'Reference', icon: LinkIcon, color: 'bg-pink-100 text-pink-700' },
    LINK: { label: 'ลิงก์ / URL', icon: LinkIcon, color: 'bg-sky-100 text-sky-700' },
    OTHER: { label: 'อื่นๆ', icon: LinkIcon, color: 'bg-slate-100 text-slate-700' }
};

export const WORK_STATUS_CONFIG: Record<WorkStatus, { label: string, icon: string, color: string }> = {
    ONLINE: { label: 'Online (พร้อมลุย)', icon: '🟢', color: 'bg-green-100 text-green-700' },
    BUSY: { label: 'Busy (ยุ่งมาก)', icon: '🔴', color: 'bg-red-100 text-red-700' },
    SICK: { label: 'Sick (ลาป่วย)', icon: '🤢', color: 'bg-orange-100 text-orange-700' },
    VACATION: { label: 'Vacation (ลาพักร้อน)', icon: '🏖️', color: 'bg-blue-100 text-blue-700' },
    MEETING: { label: 'Meeting (ติดประชุม)', icon: '📅', color: 'bg-purple-100 text-purple-700' }
};
