
import React from 'react';
import WeeklyQuestBoard from '../../WeeklyQuestBoard';
import { Task, Channel, MasterOption, WeeklyQuest } from '../../../types';
import { useWeeklyQuests } from '../../../hooks/useWeeklyQuests';

interface QuestBoardWidgetProps {
    tasks: Task[];
    channels: Channel[];
    masterOptions: MasterOption[];
    onOpenSettings: () => void;
}

const QuestBoardWidget: React.FC<QuestBoardWidgetProps> = ({ 
    tasks, channels, masterOptions, onOpenSettings 
}) => {
    // Re-use the hook to manage quests state independently in dashboard context
    const { quests, handleAddQuest, handleDeleteQuest, updateManualProgress, updateQuest } = useWeeklyQuests();

    return (
        <WeeklyQuestBoard 
            tasks={tasks}
            channels={channels}
            quests={quests}
            masterOptions={masterOptions}
            onAddQuest={handleAddQuest}
            onDeleteQuest={handleDeleteQuest}
            onOpenSettings={onOpenSettings}
            onUpdateProgress={updateManualProgress}
            onUpdateQuest={updateQuest}
        />
    );
};

export default QuestBoardWidget;
