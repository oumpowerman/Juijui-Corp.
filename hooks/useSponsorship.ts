
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
            showToast('เพิ่มลูกค้าใหม่สำเร็จ 🎉', 'success');
            return newClient;
        } catch (err) {
            console.error('Failed to create client:', err);
            showToast('สร้างลูกค้าไม่สำเร็จ', 'error');
            return null;
        }
    };

    const updateClient = async (clientId: string, clientData: Partial<Client>) => {
        try {
            const updated = await sponsorshipService.updateClient(clientId, clientData);
            await fetchClients();
            showToast('อัปเดตข้อมูลลูกค้าแล้ว ✅', 'success');
            return updated;
        } catch (err) {
            console.error('Failed to update client:', err);
            showToast('แก้ไขข้อมูลลูกค้าไม่สำเร็จ', 'error');
            return null;
        }
    };

    const deleteClient = async (clientId: string) => {
        try {
            await sponsorshipService.deleteClient(clientId);
            await fetchClients();
            showToast('ลบลูกค้าเรียบร้อยแล้ว', 'info');
            return true;
        } catch (err) {
            console.error('Failed to delete client:', err);
            showToast('ลบลูกค้าไม่สำเร็จ', 'error');
            return false;
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
        updateClient,
        deleteClient,
        refreshClients: fetchClients
    };
}
