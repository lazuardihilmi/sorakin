"use client";
export const runtime = "edge";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RefreshCw } from "lucide-react";

export default function RunningTextOverlay() {
  const params = useParams();
  const key = params.key as string;

  const [connected, setConnected] = useState(false);
  const [donations, setDonations] = useState<any[]>([]);

  // Fetch recent donations
  const fetchRecentDonations = async () => {
    try {
      const res = await fetch(`/api/donations?type=creator&status=Selesai&limit=10`);
      const data = await res.json();
      if (res.ok && data.donations) {
        setDonations(data.donations);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!key) return;
    document.body.classList.add("obs-overlay-body");

    fetchRecentDonations();

    const eventSource = new EventSource(`/api/overlays/stream?key=${key}`);

    eventSource.onopen = () => {
      setConnected(true);
    };

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "connect") return;

      // On new success donation, refresh list
      fetchRecentDonations();
    };

    eventSource.onerror = () => {
      setConnected(false);
    };

    return () => {
      eventSource.close();
      document.body.classList.remove("obs-overlay-body");
    };
  }, [key]);

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
        Menghubungkan Running Text...
      </div>
    );
  }

  // Format list items into a single scrolling string
  const formatTickerText = () => {
    if (donations.length === 0) {
      return "Selamat datang di live stream! Dukung kreator via sorakin.com";
    }

    return donations
      .map((d: any) => {
        const name = d.isAnonymous ? "Anonim" : d.senderName;
        const msg = d.message ? `: "${d.message}"` : "";
        return `${name} (Rp ${d.amount.toLocaleString("id-ID")})${msg}`;
      })
      .join("  •  •  •  ");
  };

  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      display: "flex",
      alignItems: "flex-end", // Render at bottom of screen typically
      fontFamily: "'Outfit', sans-serif",
      overflow: "hidden"
    }}>
      <div style={{
        width: "100%",
        background: "rgba(10, 10, 10, 0.9)",
        borderTop: "2px solid var(--primary)",
        color: "white",
        padding: "10px 0",
        whiteSpace: "nowrap",
        overflow: "hidden",
        boxShadow: "0 -5px 25px rgba(0,0,0,0.5)"
      }}>
        {/* Marquee Animation */}
        <div style={{
          display: "inline-block",
          paddingLeft: "100%",
          animation: "marquee 25s linear infinite",
          fontSize: "15px",
          fontWeight: "700",
          letterSpacing: "0.5px"
        }}>
          {formatTickerText()}
        </div>

        {/* Dynamic global CSS injection for smooth marquee scrolling without external packages */}
        <style jsx>{`
          @keyframes marquee {
            0% { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(-100%, 0, 0); }
          }
        `}</style>
      </div>
    </div>
  );
}
