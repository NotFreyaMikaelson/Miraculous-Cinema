// Tailwind se carga por CDN (cero configuración).
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Maximize, Minimize, Copy, Check, Mic, MicOff,
  PhoneCall, PhoneOff, Send, Users, Link as LinkIcon, FileVideo, Crown, LogOut, Sparkles,
} from 'lucide-react';
import { supabase } from './supabaseClient';

/* ---------- Setup global: Tailwind CDN + reset ---------- */
if (typeof document !== 'undefined' && !document.getElementById('tw-cdn')) {
  const s = document.createElement('script');
  s.id = 'tw-cdn';
  s.src = 'https://cdn.tailwindcss.com';
  document.head.appendChild(s);
  const st = document.createElement('style');
  st.textContent = `
    html,body{margin:0;padding:0;background:#0f0a1f;color:#fff;display:block!important;place-items:initial!important;min-width:0!important}
    #root{max-width:none!important;margin:0!important;padding:0!important;width:100%!important;text-align:left!important}
    *{box-sizing:border-box}
    input[type=range]{accent-color:#ec4899}
  `;
  document.head.appendChild(st);
}

/* ---------- Config WebRTC (STUN público; añade TURN si hay redes restrictivas) ---------- */
const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

/* ---------- Utilidades ---------- */
const fmt = (t = 0) => {
  if (!isFinite(t)) return '0:00';
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = Math.floor(t % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
};
const newId = () =>
  (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
const newRoomId = () => newId().replace(/-/g, '').slice(0, 8);
const inviteLink = (roomId) => `${window.location.origin}${window.location.pathname}?room=${roomId}`;

/* =====================================================================
   APP: Lobby <-> Sala
   ===================================================================== */
export default function App() {
  const urlRoom = new URLSearchParams(window.location.search).get('room');
  const [name, setName] = useState(() => localStorage.getItem('wp-name') || '');
  const [session, setSession] = useState(null); // { roomId, name, isHost }
  const [error, setError] = useState('');

  const enter = (roomId, createdByMe) => {
    const n = name.trim();
    if (!n) return setError('Escribe tu nombre para continuar');
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-fuchsia-950 via-[#0f0a1f] to-rose-950">
      <div className="w-full max-w-md rounded-3xl bg-white/5 backdrop-blur border border-white/10 p-8 shadow-2xl">
        <div className="flex items-center gap-2 text-pink-400 mb-2">
          <Sparkles size={22} />
          <span className="text-sm font-semibold tracking-widest uppercase">Watch Party</span>
        </div>
        <h1 className="text-3xl font-extrabold mb-6">🐞 Miraculous Party</h1>

        <label className="text-sm text-white/70">Tu nombre</label>
        <input
          value={name}
          onChange={(e) => { setName(e.target.value); setError(''); }}
          maxLength={24}
          placeholder="Ej: Marinette"
          className="mt-1 mb-4 w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-pink-400"
        />
        {error && <p className="text-rose-400 text-sm mb-3">{error}</p>}

        {urlRoom ? (
          <button
            onClick={() => enter(urlRoom, false)}
            className="w-full rounded-xl bg-pink-500 hover:bg-pink-400 transition py-3 font-bold"
          >
            Unirme a la sala {urlRoom}
          </button>
        ) : null}

        <button
          onClick={() => enter(newRoomId(), true)}
          className={`w-full rounded-xl transition py-3 font-bold mt-3 ${
            urlRoom ? 'bg-white/10 hover:bg-white/20' : 'bg-pink-500 hover:bg-pink-400'
          }`}
        >
          Crear Sala Miraculous
        </button>
      </div>
    </div>
  );
}

/* =====================================================================
   SALA
   ===================================================================== */
function Room({ roomId, name, isHost, onLeave }) {
  const me = useRef(newId()).current;

  // Refs de infraestructura
  const channelRef = useRef(null);
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const chatEndRef = useRef(null);
  const pcsRef = useRef(new Map());          // peerId -> RTCPeerConnection
  const pendingIceRef = useRef(new Map());   // peerId -> RTCIceCandidateInit[]
  const localStreamRef = useRef(null);
  const presenceRef = useRef({ name, host: isHost, voice: false, muted: false });
  const pendingSyncRef = useRef(null);
  const lastSeekSentRef = useRef(0);
  const objectUrlRef = useRef(null);
  const urlSrcRef = useRef('');
  const localNameRef = useRef('');

  // Estado de UI
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [videoSrc, setVideoSrc] = useState('');
  const [videoLabel, setVideoLabel] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [notice, setNotice] = useState('');
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFs, setIsFs] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inVoice, setInVoice] = useState(false);
  const [muted, setMuted] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [connected, setConnected] = useState(false);

  /* ---------- Broadcast helper ---------- */
  const send = useCallback((event, payload = {}) => {
    channelRef.current?.send({ type: 'broadcast', event, payload });
  }, []);

  const updatePresence = useCallback((patch) => {
    presenceRef.current = { ...presenceRef.current, ...patch };
    channelRef.current?.track(presenceRef.current);
  }, []);

  /* ---------- Aplicar sincronización recibida (invitadas) ---------- */
  const applySync = useCallback((p) => {
    const v = videoRef.current;
    if (!v || !v.src || v.readyState < 1) {
      pendingSyncRef.current = p; // se aplica cuando cargue el video
      return;
    }
    const tryPlay = () => v.play().then(() => setNeedsTap(false)).catch(() => setNeedsTap(true));
    switch (p.action) {
      case 'play':
        v.currentTime = p.time;
        tryPlay();
        break;
      case 'pause':
        v.pause();
        v.currentTime = p.time;
        break;
      case 'seek':
        v.currentTime = p.time;
        break;
      case 'state': // heartbeat de corrección de deriva
        if (p.playing) {
          if (Math.abs(v.currentTime - p.time) > 1.5) v.currentTime = p.time;
          if (v.paused) tryPlay();
        } else {
          if (!v.paused) v.pause();
          if (Math.abs(v.currentTime - p.time) > 0.5) v.currentTime = p.time;
        }
        break;
      default:
    }
  }, []);

  /* ---------- WebRTC: gestión de peers ---------- */
  const closePeer = useCallback((peerId) => {
    const pc = pcsRef.current.get(peerId);
    if (pc) {
      pcsRef.current.delete(peerId);
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.close();
    }
    pendingIceRef.current.delete(peerId);
    setRemoteStreams((s) => {
      if (!(peerId in s)) return s;
      const { [peerId]: _omit, ...rest } = s;
      return rest;
    });
  }, []);

  const createPeer = useCallback((peerId, initiator) => {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcsRef.current.set(peerId, pc);

    const stream = localStreamRef.current;
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    pc.onicecandidate = (e) => {
      if (e.candidate) send('signal', { from: me, to: peerId, kind: 'ice', data: e.candidate.toJSON() });
    };
    pc.ontrack = (e) => setRemoteStreams((s) => ({ ...s, [peerId]: e.streams[0] }));
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') closePeer(peerId);
    };

    if (initiator) {
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() =>
          send('signal', {
            from: me, to: peerId, kind: 'offer',
            data: { type: pc.localDescription.type, sdp: pc.localDescription.sdp },
          })
        )
        .catch(console.error);
    }
    return pc;
  }, [me, send, closePeer]);

  const flushIce = async (peerId, pc) => {
    const queue = pendingIceRef.current.get(peerId) || [];
    pendingIceRef.current.delete(peerId);
    for (const c of queue) {
      try { await pc.addIceCandidate(c); } catch (e) { console.warn(e); }
    }
  };

  const handleSignal = useCallback(async ({ from, to, kind, data }) => {
    if (to !== me || !localStreamRef.current) return;
    try {
      if (kind === 'offer') {
        closePeer(from);
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
        if (pc && pc.remoteDescription) {
          await pc.addIceCandidate(data);
        } else {
          const q = pendingIceRef.current.get(from) || [];
          q.push(data);
          pendingIceRef.current.set(from, q);
        }
      }
    } catch (e) {
      console.error('Error de señalización', e);
    }
  }, [me, send, createPeer, closePeer]);

  /* ---------- Voz: entrar / salir / mutear ---------- */
  const joinVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      localStreamRef.current = stream;
      setInVoice(true);
      setMuted(false);
      updatePresence({ voice: true, muted: false });
    } catch (e) {
      alert('No se pudo acceder al micrófono. Revisa los permisos del navegador.');
    }
  };

  const leaveVoice = useCallback(() => {
    [...pcsRef.current.keys()].forEach(closePeer);
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setInVoice(false);
    setMuted(false);
    setRemoteStreams({});
    updatePresence({ voice: false, muted: false });
  }, [closePeer, updatePresence]);

  const toggleMute = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !muted;
    stream.getAudioTracks().forEach((t) => (t.enabled = !next));
    setMuted(next);
    updatePresence({ muted: next });
  };

  // Conectar con peers que estén en voz. Regla anti-colisión: inicia el de id menor.
  useEffect(() => {
    if (!inVoice) return;
    const active = new Set();
    participants.forEach((p) => {
      if (p.id === me || !p.voice) return;
      active.add(p.id);
      if (me < p.id && !pcsRef.current.has(p.id)) createPeer(p.id, true);
    });
    [...pcsRef.current.keys()].forEach((id) => { if (!active.has(id)) closePeer(id); });
  }, [participants, inVoice, me, createPeer, closePeer]);

  /* ---------- Canal Supabase Realtime (Broadcast + Presence) ---------- */
  useEffect(() => {
    const ch = supabase.channel(`watch-party:${roomId}`, {
      config: { broadcast: { self: false, ack: false }, presence: { key: me } },
    });
    channelRef.current = ch;

    ch.on('broadcast', { event: 'chat' }, ({ payload }) =>
      setMessages((m) => [...m.slice(-199), payload])
    );
    ch.on('broadcast', { event: 'sync' }, ({ payload }) => {
      if (!isHost) applySync(payload);
    });
    ch.on('broadcast', { event: 'video-url' }, ({ payload }) => {
      if (isHost) return;
      setVideoSrc(payload.url);
      setVideoLabel(payload.url);
      setNotice('');
    });
    ch.on('broadcast', { event: 'video-local' }, ({ payload }) => {
      if (isHost) return;
      setNotice(`La anfitriona cargó el archivo «${payload.name}». Selecciona el mismo archivo en tu dispositivo.`);
    });
    ch.on('broadcast', { event: 'request-state' }, () => {
      if (!isHost) return;
      const v = videoRef.current;
      if (urlSrcRef.current) send('video-url', { url: urlSrcRef.current });
      else if (localNameRef.current) send('video-local', { name: localNameRef.current });
      if (v && v.src) send('sync', { action: 'state', time: v.currentTime, playing: !v.paused });
    });
    ch.on('broadcast', { event: 'signal' }, ({ payload }) => handleSignal(payload));
    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState();
      setParticipants(
        Object.entries(state).map(([id, metas]) => ({ id, ...metas[0] }))
      );
    });

    ch.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setConnected(true);
        await ch.track(presenceRef.current);
        if (!isHost) ch.send({ type: 'broadcast', event: 'request-state', payload: {} });
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setConnected(false);
      }
    });

    return () => {
      [...pcsRef.current.keys()].forEach(closePeer);
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      supabase.removeChannel(ch);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // Heartbeat del anfitrión para corregir deriva
  useEffect(() => {
    if (!isHost) return;
    const id = setInterval(() => {
      const v = videoRef.current;
      if (v && v.src && v.readyState >= 1) {
        send('sync', { action: 'state', time: v.currentTime, playing: !v.paused });
      }
    }, 4000);
    return () => clearInterval(id);
  }, [isHost, send]);

  // Autoscroll del chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Estado de pantalla completa
  useEffect(() => {
    const h = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  /* ---------- Fuente de video ---------- */
  const loadLocalFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setVideoSrc(url);
    setVideoLabel(file.name);
    setNotice('');
    if (isHost) {
      urlSrcRef.current = '';
      localNameRef.current = file.name;
      send('video-local', { name: file.name });
    }
  };

  const loadUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    setVideoSrc(url);
    setVideoLabel(url);
    urlSrcRef.current = url;
    localNameRef.current = '';
    send('video-url', { url });
  };

  /* ---------- Controles (solo anfitriona emite) ---------- */
  const togglePlay = () => {
    const v = videoRef.current;
    if (!isHost || !v || !v.src) return;
    if (v.paused) {
      v.play().catch(() => {});
      send('sync', { action: 'play', time: v.currentTime });
    } else {
      v.pause();
      send('sync', { action: 'pause', time: v.currentTime });
    }
  };

  const seekTo = (t, throttle = false) => {
    const v = videoRef.current;
    if (!isHost || !v || !v.src) return;
    const time = Math.max(0, Math.min(duration || t, t));
    v.currentTime = time;
    setCurrent(time);
    const now = Date.now();
    if (throttle && now - lastSeekSentRef.current < 150) return;
    lastSeekSentRef.current = now;
    send('sync', { action: 'seek', time });
  };

  const skip = (d) => videoRef.current && seekTo(videoRef.current.currentTime + d);

  const toggleFs = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else containerRef.current?.requestFullscreen?.();
  };

  /* ---------- Chat ---------- */
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

  const exit = () => { leaveVoice(); onLeave(); };

  /* ---------- Render ---------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-950 via-[#0f0a1f] to-rose-950 text-white">
      {/* Audios remotos */}
      {Object.entries(remoteStreams).map(([id, stream]) => (
        <RemoteAudio key={id} stream={stream} />
      ))}

      {/* Header */}
      <header className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-white/10">
        <span className="font-extrabold text-lg">🐞 Sala {roomId}</span>
        <span className={`text-xs px-2 py-1 rounded-full ${connected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
          {connected ? 'Conectada' : 'Conectando…'}
        </span>
        {isHost && (
          <span className="text-xs px-2 py-1 rounded-full bg-pink-500/20 text-pink-300 flex items-center gap-1">
            <Crown size={12} /> Anfitriona
          </span>
        )}
        <div className="ml-auto flex gap-2">
          <button onClick={copyInvite} className="flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-2 text-sm">
            {copied ? <Check size={16} className="text-emerald-300" /> : <Copy size={16} />}
            {copied ? '¡Copiado!' : 'Copiar enlace'}
          </button>
          <button onClick={exit} className="flex items-center gap-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 px-3 py-2 text-sm">
            <LogOut size={16} /> Salir
          </button>
        </div>
      </header>

      <main className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* ---------- Columna izquierda: video ---------- */}
        <section className="space-y-3 min-w-0">
          <div ref={containerRef} className="relative bg-black rounded-2xl overflow-hidden aspect-video flex flex-col justify-end">
            {videoSrc ? (
              <video
                ref={videoRef}
                src={videoSrc}
                playsInline
                className="absolute inset-0 w-full h-full object-contain"
                onClick={isHost ? togglePlay : undefined}
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
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 gap-2 p-4 text-center">
                <FileVideo size={48} />
                <p>{isHost ? 'Carga un video local o pega un enlace MP4/WebM' : 'Esperando a que la anfitriona cargue un video…'}</p>
              </div>
            )}

            {needsTap && (
              <button
                onClick={() => { videoRef.current?.play().then(() => setNeedsTap(false)).catch(() => {}); }}
                className="absolute inset-0 z-10 bg-black/70 flex items-center justify-center gap-2 text-lg font-bold"
              >
                <Play /> Toca para sincronizar
              </button>
            )}

            {/* Controles personalizados */}
            <div className="relative z-20 bg-gradient-to-t from-black/90 to-transparent p-3">
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={current}
                disabled={!isHost || !videoSrc}
                onChange={(e) => seekTo(parseFloat(e.target.value), true)}
                onMouseUp={(e) => seekTo(parseFloat(e.currentTarget.value))}
                onTouchEnd={(e) => seekTo(parseFloat(e.currentTarget.value))}
                className="w-full disabled:opacity-50"
              />
              <div className="flex items-center gap-2 mt-1">
                <button disabled={!isHost || !videoSrc} onClick={() => skip(-10)} className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-40" title="Retroceder 10s">
                  <SkipBack size={20} />
                </button>
                <button disabled={!isHost || !videoSrc} onClick={togglePlay} className="p-2 rounded-lg bg-pink-500 hover:bg-pink-400 disabled:opacity-40" title="Play / Pausa">
                  {playing ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <button disabled={!isHost || !videoSrc} onClick={() => skip(10)} className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-40" title="Adelantar 10s">
                  <SkipForward size={20} />
                </button>
                <span className="text-sm tabular-nums text-white/80 ml-1">
                  {fmt(current)} / {fmt(duration)}
                </span>
                {!isHost && <span className="text-xs text-white/50 ml-2 hidden sm:inline">Controla la anfitriona</span>}
                <button onClick={toggleFs} className="ml-auto p-2 rounded-lg hover:bg-white/10" title="Pantalla completa">
                  {isFs ? <Minimize size={20} /> : <Maximize size={20} />}
                </button>
              </div>
            </div>
          </div>

          {/* Fuente de video */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
            {videoLabel && <p className="text-sm text-white/70 truncate">Reproduciendo: {videoLabel}</p>}
            {notice && <p className="text-sm text-amber-300">{notice}</p>}
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="flex items-center justify-center gap-2 cursor-pointer rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2 text-sm">
                <FileVideo size={16} /> Video local
                <input type="file" accept="video/*" className="hidden" onChange={loadLocalFile} />
              </label>
              {isHost && (
                <div className="flex flex-1 gap-2">
                  <input
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadUrl()}
                    placeholder="https://…/episodio.mp4"
                    className="flex-1 min-w-0 rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm outline-none focus:border-pink-400"
                  />
                  <button onClick={loadUrl} className="flex items-center gap-2 rounded-xl bg-pink-500 hover:bg-pink-400 px-4 py-2 text-sm font-semibold">
                    <LinkIcon size={16} /> Cargar
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ---------- Columna derecha: voz + chat ---------- */}
        <aside className="space-y-4 min-w-0">
          {/* Voz y participantes */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-center gap-2 mb-3 font-bold">
              <Users size={18} /> Participantes ({participants.length})
            </div>
            <ul className="space-y-2 mb-4 max-h-40 overflow-y-auto">
              {participants.map((p) => (
                <li key={p.id} className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="truncate">{p.name}{p.id === me ? ' (tú)' : ''}</span>
                  {p.host && <Crown size={14} className="text-pink-300" />}
                  <span className="ml-auto">
                    {p.voice ? (p.muted ? <MicOff size={16} className="text-rose-400" /> : <Mic size={16} className="text-emerald-400" />) : null}
                  </span>
                </li>
              ))}
            </ul>
            {!inVoice ? (
              <button onClick={joinVoice} className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-2 font-semibold">
                <PhoneCall size={18} /> Entrar a la llamada de voz
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={toggleMute} className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 font-semibold ${muted ? 'bg-amber-500 hover:bg-amber-400' : 'bg-white/10 hover:bg-white/20'}`}>
                  {muted ? <><MicOff size={18} /> Activar micrófono</> : <><Mic size={18} /> Mutear micrófono</>}
                </button>
                <button onClick={leaveVoice} className="rounded-xl bg-rose-500 hover:bg-rose-400 px-4" title="Salir de la llamada">
                  <PhoneOff size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Chat */}
          <div className="rounded-2xl bg-white/5 border border-white/10 flex flex-col h-[50vh] lg:h-[calc(100vh-420px)] lg:min-h-[320px]">
            <div className="p-3 border-b border-white/10 font-bold">💬 Chat</div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.length === 0 && <p className="text-sm text-white/40 text-center mt-4">Aún no hay mensajes</p>}
              {messages.map((m) => {
                const mine = m.from === me;
                return (
                  <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                    <span className="text-[11px] text-white/50 px-1">{mine ? 'Tú' : m.name}</span>
                    <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm break-words ${mine ? 'bg-pink-500' : 'bg-white/10'}`}>
                      {m.text}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={sendChat} className="p-3 border-t border-white/10 flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                maxLength={500}
                placeholder="Escribe un mensaje…"
                className="flex-1 min-w-0 rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm outline-none focus:border-pink-400"
              />
              <button type="submit" className="rounded-xl bg-pink-500 hover:bg-pink-400 px-3" title="Enviar">
                <Send size={18} />
              </button>
            </form>
          </div>
        </aside>
      </main>
    </div>
  );
}

/* ---------- Reproductor de audio remoto (voz) ---------- */
function RemoteAudio({ stream }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return <audio ref={ref} autoPlay playsInline />;
}