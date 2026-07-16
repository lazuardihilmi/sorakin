
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.creator) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const withdrawals = await db.withdrawal.findMany({
      where: { creatorId: user.creator.id },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ withdrawals });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !user.creator) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, amount, bankName, accountNumber, accountName } = body;

    const creator = await db.creator.findUnique({
      where: { id: user.creator.id }
    });

    if (!creator) {
      return NextResponse.json({ error: "Creator profile not found." }, { status: 404 });
    }

    if (action === "link-bank") {
      if (!bankName || !accountNumber || !accountName) {
        return NextResponse.json({ error: "Mohon isi semua data rekening." }, { status: 400 });
      }

      // Mock account validation checking
      // Simulate account validation (e.g. if accountNumber contains non-digits, return error)
      const numberRegex = /^[0-9]+$/;
      if (!numberRegex.test(accountNumber)) {
        return NextResponse.json({ error: "Nomor rekening/e-wallet tidak valid." }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: "Rekening penarikan berhasil divalidasi dan terdaftar.",
        bankAccount: { bankName, accountNumber, accountName }
      });
    }

    if (action === "withdraw") {
      const withdrawAmount = parseFloat(amount);
      if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
        return NextResponse.json({ error: "Jumlah nominal tidak valid." }, { status: 400 });
      }

      if (withdrawAmount < 20000) {
        return NextResponse.json({ error: "Batas penarikan minimum adalah Rp 20.000." }, { status: 400 });
      }

      if (creator.balance < withdrawAmount) {
        return NextResponse.json({ error: "Saldo yang bisa dicairkan tidak mencukupi." }, { status: 400 });
      }

      // Deduct balance and create withdrawal record
      const withdrawal = await db.$transaction(async (tx) => {
        // 1. Deduct settled balance from Creator
        await tx.creator.update({
          where: { id: creator.id },
          data: {
            balance: {
              decrement: withdrawAmount
            }
          }
        });

        // 2. Create withdrawal record
        return tx.withdrawal.create({
          data: {
            creatorId: creator.id,
            amount: withdrawAmount,
            bankName,
            accountNumber,
            accountName,
            status: "SUCCESS" // Auto-approve withdrawal in sandbox dev environment
          }
        });
      });

      return NextResponse.json({
        success: true,
        message: "Penarikan berhasil diproses.",
        withdrawal
      });
    }

    return NextResponse.json({ error: "Action not supported." }, { status: 400 });
  } catch (error: any) {
    console.error("Withdrawal error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
