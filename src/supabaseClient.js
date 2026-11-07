// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en tu archivo .env');
}

// Solo se usa Realtime (Broadcast + Presence). No se usa Database ni Storage.
export const supabase = createClient(url, anonKey, {
  realtime: { params: { eventsPerSecond: 20 } },
});