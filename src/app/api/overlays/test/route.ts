import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { triggerDonationAlert } from "@/lib/overlay-events";

// POST /api/overlays/test
// Simulates / triggers a test donation alert to OBS overlay by key
export async function POST(request: Request) {
  try {
    const { key, senderName, amount, message } = await request.json();

    if (!key) {
      return NextResponse.json({ error: "Overlay key is required." }, { status: 400 });
    }

    const overlaySettings = await db.overlaySettings.findUnique({
      where: { key },
      include: {
        creator: {
          include: {
            user: true
          }
        }
      }
    });

    if (!overlaySettings) {
      return NextResponse.json({ error: "Overlay settings not found." }, { status: 404 });
    }

    triggerDonationAlert(key, {
      orderId: `test-order-${Math.floor(1000 + Math.random() * 9000)}`,
      creatorId: overlaySettings.creatorId,
      senderName: senderName || "Donatur Uji Coba",
      amount: amount || 25000,
      message: message || "Ini adalah pesan donasi uji coba overlay!",
      isVerified: overlaySettings.creator.user.isVerified,
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

    return NextResponse.json({ success: true, message: "Alert test triggered successfully." });
  } catch (error: any) {
    console.error("Test alert trigger error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
