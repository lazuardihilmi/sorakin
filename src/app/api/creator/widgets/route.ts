
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/creator/widgets
// Load all widget settings for the active creator profile
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  const username = searchParams.get("username");

  let creatorId: number;
  let creatorUsername: string;

  if (key) {
    const overlay = await db.overlaySettings.findUnique({
      where: { key },
      include: {
        creator: true
      }
    });
    if (!overlay) {
      return NextResponse.json({ error: "Invalid overlay key" }, { status: 404 });
    }
    creatorId = overlay.creatorId;
    creatorUsername = overlay.creator.username;
  } else if (username) {
    const creator = await db.creator.findUnique({
      where: { username: username.toLowerCase() }
    });
    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }
    creatorId = creator.id;
    creatorUsername = creator.username;
  } else {
    const user = await getCurrentUser();
    if (!user || !user.creator) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    creatorId = user.creator.id;
    creatorUsername = user.creator.username;
  }

  try {
    const milestoneGoal = await db.milestoneGoal.findUnique({ where: { creatorId } });
    const subathonTimer = await db.subathonTimer.findUnique({ where: { creatorId } });
    const votingPoll = await db.votingPoll.findUnique({
      where: { creatorId },
      include: { options: true }
    });
    const soundboardSounds = await db.soundboardSound.findMany({ where: { creatorId } });

    return NextResponse.json({
      creatorUsername,
      milestoneGoal,
      subathonTimer,
      votingPoll,
      soundboardSounds
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/creator/widgets
// Update a specific widget's settings
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !user.creator) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const creatorId = user.creator.id;
  try {
    const body = await request.json();
    const { action } = body; // "milestone", "subathon", "poll", "soundboard"

    if (action === "milestone") {
      const { title, targetAmount, isActive, resetCurrent } = body;
      const data: any = {
        title,
        targetAmount: parseFloat(targetAmount) || 0,
        isActive: !!isActive
      };
      if (resetCurrent) {
        data.currentAmount = 0.0;
      }

      const result = await db.milestoneGoal.upsert({
        where: { creatorId },
        update: data,
        create: { creatorId, ...data }
      });
      return NextResponse.json({ success: true, milestoneGoal: result });
    }

    if (action === "subathon") {
      const { remainingSeconds, secondsPerRupiah, maxSeconds, isActive } = body;
      const data: any = {
        remainingSeconds: parseInt(remainingSeconds) ?? 3600,
        secondsPerRupiah: parseFloat(secondsPerRupiah) ?? 0.01,
        maxSeconds: parseInt(maxSeconds) ?? 86400,
        isActive: !!isActive,
        lastUpdatedAt: new Date()
      };

      const result = await db.subathonTimer.upsert({
        where: { creatorId },
        update: data,
        create: { creatorId, ...data }
      });
      return NextResponse.json({ success: true, subathonTimer: result });
    }

    if (action === "poll") {
      const { title, options, isActive } = body; // options: Array of option strings e.g. ["Choice A", "Choice B"]
      
      // If we are updating/creating a poll, let's delete the old one or overwrite it
      // For simplicity, recreate the poll
      if (isActive === false) {
        // Just disable
        const result = await db.votingPoll.update({
          where: { creatorId },
          data: { isActive: false }
        });
        return NextResponse.json({ success: true, votingPoll: result });
      }

      // Check if there is an existing poll
      const existingPoll = await db.votingPoll.findUnique({ where: { creatorId } });
      if (existingPoll) {
        await db.votingPoll.delete({ where: { creatorId } });
      }

      const result = await db.votingPoll.create({
        data: {
          creatorId,
          title,
          isActive: true,
          options: {
            create: options.map((opt: string) => ({ name: opt }))
          }
        },
        include: { options: true }
      });

      return NextResponse.json({ success: true, votingPoll: result });
    }

    if (action === "soundboard_add") {
      const { name, soundUrl, price } = body;
      const result = await db.soundboardSound.create({
        data: {
          creatorId,
          name,
          soundUrl,
          price: parseFloat(price) || 0
        }
      });
      return NextResponse.json({ success: true, sound: result });
    }

    if (action === "soundboard_delete") {
      const { id } = body;
      await db.soundboardSound.delete({
        where: { id: parseInt(id) }
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
