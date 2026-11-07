import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || 'https://ffjeuwtmbrwbcnsrnikc.supabase.co';
const anonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_qvsGI5_aLXAbTAZhSkiTRQ_h6GWbgtA';

export const supabase = createClient(url, anonKey, {
  realtime: { params: { eventsPerSecond: 20 } },
});