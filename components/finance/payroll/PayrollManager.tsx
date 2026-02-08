
import React, { useState } from 'react';
import { User, PayrollCycle } from '../../../types';
import { usePayroll } from '../../../hooks/usePayroll';
import PayrollCycleList from './PayrollCycleList';
import PayrollEditor from './PayrollEditor';
import { format } from 'date-fns';
import SlipReviewModal from './SlipReviewModal';

interface PayrollManagerProps {
    currentUser: User;
    allUsers: User[];
}

const PayrollManager: React.FC<PayrollManagerProps> = ({ currentUser, allUsers }) => {
    const { 
        cycles, currentSlips, isLoading, isSeniorHR,
        generateCycle, deleteCycle, fetchSlips, 
        updateSlip, deleteSlip, createSlip, 
        sendToReview, respondToSlip, finalizeCycle 
    } = usePayroll(currentUser);

    const [activeCycle, setActiveCycle] = useState<PayrollCycle | null>(null);
    const [viewingSlipId, setViewingSlipId] = useState<string | null>(null);

    const handleCreateCycle = async () => {
        const monthKey = format(new Date(), 'yyyy-MM');
        await generateCycle(monthKey, allUsers);
    };

    const handleOpenCycle = async (cycle: PayrollCycle) => {
        setActiveCycle(cycle);
        await fetchSlips(cycle.id);
    };

    // If Member (not Senior HR), auto-open their slip if they click a cycle in "WAITING_REVIEW" or "PAID"
    // Or we provide a button "View My Slip"

    return (
        <div className="space-y-6">
            {activeCycle ? (
                <PayrollEditor 
                    cycle={activeCycle}
                    slips={currentSlips}
                    allUsers={allUsers}
                    currentUser={currentUser}
                    isSeniorHR={isSeniorHR}
                    onBack={() => setActiveCycle(null)}
                    onUpdateSlip={updateSlip}
                    onDeleteSlip={deleteSlip}
                    onCreateSlip={createSlip}
                    onFinalize={() => finalizeCycle(activeCycle.id)}
                    onSendToReview={(date) => sendToReview(activeCycle.id, date)}
                    onRespondToSlip={respondToSlip}
                />
            ) : (
                <PayrollCycleList 
                    cycles={cycles}
                    onSelect={handleOpenCycle}
                    onCreate={handleCreateCycle}
                    onDelete={deleteCycle}
                    canCreate={isSeniorHR}
                />
            )}
        </div>
    );
};

export default PayrollManager;
