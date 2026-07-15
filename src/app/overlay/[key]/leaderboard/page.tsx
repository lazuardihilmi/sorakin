"use client";
export const runtime = "edge";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RefreshCw, Award } from "lucide-react";

export default function LeaderboardOverlay() {
  const params = useParams();
  const key = params.key as string;

  const [connected, setConnected] = useState(false);
  const [leaders, setLeaders] = useState<any[]>([]);

  // Fetch top donors from the creator's donation list
  const fetchLeaderboard = async () => {
    try {
      // Find creator username first
      const widgetRes = await fetch(`/api/creator/widgets?key=${key}`);
      const widgetData = await widgetRes.json();
      if (!widgetRes.ok || !widgetData.creatorUsername) return;

      // Fetch all successful transactions for this creator
      const res = await fetch(`/api/donations?type=creator&status=Selesai&limit=100`);
      const data = await res.json();
      if (res.ok && data.donations) {
        // Group by senderName and sum the donation amount
        const map: { [key: string]: number } = {};
        data.donations.forEach((d: any) => {
          const name = d.isAnonymous ? "Anonim" : d.senderName;
          if (name !== "Anonim") {
            map[name] = (map[name] || 0) + d.amount;
          }
        });

        // Convert map to array and sort
        const sorted = Object.keys(map)
          .map(name => ({ name, totalAmount: map[name] }))
          .sort((a, b) => b.totalAmount - a.totalAmount)
          .slice(0, 5); // Take top 5

        setLeaders(sorted);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!key) return;
    document.body.classList.add("obs-overlay-body");

    fetchLeaderboard();

    // Trigger update on new donations
    const eventSource = new EventSource(`/api/overlays/stream?key=${key}`);

    eventSource.onopen = () => {
      setConnected(true);
    };

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "connect") return;

      // On new success donation, refresh leaderboard
      fetchLeaderboard();
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
        Menghubungkan Leaderboard Overlay...
      </div>
    );
  }

  if (leaders.length === 0) {
    return (
      <div style={{ color: "rgba(255,255,255,0.15)", fontSize: "14px", fontWeight: "600", textAlign: "center", paddingTop: "50px" }}>
        [Belum Ada Kontributor]
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
      fontFamily: "'Outfit', sans-serif"
    }}>
      <div style={{
        width: "360px",
        background: "rgba(18, 18, 18, 0.95)",
        border: "2px solid #8e2de2",
        boxShadow: "0 15px 35px rgba(142, 45, 226, 0.2)",
        borderRadius: "22px",
        padding: "20px",
        color: "white"
      }}>
        {/* Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <Award size={20} style={{ color: "#f7797d" }} />
          <span style={{ fontSize: "16px", fontWeight: "800", letterSpacing: "-0.3px", background: "linear-gradient(to right, #f7797d, #fbd786, #c6ffdd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            TOP SUPPORTER
          </span>
        </div>

        {/* Leaders List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {leaders.map((lead: any, idx: number) => {
            let medalColor = "#ff4b2b";
            if (idx === 0) medalColor = "#ffd700"; // Gold
            else if (idx === 1) medalColor = "#c0c0c0"; // Silver
            else if (idx === 2) medalColor = "#cd7f32"; // Bronze

            return (
              <div 
                key={lead.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "12px",
                  padding: "10px 14px",
                  border: `1px solid rgba(255,255,255,0.05)`
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    backgroundColor: medalColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: "800",
                    color: idx <= 2 ? "#000" : "#fff"
                  }}>
                    {idx + 1}
                  </div>
                  <span style={{ fontWeight: "700", fontSize: "14px" }}>{lead.name}</span>
                </div>
                <span style={{ color: "#aaa", fontSize: "13px", fontWeight: "600" }}>
                  Rp {lead.totalAmount.toLocaleString("id-ID")}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
