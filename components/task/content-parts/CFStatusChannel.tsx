
import React from 'react';
import { MasterOption, Channel } from '../../../types';

interface CFStatusChannelProps {
    status: string;
    setStatus: (val: string) => void;
    channelId: string;
    setChannelId: (val: string) => void;
    statusOptions: MasterOption[];
    channels: Channel[];
}

const CFStatusChannel: React.FC<CFStatusChannelProps> = ({ 
    status, setStatus, channelId, setChannelId, statusOptions, channels 
}) => {
    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-400 mb-1 ml-1 uppercase">สถานะ (Status)</label>
                <div className="relative">
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full pl-4 pr-8 py-3 bg-white border-2 border-gray-200 rounded-xl outline-none font-bold text-gray-700 cursor-pointer hover:border-indigo-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all appearance-none shadow-sm">
                        <option value="">-- เลือก --</option>
                        {statusOptions.length > 0 ? statusOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>) : <option disabled>No Statuses</option>}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                </div>
            </div>
            <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-400 mb-1 ml-1 uppercase">ช่องทาง (Channel)</label>
                <div className="relative">
                    <select value={channelId} onChange={(e) => setChannelId(e.target.value)} className="w-full pl-4 pr-8 py-3 bg-white border-2 border-gray-200 rounded-xl outline-none font-bold text-gray-700 cursor-pointer hover:border-indigo-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all appearance-none shadow-sm">
                        <option value="">-- เลือก --</option>
                        {channels.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                </div>
            </div>
        </div>
    );
};

export default CFStatusChannel;
