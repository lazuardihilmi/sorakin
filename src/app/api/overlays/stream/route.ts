import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { overlayEmitter } from "@/lib/overlay-events";

// GET /api/overlays/stream?key=CREATOR_OVERLAY_KEY
// Exposes a Server-Sent Events (SSE) connection channel for OBS overlays
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (!key) {
    return NextResponse.json({ error: "Overlay key is required." }, { status: 400 });
  }

  // 1. Verify overlay key
  const overlaySettings = await db.overlaySettings.findUnique({
    where: { key }
  });

  if (!overlaySettings) {
    return NextResponse.json({ error: "Invalid overlay key." }, { status: 404 });
  }

  // 2. Set headers for SSE
  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });

  // 3. Create readable stream
  const responseStream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Listen for donation success alerts emitted on this key
      const listener = (data: any) => {
        const formattedData = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(formattedData));
      };

      overlayEmitter.on(`alert:${key}`, listener);

      // Send initial connection success event
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connect", message: "Connected to Sorakin Overlay Stream" })}\n\n`));

      // Keep-alive heartbeat every 20 seconds to prevent connection drops
      const keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          // Stream might have closed
          clearInterval(keepAliveInterval);
        }
      }, 20000);

      // Clean up connection on client disconnect
      request.signal.addEventListener("abort", () => {
        overlayEmitter.off(`alert:${key}`, listener);
        clearInterval(keepAliveInterval);
        controller.close();
      });
    },
  });

  return new Response(responseStream, { headers });
}
