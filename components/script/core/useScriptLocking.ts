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
    const lockerUserRef = useRef<LockerUser>(null);
    const lockStatusRef = useRef<LockStatus>('FREE');
    const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        lockerUserRef.current = lockerUser;
        lockStatusRef.current = lockStatus;
    }, [lockerUser, lockStatus]);

    const acquireLock = async (force: boolean = false) => {
        try {
            let query = supabase
                .from('scripts')
                .update({ 
                    locked_by: currentUser.id, 
                    locked_at: new Date().toISOString() 
                })
                .eq('id', scriptId);
            
            if (!force) {
                // Safely update ONLY if locked_by is null or already locked by the current user
                query = query.or(`locked_by.is.null,locked_by.eq.${currentUser.id}`);
            }

            const { data, error } = await query.select('locked_by');
            if (error) throw error;

            // If the query didn't update anything (because someone else locked it in the meantime)
            if (!force && (!data || data.length === 0)) {
                const { data: currentScript } = await supabase
                    .from('scripts')
                    .select('locked_by')
                    .eq('id', scriptId)
                    .single();
                
                if (currentScript && currentScript.locked_by && currentScript.locked_by !== currentUser.id) {
                    setLockStatus('LOCKED_BY_OTHER');
                    const locker = users.find(u => u.id === currentScript.locked_by);
                    setLockerUser(locker ? { id: locker.id, name: locker.name, avatarUrl: locker.avatarUrl || '' } : { id: currentScript.locked_by, name: 'Unknown', avatarUrl: '' });
                    return;
                }
            }

            setLockStatus('LOCKED_BY_ME');
            setLockerUser({ id: currentUser.id, name: currentUser.name, avatarUrl: currentUser.avatarUrl || '' });
        } catch (err) { 
            console.error("Failed to acquire lock:", err); 
        }
    };

    const refreshLock = async () => {
        if (lockStatusRef.current !== 'LOCKED_BY_ME') return;
        await supabase.from('scripts').update({ locked_at: new Date().toISOString() }).eq('id', scriptId).eq('locked_by', currentUser.id);
    };

    const releaseLock = async () => {
        if (lockStatusRef.current === 'LOCKED_BY_ME') {
             await supabase.from('scripts').update({ locked_by: null }).eq('id', scriptId).eq('locked_by', currentUser.id);
        }
    };

    const forceTakeover = async () => {
        const confirmed = await showConfirm(
            `ยืนยันจะแย่งสิทธิ์การแก้ไขจาก ${lockerUser?.name}?`,
            'แย่งสิทธิ์การแก้ไข'
        );
        if (confirmed) {
            await acquireLock(true);
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
                    if (p.user?.id === lockerUserRef.current?.id && lockStatusRef.current === 'LOCKED_BY_OTHER') {
                        console.log("Locker left, clearing ghost lock...");
                        
                        // Select one leader among online viewers to clean up the ghost lock
                        const state = channel.presenceState();
                        const onlineUsers = Object.values(state)
                            .flatMap((presences: any) => presences.map((p: any) => p.user?.id))
                            .filter((id): id is string => !!id && id !== p.user?.id);
                        
                        onlineUsers.sort();
                        const isLeader = onlineUsers.length === 0 || onlineUsers[0] === currentUser.id;
                        
                        if (isLeader) {
                            console.log("This client is designated as cleanup leader.");
                            supabase.from('scripts').update({ locked_by: null }).eq('id', scriptId).eq('locked_by', p.user.id).then(() => {
                                setLockStatus('FREE');
                                setLockerUser(null);
                            });
                        } else {
                            console.log("Another client is handling ghost lock cleanup.");
                        }
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
                    if (lockStatusRef.current === 'LOCKED_BY_OTHER') {
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
                        isLocker: lockStatusRef.current === 'LOCKED_BY_ME'
                    });
                }
            });

        return () => {
            if (lockStatusRef.current === 'LOCKED_BY_ME') {
                supabase.from('scripts').update({ locked_by: null }).eq('id', scriptId).eq('locked_by', currentUser.id).then();
            }
            supabase.removeChannel(channel);
        };
    }, [scriptId, currentUser.id, users]);

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
