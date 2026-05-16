
import React from 'react';
import { Share2, Tv, Building2 } from 'lucide-react';
import FilterDropdown from '../../../common/FilterDropdown';
import CustomDatePicker from '../../../common/CustomDatePicker';

interface ClientFilterBarProps {
    startDate: Date;
    setStartDate: (d: Date) => void;
    endDate: Date;
    setEndDate: (d: Date) => void;
    selectedChannel: string;
    setSelectedChannel: (id: string) => void;
    selectedPlatform: string;
    setSelectedPlatform: (p: string) => void;
    channels: any[];
}

const ClientFilterBar: React.FC<ClientFilterBarProps> = ({
    startDate, setStartDate,
    endDate, setEndDate,
    selectedChannel, setSelectedChannel,
    selectedPlatform, setSelectedPlatform,
    channels
}) => {
    const channelOptions = channels.map(c => ({
        key: c.id,
        label: c.name,
        icon: c.logoUrl ? (
            <img src={c.logoUrl} className="w-4 h-4 rounded-md object-contain" referrerPolicy="no-referrer" />
        ) : (
            <Tv className="w-4 h-4" />
        )
    }));

    const platformOptions = [
        { key: 'FACEBOOK', label: 'FACEBOOK', icon: <Share2 className="w-4 h-4" /> },
        { key: 'YOUTUBE', label: 'YOUTUBE', icon: <Share2 className="w-4 h-4" /> },
        { key: 'TIKTOK', label: 'TIKTOK', icon: <Share2 className="w-4 h-4" /> },
        { key: 'INSTAGRAM', label: 'INSTAGRAM', icon: <Share2 className="w-4 h-4" /> },
    ];

    return (
        <div className="flex flex-wrap items-center gap-4 bg-white/50 p-4 rounded-[32px] border border-slate-100 backdrop-blur-sm shadow-sm">
            {/* Date Range Selection */}
            <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-40">
                    <CustomDatePicker 
                        selected={startDate}
                        onChange={(d) => d && setStartDate(d)}
                        placeholderText="Start Date"
                    />
                </div>
                <span className="text-slate-300 font-bold">-</span>
                <div className="w-40">
                    <CustomDatePicker 
                        selected={endDate}
                        onChange={(d) => d && setEndDate(d)}
                        placeholderText="End Date"
                    />
                </div>
            </div>

            {/* Dimensional Filters */}
            <div className="flex items-center gap-3">
                <div className="w-56">
                    <FilterDropdown 
                        label="Channel"
                        options={channelOptions}
                        value={selectedChannel}
                        onChange={setSelectedChannel}
                        icon={<Tv className="w-4 h-4" />}
                        activeColorClass="bg-emerald-50 border-emerald-200 text-emerald-700"
                    />
                </div>
                <div className="w-56">
                    <FilterDropdown 
                        label="Platform"
                        options={platformOptions}
                        value={selectedPlatform}
                        onChange={setSelectedPlatform}
                        icon={<Share2 className="w-4 h-4" />}
                        activeColorClass="bg-amber-50 border-amber-200 text-amber-700"
                    />
                </div>
            </div>

            <div className="ml-auto hidden xl:block">
                 <div className="bg-indigo-50 text-indigo-600 px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-indigo-100 flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5" />
                    Business Intelligence Mode
                 </div>
            </div>
        </div>
    );
};

export default ClientFilterBar;
