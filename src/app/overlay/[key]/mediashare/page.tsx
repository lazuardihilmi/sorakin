"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { RefreshCw } from "lucide-react";

export default function MediashareOverlay() {
  const params = useParams();
  const key = params.key as string;

  const [connected, setConnected] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<any>(null);
  const [interacted, setInteracted] = useState(false);
  const playerRef = useRef<any>(null);
  const scriptLoadedRef = useRef(false);

  // Load active playlist item on mount
  const fetchActiveMedia = async () => {
    try {
      const res = await fetch(`/api/creator/widgets/mediashare?key=${key}`);
      const data = await res.json();
      if (res.ok && data.queue && data.queue.length > 0) {
        // Find if there is a currently playing video
        const playing = data.queue.find((item: any) => item.status === "PLAYING");
        if (playing) {
          setCurrentVideo(playing);
        } else {
          // If no video is active, play the first PENDING one
          setCurrentVideo(data.queue[0]);
          triggerPlayOnServer(data.queue[0].id);
        }
      } else {
        setCurrentVideo(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const triggerPlayOnServer = async (id: number) => {
    try {
      await fetch("/api/creator/widgets/mediashare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "play" })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const triggerFinishOnServer = async (id: number) => {
    try {
      await fetch("/api/creator/widgets/mediashare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "finish" })
      });
      // Fetch next video
      fetchActiveMedia();
    } catch (e) {
      console.error(e);
    }
  };

  // Setup SSE stream
  useEffect(() => {
    if (!key) return;
    document.body.classList.add("obs-overlay-body");

    fetchActiveMedia();

    const eventSource = new EventSource(`/api/overlays/stream?key=${key}`);

    eventSource.onopen = () => {
      setConnected(true);
    };

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "connect") return;

      // Handle mediashare actions
      if (data.type === "mediashare_play") {
        setCurrentVideo(data);
      } else if (data.type === "mediashare_skip" || data.type === "mediashare_finish") {
        if (currentVideo && currentVideo.id === data.mediaId) {
          setCurrentVideo(null);
          fetchActiveMedia();
        }
      } else if (data.type === "mediashare_clear") {
        setCurrentVideo(null);
      } else if (data.mediashareAdd) {
        // If a new video is added to the database and we are currently idle, fetch active media
        if (!currentVideo) {
          fetchActiveMedia();
        }
      }
    };

    eventSource.onerror = () => {
      setConnected(false);
    };

    return () => {
      eventSource.close();
      document.body.classList.remove("obs-overlay-body");
    };
  }, [key, currentVideo?.id]);

  // Load YouTube Iframe Player API
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!scriptLoadedRef.current) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      scriptLoadedRef.current = true;
    }

    (window as any).onYouTubeIframeAPIReady = () => {
      initializePlayer();
    };

    if ((window as any).YT && (window as any).YT.Player) {
      initializePlayer();
    }
  }, [currentVideo]);

  const initializePlayer = () => {
    if (!currentVideo) return;
    if (playerRef.current) {
      playerRef.current.destroy();
    }

    playerRef.current = new (window as any).YT.Player("mediashare-player", {
      height: "360",
      width: "640",
      videoId: currentVideo.youtubeId,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0
      },
      events: {
        onReady: (e: any) => {
          e.target.playVideo();
          e.target.setVolume(50); // Set moderate volume
        },
        onStateChange: (e: any) => {
          // YT.PlayerState.ENDED is 0
          if (e.data === 0) {
            triggerFinishOnServer(currentVideo.id);
          }
        }
      }
    });
  };

  if (!interacted) {
    return (
      <div 
        onClick={() => {
          setInteracted(true);
          const audio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAAA");
          audio.play().catch(() => {});
        }}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(20, 20, 20, 0.95)",
          color: "white",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 9999,
          fontFamily: "var(--font-outfit), sans-serif",
          gap: "12px",
          padding: "20px",
          textAlign: "center"
        }}
      >
        <div style={{ fontSize: "40px" }}>🎥</div>
        <div style={{ fontSize: "16px", fontWeight: "800", letterSpacing: "-0.5px" }}>Aktifkan Audio Media Share</div>
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", maxWidth: "280px", lineHeight: "1.5" }}>
          Klik di mana saja untuk mengaktifkan pemutar video. (Bagi OBS: klik kanan source lalu pilih &apos;Interact&apos;)
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div style={{
        display: "flex",
        height: "100vh",
        alignItems: "center",
        justifyContent: "center",
        color: "rgba(255,255,255,0.4)",
        fontFamily: "sans-serif",
        fontSize: "13px",
        background: "rgba(0,0,0,0.8)"
      }}>
        <RefreshCw size={16} className="spin" style={{ marginRight: "8px", animation: "spin 1.5s linear infinite" }} />
        Menghubungkan Layanan Media Share ke OBS...
      </div>
    );
  }

  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-outfit), sans-serif",
    }}>
      {currentVideo ? (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          background: "rgba(10, 10, 10, 0.95)",
          border: "2px solid #ff4f4f",
          borderRadius: "20px",
          padding: "20px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.7)",
          width: "680px"
        }}>
          {/* YouTube Video container */}
          <div style={{ width: "640px", height: "360px", borderRadius: "12px", overflow: "hidden", background: "#000" }}>
            <div id="mediashare-player"></div>
          </div>

          {/* Requested Info details */}
          <div style={{ color: "#fff", textAlign: "center", width: "100%" }}>
            <div style={{ fontSize: "16px", fontWeight: "700", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", width: "100%" }}>
              {currentVideo.title}
            </div>
            <div style={{ fontSize: "12px", color: "#aaa", marginTop: "4px" }}>
              Dikirim oleh: <span style={{ color: "#ff4f4f", fontWeight: "600" }}>{currentVideo.senderName}</span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ color: "rgba(255,255,255,0.15)", fontSize: "14px", fontWeight: "600" }}>
          [Antrean Media Share Kosong]
        </div>
      )}
    </div>
  );
}
