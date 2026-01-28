
import React, { useState } from 'react';
import { DutySwap, User } from '../../types';
import { ArrowRightLeft, Check, X, BellRing, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

interface SwapInboxProps {
    requests: DutySwap[];
    currentUser: User;
    onRespond: (swapId: string, accept: boolean) => void;
}

const SwapInbox: React.FC<SwapInboxProps> = ({ requests, currentUser, onRespond }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Filter requests where I am the target
    const myIncomingRequests = requests.filter(r => r.targetDuty && r.targetDuty.assigneeId === currentUser.id && r.status === 'PENDING');

    if (myIncomingRequests.length === 0) return null;

    return (
        <div className="mb-6 animate-in slide-in-from-top-2">
            {/* Banner Header */}
            <div 
                onClick={() => setIsExpanded(!isExpanded)}
                className={`
                    flex items-center justify-between p-4 cursor-pointer transition-all border
                    ${isExpanded ? 'rounded-t-2xl border-orange-200 bg-orange-50' : 'rounded-2xl border-orange-200 bg-white shadow-sm hover:shadow-md'}
                `}
            >
                <div className="flex items-center gap-3">
                    <div className="bg-orange-100 text-orange-600 p-2 rounded-full animate-bounce-slow">
                        <BellRing className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-orange-900 text-sm">
                            มีคำขอแลกเวรถึงคุณ ({myIncomingRequests.length})
                        </h3>
                        {!isExpanded && (
                            <p className="text-xs text-orange-600 truncate">
                                จาก {myIncomingRequests[0].requestor?.name} และคนอื่นๆ...
                            </p>
                        )}
                    </div>
                </div>
                <button className="text-orange-400 hover:text-orange-600">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
            </div>

            {/* Expanded List */}
            {isExpanded && (
                <div className="bg-white border border-t-0 border-orange-200 rounded-b-2xl p-4 shadow-sm space-y-3">
                    {myIncomingRequests.map(req => (
                        <div key={req.id} className="bg-orange-50/50 rounded-xl p-3 border border-orange-100 flex flex-col md:flex-row items-center gap-4">
                            
                            {/* Info */}
                            <div className="flex items-center gap-3 flex-1 w-full">
                                <div className="relative shrink-0">
                                    <img src={req.requestor?.avatarUrl} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                                    <div className="absolute -bottom-1 -right-1 bg-indigo-500 text-white p-0.5 rounded-full border border-white">
                                        <ArrowRightLeft className="w-3 h-3" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-700">
                                        <span className="font-bold text-indigo-600">{req.requestor?.name}</span> อยากขอแลกเวร
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                        <span className="bg-white px-1.5 py-0.5 rounded border border-gray-200">
                                            {req.ownDuty?.title} ({format(new Date(req.ownDuty?.date || ''), 'd MMM')})
                                        </span>
                                        <span>↔️</span>
                                        <span className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100 font-bold">
                                            {req.targetDuty?.title} ({format(new Date(req.targetDuty?.date || ''), 'd MMM')})
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 w-full md:w-auto shrink-0">
                                <button 
                                    onClick={() => onRespond(req.id, true)} 
                                    className="flex-1 md:flex-none bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center transition-colors shadow-sm active:scale-95"
                                >
                                    <Check className="w-3 h-3 mr-1.5" /> ตกลงแลก
                                </button>
                                <button 
                                    onClick={() => onRespond(req.id, false)} 
                                    className="flex-1 md:flex-none bg-white border border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200 text-gray-600 px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center transition-colors active:scale-95"
                                >
                                    <X className="w-3 h-3 mr-1.5" /> ปฏิเสธ
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SwapInbox;
