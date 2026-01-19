
import { Priority, Status, Platform, ContentPillar, ContentFormat, AssetCategory, ChipConfig, Difficulty } from './types';
import { Youtube, Facebook, Instagram, Video, Globe, FileText, Image, Film, Receipt, Link } from 'lucide-react';

export const PLATFORM_ICONS: Record<Platform, any> = {
  YOUTUBE: Youtube,
  FACEBOOK: Facebook,
  INSTAGRAM: Instagram,
  TIKTOK: Video,
  OTHER: Globe,
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
    OTHER: 'Other (อื่นๆ)'
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

export const ASSET_CATEGORIES: Record<AssetCategory, { label: string, icon: any, color: string }> = {
    SCRIPT: { label: 'บท / Script', icon: FileText, color: 'bg-yellow-100 text-yellow-700' },
    THUMBNAIL: { label: 'ปก / Artwork', icon: Image, color: 'bg-purple-100 text-purple-700' },
    VIDEO_DRAFT: { label: 'Draft Video', icon: Film, color: 'bg-blue-100 text-blue-700' },
    INVOICE: { label: 'ใบวางบิล / เอกสาร', icon: Receipt, color: 'bg-gray-100 text-gray-700' },
    REF: { label: 'Reference', icon: Link, color: 'bg-pink-100 text-pink-700' },
    OTHER: { label: 'อื่นๆ', icon: Link, color: 'bg-slate-100 text-slate-700' }
};

// Updated Colors for 10-step workflow
export const STATUS_COLORS: Record<Status, string> = {
  [Status.TODO]: 'bg-gray-100 text-gray-600 border-gray-200',
  [Status.DOING]: 'bg-blue-100 text-blue-600 border-blue-200',
  [Status.BLOCKED]: 'bg-red-100 text-red-600 border-red-200',
  [Status.IDEA]: 'bg-gray-100 text-gray-600 border-gray-200',
  [Status.SCRIPT]: 'bg-yellow-50 text-yellow-600 border-yellow-200',
  [Status.SHOOTING]: 'bg-orange-50 text-orange-600 border-orange-200',
  [Status.EDIT_CLIP]: 'bg-blue-50 text-blue-600 border-blue-200',
  [Status.FEEDBACK]: 'bg-pink-50 text-pink-600 border-pink-200',
  [Status.EDIT_DRAFT_1]: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  [Status.FEEDBACK_1]: 'bg-purple-50 text-purple-600 border-purple-200',
  [Status.EDIT_DRAFT_2]: 'bg-cyan-50 text-cyan-600 border-cyan-200',
  [Status.APPROVE]: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  [Status.DONE]: 'bg-green-100 text-green-700 border-green-300 ring-1 ring-green-300',
};

// Updated Labels for 10-step workflow
export const STATUS_LABELS: Record<Status, string> = {
  [Status.TODO]: 'To Do 📝',
  [Status.DOING]: 'Doing 🔨',
  [Status.BLOCKED]: 'Blocked 🚫',
  [Status.IDEA]: '01 Idea/Draft 💡',
  [Status.SCRIPT]: '02 Script ✍️',
  [Status.SHOOTING]: '03 Shooting 🎥',
  [Status.EDIT_CLIP]: '04 Edit Clip ✂️',
  [Status.FEEDBACK]: '05 Feedback 💬',
  [Status.EDIT_DRAFT_1]: '06 Edit Draft1 🛠️',
  [Status.FEEDBACK_1]: '07 Feedback 1 🗣️',
  [Status.EDIT_DRAFT_2]: '08 Edit Draft 2 🔧',
  [Status.APPROVE]: '09 Approve 👍',
  [Status.DONE]: '10 Done ✅',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  [Priority.LOW]: 'text-slate-400',
  [Priority.MEDIUM]: 'text-blue-500',
  [Priority.HIGH]: 'text-orange-500',
  [Priority.URGENT]: 'text-red-500 font-bold',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  [Priority.LOW]: 'จุ๊ยๆ ชิวๆ 🍹',
  [Priority.MEDIUM]: 'งานทั่วไป 🙂',
  [Priority.HIGH]: 'เริ่มเดือด ⚡️',
  [Priority.URGENT]: 'ไฟลุกท่วม 🔥',
};

// --- Calendar Smart Filter Constants ---
export const DEFAULT_CHIPS: ChipConfig[] = [
    { id: 'def_1', label: 'Video ยาว', type: 'FORMAT', value: 'LONG_FORM', colorTheme: 'indigo' },
    { id: 'def_2', label: 'Shorts/Reels', type: 'FORMAT', value: 'SHORT_FORM', colorTheme: 'rose' },
    { id: 'def_3', label: 'งานที่เสร็จแล้ว', type: 'STATUS', value: 'DONE', colorTheme: 'emerald' },
];

export const COLOR_THEMES = [
    { id: 'indigo', bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200', activeBg: 'bg-indigo-600', ring: 'ring-indigo-500' },
    { id: 'rose', bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200', activeBg: 'bg-rose-600', ring: 'ring-rose-500' },
    { id: 'emerald', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', activeBg: 'bg-emerald-600', ring: 'ring-emerald-500' },
    { id: 'amber', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', activeBg: 'bg-amber-600', ring: 'ring-amber-500' },
    { id: 'sky', bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-200', activeBg: 'bg-sky-600', ring: 'ring-sky-500' },
    { id: 'purple', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', activeBg: 'bg-purple-600', ring: 'ring-purple-500' },
];

// --- HELPER: Intelligent Status Check ---
export const isTaskCompleted = (status: string): boolean => {
    if (!status) return false;
    const s = status.toUpperCase();
    // Check against standard enums
    if (s === 'DONE' || s === 'APPROVE') return true;
    
    // Check against common semantic keywords for custom statuses
    const COMPLETION_KEYWORDS = ['DONE', 'APPROVE', 'PASSED', 'COMPLETE', 'SUCCESS', 'PUBLISH', 'POSTED', 'FINISH', 'CLOSED'];
    return COMPLETION_KEYWORDS.some(k => s.includes(k));
};
