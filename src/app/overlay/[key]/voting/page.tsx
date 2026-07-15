"use client";
export const runtime = "edge";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RefreshCw, BarChart2 } from "lucide-react";

export default function VotingOverlay() {
  const params = useParams();
  const key = params.key as string;

  const [connected, setConnected] = useState(false);
  const [poll, setPoll] = useState<any>(null);

  const fetchPoll = async () => {
    try {
      const res = await fetch(`/api/creator/widgets?key=${key}`);
      const data = await res.json();
      if (res.ok && data.votingPoll) {
        setPoll(data.votingPoll);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!key) return;
    document.body.classList.add("obs-overlay-body");

    fetchPoll();

    const eventSource = new EventSource(`/api/overlays/stream?key=${key}`);

    eventSource.onopen = () => {
      setConnected(true);
    };

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "connect") return;

      const voting = data.votingPoll;
      if (voting) {
        setPoll(voting);
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
        Menghubungkan Overlay Polling ke OBS...
      </div>
    );
  }

  if (!poll || !poll.isActive) {
    return (
      <div style={{ color: "rgba(255,255,255,0.15)", fontSize: "14px", fontWeight: "600", textAlign: "center", paddingTop: "50px" }}>
        [Tidak Ada Polling Aktif]
      </div>
    );
  }

  // Calculate percentages
  const options = poll.options || [];
  const totalVotes = options.reduce((sum: number, opt: any) => sum + opt.votesCount, 0);

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
        width: "500px",
        background: "rgba(20, 20, 20, 0.95)",
        border: "2px solid #ffaa00",
        borderRadius: "24px",
        padding: "24px",
        boxShadow: "0 20px 45px rgba(0,0,0,0.5)",
        color: "white"
      }}>
        {/* Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <BarChart2 size={22} style={{ color: "#ffaa00" }} />
          <span style={{ fontSize: "18px", fontWeight: "800", letterSpacing: "-0.5px" }}>
            {poll.title}
          </span>
        </div>

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {options.map((opt: any) => {
            const percentage = totalVotes > 0 ? (opt.votesCount / totalVotes) * 100 : 0;
            return (
              <div key={opt.id} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: "600" }}>
                  <span>{opt.name}</span>
                  <span style={{ color: "#ffaa00" }}>
                    Rp {opt.votesCount.toLocaleString("id-ID")} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                {/* Bar */}
                <div style={{
                  height: "10px",
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: "6px",
                  overflow: "hidden",
                  width: "100%"
                }}>
                  <div style={{
                    width: `${percentage}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, #ff8c00, #ffaa00)",
                    borderRadius: "6px",
                    transition: "width 0.8s cubic-bezier(0.1, 0.8, 0.2, 1)"
                  }}></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Footer */}
        <div style={{ textAlign: "right", color: "#888", fontSize: "11px", marginTop: "16px" }}>
          Total Poin Dukungan: Rp {totalVotes.toLocaleString("id-ID")}
        </div>
      </div>
    </div>
  );
}
