// Tailwind por CDN + estilos propios inyectados desde este archivo.
import { useEffect, useRef, useState } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Maximize, Minimize, Copy, Check, Mic, MicOff,
  PhoneCall, PhoneOff, Send, Crown, ShieldCheck, Shield, LogOut, Upload, FileVideo, Cast,
  Link as LinkIcon, Trash2, Volume2, Loader2,
} from 'lucide-react';
import { supabase } from './supabaseClient';
import { BUCKET, MAX_UPLOAD_MB, TURN_CREDENTIALS_URL } from './config';

/* =====================================================================
   Estilos globales
   ===================================================================== */
if (typeof document !== 'undefined' && !document.getElementById('wp-setup')) {
  const tw = document.createElement('script');
  tw.id = 'tw-cdn';
  tw.src = 'https://cdn.tailwindcss.com';
  document.head.appendChild(tw);

  const font = document.createElement('link');
  font.rel = 'stylesheet';
  font.href =
    'https://fonts.googleapis.com/css2?family=Bagel+Fat+One&family=Hanken+Grotesk:wght@400;500;700;800&display=swap';
  document.head.appendChild(font);

  const st = document.createElement('style');
  st.id = 'wp-setup';
  st.textContent = `
:root{--noche:#15112E;--azotea:#221D45;--zinc:#2F2A57;--linea:#443E7A;--mariquita:#E8222E;--tinta:#0B0A16;--luna:#ECEAFB;--gato:#A8F04A;--tenue:#A9A5D6;
--skyline:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 60'%3E%3Cpath fill='%231b1640' d='M0 60V38L24 20L48 38V60ZM30 22V10h8v14ZM60 60V32L100 14L140 32V60ZM112 18V6h8v14ZM150 60V40L180 24L210 40V60ZM214 60V44L227 36L240 44V60Z'/%3E%3C/svg%3E")}
html,body{margin:0;padding:0;background:var(--noche);color:var(--luna);font-family:'Hanken Grotesk',system-ui,sans-serif;display:block!important;place-items:initial!important;min-width:0!important}
#root{max-width:none!important;margin:0!important;padding:0!important;width:100%!important;text-align:left!important}
*{box-sizing:border-box}
:focus-visible{outline:3px solid var(--gato);outline-offset:2px}
.fx-display{font-family:'Bagel Fat One','Hanken Grotesk',system-ui,sans-serif;font-weight:400;letter-spacing:.01em}
.cielo{min-height:100dvh;position:relative;isolation:isolate;background:radial-gradient(120% 55% at 50% -8%,#2d2166 0%,transparent 62%),var(--noche)}
.cielo::after{content:'';position:fixed;left:0;right:0;bottom:0;height:96px;background:var(--skyline) repeat-x left bottom/240px 60px;pointer-events:none;z-index:-1}
.lunares{background-color:var(--mariquita);background-image:radial-gradient(circle,var(--tinta) 15px,transparent 16px),radial-gradient(circle,var(--tinta) 15px,transparent 16px);background-size:84px 84px;background-position:0 0,42px 42px}
.logo{width:34px;height:34px;border-radius:50%;flex:none;background-color:var(--mariquita);background-image:radial-gradient(circle,var(--tinta) 3px,transparent 3.5px),radial-gradient(circle,var(--tinta) 3px,transparent 3.5px);background-size:16px 16px;background-position:0 0,8px 8px;box-shadow:inset 0 0 0 2px var(--tinta)}
.bulbs{position:relative;height:16px;margin:0 26px}
.bulbs::before,.bulbs::after{content:'';position:absolute;inset:0;background-repeat:repeat-x;background-size:44px 16px;opacity:.5}
.bulbs::before{background-image:radial-gradient(circle at 11px 8px,var(--mariquita) 0 4.5px,transparent 5.5px)}
.bulbs::after{background-image:radial-gradient(circle at 33px 8px,var(--gato) 0 4.5px,transparent 5.5px)}
.vivo .bulbs::before{animation:luz 1.4s steps(1) infinite}
.vivo .bulbs::after{animation:luz 1.4s steps(1) infinite;animation-delay:-.7s}
@keyframes luz{0%{opacity:1}50%{opacity:.22}}
@media (prefers-reduced-motion:reduce){.vivo .bulbs::before,.vivo .bulbs::after{animation:none;opacity:1}}
.pantalla{position:relative;overflow:hidden;background:#000;border:7px solid var(--tinta);border-radius:28px;box-shadow:0 0 0 2px var(--linea),0 26px 60px -24px rgba(232,34,46,.55)}
.isfs .pantalla{border:0;border-radius:0;box-shadow:none;height:100%}
.yt-holder iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.panel{background:var(--azotea);border:1px solid var(--linea);border-radius:22px}
.pill{display:inline-flex;align-items:center;gap:.4rem;border-radius:999px;padding:.3rem .75rem;font-size:.8rem;background:var(--zinc);border:1px solid var(--linea)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;border-radius:14px;padding:.65rem 1rem;font-weight:700;font-size:.92rem;border:0;cursor:pointer;color:var(--luna);background:var(--zinc);transition:filter .15s}
.btn:hover:not(:disabled){filter:brightness(1.18)}
.btn:disabled{opacity:.4;cursor:not-allowed}
.btn-rojo{background:var(--mariquita);color:#fff}
.btn-gato{background:var(--gato);color:var(--tinta)}
.btn-tinta{background:var(--tinta);color:#fff}
.btn-sm{padding:.4rem .5rem;border-radius:10px}
.campo{width:100%;border-radius:14px;border:2px solid #cfcaf0;background:#fff;color:var(--tinta);padding:.75rem .9rem;font-size:1rem;outline:none}
.campo-noche{width:100%;border-radius:14px;border:1px solid var(--linea);background:var(--noche);color:var(--luna);padding:.6rem .8rem;font-size:.92rem;outline:none}
.campo-noche::placeholder{color:#7f7ab0}
.boleto-a{position:relative;color:var(--tinta);border-radius:24px 24px 0 0;background:linear-gradient(90deg,#b9b4e6 50%,transparent 0) 0 100%/12px 2px repeat-x,var(--luna);-webkit-mask:radial-gradient(circle 14px at 0 100%,#0000 97%,#000),radial-gradient(circle 14px at 100% 100%,#0000 97%,#000);-webkit-mask-composite:source-in;mask:radial-gradient(circle 14px at 0 100%,#0000 97%,#000),radial-gradient(circle 14px at 100% 100%,#0000 97%,#000);mask-composite:intersect}
.boleto-b{position:relative;color:var(--tinta);border-radius:0 0 24px 24px;background:var(--luna);-webkit-mask:radial-gradient(circle 14px at 0 0,#0000 97%,#000),radial-gradient(circle 14px at 100% 0,#0000 97%,#000);-webkit-mask-composite:source-in;mask:radial-gradient(circle 14px at 0 0,#0000 97%,#000),radial-gradient(circle 14px at 100% 0,#0000 97%,#000);mask-composite:intersect}
.avatar{display:inline-flex;align-items:center;justify-content:center;border-radius:50%;color:#fff;font-weight:800;flex:none;box-shadow:inset 0 0 0 2px var(--tinta);background-image:radial-gradient(circle at 22% 28%,rgba(11,10,22,.5) 0 3px,transparent 3.5px),radial-gradient(circle at 78% 70%,rgba(11,10,22,.5) 0 3.5px,transparent 4px)}
.burbuja{max-width:86%;padding:.5rem .8rem;font-size:.9rem;word-break:break-word;background:var(--zinc);border-radius:18px 18px 18px 4px}
.burbuja-mia{background:var(--mariquita);color:#fff;border-radius:18px 18px 4px 18px}
.barra{-webkit-appearance:none;appearance:none;width:100%;height:8px;border-radius:99px;outline:none;cursor:pointer;background:linear-gradient(90deg,var(--mariquita) var(--p,0%),rgba(255,255,255,.22) var(--p,0%))}
.barra:disabled{cursor:default;opacity:.75}
.barra::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:var(--mariquita);border:4px solid var(--tinta);box-shadow:0 0 0 2px #fff}
.barra::-moz-range-thumb{width:12px;height:12px;border-radius:50%;background:var(--mariquita);border:4px solid var(--tinta);box-shadow:0 0 0 2px #fff}
.scroll-fino{scrollbar-width:thin;scrollbar-color:var(--linea) transparent}
  `;
  document.head.appendChild(st);
}

/* =====================================================================
   Utilidades
   ===================================================================== */
const STUN = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }];

const newId = () =>
  crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
const newRoomId = () => newId().replace(/-/g, '').slice(0, 8);
const inviteLink = (roomId) => `${window.location.origin}${window.location.pathname}?room=${roomId}`;
const getUid = () => {
  let v = sessionStorage.getItem('wp-uid');
  if (!v) { v = newId(); sessionStorage.setItem('wp-uid', v); }
  return v;
};
const fmt = (t = 0) => {
  if (!isFinite(t)) return '0:00';
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = Math.floor(t % 60);
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
};
const loadIceServers = async () => {
  if (!TURN_CREDENTIALS_URL) return STUN;
  try {
    const r = await fetch(TURN_CREDENTIALS_URL);
    const j = await r.json();
    return Array.isArray(j) ? [...STUN, ...j] : STUN;
  } catch {
    return STUN;
  }
};

// Devuelve el ID de un enlace de YouTube (watch, youtu.be, shorts, embed, live) o null
const parseYouTube = (u) => {
  try {
    const x = new URL(u);
    const h = x.hostname.replace(/^www\.|^m\./, '');
    if (h === 'youtu.be') return x.pathname.slice(1).split('/')[0] || null;
    if (h.endsWith('youtube.com')) {
      if (x.pathname === '/watch') return x.searchParams.get('v');
      const m = x.pathname.match(/^\/(embed|shorts|live)\/([\w-]{11})/);
      if (m) return m[2];
    }
  } catch { /* no es URL válida */ }
  return null;
};

// Carga la API oficial de YouTube IFrame una sola vez
let ytApiPromise = null;
const loadYT = () => {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (!ytApiPromise) {
    ytApiPromise = new Promise((resolve) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { if (prev) prev(); resolve(window.YT); };
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    });
  }
  return ytApiPromise;
};

function Avatar({ name, size = 38 }) {
  const colors = ['#E8222E', '#7B61FF', '#F59E0B', '#14B8A6', '#EC4899'];
  let h = 0;
  for (const c of name || '?') h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (
    <span className="avatar" style={{ width: size, height: size, backgroundColor: colors[h % colors.length], fontSize: size * 0.42 }}>
      {(name || '?').trim().charAt(0).toUpperCase()}
    </span>
  );
}

function RemoteAudio({ stream, onBlocked }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.srcObject = stream;
    const p = el.play && el.play();
    if (p && p.catch) p.catch(() => onBlocked && onBlocked());
  }, [stream]);
  return <audio ref={ref} autoPlay playsInline />;
}

/* =====================================================================
   App: lobby y sala
   ===================================================================== */
export default function App() {
  const urlRoom = new URLSearchParams(window.location.search).get('room');
  const [name, setName] = useState(() => localStorage.getItem('wp-name') || '');
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');

  const enter = (roomId, createdByMe) => {
    const n = name.trim();
    if (!n) return setError('Escribe tu nombre para entrar');
    localStorage.setItem('wp-name', n);
    if (createdByMe) sessionStorage.setItem(`wp-host-${roomId}`, '1');
    const isHost = sessionStorage.getItem(`wp-host-${roomId}`) === '1';
    window.history.replaceState(null, '', `?room=${roomId}`);
    setSession({ roomId, name: n, isHost });
  };

  const leave = () => {
    window.history.replaceState(null, '', window.location.pathname);
    setSession(null);
  };

  if (session) return <Room key={session.roomId} {...session} onLeave={leave} />;

  return (
    <div className="cielo flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-2">
          <span className="logo" />
          <h1 className="fx-display text-4xl leading-none">Cine Miraculous</h1>
        </div>
        <p className="text-[var(--tenue)] mb-7 max-w-sm">
          Ve episodios con tus amigas, cada una desde su casa, y charlen mientras tanto.
        </p>

        <div className="boleto-a">
          <div className="lunares h-14 rounded-t-[24px] flex items-end px-5">
            <span className="bg-[var(--tinta)] text-white text-sm font-bold px-3 py-1 rounded-t-xl">Entrada para la función</span>
          </div>
          <div className="p-6 pt-5">
            <label className="block text-sm font-bold mb-1" htmlFor="nombre">¿Cómo te llamas?</label>
            <input
              id="nombre"
              className="campo"
              value={name}
              maxLength={24}
              placeholder="Marinette"
              onChange={(e) => { setName(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && enter(urlRoom || newRoomId(), !urlRoom)}
            />
            {error && <p className="text-[#C1121F] text-sm font-bold mt-2">{error}</p>}
          </div>
        </div>
        <div className="boleto-b p-6 pt-7 space-y-3">
          {urlRoom && (
            <button className="btn btn-rojo w-full text-base" onClick={() => enter(urlRoom, false)}>
              Entrar a la sala {urlRoom}
            </button>
          )}
          <button
            className={`btn w-full text-base ${urlRoom ? 'btn-tinta' : 'btn-rojo'}`}
            onClick={() => enter(newRoomId(), true)}
          >
            Crear Sala Miraculous
          </button>
        </div>
      </div>
    </div>
  );
}

/* =====================================================================
   Sala
   ===================================================================== */
function Room({ roomId, name, isHost, onLeave }) {
  const me = useRef(getUid()).current;

  // Refs
  const apiRef = useRef({});
  const channelRef = useRef(null);
  const videoRef = useRef(null);
  const ytRef = useRef(null);
  const ytHolderRef = useRef(null);
  const containerRef = useRef(null);
  const chatEndRef = useRef(null);
  const pcsRef = useRef(new Map());           // voz
  const pendingIceRef = useRef(new Map());    // voz
  const voicePeersRef = useRef(new Set());
  const retriesRef = useRef(new Map());
  const streamPcsRef = useRef(new Map());     // transmisión de video en vivo
  const vPendingRef = useRef(new Map());
  const vRetriesRef = useRef(new Map());
  const captureRef = useRef(null);
  const localStreamRef = useRef(null);
  const iceRef = useRef(STUN);
  const iceReadyRef = useRef(null);
  const presenceRef = useRef({ name, host: isHost, voice: false, muted: false });
  const pendingSyncRef = useRef(null);
  const lastSeekSentRef = useRef(0);
  const lastActRef = useRef(0);
  const objectUrlRef = useRef(null);
  const urlSrcRef = useRef(null);             // { url, label } nube, enlace o YouTube
  const localNameRef = useRef('');
  const cloudPathRef = useRef('');
  const srcKeyRef = useRef('');
  const hideRef = useRef(null);
  const participantsRef = useRef([]);
  const modeRef = useRef('none');

  // Estado
  const [participants, setParticipants] = useState([]);
  const [mods, setMods] = useState(() => {
    if (!isHost) return [];
    try { return JSON.parse(sessionStorage.getItem(`wp-mods-${roomId}`) || '[]'); } catch { return []; }
  });
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [mode, setMode] = useState('none'); // none | file | youtube | stream
  const [videoSrc, setVideoSrc] = useState('');
  const [ytId, setYtId] = useState('');
  const [videoLabel, setVideoLabel] = useState('');
  const [remoteVideo, setRemoteVideo] = useState(null);
  const [liveCount, setLiveCount] = useState(0);
  const [urlInput, setUrlInput] = useState('');
  const [notice, setNotice] = useState('');
  const [localNeeded, setLocalNeeded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hasCloud, setHasCloud] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [nativeFs, setNativeFs] = useState(false);
  const [pseudoFs, setPseudoFs] = useState(false);
  const [ctrlVisible, setCtrlVisible] = useState(true);
  const [needsTap, setNeedsTap] = useState(false);
  const [copied, setCopied] = useState(false);
  const [connected, setConnected] = useState(false);
  const [inVoice, setInVoice] = useState(false);
  const [muted, setMuted] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [peerStatus, setPeerStatus] = useState({});

  modeRef.current = mode;
  participantsRef.current = participants;

  const canControl = isHost || mods.includes(me);
  const liveGuest = mode === 'stream' && !isHost;
  const isFs = nativeFs || pseudoFs;
  const pct = duration ? Math.min(100, (current / duration) * 100) : 0;
  const controlsVisible = ctrlVisible || !playing || mode === 'none';

  /* ---------- Helpers de canal ---------- */
  const send = (event, payload = {}) => channelRef.current?.send({ type: 'broadcast', event, payload });
  const updatePresence = (patch) => {
    presenceRef.current = { ...presenceRef.current, ...patch };
    channelRef.current?.track(presenceRef.current);
  };

  /* ---------- Fuente de video ---------- */
  const setSource = (kind, url, label, yId = '') => {
    srcKeyRef.current = kind === 'youtube' ? `youtube|${yId}` : kind === 'stream' ? `stream|${label}` : `file|${url}`;
    captureRef.current = null;
    closeAllStreams();
    vRetriesRef.current = new Map();
    pendingSyncRef.current = null;
    setRemoteVideo(null);
    setMode(kind);
    setVideoSrc(url || '');
    setYtId(yId);
    setVideoLabel(label);
    setCurrent(0);
    setDuration(0);
    setPlaying(false);
    setNeedsTap(false);
  };

  /* ---------- Aplicar órdenes de reproducción ---------- */
  const checkYtStarted = () =>
    setTimeout(() => {
      const y = ytRef.current;
      const s = y && y.getPlayerState && y.getPlayerState();
      if (y && s !== 1 && s !== 3) setNeedsTap(true);
    }, 1500);

  const applyLocal = (p) => {
    const m = modeRef.current;

    if (m === 'youtube') {
      const y = ytRef.current;
      if (!y || !y.seekTo) { pendingSyncRef.current = p; return; }
      const st = y.getPlayerState && y.getPlayerState();
      if (p.action === 'play') { y.seekTo(p.time, true); y.playVideo(); checkYtStarted(); }
      else if (p.action === 'pause') { y.pauseVideo(); y.seekTo(p.time, true); }
      else if (p.action === 'seek') { y.seekTo(p.time, true); }
      else if (p.action === 'state') {
        if (Math.abs((y.getCurrentTime ? y.getCurrentTime() : 0) - p.time) > 1.5) y.seekTo(p.time, true);
        if (p.playing && st !== 1) { y.playVideo(); checkYtStarted(); }
        else if (!p.playing && st === 1) y.pauseVideo();
      }
      return;
    }

    if (m === 'stream' && !isHost) {
      // La imagen llega en vivo de la anfitriona; aquí solo reflejamos el estado en la interfaz
      if (p.action === 'play') setPlaying(true);
      else if (p.action === 'pause') setPlaying(false);
      else if (p.action === 'state') { setPlaying(!!p.playing); if (p.duration) setDuration(p.duration); }
      if (p.time != null) setCurrent(p.time);
      return;
    }

    const v = videoRef.current;
    if (!v || !v.src || v.readyState < 1) { pendingSyncRef.current = p; return; }
    const tryPlay = () => v.play().then(() => setNeedsTap(false)).catch(() => setNeedsTap(true));
    if (p.action === 'play') { v.currentTime = p.time; tryPlay(); }
    else if (p.action === 'pause') { v.pause(); v.currentTime = p.time; }
    else if (p.action === 'seek') { v.currentTime = p.time; }
    else if (p.action === 'state') {
      if (p.playing) {
        if (Math.abs(v.currentTime - p.time) > 1.5) v.currentTime = p.time;
        if (v.paused) tryPlay();
      } else {
        if (!v.paused) v.pause();
        if (Math.abs(v.currentTime - p.time) > 0.5) v.currentTime = p.time;
      }
    }
  };

  const onSync = (p) => {
    if (p.from === me || (p.to && p.to !== me)) return;
    if (p.action === 'state' && Date.now() - lastActRef.current < 1800) return;
    applyLocal(p);
  };

  const command = (action, time, broadcast = true) => {
    lastActRef.current = Date.now();
    applyLocal({ action, time });
    if (broadcast) send('sync', { action, time, from: me });
  };

  const nowTime = () => {
    if (modeRef.current === 'youtube') return (ytRef.current && ytRef.current.getCurrentTime && ytRef.current.getCurrentTime()) || current;
    if (modeRef.current === 'stream' && !isHost) return current;
    return videoRef.current ? videoRef.current.currentTime : current;
  };

  const togglePlay = () => {
    if (!canControl || mode === 'none') return;
    command(playing ? 'pause' : 'play', nowTime());
  };

  const seekTo = (t, throttle = false) => {
    if (!canControl || mode === 'none') return;
    const time = Math.max(0, duration ? Math.min(duration, t) : t);
    setCurrent(time);
    const now = Date.now();
    const doSend = !throttle || now - lastSeekSentRef.current >= 150;
    if (doSend) lastSeekSentRef.current = now;
    command('seek', time, doSend);
  };

  const skip = (d) => seekTo(nowTime() + d);

  const hostState = () => {
    if (modeRef.current === 'youtube') {
      const y = ytRef.current;
      if (!y || !y.getCurrentTime) return null;
      return { time: y.getCurrentTime(), playing: y.getPlayerState() === 1, duration: y.getDuration() };
    }
    const v = videoRef.current;
    if (!v || !v.src || v.readyState < 1) return null;
    return { time: v.currentTime, playing: !v.paused, duration: v.duration };
  };

  const unlock = () => {
    if (modeRef.current === 'youtube') ytRef.current && ytRef.current.playVideo && ytRef.current.playVideo();
    else if (videoRef.current) videoRef.current.play().catch(() => {});
    setNeedsTap(false);
  };

  const poke = () => {
    setCtrlVisible(true);
    clearTimeout(hideRef.current);
    hideRef.current = setTimeout(() => setCtrlVisible(false), 3000);
  };

  const toggleFs = async () => {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      return;
    }
    if (pseudoFs) { setPseudoFs(false); return; }
    const el = containerRef.current;
    const req = el && (el.requestFullscreen || el.webkitRequestFullscreen);
    if (req) {
      try {
        await req.call(el);
        try { await window.screen.orientation?.lock?.('landscape'); } catch { /* no soportado */ }
        return;
      } catch { /* cae al modo alternativo */ }
    }
    setPseudoFs(true); // iPhone y navegadores sin API de pantalla completa
  };

  /* ---------- Cargar video: nube, enlace/YouTube, archivo en vivo ---------- */
  const removeCloud = async () => {
    const path = cloudPathRef.current;
    if (!path) return;
    cloudPathRef.current = '';
    setHasCloud(false);
    try { await supabase.storage.from(BUCKET).remove([path]); } catch { /* ignorar */ }
  };

  const uploadVideo = async (file) => {
    const mb = file.size / 1024 / 1024;
    if (mb > MAX_UPLOAD_MB) {
      setNotice(`El archivo pesa ${mb.toFixed(0)} MB y el límite es ${MAX_UPLOAD_MB} MB. Usa "Compartir archivo en vivo" o un enlace.`);
      return;
    }
    setUploading(true);
    setNotice('');
    try {
      await removeCloud();
      const ext = (file.name.split('.').pop() || 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4';
      const path = `${roomId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type || 'video/mp4',
        cacheControl: '3600',
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      cloudPathRef.current = path;
      setHasCloud(true);
      urlSrcRef.current = { url: data.publicUrl, label: file.name };
      localNameRef.current = '';
      setSource('file', data.publicUrl, file.name);
      send('video-url', { url: data.publicUrl, label: file.name });
    } catch (e) {
      setNotice(`No se pudo subir el video: ${e.message || e}`);
    }
    setUploading(false);
  };

  const loadUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    const id = parseYouTube(url);
    urlSrcRef.current = { url, label: url };
    localNameRef.current = '';
    setNotice('');
    if (id) setSource('youtube', '', url, id);
    else setSource('file', url, url);
    send('video-url', { url, label: url });
  };

  const loadLocalFile = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setNotice('');
    setLocalNeeded(false);

    if (!isHost) { setSource('file', url, file.name); return; } // invitada con su propio archivo

    urlSrcRef.current = null;
    const canCapture =
      typeof HTMLMediaElement !== 'undefined' &&
      ('captureStream' in HTMLMediaElement.prototype || 'mozCaptureStream' in HTMLMediaElement.prototype);
    if (canCapture) {
      localNameRef.current = '';
      setSource('stream', url, file.name);
      send('video-stream', { label: file.name });
    } else {
      localNameRef.current = file.name;
      setSource('file', url, file.name);
      setNotice('Tu navegador no puede transmitir en vivo. Las demás deberán elegir el mismo archivo en su dispositivo.');
      send('video-local', { name: file.name });
    }
  };

  const onVideoUrl = (p) => {
    if (isHost || (p.to && p.to !== me)) return;
    const id = parseYouTube(p.url);
    const key = id ? `youtube|${id}` : `file|${p.url}`;
    if (srcKeyRef.current === key) return;
    if (id) setSource('youtube', '', p.label || p.url, id);
    else setSource('file', p.url, p.label || p.url);
    setNotice('');
    setLocalNeeded(false);
  };

  const onVideoStream = (p) => {
    if (isHost || (p.to && p.to !== me)) return;
    const label = p.label || 'Transmisión en vivo';
    if (srcKeyRef.current === `stream|${label}`) return;
    setSource('stream', '', label);
    setNotice('');
    setLocalNeeded(false);
  };

  const onVideoLocal = (p) => {
    if (isHost || (p.to && p.to !== me)) return;
    setNotice(`La anfitriona puso el archivo «${p.name}» desde su dispositivo. Elige el mismo archivo en el tuyo.`);
    setLocalNeeded(true);
  };

  const onRequestState = (payload) => {
    if (!isHost) return;
    const to = payload && payload.from;
    const m = modeRef.current;
    if (m === 'stream') {
      send('video-stream', { label: videoLabel, to });
      streamTo(to);
    } else if (urlSrcRef.current) {
      send('video-url', { ...urlSrcRef.current, to });
    } else if (localNameRef.current) {
      send('video-local', { name: localNameRef.current, to });
    }
    send('roles', { mods, to });
    const s = hostState();
    if (s) send('sync', { action: 'state', ...s, from: me, to });
  };

  const toggleMod = (id) => {
    const next = mods.includes(id) ? mods.filter((m) => m !== id) : [...mods, id];
    setMods(next);
    sessionStorage.setItem(`wp-mods-${roomId}`, JSON.stringify(next));
    send('roles', { mods: next });
  };

  /* ---------- Transmisión en vivo del archivo local (WebRTC) ---------- */
  const flushQueue = async (mapRef, peerId, pc) => {
    const queue = mapRef.current.get(peerId) || [];
    mapRef.current.delete(peerId);
    for (const c of queue) {
      try { await pc.addIceCandidate(c); } catch (e) { console.warn(e); }
    }
  };

  const updateLive = () =>
    setLiveCount([...streamPcsRef.current.values()].filter((p) => p.connectionState === 'connected').length);

  const closeStreamPc = (id) => {
    const pc = streamPcsRef.current.get(id);
    if (pc) {
      streamPcsRef.current.delete(id);
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.close();
    }
    vPendingRef.current.delete(id);
    updateLive();
  };

  const closeAllStreams = () => [...streamPcsRef.current.keys()].forEach(closeStreamPc);

  const getCapture = () => {
    const v = videoRef.current;
    if (!v) return null;
    if (!captureRef.current) {
      try {
        captureRef.current = (v.captureStream || v.mozCaptureStream).call(v);
      } catch {
        return null;
      }
    }
    return captureRef.current;
  };

  const streamTo = (peerId, attempt = 0) => {
    if (!isHost || !peerId || modeRef.current !== 'stream') return;
    const s = getCapture();
    if (!s || s.getTracks().length === 0) {
      if (attempt < 12) setTimeout(() => apiRef.current.streamTo(peerId, attempt + 1), 500);
      return;
    }
    closeStreamPc(peerId);
    const pc = new RTCPeerConnection({ iceServers: iceRef.current });
    streamPcsRef.current.set(peerId, pc);
    s.getTracks().forEach((t) => {
      if (t.kind === 'video') t.contentHint = 'motion';
      pc.addTrack(t, s);
    });
    pc.onicecandidate = (e) => {
      if (e.candidate) send('vsig', { from: me, to: peerId, kind: 'ice', data: e.candidate.toJSON() });
    };
    pc.onconnectionstatechange = () => {
      updateLive();
      if (pc.connectionState === 'failed') {
        closeStreamPc(peerId);
        const n = (vRetriesRef.current.get(peerId) || 0) + 1;
        vRetriesRef.current.set(peerId, n);
        if (n <= 3) setTimeout(() => apiRef.current.streamTo(peerId), 2000);
      }
    };
    (async () => {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      // Limita la subida por persona para no saturar el internet de la anfitriona
      pc.getSenders().forEach((sn) => {
        if (sn.track && sn.track.kind === 'video') {
          const prm = sn.getParameters();
          if (!prm.encodings || !prm.encodings.length) prm.encodings = [{}];
          prm.encodings[0].maxBitrate = 1800000;
          sn.setParameters(prm).catch(() => {});
        }
      });
      send('vsig', {
        from: me, to: peerId, kind: 'offer',
        data: { type: pc.localDescription.type, sdp: pc.localDescription.sdp },
      });
    })().catch(console.error);
  };

  const streamAll = (onlyMissing = false) => {
    participantsRef.current.forEach((p) => {
      if (p.id === me) return;
      if (onlyMissing && streamPcsRef.current.has(p.id)) return;
      streamTo(p.id);
    });
  };

  const handleVsig = async ({ from, to, kind, data }) => {
    if (to !== me) return;
    try {
      if (kind === 'offer') {
        if (isHost) return;
        if (!srcKeyRef.current.startsWith('stream|')) setSource('stream', '', 'Transmisión en vivo');
        closeStreamPc(from);
        const pc = new RTCPeerConnection({ iceServers: iceRef.current });
        streamPcsRef.current.set(from, pc);
        pc.onicecandidate = (e) => {
          if (e.candidate) send('vsig', { from: me, to: from, kind: 'ice', data: e.candidate.toJSON() });
        };
        pc.ontrack = (e) => setRemoteVideo(e.streams[0]);
        await pc.setRemoteDescription(data);
        await flushQueue(vPendingRef, from, pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        send('vsig', {
          from: me, to: from, kind: 'answer',
          data: { type: pc.localDescription.type, sdp: pc.localDescription.sdp },
        });
      } else if (kind === 'answer') {
        const pc = streamPcsRef.current.get(from);
        if (pc && pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(data);
          await flushQueue(vPendingRef, from, pc);
        }
      } else if (kind === 'ice') {
        const pc = streamPcsRef.current.get(from);
        if (pc && pc.remoteDescription) await pc.addIceCandidate(data);
        else vPendingRef.current.set(from, [...(vPendingRef.current.get(from) || []), data]);
      }
    } catch (e) {
      console.error('Señalización de video', e);
    }
  };

  /* ---------- WebRTC: voz ---------- */
  const closePeer = (peerId, keepStatus = false) => {
    const pc = pcsRef.current.get(peerId);
    if (pc) {
      pcsRef.current.delete(peerId);
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.close();
    }
    setRemoteStreams((s) => {
      if (!(peerId in s)) return s;
      const { [peerId]: _x, ...rest } = s;
      return rest;
    });
    if (!keepStatus) {
      setPeerStatus((s) => {
        if (!(peerId in s)) return s;
        const { [peerId]: _x, ...rest } = s;
        return rest;
      });
    }
  };

  const createPeer = (peerId, initiator) => {
    const pc = new RTCPeerConnection({ iceServers: iceRef.current });
    pcsRef.current.set(peerId, pc);
    setPeerStatus((s) => ({ ...s, [peerId]: 'connecting' }));

    const stream = localStreamRef.current;
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    pc.onicecandidate = (e) => {
      if (e.candidate) send('signal', { from: me, to: peerId, kind: 'ice', data: e.candidate.toJSON() });
    };
    pc.ontrack = (e) => setRemoteStreams((s) => ({ ...s, [peerId]: e.streams[0] }));
    pc.onconnectionstatechange = () => {
      const st = pc.connectionState;
      if (st === 'connected') {
        retriesRef.current.delete(peerId);
        setPeerStatus((s) => ({ ...s, [peerId]: 'connected' }));
      } else if (st === 'connecting') {
        setPeerStatus((s) => ({ ...s, [peerId]: 'connecting' }));
      } else if (st === 'failed' || st === 'closed') {
        closePeer(peerId, true);
        setPeerStatus((s) => ({ ...s, [peerId]: 'failed' }));
        const n = (retriesRef.current.get(peerId) || 0) + 1;
        retriesRef.current.set(peerId, n);
        if (n <= 3) setTimeout(() => apiRef.current.maybeConnect(peerId), 2000);
      }
    };

    if (initiator) {
      pc.createOffer()
        .then((o) => pc.setLocalDescription(o))
        .then(() =>
          send('signal', {
            from: me, to: peerId, kind: 'offer',
            data: { type: pc.localDescription.type, sdp: pc.localDescription.sdp },
          })
        )
        .catch(console.error);
    }
    return pc;
  };

  // Regla anti-colisión: ofrece el que tiene el id menor
  const maybeConnect = (peerId) => {
    if (!localStreamRef.current || !voicePeersRef.current.has(peerId)) return;
    if (pcsRef.current.has(peerId)) return;
    if (me < peerId) createPeer(peerId, true);
  };

  const handleVoice = ({ kind, from, to, reply }) => {
    if (from === me || (to && to !== me)) return;
    if (kind === 'bye') {
      voicePeersRef.current.delete(from);
      pendingIceRef.current.delete(from);
      closePeer(from);
      return;
    }
    if (kind === 'hello') {
      if (!localStreamRef.current) return;
      if (!reply) {
        closePeer(from, true);
        pendingIceRef.current.delete(from);
        retriesRef.current.delete(from);
        send('voice', { kind: 'hello', from: me, to: from, reply: true });
      }
      voicePeersRef.current.add(from);
      maybeConnect(from);
    }
  };

  const handleSignal = async ({ from, to, kind, data }) => {
    if (to !== me || !localStreamRef.current) return;
    try {
      if (kind === 'offer') {
        voicePeersRef.current.add(from);
        closePeer(from, true);
        const pc = createPeer(from, false);
        await pc.setRemoteDescription(data);
        await flushQueue(pendingIceRef, from, pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        send('signal', {
          from: me, to: from, kind: 'answer',
          data: { type: pc.localDescription.type, sdp: pc.localDescription.sdp },
        });
      } else if (kind === 'answer') {
        const pc = pcsRef.current.get(from);
        if (pc && pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(data);
          await flushQueue(pendingIceRef, from, pc);
        }
      } else if (kind === 'ice') {
        const pc = pcsRef.current.get(from);
        if (pc && pc.remoteDescription) await pc.addIceCandidate(data);
        else pendingIceRef.current.set(from, [...(pendingIceRef.current.get(from) || []), data]);
      }
    } catch (e) {
      console.error('Señalización de voz', e);
    }
  };

  const pruneGone = (ids) => {
    [...pcsRef.current.keys()].forEach((id) => { if (!ids.has(id)) closePeer(id); });
    [...voicePeersRef.current].forEach((id) => { if (!ids.has(id)) voicePeersRef.current.delete(id); });
    [...streamPcsRef.current.keys()].forEach((id) => { if (!ids.has(id)) closeStreamPc(id); });
  };

  const joinVoice = async () => {
    setVoiceError('');
    try {
      await iceReadyRef.current;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      localStreamRef.current = stream;
      voicePeersRef.current = new Set();
      retriesRef.current = new Map();
      setInVoice(true);
      setMuted(false);
      updatePresence({ voice: true, muted: false });
      send('voice', { kind: 'hello', from: me, reply: false });
    } catch (e) {
      setVoiceError(
        e && e.name === 'NotAllowedError'
          ? 'Permite el micrófono en el navegador para entrar a la llamada.'
          : 'No se pudo abrir el micrófono. Revisa que otro programa no lo esté usando.'
      );
    }
  };

  const leaveVoice = () => {
    send('voice', { kind: 'bye', from: me });
    [...pcsRef.current.keys()].forEach((id) => closePeer(id));
    pendingIceRef.current = new Map();
    voicePeersRef.current = new Set();
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setInVoice(false);
    setMuted(false);
    setRemoteStreams({});
    setPeerStatus({});
    updatePresence({ voice: false, muted: false });
  };

  const toggleMute = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !muted;
    stream.getAudioTracks().forEach((t) => (t.enabled = !next));
    setMuted(next);
    updatePresence({ muted: next });
  };

  const enableAudio = () => {
    document.querySelectorAll('audio').forEach((a) => a.play().catch(() => {}));
    setAudioBlocked(false);
  };

  /* ---------- Chat y sala ---------- */
  const sendChat = (e) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;
    const msg = { id: newId(), from: me, name, text, ts: Date.now() };
    setMessages((m) => [...m.slice(-199), msg]);
    send('chat', msg);
    setChatInput('');
  };

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink(roomId));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copia el enlace:', inviteLink(roomId));
    }
  };

  const exit = async () => {
    leaveVoice();
    closeAllStreams();
    if (isHost) await removeCloud();
    onLeave();
  };

  // API siempre actualizada para los handlers del canal
  apiRef.current = {
    onSync, onVideoUrl, onVideoStream, onVideoLocal, onRequestState, handleSignal, handleVoice,
    handleVsig, pruneGone, maybeConnect, streamTo, hostState, applyLocal,
  };

  /* ---------- Efectos ---------- */
  useEffect(() => {
    iceReadyRef.current = loadIceServers().then((s) => { iceRef.current = s; });
  }, []);

  useEffect(() => {
    const ch = supabase.channel(`watch-party:${roomId}`, {
      config: { broadcast: { self: false, ack: false }, presence: { key: me } },
    });
    channelRef.current = ch;
    const api = () => apiRef.current;

    ch.on('broadcast', { event: 'chat' }, ({ payload }) => setMessages((m) => [...m.slice(-199), payload]));
    ch.on('broadcast', { event: 'sync' }, ({ payload }) => api().onSync(payload));
    ch.on('broadcast', { event: 'video-url' }, ({ payload }) => api().onVideoUrl(payload));
    ch.on('broadcast', { event: 'video-stream' }, ({ payload }) => api().onVideoStream(payload));
    ch.on('broadcast', { event: 'video-local' }, ({ payload }) => api().onVideoLocal(payload));
    ch.on('broadcast', { event: 'roles' }, ({ payload }) => {
      if (payload.to && payload.to !== me) return;
      setMods(payload.mods || []);
    });
    ch.on('broadcast', { event: 'request-state' }, ({ payload }) => api().onRequestState(payload));
    ch.on('broadcast', { event: 'signal' }, ({ payload }) => api().handleSignal(payload));
    ch.on('broadcast', { event: 'vsig' }, ({ payload }) => api().handleVsig(payload));
    ch.on('broadcast', { event: 'voice' }, ({ payload }) => api().handleVoice(payload));
    ch.on('presence', { event: 'sync' }, () => {
      const list = Object.entries(ch.presenceState()).map(([id, metas]) => ({ id, ...metas[0] }));
      setParticipants(list);
      api().pruneGone(new Set(list.map((p) => p.id)));
    });

    ch.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setConnected(true);
        await ch.track(presenceRef.current);
        if (!isHost) ch.send({ type: 'broadcast', event: 'request-state', payload: { from: me } });
      } else if (['CLOSED', 'CHANNEL_ERROR', 'TIMED_OUT'].includes(status)) {
        setConnected(false);
      }
    });

    return () => {
      [...pcsRef.current.keys()].forEach((id) => closePeer(id));
      [...streamPcsRef.current.keys()].forEach((id) => closeStreamPc(id));
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      supabase.removeChannel(ch);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // Reproductor de YouTube (API oficial IFrame)
  useEffect(() => {
    if (mode !== 'youtube' || !ytId) return undefined;
    let cancelled = false;
    let poll;
    loadYT().then((YT) => {
      if (cancelled || !ytHolderRef.current) return;
      const el = document.createElement('div');
      ytHolderRef.current.innerHTML = '';
      ytHolderRef.current.appendChild(el);
      ytRef.current = null;
      const player = new YT.Player(el, {
        videoId: ytId,
        width: '100%',
        height: '100%',
        playerVars: { controls: 0, disablekb: 1, fs: 0, modestbranding: 1, rel: 0, playsinline: 1, iv_load_policy: 3 },
        events: {
          onReady: () => {
            if (cancelled) return;
            ytRef.current = player;
            setDuration(player.getDuration() || 0);
            if (pendingSyncRef.current) {
              const p = pendingSyncRef.current;
              pendingSyncRef.current = null;
              apiRef.current.applyLocal(p);
            }
          },
          onStateChange: (e) => setPlaying(e.data === 1),
          onError: () => setNotice('YouTube no permite reproducir este video fuera de su página. Prueba con otro enlace.'),
        },
      });
      poll = setInterval(() => {
        const y = ytRef.current;
        if (!y || !y.getCurrentTime) return;
        setCurrent(y.getCurrentTime());
        const d = y.getDuration();
        if (d) setDuration(d);
      }, 500);
    });
    return () => {
      cancelled = true;
      clearInterval(poll);
      try { ytRef.current && ytRef.current.destroy && ytRef.current.destroy(); } catch { /* nada */ }
      ytRef.current = null;
      if (ytHolderRef.current) ytHolderRef.current.innerHTML = '';
    };
  }, [mode, ytId]);

  // Invitadas en transmisión en vivo: conectar la imagen recibida al reproductor
  useEffect(() => {
    const v = videoRef.current;
    if (mode === 'stream' && !isHost && v && remoteVideo) {
      v.srcObject = remoteVideo;
      v.play().then(() => setNeedsTap(false)).catch(() => setNeedsTap(true));
    }
  }, [remoteVideo, mode]);

  // Invitadas en transmisión en vivo: avanzar el reloj entre latidos
  useEffect(() => {
    if (!(mode === 'stream' && !isHost && playing)) return undefined;
    const id = setInterval(() => setCurrent((c) => c + 0.25), 250);
    return () => clearInterval(id);
  }, [mode, playing]);

  // Latido de la anfitriona: corrige la deriva de todas
  useEffect(() => {
    if (!isHost) return undefined;
    const id = setInterval(() => {
      const s = apiRef.current.hostState();
      if (s) send('sync', { action: 'state', ...s, from: me });
    }, 4000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost]);

  useEffect(() => { chatEndRef.current && chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [messages]);

  useEffect(() => {
    const h = () => {
      const on = !!(document.fullscreenElement || document.webkitFullscreenElement);
      setNativeFs(on);
      if (!on) { try { window.screen.orientation && window.screen.orientation.unlock && window.screen.orientation.unlock(); } catch { /* nada */ } }
    };
    document.addEventListener('fullscreenchange', h);
    document.addEventListener('webkitfullscreenchange', h);
    return () => {
      document.removeEventListener('fullscreenchange', h);
      document.removeEventListener('webkitfullscreenchange', h);
    };
  }, []);

  useEffect(() => {
    if (!pseudoFs) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const esc = (e) => e.key === 'Escape' && setPseudoFs(false);
    window.addEventListener('keydown', esc);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', esc); };
  }, [pseudoFs]);

  /* ---------- Render ---------- */
  const failedPeers = Object.values(peerStatus).some((s) => s === 'failed');
  const roleOf = (p) => (p.host ? 'Anfitriona' : mods.includes(p.id) ? 'Moderadora' : 'Invitada');

  return (
    <div className={`cielo ${playing ? 'vivo' : ''}`}>
      {Object.entries(remoteStreams).map(([id, stream]) => (
        <RemoteAudio key={id} stream={stream} onBlocked={() => setAudioBlocked(true)} />
      ))}

      <header className="max-w-[1400px] mx-auto flex flex-wrap items-center gap-3 px-4 pt-4 pb-3">
        <span className="logo" />
        <h1 className="fx-display text-2xl leading-none">Cine Miraculous</h1>
        <span className="pill">Sala {roomId}</span>
        <span className="pill">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-[var(--gato)]' : 'bg-amber-400'}`} />
          {connected ? 'Conectada' : 'Conectando…'}
        </span>
        <div className="ml-auto flex gap-2">
          <button className="btn" onClick={copyInvite}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copiado' : 'Copiar invitación'}
          </button>
          <button className="btn btn-tinta" onClick={exit}>
            <LogOut size={16} /> Salir
          </button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto grid gap-5 px-4 pb-28 lg:grid-cols-[minmax(0,1fr)_390px]">
        {/* ---------------- Columna de la película ---------------- */}
        <section className="min-w-0 space-y-4">
          <div
            ref={containerRef}
            className={isFs ? 'isfs fixed inset-0 z-[9999] bg-black' : 'relative'}
            style={isFs ? { height: '100dvh' } : undefined}
          >
            {!isFs && <div className="bulbs mb-1" />}
            <div
              className={`pantalla ${isFs ? '' : 'aspect-video'}`}
              onPointerMove={poke}
              onTouchStart={poke}
            >
              {mode === 'none' && (
                <div className="absolute inset-0 lunares flex items-center justify-center p-6">
                  <div className="bg-[var(--tinta)] text-white rounded-3xl px-6 py-5 text-center max-w-xs">
                    <p className="fx-display text-xl mb-1">Aún no hay película</p>
                    <p className="text-sm text-[var(--tenue)]">
                      {isHost
                        ? 'Comparte un archivo, sube un video o pega un enlace de YouTube.'
                        : 'Esperando a que la anfitriona ponga algo.'}
                    </p>
                  </div>
                </div>
              )}

              {(mode === 'file' || mode === 'stream') && (
                <video
                  key={mode === 'stream' && !isHost ? 'stream' : videoSrc}
                  ref={videoRef}
                  src={mode === 'file' || isHost ? videoSrc : undefined}
                  playsInline
                  autoPlay={liveGuest}
                  preload="auto"
                  className="absolute inset-0 w-full h-full object-contain bg-black"
                  onClick={() => (canControl ? togglePlay() : poke())}
                  onTimeUpdate={(e) => { if (!liveGuest) setCurrent(e.currentTarget.currentTime); }}
                  onLoadedMetadata={(e) => {
                    if (liveGuest) return;
                    setDuration(e.currentTarget.duration);
                    if (pendingSyncRef.current) {
                      const p = pendingSyncRef.current;
                      pendingSyncRef.current = null;
                      applyLocal(p);
                    }
                  }}
                  onLoadedData={() => { if (isHost && mode === 'stream') streamAll(); }}
                  onPlay={() => {
                    if (liveGuest) return;
                    setPlaying(true);
                    if (isHost && mode === 'stream') streamAll(true);
                  }}
                  onPause={() => { if (!liveGuest) setPlaying(false); }}
                />
              )}

              {mode === 'youtube' && (
                <>
                  <div ref={ytHolderRef} className="yt-holder absolute inset-0" />
                  <div className="absolute inset-0 z-[5]" onClick={() => (canControl ? togglePlay() : poke())} />
                </>
              )}

              {liveGuest && !remoteVideo && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/80 text-center px-6">
                  <Loader2 className="animate-spin" />
                  <p className="text-sm">Conectando con la transmisión de la anfitriona…</p>
                </div>
              )}

              {needsTap && (
                <button
                  className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-black/75 text-lg font-bold"
                  onClick={unlock}
                >
                  <Play /> Toca para unirte a la función
                </button>
              )}

              <div
                className={`absolute inset-x-0 bottom-0 z-20 px-4 pb-3 pt-12 transition-opacity duration-200 ${controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                style={{ background: 'linear-gradient(to top, rgba(11,10,22,.94), transparent)' }}
              >
                <input
                  type="range"
                  className="barra"
                  aria-label="Posición del video"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={Math.min(current, duration || 0)}
                  disabled={!canControl || mode === 'none'}
                  style={{ '--p': `${pct}%` }}
                  onChange={(e) => seekTo(parseFloat(e.target.value), true)}
                  onMouseUp={(e) => seekTo(parseFloat(e.currentTarget.value))}
                  onTouchEnd={(e) => seekTo(parseFloat(e.currentTarget.value))}
                />
                <div className="flex items-center gap-2 mt-2">
                  <button className="btn btn-sm bg-transparent" disabled={!canControl || mode === 'none'} onClick={() => skip(-10)} aria-label="Retroceder 10 segundos">
                    <SkipBack size={20} />
                  </button>
                  <button className="btn btn-rojo !rounded-full !p-3" disabled={!canControl || mode === 'none'} onClick={togglePlay} aria-label={playing ? 'Pausar' : 'Reproducir'}>
                    {playing ? <Pause size={20} /> : <Play size={20} />}
                  </button>
                  <button className="btn btn-sm bg-transparent" disabled={!canControl || mode === 'none'} onClick={() => skip(10)} aria-label="Adelantar 10 segundos">
                    <SkipForward size={20} />
                  </button>
                  <span className="text-sm tabular-nums ml-1">{fmt(current)} / {fmt(duration)}</span>
                  {!canControl && <span className="text-xs text-[var(--tenue)] ml-2 hidden sm:inline">Controlan la anfitriona y las moderadoras</span>}
                  <button className="btn btn-sm bg-transparent ml-auto" onClick={toggleFs} aria-label="Pantalla completa">
                    {isFs ? <Minimize size={20} /> : <Maximize size={20} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Fuente del video */}
          {(isHost || videoLabel || notice) && (
            <div className="panel p-4 space-y-3">
              {videoLabel && <p className="text-sm text-[var(--tenue)] truncate">Reproduciendo: <span className="text-[var(--luna)]">{videoLabel}</span></p>}
              {isHost && mode === 'stream' && (
                <p className="text-sm text-[var(--gato)]">
                  Transmitiendo en vivo a {liveCount} {liveCount === 1 ? 'persona' : 'personas'}. No cierres esta pestaña.
                </p>
              )}
              {notice && <p className="text-sm text-amber-300">{notice}</p>}

              {isHost && (
                <>
                  <div className="flex flex-wrap gap-2">
                    <label className="btn btn-rojo cursor-pointer">
                      <Cast size={16} /> Compartir archivo en vivo
                      <input type="file" accept="video/*" className="hidden" onChange={loadLocalFile} />
                    </label>
                    <label className={`btn cursor-pointer ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
                      {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                      {uploading ? 'Subiendo… no cierres la página' : 'Subir video a la nube'}
                      <input type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) uploadVideo(f); }} />
                    </label>
                    {hasCloud && (
                      <button className="btn" onClick={removeCloud}>
                        <Trash2 size={16} /> Borrar de la nube
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      className="campo-noche"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && loadUrl()}
                      placeholder="Enlace de YouTube o de un video directo (MP4)"
                    />
                    <button className="btn btn-tinta shrink-0" onClick={loadUrl}>
                      <LinkIcon size={16} /> Cargar
                    </button>
                  </div>
                  <p className="text-xs text-[var(--tenue)]">
                    En vivo: tu archivo se ve en las pantallas de todas al instante, sin subirlo (mejor desde computadora con Chrome, Edge o Firefox; usa audífonos). La nube tiene un máximo de {MAX_UPLOAD_MB} MB y se borra al salir.
                  </p>
                </>
              )}

              {!isHost && localNeeded && (
                <label className="btn btn-rojo cursor-pointer w-fit">
                  <FileVideo size={16} /> Elegir mi archivo
                  <input type="file" accept="video/*" className="hidden" onChange={loadLocalFile} />
                </label>
              )}
            </div>
          )}
        </section>

        {/* ---------------- Columna social ---------------- */}
        <aside className="min-w-0 space-y-5">
          {/* En la sala */}
          <div className="panel p-4">
            <h2 className="fx-display text-lg mb-3">En la sala ({participants.length})</h2>
            <ul className="space-y-3 max-h-64 overflow-y-auto scroll-fino pr-1">
              {participants.map((p) => {
                const isMod = mods.includes(p.id);
                const st = peerStatus[p.id];
                return (
                  <li key={p.id} className="flex items-center gap-3">
                    <Avatar name={p.name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-sm font-bold">
                        <span className="truncate">{p.name}{p.id === me ? ' (tú)' : ''}</span>
                        {p.host && <span title="Anfitriona"><Crown size={14} className="text-[#F8C537]" /></span>}
                        {isMod && <span title="Moderadora"><ShieldCheck size={14} className="text-[var(--gato)]" /></span>}
                      </div>
                      <div className="text-xs text-[var(--tenue)] flex flex-wrap gap-x-2">
                        <span>{roleOf(p)}</span>
                        {p.voice && <span className={p.muted ? 'text-[#FF9AA0]' : 'text-[var(--gato)]'}>{p.muted ? 'micrófono apagado' : 'en la llamada'}</span>}
                        {inVoice && p.voice && p.id !== me && st === 'connected' && <span className="text-[var(--gato)]">voz conectada</span>}
                        {inVoice && p.voice && p.id !== me && st === 'connecting' && <span className="text-amber-300">conectando voz…</span>}
                        {inVoice && p.voice && p.id !== me && st === 'failed' && <span className="text-[#FF9AA0]">sin conexión de voz</span>}
                      </div>
                    </div>
                    {p.voice && (p.muted ? <MicOff size={16} className="text-[#FF9AA0] shrink-0" /> : <Mic size={16} className="text-[var(--gato)] shrink-0" />)}
                    {isHost && p.id !== me && (
                      <button
                        className={`btn btn-sm ${isMod ? 'btn-gato' : ''}`}
                        onClick={() => toggleMod(p.id)}
                        aria-label={isMod ? `Quitar moderadora a ${p.name}` : `Hacer moderadora a ${p.name}`}
                        title={isMod ? 'Quitar moderadora' : 'Hacer moderadora'}
                      >
                        {isMod ? <ShieldCheck size={16} /> : <Shield size={16} />}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Voz */}
          <div className="panel p-4">
            <h2 className="fx-display text-lg mb-3">Llamada de voz</h2>
            {!inVoice ? (
              <button className="btn btn-gato w-full" onClick={joinVoice}>
                <PhoneCall size={18} /> Entrar a la llamada de voz
              </button>
            ) : (
              <div className="flex gap-2">
                <button className={`btn flex-1 ${muted ? 'btn-rojo' : ''}`} onClick={toggleMute}>
                  {muted ? <><MicOff size={18} /> Activar micrófono</> : <><Mic size={18} /> Mutear micrófono</>}
                </button>
                <button className="btn btn-tinta" onClick={leaveVoice} aria-label="Salir de la llamada">
                  <PhoneOff size={18} />
                </button>
              </div>
            )}
            {voiceError && <p className="text-sm text-[#FF9AA0] mt-3">{voiceError}</p>}
            {audioBlocked && (
              <button className="btn btn-rojo w-full mt-3" onClick={enableAudio}>
                <Volume2 size={18} /> Toca para activar el audio
              </button>
            )}
            {failedPeers && !TURN_CREDENTIALS_URL && (
              <p className="text-xs text-amber-300 mt-3">
                Algunas conexiones no lograron enlazarse. Con datos móviles o ciertas redes hace falta un servidor TURN (configúralo en config.js).
              </p>
            )}
          </div>

          {/* Charla */}
          <div className="panel flex flex-col h-[52vh] lg:h-[calc(100dvh-560px)] lg:min-h-[300px]">
            <h2 className="fx-display text-lg px-4 pt-4 pb-2">Charla</h2>
            <div className="flex-1 overflow-y-auto scroll-fino px-4 space-y-2">
              {messages.length === 0 && <p className="text-sm text-[var(--tenue)] pt-2">Escribe el primer mensaje.</p>}
              {messages.map((m) => {
                const mine = m.from === me;
                return (
                  <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                    {!mine && <span className="text-[11px] text-[var(--tenue)] px-1">{m.name}</span>}
                    <div className={`burbuja ${mine ? 'burbuja-mia' : ''}`}>{m.text}</div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={sendChat} className="p-3 flex gap-2">
              <input
                className="campo-noche"
                value={chatInput}
                maxLength={500}
                placeholder="Escribe un mensaje"
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button type="submit" className="btn btn-rojo shrink-0" aria-label="Enviar mensaje">
                <Send size={18} />
              </button>
            </form>
          </div>
        </aside>
      </main>
    </div>
  );
}