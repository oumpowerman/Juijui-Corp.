import React from 'react';
import { Layers, Youtube, Facebook, Instagram, Smartphone, AlertTriangle } from 'lucide-react';
import { FollowerSyncConfig, FollowerSyncPlatformSettings } from '../types';

interface PlatformFilterTabProps {
    config: FollowerSyncConfig;
    onChange: (updater: (prev: FollowerSyncConfig) => FollowerSyncConfig) => void;
}

export const PlatformFilterTab: React.FC<PlatformFilterTabProps> = ({
    config,
    onChange
}) => {
    const handleTogglePlatform = (platform: keyof FollowerSyncPlatformSettings) => {
        onChange(prev => ({
            ...prev,
            platforms: {
                ...prev.platforms,
                [platform]: !prev.platforms[platform],
            }
        }));
    };

    const enabledPlatformCount = Object.values(config.platforms).filter(Boolean).length;

    return (
        <div className="space-y-6">
            {/* Header Description */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                            <Layers className="w-5 h-5 text-indigo-600" />
                            <span>แพลตฟอร์มเป้าหมาย (Platform Scope Filter)</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            เปิดหรือปิดแพลตฟอร์มส่วนกลาง หากปิดระบบจะไม่ยิง Request ไปยังแพลตฟอร์มนั้นๆ ในทุกช่องรายการ
                        </p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                        เปิด {enabledPlatformCount} จาก 4 แพลตฟอร์ม
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {/* YouTube */}
                    <div 
                        onClick={() => handleTogglePlatform('YOUTUBE')}
                        className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between ${
                            config.platforms.YOUTUBE 
                                ? 'bg-rose-50/60 border-rose-400 shadow-xs' 
                                : 'bg-slate-50/70 border-slate-200 opacity-60 hover:opacity-90'
                        }`}
                    >
                        <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <Youtube className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900">YouTube</h4>
                                <p className="text-xs text-slate-500 mt-0.5">ดึงยอด Subscriber (ประหยัดเน็ต ~50KB ต่อช่อง)</p>
                                <span className="inline-block mt-2 text-[10px] font-semibold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-md">
                                    ✓ ความแม่นยำและเสถียรภาพสูง
                                </span>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={config.platforms.YOUTUBE}
                            onChange={() => {}}
                            className="w-5 h-5 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer mt-0.5"
                        />
                    </div>

                    {/* Facebook */}
                    <div 
                        onClick={() => handleTogglePlatform('FACEBOOK')}
                        className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between ${
                            config.platforms.FACEBOOK 
                                ? 'bg-blue-50/60 border-blue-400 shadow-xs' 
                                : 'bg-slate-50/70 border-slate-200 opacity-60 hover:opacity-90'
                        }`}
                    >
                        <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <Facebook className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900">Facebook Page</h4>
                                <p className="text-xs text-slate-500 mt-0.5">สกัดยอดผู้ติดตาม & ยอดถูกใจ (รองรับภาษาไทย/อังกฤษ)</p>
                                <span className="inline-block mt-2 text-[10px] font-semibold text-blue-700 bg-blue-100/90 px-2 py-0.5 rounded-md">
                                    ✓ Smart Regex Parser
                                </span>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={config.platforms.FACEBOOK}
                            onChange={() => {}}
                            className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer mt-0.5"
                        />
                    </div>

                    {/* Instagram */}
                    <div 
                        onClick={() => handleTogglePlatform('INSTAGRAM')}
                        className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between ${
                            config.platforms.INSTAGRAM 
                                ? 'bg-pink-50/60 border-pink-400 shadow-xs' 
                                : 'bg-slate-50/70 border-slate-200 opacity-60 hover:opacity-90'
                        }`}
                    >
                        <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <Instagram className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900">Instagram Profile</h4>
                                <p className="text-xs text-slate-500 mt-0.5">สกัดยอด Followers จาก Open Graph Meta Header</p>
                                <span className="inline-block mt-2 text-[10px] font-semibold text-pink-700 bg-pink-100/90 px-2 py-0.5 rounded-md">
                                    ✓ Open Graph Tag
                                </span>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={config.platforms.INSTAGRAM}
                            onChange={() => {}}
                            className="w-5 h-5 text-pink-600 rounded border-slate-300 focus:ring-pink-500 cursor-pointer mt-0.5"
                        />
                    </div>

                    {/* TikTok */}
                    <div 
                        onClick={() => handleTogglePlatform('TIKTOK')}
                        className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between ${
                            config.platforms.TIKTOK 
                                ? 'bg-slate-100 border-slate-600 shadow-xs' 
                                : 'bg-slate-50/70 border-slate-200 opacity-60 hover:opacity-90'
                        }`}
                    >
                        <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0 shadow-xs">
                                <Smartphone className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900">TikTok</h4>
                                <p className="text-xs text-slate-500 mt-0.5">ดึงยอด Follower (TikTok มีระบบ Cloudflare ป้องกันบอท)</p>
                                <span className="inline-block mt-2 text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                                    {config.platforms.TIKTOK ? '⚠️ เปิดอยู่ (อาจติด Anti-bot บางครั้ง)' : '✓ ปิดไว้เพื่อประหยัดเน็ต'}
                                </span>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={config.platforms.TIKTOK}
                            onChange={() => {}}
                            className="w-5 h-5 text-slate-900 rounded border-slate-300 focus:ring-slate-800 cursor-pointer mt-0.5"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
