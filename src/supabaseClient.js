import { createClient } from '@supabase/supabase-js';

// Valores fijos (la publishable key está pensada para el navegador).
const SUPABASE_URL = 'https://ffjeuwtmbrwbcnsrnikc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qvsGI5_aLXAbTAZhSkiTRQ_h6GWbgtA';

// Solo se usa Realtime (Broadcast + Presence). No se usa Database ni Storage.
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  realtime: { params: { eventsPerSecond: 20 } },
});