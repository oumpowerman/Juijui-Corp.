
import React, { useState, useEffect } from 'react';
import { User, Task } from '../types';
import { format } from 'date-fns';
import { useTeamChat } from '../hooks/useTeamChat';
import { useGoogleDrive } from '../hooks/useGoogleDrive';
import { compressImage } from '../lib/imageUtils';

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
    // --- State ---
    const [isBotEnabled, setIsBotEnabled] = useState(true);
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    
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
                const currentMonthFolder = format(new Date(), 'yyyy-MM');
                
                const driveUploader = async (f: File): Promise<string> => {
                    return new Promise((resolve) => {
                        setUploadStatus('กำลังอัปโหลดไป Drive...');
                        uploadFileToDrive(f, (result) => {
                            resolve(result.thumbnailUrl || result.url);
                        }, ['Chat_Images', currentMonthFolder]);
                    });
                };

                // 3. Send
                await sendFile(fileToSend, isDriveReady ? driveUploader : undefined);

            } catch (error) {
                console.error("File processing error:", error);
                alert("เกิดข้อผิดพลาดในการส่งไฟล์");
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
        <div className="flex flex-col h-full animate-in fade-in duration-500">
            <div className="flex-1 flex gap-6 overflow-hidden h-full">
                
                {/* Main Chat Area */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden relative">
                    
                    <ChatHeader 
                        isBotEnabled={isBotEnabled} 
                        setIsBotEnabled={setIsBotEnabled} 
                        allUsers={allUsers} 
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

                {/* Right Sidebar */}
                <ChatSidebar 
                    isBotEnabled={isBotEnabled}
                    allUsers={allUsers}
                />
            </div>
        </div>
    );
};

export default TeamChat;
