import { useState } from 'react';

export const useScriptUI = () => {
    const [isTeleprompterOpen, setIsTeleprompterOpen] = useState(false);
    const [isChatPreviewOpen, setIsChatPreviewOpen] = useState(false);
    const [isAIOpen, setIsAIOpen] = useState(false);
    const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);
    const [isMetadataOpen, setIsMetadataOpen] = useState(false);
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
    
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [isAutoCharacter, setIsAutoCharacter] = useState(false);
    
    const [isGenerating, setIsGenerating] = useState(false);

    return {
        isTeleprompterOpen, setIsTeleprompterOpen,
        isChatPreviewOpen, setIsChatPreviewOpen,
        isAIOpen, setIsAIOpen,
        isFindReplaceOpen, setIsFindReplaceOpen,
        isMetadataOpen, setIsMetadataOpen,
        isCommentsOpen, setIsCommentsOpen,
        activeCommentId, setActiveCommentId,
        isFocusMode, setIsFocusMode,
        isAutoCharacter, setIsAutoCharacter,
        isGenerating, setIsGenerating
    };
};
