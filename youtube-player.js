const params = new URLSearchParams(location.search);
const videoId = params.get("videoId");
const soundEnabled = params.get("sound") === "1";
const volume = Math.max(0, Math.min(100, Number(params.get("volume") ?? 50)));
const quality = params.get("quality") || "auto";
const fit = params.get("fit") === "contain" ? "contain" : "cover";
const root = document.querySelector("#player");
root.classList.toggle("cover", fit === "cover");

function sendAvailableQualities(player) {
  const levels = player.getAvailableQualityLevels?.() ?? [];
  window.parent.postMessage({ type: "youtube-quality-levels", levels }, "*");
}

if (!videoId || !/^[\w-]{6,}$/.test(videoId)) {
  root.className = "message";
  root.textContent = "Не указан корректный videoId.";
} else {
  window.onYouTubeIframeAPIReady = () => {
    new YT.Player("player", {
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
        modestbranding: 1
      },
      events: {
        onReady(event) {
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
