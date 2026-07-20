import express from 'express';
import { supabase } from '../../lib/supabase.js';
import { adminApprovalService } from '../../services/adminApprovalService.js';
import { DEFAULT_GAME_CONFIG } from '../../lib/gameLogic.js';
import { updateGameStats } from '../../lib/gamification/gameStats.js';
import { logGameAction } from '../../lib/gamification/gameLogs.js';
import { handleDeathSequence } from '../../lib/gamification/deathSystem.js';
import { toValidUuid } from '../../utils/gamificationUtils.js';

const router = express.Router();

/**
 * Auto-seed LINE_APPROVAL_MODE master config option
 */
async function seedMasterOption() {
    try {
        const { data, error } = await supabase
            .from('master_options')
            .select('id')
            .eq('type', 'WORK_CONFIG')
            .eq('key', 'LINE_APPROVAL_MODE')
            .maybeSingle();

        if (error) {
            console.error('[Seeding] Error checking LINE_APPROVAL_MODE master option:', error);
            return;
        }

        if (!data) {
            console.log('[Seeding] Inserting default LINE_APPROVAL_MODE master option...');
            const { error: insertErr } = await supabase
                .from('master_options')
                .insert({
                    type: 'WORK_CONFIG',
                    key: 'LINE_APPROVAL_MODE',
                    label: 'INTERACTIVE',
                    is_active: true,
                    sort_order: 10,
                    description: 'โหมดปุ่มอนุมัติผ่าน LINE: INTERACTIVE (เปิดปุ่ม) หรือ SIMPLE_NOTIF (ส่งปกติ)'
                });

            if (insertErr) {
                console.error('[Seeding] Error inserting LINE_APPROVAL_MODE:', insertErr);
            } else {
                console.log('[Seeding] Successfully inserted LINE_APPROVAL_MODE option.');
            }
        }
    } catch (err) {
        console.error('[Seeding] Unexpected error during seeding:', err);
    }
}

// Perform initial database seed
seedMasterOption();

/**
 * Helper to fetch and merge game configuration server-side
 */
async function fetchServerGameConfig() {
    try {
        const { data, error } = await supabase
            .from('game_configs')
            .select('*');

        if (error || !data) {
            return DEFAULT_GAME_CONFIG;
        }

        const configMap = data.reduce((acc: any, curr: any) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        return {
            ...DEFAULT_GAME_CONFIG,
            ...configMap
        };
    } catch (err) {
        console.error("Failed to load game config server-side:", err);
        return DEFAULT_GAME_CONFIG;
    }
}

/**
 * Server-side mirror of the processAction hook from useGamification.ts
 */
async function processActionServer(userId: string, action: string, context: any = {}) {
    try {
        const targetId = toValidUuid(context.id || null);
        if (targetId) {
            const { data: existingLog } = await supabase
                .from('game_logs')
                .select('id')
                .eq('user_id', userId)
                .eq('related_id', targetId)
                .maybeSingle();
            
            if (existingLog) {
                console.log(`[Server-Gamification] Action ${action} for ${userId} with key ${targetId} already exists. Skipping.`);
                return null;
            }
        }

        const config = await fetchServerGameConfig();
        const result = await updateGameStats(userId, action as any, context, config);
        
        if (result) {
            await logGameAction(userId, action as any, result, context, result.bonusCoins);
            
            if (result.isDeath) {
                await handleDeathSequence(userId, result.deathCount, result);
            }
        }
        return result;
    } catch (error) {
        console.error("Server Gamification Action Error:", error);
        return null;
    }
}

/**
 * HTTPS Postback endpoint for Line webhook interactive buttons
 */
router.post('/api/admin-approval/line-action', async (req, res) => {
    const authHeader = req.headers.authorization;
    const lineAdminSecret = process.env.LINE_ADMIN_SECRET || 'JUIJUI_SECRET_12345';

    // 1. Authorization Verification
    if (!authHeader || authHeader !== `Bearer ${lineAdminSecret}`) {
        console.warn('[Line-Action API] Unauthorized attempt with header:', authHeader);
        return res.status(401).json({ success: false, error: 'Unauthorized handshake signature' });
    }

    const { action, requestId, requestType, notificationId, adminProfile } = req.body;

    if (!action || !requestId || !requestType || !adminProfile || !adminProfile.id) {
        return res.status(400).json({ success: false, error: 'Missing required request parameters' });
    }

    try {
        console.log(`[Line-Action API] Admin ${adminProfile.full_name} is performing ${action} on request ${requestId}`);

        // 2. Fetch leave request from database
        const { data: reqData, error: reqErr } = await supabase
            .from('leave_requests')
            .select(`
                *,
                profiles:profiles!leave_requests_user_id_fkey (id, full_name, avatar_url, position)
            `)
            .eq('id', requestId)
            .maybeSingle();

        if (reqErr || !reqData) {
            console.error('[Line-Action API] Fetch request error:', reqErr);
            return res.status(404).json({ success: false, error: 'ไม่พบข้อมูลคำขอลาหรือคำขออนุมัติในระบบ' });
        }

        // 3. Double-Submission Prevention: Verify request status is still PENDING
        if (reqData.status !== 'PENDING') {
            const actionVerb = reqData.status === 'APPROVED' ? 'อนุมัติ' : 'ปฏิเสธ';
            const { data: approverProfile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', reqData.approver_id)
                .maybeSingle();
            
            const approverName = approverProfile?.full_name || 'ผู้ดูแลระบบ';
            console.log(`[Line-Action API] Request ${requestId} was already processed. Status: ${reqData.status}`);
            return res.status(400).json({ 
                success: false, 
                error: `คำขอนี้ได้รับการ${actionVerb}แล้วโดยแอดมินคุณ ${approverName} เพื่อความปลอดภัยจึงไม่อนุญาตให้ทำรายการซ้ำซ้อนค่ะ` 
            });
        }

        // 4. Transform DB model to camelCase LeaveRequest model expected by adminApprovalService
        const mappedRequest = {
            id: reqData.id,
            userId: reqData.user_id,
            type: reqData.type,
            startDate: new Date(reqData.start_date),
            endDate: new Date(reqData.end_date),
            reason: reqData.reason,
            attachmentUrl: reqData.attachment_url,
            status: reqData.status,
            approverId: reqData.approver_id,
            createdAt: new Date(reqData.created_at),
            rejectionReason: reqData.rejection_reason,
            user: reqData.profiles ? {
                id: reqData.profiles.id,
                name: reqData.profiles.full_name,
                avatarUrl: reqData.profiles.avatar_url,
                position: reqData.profiles.position
            } : undefined
        };

        // 5. Fetch dependent configuration tables
        const { data: masterOptions } = await supabase.from('master_options').select('*');
        const { data: annualHolidays } = await supabase.from('annual_holidays').select('*');
        const { data: calendarExceptions } = await supabase.from('calendar_exceptions').select('*');

        const currentUser = {
            id: adminProfile.id,
            role: 'ADMIN',
            name: adminProfile.full_name
        };

        // 6. Execute Transaction
        if (action === 'approve') {
            await adminApprovalService.approveLeaveOrCorrectionTransaction({
                request: mappedRequest as any,
                currentUser,
                adminNote: 'อนุมัติคำขอผ่าน LINE Interactive',
                masterOptions: masterOptions || [],
                annualHolidays: annualHolidays || [],
                calendarExceptions: calendarExceptions || [],
                processAction: processActionServer
            });
        } else if (action === 'reject') {
            await adminApprovalService.rejectRequestTransaction({
                id: requestId,
                reason: 'ปฏิเสธคำขอผ่าน LINE Interactive',
                currentUser,
                isDedicatedOtRequest: false,
                targetReq: mappedRequest as any,
                masterOptions: masterOptions || [],
                processAction: processActionServer
            });
        } else {
            return res.status(400).json({ success: false, error: 'Invalid action specified' });
        }

        // 7. Dynamic Feedback (UX) & Double-Submission Prevention: Update all related admin notifications in Supabase
        const actionLabel = action === 'approve' ? 'อนุมัติ' : 'ปฏิเสธ';
        const nowTimeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        const updatedMsg = `[${actionLabel}แล้ว] คำขอลงเวลาแบบจำลอง (${requestType}) ของพนักงาน ${mappedRequest.user?.name || 'พนักงาน'} ได้รับการ${actionLabel}แล้วโดยแอดมินคุณ ${adminProfile.full_name} เมื่อเวลา ${nowTimeStr} น.`;

        await supabase
            .from('notifications')
            .update({
                is_read: true,
                message: updatedMsg,
                title: `✅ ดำเนินการ${actionLabel}เรียบร้อย`
            })
            .eq('related_id', requestId);

        return res.json({ success: true, message: `Successfully ${action}d request ${requestId}` });

    } catch (err: any) {
        console.error('[Line-Action API] Transaction execution failure:', err);
        return res.status(500).json({ success: false, error: `ระบบประมวลผลล้มเหลว: ${err.message}` });
    }
});

export default router;
