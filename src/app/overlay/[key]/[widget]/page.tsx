"use client";

export const runtime = "edge";

import { useParams } from "next/navigation";
import SoundboardOverlay from "@/components/overlays/SoundboardOverlay";
import SubathonOverlay from "@/components/overlays/SubathonOverlay";
import VotingOverlay from "@/components/overlays/VotingOverlay";
import MilestoneOverlay from "@/components/overlays/MilestoneOverlay";
import RunningTextOverlay from "@/components/overlays/RunningTextOverlay";
import LeaderboardOverlay from "@/components/overlays/LeaderboardOverlay";
import QrOverlay from "@/components/overlays/QROverlay";
import MediashareOverlay from "@/components/overlays/MediashareOverlay";

export default function UnifiedWidgetOverlayPage() {
  const params = useParams();
  const widget = params?.widget as string;

  switch (widget) {
    case "soundboard":
      return <SoundboardOverlay />;
    case "subathon":
      return <SubathonOverlay />;
    case "voting":
      return <VotingOverlay />;
    case "milestone":
      return <MilestoneOverlay />;
    case "running-text":
      return <RunningTextOverlay />;
    case "leaderboard":
      return <LeaderboardOverlay />;
    case "qr":
      return <QrOverlay />;
    case "mediashare":
      return <MediashareOverlay />;
    default:
      return (
        <div style={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          color: "red",
          fontFamily: "sans-serif",
          fontSize: "14px",
          background: "rgba(0,0,0,0.8)"
        }}>
          Error: Widget "{widget}" tidak ditemukan.
        </div>
      );
  }
}
