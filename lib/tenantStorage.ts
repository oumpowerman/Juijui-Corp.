import { PRIMARY_DEFAULT_ORG_ID } from './multiTenantMigrationSql';

export const DEFAULT_ORG_ID = PRIMARY_DEFAULT_ORG_ID;
export { PRIMARY_DEFAULT_ORG_ID };

const ACTIVE_ORG_STORAGE_KEY = 'juijui_active_org_id';
const FORCE_ACTIVE_ORG_SESSION_KEY = 'juijui_force_active_org_id';

/**
 * Returns the explicitly selected/provisioned org ID from sessionStorage or localStorage
 * without falling back to PRIMARY_DEFAULT_ORG_ID when unset.
 */
export const getExplicitActiveOrgIdSync = (): string | null => {
    try {
        if (typeof window !== 'undefined') {
            return (
                sessionStorage.getItem(FORCE_ACTIVE_ORG_SESSION_KEY) ||
                localStorage.getItem(ACTIVE_ORG_STORAGE_KEY) ||
                null
            );
        }
    } catch {
        // Ignore storage errors
    }
    return null;
};

/**
 * Retrieves the currently active organization ID from localStorage fallback
 * when outside React tree (e.g. utility functions).
 */
export const getActiveOrgIdSync = (): string => {
    return getExplicitActiveOrgIdSync() || PRIMARY_DEFAULT_ORG_ID;
};

/**
 * Persists a newly provisioned or explicitly switched organization ID in sessionStorage
 * so it takes top priority over any stale profile.current_org_id during app initialization.
 */
export const setForceActiveOrgIdSync = (orgId: string | null | undefined): void => {
    try {
        if (typeof window !== 'undefined') {
            if (orgId) {
                sessionStorage.setItem(FORCE_ACTIVE_ORG_SESSION_KEY, orgId);
                localStorage.setItem(ACTIVE_ORG_STORAGE_KEY, orgId);
            } else {
                sessionStorage.removeItem(FORCE_ACTIVE_ORG_SESSION_KEY);
            }
        }
    } catch {
        // Ignore storage errors
    }
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
