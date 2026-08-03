
import { createClient } from '@supabase/supabase-js';

// Robust Env Var Access for Vite/CRA/Node
const getEnv = (key: string): string => {
    let val: string | undefined = '';

    // 1. Try Vite's import.meta.env (Static Replacement for Frontend)
    try {
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            // @ts-ignore
            if (key === 'VITE_SUPABASE_URL') val = import.meta.env.VITE_SUPABASE_URL;
            // @ts-ignore
            if (key === 'VITE_SUPABASE_ANON_KEY') val = import.meta.env.VITE_SUPABASE_ANON_KEY;
        }
    } catch (e) { /* ignore */ }

    if (val) return val;

    // 2. Try process.env (Node / Express / Vercel Serverless environment)
    try {
        if (typeof process !== 'undefined' && process.env) {
            val = process.env[key] || process.env[key.replace('VITE_', '')];
        }
    } catch (e) { /* ignore */ }

    return val || '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || 'https://ajkycqazreebczqjsfpv.supabase.co';
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqa3ljcWF6cmVlYmN6cWpzZnB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0OTM5MjMsImV4cCI6MjA4NDA2OTkyM30.VscG53hy5tT5_oT297RECiVzaCcCw51AYWQeme_PDRo';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("⚠️ Supabase credentials missing. Please check your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


