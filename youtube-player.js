const params = new URLSearchParams(location.search);
const videoId = params.get("videoId");
const soundEnabled = params.get("sound") === "1";
const volume = Math.max(0, Math.min(100, Number(params.get("volume") ?? 50)));
const quality = params.get("quality") || "auto";
const startTime = Math.max(0, Number(params.get("start") ?? 0));
const root = document.querySelector("#player");
root.classList.add("cover");
let player;

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
          event.target.setVolume(volume);
          if (quality !== "auto") event.target.setPlaybackQuality(quality);
          if (soundEnabled && volume > 0) event.target.unMute();
          else event.target.mute();
          event.target.playVideo();
        },
        onStateChange(event) {
          if (event.data === YT.PlayerState.PLAYING) {
            if (quality !== "auto") event.target.setPlaybackQuality(quality);
            sendAvailableQualities(event.target);
          }
        }
      }
    });
  };

  const api = document.createElement("script");
  api.src = "https://www.youtube.com/iframe_api";
  document.head.append(api);
}

window.addEventListener("message", (event) => {
  if (event.data?.type !== "sync-seek" || !player?.seekTo) return;
  const position = Number(event.data.position);
  if (Number.isFinite(position) && position >= 0) player.seekTo(position, true);
});
