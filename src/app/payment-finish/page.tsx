export const dynamic = "force-dynamic";
export const runtime = "edge";

import Link from "next/link";
import { db } from "@/lib/db";
import { CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";

export default async function PaymentFinishPage(props: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const searchParams = await props.searchParams;
  const orderId = searchParams.order_id || "";

  // Query database for donation status
  const donation = orderId
    ? await db.donation.findUnique({
        where: { id: orderId },
        include: { creator: true }
      })
    : null;

  const isSuccess = donation?.paymentStatus === "SUCCESS";

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      backgroundColor: "var(--bg-landing)"
    }}>
      <div className="card pop-animation" style={{
        width: "100%",
        maxWidth: "480px",
        padding: "40px",
        textAlign: "center",
        background: "white"
      }}>
        {isSuccess ? (
          <>
            <div style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              backgroundColor: "#e6fcf5",
              color: "var(--success)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              fontSize: "36px"
            }}>
              ✓
            </div>
            
            <h1 style={{ fontSize: "26px", marginBottom: "12px", fontFamily: "var(--font-outfit)" }}>
              Dukungan Berhasil Dikirim!
            </h1>
            
            <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6", marginBottom: "32px" }}>
              Terima kasih! Dukungan Anda sebesar <strong>Rp {donation.amount.toLocaleString("id-ID")}</strong> kepada <strong>{donation.creator.name}</strong> telah berhasil diproses dan terkirim secara real-time.
            </p>
          </>
        ) : (
          <>
            <div style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              backgroundColor: "#fff9db",
              color: "var(--warning)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              fontSize: "36px"
            }}>
              ⌛
            </div>

            <h1 style={{ fontSize: "26px", marginBottom: "12px", fontFamily: "var(--font-outfit)" }}>
              Menunggu Konfirmasi Pembayaran
            </h1>

            <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6", marginBottom: "32px" }}>
              Kami sedang memverifikasi transaksi Anda dengan ID Order <strong>{orderId || "tidak diketahui"}</strong>. 
              Mohon tunggu beberapa saat atau pastikan Anda telah menyelesaikan pembayaran di gerai/e-wallet Anda.
            </p>
          </>
        )}

        {/* Transaction details box */}
        {donation && (
          <div style={{
            backgroundColor: "var(--bg-surface-alt)",
            padding: "16px",
            borderRadius: "var(--border-radius-md)",
            textAlign: "left",
            fontSize: "13px",
            marginBottom: "32px",
            border: "1px solid var(--border-color)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ color: "var(--text-muted)" }}>ID Transaksi:</span>
              <span style={{ fontFamily: "monospace", fontWeight: "600" }}>{donation.id}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ color: "var(--text-muted)" }}>Kreator:</span>
              <span style={{ fontWeight: "600" }}>{donation.creator.name} (@{donation.creator.username})</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ color: "var(--text-muted)" }}>Metode Pembayaran:</span>
              <span style={{ fontWeight: "600" }}>{donation.paymentType}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Total Bayar:</span>
              <span style={{ fontWeight: "700", color: "var(--primary-hover)" }}>Rp {donation.totalAmount.toLocaleString("id-ID")}</span>
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {donation ? (
            <Link href={`/${donation.creator.username}`} className="btn btn-primary" style={{ width: "100%", padding: "12px 0" }}>
              Kembali ke Halaman Kreator
            </Link>
          ) : null}
          <Link href="/explore" className="btn btn-secondary" style={{ width: "100%", padding: "12px 0", gap: "6px" }}>
            Jelajahi Kreator Lain <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
