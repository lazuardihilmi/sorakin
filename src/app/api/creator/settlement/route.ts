
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/creator/settlement
// Simulates or processes the 15-minute cron job that settles pending balances
export async function POST(request: Request) {
  try {
    const now = new Date();

    // Find all unsettled settlements where schedule has arrived/passed
    const pendingSettlements = await db.settlement.findMany({
      where: {
        status: "UNSETTLED",
        settleSchedule: {
          lte: now
        }
      },
      include: {
        creator: true
      }
    });

    if (pendingSettlements.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Tidak ada dana tunda yang siap diselesaikan saat ini.",
        processedCount: 0
      });
    }

    let processedCount = 0;

    // Process each settlement inside a transaction
    for (const settle of pendingSettlements) {
      await db.$transaction(async (tx) => {
        // 1. Mark settlement as settled
        await tx.settlement.update({
          where: { id: settle.id },
          data: {
            status: "SETTLED",
            updatedAt: now
          }
        });

        // 2. Transfer from pendingBalance to settled balance
        await tx.creator.update({
          where: { id: settle.creatorId },
          data: {
            balance: {
              increment: settle.amount
            },
            pendingBalance: {
              decrement: settle.amount
            }
          }
        });
      });

      processedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil menyelesaikan ${processedCount} transaksi tunda ke saldo kreator.`,
      processedCount
    });
  } catch (error: any) {
    console.error("Settlement process error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
