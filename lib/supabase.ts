
import { createClient } from '@supabase/supabase-js';

// Helper to safely access environment variables in different environments (Vite, CRA, Standard Node)
const getEnvVar = (key: string) => {
  try {
    // Check for Vite's import.meta.env
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {
    // Ignore errors accessing import.meta
  }

  try {
    // Check for standard process.env
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {
    // Ignore errors
  }

  return undefined;
};

// Initialize the Supabase client
// We provide fallback values to prevent "supabaseUrl is required" error if env variables are not set.
// This prevents the white screen crash, although functionality will fail if keys are missing.
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Missing Supabase environment variables! Please check .env file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);
