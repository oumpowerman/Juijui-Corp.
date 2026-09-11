import { supabase } from '../../lib/supabase';
import { MasterVersionKey } from './types';

export const updateSystemVersion = async (key: MasterVersionKey): Promise<string | null> => {
    try {
        const now = new Date().toISOString();
        const { error } = await supabase
            .from('system_metadata')
            .upsert({ key, last_updated_at: now }, { onConflict: 'key' });
        
        if (error) throw error;
        return now;
    } catch (e) {
        console.error(`Failed to update system version for ${key}:`, e);
        return null;
    }
};

export const checkAndHealVersions = async (keys: MasterVersionKey[]): Promise<Record<MasterVersionKey, string | undefined>> => {
    try {
        let { data: versionsData, error } = await supabase
            .from('system_metadata')
            .select('key, last_updated_at')
            .in('key', keys);

        if (!error) {
            const missingKeys: MasterVersionKey[] = [];
            for (const k of keys) {
                if (!versionsData?.some(v => v.key === k)) {
                    missingKeys.push(k);
                }
            }

            if (missingKeys.length > 0) {
                console.log('🔧 Master Data: Initializing missing version metadata...', missingKeys);
                for (const key of missingKeys) {
                    await updateSystemVersion(key);
                }
                const { data: healedData } = await supabase
                    .from('system_metadata')
                    .select('key, last_updated_at')
                    .in('key', keys);
                versionsData = healedData;
            }
        }

        const resultMap: Record<string, string | undefined> = {};
        keys.forEach(k => {
            resultMap[k] = versionsData?.find(v => v.key === k)?.last_updated_at;
        });

        return resultMap as Record<MasterVersionKey, string | undefined>;
    } catch (err) {
        console.error('Failed to check and heal master versions:', err);
        return {} as Record<MasterVersionKey, string | undefined>;
    }
};
