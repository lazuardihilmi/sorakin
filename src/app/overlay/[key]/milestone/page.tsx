"use client";
export const runtime = "edge";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RefreshCw, Target } from "lucide-react";

export default function MilestoneOverlay() {
  const params = useParams();
  const key = params.key as string;

  const [connected, setConnected] = useState(false);
  const [milestone, setMilestone] = useState<any>(null);

  const fetchMilestone = async () => {
    try {
      const res = await fetch(`/api/creator/widgets?key=${key}`);
      const data = await res.json();
      if (res.ok && data.milestoneGoal) {
        setMilestone(data.milestoneGoal);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!key) return;
    document.body.classList.add("obs-overlay-body");

    fetchMilestone();

    const eventSource = new EventSource(`/api/overlays/stream?key=${key}`);

    eventSource.onopen = () => {
      setConnected(true);
    };

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "connect") return;

      const updatedMilestone = data.milestoneGoal;
      if (updatedMilestone) {
        setMilestone(updatedMilestone);
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
        Menghubungkan Milestone Overlay...
      </div>
    );
  }

  if (!milestone || !milestone.isActive) {
    return (
      <div style={{ color: "rgba(255,255,255,0.15)", fontSize: "14px", fontWeight: "600", textAlign: "center", paddingTop: "50px" }}>
        [Tidak Ada Target Aktif]
      </div>
    );
  }

  const percentage = Math.min((milestone.currentAmount / milestone.targetAmount) * 100, 100);

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
        width: "480px",
        background: "rgba(15, 15, 15, 0.95)",
        border: "2px solid #00E5FF",
        boxShadow: "0 0 25px rgba(0, 229, 255, 0.2)",
        borderRadius: "20px",
        padding: "20px 24px",
        color: "white"
      }}>
        {/* Title */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Target size={20} style={{ color: "#00E5FF" }} />
            <span style={{ fontSize: "15px", fontWeight: "800", letterSpacing: "-0.5px" }}>
              {milestone.title}
            </span>
          </div>
          <span style={{ fontSize: "14px", fontWeight: "700", color: "#00E5FF" }}>
            {percentage.toFixed(0)}%
          </span>
        </div>

        {/* Progress Bar */}
        <div style={{
          height: "20px",
          background: "rgba(255, 255, 255, 0.08)",
          borderRadius: "10px",
          overflow: "hidden",
          width: "100%",
          position: "relative",
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)"
        }}>
          <div style={{
            width: `${percentage}%`,
            height: "100%",
            background: "linear-gradient(90deg, #00B0FF, #00E5FF)",
            borderRadius: "10px",
            transition: "width 0.8s cubic-bezier(0.1, 0.8, 0.2, 1)"
          }}></div>
        </div>

        {/* Amount description */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#aaa", marginTop: "10px", fontWeight: "600" }}>
          <span>Rp {milestone.currentAmount.toLocaleString("id-ID")}</span>
          <span>Target: Rp {milestone.targetAmount.toLocaleString("id-ID")}</span>
        </div>
      </div>
    </div>
  );
}
