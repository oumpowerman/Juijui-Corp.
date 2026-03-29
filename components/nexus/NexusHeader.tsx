
import React, { useState } from 'react';
import { Search, Link as LinkIcon, Plus, Youtube, FileSpreadsheet, HardDrive, FileText, Globe, Loader2, Sparkles, Video, Facebook, Instagram, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { detectPlatform, getPlatformConfig } from '../../utils/nexusUtils';
import { NexusPlatform } from '../../types';

interface NexusHeaderProps {
    onAdd: (url: string, platform: NexusPlatform) => void;
    isAdding: boolean;
    aiEnabled: boolean;
    hasApiKey: boolean;
}

const NexusHeader: React.FC<NexusHeaderProps> = ({ onAdd, isAdding, aiEnabled, hasApiKey }) => {
    const [url, setUrl] = useState('');
    const [detectedPlatform, setDetectedPlatform] = useState<NexusPlatform | null>(null);

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setUrl(val);
        if (val.trim()) {
            setDetectedPlatform(detectPlatform(val));
        } else {
            setDetectedPlatform(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url.trim() && detectedPlatform) {
            onAdd(url, detectedPlatform);
            setUrl('');
            setDetectedPlatform(null);
        }
    };

    const config = detectedPlatform ? getPlatformConfig(detectedPlatform) : null;

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

    return (
        <div className="relative z-20 mb-12">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${aiEnabled && hasApiKey ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        AI Engine: {aiEnabled ? (hasApiKey ? 'Active' : 'Missing Key') : 'Disabled'}
                    </span>
                </div>
                {aiEnabled && hasApiKey && (
                    <motion.div 
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded-full border border-amber-100"
                    >
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span className="text-[9px] font-bold text-amber-700 uppercase tracking-tight">Smart Enrichment Active</span>
                    </motion.div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="relative group">
                {/* Glow Effect based on platform */}
                <AnimatePresence>
                    {detectedPlatform && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={`absolute -inset-1 rounded-[2rem] blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500 ${
                                detectedPlatform === NexusPlatform.YOUTUBE ? 'bg-rose-500' :
                                detectedPlatform === NexusPlatform.TIKTOK ? 'bg-black' :
                                detectedPlatform === NexusPlatform.FACEBOOK ? 'bg-blue-600' :
                                detectedPlatform === NexusPlatform.INSTAGRAM ? 'bg-pink-500' :
                                detectedPlatform === NexusPlatform.CANVA ? 'bg-cyan-500' :
                                detectedPlatform === NexusPlatform.GOOGLE_SHEETS ? 'bg-emerald-500' :
                                detectedPlatform === NexusPlatform.GOOGLE_DRIVE ? 'bg-blue-500' :
                                detectedPlatform === NexusPlatform.NOTION ? 'bg-slate-800' : 'bg-indigo-500'
                            }`}
                        />
                    )}
                </AnimatePresence>

                <div className="relative flex items-center bg-white/80 backdrop-blur-xl border border-white/50 rounded-[2rem] shadow-2xl p-2 pl-6 transition-all duration-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
                    <div className="flex items-center gap-3 flex-1">
                        <AnimatePresence mode="wait">
                            <motion.div 
                                key={detectedPlatform || 'none'}
                                initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
                                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                exit={{ scale: 0.5, opacity: 0, rotate: 20 }}
                                className={`${config?.iconColor || 'text-slate-400'}`}
                            >
                                {detectedPlatform ? getPlatformIcon(detectedPlatform) : <LinkIcon className="w-5 h-5" />}
                            </motion.div>
                        </AnimatePresence>
                        
                        <input 
                            type="text"
                            value={url}
                            onChange={handleUrlChange}
                            placeholder="วางลิงก์ที่นี่ (YouTube, Notion, Google Sheets...)"
                            className="bg-transparent border-none focus:ring-0 outline-none text-slate-700 placeholder-slate-400 font-medium w-full text-sm"
                        />
                    </div>

                    <button 
                        type="submit"
                        disabled={!url.trim() || isAdding}
                        className={`
                            relative flex items-center gap-2 px-6 py-3 rounded-full font-kanit font-medium text-sm uppercase tracking-widest transition-all overflow-hidden
                            ${url.trim() 
                                ? 'bg-slate-900 text-white hover:bg-black shadow-lg active:scale-95' 
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }
                        `}
                    >
                        {isAdding ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <AnimatePresence mode="wait">
                                    {aiEnabled && (
                                        <motion.span 
                                            initial={{ y: 10, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            exit={{ y: -10, opacity: 0 }}
                                            className="flex items-center gap-1 text-[9px]"
                                        >
                                            <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                                            AI กำลังประมวลผล...
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <>
                                <Plus className="w-4 h-4" />
                                เชื่อมต่อ
                            </>
                        )}
                    </button>
                </div>

                {/* Platform Badge */}
                <AnimatePresence>
                    {detectedPlatform && (
                        <motion.div 
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 10, opacity: 0 }}
                            className="absolute -bottom-8 left-8 flex items-center gap-2"
                        >
                            <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full border ${config?.bgColor} ${config?.iconColor} ${config?.borderColor}`}>
                                ตรวจพบ {config?.label}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </form>
        </div>
    );
};

export default NexusHeader;
