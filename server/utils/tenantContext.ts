import { Request } from 'express';
import { serverSupabase } from './supabase.js';

/**
 * Resolves the active Organization ID (Tenant ID) from an incoming Express request.
 * Checks:
 * 1. `x-org-id` request header
 * 2. `req.query.orgId` or `req.query.org_id`
 * 3. `req.body.orgId` or `req.body.org_id`
 * 4. Authenticated user's `profiles.current_org_id` if userId is provided
 */
export async function resolveRequestOrgId(
    req: Request,
    fallbackUserId?: string | null
): Promise<string | null> {
    const headerOrgId = req.headers['x-org-id'];
    if (typeof headerOrgId === 'string' && headerOrgId.trim()) {
        return headerOrgId.trim();
    }

    const queryOrgId = (req.query?.orgId || req.query?.org_id) as string | undefined;
    if (typeof queryOrgId === 'string' && queryOrgId.trim()) {
        return queryOrgId.trim();
    }

    const bodyOrgId = req.body?.orgId || req.body?.org_id;
    if (typeof bodyOrgId === 'string' && bodyOrgId.trim()) {
        return bodyOrgId.trim();
    }

    const userId = fallbackUserId || (req as any).session?.user?.id || (req.query?.userId as string);
    if (userId) {
        try {
            const { data } = await serverSupabase
                .from('profiles')
                .select('current_org_id')
                .eq('id', userId)
                .maybeSingle();
            if (data?.current_org_id) {
                return data.current_org_id;
            }
        } catch {
            // Ignore if current_org_id column is not yet migrated
        }
    }

    return null;
}
