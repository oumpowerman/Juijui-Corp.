import { Channel } from '../../types';

/**
 * Resolves a single channel token (ID, code, name, or alias) to a valid channel ID.
 * Supports case-insensitivity, trimmed strings, and normalized names (without spaces/hyphens/underscores).
 */
export const resolveChannelToken = (token: string, channels: Channel[]): string | null => {
  const clean = token.trim();
  if (!clean) return null;

  const lower = clean.toLowerCase();

  // 1. Unassigned / None keywords
  if (
    lower === 'unassigned' ||
    lower === 'no_channel' ||
    lower === 'no-channel' ||
    lower === 'none' ||
    clean === 'NO_CHANNEL'
  ) {
    return 'NO_CHANNEL';
  }

  // 2. Exact or lowercase ID match
  const byId = channels.find(c => c.id === clean || c.id.toLowerCase() === lower);
  if (byId) return byId.id;

  // 3. Code match (e.g., 'JJ', 'DE')
  const byCode = channels.find(c => c.code && c.code.toLowerCase() === lower);
  if (byCode) return byCode.id;

  // 4. Exact Name match (case-insensitive)
  const byName = channels.find(c => c.name.toLowerCase() === lower);
  if (byName) return byName.id;

  // 5. Normalized Name match (removes whitespace, underscores, hyphens)
  // e.g. "DramaEveryday" matches "Drama Everyday"
  const normToken = lower.replace(/[\s_\-]+/g, '');
  const byNormName = channels.find(
    c => c.name.toLowerCase().replace(/[\s_\-]+/g, '') === normToken
  );
  if (byNormName) return byNormName.id;

  return null;
};

/**
 * Parses raw channels query parameter (from ?channels=... or ?channel=...)
 * Returns resolved IDs, an indicator if any tokens could not be resolved, and raw tokens.
 */
export const parseChannelTokens = (
  rawParam: string,
  channels: Channel[]
): { resolvedIds: string[]; hasUnresolved: boolean; rawTokens: string[] } => {
  const rawTokens = rawParam
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

  const resolvedIds: string[] = [];
  let hasUnresolved = false;

  for (const token of rawTokens) {
    if (token.toLowerCase() === 'all') {
      continue;
    }
    const resolved = resolveChannelToken(token, channels);
    if (resolved) {
      if (!resolvedIds.includes(resolved)) {
        resolvedIds.push(resolved);
      }
    } else {
      hasUnresolved = true;
    }
  }

  return { resolvedIds, hasUnresolved, rawTokens };
};

/**
 * Safely copies text to clipboard with fallback for non-secure contexts.
 */
export const copyTextToClipboard = async (text: string): Promise<boolean> => {
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      console.warn('[deepLinkUtils] navigator.clipboard failed, attempting fallback:', e);
    }
  }

  // Fallback for older browsers or restricted iframe contexts
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    return successful;
  } catch (err) {
    console.error('[deepLinkUtils] execCommand fallback failed:', err);
    return false;
  }
};
