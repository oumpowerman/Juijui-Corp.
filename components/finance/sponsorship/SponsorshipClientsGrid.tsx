import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Plus, Loader2 } from 'lucide-react';
import { Client } from '../../../types/task';
import { ClientDealStats } from './types';
import SponsorshipClientCard from './SponsorshipClientCard';
import SponsorshipPagination from './SponsorshipPagination';

interface SponsorshipClientsGridProps {
    clients: Client[];
    clientStatsMap: Map<string, ClientDealStats>;
    isLoading: boolean;
    searchQuery: string;
    onAddClient: () => void;
    onEditClient: (client: Client) => void;
    onDeleteClient: (clientId: string) => void;
    onViewDetails?: (client: Client) => void;
}

const PAGE_SIZE = 9; // 3x3 grid

export const SponsorshipClientsGrid: React.FC<SponsorshipClientsGridProps> = ({
    clients,
    clientStatsMap,
    isLoading,
    searchQuery,
    onAddClient,
    onEditClient,
    onDeleteClient,
    onViewDetails,
}) => {
    const [currentPage, setCurrentPage] = useState(1);

    // Reset page to 1 whenever search query or list changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, clients.length]);

    const paginatedClients = useMemo(() => {
        const startIndex = (currentPage - 1) * PAGE_SIZE;
        return clients.slice(startIndex, startIndex + PAGE_SIZE);
    }, [clients, currentPage]);

    if (isLoading) {
        return (
            <div className="py-24 text-center flex flex-col items-center justify-center space-y-3 bg-white rounded-3xl border border-slate-200 shadow-xs">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">กำลังโหลดข้อมูลลูกค้า...</p>
            </div>
        );
    }

    if (clients.length === 0) {
        return (
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3"
            >
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
                    <Building2 className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-slate-700">ไม่พบรายชื่อสปอนเซอร์ / ลูกค้า</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {searchQuery 
                        ? 'ลองเปลี่ยนคำค้นหา หรือล้างตัวกรองเพื่อดูรายการทั้งหมด' 
                        : 'เริ่มต้นสร้างพาร์ตเนอร์สปอนเซอร์รายแรก เพื่อเชื่อมโยงกับคอนเทนต์และติดตามรายรับ'}
                </p>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={onAddClient}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 hover:bg-amber-600 transition-colors mt-2 cursor-pointer"
                >
                    <Plus className="w-4 h-4" /> เพิ่มลูกค้าใหม่
                </motion.button>
            </motion.div>
        );
    }

    return (
        <div className="space-y-4">
            <motion.div 
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
                <AnimatePresence mode="popLayout">
                    {paginatedClients.map((client) => {
                        const stats = clientStatsMap.get(client.id) || {
                            totalDeals: 0,
                            totalValue: 0,
                            paidValue: 0,
                            unpaidValue: 0,
                        };

                        return (
                            <SponsorshipClientCard
                                key={client.id}
                                client={client}
                                stats={stats}
                                onEdit={onEditClient}
                                onDelete={onDeleteClient}
                                onViewDetails={onViewDetails}
                            />
                        );
                    })}
                </AnimatePresence>
            </motion.div>

            {/* Pagination Controls */}
            <SponsorshipPagination
                currentPage={currentPage}
                totalItems={clients.length}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
                itemLabel="แบรนด์"
            />
        </div>
    );
};

export default SponsorshipClientsGrid;
