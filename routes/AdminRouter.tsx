
import React, { Suspense, lazy } from 'react';
import { ViewMode, User, Task, Channel, MasterOption } from '../types';
import { Loader2 } from 'lucide-react';

const ChannelManager = lazy(() => import('../components/ChannelManager'));
const MasterDataManager = lazy(() => import('../components/MasterDataManager'));
const SystemLogicGuide = lazy(() => import('../components/admin/SystemLogicGuide'));
const AssetRegistryView = lazy(() => import('../components/assets/AssetRegistryView'));

const PageLoader = () => (
  <div className="flex h-full w-full items-center justify-center text-indigo-300">
    <Loader2 className="w-10 h-10 animate-spin" />
  </div>
);

interface AdminRouterProps {
  currentView: ViewMode;
  tasks: Task[];
  channels: Channel[];
  users: User[];
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
  masterOptions,
  onAddChannel,
  onUpdateChannel,
  onDeleteChannel,
  onOpenSettings
}) => {
  return (
    <Suspense fallback={<PageLoader />}>
      {(() => {
        switch (currentView) {
          case 'CHANNELS':
            return (
              <ChannelManager 
                tasks={tasks}
                channels={channels}
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
  );
};

export default AdminRouter;
