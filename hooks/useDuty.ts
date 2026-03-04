
import { useGameConfig } from '../context/GameConfigContext';
import { User } from '../types';
import { useDutyData } from './duty/useDutyData';
import { useDutyActions } from './duty/useDutyActions';
import { useDutySwap } from './duty/useDutySwap';
import { useDutyRandomizer } from './duty/useDutyRandomizer';
import { useDutyProof } from './duty/useDutyProof';
import { useGoogleDrive } from './useGoogleDrive';

export const useDuty = (currentUser?: User) => {
    const { config } = useGameConfig();
    const { uploadFileToDrive, isReady: isDriveReady, isAuthenticated, login } = useGoogleDrive();

    // 1. Data Management
    const { 
        duties, setDuties, configs, swapRequests, isLoading, 
        annualHolidays, calendarExceptions 
    } = useDutyData();

    // 2. Basic Actions
    const { 
        saveConfigs, addDuty, toggleDuty, deleteDuty, 
        cleanupOldDuties, clearFutureDutiesForUser 
    } = useDutyActions(duties, setDuties, config);

    // 3. Swap Logic
    const { requestSwap, respondSwap } = useDutySwap(currentUser, duties);

    // 4. Randomizer Logic
    const { calculateRandomDuties, saveDuties } = useDutyRandomizer(configs, { annualHolidays, calendarExceptions });

    // 5. Proof & Strategy Logic
    const { isUploading: isProofUploading, submitProof, submitAppeal } = useDutyProof(
        currentUser || null, 
        duties, 
        setDuties,
        isDriveReady, 
        uploadFileToDrive, 
        isAuthenticated, 
        login
    );

    return {
        // Data
        duties,
        setDuties,
        configs,
        swapRequests,
        isLoading,
        calendarMetadata: { annualHolidays, calendarExceptions },
        
        // Actions
        saveConfigs,
        addDuty,
        toggleDuty,
        deleteDuty,
        cleanupOldDuties,
        clearFutureDutiesForUser,
        
        // Swap
        requestSwap,
        respondSwap,
        
        // Randomizer
        calculateRandomDuties,
        saveDuties,
        
        // Proof
        submitProof,
        submitAppeal,
        isProofUploading
    };
};
