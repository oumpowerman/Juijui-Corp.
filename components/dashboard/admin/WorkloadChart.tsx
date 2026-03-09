
import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface WorkloadChartProps {
    chartData: any[];
    progressPercentage: number;
    timeRangeLabel: string;
}

const WorkloadChart: React.FC<WorkloadChartProps> = ({ chartData, progressPercentage, timeRangeLabel }) => {
    return (
        <div className="glass-card rounded-[2.5rem] p-8 flex flex-col items-center justify-center min-h-[350px] shadow-indigo-100/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 self-start flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                ความคืบหน้างาน 📈 ({timeRangeLabel})
            </h3>

            <div className="w-full h-[240px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={75}
                            outerRadius={95}
                            paddingAngle={8}
                            dataKey="value"
                            stroke="none"
                            animationBegin={0}
                            animationDuration={1500}
                        >
                            {chartData.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={entry.color} 
                                    className="filter drop-shadow-md"
                                />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                                backdropFilter: 'blur(12px)',
                                borderRadius: '20px', 
                                border: '1px solid rgba(255, 255, 255, 0.4)', 
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', 
                                fontSize: '12px',
                                fontWeight: 'bold'
                            }} 
                            itemStyle={{ color: '#1e293b' }} 
                        />
                        <Legend 
                            verticalAlign="bottom" 
                            height={36} 
                            iconType="circle" 
                            wrapperStyle={{ 
                                fontSize: '10px', 
                                fontWeight: '900',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                paddingTop: '20px',
                                color: '#94a3b8'
                            }} 
                        />
                    </PieChart>
                </ResponsiveContainer>
                
                {/* Center Text */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
                    <motion.p 
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.5, type: 'spring' }}
                        className="text-5xl font-black text-slate-800 tracking-tighter"
                    >
                        {progressPercentage}
                    </motion.p>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest -mt-1">% DONE</span>
                </div>
            </div>
        </div>
    );
};

export default WorkloadChart;
