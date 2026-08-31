import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Client } from '../../../types/task';
import { useSponsorship } from '../../../hooks/useSponsorship';
import { sponsorshipService } from '../../../services/sponsorshipService';
import { SponsorshipDealItem, SponsorshipMetrics, ClientDealStats } from './types';
import SponsorshipMetricsCards from './SponsorshipMetricsCards';
import SponsorshipFilterToolbar from './SponsorshipFilterToolbar';
import SponsorshipClientsGrid from './SponsorshipClientsGrid';
import SponsorshipDealsTable from './SponsorshipDealsTable';
import SponsorshipClientModal from './SponsorshipClientModal';

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
    
    // Deals state
    const [deals, setDeals] = useState<SponsorshipDealItem[]>([]);
    const [isDealsLoading, setIsDealsLoading] = useState(false);
    
    // Sub-view toggle: 'CLIENTS' or 'DEALS'
    const [subTab, setSubTab] = useState<'CLIENTS' | 'DEALS'>('CLIENTS');
    
    // Filter & Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');
    
    // Client Modal State
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [selectedClientForEdit, setSelectedClientForEdit] = useState<Client | null>(null);

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
    }, [fetchClients, loadDeals]);

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
                            onSelectTask={onSelectTask}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 4. Client Create / Edit / Delete Modal */}
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
