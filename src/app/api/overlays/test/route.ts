export const runtime = "edge";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { triggerDonationAlert } from "@/lib/overlay-events";

// POST /api/overlays/test
// Simulates / triggers a test event to OBS overlay by key and widgetType
export async function POST(request: Request) {
  try {
    const { key, widgetType, senderName, amount, message } = await request.json();

    if (!key) {
      return NextResponse.json({ error: "Overlay key is required." }, { status: 400 });
    }

    const overlaySettings = await db.overlaySettings.findUnique({
      where: { key },
      include: {
        creator: {
          include: {
            user: true,
            milestoneGoal: true,
            subathonTimer: true,
            votingPoll: { include: { options: true } }
          }
        }
      }
    });

    if (!overlaySettings) {
      return NextResponse.json({ error: "Overlay settings not found." }, { status: 404 });
    }

    const creator = overlaySettings.creator;
    const type = widgetType || "alert";

    // ── 1. Standard Alert ───────────────────────────────────────────────────
    if (type === "alert" || type === "qr" || type === "leaderboard" || type === "running-text") {
      triggerDonationAlert(key, {
        orderId: `test-order-${Math.floor(1000 + Math.random() * 9000)}`,
        creatorId: overlaySettings.creatorId,
        senderName: senderName || "Donatur Uji Coba",
        amount: amount || 25000,
        message: message || "Ini adalah pesan donasi uji coba overlay!",
        isVerified: creator.user.isVerified,
        activeThemeId: overlaySettings.activeThemeId,
        alertSoundUrl: overlaySettings.alertSoundUrl,
        alertImageUrl: overlaySettings.alertImageUrl,
        alertDuration: overlaySettings.alertDuration,
        fontFamily: overlaySettings.fontFamily,
        fontSize: overlaySettings.fontSize,
        backgroundColor: overlaySettings.backgroundColor,
        textColor: overlaySettings.textColor,
        highlightColor: overlaySettings.highlightColor,
        alertTemplate: overlaySettings.alertTemplate,
      });
    }

    // ── 2. Media Share ──────────────────────────────────────────────────────
    else if (type === "mediashare") {
      triggerDonationAlert(key, {
        type: "mediashare_play",
        mediaId: 9999,
        youtubeId: "dQw4w9WgXcQ", // Rick Astley - Never Gonna Give You Up
        mediaUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        mediaType: "youtube",
        title: "Rick Astley - Never Gonna Give You Up (Test Video)",
        senderName: senderName || "Donatur Uji Coba",
        duration: 212
      } as any);
    }

    // ── 3. Soundboard ───────────────────────────────────────────────────────
    else if (type === "soundboard") {
      triggerDonationAlert(key, {
        soundboardPlay: {
          name: "Coin Clink (Test)",
          soundUrl: "/sounds/coin.mp3"
        }
      } as any);
    }

    // ── 4. Subathon Timer ────────────────────────────────────────────────────
    else if (type === "subathon") {
      const currentSeconds = creator.subathonTimer?.remainingSeconds ?? 3600;
      triggerDonationAlert(key, {
        subathonTimer: {
          remainingSeconds: currentSeconds + 300, // Add 5 minutes for test
          isActive: true
        }
      } as any);
    }

    // ── 5. Voting / Polling ──────────────────────────────────────────────────
    else if (type === "voting") {
      if (creator.votingPoll) {
        // Return existing options with incremented votes for testing
        const testOptions = creator.votingPoll.options.map(opt => ({
          ...opt,
          votesCount: opt.votesCount + Math.floor(Math.random() * 50000)
        }));
        triggerDonationAlert(key, {
          votingPoll: {
            ...creator.votingPoll,
            options: testOptions
          }
        } as any);
      } else {
        // Fallback mock poll if creator has none active
        triggerDonationAlert(key, {
          votingPoll: {
            title: "Siapa hero Mobile Legends favoritmu? (Uji Coba)",
            options: [
              { id: 1, name: "Layla", votesCount: 150000 },
              { id: 2, name: "Gusion", votesCount: 280000 },
              { id: 3, name: "Fanny", votesCount: 95000 }
            ]
          }
        } as any);
      }
    }

    // ── 6. Milestone Goal ────────────────────────────────────────────────────
    else if (type === "milestone") {
      if (creator.milestoneGoal) {
        triggerDonationAlert(key, {
          milestoneGoal: {
            ...creator.milestoneGoal,
            currentAmount: Math.min(creator.milestoneGoal.targetAmount, creator.milestoneGoal.currentAmount + 50000)
          }
        } as any);
      } else {
        triggerDonationAlert(key, {
          milestoneGoal: {
            title: "Upgrade PC Streaming (Uji Coba)",
            targetAmount: 5000000,
            currentAmount: 2350000
          }
        } as any);
      }
    }

    return NextResponse.json({ success: true, message: `Test event for ${type} triggered successfully.` });
  } catch (error: any) {
    console.error("Test trigger error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
