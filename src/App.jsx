// Tailwind por CDN + estilos propios inyectados desde este archivo.
import { useEffect, useRef, useState } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Maximize, Minimize, Copy, Check, Mic, MicOff,
  PhoneCall, PhoneOff, Send, Crown, ShieldCheck, Shield, LogOut, Upload, FileVideo,
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

let youtubeApiPromise;

const loadYouTubeAPI = () => {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT);
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.onerror = reject;
      document.head.appendChild(script);
    }
  });

  return youtubeApiPromise;
};

const getYouTubeId = (url) => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');

    let id = null;

    if (host === 'youtu.be') {
      id = parsed.pathname.split('/')[1];
    } else if (['youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(host)) {
      if (parsed.pathname === '/watch') {
        id = parsed.searchParams.get('v');
      } else {
        const match = parsed.pathname.match(/^\/(?:embed|shorts)\/([^/?]+)/);
        id = match?.[1] || null;
      }
    }

    return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
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
    const p = el.play?.();
    if (p && p.catch) p.catch(() => onBlocked?.());
  }, [stream]);
  return <audio ref={ref} autoPlay playsInline />;
}

function YouTubePlayer({ videoId, playerRef, onReady, onStateChange, onError }) {
  const elementRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let instance;

    const initialize = async () => {
      try {
        const YT = await loadYouTubeAPI();
        if (cancelled || !elementRef.current) return;

        instance = new YT.Player(elementRef.current, {
          videoId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            playsinline: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => {
              if (cancelled) return;

              instanceRef.current = event.target;
              playerRef.current = event.target;

              onReady?.(event.target);
            },
            onStateChange: (event) => {
              if (!cancelled) onStateChange?.(event);
            },
            onError: (event) => {
              if (!cancelled) onError?.(event);
            },
          },
        });

        instanceRef.current = instance;
      } catch (error) {
        if (!cancelled) onError?.(error);
      }
    };

    initialize();

    return () => {
      cancelled = true;

      if (playerRef.current === instanceRef.current) {
        playerRef.current = null;
      }

      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, [videoId]);

  return (
    <div className="absolute inset-0 w-full h-full bg-black">
      <div ref={elementRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
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
          <div className="lunares h-14 rounded-t-[24px] flex items-end px-5 pb-0">
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
  const htmlVideoRef = useRef(null);
  const containerRef = useRef(null);
  const chatEndRef = useRef(null);
  const pcsRef = useRef(new Map());
  const pendingIceRef = useRef(new Map());
  const voicePeersRef = useRef(new Set());
  const retriesRef = useRef(new Map());
  const localStreamRef = useRef(null);
  const iceRef = useRef(STUN);
  const presenceRef = useRef({ name, host: isHost, voice: false, muted: false });
  const pendingSyncRef = useRef(null);
  const lastSeekSentRef = useRef(0);
  const lastActRef = useRef(0);
  const objectUrlRef = useRef(null);
  const urlSrcRef = useRef(null); // { url, label } cuando es nube o enlace
  const localNameRef = useRef('');
  const cloudPathRef = useRef('');
  const hideRef = useRef(null);
  const youtubePlayerRef = useRef(null);
  const youtubeReadyRef = useRef(false);

  // Estado
  const [participants, setParticipants] = useState([]);
  const [mods, setMods] = useState(() => {
    if (!isHost) return [];
    try { return JSON.parse(sessionStorage.getItem(`wp-mods-${roomId}`) || '[]'); } catch { return []; }
  });
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [videoSrc, setVideoSrc] = useState('');
  const [videoLabel, setVideoLabel] = useState('');
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

  const youtubeId = getYouTubeId(videoSrc);
  const isYouTube = Boolean(youtubeId);

  const canControl = isHost || mods.includes(me);
  const isFs = nativeFs || pseudoFs;
  const pct = duration ? Math.min(100, (current / duration) * 100) : 0;
  const controlsVisible = ctrlVisible || !playing || !videoSrc;

  /* ---------- Helpers de canal ---------- */
  const send = (event, payload = {}) => channelRef.current?.send({ type: 'broadcast', event, payload });
  const updatePresence = (patch) => {
    presenceRef.current = { ...presenceRef.current, ...patch };
    channelRef.current?.track(presenceRef.current);
  };

  /* ---------- Video ---------- */
  const setSource = (url, label) => {
    youtubeReadyRef.current = false;
    youtubePlayerRef.current = null;
    htmlVideoRef.current = null;
    pendingSyncRef.current = null;

    setVideoSrc(url);
    setVideoLabel(label);
    setCurrent(0);
    setDuration(0);
    setPlaying(false);
    setNeedsTap(false);
  };

  const getActiveVideo = () => {
    if (isYouTube) {
      const player = youtubePlayerRef.current;

      if (!player || !youtubeReadyRef.current) return null;

      return {
        src: videoSrc,
        readyState: 1,
        get currentTime() {
          return player.getCurrentTime();
        },
        set currentTime(value) {
          player.seekTo(value, true);
        },
        get paused() {
          return player.getPlayerState() !== 1;
        },
        play() {
          player.playVideo();
          return Promise.resolve();
        },
        pause() {
          player.pauseVideo();
        },
      };
    }

    return htmlVideoRef.current;
  };

  const handleYouTubeReady = (player) => {
    youtubePlayerRef.current = player;
    youtubeReadyRef.current = true;

    setDuration(player.getDuration());
    setCurrent(player.getCurrentTime());

    if (pendingSyncRef.current) {
      const pending = pendingSyncRef.current;
      pendingSyncRef.current = null;
      applySync(pending);
    }
  };

  const handleYouTubeState = (event) => {
    if (event.data === 1) {
      setPlaying(true);
      setNeedsTap(false);
    } else if (event.data === 2 || event.data === 0) {
      setPlaying(false);
    }

    if (youtubePlayerRef.current) {
      setCurrent(youtubePlayerRef.current.getCurrentTime());
      setDuration(youtubePlayerRef.current.getDuration());
    }
  };

  const applySync = (p) => {
    const v = getActiveVideo();

    if (!v || !v.src || v.readyState < 1) {
      pendingSyncRef.current = p;
      return;
    }

    const tryPlay = () => v.play()
      .then(() => setNeedsTap(false))
      .catch(() => setNeedsTap(true));

    if (p.action === 'play') {
      v.currentTime = p.time;
      tryPlay();
    } else if (p.action === 'pause') {
      v.pause();
      v.currentTime = p.time;
    } else if (p.action === 'seek') {
      v.currentTime = p.time;
    } else if (p.action === 'state') {
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
    if (p.from === me) return;
    if (p.action === 'state' && Date.now() - lastActRef.current < 1800) return;
    applySync(p);
  };

  const act = (action, time) => {
    lastActRef.current = Date.now();
    send('sync', { action, time, from: me });
  };

  const togglePlay = () => {
    const v = getActiveVideo();
    if (!canControl || !v || !v.src) return;

    if (v.paused) {
      v.play().catch(() => {});
      act('play', v.currentTime);
    } else {
      v.pause();
      act('pause', v.currentTime);
    }
  };

  const seekTo = (t, throttle = false) => {
    const v = getActiveVideo();
    if (!canControl || !v || !v.src) return;

    const time = Math.max(0, Math.min(duration || t, t));

    v.currentTime = time;
    setCurrent(time);

    const now = Date.now();
    if (throttle && now - lastSeekSentRef.current < 150) return;

    lastSeekSentRef.current = now;
    act('seek', time);
  };

  const skip = (d) => {
    const v = getActiveVideo();
    if (v) seekTo(v.currentTime + d);
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
    setPseudoFs(true);
  };

  /* ---------- Fuente de video: nube, enlace, local ---------- */
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
      setNotice(`El archivo pesa ${mb.toFixed(0)} MB y el límite es ${MAX_UPLOAD_MB} MB. Comprímelo (MP4 H.264) o usa un enlace directo.`);
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
      setSource(data.publicUrl, file.name);
      send('video-url', { url: data.publicUrl, label: file.name });
    } catch (e) {
      setNotice(`No se pudo subir el video: ${e.message || e}`);
    }
    setUploading(false);
  };

  const loadUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    urlSrcRef.current = { url, label: url };
    localNameRef.current = '';
    setSource(url, url);
    setUrlInput('');
    send('video-url', { url, label: url });
  };

  const loadLocalFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setSource(url, file.name);
    setNotice('');
    setLocalNeeded(false);
    if (isHost) {
      urlSrcRef.current = null;
      localNameRef.current = file.name;
      send('video-local', { name: file.name });
    }
  };

  const onVideoUrl = (p) => {
    if (isHost) return;
    setSource(p.url, p.label || p.url);
    setNotice('');
    setLocalNeeded(false);
  };

  const onVideoLocal = (p) => {
    if (isHost) return;
    setNotice(`La anfitriona puso el archivo «${p.name}» desde su dispositivo. Elige el mismo archivo en el tuyo.`);
    setLocalNeeded(true);
  };

  const onRequestState = () => {
    if (!isHost) return;

    if (urlSrcRef.current) send('video-url', urlSrcRef.current);
    else if (localNameRef.current) send('video-local', { name: localNameRef.current });

    send('roles', { mods });

    const v = getActiveVideo();

    if (v && v.src) {
      send('sync', {
        action: 'state',
        time: v.currentTime,
        playing: !v.paused,
        from: me,
      });
    }
  };

  /* ---------- Moderadoras ---------- */
  const toggleMod = (id) => {
    const next = mods.includes(id) ? mods.filter((m) => m !== id) : [...mods, id];
    setMods(next);
    sessionStorage.setItem(`wp-mods-${roomId}`, JSON.stringify(next));
    send('roles', { mods: next });
  };

  /* ---------- WebRTC ---------- */
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

  const maybeConnect = (peerId) => {
    if (!localStreamRef.current || !voicePeersRef.current.has(peerId)) return;
    if (pcsRef.current.has(peerId)) return;
    if (me < peerId) createPeer(peerId, true);
  };

  const flushIce = async (peerId, pc) => {
    const queue = pendingIceRef.current.get(peerId) || [];
    pendingIceRef.current.delete(peerId);
    for (const c of queue) {
      try { await pc.addIceCandidate(c); } catch (e) { console.warn(e); }
    }
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
        await flushIce(from, pc);
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
          await flushIce(from, pc);
        }
      } else if (kind === 'ice') {
        const pc = pcsRef.current.get(from);
        if (pc && pc.remoteDescription) await pc.addIceCandidate(data);
        else pendingIceRef.current.set(from, [...(pendingIceRef.current.get(from) || []), data]);
      }
    } catch (e) {
      console.error('Señalización', e);
    }
  };

  const pruneGone = (ids) => {
    [...pcsRef.current.keys()].forEach((id) => { if (!ids.has(id)) closePeer(id); });
    [...voicePeersRef.current].forEach((id) => { if (!ids.has(id)) voicePeersRef.current.delete(id); });
  };

  const joinVoice = async () => {
    setVoiceError('');
    try {
      iceRef.current = await loadIceServers();
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
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
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
    if (isHost) await removeCloud();
    onLeave();
  };

  apiRef.current = { onSync, onVideoUrl, onVideoLocal, onRequestState, handleSignal, handleVoice, pruneGone, maybeConnect };

  /* ---------- Efectos ---------- */
  useEffect(() => {
    const ch = supabase.channel(`watch-party:${roomId}`, {
      config: { broadcast: { self: false, ack: false }, presence: { key: me } },
    });
    channelRef.current = ch;
    const api = () => apiRef.current;

    ch.on('broadcast', { event: 'chat' }, ({ payload }) => setMessages((m) => [...m.slice(-199), payload]));
    ch.on('broadcast', { event: 'sync' }, ({ payload }) => api().onSync(payload));
    ch.on('broadcast', { event: 'video-url' }, ({ payload }) => api().onVideoUrl(payload));
    ch.on('broadcast', { event: 'video-local' }, ({ payload }) => api().onVideoLocal(payload));
    ch.on('broadcast', { event: 'roles' }, ({ payload }) => setMods(payload.mods || []));
    ch.on('broadcast', { event: 'request-state' }, () => api().onRequestState());
    ch.on('broadcast', { event: 'signal' }, ({ payload }) => api().handleSignal(payload));
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
        if (!isHost) ch.send({ type: 'broadcast', event: 'request-state', payload: {} });
      } else if (['CLOSED', 'CHANNEL_ERROR', 'TIMED_OUT'].includes(status)) {
        setConnected(false);
      }
    });

    return () => {
      [...pcsRef.current.keys()].forEach((id) => closePeer(id));
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      supabase.removeChannel(ch);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useEffect(() => {
    if (!isHost) return;

    const id = setInterval(() => {
      const v = getActiveVideo();

      if (v && v.src && v.readyState >= 1) {
        send('sync', {
          action: 'state',
          time: v.currentTime,
          playing: !v.paused,
          from: me,
        });
      }
    }, 4000);

    return () => clearInterval(id);
  }, [isHost, isYouTube, videoSrc]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [messages]);

  useEffect(() => {
    const h = () => {
      const on = !!(document.fullscreenElement || document.webkitFullscreenElement);
      setNativeFs(on);
      if (!on) { try { window.screen.orientation?.unlock?.(); } catch { /* nada */ } }
    };
    document.addEventListener('fullscreenchange', h);
    document.addEventListener('webkitfullscreenchange', h);
    return () => {
      document.removeEventListener('fullscreenchange', h);
      document.removeEventListener('webkitfullscreenchange', h);
    };
  }, []);

  useEffect(() => {
    if (!pseudoFs) return;
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
              {videoSrc ? (
                isYouTube ? (
                  <YouTubePlayer
                    key={youtubeId}
                    videoId={youtubeId}
                    playerRef={youtubePlayerRef}
                    onReady={handleYouTubeReady}
                    onStateChange={handleYouTubeState}
                    onError={() => setNotice('Error al reproducir el video de YouTube')}
                  />
                ) : (
                  <video
                    key={videoSrc}
                    ref={htmlVideoRef}
                    src={videoSrc}
                    playsInline
                    preload="auto"
                    className="absolute inset-0 w-full h-full object-contain bg-black"
                    onClick={() => (canControl ? togglePlay() : poke())}
                    onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
                    onLoadedMetadata={(e) => {
                      setDuration(e.currentTarget.duration);
                      if (pendingSyncRef.current) {
                        const p = pendingSyncRef.current;
                        pendingSyncRef.current = null;
                        applySync(p);
                      }
                    }}
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                  />
                )
              ) : (
                <div className="absolute inset-0 lunares flex items-center justify-center p-6">
                  <div className="bg-[var(--tinta)] text-white rounded-3xl px-6 py-5 text-center max-w-xs">
                    <p className="fx-display text-xl mb-1">Aún no hay película</p>
                    <p className="text-sm text-[var(--tenue)]">
                      {isHost
                        ? 'Sube un episodio o pega un enlace para empezar.'
                        : 'Esperando a que la anfitriona ponga algo.'}
                    </p>
                  </div>
                </div>
              )}

              {needsTap && (
                <button
                  className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-black/75 text-lg font-bold"
                  onClick={() => {
                    const v = getActiveVideo();
                    v?.play().then(() => setNeedsTap(false)).catch(() => {});
                  }}
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
                  value={current}
                  disabled={!canControl || !videoSrc}
                  style={{ '--p': `${pct}%` }}
                  onChange={(e) => seekTo(parseFloat(e.target.value), true)}
                  onMouseUp={(e) => seekTo(parseFloat(e.currentTarget.value))}
                  onTouchEnd={(e) => seekTo(parseFloat(e.currentTarget.value))}
                />
                <div className="flex items-center gap-2 mt-2">
                  <button className="btn btn-sm bg-transparent" disabled={!canControl || !videoSrc} onClick={() => skip(-10)} aria-label="Retroceder 10 segundos">
                    <SkipBack size={20} />
                  </button>
                  <button className="btn btn-rojo !rounded-full !p-3" disabled={!canControl || !videoSrc} onClick={togglePlay} aria-label={playing ? 'Pausar' : 'Reproducir'}>
                    {playing ? <Pause size={20} /> : <Play size={20} />}
                  </button>
                  <button className="btn btn-sm bg-transparent" disabled={!canControl || !videoSrc} onClick={() => skip(10)} aria-label="Adelantar 10 segundos">
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
              {notice && <p className="text-sm text-amber-300">{notice}</p>}

              {isHost && (
                <>
                  <div className="flex flex-wrap gap-2">
                    <label className={`btn btn-rojo cursor-pointer ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
                      {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                      {uploading ? 'Subiendo… no cierres la página' : 'Subir video a la nube'}
                      <input type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) uploadVideo(f); }} />
                    </label>
                    <label className="btn cursor-pointer">
                      <FileVideo size={16} /> Archivo local
                      <input type="file" accept="video/*" className="hidden" onChange={loadLocalFile} />
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
                      placeholder="Pega un enlace directo o de YouTube (ej. https://youtu.be/...)"
                    />
                    <button className="btn btn-tinta shrink-0" onClick={loadUrl}>
                      <LinkIcon size={16} /> Cargar
                    </button>
                  </div>
                  <p className="text-xs text-[var(--tenue)]">
                    Puedes subir archivos, pegar enlaces directos MP4 o enlaces de YouTube para verlos en sincronía con tus amigas.
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
          {/* Palco */}
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
