import React from 'react';
import { Tv, Check, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { ChannelOption, ChannelScopeConfigCardProps } from '../../types';

export type { ChannelOption, ChannelScopeConfigCardProps };

export const ChannelScopeConfigCard: React.FC<ChannelScopeConfigCardProps> = ({
    channels,
    targetChannels,
    onSelectAll,
    onToggleChannel,
}) => {
    const isAll = targetChannels === 'ALL';
    const selectedChannelList = isAll ? [] : targetChannels.split(',').filter(Boolean);

    return (
        <motion.div
            id="channel-scope-config-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm space-y-4"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                    <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                        <Tv className="w-5 h-5 text-indigo-600 shrink-0" />
                        ขอบเขตรายการและช่อง (Channel Scope)
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        เลือกเฉพาะช่องหรือรายการที่ต้องการให้ระบบช่วยมอนิเตอร์และส่งแจ้งเตือน
                    </p>
                </div>

                <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onSelectAll}
                    className={`text-xs font-bold px-3.5 py-1.5 rounded-xl border transition-all inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer ${
                        isAll
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                            : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                    }`}
                >
                    <Globe className="w-3.5 h-3.5" />
                    ทุกช่อง (ALL Channels)
                </motion.button>
            </div>

            {channels.length === 0 ? (
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-center text-xs text-gray-400">
                    กำลังโหลดรายการช่องจากฐานข้อมูล...
                </div>
            ) : (
                <div className="flex flex-wrap gap-2 pt-1">
                    {channels.map((channel) => {
                        const isSelected = isAll || selectedChannelList.includes(channel.id);
                        return (
                            <motion.button
                                key={channel.id}
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onToggleChannel(channel.id)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border flex items-center gap-2 cursor-pointer ${
                                    isSelected
                                        ? 'bg-indigo-50/70 text-indigo-950 border-indigo-300 ring-1 ring-indigo-200 shadow-xs'
                                        : 'bg-slate-50 text-gray-400 border-gray-200 hover:bg-slate-100'
                                }`}
                            >
                                <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                                    style={{ backgroundColor: channel.color || '#6366f1' }}
                                />
                                <span>{channel.name}</span>
                                {isSelected && (
                                    <Check className="w-3 h-3 text-indigo-600 stroke-[3]" />
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
};
