
import React from 'react';
import { MonitorPlay, Check, AlertCircle, Info } from 'lucide-react';
import { Platform } from '../../../types';
import { PLATFORM_ICONS } from '../../../constants';
import { motion, AnimatePresence } from 'framer-motion';

interface CFPlatformSelectorProps {
    targetPlatforms: Platform[];
    togglePlatform: (p: Platform) => void;
    publishedLinks: Record<string, string>;
    handleLinkChange: (platform: string, url: string) => void;
}

const ALL_PLATFORMS: { id: Platform; label: string }[] = [
    { id: 'YOUTUBE', label: 'YouTube' },
    { id: 'FACEBOOK', label: 'Facebook' },
    { id: 'TIKTOK', label: 'TikTok' },
    { id: 'INSTAGRAM', label: 'Instagram' },
    { id: 'OTHER', label: 'Other' },
];

const CFPlatformSelector: React.FC<CFPlatformSelectorProps> = ({ 
    targetPlatforms, togglePlatform, publishedLinks, handleLinkChange 
}) => {
    return (
        <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <label className="block text-s font-bold text-gray-500 mb-3 flex items-center">
                    <MonitorPlay className="w-3.5 h-3.5 mr-1.5" /> แพลตฟอร์ม (Platforms)
                </label>
                <div className="flex flex-wrap gap-2">
                    {ALL_PLATFORMS.map((p) => {
                        const isSelected = targetPlatforms.includes(p.id);
                        const Icon = PLATFORM_ICONS[p.id];
                        return (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => togglePlatform(p.id as any)}
                                className={`
                                    flex items-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all border-2 active:scale-95
                                    ${isSelected 
                                        ? 'bg-white border-indigo-500 text-indigo-700 shadow-md translate-y-[-2px]' 
                                        : 'bg-white border-transparent text-gray-400 hover:border-gray-200 hover:text-gray-600'}
                                `}
                            >
                                <Icon className={`w-4 h-4 mr-1.5 ${isSelected ? '' : 'grayscale opacity-50'}`} />
                                {p.label}
                                {isSelected && <Check className="w-3 h-3 ml-1.5 text-indigo-500" />}
                            </button>
                        );
                    })}
                </div>

                <AnimatePresence>
                    {targetPlatforms.length === 0 && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, y: -10, height: 0 }}
                            className="mt-4 overflow-hidden"
                        >
                            <div className="bg-amber-50 border border-amber-200 border-dashed p-3 rounded-xl flex items-center gap-3">
                                <div className="bg-amber-100 p-2 rounded-lg">
                                    <AlertCircle className="w-4 h-4 text-amber-600" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-black text-amber-800 leading-tight">โปรดเลือกช่องทางการลงคอนเทนต์</span>
                                    <span className="text-[9px] font-bold text-amber-600/70 uppercase tracking-tighter">SELECT AT LEAST ONE PLATFORM TO ENABLE UPLOAD LINKS</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Published Links */}
            {targetPlatforms.length > 0 && (
                <div className="space-y-2">
                    <label className="block text-md font-medium text-gray-400 ml-1">ลิงก์ผลงาน (Published Links)</label>
                    <div className="space-y-2">
                        {targetPlatforms.map(platform => {
                            const Icon = PLATFORM_ICONS[platform as Platform];
                            return (
                                <div key={platform} className="flex items-center gap-2 group">
                                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 border border-gray-200">
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <input 
                                        type="url" 
                                        value={publishedLinks[platform] || ''} 
                                        onChange={(e) => handleLinkChange(platform, e.target.value)} 
                                        className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-xs font-medium"
                                        placeholder={`วางลิงก์ ${platform}...`}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CFPlatformSelector;
