
import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, FileSpreadsheet, HardDrive, Video, Facebook, Instagram, Palette } from 'lucide-react';
import { NexusIntegration, NexusPlatform } from '../../types';
import { getPlatformConfig, extractYouTubeId } from '../../utils/nexusUtils';

interface NexusPreviewModalProps {
    integration: NexusIntegration | null;
    onClose: () => void;
}

const NexusPreviewModal: React.FC<NexusPreviewModalProps> = ({ integration, onClose }) => {
    if (!integration) return null;

    const config = getPlatformConfig(integration.platform);
    const url = integration.url;

    const getPreviewUrl = () => {
        if (integration.platform === NexusPlatform.YOUTUBE) {
            return `https://www.youtube.com/embed/${extractYouTubeId(url)}?autoplay=1`;
        }
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

    const getPlatformIcon = (platform: NexusPlatform) => {
        switch (platform) {
            case NexusPlatform.TIKTOK: return <Video className="w-4 h-4" />;
            case NexusPlatform.FACEBOOK: return <Facebook className="w-4 h-4" />;
            case NexusPlatform.INSTAGRAM: return <Instagram className="w-4 h-4" />;
            case NexusPlatform.CANVA: return <Palette className="w-4 h-4" />;
            case NexusPlatform.GOOGLE_SHEETS: return <FileSpreadsheet className="w-4 h-4" />;
            case NexusPlatform.GOOGLE_DRIVE: return <HardDrive className="w-4 h-4" />;
            default: return null;
        }
    };

    const modalContent = (
        <AnimatePresence>
            {integration && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md"
                    onClick={onClose}
                >
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-6xl aspect-video bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/20"
                        onClick={e => e.stopPropagation()}
                    >
                        {integration.platform === NexusPlatform.YOUTUBE ? (
                            <iframe 
                                src={getPreviewUrl()}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title="youtube-preview"
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col">
                                <div className="px-6 py-4 bg-white border-b border-slate-100 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${config.bgColor} ${config.iconColor}`}>
                                            {getPlatformIcon(integration.platform)}
                                        </div>
                                        <h4 className="font-black text-slate-800 text-sm truncate max-w-md">{integration.title}</h4>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <a 
                                            href={url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all"
                                        >
                                            <Share2 className="w-4 h-4" />
                                        </a>
                                        <button 
                                            onClick={onClose}
                                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-slate-50 rounded-xl transition-all"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                <iframe 
                                    src={getPreviewUrl()}
                                    className="w-full h-full bg-slate-50"
                                    allowFullScreen
                                    title="platform-preview"
                                />
                            </div>
                        )}
                        
                        {/* Close button for YouTube (which doesn't have the header) */}
                        {integration.platform === NexusPlatform.YOUTUBE && (
                            <button 
                                onClick={onClose}
                                className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all z-10"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};

export default NexusPreviewModal;
