
import React, { useState } from 'react';
import { User, WorkStatus } from '../../../types';
import GameRulesModal from '../../gamification/GameRulesModal';
import DeathHistoryModal from './DeathHistoryModal';
import { useGreetings } from '../../../hooks/useGreetings';

// Sub-components
import DeadStateView from './welcome-header/DeadStateView';
import TieredStateView from './welcome-header/TieredStateView';
import DivineStateView from './welcome-header/DivineStateView';
import ProfileSection from './welcome-header/ProfileSection';
import StatsSection from './welcome-header/StatsSection';
import ActionButtons from './welcome-header/ActionButtons';

interface WelcomeHeaderProps {
    user: User;
    onUpdateStatus: (status: WorkStatus) => void;
    onOpenShop: () => void;
    onOpenNotifications: () => void;
    onEditProfile: () => void;
    unreadNotifications: number;
    onOpenWorkload: () => void;
    onOpenReport: () => void;
    onOpenRules?: () => void;
    onOpenDeathHistory?: () => void;
}

const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({ 
    user, 
    onUpdateStatus, 
    onOpenShop,
    onOpenNotifications,
    onEditProfile,
    unreadNotifications,
    onOpenWorkload,
    onOpenReport
}) => {
    const [isRulesOpen, setIsRulesOpen] = useState(false);
    const [isDeathHistoryOpen, setIsDeathHistoryOpen] = useState(false);
    const { randomGreeting } = useGreetings();

    // Calculate Level Progress
    const nextLevelXP = user.level * 1000;
    const progressPercent = Math.min(((user.xp % 1000) / 1000) * 100, 100);
    
    // HP Percentage
    const hpPercent = Math.min((user.hp / (user.maxHp || 100)) * 100, 100);
    const isHpLow = hpPercent < 30;
    const isDead = user.hp <= 0;
    const isDivine = hpPercent >= 90;
    const isTiered = hpPercent >= 50;

    const renderMainContent = () => {
        // --- GAME OVER STATE ---
        if (isDead) {
            return (
                <DeadStateView 
                    user={user} 
                    onOpenShop={onOpenShop} 
                    onEditProfile={onEditProfile} 
                    onOpenDeathHistory={() => setIsDeathHistoryOpen(true)}
                />
            );
        }

        // --- DIVINE STATE (HP 90-100) ---
        if (isDivine) {
            return (
                <DivineStateView 
                    user={user}
                    hpPercent={hpPercent}
                    progressPercent={progressPercent}
                    nextLevelXP={nextLevelXP}
                    randomGreeting={randomGreeting}
                    unreadNotifications={unreadNotifications}
                    onUpdateStatus={onUpdateStatus}
                    onOpenShop={onOpenShop}
                    onOpenNotifications={onOpenNotifications}
                    onEditProfile={onEditProfile}
                    onOpenWorkload={onOpenWorkload}
                    onOpenReport={onOpenReport}
                    onOpenRules={() => setIsRulesOpen(true)}
                    onOpenDeathHistory={() => setIsDeathHistoryOpen(true)}
                />
            );
        }

        // --- TIERED STATE (HP 50-89) ---
        if (isTiered) {
            return (
                <TieredStateView 
                    user={user}
                    hpPercent={hpPercent}
                    progressPercent={progressPercent}
                    nextLevelXP={nextLevelXP}
                    randomGreeting={randomGreeting}
                    unreadNotifications={unreadNotifications}
                    onUpdateStatus={onUpdateStatus}
                    onOpenShop={onOpenShop}
                    onOpenNotifications={onOpenNotifications}
                    onEditProfile={onEditProfile}
                    onOpenWorkload={onOpenWorkload}
                    onOpenReport={onOpenReport}
                    onOpenRules={() => setIsRulesOpen(true)}
                    onOpenDeathHistory={() => setIsDeathHistoryOpen(true)}
                />
            );
        }

        // --- NORMAL STATE ---
        return (
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 relative overflow-visible">
                {/* Background Decor Mask */}
                <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-50 to-purple-50 rounded-bl-full opacity-50" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    {/* 1. User Profile & Status */}
                    <ProfileSection 
                        user={user}
                        randomGreeting={randomGreeting}
                        isHpLow={isHpLow}
                        onEditProfile={onEditProfile}
                        onUpdateStatus={onUpdateStatus}
                    />

                    {/* 2. Stats & Gamification */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                        <StatsSection 
                            user={user}
                            hpPercent={hpPercent}
                            progressPercent={progressPercent}
                            nextLevelXP={nextLevelXP}
                            isHpLow={isHpLow}
                            onOpenRules={() => setIsRulesOpen(true)}
                            onOpenDeathHistory={() => setIsDeathHistoryOpen(true)}
                        />

                        <ActionButtons 
                            user={user}
                            unreadNotifications={unreadNotifications}
                            onOpenReport={onOpenReport}
                            onOpenWorkload={onOpenWorkload}
                            onOpenShop={onOpenShop}
                            onOpenNotifications={onOpenNotifications}
                        />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            {/* Custom Animation Styles */}
            <style>{`
                @keyframes float-gentle {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-6px) rotate(2deg); }
                }
                .animate-float-gentle {
                    animation: float-gentle 3.5s ease-in-out infinite;
                }
                .pop-shadow {
                    box-shadow: 4px 4px 0px 0px rgba(99, 102, 241, 0.2);
                }
                .pop-shadow:hover {
                    transform: translate(-2px, -2px);
                    box-shadow: 6px 6px 0px 0px rgba(99, 102, 241, 0.3);
                }
            `}</style>

            {renderMainContent()}

            {/* Modals - Always rendered regardless of which state view is active */}
            <GameRulesModal 
                isOpen={isRulesOpen} 
                onClose={() => setIsRulesOpen(false)} 
            />

            <DeathHistoryModal 
                isOpen={isDeathHistoryOpen}
                onClose={() => setIsDeathHistoryOpen(false)}
                userId={user.id}
            />
        </>
    );
};

export default WelcomeHeader;
