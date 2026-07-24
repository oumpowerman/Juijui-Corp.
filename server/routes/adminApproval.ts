import express from 'express';
import { serverSupabase as supabase } from '../utils/supabase.js';
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
const handleLineAction = async (req: express.Request, res: express.Response) => {
    const authHeader = req.headers.authorization;
    const lineAdminSecret = process.env.LINE_ADMIN_SECRET || 'JUIJUI_SECRET_12345';

    // 1. Authorization Verification
    if (!authHeader || authHeader !== `Bearer ${lineAdminSecret}`) {
        console.warn('[Line-Action API] Unauthorized attempt with header:', authHeader);
        return res.status(401).json({ success: false, error: 'Unauthorized handshake signature' });
    }

    const action = req.body.action;
    const requestId = req.body.requestId || req.body.id;
    const requestType = req.body.requestType || req.body.type || 'WFH';
    const notificationId = req.body.notificationId;
    const adminProfile = req.body.adminProfile;

    if (!action || !requestId || !adminProfile || !adminProfile.id) {
        return res.status(400).json({ success: false, error: 'Missing required request parameters (action, requestId, adminProfile)' });
    }

    try {
        console.log(`[Line-Action API] Admin ${adminProfile.full_name || adminProfile.name} is performing ${action} on request ${requestId}`);

        // 2. Fetch request from database (Check leave_requests first, then ot_requests)
        let { data: leaveReqData } = await supabase
            .from('leave_requests')
            .select('*')
            .eq('id', requestId)
            .maybeSingle();

        let reqData = leaveReqData;
        let isDedicatedOt = false;
        let otReqData: any = null;

        if (reqData && reqData.user_id) {
            const { data: userProf } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, position')
                .eq('id', reqData.user_id)
                .maybeSingle();
            if (userProf) {
                reqData.profiles = userProf;
            }
        }

        if (!reqData) {
            const { data: otData } = await supabase
                .from('ot_requests')
                .select('*')
                .eq('id', requestId)
                .maybeSingle();

            if (otData) {
                isDedicatedOt = true;
                otReqData = otData;
                if (otReqData.user_id) {
                    const { data: userProf } = await supabase
                        .from('profiles')
                        .select('id, full_name, avatar_url, position')
                        .eq('id', otReqData.user_id)
                        .maybeSingle();
                    if (userProf) {
                        otReqData.profiles = userProf;
                    }
                }
            }
        }

        if (!reqData && !otReqData) {
            console.error('[Line-Action API] Request not found in leave_requests or ot_requests:', requestId);
            return res.status(404).json({ success: false, error: 'ไม่พบข้อมูลคำขอลาหรือคำขออนุมัติในระบบ' });
        }

        const currentStatus = isDedicatedOt ? otReqData.status : reqData.status;

        // 3. Double-Submission Prevention: Verify request status is still PENDING
        if (currentStatus !== 'PENDING') {
            const actionVerb = currentStatus === 'APPROVED' ? 'อนุมัติ' : 'ปฏิเสธ';
            const approverId = isDedicatedOt 
                ? (otReqData.approved_by || otReqData.approver_id || otReqData.reviewed_by)
                : (reqData.approved_by || reqData.approver_id || reqData.reviewed_by);

            let approverName = 'ผู้ดูแลระบบ';
            if (approverId) {
                const { data: approverProfile } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', approverId)
                    .maybeSingle();
                if (approverProfile?.full_name) {
                    approverName = approverProfile.full_name;
                }
            }

            console.log(`[Line-Action API] Request ${requestId} was already processed. Status: ${currentStatus}`);
            return res.status(400).json({ 
                success: false, 
                error: `คำขอนี้ได้รับการ${actionVerb}แล้วโดยแอดมินคุณ ${approverName} เพื่อความปลอดภัยจึงไม่อนุญาตให้ทำรายการซ้ำซ้อนค่ะ` 
            });
        }

        // 4. Fetch dependent configuration tables
        const { data: masterOptions } = await supabase.from('master_options').select('*');
        const { data: annualHolidays } = await supabase.from('annual_holidays').select('*');
        const { data: calendarExceptions } = await supabase.from('calendar_exceptions').select('*');

        const currentUser = {
            id: adminProfile.id,
            role: 'ADMIN',
            name: adminProfile.full_name || adminProfile.name
        };

        const targetEmployeeName = isDedicatedOt 
            ? (otReqData.profiles?.full_name || 'พนักงาน')
            : (reqData.profiles?.full_name || 'พนักงาน');

        // Transform dedicated OT request DB model to camelCase format expected by adminApprovalService
        let mappedOtRequest = null;
        if (isDedicatedOt && otReqData) {
            mappedOtRequest = {
                id: otReqData.id,
                userId: otReqData.user_id,
                date: otReqData.date,
                startTime: otReqData.start_time,
                endTime: otReqData.end_time,
                durationHours: otReqData.duration_hours,
                computedPayout: otReqData.computed_payout,
                isFixed: otReqData.is_fixed,
                reason: otReqData.reason,
                status: otReqData.status,
                createdAt: otReqData.created_at ? new Date(otReqData.created_at) : undefined,
                rejectionReason: otReqData.rejection_reason,
                baseSalaryAtTime: otReqData.base_salary_at_time,
                type: otReqData.type,
                user: otReqData.profiles ? {
                    id: otReqData.profiles.id,
                    name: otReqData.profiles.full_name,
                    avatarUrl: otReqData.profiles.avatar_url,
                    position: otReqData.profiles.position
                } : undefined
            };
        }

        // 5. Execute Transaction
        if (isDedicatedOt) {
            if (action === 'approve') {
                await adminApprovalService.approveOtRequestTransaction({
                    otReq: mappedOtRequest,
                    currentUser,
                    adminNote: 'อนุมัติคำขอ OT ผ่าน LINE Interactive',
                    processAction: processActionServer
                });
            } else if (action === 'reject') {
                await adminApprovalService.rejectRequestTransaction({
                    id: requestId,
                    reason: 'ปฏิเสธคำขอ OT ผ่าน LINE Interactive',
                    currentUser,
                    isDedicatedOtRequest: true,
                    otReq: mappedOtRequest,
                    masterOptions: masterOptions || [],
                    processAction: processActionServer
                });
            } else {
                return res.status(400).json({ success: false, error: 'Invalid action specified' });
            }
        } else {
            // Transform DB model to camelCase LeaveRequest model expected by adminApprovalService
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
        }

        // 6. Dynamic Feedback (UX) & Double-Submission Prevention: Update all related admin notifications in Supabase
        const actionLabel = action === 'approve' ? 'อนุมัติ' : 'ปฏิเสธ';
        const nowTimeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        const adminName = adminProfile.full_name || adminProfile.name;
        const updatedMsg = `[${actionLabel}แล้ว] คำขอ (${requestType}) ของพนักงาน ${targetEmployeeName} ได้รับการ${actionLabel}แล้วโดยแอดมินคุณ ${adminName} เมื่อเวลา ${nowTimeStr} น.`;

        await supabase
            .from('notifications')
            .update({
                is_read: true,
                message: updatedMsg,
                title: `✅ ดำเนินการ${actionLabel}เรียบร้อย`
            })
            .eq('related_id', requestId);

        const reqReason = isDedicatedOt 
            ? (otReqData?.reason || otReqData?.title || '-')
            : (reqData?.reason || '-');

        const leaveTypeOpt = masterOptions?.find((o: any) => o.type === 'LEAVE_TYPE' && o.key === reqData?.type);
        const displayRequestType = isDedicatedOt 
            ? 'ขออนุมัติ OT' 
            : (leaveTypeOpt?.label || reqData?.type || requestType || 'คำขอ');

        return res.json({ 
            success: true, 
            message: `ดำเนินการ${actionLabel}คำขอของคุณ ${targetEmployeeName} เรียบร้อยแล้วค่ะ`,
            details: {
                employeeName: targetEmployeeName,
                requestType: displayRequestType,
                reason: reqReason,
                actionLabel: actionLabel,
                adminName: adminName
            }
        });

    } catch (err: any) {
        console.error('[Line-Action API] Transaction execution failure:', err);
        return res.status(500).json({ success: false, error: `ระบบประมวลผลล้มเหลว: ${err.message}` });
    }
};

router.post('/api/admin-approval/line-action', handleLineAction);
router.post('/api/admin-approval/process-line-action', handleLineAction);

export default router;
