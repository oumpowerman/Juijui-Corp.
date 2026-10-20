import { PRIMARY_DEFAULT_ORG_ID } from './multiTenantMigrationSql';

const ACTIVE_ORG_STORAGE_KEY = 'juijui_active_org_id';

/**
 * Retrieves the currently active organization ID from localStorage fallback
 * when outside React tree (e.g. utility functions).
 */
export const getActiveOrgIdSync = (): string => {
    try {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(ACTIVE_ORG_STORAGE_KEY) || PRIMARY_DEFAULT_ORG_ID;
        }
    } catch {
        // Ignore storage errors
    }
    return PRIMARY_DEFAULT_ORG_ID;
};

/**
 * Persists the currently active organization ID for synchronous access.
 */
export const setActiveOrgIdSync = (orgId: string | null | undefined): void => {
    try {
        if (typeof window !== 'undefined') {
            if (orgId) {
                localStorage.setItem(ACTIVE_ORG_STORAGE_KEY, orgId);
            } else {
                localStorage.removeItem(ACTIVE_ORG_STORAGE_KEY);
            }
        }
    } catch {
        // Ignore storage errors
    }
};

/**
 * Scopes a Supabase Storage file path under the active Organization's folder
 * (`orgs/{orgId}/{cleanPath}`) to guarantee zero cross-organization file collisions.
 */
export const getOrgStoragePath = (
    filePath: string,
    orgId?: string | null
): string => {
    const targetOrgId = orgId || getActiveOrgIdSync();
    const cleanPath = filePath.replace(/^\/+/, '');
    if (cleanPath.startsWith(`orgs/${targetOrgId}/`)) {
        return cleanPath;
    }
    return `orgs/${targetOrgId}/${cleanPath}`;
};

/**
 * Generates an Organization-isolated Supabase Realtime channel name.
 */
export const getOrgChannelName = (
    baseChannel: string,
    orgId?: string | null
): string => {
    const targetOrgId = orgId || getActiveOrgIdSync();
    return `${baseChannel}:org:${targetOrgId}`;
};

/**
 * Builds a Postgres Changes filter string scoped to `org_id=eq.{orgId}`.
 */
export const getOrgRealtimeFilter = (
    orgId?: string | null
): string => {
    const targetOrgId = orgId || getActiveOrgIdSync();
    return `org_id=eq.${targetOrgId}`;
};
