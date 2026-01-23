
import React from 'react';
import { User, Duty } from '../../../types';
import { Coffee, CheckCircle2 } from 'lucide-react';
import { isSameDay } from 'date-fns';

interface MyDutyWidgetProps {
    duties: Duty[];
    currentUser: User;
}

const MyDutyWidget: React.FC<MyDutyWidgetProps> = ({ duties, currentUser }) => {
    const today = new Date();
    const myDutiesToday = duties.filter(d => 
        d.assigneeId === currentUser.id && 
        isSameDay(new Date(d.date), today)
    );

    if (myDutiesToday.length === 0) return null;

    return (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-4 mb-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-white rounded-full shadow-sm text-orange-500">
                    <Coffee className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-orange-800 text-lg">วันนี้คุณมีเวรนะ! 🧹</h3>
                    <p className="text-sm text-orange-600">อย่าลืมทำความสะอาดแล้วส่งรูปด้วยน้า</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto">
                {myDutiesToday.map(duty => (
                    <div key={duty.id} className={`flex items-center px-3 py-2 rounded-xl border shadow-sm ${duty.isDone ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white text-gray-700 border-orange-200'}`}>
                        {duty.isDone ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <span className="w-2 h-2 rounded-full bg-orange-400 mr-2 animate-pulse"></span>}
                        <span className="text-sm font-bold">{duty.title}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MyDutyWidget;
