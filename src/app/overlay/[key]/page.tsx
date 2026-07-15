"use client";
export const runtime = "edge";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { RefreshCw, Play } from "lucide-react";

interface AlertItem {
  orderId: string;
  senderName: string;
  amount: number;
  message: string;
  isVerified: boolean;
  alertSoundUrl: string;
  alertImageUrl: string;
  alertDuration: number;
  fontFamily: string;
  fontSize: number;
  backgroundColor: string;
  textColor: string;
  highlightColor: string;
  alertTemplate: string;
}

export default function OBSOverlayPage() {
  const params = useParams();
  const key = params.key as string;

  const [connected, setConnected] = useState(false);
  const [alertQueue, setAlertQueue] = useState<AlertItem[]>([]);
  const [currentAlert, setCurrentAlert] = useState<AlertItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Audio context for synthesizer chimes (fallback if mp3 fails/not loaded)
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play synthesized dual-tone chime (ding-dong) using Web Audio API
  const playSynthesizedChime = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;
      
      // Tone 1 (Ding)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now); // D5 note
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Tone 2 (Dong)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(440.00, now + 0.25); // A4 note
      gain2.gain.setValueAtTime(0.15, now + 0.25);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.25);
      osc2.stop(now + 0.95);
    } catch (e) {
      console.warn("Failed to play synthesized chime:", e);
    }
  };

  // Speak tip message using Web Speech Synthesis TTS
  const speakTextToSpeech = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // Stop any active speaking
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "id-ID"; // Indonesian voice
    utterance.rate = 1.0;     // Standard speed
    utterance.volume = 1.0;
    
    // Select an Indonesian voice if available
    const voices = window.speechSynthesis.getVoices();
    const indonesianVoice = voices.find(v => v.lang.includes("id"));
    if (indonesianVoice) {
      utterance.voice = indonesianVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  // Connect to SSE stream
  useEffect(() => {
    if (!key) return;

    // Apply transparent background to overlay body
    document.body.classList.add("obs-overlay-body");

    const eventSource = new EventSource(`/api/overlays/stream?key=${key}`);

    eventSource.onopen = () => {
      setConnected(true);
      console.log("Connected to OBS Stream Overlay successfully.");
    };

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // Ignore initial connection message or widget-only events (no donation amount)
      if (data.type === "connect" || data.amount === undefined || data.amount === null) {
        return;
      }

      console.log("New Tip Alert Received:", data);
      
      // Append to queue
      setAlertQueue(prev => [...prev, data]);
    };

    eventSource.onerror = (e) => {
      console.error("SSE connection error. Retrying...", e);
      setConnected(false);
    };

    return () => {
      eventSource.close();
      document.body.classList.remove("obs-overlay-body");
    };
  }, [key]);

  // Queue scheduler loop
  useEffect(() => {
    if (alertQueue.length > 0 && !isPlaying) {
      const nextAlert = alertQueue[0];
      setAlertQueue(prev => prev.slice(1));
      playAlert(nextAlert);
    }
  }, [alertQueue, isPlaying]);

  const playAlert = (alert: AlertItem) => {
    setIsPlaying(true);
    setCurrentAlert(alert);

    // 1. Play sound chime
    if (alert.alertSoundUrl && alert.alertSoundUrl !== "/sounds/default-alert.mp3") {
      const audio = new Audio(alert.alertSoundUrl);
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Fallback to synth beep if audio file block/fail
        playSynthesizedChime();
      });
    } else {
      playSynthesizedChime();
    }

    // 2. TTS: read message after 0.5s delay
    setTimeout(() => {
      const ttsMessage = `${alert.senderName} mengirim Rp ${alert.amount.toLocaleString("id-ID")}. ${alert.message ? `Pesan: ${alert.message}` : ""}`;
      speakTextToSpeech(ttsMessage);
    }, 500);

    // 3. Clear alert after duration (duration is in seconds)
    const durationMs = (alert.alertDuration || 5) * 1000;
    setTimeout(() => {
      setCurrentAlert(null);
      setIsPlaying(false);
    }, durationMs);
  };

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
        background: "rgba(0,0,0,0.85)" // Solid dark only when offline/loading
      }}>
        <RefreshCw size={16} className="spin" style={{ marginRight: "8px", animation: "spin 1.5s linear infinite" }} />
        Menghubungkan Halaman Overlay Sorakin ke Stream...
      </div>
    );
  }

  // Generate warning label if screen is empty
  if (!currentAlert) {
    return null; // Keep completely transparent when idle for OBS
  }

  // Parse template variables
  const formattedAmount = `Rp ${currentAlert.amount.toLocaleString("id-ID")}`;
  
  // Highlighted template text generator
  const getTemplateText = () => {
    let template = currentAlert.alertTemplate || "{sender} baru saja mengirim {amount}!\n\"{message}\"";
    
    // Split text by newlines
    const lines = template.split("\n");
    
    return lines.map((line, lIdx) => {
      // Find placeholders and wrap them in styled span highlights
      const tokens = line.split(/({sender}|{amount})/);
      return (
        <div key={lIdx} style={{ marginBottom: "8px" }}>
          {tokens.map((token, tIdx) => {
            if (token === "{sender}") {
              return (
                <span key={tIdx} style={{ color: currentAlert.highlightColor, fontWeight: "800" }}>
                  {currentAlert.senderName}
                  {currentAlert.isVerified && " (✓ Verified)"}
                </span>
              );
            }
            if (token === "{amount}") {
              return (
                <span key={tIdx} style={{ color: currentAlert.highlightColor, fontWeight: "800" }}>
                  {formattedAmount}
                </span>
              );
            }
            // replace messages
            if (token === "{message}") {
              return currentAlert.message ? `"${currentAlert.message}"` : "";
            }
            return token.replace("{message}", currentAlert.message ? `"${currentAlert.message}"` : "");
          })}
        </div>
      );
    });
  };

  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: currentAlert.fontFamily || "sans-serif",
      fontSize: `${currentAlert.fontSize || 24}px`
    }}>
      
      {/* Alert Card container */}
      <div 
        className="pop-animation"
        style={{
          backgroundColor: currentAlert.backgroundColor || "rgba(23, 21, 19, 0.95)",
          color: currentAlert.textColor || "#ffffff",
          padding: "36px 48px",
          borderRadius: "24px",
          border: `3px solid ${currentAlert.highlightColor}`,
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
          textAlign: "center",
          maxWidth: "600px",
          width: "90%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "24px"
        }}
      >
        {/* GIF animation / Image display */}
        <div style={{
          width: "140px",
          height: "140px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "80px",
          background: "rgba(255, 255, 255, 0.05)",
          borderRadius: "50%",
          padding: "10px"
        }}>
          {currentAlert.alertImageUrl && currentAlert.alertImageUrl !== "/images/default-alert.gif" ? (
            <img 
              src={currentAlert.alertImageUrl} 
              alt="Alert animation" 
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          ) : (
            "💰" // Cute default money emoji animation
          )}
        </div>

        {/* Template text */}
        <div style={{ fontWeight: "700", lineHeight: "1.4" }}>
          {getTemplateText()}
        </div>
      </div>
    </div>
  );
}
