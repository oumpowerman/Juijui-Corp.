
import { useEffect } from 'react';

/**
 * Hook to handle Android/iOS physical back button or gestures.
 * When the component opens (isOpen = true), it pushes a state to history.
 * When the back button is pressed, it catches the event and calls onClose.
 */
export const useMobileBackHandler = (isOpen: boolean, onClose: () => void) => {
    useEffect(() => {
        if (isOpen) {
            // Generate a unique ID for this specific modal instance
            const stateId = `modal_${Date.now()}`;
            
            // Push a "fake" history state so the back button has something to pop
            window.history.pushState({ modalId: stateId }, '', window.location.href);

            const handlePopState = (event: PopStateEvent) => {
                // If the user pressed back, close the modal
                // This prevents the browser from actually going back to the previous page
                onClose();
            };

            window.addEventListener('popstate', handlePopState);

            return () => {
                window.removeEventListener('popstate', handlePopState);
                
                // Cleanup: If the modal is closed programmatically (e.g. clicking X),
                // we need to remove the "fake" history state we added.
                // We check if the current state is the one we created.
                if (window.history.state?.modalId === stateId) {
                    window.history.back();
                }
            };
        }
    }, [isOpen, onClose]);
};
