"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { RefreshCw, Timer } from "lucide-react";

export default function SubathonOverlay() {
  const params = useParams();
  const key = params.key as string;

  const [connected, setConnected] = useState(false);
  const [seconds, setSeconds] = useState(3600);
  const [isActive, setIsActive] = useState(false);
  const [addedTimeText, setAddedTimeText] = useState<string | null>(null);

  const secondsRef = useRef(3600);
  const intervalRef = useRef<any>(null);

  const fetchTimer = async () => {
    try {
      const res = await fetch(`/api/creator/widgets?key=${key}`);
      const data = await res.json();
      if (res.ok && data.subathonTimer) {
        setSeconds(data.subathonTimer.remainingSeconds);
        secondsRef.current = data.subathonTimer.remainingSeconds;
        setIsActive(data.subathonTimer.isActive);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Sync remaining seconds back to server periodically (e.g. every 30 seconds) to avoid drift
  const syncTimerToServer = async () => {
    if (!isActive) return;
    try {
      await fetch("/api/creator/widgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "subathon",
          remainingSeconds: secondsRef.current,
          isActive: true
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!key) return;
    document.body.classList.add("obs-overlay-body");

    fetchTimer();

    const eventSource = new EventSource(`/api/overlays/stream?key=${key}`);

    eventSource.onopen = () => {
      setConnected(true);
    };

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "connect") return;

      // Realtime subathon updates from donation webhooks
      const subathon = data.subathonTimer;
      if (subathon) {
        const diff = subathon.remainingSeconds - secondsRef.current;
        if (diff > 0) {
          showTimeAdded(diff);
        }
        setSeconds(subathon.remainingSeconds);
        secondsRef.current = subathon.remainingSeconds;
        setIsActive(subathon.isActive);
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

  // Sync interval
  useEffect(() => {
    const syncInterval = setInterval(() => {
      syncTimerToServer();
    }, 30000);

    return () => clearInterval(syncInterval);
  }, [isActive]);

  // Tick loop
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        if (secondsRef.current > 0) {
          secondsRef.current -= 1;
          setSeconds(secondsRef.current);
        } else {
          setIsActive(false);
          clearInterval(intervalRef.current);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  const showTimeAdded = (sec: number) => {
    let text = "";
    if (sec >= 3600) {
      text = `+${Math.floor(sec / 3600)}j ${Math.floor((sec % 3600) / 60)}m`;
    } else if (sec >= 60) {
      text = `+${Math.floor(sec / 60)}m ${sec % 60}d`;
    } else {
      text = `+${sec}d`;
    }
    setAddedTimeText(text);

    setTimeout(() => {
      setAddedTimeText(null);
    }, 4000);
  };

  const formatTime = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;

    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
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
        background: "rgba(0,0,0,0.8)"
      }}>
        <RefreshCw size={16} className="spin" style={{ marginRight: "8px", animation: "spin 1.5s linear infinite" }} />
        Menghubungkan Timer Subathon ke OBS...
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
      fontFamily: "'Outfit', sans-serif",
    }}>
      <div style={{ position: "relative" }}>
        {/* Glow background */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          background: "rgba(15, 15, 15, 0.9)",
          border: "2px solid #00ffaa",
          boxShadow: "0 0 30px rgba(0, 255, 170, 0.3)",
          borderRadius: "24px",
          padding: "16px 36px",
          color: "white"
        }}>
          <Timer size={32} style={{ color: "#00ffaa", animation: isActive ? "pulse 2s infinite" : "none" }} />
          <div style={{
            fontSize: "48px",
            fontWeight: "800",
            letterSpacing: "2px",
            fontVariantNumeric: "tabular-nums",
            textShadow: "0 0 10px rgba(0, 255, 170, 0.5)"
          }}>
            {formatTime(seconds)}
          </div>
        </div>

        {/* Floating extension text alerts */}
        {addedTimeText && (
          <div 
            className="pop-animation"
            style={{
              position: "absolute",
              top: "-45px",
              right: "20px",
              color: "#00ffaa",
              fontSize: "24px",
              fontWeight: "800",
              textShadow: "0 0 8px rgba(0, 255, 170, 0.6)"
            }}
          >
            {addedTimeText}
          </div>
        )}
      </div>
    </div>
  );
}
