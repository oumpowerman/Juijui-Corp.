import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Client } from '../../../types';
import { useSponsorship } from '../../../hooks/useSponsorship';
import { useChannels } from '../../../hooks/useChannels';
import { sponsorshipService } from '../../../services/sponsorshipService';
import { SponsorshipDealItem, SponsorshipMetrics, ClientDealStats } from './types';
import SponsorshipMetricsCards from './SponsorshipMetricsCards';
import SponsorshipFilterToolbar from './SponsorshipFilterToolbar';
import SponsorshipClientsGrid from './SponsorshipClientsGrid';
import SponsorshipDealsTable from './SponsorshipDealsTable';
import SponsorshipClientModal from './SponsorshipClientModal';
import SponsorshipClientDetailModal from './SponsorshipClientDetailModal';

interface SponsorshipManagerProps {
    onSelectTask?: (taskId: string) => void;
}

const SponsorshipManager: React.FC<SponsorshipManagerProps> = ({ onSelectTask }) => {
    const { 
        clients, 
        loading: isClientsLoading, 
        createClient, 
        updateClient, 
        deleteClient, 
        fetchClients 
    } = useSponsorship();

    const { channels, fetchChannels } = useChannels();
    
    // Deals state
    const [deals, setDeals] = useState<SponsorshipDealItem[]>([]);
    const [isDealsLoading, setIsDealsLoading] = useState(false);
    
    // Sub-view toggle: 'CLIENTS' or 'DEALS'
    const [subTab, setSubTab] = useState<'CLIENTS' | 'DEALS'>('CLIENTS');
    
    // Filter & Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');
    
    // Client Edit / Create Modal State
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [selectedClientForEdit, setSelectedClientForEdit] = useState<Client | null>(null);

    // Client Drill-down Detail Modal State
    const [selectedClientForDetail, setSelectedClientForDetail] = useState<Client | null>(null);

    // Fetch all sponsorship deals
    const loadDeals = useCallback(async () => {
        setIsDealsLoading(true);
        try {
            const data = await sponsorshipService.getAllSponsorshipDeals();
            setDeals(data as SponsorshipDealItem[]);
        } catch (err) {
            console.error('Failed to fetch sponsorship deals:', err);
        } finally {
            setIsDealsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchClients();
        loadDeals();
        fetchChannels();
    }, [fetchClients, loadDeals, fetchChannels]);

    // Compute Metrics
    const metrics: SponsorshipMetrics = useMemo(() => {
        const totalRevenue = deals.reduce((sum, d) => sum + (d.dealValue || 0), 0);
        const paidRevenue = deals
            .filter(d => d.paymentStatus === 'PAID' || d.isPaid)
            .reduce((sum, d) => sum + (d.dealValue || 0), 0);
        const unpaidRevenue = totalRevenue - paidRevenue;
        const totalPartners = clients.length;
        const activeDealsCount = deals.filter(d => d.paymentStatus !== 'PAID' && !d.isPaid).length;

        return {
            totalRevenue,
            paidRevenue,
            unpaidRevenue,
            totalPartners,
            activeDealsCount
        };
    }, [deals, clients]);

    // Map deals per client for quick stats calculation
    const clientStatsMap = useMemo(() => {
        const map = new Map<string, ClientDealStats>();
        deals.forEach(deal => {
            if (!deal.clientId) return;
            const current = map.get(deal.clientId) || { 
                totalDeals: 0, 
                totalValue: 0, 
                paidValue: 0, 
                unpaidValue: 0 
            };
            current.totalDeals += 1;
            current.totalValue += (deal.dealValue || 0);
            if (deal.paymentStatus === 'PAID' || deal.isPaid) {
                current.paidValue += (deal.dealValue || 0);
            } else {
                current.unpaidValue += (deal.dealValue || 0);
            }
            map.set(deal.clientId, current);
        });
        return map;
    }, [deals]);

    // Filtered Clients list
    const filteredClients = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return clients;

        return clients.filter(c => {
            return (
                c.name.toLowerCase().includes(query) ||
                (c.contactPerson && c.contactPerson.toLowerCase().includes(query)) ||
                (c.email && c.email.toLowerCase().includes(query)) ||
                (c.phone && c.phone.includes(query))
            );
        });
    }, [clients, searchQuery]);

    // Filtered Deals list
    const filteredDeals = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return deals.filter(d => {
            const matchesQuery = !query || (
                (d.client?.name && d.client.name.toLowerCase().includes(query)) ||
                (d.task?.title && d.task.title.toLowerCase().includes(query)) ||
                (d.requirements && d.requirements.toLowerCase().includes(query))
            );
            
            const isPaid = d.paymentStatus === 'PAID' || d.isPaid;
            const matchesPayment = 
                paymentFilter === 'ALL' ? true :
                paymentFilter === 'PAID' ? isPaid :
                !isPaid;

            return matchesQuery && matchesPayment;
        });
    }, [deals, searchQuery, paymentFilter]);

    // Selected client's specific deals & stats for drill-down modal
    const selectedClientDeals = useMemo(() => {
        if (!selectedClientForDetail) return [];
        return deals.filter(d => d.clientId === selectedClientForDetail.id);
    }, [deals, selectedClientForDetail]);

    const selectedClientStats = useMemo(() => {
        if (!selectedClientForDetail) {
            return { totalDeals: 0, totalValue: 0, paidValue: 0, unpaidValue: 0 };
        }
        return clientStatsMap.get(selectedClientForDetail.id) || {
            totalDeals: 0,
            totalValue: 0,
            paidValue: 0,
            unpaidValue: 0,
        };
    }, [clientStatsMap, selectedClientForDetail]);

    // Click on a deal to view ContentDetail via Global Task Modal
    const handleTaskClick = (taskId: string) => {
        if (onSelectTask) {
            onSelectTask(taskId);
        }
    };

    // Modal Handlers
    const handleOpenAddModal = () => {
        setSelectedClientForEdit(null);
        setIsClientModalOpen(true);
    };

    const handleOpenEditModal = (client: Client) => {
        setSelectedClientForEdit(client);
        setIsClientModalOpen(true);
    };

    const handleSaveClient = async (clientData: Partial<Client>) => {
        if (selectedClientForEdit?.id) {
            await updateClient(selectedClientForEdit.id, clientData);
        } else {
            await createClient(clientData);
        }
        await loadDeals();
    };

    const handleDeleteClient = async (clientId: string) => {
        await deleteClient(clientId);
        if (selectedClientForDetail?.id === clientId) {
            setSelectedClientForDetail(null);
        }
        await loadDeals();
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
        >
            {/* 1. Summary Metric KPI Cards */}
            <SponsorshipMetricsCards
                metrics={metrics}
                totalDealsCount={deals.length}
                onAddClient={handleOpenAddModal}
            />

            {/* 2. Controls & Tab Toolbar */}
            <SponsorshipFilterToolbar
                subTab={subTab}
                onTabChange={setSubTab}
                clientsCount={clients.length}
                dealsCount={deals.length}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                paymentFilter={paymentFilter}
                onPaymentFilterChange={setPaymentFilter}
                onAddClient={handleOpenAddModal}
            />

            {/* 3. Sub-View Animated Content */}
            <AnimatePresence mode="wait">
                {subTab === 'CLIENTS' ? (
                    <motion.div
                        key="clients-view"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                    >
                        <SponsorshipClientsGrid
                            clients={filteredClients}
                            clientStatsMap={clientStatsMap}
                            isLoading={isClientsLoading}
                            searchQuery={searchQuery}
                            onAddClient={handleOpenAddModal}
                            onEditClient={handleOpenEditModal}
                            onDeleteClient={handleDeleteClient}
                            onViewDetails={(client) => setSelectedClientForDetail(client)}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="deals-view"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                    >
                        <SponsorshipDealsTable
                            deals={filteredDeals}
                            isLoading={isDealsLoading}
                            onSelectTask={handleTaskClick}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 4. Client Drill-Down Detail Modal (Viewing all clips & revenues for this client) */}
            <AnimatePresence>
                {selectedClientForDetail && (
                    <SponsorshipClientDetailModal
                        isOpen={!!selectedClientForDetail}
                        onClose={() => setSelectedClientForDetail(null)}
                        client={selectedClientForDetail}
                        deals={selectedClientDeals}
                        stats={selectedClientStats}
                        channels={channels}
                        onSelectTask={handleTaskClick}
                        onEditClient={handleOpenEditModal}
                    />
                )}
            </AnimatePresence>

            {/* 5. Client Create / Edit / Delete Modal */}
            <SponsorshipClientModal
                isOpen={isClientModalOpen}
                onClose={() => setIsClientModalOpen(false)}
                onSave={handleSaveClient}
                onDelete={handleDeleteClient}
                initialClient={selectedClientForEdit}
            />
        </motion.div>
    );
};

export default SponsorshipManager;
