import { useEffect, useRef } from 'react';

let youtubeApiPromise;

function loadYouTubeAPI() {
  if (window.YT?.Player) return Promise.resolve(window.YT);

  if (!youtubeApiPromise) {
    youtubeApiPromise = new Promise((resolve) => {
      const previousCallback = window.onYouTubeIframeAPIReady;

      window.onYouTubeIframeAPIReady = () => {
        previousCallback?.();
        resolve(window.YT);
      };

      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(script);
      }
    });
  }

  return youtubeApiPromise;
}

export default function YoutubePlayer({
  videoId,
  playerRef,
  onReady,
  onStateChange,
  onError,
}) {
  const elementRef = useRef(null);

  useEffect(() => {
    let player;
    let mounted = true;
    let interval;

    loadYouTubeAPI().then((YT) => {
      if (!mounted || !elementRef.current) return;

      player = new YT.Player(elementRef.current, {
        width: '100%',
        height: '100%',
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            if (!mounted) return;

            playerRef.current = event.target;
            onReady?.(event.target);
          },
          onStateChange: (event) => {
            if (!mounted) return;
            onStateChange?.(event.data, event.target);
          },
          onError: (event) => {
            if (!mounted) return;
            onError?.(event.data);
          },
        },
      });

      interval = window.setInterval(() => {
        if (!mounted || !playerRef.current) return;

        const playerState = playerRef.current.getPlayerState();

        if (playerState === YT.PlayerState.PLAYING) {
          onStateChange?.(playerState, playerRef.current, true);
        }
      }, 500);
    });

    return () => {
      mounted = false;
      window.clearInterval(interval);

      if (playerRef.current === player) {
        playerRef.current = null;
      }

      player?.destroy();
    };
  }, [videoId]);

  return (
    <div className="absolute inset-0 w-full h-full bg-black">
      <div ref={elementRef} className="w-full h-full" />
    </div>
  );
}