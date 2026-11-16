-- ============================================================================
-- Migration: Sanitize Legacy Nested Check-Out Tags & Stuck PENDING_VERIFY Logs
-- Description:
--   1. Strips leftover provisional/pending tags when the corresponding request
--      has already been approved/rejected (or has no matching PENDING request).
--   2. Repairs broken nested double closing brackets (`]]`) and empty `[REASON: ]`.
--   3. Recalculates `status` for attendance_logs stuck in `PENDING_VERIFY`
--      after all provisional requests were already resolved.
-- Multi-tenant safe: scoped per row `(org_id, user_id, date)`.
-- ============================================================================

DO $$
DECLARE
    rec RECORD;
    v_note TEXT;
    v_has_pending_in BOOLEAN;
    v_has_pending_out BOOLEAN;
    v_has_pending_checkout BOOLEAN;
    v_has_any_unresolved BOOLEAN;
    v_new_status TEXT;
BEGIN
    FOR rec IN
        SELECT
            al.id,
            al.org_id,
            al.user_id,
            al.date,
            al.status,
            al.check_in_time,
            al.check_out_time,
            COALESCE(al.note, '') AS note
        FROM public.attendance_logs al
        WHERE
            al.status = 'PENDING_VERIFY'
            OR al.note LIKE '%]]%'
            OR al.note LIKE '%[GPS_SPOOF_OUT_PENDING]%'
            OR al.note LIKE '%[PROVISIONAL_GPS_SPOOF_OUT]%'
            OR al.note LIKE '%[GPS_SPOOF_APPEAL_PENDING]%'
            OR al.note LIKE '%[PROVISIONAL_GPS_SPOOF_APPEAL]%'
            OR al.note LIKE '%[PROVISIONAL_CHECKOUT]%'
    LOOP
        v_note := rec.note;

        -- Check if there are genuinely still PENDING leave_requests for this user & date in the same org
        SELECT EXISTS (
            SELECT 1 FROM public.leave_requests lr
            WHERE lr.org_id = rec.org_id
              AND lr.user_id = rec.user_id
              AND lr.start_date <= rec.date
              AND lr.end_date >= rec.date
              AND lr.type = 'GPS_SPOOF_APPEAL'
              AND lr.status = 'PENDING'
        ) INTO v_has_pending_in;

        SELECT EXISTS (
            SELECT 1 FROM public.leave_requests lr
            WHERE lr.org_id = rec.org_id
              AND lr.user_id = rec.user_id
              AND lr.start_date <= rec.date
              AND lr.end_date >= rec.date
              AND lr.type = 'GPS_SPOOF_OUT_APPEAL'
              AND lr.status = 'PENDING'
        ) INTO v_has_pending_out;

        SELECT EXISTS (
            SELECT 1 FROM public.leave_requests lr
            WHERE lr.org_id = rec.org_id
              AND lr.user_id = rec.user_id
              AND lr.start_date <= rec.date
              AND lr.end_date >= rec.date
              AND lr.type IN ('FORGOT_CHECKOUT', 'OUT_OF_RANGE_CHECKOUT', 'EARLY_LEAVE')
              AND lr.status = 'PENDING'
        ) INTO v_has_pending_checkout;

        -- 1. Scrub GPS Check-In pending tags if resolved in note OR no PENDING request exists while resolved tags appear
        IF (
            v_note LIKE '%[APPROVED GPS_SPOOF_APPEAL]%'
            OR v_note LIKE '%[REJECTED GPS_SPOOF_APPEAL]%'
            OR v_note LIKE '%[REJECTED_GPS_SPOOF_APPEAL]%'
        ) AND NOT v_has_pending_in THEN
            v_note := regexp_replace(v_note, '\[PROVISIONAL_GPS_SPOOF_APPEAL\]', '', 'g');
            v_note := regexp_replace(v_note, '\[GPS_SPOOF_APPEAL_PENDING\]', '', 'g');
        END IF;

        -- 2. Scrub GPS Check-Out pending tags if resolved in note OR no PENDING GPS_SPOOF_OUT_APPEAL exists
        IF (
            v_note LIKE '%[APPROVED GPS_SPOOF_OUT]%'
            OR v_note LIKE '%[REJECTED GPS_SPOOF_OUT]%'
            OR v_note LIKE '%[REJECTED_GPS_SPOOF_OUT]%'
            OR (NOT v_has_pending_out AND (
                v_note LIKE '%[APPROVED GPS_SPOOF_APPEAL]%'
                OR EXISTS (
                    SELECT 1 FROM public.leave_requests lr
                    WHERE lr.org_id = rec.org_id
                      AND lr.user_id = rec.user_id
                      AND lr.start_date <= rec.date
                      AND lr.end_date >= rec.date
                      AND lr.type = 'GPS_SPOOF_OUT_APPEAL'
                      AND lr.status IN ('APPROVED', 'REJECTED')
                )
            ))
        ) THEN
            v_note := regexp_replace(v_note, '\[PROVISIONAL_GPS_SPOOF_OUT\]', '', 'g');
            v_note := regexp_replace(v_note, '\[GPS_SPOOF_OUT_PENDING\]', '', 'g');
        END IF;

        -- 3. Scrub resolved provisional checkout tags
        IF (
            v_note LIKE '%[APPROVED FORGOT_CHECKOUT]%'
            OR v_note LIKE '%[APPROVED OUT_OF_RANGE_CHECKOUT]%'
            OR v_note LIKE '%[APPROVED EARLY_LEAVE_APPEAL]%'
            OR v_note LIKE '%[APPROVED EARLY_LEAVE]%'
            OR v_note LIKE '%[APPROVED FORGOT_BOTH]%'
            OR v_note LIKE '%[REJECTED FORGOT_CHECKOUT]%'
            OR v_note LIKE '%[REJECTED OUT_OF_RANGE_CHECKOUT]%'
            OR v_note LIKE '%[REJECTED EARLY_LEAVE_APPEAL]%'
            OR v_note LIKE '%[REJECTED FORGOT_BOTH]%'
            OR v_note LIKE '%[ACCEPT_PENALTY]%'
        ) AND NOT v_has_pending_checkout THEN
            v_note := regexp_replace(v_note, '\[PROVISIONAL_CHECKOUT\]', '', 'g');
            v_note := regexp_replace(v_note, '\[FORGOT_CHECKOUT_PENDING\]', '', 'g');
            v_note := regexp_replace(v_note, '\[EARLY_LEAVE_PENDING\]', '', 'g');
            v_note := regexp_replace(v_note, '\[OUT_OF_RANGE_CHECKOUT_PENDING\]', '', 'g');
        END IF;

        -- 4. Repair corrupted nested brackets (`]]`), empty `[REASON: ]`, and extra spaces
        v_note := regexp_replace(v_note, '\[REASON:\s*\]', '', 'gi');
        v_note := regexp_replace(v_note, '\]\]+', ']', 'g');
        v_note := regexp_replace(v_note, '\[\s*\]', '', 'g');
        v_note := regexp_replace(v_note, '(^|\s|\|)\]+(\s|\||$)', '\1\2', 'g');
        v_note := regexp_replace(v_note, '(^|\s|\|)\]+(\s|\||$)', '\1\2', 'g');
        v_note := regexp_replace(v_note, '\|\s*\|', '|', 'g');
        v_note := regexp_replace(v_note, '^\s*\|\s*|\s*\|\s*$', '', 'g');
        v_note := trim(regexp_replace(v_note, '\s+', ' ', 'g'));

        -- 5. Recalculate status if log was stuck in PENDING_VERIFY
        v_new_status := rec.status;
        IF rec.status = 'PENDING_VERIFY' THEN
            v_has_any_unresolved := (
                (v_note LIKE '%[PROVISIONAL_FORGOT_CHECKIN]%' AND v_note NOT LIKE '%[APPROVED FORGOT_CHECKIN]%' AND v_note NOT LIKE '%[REJECTED FORGOT_CHECKIN]%')
                OR (v_note LIKE '%[FORGOT_CHECKIN_PENDING]%' AND v_note NOT LIKE '%[APPROVED FORGOT_CHECKIN]%' AND v_note NOT LIKE '%[REJECTED FORGOT_CHECKIN]%')
                OR (v_note LIKE '%[FORGOT_BOTH_PENDING]%' AND v_note NOT LIKE '%[APPROVED FORGOT_BOTH]%' AND v_note NOT LIKE '%[REJECTED FORGOT_BOTH]%')
                OR (v_note LIKE '%[PROVISIONAL_LATE_ENTRY]%' AND v_note NOT LIKE '%[APPROVED LATE_ENTRY]%' AND v_note NOT LIKE '%[REJECTED LATE_ENTRY]%')
                OR (v_note LIKE '%[LATE_ENTRY_PENDING]%' AND v_note NOT LIKE '%[APPROVED LATE_ENTRY]%' AND v_note NOT LIKE '%[REJECTED LATE_ENTRY]%')
                OR (v_note LIKE '%[PROVISIONAL_WFH]%' AND v_note NOT LIKE '%[APPROVED WFH]%' AND v_note NOT LIKE '%[REJECTED WFH]%' AND v_note NOT LIKE '%[REJECTED_WFH]%')
                OR (v_note LIKE '%[PROVISIONAL_ONSITE]%' AND v_note NOT LIKE '%[APPROVED ONSITE]%' AND v_note NOT LIKE '%[REJECTED ONSITE]%' AND v_note NOT LIKE '%[REJECTED_ONSITE]%')
                OR ((v_note LIKE '%[PROVISIONAL_GPS_SPOOF_APPEAL]%' OR v_note LIKE '%[GPS_SPOOF_APPEAL_PENDING]%') AND v_note NOT LIKE '%[APPROVED GPS_SPOOF_APPEAL]%' AND v_note NOT LIKE '%[REJECTED GPS_SPOOF_APPEAL]%' AND v_note NOT LIKE '%[REJECTED_GPS_SPOOF_APPEAL]%')
                OR ((v_note LIKE '%[PROVISIONAL_GPS_SPOOF_OUT]%' OR v_note LIKE '%[GPS_SPOOF_OUT_PENDING]%') AND v_note NOT LIKE '%[APPROVED GPS_SPOOF_OUT]%' AND v_note NOT LIKE '%[REJECTED GPS_SPOOF_OUT]%' AND v_note NOT LIKE '%[REJECTED_GPS_SPOOF_OUT]%')
                OR (v_note LIKE '%[PROVISIONAL_CHECKOUT]%' AND v_has_pending_checkout)
                OR (v_note LIKE '%[APPEAL_PENDING]%' AND v_note NOT LIKE '%[APPROVED %' AND v_note NOT LIKE '%[REJECTED %')
            );

            IF NOT v_has_any_unresolved THEN
                IF (
                    (v_note LIKE '%[REJECTED GPS_SPOOF_APPEAL]%' OR v_note LIKE '%[REJECTED_GPS_SPOOF_APPEAL]%') AND v_note NOT LIKE '%[APPROVED GPS_SPOOF_APPEAL]%'
                ) OR (
                    (v_note LIKE '%[REJECTED GPS_SPOOF_OUT]%' OR v_note LIKE '%[REJECTED_GPS_SPOOF_OUT]%') AND v_note NOT LIKE '%[APPROVED GPS_SPOOF_OUT]%'
                ) OR (
                    v_note LIKE '%[REJECTED FORGOT_CHECKIN]%' AND v_note NOT LIKE '%[APPROVED FORGOT_CHECKIN]%'
                ) OR (
                    v_note LIKE '%[REJECTED OUT_OF_RANGE_CHECKOUT]%' AND v_note NOT LIKE '%[APPROVED OUT_OF_RANGE_CHECKOUT]%'
                ) OR (
                    v_note LIKE '%[REJECTED FORGOT_CHECKOUT]%' AND v_note NOT LIKE '%[APPROVED FORGOT_CHECKOUT]%'
                ) THEN
                    v_new_status := 'ACTION_REQUIRED';
                ELSIF rec.check_in_time IS NOT NULL AND rec.check_out_time IS NOT NULL THEN
                    IF v_note LIKE '%[APPROVED LATE_ENTRY]%' OR v_note LIKE '%[LATE]%' THEN
                        v_new_status := 'LATE';
                    ELSE
                        v_new_status := 'COMPLETED';
                    END IF;
                ELSIF rec.check_in_time IS NOT NULL THEN
                    v_new_status := 'WORKING';
                END IF;
            END IF;
        END IF;

        IF v_note IS DISTINCT FROM rec.note OR v_new_status IS DISTINCT FROM rec.status THEN
            UPDATE public.attendance_logs
            SET
                note = v_note,
                status = v_new_status
            WHERE id = rec.id;
        END IF;
    END LOOP;
END $$;
