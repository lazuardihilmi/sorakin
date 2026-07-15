"use client";
export const runtime = "edge";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RefreshCw, QrCode } from "lucide-react";

export default function QrOverlay() {
  const params = useParams();
  const key = params.key as string;

  const [connected, setConnected] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (!key) return;
    document.body.classList.add("obs-overlay-body");

    const fetchCreator = async () => {
      try {
        const res = await fetch(`/api/creator/widgets?key=${key}`);
        const data = await res.json();
        if (res.ok && data.creatorUsername) {
          setUsername(data.creatorUsername);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setConnected(true);
      }
    };

    fetchCreator();

    return () => {
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
        Menghubungkan QR Overlay...
      </div>
    );
  }

  if (!username) return null;

  // Build the tipping page link
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const tipUrl = `${origin}/${username}`;
  // Use QR Code API to generate QR Code image dynamically
  const qrCodeImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(tipUrl)}&color=000000&bgcolor=ffffff`;

  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Outfit', sans-serif"
    }}>
      <div style={{
        background: "rgba(25, 25, 25, 0.95)",
        border: "3px solid var(--primary)",
        borderRadius: "28px",
        padding: "24px",
        boxShadow: "0 20px 45px rgba(0, 0, 0, 0.6)",
        textAlign: "center",
        width: "280px"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: "white", marginBottom: "16px" }}>
          <QrCode size={20} style={{ color: "var(--primary)" }} />
          <span style={{ fontWeight: "800", fontSize: "15px" }}>DUKUNG KREATOR</span>
        </div>

        {/* QR Code Container */}
        <div style={{
          background: "white",
          borderRadius: "16px",
          padding: "16px",
          display: "inline-block",
          boxShadow: "inset 0 2px 10px rgba(0,0,0,0.1)",
          marginBottom: "16px"
        }}>
          <img 
            src={qrCodeImgSrc} 
            alt="Sorakin QR Code"
            style={{ width: "200px", height: "200px", display: "block" }}
          />
        </div>

        {/* URL Description */}
        <div style={{ color: "#aaa", fontSize: "11px", wordBreak: "break-all" }}>
          Scan QR atau kunjungi:<br />
          <span style={{ color: "white", fontWeight: "700", fontSize: "13px", marginTop: "4px", display: "inline-block" }}>
            sorakin.com/{username}
          </span>
        </div>
      </div>
    </div>
  );
}
