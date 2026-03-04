
export interface HPDeathLog {
    id: string;
    userId: string;
    deathNumber: number;
    snapshotData: {
        overdueTasks: {
            id: string;
            title: string;
            dueDate: string;
            delayDays: number;
        }[];
        recentPenalties: {
            actionType: string;
            hpChange: number;
            description: string;
            createdAt: string;
        }[];
        statsAtDeath: {
            level: number;
            xp: number;
            availablePoints: number;
        };
    };
    createdAt: Date;
}
