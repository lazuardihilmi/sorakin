import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import DonationForm from "./DonationForm";
import { Heart, Globe, AlertCircle, ArrowLeft } from "lucide-react";

const Instagram = ({ size = 20 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
);

const Youtube = ({ size = 20 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z"/><path d="m10 15 5-3-5-3z"/></svg>
);

export default async function CreatorTippingPage(props: {
  params: Promise<{ creatorUsername: string }>;
}) {
  const { creatorUsername } = await props.params;

  // 1. Fetch Creator and associated settings
  const creator = await db.creator.findUnique({
    where: { username: creatorUsername.toLowerCase() },
    include: {
      user: {
        select: {
          isVerified: true,
          email: true,
        }
      },
      settings: true
    }
  });

  if (!creator) {
    notFound();
  }

  // 2. Fetch visitor session user if logged in
  const sessionUser = await getCurrentUser();

  // 3. Fetch successful donations feed (for Riwayat Tip)
  const showFeed = creator.settings?.showFeed ?? false;
  const showAmount = creator.settings?.showAmount ?? false;

  const successfulDonations = showFeed
    ? await db.donation.findMany({
        where: {
          creatorId: creator.id,
          paymentStatus: "SUCCESS",
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          sender: {
            select: {
              isVerified: true,
              username: true,
            }
          }
        }
      })
    : [];

  // Determine mock banner gradient
  const mockBannerGradients: Record<string, string> = {
    opet: "linear-gradient(135deg, #f53f5b 0%, #ff85a1 100%)",
    budi: "linear-gradient(135deg, #3b82f6 0%, #93c5fd 100%)",
    siti: "linear-gradient(135deg, #10b981 0%, #6ee7b7 100%)",
    andika: "linear-gradient(135deg, #8b5cf6 0%, #c4b5fd 100%)",
    ratna: "linear-gradient(135deg, #f59e0b 0%, #fde68a 100%)"
  };
  const gradient = mockBannerGradients[creator.username] || "linear-gradient(135deg, var(--primary) 0%, #ffe066 100%)";

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "var(--bg-landing)" }}>
      
      {/* Top Banner Cover Image */}
      <div style={{
        height: "240px",
        background: creator.coverUrl ? `url(${creator.coverUrl}) center/cover no-repeat` : gradient,
        position: "relative"
      }}>
        {/* Back to explore link button */}
        <div className="container" style={{ position: "relative", height: "100%" }}>
          <Link href="/explore" style={{
            position: "absolute",
            top: "24px",
            left: "24px",
            backgroundColor: "rgba(29, 27, 24, 0.6)",
            color: "white",
            padding: "8px 16px",
            borderRadius: "100px",
            fontSize: "13px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            backdropFilter: "blur(4px)",
            border: "1px solid rgba(255, 255, 255, 0.1)"
          }}>
            <ArrowLeft size={16} /> Cari Kreator
          </Link>
        </div>
      </div>

      {/* Main Profile Info Section */}
      <div className="container" style={{ marginTop: "-60px", zIndex: 10, flex: 1, paddingBottom: "80px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1.8fr",
          gap: "40px",
          alignItems: "start"
        }}>
          
          {/* Creator Profile Box Info (Left Sidebar card) */}
          <div className="card" style={{ background: "white", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ textAlign: "center" }}>
              {/* Profile Avatar picture */}
              <div style={{
                width: "96px",
                height: "96px",
                borderRadius: "50%",
                border: "4px solid white",
                backgroundColor: "var(--border-color)",
                margin: "-48px auto 16px",
                backgroundImage: "linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "36px",
                fontWeight: "800",
                color: "white",
                boxShadow: "var(--shadow-md)",
                overflow: "hidden"
              }}>
                {creator.name.charAt(0)}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <h1 style={{ fontSize: "24px" }}>{creator.name}</h1>
                {creator.user.isVerified && (
                  <span className="badge badge-verified" style={{ transform: "scale(0.9)" }}>
                    ✓
                  </span>
                )}
              </div>
              
              <span style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: "500" }}>
                @{creator.username}
              </span>

              <div style={{
                display: "inline-flex",
                marginTop: "12px",
                backgroundColor: "var(--primary-light)",
                color: "var(--primary-hover)",
                padding: "4px 12px",
                borderRadius: "100px",
                fontSize: "12px",
                fontWeight: "700"
              }}>
                {creator.category}
              </div>
            </div>

            <p style={{
              color: "var(--text-muted)",
              fontSize: "14px",
              lineHeight: "1.6",
              textAlign: "center",
              borderTop: "1px solid var(--border-color)",
              paddingTop: "16px"
            }}>
              {creator.description || "Kreator ini belum menulis biografi."}
            </p>

            {/* Social Medias handles */}
            <div style={{
              display: "flex",
              justifyContent: "center",
              gap: "16px",
              color: "var(--text-muted)",
              borderTop: "1px solid var(--border-color)",
              paddingTop: "16px"
            }}>
              {creator.settings?.socialInstagram && (
                <a href={creator.settings.socialInstagram} target="_blank" rel="noopener noreferrer">
                  <Instagram size={20} />
                </a>
              )}
              {creator.settings?.socialYoutube && (
                <a href={creator.settings.socialYoutube} target="_blank" rel="noopener noreferrer">
                  <Youtube size={20} />
                </a>
              )}
              {creator.settings?.socialWebsite && (
                <a href={creator.settings.socialWebsite} target="_blank" rel="noopener noreferrer">
                  <Globe size={20} />
                </a>
              )}
            </div>
          </div>

          {/* Donation Forms & feeds Section (Right Side) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Donation Form Card */}
            <div className="card" style={{ background: "white", padding: "36px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
                <Heart style={{ color: "var(--primary)" }} fill="var(--primary)" size={24} />
                <h2 style={{ fontSize: "22px" }}>Kirim Tip Dukungan</h2>
              </div>
              
              <DonationForm creator={creator} sessionUser={sessionUser} />
            </div>

            {/* Riwayat Tip Feed Box */}
            {showFeed && (
              <div className="card" style={{ background: "white" }}>
                <h3 style={{ fontSize: "18px", marginBottom: "16px" }}>Riwayat Tip (Dukungan Terbaru)</h3>

                {successfulDonations.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: "14px" }}>
                    Belum ada dukungan masuk. Jadilah pendukung pertama!
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {successfulDonations.map((don) => (
                      <div key={don.id} style={{
                        borderBottom: "1px solid var(--border-color)",
                        paddingBottom: "12px",
                        fontSize: "14px"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                          <span style={{ fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                            {don.senderName}
                            {don.sender?.isVerified && (
                              <span className="badge badge-verified" style={{ padding: "0px 4px", fontSize: "9px", transform: "scale(0.85)" }}>
                                ✓
                              </span>
                            )}
                          </span>
                          <span style={{ fontWeight: "700", color: "var(--primary-hover)" }}>
                            {showAmount ? `Rp ${don.amount.toLocaleString("id-ID")}` : "Rp ***"}
                          </span>
                        </div>
                        {don.message && (
                          <p style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "13px" }}>
                            "{don.message}"
                          </p>
                        )}
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          {new Date(don.createdAt).toLocaleDateString("id-ID")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
