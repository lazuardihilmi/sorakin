export const runtime = "edge";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { triggerDonationAlert } from "@/lib/overlay-events";

// GET /api/creator/widgets/mediashare
// Returns mediashare settings + active queue
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  const username = searchParams.get("username");

  let creatorId: number;

  if (key) {
    const overlay = await db.overlaySettings.findUnique({ where: { key } });
    if (!overlay) return NextResponse.json({ error: "Invalid overlay key" }, { status: 404 });
    creatorId = overlay.creatorId;
  } else if (username) {
    const creator = await db.creator.findUnique({ where: { username } });
    if (!creator) return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    creatorId = creator.id;
  } else {
    const user = await getCurrentUser();
    if (!user || !user.creator) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    creatorId = user.creator.id;
  }

  try {
    const [settings, queue] = await Promise.all([
      db.mediashareSettings.findUnique({ where: { creatorId } }),
      db.mediashareQueue.findMany({
        where: { creatorId, status: { in: ["PENDING", "PLAYING"] } },
        orderBy: { createdAt: "asc" }
      })
    ]);

    return NextResponse.json({ settings, queue });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/creator/widgets/mediashare
// Actions: "settings" | "play" | "finish" | "skip" | "clear"
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !user.creator) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const creatorId = user.creator.id;
  try {
    const body = await request.json();
    const { action } = body;

    // ── Save mediashare settings ──────────────────────────────────────────────
    if (action === "settings") {
      const {
        isActive, enableYoutube, enableTiktok, enableIgReels, enableVoiceNote,
        maxVideoDuration, pricePerSecond, minVideoPrice,
        maxAudioDuration, audioPricePerSecond, minAudioPrice
      } = body;

      const settings = await db.mediashareSettings.upsert({
        where: { creatorId },
        update: {
          isActive: Boolean(isActive),
          enableYoutube: Boolean(enableYoutube),
          enableTiktok: Boolean(enableTiktok),
          enableIgReels: Boolean(enableIgReels),
          enableVoiceNote: Boolean(enableVoiceNote),
          maxVideoDuration: parseInt(maxVideoDuration) || 300,
          pricePerSecond: parseInt(pricePerSecond) || 100,
          minVideoPrice: parseInt(minVideoPrice) || 10000,
          maxAudioDuration: parseInt(maxAudioDuration) || 60,
          audioPricePerSecond: parseInt(audioPricePerSecond) || 200,
          minAudioPrice: parseInt(minAudioPrice) || 50000,
        },
        create: {
          creatorId,
          isActive: Boolean(isActive),
          enableYoutube: Boolean(enableYoutube),
          enableTiktok: Boolean(enableTiktok),
          enableIgReels: Boolean(enableIgReels),
          enableVoiceNote: Boolean(enableVoiceNote),
          maxVideoDuration: parseInt(maxVideoDuration) || 300,
          pricePerSecond: parseInt(pricePerSecond) || 100,
          minVideoPrice: parseInt(minVideoPrice) || 10000,
          maxAudioDuration: parseInt(maxAudioDuration) || 60,
          audioPricePerSecond: parseInt(audioPricePerSecond) || 200,
          minAudioPrice: parseInt(minAudioPrice) || 50000,
        }
      });

      return NextResponse.json({ success: true, settings });
    }

    // ── Clear entire queue ────────────────────────────────────────────────────
    if (action === "clear") {
      await db.mediashareQueue.updateMany({
        where: { creatorId, status: { in: ["PENDING", "PLAYING"] } },
        data: { status: "SKIPPED" }
      });
      const overlay = await db.overlaySettings.findUnique({ where: { creatorId } });
      if (overlay) triggerDonationAlert(overlay.key, { type: "mediashare_clear" } as any);
      return NextResponse.json({ success: true });
    }

    // ── Single item actions ───────────────────────────────────────────────────
    const { id } = body;
    const queueItem = await db.mediashareQueue.findUnique({ where: { id: parseInt(id) } });
    if (!queueItem || queueItem.creatorId !== creatorId) {
      return NextResponse.json({ error: "Queue item not found" }, { status: 404 });
    }

    let nextStatus = "PENDING";
    if (action === "play")   nextStatus = "PLAYING";
    if (action === "finish") nextStatus = "PLAYED";
    if (action === "skip")   nextStatus = "SKIPPED";

    const updated = await db.mediashareQueue.update({
      where: { id: queueItem.id },
      data: { status: nextStatus }
    });

    const overlay = await db.overlaySettings.findUnique({ where: { creatorId } });
    if (overlay) {
      triggerDonationAlert(overlay.key, {
        type: `mediashare_${action}`,
        mediaId: queueItem.id,
        youtubeId: queueItem.youtubeId,
        mediaUrl: queueItem.mediaUrl,
        mediaType: queueItem.mediaType,
        title: queueItem.title,
        senderName: queueItem.senderName,
        duration: queueItem.duration,
      } as any);
    }

    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
