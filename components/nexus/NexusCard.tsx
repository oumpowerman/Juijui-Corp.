
import React from 'react';
import { motion } from 'framer-motion';
import { Youtube, FileSpreadsheet, HardDrive, FileText, Globe, ExternalLink, Trash2, Clock, PlayCircle, Copy, Check, Edit2, Instagram, Facebook, Video, Palette } from 'lucide-react';
import { NexusIntegration, NexusPlatform } from '../../types';
import { getPlatformConfig, extractYouTubeId } from '../../utils/nexusUtils';
import { format } from 'date-fns';

interface NexusCardProps {
    integration: NexusIntegration;
    onDelete: (id: string) => void;
    onEdit: (integration: NexusIntegration) => void;
    onPreview?: (integration: NexusIntegration) => void;
}

const NexusCard: React.FC<NexusCardProps> = ({ integration, onDelete, onEdit, onPreview }) => {
    const [copied, setCopied] = React.useState(false);
    const config = getPlatformConfig(integration.platform);

    // Support both camelCase (old/local) and snake_case (Supabase)
    const title = integration.title;
    const url = integration.url;
    const description = integration.description;
    const thumbnailUrl = integration.thumbnailUrl || (integration as any).thumbnail_url;
    const updatedAt = integration.updatedAt || (integration as any).updated_at;

    const handleCopy = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getPlatformIcon = (platform: NexusPlatform) => {
        switch (platform) {
            case NexusPlatform.YOUTUBE: return <Youtube className="w-5 h-5" />;
            case NexusPlatform.TIKTOK: return <Video className="w-5 h-5" />;
            case NexusPlatform.FACEBOOK: return <Facebook className="w-5 h-5" />;
            case NexusPlatform.INSTAGRAM: return <Instagram className="w-5 h-5" />;
            case NexusPlatform.CANVA: return <Palette className="w-5 h-5" />;
            case NexusPlatform.GOOGLE_SHEETS: return <FileSpreadsheet className="w-5 h-5" />;
            case NexusPlatform.GOOGLE_DRIVE: return <HardDrive className="w-5 h-5" />;
            case NexusPlatform.NOTION: return <FileText className="w-5 h-5" />;
            default: return <Globe className="w-5 h-5" />;
        }
    };

    const getMiniPreviewUrl = () => {
        if (integration.platform === NexusPlatform.CANVA) {
            return url.includes('?') ? `${url}&embed` : `${url}?embed`;
        }
        if ([NexusPlatform.GOOGLE_SHEETS, NexusPlatform.GOOGLE_DRIVE].includes(integration.platform)) {
            return url.includes('/edit') 
                ? url.replace('/edit', '/preview') 
                : url.includes('/view')
                    ? url.replace('/view', '/preview')
                    : url;
        }
        return url;
    };

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ y: -5 }}
            className="group relative bg-white/70 backdrop-blur-md border border-white/50 rounded-[2rem] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 flex flex-col h-full"
        >
            {/* Platform Accent Bar */}
            <div className={`h-1.5 w-full ${
                integration.platform === NexusPlatform.YOUTUBE ? 'bg-rose-500' :
                integration.platform === NexusPlatform.TIKTOK ? 'bg-black' :
                integration.platform === NexusPlatform.FACEBOOK ? 'bg-blue-600' :
                integration.platform === NexusPlatform.INSTAGRAM ? 'bg-pink-500' :
                integration.platform === NexusPlatform.CANVA ? 'bg-cyan-500' :
                integration.platform === NexusPlatform.GOOGLE_SHEETS ? 'bg-emerald-500' :
                integration.platform === NexusPlatform.GOOGLE_DRIVE ? 'bg-blue-500' :
                integration.platform === NexusPlatform.NOTION ? 'bg-slate-800' : 'bg-indigo-500'
            }`} />

            {/* Preview Area */}
            <div 
                className="relative aspect-video bg-slate-100 overflow-hidden cursor-pointer"
                onClick={() => onPreview && onPreview(integration)}
            >
                {thumbnailUrl ? (
                    <img 
                        src={thumbnailUrl} 
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                    />
                ) : [NexusPlatform.GOOGLE_SHEETS, NexusPlatform.GOOGLE_DRIVE, NexusPlatform.CANVA].includes(integration.platform) ? (
                    /* Live Mini Preview for Google & Canva */
                    <div className="w-full h-full relative bg-white overflow-hidden">
                        <div className="absolute inset-0 origin-top-left scale-[0.25] w-[400%] h-[400%] pointer-events-none">
                            <iframe 
                                src={getMiniPreviewUrl()}
                                className="w-full h-full border-none"
                                title="mini-preview"
                            />
                        </div>
                        {/* Overlay to prevent interaction and add a nice gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
                    </div>
                ) : (
                    <div className={`w-full h-full flex items-center justify-center ${config.bgColor}`}>
                        <div className={`${config.iconColor} opacity-20 transform scale-[3]`}>
                            {getPlatformIcon(integration.platform)}
                        </div>
                    </div>
                )}

                {/* Overlay for Previewable */}
                {[NexusPlatform.YOUTUBE, NexusPlatform.GOOGLE_SHEETS, NexusPlatform.GOOGLE_DRIVE, NexusPlatform.CANVA, NexusPlatform.TIKTOK].includes(integration.platform) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="p-3 bg-white/90 backdrop-blur-md rounded-full shadow-xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
                            <PlayCircle className={`w-8 h-8 ${config.iconColor}`} />
                        </div>
                    </div>
                )}

                {/* Platform Badge */}
                <div className="absolute top-4 left-4">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border shadow-sm ${config.bgColor} ${config.borderColor} ${config.iconColor}`}>
                        {getPlatformIcon(integration.platform)}
                        <span className="text-[10px] font-black uppercase tracking-widest">{config.label}</span>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start gap-4 mb-2">
                    <h3 className="font-bold text-slate-800 text-[22px] line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                        {title}
                    </h3>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onEdit(integration); }}
                            className="p-2 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all"
                            title="แก้ไข"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                            className="p-2 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all"
                            title="คัดลอกลิงก์"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(integration.id); }}
                            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                            title="ลบ"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-4 font-medium leading-relaxed">
                        {description}
                    </p>
                )}

                {/* Tags */}
                {integration.tags && integration.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {integration.tags.map((tag, idx) => (
                            <span 
                                key={idx}
                                className="px-2 py-0.5 bg-slate-50 text-slate-400 text-[9px] font-bold rounded-md border border-slate-100"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                        <Clock className="w-3 h-3" />
                        {updatedAt ? format(new Date(updatedAt), 'd MMM yyyy') : 'เมื่อเร็วๆ นี้'}
                    </div>

                    <a 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[14px] font-bold text-indigo-600 uppercase tracking-widest hover:underline"
                    >
                        เปิด <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
            </div>

            {/* Glossy Shine Effect */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 transform -translate-x-full group-hover:translate-x-full" />
        </motion.div>
    );
};

export default NexusCard;
