import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { User } from '../../../types';

export type LockStatus = 'LOCKED_BY_ME' | 'LOCKED_BY_OTHER' | 'FREE';
export type LockerUser = { id: string; name: string; avatarUrl: string } | null;

interface UseScriptLockingProps {
    scriptId: string;
    currentUser: User;
    users: User[];
    showConfirm: (message: string, title?: string) => Promise<boolean>;
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const useScriptLocking = ({ scriptId, currentUser, users, showConfirm, showToast }: UseScriptLockingProps) => {
    const [lockStatus, setLockStatus] = useState<LockStatus>('FREE');
    const [lockerUser, setLockerUser] = useState<LockerUser>(null);
    const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const acquireLock = async () => {
        try {
            const { error } = await supabase
                .from('scripts')
                .update({ 
                    locked_by: currentUser.id, 
                    locked_at: new Date().toISOString() 
                })
                .eq('id', scriptId);
            if (error) throw error;
            setLockStatus('LOCKED_BY_ME');
            setLockerUser({ id: currentUser.id, name: currentUser.name, avatarUrl: currentUser.avatarUrl || '' });
        } catch (err) { 
            console.error("Failed to acquire lock:", err); 
        }
    };

    const refreshLock = async () => {
        if (lockStatus !== 'LOCKED_BY_ME') return;
        await supabase.from('scripts').update({ locked_at: new Date().toISOString() }).eq('id', scriptId);
    };

    const releaseLock = async () => {
        if (lockStatus === 'LOCKED_BY_ME') {
             await supabase.from('scripts').update({ locked_by: null }).eq('id', scriptId);
        }
    };

    const forceTakeover = async () => {
        const confirmed = await showConfirm(
            `ยืนยันจะแย่งสิทธิ์การแก้ไขจาก ${lockerUser?.name}?`,
            'แย่งสิทธิ์การแก้ไข'
        );
        if (confirmed) {
            await acquireLock();
            showToast('แย่งสิทธิ์การแก้ไขเรียบร้อย 😈', 'success');
        }
    };

    useEffect(() => {
        const checkLock = async () => {
            const { data } = await supabase.from('scripts').select('locked_by, locked_at').eq('id', scriptId).single();
            if (data) {
                if (data.locked_by && data.locked_by !== currentUser.id) {
                    setLockStatus('LOCKED_BY_OTHER');
                    const locker = users.find(u => u.id === data.locked_by);
                    setLockerUser(locker ? { id: locker.id, name: locker.name, avatarUrl: locker.avatarUrl || '' } : { id: data.locked_by, name: 'Unknown', avatarUrl: '' });
                } else {
                    await acquireLock();
                }
            }
        };
        checkLock();

        const channel = supabase.channel(`script-lock-${scriptId}`)
            .on('presence', { event: 'sync' }, () => {
                // Presence sync logic if needed
            })
            .on('presence', { event: 'leave' }, ({ leftPresences }) => {
                // GHOST LOCK CLEANUP
                leftPresences.forEach((p: any) => {
                    if (p.user?.id === lockerUser?.id && lockStatus === 'LOCKED_BY_OTHER') {
                        console.log("Locker left, clearing ghost lock...");
                        supabase.from('scripts').update({ locked_by: null }).eq('id', scriptId).then(() => {
                            setLockStatus('FREE');
                            setLockerUser(null);
                        });
                    }
                });
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'scripts', filter: `id=eq.${scriptId}` }, (payload) => {
                const newLockedBy = payload.new.locked_by;
                if (newLockedBy === currentUser.id) {
                    setLockStatus('LOCKED_BY_ME');
                    setLockerUser({ id: currentUser.id, name: currentUser.name, avatarUrl: currentUser.avatarUrl || '' });
                } else if (newLockedBy === null) {
                    setLockStatus('FREE');
                    setLockerUser(null);
                    if (lockStatus === 'LOCKED_BY_OTHER') {
                        acquireLock();
                        showToast('สิทธิ์การแก้ไขกลับมาว่างแล้ว คุณเริ่มแก้ไขได้เลย', 'info');
                    }
                } else {
                    setLockStatus('LOCKED_BY_OTHER');
                    const locker = users.find(u => u.id === newLockedBy);
                    setLockerUser(locker ? { id: locker.id, name: locker.name, avatarUrl: locker.avatarUrl || '' } : { id: newLockedBy, name: 'Unknown', avatarUrl: '' });
                }
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        user: currentUser,
                        onlineAt: new Date().toISOString(),
                        isLocker: lockStatus === 'LOCKED_BY_ME'
                    });
                }
            });

        return () => { supabase.removeChannel(channel); };
    }, [lockStatus, lockerUser?.id, scriptId, currentUser, users]);

    useEffect(() => {
        if (lockStatus === 'LOCKED_BY_ME') {
            refreshLock();
            heartbeatRef.current = setInterval(refreshLock, 60000);
        } else {
            if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        }
        return () => { if (heartbeatRef.current) clearInterval(heartbeatRef.current); };
    }, [lockStatus]);

    return {
        lockStatus,
        lockerUser,
        acquireLock,
        releaseLock,
        forceTakeover
    };
};
