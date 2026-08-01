
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

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || 'https://dfokfuetumchkqhtgeui.supabase.co';
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmb2tmdWV0dW1jaGtxaHRnZXVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3MzcxOTEsImV4cCI6MjEwMDMxMzE5MX0.ruhSJ1584rs87Pz5pyJB02Xfz5I-9NB43Rcgq3m6770';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("⚠️ Supabase credentials missing. Please check your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


