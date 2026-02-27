
import { useGoogleDriveContext } from '../context/GoogleDriveContext';

export const useGoogleDrive = () => {
    const context = useGoogleDriveContext();
    return context;
};
