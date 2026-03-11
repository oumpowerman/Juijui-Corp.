
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

                switch (e.key.toLowerCase()) {
                    // Workspace Group (Numbers)
                    case '1':
                        onNavigate('DASHBOARD');
                        break;
                    case '2':
                        onNavigate('CALENDAR');
                        break;
                    case '3':
                        onNavigate('CHAT');
                        break;
                    case '4':
                        onNavigate('WEEKLY');
                        break;
                    
                    // Production Group (Letters)
                    case 's':
                        onNavigate('SCRIPT_HUB');
                        break;
                    case 'm':
                        onNavigate('MEETINGS');
                        break;
                    case 'c':
                        onNavigate('CHECKLIST');
                        break;
                    case 'k':
                        onNavigate('STOCK');
                        break;

                    // Admin & Management
                    case 'q':
                        onNavigate('QUALITY_GATE');
                        break;
                    case 'g':
                        onNavigate('GOALS');
                        break;
                    case 'd':
                        onNavigate('DUTY');
                        break;

                    // Quick Actions
                    case 'n':
                        e.preventDefault();
                        onAddTask();
                        break;
                    case 'p':
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
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
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
