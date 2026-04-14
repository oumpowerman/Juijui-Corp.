
import React from 'react';
import { motion } from 'framer-motion';
import { IndividualGoal, KPIRecord } from '../../../types';
import OKRSection from '../sections/OKRSection';
import BehaviorSection from '../sections/BehaviorSection';

interface EvaluationTabProps {
    selectedUserId: string;
    selectedMonth: string;
    currentGoals: IndividualGoal[];
    criteria: any[];
    scores: Record<string, number>;
    setScores: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    feedback: string;
    setFeedback: (val: string) => void;
    selfScores: Record<string, number>;
    setSelfScores: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    selfFeedback: string;
    setSelfFeedback: (val: string) => void;
    selfReflectionPride: string;
    setSelfReflectionPride: (val: string) => void;
    selfReflectionImprovement: string;
    setSelfReflectionImprovement: (val: string) => void;
    isAdmin: boolean;
    isSelfEvalMode: boolean;
    onManagerSave: (status: 'DRAFT' | 'FINAL' | 'PAID') => void;
    onSelfSave: (pride: string, improvement: string) => void;
    currentRecord: KPIRecord | null | undefined;
    finalScore: number;
    addGoal: (userId: string, monthKey: string, title: string, target: number, unit: string) => void;
    updateGoalActual: (id: string, actual: number) => void;
    deleteGoal: (id: string) => void;
}

const EvaluationTab: React.FC<EvaluationTabProps> = ({
    selectedUserId, selectedMonth, currentGoals, criteria, scores, setScores, feedback, setFeedback,
    selfScores, setSelfScores, selfFeedback, setSelfFeedback, selfReflectionPride, setSelfReflectionPride,
    selfReflectionImprovement, setSelfReflectionImprovement, isAdmin, isSelfEvalMode, onManagerSave, onSelfSave,
    currentRecord, finalScore, addGoal, updateGoalActual, deleteGoal
}) => {
    return (
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-12"
        >
            <OKRSection 
                goals={currentGoals}
                onAddGoal={(t, v, u) => addGoal(selectedUserId, selectedMonth, t, v, u)}
                onUpdateActual={updateGoalActual}
                onDeleteGoal={deleteGoal}
                isAdmin={isAdmin}
            />

            <BehaviorSection 
                criteria={criteria}
                scores={scores}
                onScoreChange={(id, val) => setScores(prev => ({ ...prev, [id]: val }))}
                feedback={feedback}
                onFeedbackChange={setFeedback}
                selfScores={selfScores}
                onSelfScoreChange={(id, val) => setSelfScores(prev => ({ ...prev, [id]: val }))}
                selfFeedback={selfFeedback}
                onSelfFeedbackChange={setSelfFeedback}
                selfReflectionPride={selfReflectionPride}
                onPrideChange={setSelfReflectionPride}
                selfReflectionImprovement={selfReflectionImprovement}
                onImprovementChange={setSelfReflectionImprovement}
                isAdmin={isAdmin}
                isSelfEval={isSelfEvalMode}
                onSave={onManagerSave}
                onSaveSelf={onSelfSave}
                currentStatus={currentRecord?.status || 'DRAFT'}
                finalScore={finalScore}
                canPay={finalScore >= 80}
            />
        </motion.div>
    );
};

export default EvaluationTab;
