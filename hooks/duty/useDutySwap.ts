
import { supabase } from '../../lib/supabase';
import { Duty, User, DutySwap } from '../../types';
import { useToast } from '../../context/ToastContext';
import { format } from 'date-fns';

export const useDutySwap = (currentUser?: User, duties: Duty[] = []) => {
    const { showToast } = useToast();

    const requestSwap = async (ownDutyId: string, targetDutyId: string) => {
        if (!currentUser) return;
        try {
            const ownDuty = duties.find(d => d.id === ownDutyId);
            const targetDuty = duties.find(d => d.id === targetDutyId);

            if (!ownDuty || !targetDuty) throw new Error("ไม่พบข้อมูลเวร");
            if (ownDuty.assigneeId !== currentUser.id) throw new Error("คุณไม่สามารถขอแลกเวรที่ไม่ได้เป็นเจ้าของได้");
            if (ownDuty.isDone) throw new Error("เวรของคุณทำเสร็จแล้ว ไม่สามารถแลกได้");
            if (targetDuty.isDone) throw new Error("เวรเป้าหมายทำเสร็จแล้ว ไม่สามารถแลกได้");
            if (ownDuty.assigneeId === targetDuty.assigneeId) throw new Error("ไม่สามารถแลกเวรกับตัวเองได้");
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (new Date(ownDuty.date) < today) throw new Error("ไม่สามารถแลกเวรที่ผ่านมาแล้วได้");
            if (new Date(targetDuty.date) < today) throw new Error("ไม่สามารถแลกเวรเป้าหมายที่ผ่านมาแล้วได้");

            const { error } = await supabase.from('duty_swaps').insert({
                requestor_id: currentUser.id,
                own_duty_id: ownDutyId,
                target_duty_id: targetDutyId,
                status: 'PENDING'
            });
            if (error) throw error;

            await supabase.from('notifications').insert({
                user_id: targetDuty.assigneeId,
                type: 'APPROVAL_REQ',
                title: '🔄 มีคำขอแลกเวร',
                message: `คุณ ${currentUser.name} ขอแลกเวร "${ownDuty.title}" (${format(new Date(ownDuty.date), 'd MMM')}) กับเวรของคุณ`,
                is_read: false,
                link_path: 'DUTY'
            });

            showToast('ส่งคำขอแลกเวรแล้ว รออีกฝั่งตอบรับนะครับ 🔄', 'success');
        } catch (err: any) {
            showToast('ส่งคำขอไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const respondSwap = async (swapId: string, accept: boolean) => {
        try {
            const { data: swap, error: swapError } = await supabase
                .from('duty_swaps')
                .select('own_duty_id, target_duty_id, requestor_id')
                .eq('id', swapId)
                .single();
            
            if (swapError || !swap) throw new Error("ไม่พบข้อมูลคำขอแลกเวร");

            if (!accept) {
                await supabase.from('duty_swaps').update({ status: 'REJECTED' }).eq('id', swapId);
                await supabase.from('notifications').insert({
                    user_id: swap.requestor_id,
                    type: 'INFO',
                    title: '❌ คำขอแลกเวรถูกปฏิเสธ',
                    message: 'เพื่อนไม่สะดวกแลกเวรในครั้งนี้',
                    is_read: false,
                    link_path: 'DUTY'
                });
                showToast('ปฏิเสธการแลกเวรแล้ว', 'info');
                return;
            }

            // Fetch duties to get current assignees and status
            const { data: dutiesData, error: dutiesError } = await supabase
                .from('duties')
                .select('id, assignee_id, is_done, date')
                .in('id', [swap.own_duty_id, swap.target_duty_id]);
            
            if (dutiesError || !dutiesData || dutiesData.length !== 2) {
                throw new Error("ไม่สามารถดึงข้อมูลเวรทั้งสองรายการได้ กรุณาลองใหม่อีกครั้ง");
            }

            const ownDuty = dutiesData.find(d => d.id === swap.own_duty_id);
            const targetDuty = dutiesData.find(d => d.id === swap.target_duty_id);

            if (!ownDuty || !targetDuty) throw new Error("ข้อมูลเวรไม่ครบถ้วน");

            // Safety Checks at acceptance time
            if (ownDuty.is_done || targetDuty.is_done) {
                throw new Error("ไม่สามารถแลกเวรได้เนื่องจากมีเวรบางรายการทำเสร็จไปแล้ว");
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (new Date(ownDuty.date) < today || new Date(targetDuty.date) < today) {
                throw new Error("ไม่สามารถแลกเวรที่เลยกำหนดเวลาไปแล้วได้");
            }

            // Execute SWAP
            // ownDuty (originally Requestor) -> Target's ID
            // targetDuty (originally Target) -> Requestor's ID
            const [update1, update2] = await Promise.all([
                supabase.from('duties').update({ assignee_id: targetDuty.assignee_id }).eq('id', ownDuty.id),
                supabase.from('duties').update({ assignee_id: ownDuty.assignee_id }).eq('id', targetDuty.id)
            ]);

            if (update1.error) throw update1.error;
            if (update2.error) throw update2.error;

            // Mark swap as approved
            const { error: finalError } = await supabase.from('duty_swaps').update({ status: 'APPROVED' }).eq('id', swapId);
            if (finalError) throw finalError;
            
            await supabase.from('notifications').insert({
                user_id: swap.requestor_id,
                type: 'INFO',
                title: '✅ คำขอแลกเวรสำเร็จ',
                message: 'เวรของคุณถูกสลับเรียบร้อยแล้ว',
                is_read: false,
                link_path: 'DUTY'
            });

            showToast('แลกเวรสำเร็จ! อัปเดตตารางแล้ว ✅', 'success');
        } catch (err: any) {
            console.error('[respondSwap] Error:', err);
            showToast('เกิดข้อผิดพลาด: ' + (err.message || 'ไม่สามารถทำรายการได้'), 'error');
        }
    };

    return {
        requestSwap,
        respondSwap
    };
};
