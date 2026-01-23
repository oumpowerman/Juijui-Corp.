
import React from 'react';
import { Task, Status, Channel } from '../../../types';
import { AlertTriangle, ArrowRight, PartyPopper, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { STATUS_COLORS, PRIORITY_COLORS, STATUS_LABELS, PRIORITY_LABELS, PLATFORM_ICONS } from '../../../constants';

interface UrgentTasksWidgetProps {
    urgentTasks: Task[];
    dueSoon: Task[];
    channels: Channel[];
    viewScope: 'ALL' | 'ME';
    onEditTask: (task: Task) => void;
    onNavigateToCalendar: () => void;
}

const getSafeStatusLabel = (status: any) => {
    const label = STATUS_LABELS[status as Status] || String(status || 'Unknown');
    return label;
};

const UrgentTasksWidget: React.FC<UrgentTasksWidgetProps> = ({
    urgentTasks,
    dueSoon,
    channels,
    viewScope,
    onEditTask,
    onNavigateToCalendar
}) => {

    const getChannelIcon = (channelId: string) => {
        const channel = channels.find(c => c.id === channelId);
        if (!channel) return null;
        const platform = channel.platforms?.[0] || 'OTHER';
        const Icon = PLATFORM_ICONS[platform];
        return <Icon className={`w-3 h-3 ${channel.color.split(' ')[1]}`} />;
    };

    return (
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-orange-50/50">
                    <h3 className="font-bold text-gray-800 flex items-center">
                        <span className="bg-orange-100 text-orange-600 p-1.5 rounded-lg mr-2">
                            <AlertTriangle className="w-4 h-4" />
                        </span>
                        {viewScope === 'ME' ? 'งานด่วนของฉัน 🔥' : 'งานไฟลุก! รีบเคลียร์ด่วน 🔥'}
                    </h3>
                </div>
                <div className="p-0">
                    {urgentTasks.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center justify-center">
                            <PartyPopper className="w-12 h-12 text-yellow-400 mb-3 animate-bounce" />
                            <p className="text-gray-400 font-medium">จุ๊ยมากกก! ไม่มีงานด่วนเลยวันนี้ 😎</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {urgentTasks.map(task => (
                                <div key={task.id} onClick={() => onEditTask(task)} className="p-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between group">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className="flex items-center space-x-2 mb-1.5">
                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${STATUS_COLORS[task.status as Status] || 'bg-gray-100'}`}>
                                                {getSafeStatusLabel(task.status).split(' ')[0]} {getSafeStatusLabel(task.status).split(' ')[1] || ''}
                                            </span>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${PRIORITY_COLORS[task.priority]}`}>
                                                {PRIORITY_LABELS[task.priority]}
                                            </span>
                                            <div className="flex items-center space-x-1 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                                                {getChannelIcon(task.channelId || '')}
                                                <span className="text-[10px] text-gray-500 font-medium">{channels.find(c => c.id === task.channelId)?.name}</span>
                                            </div>
                                        </div>
                                        <h4 className="text-base font-semibold text-gray-800 truncate">{task.title}</h4>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="text-right min-w-[60px]">
                                            <p className="text-[10px] text-gray-400 uppercase">Deadline</p>
                                            <p className="text-sm font-bold text-gray-700">{format(task.endDate, 'd MMM')}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-center">
                    <button onClick={onNavigateToCalendar} className="text-sm text-indigo-600 hover:text-indigo-800 font-bold flex items-center justify-center w-full py-1">
                        ไปดูตารางงานทั้งหมด <ArrowRight className="w-4 h-4 ml-1.5" />
                    </button>
                </div>
            </div>

            {/* Quick Due Soon */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                    <h3 className="font-bold text-gray-800 flex items-center"><Sparkles className="w-4 h-4 mr-2 text-yellow-500" /> ใกล้ถึงกำหนดส่ง (3 วันนี้) ⏳</h3>
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dueSoon.length === 0 ? (
                        <p className="text-sm text-gray-400 col-span-full text-center py-4">โล่งมาก ไม่มีอะไรต้องส่งเร็วๆ นี้ จุ๊ยๆ เลย 🍹</p>
                    ) : dueSoon.map(task => (
                        <div key={task.id} onClick={() => onEditTask(task)} className="border border-gray-100 rounded-xl p-4 hover:shadow-md cursor-pointer transition-all bg-white group hover:-translate-y-1">
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] px-2 py-0.5 font-semibold rounded border ${STATUS_COLORS[task.status as Status] || 'bg-gray-100'}`}>
                                    {getSafeStatusLabel(task.status).split(' ')[0]}
                                </span>
                                <span className="text-xs font-medium text-gray-400">{format(task.endDate, 'd MMM')}</span>
                            </div>
                            <div className="mb-2">{getChannelIcon(task.channelId || '')}</div>
                            <p className="text-sm font-bold text-gray-700 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">{task.title}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UrgentTasksWidget;
