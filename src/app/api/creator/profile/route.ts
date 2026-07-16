
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const creator = await db.creator.findUnique({
    where: { userId: user.id },
    include: { settings: true, overlay: true }
  });

  return NextResponse.json({ creator });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const action = formData.get("action") as string; // 'create' or 'update-profile' or 'update-images'

      if (action === "create") {
        const name = formData.get("name") as string;
        const username = formData.get("username") as string;
        const category = formData.get("category") as string;
        const description = formData.get("description") as string;

        if (!name || !username || !category) {
          return NextResponse.json({ error: "Name, username, and category are required." }, { status: 400 });
        }

        // Validate username format
        const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
        if (cleanUsername.length < 3) {
          return NextResponse.json({ error: "Username minimal 3 karakter alfanumerik tanpa spasi." }, { status: 400 });
        }

        // Check if username is taken
        const existingCreator = await db.creator.findUnique({ where: { username: cleanUsername } });
        if (existingCreator) {
          return NextResponse.json({ error: "Username sudah digunakan oleh kreator lain." }, { status: 400 });
        }

        // Create Creator, Default Settings, and Default Overlay settings
        const overlayKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const creator = await db.creator.create({
          data: {
            userId: user.id,
            name,
            username: cleanUsername,
            category,
            description: description || "",
            settings: {
              create: {
                showFeed: false,
                showAmount: false,
                feeCoverage: "CREATOR",
                quickAmounts: "10000,20000,50000,100000",
              }
            },
            overlay: {
              create: {
                key: overlayKey,
                activeThemeId: 1,
                alertSoundUrl: "/sounds/default-alert.mp3",
                alertImageUrl: "/images/default-alert.gif",
                alertDuration: 5,
                fontFamily: "Outfit",
                fontSize: 24,
                backgroundColor: "#00000000",
                textColor: "#ffffff",
                highlightColor: "#ffc107",
                alertTemplate: "{sender} baru saja mengirim {amount}!\n\"{message}\""
              }
            }
          },
          include: { settings: true, overlay: true }
        });

        return NextResponse.json({ success: true, creator });
      }

      if (action === "update-profile") {
        const creator = await db.creator.findUnique({ where: { userId: user.id } });
        if (!creator) return NextResponse.json({ error: "Creator profile not found." }, { status: 404 });

        const name = formData.get("name") as string;
        const username = formData.get("username") as string;
        const category = formData.get("category") as string;
        const description = formData.get("description") as string;

        // Validation
        const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
        if (cleanUsername.length < 3) {
          return NextResponse.json({ error: "Username minimal 3 karakter alfanumerik tanpa spasi." }, { status: 400 });
        }

        if (cleanUsername !== creator.username) {
          const isTaken = await db.creator.findUnique({ where: { username: cleanUsername } });
          if (isTaken) {
            return NextResponse.json({ error: "Username sudah digunakan." }, { status: 400 });
          }
        }

        const updatedCreator = await db.creator.update({
          where: { id: creator.id },
          data: {
            name: name || creator.name,
            username: cleanUsername,
            category: category || creator.category,
            description: description !== null ? description.substring(0, 300) : creator.description
          }
        });

        return NextResponse.json({ success: true, creator: updatedCreator });
      }

      if (action === "update-images") {
        const creator = await db.creator.findUnique({ where: { userId: user.id } });
        if (!creator) return NextResponse.json({ error: "Creator profile not found." }, { status: 404 });

        const avatarFile = formData.get("avatar") as File | null;
        const coverFile = formData.get("cover") as File | null;

        const updateData: { avatarUrl?: string; coverUrl?: string } = {};

        if (avatarFile && avatarFile.size > 0) {
          if (avatarFile.size > 2 * 1024 * 1024) {
            return NextResponse.json({ error: "Ukuran avatar maksimal 2MB." }, { status: 400 });
          }
          const buffer = Buffer.from(await avatarFile.arrayBuffer());
          const base64Data = buffer.toString("base64");
          const mimeType = avatarFile.type || "image/jpeg";
          updateData.avatarUrl = `data:${mimeType};base64,${base64Data}`;
        }

        if (coverFile && coverFile.size > 0) {
          if (coverFile.size > 2 * 1024 * 1024) {
            return NextResponse.json({ error: "Ukuran cover maksimal 2MB." }, { status: 400 });
          }
          const buffer = Buffer.from(await coverFile.arrayBuffer());
          const base64Data = buffer.toString("base64");
          const mimeType = coverFile.type || "image/jpeg";
          updateData.coverUrl = `data:${mimeType};base64,${base64Data}`;
        }

        const updatedCreator = await db.creator.update({
          where: { id: creator.id },
          data: updateData
        });

        return NextResponse.json({ success: true, creator: updatedCreator });
      }
    } else {
      // Handle standard JSON configuration updates (settings, overlay properties, social URLs, keywords)
      const body = await request.json();
      const creator = await db.creator.findUnique({
        where: { userId: user.id },
        include: { settings: true, overlay: true }
      });
      if (!creator) return NextResponse.json({ error: "Creator profile not found." }, { status: 404 });

      const { settings, overlay } = body;

      if (settings) {
        // Validation: quickAmounts must contain up to 4 numbers, positive
        if (settings.quickAmounts) {
          const amounts = settings.quickAmounts.split(",").map((a: string) => parseFloat(a.trim()));
          if (amounts.length > 4) {
            return NextResponse.json({ error: "Jumlah default nominal cepat tidak boleh lebih dari 4." }, { status: 400 });
          }
          if (amounts.some((a: number) => isNaN(a) || a <= 0)) {
            return NextResponse.json({ error: "Nominal harus berupa angka positif." }, { status: 400 });
          }
        }

        await db.creatorSettings.update({
          where: { creatorId: creator.id },
          data: {
            showFeed: settings.showFeed !== undefined ? settings.showFeed : undefined,
            showAmount: settings.showAmount !== undefined ? settings.showAmount : undefined,
            feeCoverage: settings.feeCoverage || undefined,
            quickAmounts: settings.quickAmounts || undefined,
            socialInstagram: settings.socialInstagram !== undefined ? settings.socialInstagram : undefined,
            socialFacebook: settings.socialFacebook !== undefined ? settings.socialFacebook : undefined,
            socialX: settings.socialX !== undefined ? settings.socialX : undefined,
            socialTiktok: settings.socialTiktok !== undefined ? settings.socialTiktok : undefined,
            socialTwitch: settings.socialTwitch !== undefined ? settings.socialTwitch : undefined,
            socialYoutube: settings.socialYoutube !== undefined ? settings.socialYoutube : undefined,
            socialWebsite: settings.socialWebsite !== undefined ? settings.socialWebsite : undefined,
            enableKeywordFilter: settings.enableKeywordFilter !== undefined ? settings.enableKeywordFilter : undefined,
            customKeywords: settings.customKeywords !== undefined ? settings.customKeywords : undefined,
            blockRecentMedia: settings.blockRecentMedia !== undefined ? settings.blockRecentMedia : undefined,
            discordWebhook: settings.discordWebhook !== undefined ? settings.discordWebhook : undefined,
            discordTemplate: settings.discordTemplate !== undefined ? settings.discordTemplate : undefined,
            customWebhookUrl: settings.customWebhookUrl !== undefined ? settings.customWebhookUrl : undefined,
            customWebhookToken: settings.customWebhookToken !== undefined ? settings.customWebhookToken : undefined,
          }
        });
      }

      if (overlay) {
        await db.overlaySettings.update({
          where: { creatorId: creator.id },
          data: {
            activeThemeId: overlay.activeThemeId !== undefined ? overlay.activeThemeId : undefined,
            alertSoundUrl: overlay.alertSoundUrl || undefined,
            alertImageUrl: overlay.alertImageUrl || undefined,
            alertDuration: overlay.alertDuration !== undefined ? parseInt(overlay.alertDuration) : undefined,
            fontFamily: overlay.fontFamily || undefined,
            fontSize: overlay.fontSize !== undefined ? parseInt(overlay.fontSize) : undefined,
            backgroundColor: overlay.backgroundColor || undefined,
            textColor: overlay.textColor || undefined,
            highlightColor: overlay.highlightColor || undefined,
            alertTemplate: overlay.alertTemplate || undefined,
          }
        });
      }

      const updatedCreator = await db.creator.findUnique({
        where: { id: creator.id },
        include: { settings: true, overlay: true }
      });

      return NextResponse.json({ success: true, creator: updatedCreator });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}
