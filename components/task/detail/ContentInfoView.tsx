
import React from 'react';
import { motion } from 'framer-motion';
import { Task, User } from '../../../types';
import StorageSection from './sections/StorageSection';
import StrategySection from './sections/StrategySection';
import ProductionSection from './sections/ProductionSection';
import SponsorshipSection from './sections/SponsorshipSection';
import TeamSection from './sections/TeamSection';
import BriefSection from './sections/BriefSection';

interface ContentInfoViewProps {
    task: Task;
    users: User[];
}

const ContentInfoView: React.FC<ContentInfoViewProps> = ({ task, users }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-10"
        >
            <StorageSection task={task} />
            <StrategySection task={task} />
            <SponsorshipSection taskId={task.id} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <ProductionSection task={task} />
                </div>
                <TeamSection task={task} users={users} />
            </div>

            <BriefSection task={task} />
        </motion.div>
    );
};

export default ContentInfoView;
