
import React, { createContext, useContext, useState, useCallback } from 'react';

type DialogType = 'alert' | 'confirm' | 'success' | 'error';

interface DialogState {
    isOpen: boolean;
    type: DialogType;
    title?: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
}

interface GlobalDialogContextType {
    dialogState: DialogState;
    showAlert: (message: string, title?: string) => Promise<void>;
    showConfirm: (message: string, title?: string) => Promise<boolean>;
    closeDialog: () => void;
}

const GlobalDialogContext = createContext<GlobalDialogContextType | undefined>(undefined);

export const GlobalDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [dialogState, setDialogState] = useState<DialogState>({
        isOpen: false,
        type: 'alert',
        message: '',
    });

    const closeDialog = useCallback(() => {
        setDialogState(prev => ({ ...prev, isOpen: false }));
    }, []);

    const showAlert = useCallback((message: string, title?: string) => {
        return new Promise<void>((resolve) => {
            setDialogState({
                isOpen: true,
                type: 'alert',
                title: title || 'แจ้งเตือน',
                message,
                onConfirm: () => {
                    resolve();
                    setDialogState(prev => ({ ...prev, isOpen: false }));
                },
            });
        });
    }, []);

    const showConfirm = useCallback((message: string, title?: string) => {
        return new Promise<boolean>((resolve) => {
            setDialogState({
                isOpen: true,
                type: 'confirm',
                title: title || 'ยืนยันการทำรายการ?',
                message,
                onConfirm: () => {
                    resolve(true);
                    setDialogState(prev => ({ ...prev, isOpen: false }));
                },
                onCancel: () => {
                    resolve(false);
                    setDialogState(prev => ({ ...prev, isOpen: false }));
                },
            });
        });
    }, []);

    return (
        <GlobalDialogContext.Provider value={{ dialogState, showAlert, showConfirm, closeDialog }}>
            {children}
        </GlobalDialogContext.Provider>
    );
};

export const useGlobalDialog = () => {
    const context = useContext(GlobalDialogContext);
    if (!context) {
        throw new Error('useGlobalDialog must be used within a GlobalDialogProvider');
    }
    return context;
};
