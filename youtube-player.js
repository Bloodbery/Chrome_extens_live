const params = new URLSearchParams(location.search);
const videoId = params.get("videoId");
const soundEnabled = params.get("sound") === "1";
const volume = Math.max(0, Math.min(100, Number(params.get("volume") ?? 50)));
const quality = params.get("quality") || "auto";
const startTime = Math.max(0, Number(params.get("start") ?? 0));
const root = document.querySelector("#player");
root.classList.add("cover");
let player;
let pendingSound = { enabled: soundEnabled, volume };

function applySound(settings = pendingSound) {
  pendingSound = settings;
  if (!player?.setVolume) return;
  const nextVolume = Math.max(0, Math.min(100, Number(settings.volume) || 0));
  player.setVolume(nextVolume);
  if (settings.enabled && nextVolume > 0) player.unMute();
  else player.mute();
  player.playVideo?.();
  window.parent.postMessage({
    type: "youtube-sound-applied",
    videoId,
    volume: player.getVolume?.() ?? nextVolume,
    muted: player.isMuted?.() ?? !settings.enabled
  }, "*");
}

function sendAvailableQualities(player) {
  const levels = player.getAvailableQualityLevels?.() ?? [];
  window.parent.postMessage({ type: "youtube-quality-levels", levels }, "*");
}

if (!videoId || !/^[\w-]{6,}$/.test(videoId)) {
  root.className = "message";
  root.textContent = "Не указан корректный videoId.";
} else {
  window.onYouTubeIframeAPIReady = () => {
    player = new YT.Player("player", {
      videoId,
      width: "100%",
      height: "100%",
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        loop: 1,
        playlist: videoId,
        playsinline: 1,
        rel: 0,
        modestbranding: 1,
        start: Math.floor(startTime)
      },
      events: {
        onReady(event) {
          if (startTime > 0) event.target.seekTo(startTime, true);
          if (quality !== "auto") event.target.setPlaybackQuality(quality);
          applySound();
          window.parent.postMessage({ type: "youtube-ready", videoId }, "*");
        },
        onStateChange(event) {
          if (event.data === YT.PlayerState.PLAYING) {
            if (quality !== "auto") event.target.setPlaybackQuality(quality);
            sendAvailableQualities(event.target);
            window.parent.postMessage({ type: "youtube-playing", videoId }, "*");
          }
        }
      }
    });
  };

  const api = document.createElement("script");
  api.src = "https://www.youtube.com/iframe_api";
  api.addEventListener("error", () => {
    window.parent.postMessage({ type: "youtube-unavailable", videoId }, "*");
  });
  document.head.append(api);
}

window.addEventListener("message", (event) => {
  if (!player) return;
  if (event.data?.type === "request-playback-status") {
    const state = player.getPlayerState?.();
    if (state === YT.PlayerState.PLAYING || state === YT.PlayerState.BUFFERING || state === YT.PlayerState.CUED) {
      window.parent.postMessage({ type: "youtube-ready", videoId }, "*");
    }
  }
  if (event.data?.type === "sync-seek" && player.seekTo && player.getCurrentTime) {
    const position = Number(event.data.position);
    const currentTime = player.getCurrentTime();
    if (Number.isFinite(position) && position >= 0 && Math.abs(currentTime - position) > 10) {
      player.seekTo(position, true);
    }
  }
  if (event.data?.type === "set-sound") {
    applySound({
      enabled: Boolean(event.data.enabled),
      volume: Number(event.data.volume)
    });
  }
});
