import React from 'react';
import { motion } from 'framer-motion';
import { Building2, User, Phone, Mail, Edit3, Trash2, ArrowUpRight } from 'lucide-react';
import { Client } from '../../../types/task';
import { ClientDealStats } from './types';

interface SponsorshipClientCardProps {
    client: Client;
    stats: ClientDealStats;
    onEdit: (client: Client) => void;
    onDelete: (clientId: string) => void;
}

export const SponsorshipClientCard = React.forwardRef<HTMLDivElement, SponsorshipClientCardProps>(({
    client,
    stats,
    onEdit,
    onDelete,
}, ref) => {
    return (
        <motion.div
            ref={ref}
            layout
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -10 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md hover:border-amber-300/80 transition-all flex flex-col justify-between group relative"
        >
            <div>
                {/* Header with Logo, Info and Action Buttons */}
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs group-hover:border-amber-200 transition-colors">
                            {client.logoUrl ? (
                                <img 
                                    src={client.logoUrl} 
                                    alt={client.name} 
                                    className="w-full h-full object-contain p-1"
                                    onError={(e) => {
                                        (e.target as HTMLElement).style.display = 'none';
                                    }}
                                />
                            ) : (
                                <Building2 className="w-6 h-6 text-slate-300 group-hover:text-amber-500 transition-colors" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <h4 className="text-base font-bold text-slate-800 truncate group-hover:text-amber-600 transition-colors">
                                {client.name}
                            </h4>
                            <p className="text-xs text-slate-400 font-medium truncate flex items-center gap-1">
                                <User className="w-3 h-3 text-slate-300 shrink-0" />
                                {client.contactPerson || 'ไม่ระบุผู้ติดต่อ'}
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons with subtle animations */}
                    <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            whileHover={{ scale: 1.1 }}
                            onClick={() => onEdit(client)}
                            className="p-2 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                            title="แก้ไขข้อมูลลูกค้า"
                        >
                            <Edit3 className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            whileHover={{ scale: 1.1 }}
                            onClick={() => onDelete(client.id)}
                            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="ลบ / ซ่อนลูกค้า"
                        >
                            <Trash2 className="w-4 h-4" />
                        </motion.button>
                    </div>
                </div>

                {/* Contact Details Pill */}
                <div className="space-y-1.5 py-2.5 px-3 bg-slate-50/80 rounded-2xl border border-slate-100 text-xs mb-4">
                    {client.phone ? (
                        <a 
                            href={`tel:${client.phone}`} 
                            className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors truncate group/phone"
                        >
                            <Phone className="w-3 h-3 text-slate-400 group-hover/phone:text-indigo-500 shrink-0" />
                            <span className="truncate">{client.phone}</span>
                            <ArrowUpRight className="w-2.5 h-2.5 opacity-0 group-hover/phone:opacity-100 text-indigo-400 shrink-0 ml-auto transition-opacity" />
                        </a>
                    ) : (
                        <p className="text-slate-400 text-[11px] flex items-center gap-2">
                            <Phone className="w-3 h-3 text-slate-300 shrink-0" /> ไม่มีเบอร์โทรศัพท์
                        </p>
                    )}

                    {client.email ? (
                        <a 
                            href={`mailto:${client.email}`} 
                            className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors truncate group/email"
                        >
                            <Mail className="w-3 h-3 text-slate-400 group-hover/email:text-indigo-500 shrink-0" />
                            <span className="truncate">{client.email}</span>
                            <ArrowUpRight className="w-2.5 h-2.5 opacity-0 group-hover/email:opacity-100 text-indigo-400 shrink-0 ml-auto transition-opacity" />
                        </a>
                    ) : (
                        <p className="text-slate-400 text-[11px] flex items-center gap-2">
                            <Mail className="w-3 h-3 text-slate-300 shrink-0" /> ไม่มีอีเมล
                        </p>
                    )}
                </div>
            </div>

            {/* Financial Summary for this Client */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">งานที่ทำร่วมกัน</p>
                    <p className="text-sm font-black text-slate-700">{stats.totalDeals} คอนเทนต์</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ยอดดีลรวม</p>
                    <p className="text-sm font-black text-amber-600">฿{stats.totalValue.toLocaleString()}</p>
                </div>
            </div>
        </motion.div>
    );
});

SponsorshipClientCard.displayName = 'SponsorshipClientCard';

export default SponsorshipClientCard;
