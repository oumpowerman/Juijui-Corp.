
import { useFinanceContext } from '../context/FinanceContext';

export const useFinance = (currentUser?: any) => {
    const context = useFinanceContext();
    
    return {
        transactions: context.transactions,
        stats: context.stats,
        trips: context.trips,
        potentialTrips: context.potentialTrips,
        isLoading: context.isLoading,
        isStatsLoading: context.isStatsLoading,
        pagination: {
            page: context.currentPage,
            setPage: context.setCurrentPage, 
            totalCount: context.totalCount,
            pageSize: 15,
            totalPages: Math.ceil(context.totalCount / 15)
        },
        refreshAll: context.refreshAll,
        fetchTrips: context.fetchTrips,
        updateTrip: context.updateTrip,
        deleteTrip: context.deleteTrip,
        addTransaction: (data: any) => context.addTransaction(data, currentUser?.id),
        deleteTransaction: context.deleteTransaction,
        convertGroupToTrip: context.convertGroupToTrip
    };
};
