
import React, { useEffect } from 'react';
import { ViewMode } from '../../types';

interface ShortcutManagerProps {
    onNavigate: (view: ViewMode) => void;
    onAddTask: () => void;
    onOpenProfile: () => void;
    onOpenCommandPalette: () => void;
}

const ShortcutManager: React.FC<ShortcutManagerProps> = ({ 
    onNavigate, 
    onAddTask, 
    onOpenProfile,
    onOpenCommandPalette
}) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Use Alt key for shortcuts to avoid browser conflicts
            if (e.altKey) {
                // Prevent default for handled shortcuts
                const handled = true;

                switch (e.code) {
                    // Workspace Group (Numbers)
                    case 'Digit1':
                        onNavigate('DASHBOARD');
                        break;
                    case 'Digit2':
                        onNavigate('CALENDAR');
                        break;
                    case 'Digit3':
                        onNavigate('CHAT');
                        break;
                    case 'Digit4':
                        onNavigate('WEEKLY');
                        break;
                    
                    // Production Group (Letters)
                    case 'KeyS':
                        onNavigate('SCRIPT_HUB');
                        break;
                    case 'KeyM':
                        onNavigate('MEETINGS');
                        break;
                    case 'KeyC':
                        onNavigate('CHECKLIST');
                        break;
                    case 'KeyK':
                        onNavigate('STOCK');
                        break;

                    // Admin & Management
                    case 'KeyQ':
                        onNavigate('QUALITY_GATE');
                        break;
                    case 'KeyG':
                        onNavigate('GOALS');
                        break;
                    case 'KeyD':
                        onNavigate('DUTY');
                        break;

                    // Quick Actions
                    case 'KeyN':
                        e.preventDefault();
                        onAddTask();
                        break;
                    case 'KeyP':
                        e.preventDefault();
                        onOpenProfile();
                        break;
                    
                    default:
                        // Not a handled shortcut
                        return;
                }

                if (handled) {
                    e.preventDefault();
                }
            }

            // Keep existing Ctrl/Cmd + K for Command Palette
            if ((e.metaKey || e.ctrlKey) && e.code === 'KeyK') {
                e.preventDefault();
                onOpenCommandPalette();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onNavigate, onAddTask, onOpenProfile, onOpenCommandPalette]);

    // This component doesn't render anything
    return null;
};

export default ShortcutManager;
