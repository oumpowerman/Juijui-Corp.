import { Layout, Truck, FileText, MessageSquare, Paperclip, History, Book } from 'lucide-react';

export const TAB_CONFIGS: Record<string, { color: string, icon: any, label: string }> = {
    DETAILS: { color: 'indigo', icon: Layout, label: 'รายละเอียด' },
    LOGISTICS: { color: 'cyan', icon: Truck, label: 'งานย่อย' },
    SCRIPT: { color: 'rose', icon: FileText, label: 'สคริปต์' },
    COMMENTS: { color: 'emerald', icon: MessageSquare, label: 'แชท' },
    ASSETS: { color: 'amber', icon: Paperclip, label: 'ไฟล์' },
    HISTORY: { color: 'slate', icon: History, label: 'ประวัติ' },
    WIKI: { color: 'sky', icon: Book, label: 'คู่มือ' },
};
