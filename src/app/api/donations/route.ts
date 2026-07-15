export const runtime = "edge";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "";
const MIDTRANS_API_URL = "https://api.sandbox.midtrans.com/v2";

// Calculate fees & VAT helper
export function calculateDonationFees(
  amount: number,
  paymentType: string,
  feeCoverage: string,
  isVAT: boolean
) {
  let serviceFee = 0;
  const platformFee = 500; // Flat platform fee of IDR 500

  // 1. Service Fee Calculation
  if (paymentType === "credit_card") {
    // Mixed Fee Type: 2.9% percentage fee and IDR 2000 fixed fee
    const percentage = 2.9;
    const fixed = 2000;
    serviceFee = (amount * (percentage / 100)) / (1 - percentage / 100) + fixed;
  } else if (paymentType === "qris") {
    // Percentage Fee Type: 0.7%
    serviceFee = amount * 0.007;
  } else if (paymentType === "gopay") {
    // Percentage Fee Type: 2.0%
    serviceFee = amount * 0.02;
  }

  // Round service fee to 2 decimal places
  serviceFee = Math.round(serviceFee * 100) / 100;

  // 2. VAT Calculation (11% of support amount + service fee + platform fee)
  let vatFee = 0;
  if (isVAT) {
    vatFee = (amount + serviceFee + platformFee) * 0.11;
    vatFee = Math.round(vatFee * 100) / 100;
  }

  const totalFee = serviceFee + platformFee + vatFee;

  // 3. Final calculations based on fee coverage
  let totalAmount = amount; // What supporter pays
  let netAmount = amount;   // What creator receives

  if (feeCoverage === "SUPPORTER") {
    totalAmount = amount + totalFee;
    netAmount = amount;
  } else {
    // CREATOR covers the fees
    totalAmount = amount;
    netAmount = amount - totalFee;
  }

  return {
    serviceFee,
    platformFee,
    vatFee,
    totalFee,
    totalAmount: Math.round(totalAmount),
    netAmount: Math.round(netAmount),
  };
}

// GET: Retrieve transaction logs
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // 'creator' or 'personal'
  const status = searchParams.get("status") || "Semua"; // Semua, Selesai (SUCCESS), Pending, Gagal, Dibatalkan
  const query = searchParams.get("query") || "";
  const sort = searchParams.get("sort") || "newest"; // newest or oldest
  const limit = parseInt(searchParams.get("limit") || "10");
  const page = parseInt(searchParams.get("page") || "1");
  const skip = (page - 1) * limit;

  // Build where conditions
  const where: any = {};

  if (type === "creator") {
    if (!user.creator) {
      return NextResponse.json({ error: "Creator profile not found" }, { status: 404 });
    }
    where.creatorId = user.creator.id;
  } else {
    // personal mode
    where.senderId = user.id;
  }

  // Filter by status mapping
  if (status !== "Semua") {
    if (status === "Selesai") where.paymentStatus = "SUCCESS";
    else if (status === "Pending") where.paymentStatus = "PENDING";
    else if (status === "Gagal") where.paymentStatus = "FAILED";
    else if (status === "Dibatalkan") where.paymentStatus = "CANCELLED";
  }

  // Filter by search query (order_id/senderName/message)
  if (query) {
    where.OR = [
      { id: { contains: query } },
      { senderName: { contains: query } },
      { message: { contains: query } }
    ];
  }

  try {
    const total = await db.donation.count({ where });
    const donations = await db.donation.findMany({
      where,
      orderBy: { createdAt: sort === "newest" ? "desc" : "asc" },
      skip,
      take: limit,
      include: {
        sender: {
          select: {
            isVerified: true,
            username: true,
          }
        }
      }
    });

    return NextResponse.json({
      donations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create and charge donation via Midtrans Core API
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      creatorUsername,
      senderName,
      senderEmail,
      message,
      amount,
      paymentType, // 'credit_card', 'qris', 'gopay'
      isAnonymous,
      token_id, // For credit card CC token from client
      isVerifiedUser,
      votingOptionId,
      mediashareVidId,
      mediashareTitle,
      soundboardSoundId,
    } = body;

    if (!creatorUsername || !senderName || !senderEmail || !amount || !paymentType) {
      return NextResponse.json({ error: "Mohon isi semua data yang diperlukan." }, { status: 400 });
    }

    const baseAmount = parseFloat(amount);
    if (isNaN(baseAmount) || baseAmount <= 0) {
      return NextResponse.json({ error: "Jumlah nominal tidak valid." }, { status: 400 });
    }

    // Find the creator
    const creator = await db.creator.findUnique({
      where: { username: creatorUsername.toLowerCase() },
      include: { settings: true }
    });

    if (!creator) {
      return NextResponse.json({ error: "Kreator tidak ditemukan." }, { status: 404 });
    }

    // Optional: Filter offensive words if enabled
    let filteredMessage = message || "";
    if (creator.settings?.enableKeywordFilter) {
      const toxicWords = ["anjing", "babi", "bangsat", "goblok", "tolol", "kontol", "memek"]; // standard Indonesian blocklist
      const customWords = creator.settings.customKeywords
        ? creator.settings.customKeywords.split(",").map(w => w.trim().toLowerCase())
        : [];
      const allBlockedWords = [...toxicWords, ...customWords];

      for (const word of allBlockedWords) {
        if (word) {
          const regex = new RegExp(`\\b${word}\\b`, "gi");
          filteredMessage = filteredMessage.replace(regex, "***");
        }
      }
    }

    // Optional: User session check to link sender
    const user = await getCurrentUser();
    const senderId = user ? user.id : null;

    // Check if creator charges VAT (can be enabled via isVAT settings or default is true)
    // For simplicity, let's treat creator settings as charging VAT if configured. Let's make it configurable or check if user.creator wants it. Let's assume active by default for credit_card/qris if settings is custom.
    const isVATEnabled = false; // PPN dinonaktifkan sepenuhnya

    const feeCoverage = creator.settings?.feeCoverage || "CREATOR";
    const feeCalculation = calculateDonationFees(baseAmount, paymentType, feeCoverage, isVATEnabled);

    // Generate unique order ID
    const orderId = `sorakin-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Prepare Midtrans charge request
    const authString = Buffer.from(MIDTRANS_SERVER_KEY + ":").toString("base64");
    
    let midtransChargePayload: any = {
      payment_type: paymentType,
      transaction_details: {
        order_id: orderId,
        gross_amount: feeCalculation.totalAmount, // amount supporter pays
      },
      customer_details: {
        first_name: senderName,
        email: senderEmail,
      }
    };

    if (paymentType === "credit_card") {
      if (!token_id) {
        return NextResponse.json({ error: "Credit card token_id is missing." }, { status: 400 });
      }
      midtransChargePayload.credit_card = {
        token_id,
        authentication: true, // 3DS Authentication enabled
      };
    } else if (paymentType === "qris") {
      midtransChargePayload.qris = {
        acquirer: "gopay",
      };
    } else if (paymentType === "gopay") {
      midtransChargePayload.gopay = {
        enable_callback: true,
        callback_url: `${request.headers.get("origin")}/payment-finish`,
      };
    }

    // Call Midtrans Charge API
    const response = await fetch(`${MIDTRANS_API_URL}/charge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${authString}`,
      },
      body: JSON.stringify(midtransChargePayload),
    });

    const midtransResult = await response.json();

    if (!response.ok || midtransResult.status_code >= "400") {
      console.error("Midtrans charge error:", midtransResult);
      return NextResponse.json({
        error: midtransResult.status_message || "Gagal memproses pembayaran ke Midtrans."
      }, { status: 500 });
    }

    // Save PENDING donation to database
    const donation = await db.donation.create({
      data: {
        id: orderId,
        creatorId: creator.id,
        senderId,
        senderName: isAnonymous ? "Anonim" : senderName,
        senderEmail,
        message: filteredMessage,
        amount: baseAmount,
        serviceFee: feeCalculation.serviceFee,
        platformFee: feeCalculation.platformFee,
        vatFee: feeCalculation.vatFee,
        totalAmount: feeCalculation.totalAmount,
        paymentType: paymentType.toUpperCase(),
        paymentStatus: "PENDING",
        isAnonymous: !!isAnonymous,
        isVAT: isVATEnabled,
        votingOptionId: votingOptionId ? parseInt(votingOptionId) : null,
        mediashareVidId: mediashareVidId || null,
        mediashareTitle: mediashareTitle || null,
        soundboardSoundId: soundboardSoundId ? parseInt(soundboardSoundId) : null,
      }
    });

    // Handle responses based on payment type
    let redirectUrl = "";
    let qrisCodeUrl = "";

    if (paymentType === "credit_card") {
      redirectUrl = midtransResult.redirect_url; // 3DS authentication redirect page
    } else if (paymentType === "qris") {
      // QRIS code image is typically returned in actions array
      const qrisAction = midtransResult.actions?.find((a: any) => a.name === "generate-qr-code");
      qrisCodeUrl = qrisAction ? qrisAction.url : "";
    } else if (paymentType === "gopay") {
      const deeplinkAction = midtransResult.actions?.find((a: any) => a.name === "deeplink-redirect");
      redirectUrl = deeplinkAction ? deeplinkAction.url : "";
    }

    return NextResponse.json({
      success: true,
      orderId,
      totalAmount: feeCalculation.totalAmount,
      redirectUrl,
      qrisCodeUrl,
      midtransResult
    });
  } catch (error: any) {
    console.error("Donation creation error:", error);
    return NextResponse.json({ error: error.message || "Failed to process transaction" }, { status: 500 });
  }
}
