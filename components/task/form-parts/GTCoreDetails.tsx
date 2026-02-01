
import React from 'react';
import { Flag, Activity } from 'lucide-react';
import { Priority, MasterOption } from '../../../types';

interface GTCoreDetailsProps {
    description: string;
    setDescription: (val: string) => void;
    priority: Priority;
    setPriority: (val: Priority) => void;
    status: string;
    setStatus: (val: string) => void;
    taskStatusOptions: MasterOption[];
}

const GTCoreDetails: React.FC<GTCoreDetailsProps> = ({ 
    description, setDescription, priority, setPriority, status, setStatus, taskStatusOptions 
}) => {
    return (
        <div className="space-y-4">
            <div className="group bg-gray-50 p-4 rounded-2xl border border-gray-100 focus-within:bg-white focus-within:border-gray-300 focus-within:shadow-sm transition-all">
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Details</label>
                <textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    rows={3} 
                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-base text-gray-700 placeholder:text-gray-400 resize-none outline-none" 
                    placeholder="รายละเอียดงานแบบเจาะลึก..." 
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                 {/* Priority Selector */}
                 <div className="bg-white p-3 border border-gray-200 rounded-xl flex items-center justify-between">
                    <label className="text-sm font-bold text-gray-500 flex items-center shrink-0">
                        <Flag className="w-4 h-4 mr-2" /> ความเร่งด่วน
                    </label>
                    <div className="relative flex-1 ml-2">
                        <select 
                            value={priority} 
                            onChange={(e) => setPriority(e.target.value as Priority)} 
                            className={`w-full pl-2 pr-6 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-black outline-none focus:border-indigo-500 cursor-pointer appearance-none ${
                                priority === 'URGENT' ? 'text-red-600 bg-red-50 border-red-200' : 
                                priority === 'HIGH' ? 'text-orange-600 bg-orange-50' : 
                                'text-gray-700'
                            }`}
                        >
                            <option value="LOW">ชิวๆ (Low)</option>
                            <option value="MEDIUM">ทั่วไป (Medium)</option>
                            <option value="HIGH">ด่วน (High)</option>
                            <option value="URGENT">ไฟลุก (Urgent)</option>
                        </select>
                    </div>
                </div>

                {/* Status Selector */}
                <div className="bg-white p-3 border border-gray-200 rounded-xl flex items-center justify-between">
                    <label className="text-sm font-bold text-gray-500 flex items-center shrink-0">
                        <Activity className="w-4 h-4 mr-2" /> สถานะ
                    </label>
                    <div className="relative flex-1 ml-2">
                        <select 
                            value={status} 
                            onChange={(e) => setStatus(e.target.value)} 
                            className="w-full pl-2 pr-6 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-black text-gray-700 outline-none focus:border-indigo-500 cursor-pointer appearance-none"
                        >
                            {taskStatusOptions.map(opt => (
                                <option key={opt.key} value={opt.key}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GTCoreDetails;
