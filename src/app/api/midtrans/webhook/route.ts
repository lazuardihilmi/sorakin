import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";
import { triggerDonationAlert } from "@/lib/overlay-events";

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Midtrans Callback Body:", body);

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      payment_type,
      fraud_status,
    } = body;

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
    }

    // 1. Verify Midtrans Signature Key
    // signature_key = SHA512(order_id + status_code + gross_amount + server_key)
    const signatureSource = `${order_id}${status_code}${gross_amount}${MIDTRANS_SERVER_KEY}`;
    const calculatedSignature = crypto
      .createHash("sha512")
      .update(signatureSource)
      .digest("hex");

    if (calculatedSignature !== signature_key) {
      console.warn("Midtrans signature key verification failed.");
      return NextResponse.json({ error: "Invalid signature key." }, { status: 403 });
    }

    // 2. Find local pending donation
    const donation = await db.donation.findUnique({
      where: { id: order_id },
      include: {
        creator: {
          include: {
            settings: true,
            overlay: true,
            user: true
          }
        },
        sender: true
      }
    });

    if (!donation) {
      return NextResponse.json({ error: "Donation record not found." }, { status: 404 });
    }

    // Check if donation is already processed
    if (donation.paymentStatus !== "PENDING") {
      return NextResponse.json({ message: "Donation already processed." }, { status: 200 });
    }

    // 3. Determine status mapping
    let isSuccess = false;
    let isFailed = false;

    if (transaction_status === "capture") {
      if (payment_type === "credit_card") {
        if (fraud_status === "accept") {
          isSuccess = true;
        } else {
          isFailed = true;
        }
      }
    } else if (transaction_status === "settlement") {
      isSuccess = true;
    } else if (
      transaction_status === "cancel" ||
      transaction_status === "deny" ||
      transaction_status === "expire"
    ) {
      isFailed = true;
    }

    // 4. Handle state updates
    if (isSuccess) {
      // Calculate net creator gain
      const feeCoverage = donation.creator.settings?.feeCoverage || "CREATOR";
      const totalFee = donation.serviceFee + donation.platformFee + donation.vatFee;
      const creatorPayout = feeCoverage === "SUPPORTER" ? donation.amount : donation.amount - totalFee;

      // Determine settlement schedule:
      // Standard is 24 hours. Credit card is 3 days (72 hours).
      const isCC = donation.paymentType === "CREDIT_CARD";
      const settleSchedule = new Date();
      settleSchedule.setHours(settleSchedule.getHours() + (isCC ? 72 : 24));

      let updatedMilestone: any = null;
      let updatedSubathon: any = null;
      let updatedVoting: any = null;
      let triggeredSound: any = null;
      let addedVideo: any = null;

      await db.$transaction(async (tx) => {
        // Mark donation as paid
        await tx.donation.update({
          where: { id: donation.id },
          data: {
            paymentStatus: "SUCCESS",
            settledAt: new Date(),
          }
        });

        // Add payout to pending_balance
        await tx.creator.update({
          where: { id: donation.creator.id },
          data: {
            pendingBalance: {
              increment: creatorPayout
            }
          }
        });

        // Create settlement task
        await tx.settlement.create({
          data: {
            donationId: donation.id,
            creatorId: donation.creator.id,
            amount: creatorPayout,
            settleSchedule,
            status: "UNSETTLED",
          }
        });

        // 1. Milestone Goal progress increment
        const activeMilestone = await tx.milestoneGoal.findUnique({
          where: { creatorId: donation.creator.id }
        });
        if (activeMilestone && activeMilestone.isActive) {
          updatedMilestone = await tx.milestoneGoal.update({
            where: { id: activeMilestone.id },
            data: {
              currentAmount: {
                increment: donation.amount
              }
            }
          });
        }

        // 2. Subathon Timer extension
        const activeSubathon = await tx.subathonTimer.findUnique({
          where: { creatorId: donation.creator.id }
        });
        if (activeSubathon && activeSubathon.isActive) {
          const addedSeconds = Math.round(donation.amount * activeSubathon.secondsPerRupiah);
          const newRemaining = Math.min(
            activeSubathon.remainingSeconds + addedSeconds,
            activeSubathon.maxSeconds
          );
          updatedSubathon = await tx.subathonTimer.update({
            where: { id: activeSubathon.id },
            data: {
              remainingSeconds: newRemaining,
              lastUpdatedAt: new Date()
            }
          });
        }

        // 3. Voting choice increment
        if (donation.votingOptionId) {
          const option = await tx.votingOption.update({
            where: { id: donation.votingOptionId },
            data: {
              votesCount: {
                increment: donation.amount
              }
            }
          });
          
          updatedVoting = await tx.votingPoll.findUnique({
            where: { creatorId: donation.creator.id },
            include: { options: true }
          });
        }

        // 4. Mediashare insertion
        if (donation.mediashareVidId) {
          addedVideo = await tx.mediashareQueue.create({
            data: {
              creatorId: donation.creatorId,
              youtubeId: donation.mediashareVidId,
              title: donation.mediashareTitle || "YouTube Video",
              senderName: donation.senderName,
              duration: 180, // Default 3 mins
              status: "PENDING"
            }
          });
        }

        // 5. Soundboard sound check
        if (donation.soundboardSoundId) {
          const sound = await tx.soundboardSound.findUnique({
            where: { id: donation.soundboardSoundId }
          });
          if (sound && sound.isActive && donation.amount >= sound.price) {
            triggeredSound = sound;
          }
        }
      });

      // 5. Trigger live OBS Overlay Alert
      if (donation.creator.overlay) {
        triggerDonationAlert(donation.creator.overlay.key, {
          orderId: donation.id,
          creatorId: donation.creator.id,
          senderName: donation.senderName,
          amount: donation.amount,
          message: donation.message || "",
          isVerified: donation.sender?.isVerified || false,
          activeThemeId: donation.creator.overlay.activeThemeId,
          alertSoundUrl: donation.creator.overlay.alertSoundUrl,
          alertImageUrl: donation.creator.overlay.alertImageUrl,
          alertDuration: donation.creator.overlay.alertDuration,
          fontFamily: donation.creator.overlay.fontFamily,
          fontSize: donation.creator.overlay.fontSize,
          backgroundColor: donation.creator.overlay.backgroundColor,
          textColor: donation.creator.overlay.textColor,
          highlightColor: donation.creator.overlay.highlightColor,
          alertTemplate: donation.creator.overlay.alertTemplate,
          // Widgets payload
          milestoneGoal: updatedMilestone,
          subathonTimer: updatedSubathon,
          votingPoll: updatedVoting,
          soundboardPlay: triggeredSound,
          mediashareAdd: addedVideo,
        });
      }

      // 6. Trigger Discord webhook notification
      const discordUrl = donation.creator.settings?.discordWebhook;
      if (discordUrl) {
        let messageText = donation.creator.settings?.discordTemplate || "{sender} baru saja memberikan tip sebesar {amount}!";
        
        // Ensure replaced only once as per PRD
        const formattedAmount = `Rp ${donation.amount.toLocaleString("id-ID")}`;
        messageText = messageText
          .replace("{sender}", donation.senderName)
          .replace("{amount}", formattedAmount);

        try {
          await fetch(discordUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: messageText }),
          });
        } catch (e) {
          console.error("Failed to trigger Discord webhook", e);
        }
      }

      // 7. Trigger Custom API Integration Webhook
      const customUrl = donation.creator.settings?.customWebhookUrl;
      const customToken = donation.creator.settings?.customWebhookToken;
      if (customUrl) {
        try {
          await fetch(customUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${customToken || ""}`,
            },
            body: JSON.stringify({
              event: "tip.success",
              orderId: donation.id,
              sender: donation.senderName,
              amount: donation.amount,
              message: donation.message,
              timestamp: new Date().toISOString(),
            }),
          });
        } catch (e) {
          console.error("Failed to trigger custom webhook", e);
        }
      }

      return NextResponse.json({ status: "success", message: "Webhook processed successfully" });
    } else if (isFailed) {
      await db.donation.update({
        where: { id: donation.id },
        data: { paymentStatus: "FAILED" }
      });
      return NextResponse.json({ status: "failed", message: "Payment marked as failed" });
    }

    return NextResponse.json({ message: "Webhook ignored (non-actionable status)" });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
