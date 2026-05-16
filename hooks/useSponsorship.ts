
import { useState, useCallback, useEffect } from 'react';
import { sponsorshipService } from '../services/sponsorshipService';
import { SponsorshipDetail, Client } from '../types/task';
import { useToast } from '../context/ToastContext';

export function useSponsorship(taskId?: string) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);
    const [sponsorship, setSponsorship] = useState<SponsorshipDetail | null>(null);

    const fetchClients = useCallback(async () => {
        setLoading(true);
        try {
            const data = await sponsorshipService.getClients();
            setClients(data);
        } catch (err) {
            console.error('Failed to fetch clients:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchDetails = useCallback(async (id: string) => {
        setLoading(true);
        try {
            const data = await sponsorshipService.getSponsorshipDetail(id);
            setSponsorship(data);
        } catch (err) {
            console.error('Failed to fetch sponsorship details:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const saveDetails = async (id: string, details: Partial<SponsorshipDetail>) => {
        setLoading(true);
        try {
            await sponsorshipService.saveSponsorshipDetail(id, details);
            await fetchDetails(id);
            showToast('บันทึกข้อมูลสปอนเซอร์แล้ว ✅', 'success');
            return true;
        } catch (err) {
            console.error('Failed to save sponsorship details:', err);
            showToast('บันทึกไม่สำเร็จ', 'error');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const deleteDetails = async (id: string) => {
        setLoading(true);
        try {
            await sponsorshipService.deleteSponsorshipDetail(id);
            setSponsorship(null);
            showToast('ลบข้อมูลสปอนเซอร์แล้ว', 'info');
            return true;
        } catch (err) {
            console.error('Failed to delete sponsorship details:', err);
            showToast('ลบไม่สำเร็จ', 'error');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const createClient = async (clientData: Partial<Client>) => {
        try {
            const newClient = await sponsorshipService.createClient(clientData);
            await fetchClients();
            return newClient;
        } catch (err) {
            console.error('Failed to create client:', err);
            showToast('สร้างลูกค้าไม่สำเร็จ', 'error');
            return null;
        }
    };

    useEffect(() => {
        if (taskId) {
            fetchDetails(taskId);
        }
    }, [taskId, fetchDetails]);

    return {
        loading,
        clients,
        sponsorship,
        fetchDetails,
        fetchClients, // Provide manual fetch trigger
        saveDetails,
        deleteDetails,
        createClient,
        refreshClients: fetchClients
    };
}
