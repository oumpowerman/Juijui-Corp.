import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Company } from '../types';

export const DEFAULT_COMPANIES: Company[] = [
    {
        id: 'c-jj-001',
        name: 'บริษัท จุ๋ยจุ๋ย จำกัด',
        shortName: 'JJ',
        code: 'JUIJUI',
        description: 'บริษัทแม่ / สำนักงานใหญ่',
        color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        isActive: true,
        sortOrder: 1,
    },
    {
        id: 'c-jp-002',
        name: 'บริษัท จุ๋ยโปรดักชั่น จำกัด',
        shortName: 'JP',
        code: 'JUIPROD',
        description: 'สายงานโปรดักชั่นและสื่อวิดีโอ',
        color: 'bg-pink-50 text-pink-700 border-pink-200',
        isActive: true,
        sortOrder: 2,
    },
    {
        id: 'c-mm-003',
        name: 'บริษัท มีมี่ จำกัด',
        shortName: 'MM',
        code: 'MEMEE',
        description: 'สายงานบันเทิงและดิจิทัลคอนเทนต์',
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        isActive: true,
        sortOrder: 3,
    }
];

export const mapCompanyFromDB = (data: any): Company => ({
    id: data.id,
    name: data.name || 'ไม่ระบุชื่อบริษัท',
    shortName: data.short_name || data.shortName || data.code || 'JJ',
    code: data.code || '',
    description: data.description || '',
    color: data.color || 'bg-indigo-50 text-indigo-700 border-indigo-200',
    logoUrl: data.logo_url || '',
    isActive: data.is_active !== false,
    sortOrder: Number(data.sort_order || 0),
    createdAt: data.created_at ? new Date(data.created_at) : undefined,
    updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
});

export const mapCompanyToDB = (company: Partial<Company>) => {
    const payload: any = {};
    if (company.name !== undefined) payload.name = company.name;
    if (company.shortName !== undefined) payload.short_name = company.shortName;
    if (company.code !== undefined) payload.code = company.code;
    if (company.description !== undefined) payload.description = company.description;
    if (company.color !== undefined) payload.color = company.color;
    if (company.logoUrl !== undefined) payload.logo_url = company.logoUrl;
    if (company.isActive !== undefined) payload.is_active = company.isActive;
    if (company.sortOrder !== undefined) payload.sort_order = company.sortOrder;
    payload.updated_at = new Date().toISOString();
    return payload;
};

export const useCompanies = () => {
    const [companies, setCompanies] = useState<Company[]>(DEFAULT_COMPANIES);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const fetchCompanies = useCallback(async () => {
        try {
            setIsLoading(true);
            // 1. Try fetching from companies table
            const { data, error } = await supabase
                .from('companies')
                .select('*')
                .order('sort_order', { ascending: true })
                .order('created_at', { ascending: true });

            if (error) {
                // If table doesn't exist yet, fallback to master_options or default
                const { data: masterData } = await supabase
                    .from('master_options')
                    .select('*')
                    .eq('type', 'COMPANY')
                    .order('sort_order', { ascending: true });

                if (masterData && masterData.length > 0) {
                    const mapped = masterData.map((m: any) => ({
                        id: m.id,
                        name: m.label || m.name,
                        shortName: m.key || m.short_name || 'JJ',
                        code: m.key,
                        description: m.description || '',
                        color: m.color || 'bg-indigo-50 text-indigo-700 border-indigo-200',
                        isActive: m.is_active !== false,
                        sortOrder: m.sort_order || 0
                    }));
                    setCompanies(mapped);
                    return mapped;
                }
                setCompanies(DEFAULT_COMPANIES);
                return DEFAULT_COMPANIES;
            }

            if (data && data.length > 0) {
                const mapped = data.map(mapCompanyFromDB);
                setCompanies(mapped);
                return mapped;
            } else {
                // If table is empty, auto-seed default companies
                try {
                    const seedPayload = DEFAULT_COMPANIES.map(c => ({
                        name: c.name,
                        short_name: c.shortName,
                        code: c.code,
                        description: c.description,
                        color: c.color,
                        sort_order: c.sortOrder,
                        is_active: true
                    }));
                    const { data: seeded, error: seedErr } = await supabase
                        .from('companies')
                        .insert(seedPayload)
                        .select();
                    if (!seedErr && seeded && seeded.length > 0) {
                        const mapped = seeded.map(mapCompanyFromDB);
                        setCompanies(mapped);
                        return mapped;
                    }
                } catch (e) {
                    console.warn("Could not auto-seed companies table:", e);
                }
                setCompanies(DEFAULT_COMPANIES);
                return DEFAULT_COMPANIES;
            }
        } catch (err) {
            console.warn("Failed to fetch companies, using default fallbacks:", err);
            setCompanies(DEFAULT_COMPANIES);
            return DEFAULT_COMPANIES;
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCompanies();

        // Setup real-time subscription for companies table
        const channel = supabase
            .channel('companies_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'companies' },
                () => {
                    fetchCompanies();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchCompanies]);

    const activeCompanies = useMemo(() => {
        return companies.filter(c => c.isActive !== false);
    }, [companies]);

    const getCompanyById = useCallback((id?: string | null): Company | undefined => {
        if (!id) return undefined;
        return companies.find(c => c.id === id || c.shortName?.toLowerCase() === id.toLowerCase() || c.code?.toLowerCase() === id.toLowerCase());
    }, [companies]);

    const addCompany = async (company: Omit<Company, 'id'>): Promise<Company | null> => {
        try {
            const dbPayload = {
                name: company.name,
                short_name: company.shortName,
                code: company.code || company.shortName,
                description: company.description || '',
                color: company.color || 'bg-indigo-50 text-indigo-700 border-indigo-200',
                logo_url: company.logoUrl || null,
                is_active: company.isActive !== false,
                sort_order: company.sortOrder || companies.length + 1
            };

            const { data, error } = await supabase
                .from('companies')
                .insert(dbPayload)
                .select()
                .single();

            if (error) {
                // Fallback to master_options if companies table is not yet provisioned
                const { data: masterData, error: masterErr } = await supabase
                    .from('master_options')
                    .insert({
                        type: 'COMPANY',
                        key: company.shortName,
                        label: company.name,
                        description: company.description || '',
                        color: company.color || 'bg-indigo-50 text-indigo-700 border-indigo-200',
                        sort_order: company.sortOrder || companies.length + 1,
                        is_active: company.isActive !== false
                    })
                    .select()
                    .single();

                if (masterErr) throw masterErr;

                const newComp: Company = {
                    id: masterData.id,
                    name: masterData.label,
                    shortName: masterData.key,
                    code: masterData.key,
                    description: masterData.description,
                    color: masterData.color,
                    isActive: masterData.is_active,
                    sortOrder: masterData.sort_order
                };
                setCompanies(prev => [...prev, newComp]);
                return newComp;
            }

            const mapped = mapCompanyFromDB(data);
            setCompanies(prev => [...prev.filter(c => c.id !== mapped.id), mapped]);
            return mapped;
        } catch (err) {
            console.error("Failed to add company:", err);
            return null;
        }
    };

    const updateCompany = async (id: string, updates: Partial<Company>): Promise<boolean> => {
        try {
            const dbPayload = mapCompanyToDB(updates);
            const { error } = await supabase
                .from('companies')
                .update(dbPayload)
                .eq('id', id);

            if (error) {
                // Try updating master_options fallback
                const { error: masterErr } = await supabase
                    .from('master_options')
                    .update({
                        ...(updates.name ? { label: updates.name } : {}),
                        ...(updates.shortName ? { key: updates.shortName } : {}),
                        ...(updates.description ? { description: updates.description } : {}),
                        ...(updates.color ? { color: updates.color } : {}),
                        ...(updates.isActive !== undefined ? { is_active: updates.isActive } : {}),
                        ...(updates.sortOrder !== undefined ? { sort_order: updates.sortOrder } : {})
                    })
                    .eq('id', id);

                if (masterErr) throw error;
            }

            setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
            return true;
        } catch (err) {
            console.error("Failed to update company:", err);
            return false;
        }
    };

    const deleteCompany = async (id: string): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from('companies')
                .delete()
                .eq('id', id);

            if (error) {
                await supabase.from('master_options').delete().eq('id', id);
            }

            setCompanies(prev => prev.filter(c => c.id !== id));
            return true;
        } catch (err) {
            console.error("Failed to delete company:", err);
            return false;
        }
    };

    return {
        companies,
        activeCompanies,
        isLoading,
        fetchCompanies,
        getCompanyById,
        addCompany,
        updateCompany,
        deleteCompany
    };
};
