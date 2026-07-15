"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RefreshCw, Volume2 } from "lucide-react";

export default function SoundboardOverlay() {
  const params = useParams();
  const key = params.key as string;

  const [connected, setConnected] = useState(false);
  const [playingName, setPlayingName] = useState<string | null>(null);
  const [interacted, setInteracted] = useState(false);

  useEffect(() => {
    if (!key) return;
    document.body.classList.add("obs-overlay-body");

    const eventSource = new EventSource(`/api/overlays/stream?key=${key}`);

    eventSource.onopen = () => {
      setConnected(true);
    };

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "connect") return;

      // Handle soundboard trigger events
      const sound = data.soundboardPlay;
      if (sound) {
        playSound(sound.name, sound.soundUrl);
      }
    };

    eventSource.onerror = () => {
      setConnected(false);
    };

    return () => {
      eventSource.close();
      document.body.classList.remove("obs-overlay-body");
    };
  }, [key]);

  const playSound = (name: string, url: string) => {
    try {
      const audio = new Audio(url);
      audio.volume = 0.8;
      setPlayingName(name);

      audio.play().catch((err) => {
        console.error("Audio playback blocked or failed:", err);
      });

      audio.onended = () => {
        setPlayingName(null);
      };
    } catch (e) {
      console.error(e);
      setPlayingName(null);
    }
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
        <div style={{ fontSize: "40px" }}>🔊</div>
        <div style={{ fontSize: "16px", fontWeight: "800", letterSpacing: "-0.5px" }}>Aktifkan Audio Soundboard</div>
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", maxWidth: "280px", lineHeight: "1.5" }}>
          Klik di mana saja untuk mengaktifkan pemutar efek suara. (Bagi OBS: klik kanan source lalu pilih &apos;Interact&apos;)
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
        Menghubungkan Soundboard ke OBS...
      </div>
    );
  }

  if (!playingName) return null; // Keep completely transparent for OBS source when idle

  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-outfit), sans-serif",
    }}>
      <div 
        className="pop-animation"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          background: "rgba(20, 20, 20, 0.9)",
          border: "2px solid var(--primary)",
          borderRadius: "16px",
          padding: "16px 24px",
          color: "white",
          fontSize: "20px",
          fontWeight: "700",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
        }}
      >
        <Volume2 size={24} style={{ color: "var(--primary)", animation: "bounce 1s infinite" }} />
        Soundboard: <span style={{ color: "var(--primary-hover)" }}>{playingName}</span>
      </div>
    </div>
  );
}
