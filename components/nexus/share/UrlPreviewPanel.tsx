import React from 'react';
import { Link, Loader2, Globe, Youtube, Radio, FileText, Instagram, Facebook } from 'lucide-react';
import { NexusPlatform } from '../../../types';

interface UrlPreviewPanelProps {
    url: string;
    platform: NexusPlatform;
    title: string;
    thumbnailUrl: string;
    isMetaDataLoading: boolean;
}

export const UrlPreviewPanel: React.FC<UrlPreviewPanelProps> = ({
    url,
    platform,
    title,
    thumbnailUrl,
    isMetaDataLoading,
}) => {
    // Render Platform Badge Icon
    const renderPlatformBadge = () => {
        switch (platform) {
            case NexusPlatform.YOUTUBE:
                return (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-100 text-rose-600 font-bold text-xs dark:bg-rose-950/20 dark:border-rose-900/30">
                        <Youtube className="w-4 h-4 text-rose-500" />
                        <span>YouTube</span>
                    </div>
                );
            case NexusPlatform.TIKTOK:
                return (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-white font-bold text-xs">
                        <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                        <span>TikTok</span>
                    </div>
                );
            case NexusPlatform.INSTAGRAM:
                return (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-tr from-yellow-500 to-pink-500 text-white font-bold text-xs">
                        <Instagram className="w-4 h-4" />
                        <span>Instagram</span>
                    </div>
                );
            case NexusPlatform.NOTION:
                return (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-orange-700 font-bold text-xs dark:bg-orange-950/20 dark:border-orange-900/30">
                        <FileText className="w-4 h-4 text-orange-500" />
                        <span>Notion</span>
                    </div>
                );
            case NexusPlatform.FACEBOOK:
                return (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 font-bold text-xs dark:bg-blue-950/20 dark:border-blue-900/30">
                        <Facebook className="w-4 h-4 text-blue-500" />
                        <span>Facebook</span>
                    </div>
                );
            default:
                return (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold text-xs dark:bg-indigo-950/20 dark:border-indigo-900/30">
                        <Globe className="w-4 h-4" />
                        <span>Website Reference</span>
                    </div>
                );
        }
    };

    return (
        <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link className="w-4 h-4 text-indigo-500" />
                    <span className="text-slate-400 text-xs font-semibold dark:text-slate-500">ตรวจพบลิงก์ต้นทาง</span>
                </div>
                {renderPlatformBadge()}
            </div>

            <div className="text-xs font-mono select-all break-all bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2.5 rounded-2xl text-slate-500 leading-relaxed font-bold dark:text-slate-400">
                {url || 'กำลังวิเคราะห์ลิงก์...'}
            </div>

            {isMetaDataLoading ? (
                <div className="flex items-center justify-center py-4 text-indigo-600 gap-2 font-medium text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>กำลังดึงข้อมูล Preview ด้วย NoEmbed...</span>
                </div>
            ) : (
                (thumbnailUrl || title) && (
                    <div className="flex gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                        {thumbnailUrl && (
                            <img 
                                src={thumbnailUrl} 
                                alt="embed thumbnail" 
                                referrerPolicy="no-referrer"
                                className="w-20 h-20 object-cover rounded-xl border border-slate-100 dark:border-slate-800 shrink-0" 
                            />
                        )}
                        <div className="flex flex-col justify-center gap-1 min-w-0">
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">พรีวิววิดีโอ</span>
                            <span className="text-slate-700 dark:text-slate-200 text-sm font-bold leading-snug line-clamp-2">
                                {title}
                            </span>
                        </div>
                    </div>
                )
            )}
        </div>
    );
};
