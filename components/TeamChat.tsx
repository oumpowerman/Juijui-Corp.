
import React, { useState, useEffect } from 'react';
import { User, Task } from '../types';
import { format } from 'date-fns';
import { useTeamChat } from '../hooks/useTeamChat';
import { useGoogleDrive } from '../hooks/useGoogleDrive';
import { compressImage } from '../lib/imageUtils';
import { useGlobalDialog } from '../context/GlobalDialogContext';

// Import Refactored Sub-Components
import ChatHeader from './team-chat/ChatHeader';
import MessageList from './team-chat/MessageList';
import ChatInput from './team-chat/ChatInput';
import ChatSidebar from './team-chat/ChatSidebar';

interface TeamChatProps {
    currentUser: User | null;
    allUsers: User[];
    onAddTask: (task: Task) => void;
}

const TeamChat: React.FC<TeamChatProps> = ({ currentUser, allUsers, onAddTask }) => {
    const { showAlert } = useGlobalDialog();
    // --- State ---
    const [isBotEnabled, setIsBotEnabled] = useState(true);
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // --- Hooks ---
    const { messages, isLoading, isLoadingMore, hasMore, loadMore, sendMessage, sendFile, markAsRead } = useTeamChat(currentUser, allUsers, onAddTask, isBotEnabled);
    const { uploadFileToDrive, isReady: isDriveReady } = useGoogleDrive();
    
    // Mark as read on mount
    useEffect(() => {
        markAsRead();
    }, []);

    // --- File Upload Logic ---
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIsProcessingFile(true);
            setUploadStatus('กำลังประมวลผลรูป...');

            try {
                // 1. Compression
                let fileToSend = file;
                if (file.type.startsWith('image/')) {
                    setUploadStatus('กำลังย่อรูป...');
                    fileToSend = await compressImage(file);
                }

                // 2. Upload Strategy
                const currentYear = format(new Date(), 'yyyy');
                const currentMonth = format(new Date(), 'MM');
                
                const driveUploader = async (f: File): Promise<string> => {
                    setUploadStatus('กำลังอัปโหลดไป Drive...');
                    const result = await uploadFileToDrive(f, ['Juijui_Assets', 'Chat', currentYear, currentMonth]);
                    return result.thumbnailUrl || result.url;
                };

                // 3. Send
                await sendFile(fileToSend, isDriveReady ? driveUploader : undefined);

            } catch (error) {
                console.error("File processing error:", error);
                showAlert("เกิดข้อผิดพลาดในการส่งไฟล์", "ข้อผิดพลาด");
            } finally {
                setIsProcessingFile(false);
                setUploadStatus('');
                // Reset file input is handled inside ChatInput component logic if needed, 
                // but since we pass the event here, we might need a way to clear it there.
                // In this refactor, ChatInput manages the ref reset.
            }
        }
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-500 p-0 lg:p-6 pb-24 lg:pb-0">
            <div className="flex-1 flex gap-0 lg:gap-6 overflow-hidden h-full">
                
                {/* Main Chat Area */}
                <div className="flex-1 bg-white rounded-none lg:rounded-2xl shadow-none lg:shadow-sm border-0 lg:border border-gray-200 flex flex-col overflow-hidden relative">
                    
                    <ChatHeader 
                        isBotEnabled={isBotEnabled} 
                        setIsBotEnabled={setIsBotEnabled} 
                        allUsers={allUsers} 
                        isSidebarOpen={isSidebarOpen}
                        setIsSidebarOpen={setIsSidebarOpen}
                    />

                    <MessageList 
                        messages={messages}
                        currentUser={currentUser}
                        isLoading={isLoading}
                        hasMore={hasMore}
                        isLoadingMore={isLoadingMore}
                        onLoadMore={loadMore}
                    />

                    <ChatInput 
                        onSendMessage={sendMessage}
                        onSendFile={handleFileChange}
                        isProcessingFile={isProcessingFile}
                        uploadStatus={uploadStatus}
                        isBotEnabled={isBotEnabled}
                        isDriveReady={isDriveReady}
                    />
                </div>

                {/* Right Sidebar (Responsive: Inline on desktop, Drawer on mobile/tablet) */}
                <ChatSidebar 
                    isBotEnabled={isBotEnabled}
                    allUsers={allUsers}
                    isOpenMobile={isSidebarOpen}
                    onCloseMobile={() => setIsSidebarOpen(false)}
                />
            </div>
        </div>
    );
};

export default TeamChat;
