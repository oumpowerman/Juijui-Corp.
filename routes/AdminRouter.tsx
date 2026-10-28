
import React, { Suspense, lazy } from 'react';
import { ViewMode, User, Task, Channel, MasterOption } from '../types';
import { Loader2 } from 'lucide-react';
import AppBackground from '../components/common/AppBackground';
import { lazyWithRetry } from '../lib/lazyWithRetry';

const ChannelManager = lazyWithRetry(() => import('../components/ChannelManager'), 'ChannelManager');
const MasterDataManager = lazyWithRetry(() => import('../components/MasterDataManager'), 'MasterDataManager');
const SystemLogicGuide = lazyWithRetry(() => import('../components/admin/SystemLogicGuide'), 'SystemLogicGuide');
const AssetRegistryView = lazyWithRetry(() => import('../components/assets/AssetRegistryView'), 'AssetRegistryView');

const PageLoader = () => (
  <div className="flex-1 w-full flex flex-col items-center justify-center text-indigo-300 min-h-[400px]">
    <Loader2 className="w-10 h-10 animate-spin" />
  </div>
);

interface AdminRouterProps {
  currentView: ViewMode;
  tasks: Task[];
  channels: Channel[];
  users: User[];
  currentUser?: User;
  masterOptions: MasterOption[];
  onAddChannel: (channel: Channel, file?: File) => Promise<boolean>;
  onUpdateChannel: (channel: Channel, file?: File) => Promise<boolean>;
  onDeleteChannel: (id: string) => Promise<boolean>;
  onOpenSettings: () => void;
}

const AdminRouter: React.FC<AdminRouterProps> = ({
  currentView,
  tasks,
  channels,
  users,
  currentUser,
  masterOptions,
  onAddChannel,
  onUpdateChannel,
  onDeleteChannel,
  onOpenSettings
}) => {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<PageLoader />}>
        {(() => {
          switch (currentView) {
            case 'CHANNELS':
              return (
                <ChannelManager 
                  tasks={tasks}
                  channels={channels}
                  currentUser={currentUser}
                  onAdd={onAddChannel}
                  onEdit={onUpdateChannel}
                  onDelete={onDeleteChannel}
                  onOpenSettings={onOpenSettings}
                />
              );
            case 'MASTER_DATA':
              return <MasterDataManager />;
            case 'SYSTEM_GUIDE':
              return <SystemLogicGuide />;
            case 'ASSETS':
              return <AssetRegistryView users={users} masterOptions={masterOptions} />;
            default:
              return null;
          }
        })()}
      </Suspense>
    </div>
  );
};

export default AdminRouter;
