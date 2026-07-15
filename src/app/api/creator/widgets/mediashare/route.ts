import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { triggerDonationAlert } from "@/lib/overlay-events";

// GET /api/creator/widgets/mediashare
// Get all pending and active videos in the playlist queue
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key"); // Overlay key or creator token

  let creatorId: number;

  if (key) {
    // Loaded by OBS browser overlay directly (which only has the overlay key)
    const overlay = await db.overlaySettings.findUnique({
      where: { key }
    });
    if (!overlay) {
      return NextResponse.json({ error: "Invalid overlay key" }, { status: 404 });
    }
    creatorId = overlay.creatorId;
  } else {
    // Loaded by Dashboard (requires auth session)
    const user = await getCurrentUser();
    if (!user || !user.creator) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    creatorId = user.creator.id;
  }

  try {
    const queue = await db.mediashareQueue.findMany({
      where: {
        creatorId,
        status: { in: ["PENDING", "PLAYING"] }
      },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json({ queue });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/creator/widgets/mediashare
// Trigger video skip, complete, or start playing (Dashboard control action)
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !user.creator) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const creatorId = user.creator.id;
  try {
    const body = await request.json();
    const { id, action } = body; // action: "play", "finish", "skip", "clear"

    // If clearing entire queue
    if (action === "clear") {
      await db.mediashareQueue.updateMany({
        where: { creatorId, status: "PENDING" },
        data: { status: "SKIPPED" }
      });
      
      // Notify SSE overlay player to skip/clear immediately
      const overlay = await db.overlaySettings.findUnique({ where: { creatorId } });
      if (overlay) {
        triggerDonationAlert(overlay.key, {
          type: "mediashare_clear"
        } as any);
      }
      return NextResponse.json({ success: true });
    }

    const queueItem = await db.mediashareQueue.findUnique({
      where: { id: parseInt(id) }
    });

    if (!queueItem || queueItem.creatorId !== creatorId) {
      return NextResponse.json({ error: "Queue item not found" }, { status: 404 });
    }

    let nextStatus = "PENDING";
    if (action === "play") nextStatus = "PLAYING";
    else if (action === "finish") nextStatus = "PLAYED";
    else if (action === "skip") nextStatus = "SKIPPED";

    const updated = await db.mediashareQueue.update({
      where: { id: queueItem.id },
      data: { status: nextStatus }
    });

    // Notify OBS overlay of player updates via SSE trigger
    const overlay = await db.overlaySettings.findUnique({ where: { creatorId } });
    if (overlay) {
      triggerDonationAlert(overlay.key, {
        type: `mediashare_${action}`,
        mediaId: queueItem.id,
        youtubeId: queueItem.youtubeId,
        title: queueItem.title,
        senderName: queueItem.senderName,
        duration: queueItem.duration
      } as any);
    }

    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
