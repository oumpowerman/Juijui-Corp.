
import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, Film } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { Task } from '../../../../types';
import PlatformSection from '../../content-parts/PlatformSection';

interface ProductionSectionProps {
    task: Task;
}

const ProductionSection: React.FC<ProductionSectionProps> = ({ task }) => {
    return (
        <motion.section 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
        >
            <div className="flex items-center gap-2 text-slate-300 px-1">
                <Clock className="w-4 h-4" />
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em]">Production Timeline</h4>
            </div>
            <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] grid grid-cols-1 sm:grid-cols-2 gap-8 relative overflow-hidden"
            >
                <div className="relative z-10 space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-300 flex items-center justify-center shrink-0">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest mb-1">Publish Date</p>
                            <p className="text-xl font-semibold text-slate-600">
                                {task.endDate ? format(new Date(task.endDate), 'd MMMM yyyy', { locale: th }) : 'ไม่ระบุ'}
                            </p>
                            <p className="text-xs text-slate-300 mt-1 font-medium">
                                {task.startDate ? `เริ่มผลิต: ${format(new Date(task.startDate), 'd MMM', { locale: th })}` : ''}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-300 flex items-center justify-center shrink-0">
                            <Film className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest mb-1">Shoot Date</p>
                            <p className="text-xl font-semibold text-slate-600">
                                {task.shootDate ? format(new Date(task.shootDate), 'd MMMM yyyy', { locale: th }) : 'ยังไม่ระบุวันถ่าย'}
                            </p>
                            <p className="text-xs text-slate-300 mt-1 font-medium italic">
                                {task.shootLocation ? `@ ${task.shootLocation}` : 'ยังไม่ระบุสถานที่'}
                            </p>
                        </div>
                    </div>
                </div>

                <PlatformSection task={task} />
            </motion.div>
        </motion.section>
    );
};

export default ProductionSection;
