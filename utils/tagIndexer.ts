import { createClient } from '@supabase/supabase-js';

// Access Environment variables for Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ajkycqazreebczqjsfpv.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqa3ljcWF6cmVlYmN6cWpzZnB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0OTM5MjMsImV4cCI6MjA4NDA2OTkyM30.VscG53hy5tT5_oT297RECiVzaCcCw51AYWQeme_PDRo';

const isMock = !process.env.VITE_SUPABASE_URL && !process.env.REACT_APP_SUPABASE_URL && !process.env.SUPABASE_URL;

let supabaseClient: any = null;
if (!isMock) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
}

// Enterprise Tag Struct for fast mapping
export interface TagIndexEntry {
    name: string;
    count: number;
}

// In-Memory Index cache for lightning-fast sub-millisecond retrieval (Enterprise design pattern)
class EnterpriseTagIndex {
    private cache: TagIndexEntry[] = [];
    private lastRefreshed = 0;
    private refreshIntervalMs = 60 * 1000; // Refresh every 1 minute
    private defaultTags: TagIndexEntry[] = [];

    /**
     * Rebuild index by querying Supabase contents or falling back to in-memory datasets
     */
    public async rebuildIndex(): Promise<void> {
        try {
            if (isMock || !supabaseClient) {
                this.cache = [];
                this.lastRefreshed = Date.now();
                return;
            }

            console.log('[TagIndex] Querying Supabase for tag indexing...');
            // Fetch contents tags from Supabase for index processing (since tags are stored in contents)
            const { data, error } = await supabaseClient
                .from('contents')
                .select('tags')
                .limit(2000); // Index top latest contents for preview scalability

            if (error) throw error;

            if (data && Array.isArray(data)) {
                const counts: Record<string, number> = {};
                data.forEach((row: any) => {
                    const tags = row.tags;
                    if (Array.isArray(tags)) {
                        tags.forEach((tag: string) => {
                            const trimmed = tag?.trim();
                            if (trimmed) {
                                counts[trimmed] = (counts[trimmed] || 0) + 1;
                            }
                        });
                    }
                });

                this.cache = Object.entries(counts)
                    .map(([name, count]) => ({ name, count }))
                    .sort((a, b) => b.count - a.count);
            } else {
                this.cache = [];
            }

            this.lastRefreshed = Date.now();
        } catch (err) {
            console.error('[TagIndex] Failed to rebuild tag index:', err);
            this.cache = [];
            this.lastRefreshed = Date.now();
        }
    }

    /**
     * Fast prefix & substring matching for tag autocomplete
     */
    public async searchTags(query: string, limit: number = 12): Promise<TagIndexEntry[]> {
        // Run index builder if cache is stale or empty
        if (this.cache.length === 0 || Date.now() - this.lastRefreshed > this.refreshIntervalMs) {
            await this.rebuildIndex();
        }

        const cleanQuery = query.toLowerCase().trim().replace(/^#/, '');

        if (!cleanQuery) {
            return this.cache.slice(0, limit);
        }

        const filtered = this.cache.filter(tag => tag.name.toLowerCase().includes(cleanQuery));

        const sorted = [...filtered].sort((a, b) => {
            const aName = a.name.toLowerCase();
            const bName = b.name.toLowerCase();
            const aStarts = aName.startsWith(cleanQuery);
            const bStarts = bName.startsWith(cleanQuery);
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            return b.count - a.count;
        });

        return sorted.slice(0, limit);
    }

    /**
     * Sync method allowing clients to notify tag changes for real-time reactivity
     */
    public notifyUpdate() {
        this.lastRefreshed = 0; // Trigger index rebuild on next request
    }
}

export const tagIndexService = new EnterpriseTagIndex();

export async function getTopTags(
    limit: number = 10,
    filters?: {
        status?: string;
        channelId?: string;
        format?: string;
        pillarId?: string;
        categoryId?: string;
        contentSubTab?: string;
        showStockOnly?: string;
    },
    queryStr: string = ''
): Promise<Array<{ name: string; count: number }>> {
    if (isMock || !supabaseClient) {
        return [];
    }

    try {
        let query = supabaseClient.from('contents').select('tags, status, channel_id, pillar, category, content_formats, is_unscheduled');

        // Apply filters
        if (filters?.status) {
            const statusVals = filters.status.split(',').map(s => s.trim()).filter(Boolean);
            if (statusVals.length > 0) {
                query = query.in('status', statusVals);
            }
        }
        if (filters?.channelId) {
            const channelVals = filters.channelId.split(',').map(s => s.trim()).filter(Boolean);
            if (channelVals.length > 0) {
                query = query.in('channel_id', channelVals);
            }
        }
        if (filters?.pillarId) {
            const pillarVals = filters.pillarId.split(',').map(s => s.trim()).filter(Boolean);
            if (pillarVals.length > 0) {
                query = query.in('pillar', pillarVals);
            }
        }
        if (filters?.categoryId) {
            const categoryVals = filters.categoryId.split(',').map(s => s.trim()).filter(Boolean);
            if (categoryVals.length > 0) {
                query = query.in('category', categoryVals);
            }
        }
        if (filters?.format) {
            const formatVals = filters.format.split(',').map(s => s.trim()).filter(Boolean);
            if (formatVals.length > 0) {
                query = query.overlaps('content_formats', formatVals);
            }
        }
        
        // Active vs Archive Status Filtering
        if (filters?.contentSubTab === 'ARCHIVE') {
            query = query.or('status.ilike.%done%,status.ilike.%publish%,status.ilike.%posted%,status.ilike.%complete%,status.ilike.%success%');
        } else if (filters?.contentSubTab === 'ACTIVE') {
            query = query
                .not('status', 'ilike', '%done%')
                .not('status', 'ilike', '%publish%')
                .not('status', 'ilike', '%posted%')
                .not('status', 'ilike', '%complete%')
                .not('status', 'ilike', '%success%');
        }

        if (filters?.showStockOnly === 'true') {
            query = query.eq('is_unscheduled', true);
        }

        const { data, error } = await query.limit(2000);
        if (error) throw error;

        const counts: Record<string, number> = {};
        if (data && Array.isArray(data)) {
            data.forEach((row: any) => {
                const tags = row.tags;
                if (Array.isArray(tags)) {
                    tags.forEach((tag: string) => {
                        const trimmed = tag?.trim();
                        if (trimmed) {
                            counts[trimmed] = (counts[trimmed] || 0) + 1;
                        }
                    });
                }
            });
        }

        let filtered = Object.entries(counts)
            .map(([name, count]) => ({ name, count }));

        const cleanQuery = queryStr.toLowerCase().trim().replace(/^#/, '');
        if (cleanQuery) {
            filtered = filtered.filter(tag => tag.name.toLowerCase().includes(cleanQuery));
            filtered.sort((a, b) => {
                const aName = a.name.toLowerCase();
                const bName = b.name.toLowerCase();
                const aStarts = aName.startsWith(cleanQuery);
                const bStarts = bName.startsWith(cleanQuery);
                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;
                return b.count - a.count;
            });
        } else {
            filtered.sort((a, b) => b.count - a.count);
        }

        return filtered.slice(0, limit);
    } catch (err) {
        console.error('[getTopTags] Failed:', err);
        return [];
    }
}

