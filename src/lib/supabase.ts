import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// If rawUrl still points to the old deprecated database or is empty, use the new Supabase project
const defaultUrl = 'https://dpqpwqcmhcczwfvrkpot.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwcXB3cWNtaGNjendmdnJrcG90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMTU4MjcsImV4cCI6MjEwMDg5MTgyN30.YuKcii_OTJhIbyr57kOANJD2iA1Djst2C0r01NOwhk4';

const activeUrl = (!rawUrl || rawUrl.includes('mtzbvvotrffnylwsujra')) ? defaultUrl : rawUrl;
const activeKey = (!rawKey || rawKey.includes('7rHlrbbAuD9yGwILGgYLZw')) ? defaultKey : rawKey;

// Clean URL and Key in case they contain brackets, parentheses or spaces from copy-pasting
const cleanUrl = activeUrl.replace(/[\[\]\(\)]/g, '').trim().replace(/^http:/, 'https:');
const cleanKey = activeKey.replace(/[\[\]\(\)]/g, '').trim();

export const supabase = createClient(cleanUrl, cleanKey);
