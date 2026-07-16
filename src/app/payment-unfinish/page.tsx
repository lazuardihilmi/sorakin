
import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";

export default async function PaymentUnfinishPage(props: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const searchParams = await props.searchParams;
  const orderId = searchParams.order_id || "";

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
          !
        </div>

        <h1 style={{ fontSize: "26px", marginBottom: "12px", fontFamily: "var(--font-outfit)" }}>
          Pembayaran Belum Selesai
        </h1>

        <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6", marginBottom: "32px" }}>
          Anda belum menyelesaikan proses pembayaran untuk ID Order <strong>{orderId || "tidak diketahui"}</strong>. 
          Silakan hubungi dukungan jika Anda merasa telah terpotong saldo, atau silakan coba kirim tip kembali.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <Link href="/explore" className="btn btn-primary" style={{ width: "100%", padding: "12px 0" }}>
            Jelajahi Kreator Lain
          </Link>
          <Link href="/" className="btn btn-secondary" style={{ width: "100%", padding: "12px 0", gap: "6px" }}>
            Kembali ke Beranda <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
