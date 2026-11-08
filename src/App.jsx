import { memo, useEffect, useRef, useState } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Maximize, Minimize, Copy, Check, Mic, MicOff,
  PhoneCall, PhoneOff, Send, Crown, ShieldCheck, Shield, LogOut, Upload, FileVideo, Cast,
  Link as LinkIcon, Trash2, Volume2, VolumeX, Loader2, RefreshCw, Share2,
  PanelRightClose, PanelRightOpen, MessageCircle, Users, Headphones,
} from 'lucide-react';
import { supabase } from './supabaseClient';
import { BUCKET, MAX_UPLOAD_MB, TURN_CREDENTIALS_URL } from './config';

/* =====================================================================
   Utilidades
   ===================================================================== */
const STUN = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }];
const EMOJIS = ['🐞', '🐱', '❤️', '😂', '😮', '👏'];

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

// ID de un enlace de YouTube (watch, youtu.be, shorts, embed, live) o null
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

// API oficial de YouTube IFrame, se carga una sola vez y solo si hace falta
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

/* =====================================================================
   Componentes pequeños (memoizados para no repintarse con cada segundo del video)
   ===================================================================== */
const Avatar = memo(function Avatar({ name, size = 38 }) {
  const colors = ['#E8222E', '#7B61FF', '#F59E0B', '#14B8A6', '#EC4899'];
  let h = 0;
  for (const c of name || '?') h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (
    <span className="avatar" style={{ width: size, height: size, backgroundColor: colors[h % colors.length], fontSize: size * 0.42 }}>
      {(name || '?').trim().charAt(0).toUpperCase()}
    </span>
  );
});

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

const ChatPanel = memo(function ChatPanel({ messages, me, act, visible, className }) {
  const [text, setText] = useState('');
  const scrollRef = useRef(null);
  const stickRef = useRef(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [messages, visible]);

  const submit = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    act.sendChat(t);
    setText('');
    stickRef.current = true;
  };

  return (
    <div className={`panel flex flex-col ${className}`}>
      <h2 className="font-display text-lg px-4 pt-4 pb-2">Charla</h2>
      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="flex-1 overflow-y-auto scroll-fino px-4 space-y-2"
        aria-live="polite"
      >
        {messages.length === 0 && <p className="text-sm text-tenue pt-2">Escribe el primer mensaje.</p>}
        {messages.map((m) => {
          const mine = m.from === me;
          return (
            <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
              {!mine && <span className="text-[11px] text-tenue px-1">{m.name}</span>}
              <div className={`burbuja ${mine ? 'burbuja-mia' : ''}`}>{m.text}</div>
            </div>
          );
        })}
      </div>
      <form onSubmit={submit} className="p-3 flex gap-2">
        <input
          className="campo-noche"
          value={text}
          maxLength={500}
          placeholder="Escribe un mensaje"
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="btn btn-rojo shrink-0" aria-label="Enviar mensaje">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
});

const Palco = memo(function Palco({ participants, mods, peerStatus, inVoice, isHost, me, act, className }) {
  const roleOf = (p) => (p.host ? 'Anfitriona' : mods.includes(p.id) ? 'Moderadora' : 'Invitada');
  return (
    <div className={`panel p-4 ${className}`}>
      <h2 className="font-display text-lg mb-3">En la sala ({participants.length})</h2>
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
                  {p.host && <span title="Anfitriona"><Crown size={14} className="text-oro" /></span>}
                  {isMod && <span title="Moderadora"><ShieldCheck size={14} className="text-gato" /></span>}
                </div>
                <div className="text-xs text-tenue flex flex-wrap gap-x-2">
                  <span>{roleOf(p)}</span>
                  {p.voice && <span className={p.muted ? 'text-alerta' : 'text-gato'}>{p.muted ? 'micrófono apagado' : 'en la llamada'}</span>}
                  {inVoice && p.voice && p.id !== me && st === 'connected' && <span className="text-gato">voz conectada</span>}
                  {inVoice && p.voice && p.id !== me && st === 'connecting' && <span className="text-amber-300">conectando voz…</span>}
                  {inVoice && p.voice && p.id !== me && st === 'failed' && <span className="text-alerta">sin conexión de voz</span>}
                </div>
              </div>
              {p.voice && (p.muted ? <MicOff size={16} className="text-alerta shrink-0" /> : <Mic size={16} className="text-gato shrink-0" />)}
              {isHost && p.id !== me && (
                <button
                  className={`btn btn-sm ${isMod ? 'btn-gato' : ''}`}
                  onClick={() => act.toggleMod(p.id)}
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
  );
});

const VoicePanel = memo(function VoicePanel({ inVoice, muted, voiceError, audioBlocked, failedPeers, act, className }) {
  return (
    <div className={`panel p-4 ${className}`}>
      <h2 className="font-display text-lg mb-3">Llamada de voz</h2>
      {!inVoice ? (
        <button className="btn btn-gato w-full" onClick={() => act.joinVoice()}>
          <PhoneCall size={18} /> Entrar a la llamada de voz
        </button>
      ) : (
        <div className="flex gap-2">
          <button className={`btn flex-1 ${muted ? 'btn-rojo' : ''}`} onClick={() => act.toggleMute()}>
            {muted ? <><MicOff size={18} /> Activar micrófono</> : <><Mic size={18} /> Mutear micrófono</>}
          </button>
          <button className="btn btn-tinta" onClick={() => act.leaveVoice()} aria-label="Salir de la llamada">
            <PhoneOff size={18} />
          </button>
        </div>
      )}
      {voiceError && <p className="text-sm text-alerta mt-3">{voiceError}</p>}
      {audioBlocked && (
        <button className="btn btn-rojo w-full mt-3" onClick={() => act.enableAudio()}>
          <Volume2 size={18} /> Toca para activar el audio
        </button>
      )}
      {failedPeers && !TURN_CREDENTIALS_URL && (
        <p className="text-xs text-amber-300 mt-3">
          Algunas conexiones no lograron enlazarse. Con datos móviles o ciertas redes hace falta un servidor TURN (configúralo en config.js).
        </p>
      )}
    </div>
  );
});

/* =====================================================================
   App: lobby y sala
   ===================================================================== */
export default function App() {
  const urlRoom = new URLSearchParams(window.location.search).get('room');
  const [name, setName] = useState(() => localStorage.getItem('wp-name') || '');
  const [code, setCode] = useState('');
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');

  const enter = (roomId, createdByMe) => {
    const n = name.trim();
    if (!n) return setError('Escribe tu nombre para entrar');
    localStorage.setItem('wp-name', n);
    if (createdByMe) localStorage.setItem(`wp-host-${roomId}`, '1');
    const isHost = localStorage.getItem(`wp-host-${roomId}`) === '1';
    window.history.replaceState(null, '', `?room=${roomId}`);
    setSession({ roomId, name: n, isHost });
  };

  const joinWithCode = () => {
    const raw = code.trim();
    if (!raw) return;
    const m = raw.match(/room=([\w-]+)/);
    enter(m ? m[1] : raw.replace(/[^\w-]/g, ''), false);
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
          <h1 className="font-display text-4xl leading-none">Cine Miraculous</h1>
        </div>
        <p className="text-tenue mb-7 max-w-sm">
          Ve episodios con tus amigas, cada una desde su casa, y charlen mientras tanto.
        </p>

        <div className="boleto-a">
          <div className="lunares h-14 rounded-t-[24px] flex items-end px-5">
            <span className="bg-tinta text-white text-sm font-bold px-3 py-1 rounded-t-xl">Entrada para la función</span>
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
          {!urlRoom && (
            <div className="pt-2">
              <label className="block text-sm font-bold mb-1" htmlFor="codigo">¿Te invitaron? Pega el enlace o el código</label>
              <div className="flex gap-2">
                <input
                  id="codigo"
                  className="campo"
                  value={code}
                  placeholder="a1b2c3d4"
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && joinWithCode()}
                />
                <button className="btn btn-tinta shrink-0" onClick={joinWithCode}>Entrar</button>
              </div>
            </div>
          )}
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
  const act = useRef({}).current; // acciones siempre actualizadas, con identidad estable

  // Refs
  const channelRef = useRef(null);
  const videoRef = useRef(null);
  const ytRef = useRef(null);
  const ytHolderRef = useRef(null);
  const containerRef = useRef(null);
  const pcsRef = useRef(new Map());           // voz
  const pendingIceRef = useRef(new Map());
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
  const lastReactRef = useRef(0);
  const objectUrlRef = useRef(null);
  const urlSrcRef = useRef(null);
  const localNameRef = useRef('');
  const cloudPathRef = useRef('');
  const srcKeyRef = useRef('');
  const hideRef = useRef(null);
  const fsMsgRef = useRef(null);
  const participantsRef = useRef([]);
  const prevPartsRef = useRef(null);
  const readyRef = useRef(false);
  const modeRef = useRef('none');
  const tabRef = useRef('charla');

  // Estado
  const [participants, setParticipants] = useState([]);
  const [mods, setMods] = useState(() => {
    if (!isHost) return [];
    try { return JSON.parse(localStorage.getItem(`wp-mods-${roomId}`) || '[]'); } catch { return []; }
  });
  const [messages, setMessages] = useState([]);
  const [mode, setMode] = useState('none'); // none | file | youtube | stream
  const [videoSrc, setVideoSrc] = useState('');
  const [ytId, setYtId] = useState('');
  const [ytReady, setYtReady] = useState(false);
  const [videoLabel, setVideoLabel] = useState('');
  const [remoteVideo, setRemoteVideo] = useState(null);
  const [liveCount, setLiveCount] = useState(0);
  const [urlInput, setUrlInput] = useState('');
  const [notice, setNotice] = useState('');
  const [localNeeded, setLocalNeeded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hasCloud, setHasCloud] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    const v = parseFloat(localStorage.getItem('wp-vol'));
    return isFinite(v) ? v : 1;
  });
  const [filmMuted, setFilmMuted] = useState(false);
  const [nativeFs, setNativeFs] = useState(false);
  const [pseudoFs, setPseudoFs] = useState(false);
  const [theater, setTheater] = useState(false);
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
  const [floaters, setFloaters] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [fsMsg, setFsMsg] = useState(null);
  const [tab, setTab] = useState('charla');
  const [unread, setUnread] = useState(0);

  modeRef.current = mode;
  participantsRef.current = participants;
  tabRef.current = tab;

  const canControl = isHost || mods.includes(me);
  const liveGuest = mode === 'stream' && !isHost;
  const volumeAllowed = mode !== 'none' && !(mode === 'stream' && isHost);
  const isFs = nativeFs || pseudoFs;
  const pct = duration ? Math.min(100, (current / duration) * 100) : 0;
  const controlsVisible = ctrlVisible || !playing || mode === 'none';
  const hostGone = connected && participants.length > 0 && !participants.some((p) => p.host);

  /* ---------- Helpers de canal y avisos ---------- */
  const send = (event, payload = {}) => channelRef.current?.send({ type: 'broadcast', event, payload });
  const updatePresence = (patch) => {
    presenceRef.current = { ...presenceRef.current, ...patch };
    channelRef.current?.track(presenceRef.current);
  };
  const toast = (text) => {
    const id = newId();
    setToasts((t) => [...t.slice(-3), { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((q) => q.id !== id)), 4000);
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
    setBuffering(false);
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

  const resync = () => {
    send('request-state', { from: me });
    toast('Pidiendo sincronización a la anfitriona…');
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

  const toggleFilmMute = () => { if (volumeAllowed) setFilmMuted((m) => !m); };

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
    localStorage.setItem(`wp-mods-${roomId}`, JSON.stringify(next));
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
      if (attempt < 12) setTimeout(() => act.streamTo(peerId, attempt + 1), 500);
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
        if (n <= 3) setTimeout(() => act.streamTo(peerId), 2000);
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
        if (n <= 3) setTimeout(() => act.maybeConnect(peerId), 2000);
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

  /* ---------- Chat, reacciones e invitación ---------- */
  const onChat = (m) => {
    setMessages((ms) => [...ms.slice(-199), m]);
    if (tabRef.current !== 'charla' && window.innerWidth < 1024) setUnread((u) => u + 1);
    setFsMsg(m);
    clearTimeout(fsMsgRef.current);
    fsMsgRef.current = setTimeout(() => setFsMsg(null), 6000);
  };

  const sendChat = (text) => {
    const msg = { id: newId(), from: me, name, text, ts: Date.now() };
    setMessages((ms) => [...ms.slice(-199), msg]);
    send('chat', msg);
  };

  const addFloater = (emoji) => {
    if (!EMOJIS.includes(emoji)) return;
    const id = newId();
    setFloaters((f) => [...f.slice(-23), { id, emoji, x: 8 + Math.random() * 80 }]);
    setTimeout(() => setFloaters((f) => f.filter((q) => q.id !== id)), 2500);
  };

  const sendReaction = (emoji) => {
    const now = Date.now();
    if (now - lastReactRef.current < 120) return;
    lastReactRef.current = now;
    addFloater(emoji);
    send('react', { emoji, from: me });
  };

  const shareInvite = async () => {
    const url = inviteLink(roomId);
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Cine Miraculous', text: 'Ven a ver con nosotras', url });
        return;
      } catch (e) {
        if (e && e.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copia el enlace:', url);
    }
  };

  const exit = async () => {
    leaveVoice();
    closeAllStreams();
    if (isHost) await removeCloud();
    onLeave();
  };

  // Acciones con identidad estable y siempre con la versión más reciente
  Object.assign(act, {
    onSync, onChat, onVideoUrl, onVideoStream, onVideoLocal, onRequestState, handleSignal, handleVoice,
    handleVsig, pruneGone, maybeConnect, streamTo, hostState, applyLocal, addFloater, sendChat,
    joinVoice, leaveVoice, toggleMute, enableAudio, toggleMod, togglePlay, skip, toggleFs, toggleFilmMute,
  });

  /* ---------- Efectos ---------- */
  useEffect(() => {
    iceReadyRef.current = loadIceServers().then((s) => { iceRef.current = s; });
  }, []);

  useEffect(() => { document.title = `Sala ${roomId} · Cine Miraculous`; }, [roomId]);

  useEffect(() => {
    const ch = supabase.channel(`watch-party:${roomId}`, {
      config: { broadcast: { self: false, ack: false }, presence: { key: me } },
    });
    channelRef.current = ch;

    ch.on('broadcast', { event: 'chat' }, ({ payload }) => act.onChat(payload));
    ch.on('broadcast', { event: 'react' }, ({ payload }) => act.addFloater(payload.emoji));
    ch.on('broadcast', { event: 'sync' }, ({ payload }) => act.onSync(payload));
    ch.on('broadcast', { event: 'video-url' }, ({ payload }) => act.onVideoUrl(payload));
    ch.on('broadcast', { event: 'video-stream' }, ({ payload }) => act.onVideoStream(payload));
    ch.on('broadcast', { event: 'video-local' }, ({ payload }) => act.onVideoLocal(payload));
    ch.on('broadcast', { event: 'roles' }, ({ payload }) => {
      if (payload.to && payload.to !== me) return;
      setMods(payload.mods || []);
    });
    ch.on('broadcast', { event: 'request-state' }, ({ payload }) => act.onRequestState(payload));
    ch.on('broadcast', { event: 'signal' }, ({ payload }) => act.handleSignal(payload));
    ch.on('broadcast', { event: 'vsig' }, ({ payload }) => act.handleVsig(payload));
    ch.on('broadcast', { event: 'voice' }, ({ payload }) => act.handleVoice(payload));
    ch.on('presence', { event: 'sync' }, () => {
      const list = Object.entries(ch.presenceState()).map(([id, metas]) => ({ id, ...metas[0] }));
      setParticipants(list);
      act.pruneGone(new Set(list.map((p) => p.id)));
    });

    ch.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setConnected(true);
        await ch.track(presenceRef.current);
        setTimeout(() => { readyRef.current = true; }, 2500);
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

  // Avisos cuando alguien entra o sale de la sala
  useEffect(() => {
    const prev = prevPartsRef.current;
    prevPartsRef.current = new Map(participants.map((p) => [p.id, p.name]));
    if (!prev || !readyRef.current) return;
    participants.forEach((p) => { if (p.id !== me && !prev.has(p.id)) toast(`${p.name} entró a la sala`); });
    prev.forEach((n, id) => {
      if (id !== me && !participants.some((p) => p.id === id)) toast(`${n} salió de la sala`);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participants]);

  // Reproductor de YouTube (API oficial IFrame)
  useEffect(() => {
    if (mode !== 'youtube' || !ytId) return undefined;
    let cancelled = false;
    let poll;
    setYtReady(false);
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
            setYtReady(true);
            setDuration(player.getDuration() || 0);
            if (pendingSyncRef.current) {
              const p = pendingSyncRef.current;
              pendingSyncRef.current = null;
              act.applyLocal(p);
            }
          },
          onStateChange: (e) => { setPlaying(e.data === 1); setBuffering(e.data === 3); },
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
      setYtReady(false);
      if (ytHolderRef.current) ytHolderRef.current.innerHTML = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, ytId]);

  // Volumen propio de cada persona (no afecta a las demás)
  useEffect(() => {
    localStorage.setItem('wp-vol', String(volume));
    if (!volumeAllowed) return;
    const v = videoRef.current;
    if (v) { v.volume = volume; v.muted = filmMuted; }
    const y = ytRef.current;
    if (y && y.setVolume) {
      y.setVolume(Math.round(volume * 100));
      if (filmMuted) y.mute(); else y.unMute();
    }
  }, [volume, filmMuted, mode, videoSrc, remoteVideo, ytReady, volumeAllowed]);

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
      const s = act.hostState();
      if (s) send('sync', { action: 'state', ...s, from: me });
    }, 4000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost]);

  // Atajos de teclado: espacio o K, flechas, F, M
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      const tag = t && t.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (tag === 'BUTTON' && e.key === ' ') return;
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); act.togglePlay(); }
      else if (e.key === 'ArrowRight') act.skip(10);
      else if (e.key === 'ArrowLeft') act.skip(-10);
      else if (e.key === 'f') act.toggleFs();
      else if (e.key === 'm') act.toggleFilmMute();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const showTab = (id) => (tab === id ? '' : 'hidden');

  return (
    <div className={`cielo ${playing ? 'vivo' : ''}`}>
      {Object.entries(remoteStreams).map(([id, stream]) => (
        <RemoteAudio key={id} stream={stream} onBlocked={() => setAudioBlocked(true)} />
      ))}

      {/* Avisos */}
      <div className="fixed top-3 right-3 z-[10000] flex flex-col gap-2 items-end pointer-events-none" role="status" aria-live="polite">
        {toasts.map((t) => <div key={t.id} className="toast">{t.text}</div>)}
      </div>

      <header className="max-w-[1400px] mx-auto flex flex-wrap items-center gap-3 px-4 pt-4 pb-3">
        <span className="logo" />
        <h1 className="font-display text-2xl leading-none">Cine Miraculous</h1>
        <span className="pill">Sala {roomId}</span>
        <span className="pill">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-gato' : 'bg-amber-400'}`} />
          {connected ? 'Conectada' : 'Conectando…'}
        </span>
        <div className="ml-auto flex gap-2">
          <button className="btn" onClick={shareInvite} aria-label="Compartir invitación">
            {copied ? <Check size={16} /> : typeof navigator !== 'undefined' && navigator.share ? <Share2 size={16} /> : <Copy size={16} />}
            <span className="hidden sm:inline">{copied ? 'Copiado' : 'Invitar'}</span>
          </button>
          <button className="btn btn-tinta" onClick={exit} aria-label="Salir de la sala">
            <LogOut size={16} /> <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      <main className={`max-w-[1400px] mx-auto grid gap-5 px-4 pb-28 ${theater ? 'lg:grid-cols-1' : 'lg:grid-cols-[minmax(0,1fr)_390px]'}`}>
        {/* ---------------- Columna de la película ---------------- */}
        <section className="min-w-0 space-y-4">
          {hostGone && (
            <p className="toast !bg-capa text-amber-300">
              La anfitriona no está en la sala ahora. Cuando vuelva, se retoma la sincronización.
            </p>
          )}

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
                  <div className="bg-tinta text-white rounded-3xl px-6 py-5 text-center max-w-xs">
                    <p className="font-display text-xl mb-1">Aún no hay película</p>
                    <p className="text-sm text-tenue">
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
                  onWaiting={() => setBuffering(true)}
                  onPlaying={() => setBuffering(false)}
                  onCanPlay={() => setBuffering(false)}
                  onError={() => {
                    if (!liveGuest && videoSrc) setNotice('No se pudo cargar el video. Revisa que sea un enlace directo (https) a un MP4 o WebM.');
                  }}
                />
              )}

              {mode === 'youtube' && (
                <>
                  <div ref={ytHolderRef} className="yt-holder absolute inset-0" />
                  <div className="absolute inset-0 z-[5]" onClick={() => (canControl ? togglePlay() : poke())} />
                </>
              )}

              {buffering && !needsTap && (
                <div className="absolute inset-0 z-[6] flex items-center justify-center pointer-events-none">
                  <Loader2 size={44} className="animate-spin text-white/80" />
                </div>
              )}

              {liveGuest && !remoteVideo && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/80 text-center px-6">
                  <Loader2 className="animate-spin" />
                  <p className="text-sm">Conectando con la transmisión de la anfitriona…</p>
                  <button className="btn btn-sm" onClick={resync}><RefreshCw size={14} /> Reintentar</button>
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

              {/* Reacciones flotantes */}
              {floaters.map((f) => (
                <span key={f.id} className="flota" style={{ left: `${f.x}%` }} aria-hidden="true">{f.emoji}</span>
              ))}

              {/* Mensajes de la charla en pantalla completa */}
              {isFs && fsMsg && fsMsg.from !== me && (
                <div className="absolute left-4 bottom-28 z-20 burbuja">
                  <span className="text-xs text-tenue block">{fsMsg.name}</span>
                  {fsMsg.text}
                </div>
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
                <div className="flex items-center gap-1.5 mt-2">
                  <button className="btn btn-sm btn-ghost" disabled={!canControl || mode === 'none'} onClick={() => skip(-10)} aria-label="Retroceder 10 segundos">
                    <SkipBack size={20} />
                  </button>
                  <button className="btn btn-rojo btn-circulo" disabled={!canControl || mode === 'none'} onClick={togglePlay} aria-label={playing ? 'Pausar' : 'Reproducir'}>
                    {playing ? <Pause size={20} /> : <Play size={20} />}
                  </button>
                  <button className="btn btn-sm btn-ghost" disabled={!canControl || mode === 'none'} onClick={() => skip(10)} aria-label="Adelantar 10 segundos">
                    <SkipForward size={20} />
                  </button>
                  <span className="text-sm tabular-nums ml-1">{fmt(current)} / {fmt(duration)}</span>

                  <div className="ml-auto flex items-center gap-1">
                    {volumeAllowed && (
                      <>
                        <button className="btn btn-sm btn-ghost" onClick={toggleFilmMute} aria-label={filmMuted ? 'Activar sonido' : 'Silenciar película'}>
                          {filmMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>
                        <input
                          type="range"
                          className="barra hidden sm:block !w-20"
                          aria-label="Volumen de la película"
                          min={0}
                          max={1}
                          step={0.05}
                          value={filmMuted ? 0 : volume}
                          style={{ '--p': `${(filmMuted ? 0 : volume) * 100}%` }}
                          onChange={(e) => { setVolume(parseFloat(e.target.value)); setFilmMuted(false); }}
                        />
                      </>
                    )}
                    {!isHost && mode !== 'none' && (
                      <button className="btn btn-sm btn-ghost" onClick={resync} aria-label="Sincronizar con la anfitriona" title="Sincronizar">
                        <RefreshCw size={20} />
                      </button>
                    )}
                    <button className="btn btn-sm btn-ghost hidden lg:inline-flex" onClick={() => setTheater((t) => !t)} aria-label="Modo cine" title="Modo cine">
                      {theater ? <PanelRightOpen size={20} /> : <PanelRightClose size={20} />}
                    </button>
                    <button className="btn btn-sm btn-ghost" onClick={toggleFs} aria-label="Pantalla completa">
                      {isFs ? <Minimize size={20} /> : <Maximize size={20} />}
                    </button>
                  </div>
                </div>
                {!canControl && mode !== 'none' && (
                  <p className="text-xs text-tenue mt-1">Controlan la anfitriona y las moderadoras.</p>
                )}
              </div>
            </div>
          </div>

          {/* Reacciones */}
          <div className="flex gap-2 overflow-x-auto scroll-fino pb-1" role="group" aria-label="Reacciones">
            {EMOJIS.map((e) => (
              <button key={e} className="btn btn-sm text-xl" onClick={() => sendReaction(e)} aria-label={`Reaccionar con ${e}`}>
                {e}
              </button>
            ))}
          </div>

          {/* Fuente del video */}
          {(isHost || videoLabel || notice) && (
            <div className="panel p-4 space-y-3">
              {videoLabel && <p className="text-sm text-tenue truncate">Reproduciendo: <span className="text-luna">{videoLabel}</span></p>}
              {isHost && mode === 'stream' && (
                <p className="text-sm text-gato">
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
                  <p className="text-xs text-tenue">
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
        <aside className={`min-w-0 space-y-5 ${theater ? 'lg:grid lg:grid-cols-3 lg:gap-5 lg:space-y-0' : ''}`}>
          {/* Pestañas en celular */}
          <div className="lg:hidden grid grid-cols-3 gap-2">
            {[['charla', 'Charla', MessageCircle], ['sala', 'Sala', Users], ['voz', 'Voz', Headphones]].map(([id, label, Icon]) => (
              <button
                key={id}
                className={`btn ${tab === id ? 'btn-rojo' : ''}`}
                onClick={() => { setTab(id); if (id === 'charla') setUnread(0); }}
              >
                <Icon size={16} /> {label}
                {id === 'charla' && unread > 0 && (
                  <span className="bg-gato text-tinta rounded-full text-xs px-1.5">{unread}</span>
                )}
              </button>
            ))}
          </div>

          <Palco
            participants={participants}
            mods={mods}
            peerStatus={peerStatus}
            inVoice={inVoice}
            isHost={isHost}
            me={me}
            act={act}
            className={`${showTab('sala')} lg:block`}
          />
          <VoicePanel
            inVoice={inVoice}
            muted={muted}
            voiceError={voiceError}
            audioBlocked={audioBlocked}
            failedPeers={failedPeers}
            act={act}
            className={`${showTab('voz')} lg:block`}
          />
          <ChatPanel
            messages={messages}
            me={me}
            act={act}
            visible={tab === 'charla'}
            className={`h-[56vh] ${showTab('charla')} lg:flex ${theater ? 'lg:h-[360px]' : 'lg:h-[calc(100dvh-560px)] lg:min-h-[300px]'}`}
          />
        </aside>
      </main>
    </div>
  );
}