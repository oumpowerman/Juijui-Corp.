import { useEffect } from 'react';

interface ShortcutsProps {
    handleManualSave: () => void;
    isFindReplaceOpen: boolean;
    setIsFindReplaceOpen: (open: boolean) => void;
    setIsAIOpen: (open: boolean) => void;
    setIsTeleprompterOpen: (open: boolean) => void;
    isChatPreviewOpen: boolean;
    setIsChatPreviewOpen: (open: boolean) => void;
    setShowConfig: (open: boolean) => void;
    setIsMetadataOpen: (open: boolean) => void;
    isFocusMode: boolean;
    setIsFocusMode: (open: boolean) => void;
    handlePrint: () => void;
    setShowShareModal: (open: boolean) => void;
    isCommentsOpen: boolean;
    setIsCommentsOpen: (open: boolean) => void;
}

export const useToolbarShortcuts = ({
    handleManualSave,
    isFindReplaceOpen,
    setIsFindReplaceOpen,
    setIsAIOpen,
    setIsTeleprompterOpen,
    isChatPreviewOpen,
    setIsChatPreviewOpen,
    setShowConfig,
    setIsMetadataOpen,
    isFocusMode,
    setIsFocusMode,
    handlePrint,
    setShowShareModal,
    isCommentsOpen,
    setIsCommentsOpen,
}: ShortcutsProps) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
            const isMod = e.metaKey || e.ctrlKey;
            const isAlt = e.altKey;

            // Save: Ctrl+S (Always allow)
            if (isMod && e.key.toLowerCase() === 's') {
                e.preventDefault();
                handleManualSave();
                return;
            }

            // Find: Ctrl+F
            if (isMod && e.key.toLowerCase() === 'f') {
                e.preventDefault();
                setIsFindReplaceOpen(!isFindReplaceOpen);
                return;
            }

            // Other shortcuts (Only if not in input)
            if (isInput) return;

            if (isAlt) {
                switch (e.key.toLowerCase()) {
                    case 'a': e.preventDefault(); setIsAIOpen(true); break;
                    case 't': e.preventDefault(); setIsTeleprompterOpen(true); break;
                    case 'f': e.preventDefault(); setIsFindReplaceOpen(!isFindReplaceOpen); break;
                    case 'c': e.preventDefault(); setIsChatPreviewOpen(!isChatPreviewOpen); break;
                    case 'k': e.preventDefault(); setShowConfig(true); break;
                    case 'm': e.preventDefault(); setIsMetadataOpen(true); break;
                    case 'z': e.preventDefault(); setIsFocusMode(!isFocusMode); break;
                    case 'p': e.preventDefault(); handlePrint(); break;
                    case 's': e.preventDefault(); setShowShareModal(true); break;
                    case 'n': e.preventDefault(); setIsCommentsOpen(!isCommentsOpen); break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        handleManualSave, handlePrint, isFocusMode, isChatPreviewOpen, isCommentsOpen, isFindReplaceOpen,
        setIsAIOpen, setIsTeleprompterOpen, setIsChatPreviewOpen, setShowConfig, 
        setIsMetadataOpen, setIsFocusMode, setShowShareModal, setIsCommentsOpen, setIsFindReplaceOpen
    ]);
};
