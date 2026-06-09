const params = new URLSearchParams(location.search);
const videoId = params.get("videoId");
const soundEnabled = params.get("sound") === "1";
const volume = Math.max(0, Math.min(100, Number(params.get("volume") ?? 50)));
const root = document.querySelector("#player");

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
        loop: 1,
        playlist: videoId,
        playsinline: 1,
        rel: 0
      },
      events: {
        onReady(event) {
          event.target.setVolume(volume);
          if (soundEnabled && volume > 0) event.target.unMute();
          else event.target.mute();
          event.target.playVideo();
        }
      }
    });
  };

  const api = document.createElement("script");
  api.src = "https://www.youtube.com/iframe_api";
  document.head.append(api);
}
