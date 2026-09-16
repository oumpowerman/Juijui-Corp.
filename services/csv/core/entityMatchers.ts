import { UserProfile, Channel, MasterDataOption } from '../../../types';

/**
 * Fuzzy entity matching and resolving functions for Users, Channels, and Master Options.
 */

/**
 * Resolves a UserProfile from user input (Display name, nickname, email, or id) using exact and fuzzy matching.
 */
export const findUserByName = (input: string, users: UserProfile[]): UserProfile | null => {
    if (!input || !users || users.length === 0) return null;
    const clean = input.trim().toLowerCase();

    // Direct ID match
    const byId = users.find(u => u.id.toLowerCase() === clean);
    if (byId) return byId;

    // Direct email match
    const byEmail = users.find(u => u.email?.toLowerCase() === clean);
    if (byEmail) return byEmail;

    // Full name match (first_name + last_name)
    const byFullName = users.find(u => {
        const full = `${u.first_name || ''} ${u.last_name || ''}`.trim().toLowerCase();
        return full && full === clean;
    });
    if (byFullName) return byFullName;

    // Name match
    const byName = users.find(u => u.name?.toLowerCase() === clean);
    if (byName) return byName;

    // Nickname match
    const byNickname = users.find(u => u.nickname?.toLowerCase() === clean);
    if (byNickname) return byNickname;

    // Fuzzy partial contains match
    const partial = users.find(u => {
        const full = `${u.first_name || ''} ${u.last_name || ''} ${u.name || ''} ${u.nickname || ''}`.toLowerCase();
        return full.includes(clean) || clean.includes((u.nickname || '___').toLowerCase());
    });
    return partial || null;
};

/**
 * Resolves a Channel from channel name, id, or slug.
 */
export const findChannelByName = (input: string, channels: Channel[]): Channel | null => {
    if (!input || !channels || channels.length === 0) return null;
    const clean = input.trim().toLowerCase();

    // Direct ID match
    const byId = channels.find(c => c.id.toLowerCase() === clean);
    if (byId) return byId;

    // Direct Name match
    const byName = channels.find(c => c.name?.toLowerCase() === clean);
    if (byName) return byName;

    // Partial contains match
    const partial = channels.find(c => c.name?.toLowerCase().includes(clean) || clean.includes(c.name?.toLowerCase()));
    return partial || null;
};

/**
 * Resolves a Master Data option key based on label or key match.
 */
export const findMasterKey = (input: string, options: MasterDataOption[]): string | null => {
    if (!input || !options || options.length === 0) return null;
    const clean = input.trim().toLowerCase();

    // Direct key match
    const byKey = options.find(o => o.key.toLowerCase() === clean);
    if (byKey) return byKey.key;

    // Direct label match
    const byLabel = options.find(o => o.label.toLowerCase() === clean);
    if (byLabel) return byLabel.key;

    // Partial label match
    const partial = options.find(o => o.label.toLowerCase().includes(clean) || clean.includes(o.label.toLowerCase()));
    return partial ? partial.key : null;
};
