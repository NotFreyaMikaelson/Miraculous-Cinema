// Bucket de Supabase Storage donde se suben los videos
export const BUCKET = 'videos';

// Límite del plan gratis de Supabase: 50 MB por archivo
export const MAX_UPLOAD_MB = 50;

// Pega aquí la URL de credenciales TURN de Metered (incluye tu apiKey).
// Ejemplo: 'https://TUAPP.metered.live/api/v1/turn/credentials?apiKey=XXXXXXXX'
// Vacío = solo STUN (la voz puede fallar con datos móviles o redes estrictas).
export const TURN_CREDENTIALS_URL = '';