
import { useKPIContext } from '../context/KPIContext';

export const useKPI = () => {
    const context = useKPIContext();
    
    return {
        kpiRecords: context.kpiRecords,
        goals: context.goals,
        idpItems: context.idpItems,
        peerReviews: context.peerReviews,
        criteria: context.criteria,
        config: context.config,
        isLoading: context.isLoading,
        
        saveEvaluation: context.saveEvaluation,
        saveSelfEvaluation: context.saveSelfEvaluation,
        addGoal: context.addGoal,
        updateGoalActual: context.updateGoalActual,
        deleteGoal: context.deleteGoal,
        addIDPItem: context.addIDPItem,
        updateIDPStatus: context.updateIDPStatus,
        deleteIDPItem: context.deleteIDPItem,
        sendKudos: context.sendKudos,
        refreshKPI: context.refreshKPI,
        updateConfig: context.updateConfig,
        fetchUserStats: context.fetchUserStats
    };
};
