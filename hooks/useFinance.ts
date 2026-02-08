
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { FinanceTransaction, FinanceStats } from '../types';
import { useToast } from '../context/ToastContext';
import { format } from 'date-fns';
import { useMasterData } from './useMasterData';

const PAGE_SIZE = 15;

export const useFinance = (currentUser?: any) => {
    const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
    const [stats, setStats] = useState<FinanceStats>({ totalIncome: 0, totalExpense: 0, netProfit: 0, chartData: [] });
    
    // Loading States
    const [isLoadingList, setIsLoadingList] = useState(true);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    
    // Pagination State
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const { showToast } = useToast();
    const { masterOptions } = useMasterData();

    // Mapping Helper
    const mapTransaction = useCallback((item: any): FinanceTransaction => {
        const catOpt = masterOptions.find(o => o.key === item.category_key && (o.type === 'FINANCE_IN_CAT' || o.type === 'FINANCE_OUT_CAT'));
        
        return {
            id: item.id,
            type: item.type,
            categoryKey: item.category_key,
            amount: Number(item.amount),
            date: new Date(item.date),
            name: item.name,
            description: item.description,
            projectId: item.project_id,
            assetType: item.asset_type || 'NONE',
            receiptUrl: item.receipt_url,
            createdBy: item.created_by,
            createdAt: new Date(item.created_at),
            
            // Tax Mapping
            vatRate: Number(item.vat_rate || 0),
            vatAmount: Number(item.vat_amount || 0),
            whtRate: Number(item.wht_rate || 0),
            whtAmount: Number(item.wht_amount || 0),
            netAmount: Number(item.net_amount || 0),
            taxInvoiceNo: item.tax_invoice_no,
            entityName: item.entity_name,
            taxId: item.tax_id,

            // Specific Target
            targetUserId: item.target_user_id,

            projectTitle: item.contents?.title,
            creator: item.profiles ? { name: item.profiles.full_name, avatarUrl: item.profiles.avatar_url } : undefined,
            targetUser: item.target_user ? { name: item.target_user.full_name, avatarUrl: item.target_user.avatar_url } : undefined,
            categoryLabel: catOpt?.label || item.category_key,
            categoryColor: catOpt?.color || 'bg-gray-100 text-gray-500'
        };
    }, [masterOptions]);

    // 1. Fetch Stats (Server-side Aggregation)
    const fetchStats = useCallback(async (startDate: Date, endDate: Date) => {
        setIsLoadingStats(true);
        const start = format(startDate, 'yyyy-MM-dd');
        const end = format(endDate, 'yyyy-MM-dd');

        try {
            // Call RPC function for performance
            const { data, error } = await supabase.rpc('get_finance_stats', { 
                start_date: start, 
                end_date: end 
            });

            if (error) {
                console.warn("RPC fetch failed, falling back to client-side calc (slower)", error);
                // Fallback: Fetch all lightweight data
                const { data: rawData } = await supabase
                    .from('finance_transactions')
                    .select('amount, net_amount, type, category_key')
                    .gte('date', start)
                    .lte('date', end);
                
                if (rawData) {
                     let income = 0, expense = 0;
                     const expenseByCat: Record<string, number> = {};
                     rawData.forEach((t: any) => {
                         const val = Number(t.net_amount || t.amount);
                         if (t.type === 'INCOME') income += val;
                         else {
                             expense += val;
                             expenseByCat[t.category_key] = (expenseByCat[t.category_key] || 0) + val;
                         }
                     });
                     
                     const chartData = Object.entries(expenseByCat).map(([key, val]) => {
                        const opt = masterOptions.find(o => o.key === key);
                        return { name: opt?.label || key, value: val, color: '#8884d8' };
                     });

                     setStats({ totalIncome: income, totalExpense: expense, netProfit: income - expense, chartData });
                }
            } else {
                // RPC Success
                const chartData = (data.expense_by_category || []).map((item: any) => {
                    const opt = masterOptions.find(o => o.key === item.category_key);
                    return { name: opt?.label || item.category_key, value: item.value, color: '#8884d8' };
                });

                setStats({
                    totalIncome: data.total_income,
                    totalExpense: data.total_expense,
                    netProfit: data.net_profit,
                    chartData
                });
            }
        } catch (err) {
            console.error("Stats error", err);
        } finally {
            setIsLoadingStats(false);
        }
    }, [masterOptions]);

    // 2. Fetch Transactions (Paginated)
    const fetchTransactions = useCallback(async (startDate: Date, endDate: Date, pageNum: number) => {
        if (masterOptions.length === 0) return;
        
        setIsLoadingList(true);
        const start = format(startDate, 'yyyy-MM-dd');
        const end = format(endDate, 'yyyy-MM-dd');

        // Pagination range
        const from = (pageNum - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        try {
            const { data, count, error } = await supabase
                .from('finance_transactions')
                .select(`
                    *,
                    profiles:created_by (full_name, avatar_url),
                    target_user:target_user_id (full_name, avatar_url),
                    contents (title)
                `, { count: 'exact' })
                .gte('date', start)
                .lte('date', end)
                .order('date', { ascending: false })
                .range(from, to);

            if (error) throw error;

            if (data) {
                setTransactions(data.map(mapTransaction));
                setTotalCount(count || 0);
            }
        } catch (err: any) {
            console.error(err);
        } finally {
            setIsLoadingList(false);
        }
    }, [masterOptions, mapTransaction]);

    // Combined Refresher
    const refreshAll = (startDate: Date, endDate: Date, currentPage: number) => {
        fetchStats(startDate, endDate);
        fetchTransactions(startDate, endDate, currentPage);
    };

    const addTransaction = async (data: Partial<FinanceTransaction>) => {
        try {
            const payload = {
                type: data.type,
                category_key: data.categoryKey,
                amount: data.amount,
                date: data.date ? format(data.date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
                name: data.name,
                description: data.description,
                project_id: data.projectId || null,
                asset_type: data.assetType || 'NONE',
                receipt_url: data.receiptUrl || null,
                created_by: currentUser?.id,
                target_user_id: data.targetUserId || null,
                
                // Tax Fields
                vat_rate: data.vatRate || 0,
                vat_amount: data.vatAmount || 0,
                wht_rate: data.whtRate || 0,
                wht_amount: data.whtAmount || 0,
                net_amount: data.netAmount || data.amount, 
                tax_invoice_no: data.taxInvoiceNo || null,
                entity_name: data.entityName || null,
                tax_id: data.taxId || null
            };

            const { error } = await supabase.from('finance_transactions').insert(payload);
            if (error) throw error;
            
            showToast('บันทึกรายการเรียบร้อย 💰', 'success');
            return true;
        } catch (err: any) {
            showToast('บันทึกไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    const deleteTransaction = async (id: string) => {
        try {
            const { error } = await supabase.from('finance_transactions').delete().eq('id', id);
            if (error) throw error;
            showToast('ลบรายการแล้ว', 'info');
        } catch (err: any) {
            showToast('ลบไม่สำเร็จ', 'error');
        }
    };

    return {
        transactions,
        stats,
        isLoading: isLoadingList || isLoadingStats,
        isStatsLoading: isLoadingStats,
        pagination: {
            page,
            setPage,
            totalCount,
            pageSize: PAGE_SIZE,
            totalPages: Math.ceil(totalCount / PAGE_SIZE)
        },
        refreshAll,
        addTransaction,
        deleteTransaction
    };
};
