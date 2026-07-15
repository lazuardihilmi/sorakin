import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import DonationForm from "./DonationForm";
import { Globe, Share2, CheckCircle } from "lucide-react";

/* ── Inline SVG icons for social platforms ──────────────────────────── */
const IconInstagram = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);
const IconYoutube = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);
const IconTiktok = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);
const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);
const IconTwitch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
  </svg>
);

export default async function CreatorTippingPage(props: {
  params: Promise<{ creatorUsername: string }>;
}) {
  const { creatorUsername } = await props.params;

  const creator = await db.creator.findUnique({
    where: { username: creatorUsername.toLowerCase() },
    include: {
      user: { select: { isVerified: true, email: true } },
      settings: true,
    },
  });

  if (!creator) notFound();

  const sessionUser = await getCurrentUser();

  const showFeed = creator.settings?.showFeed ?? false;
  const showAmount = creator.settings?.showAmount ?? false;

  const [successfulDonations, totalSupporters] = await Promise.all([
    showFeed
      ? db.donation.findMany({
          where: { creatorId: creator.id, paymentStatus: "SUCCESS" },
          orderBy: { createdAt: "desc" },
          take: 15,
          include: { sender: { select: { isVerified: true, username: true } } },
        })
      : [],
    db.donation.count({
      where: { creatorId: creator.id, paymentStatus: "SUCCESS" },
    }),
  ]);

  const socials = [
    creator.settings?.socialInstagram && {
      url: creator.settings.socialInstagram,
      label: "Instagram",
      icon: <IconInstagram />,
      bg: "#E1306C",
      color: "white",
    },
    creator.settings?.socialYoutube && {
      url: creator.settings.socialYoutube,
      label: "YouTube",
      icon: <IconYoutube />,
      bg: "#FF0000",
      color: "white",
    },
    creator.settings?.socialTiktok && {
      url: creator.settings.socialTiktok,
      label: "TikTok",
      icon: <IconTiktok />,
      bg: "#010101",
      color: "white",
    },
    creator.settings?.socialX && {
      url: creator.settings.socialX,
      label: "X / Twitter",
      icon: <IconX />,
      bg: "#000000",
      color: "white",
    },
    creator.settings?.socialTwitch && {
      url: creator.settings.socialTwitch,
      label: "Twitch",
      icon: <IconTwitch />,
      bg: "#9146FF",
      color: "white",
    },
    creator.settings?.socialWebsite && {
      url: creator.settings.socialWebsite,
      label: "Website",
      icon: <Globe size={16} />,
      bg: "#4f46e5",
      color: "white",
    },
  ].filter(Boolean) as { url: string; label: string; icon: React.ReactNode; bg: string; color: string }[];

  return (
    <>
      <style>{`
        .creator-page { min-height: 100vh; background: #f5f4f0; font-family: 'Outfit', 'Inter', sans-serif; }

        .cover-wrap {
          position: relative;
          height: 220px;
          background: linear-gradient(135deg, var(--primary) 0%, #ffe066 100%);
          overflow: hidden;
        }
        .cover-wrap::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.35) 100%);
        }
        .cover-img { width: 100%; height: 100%; object-fit: cover; }

        .page-container {
          max-width: 1080px;
          margin: 0 auto;
          padding: 0 24px 80px;
        }

        .main-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 28px;
          align-items: start;
          margin-top: -72px;
          position: relative;
          z-index: 2;
        }

        /* ── Profile Card ── */
        .profile-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          overflow: visible;
          position: sticky;
          top: 24px;
        }
        .avatar-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0 24px 20px;
          border-bottom: 1px solid #f0ede8;
        }
        .avatar {
          width: 112px;
          height: 112px;
          border-radius: 50%;
          border: 4px solid white;
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
          background: linear-gradient(135deg, #cbd5e1, #94a3b8);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 42px;
          font-weight: 800;
          color: white;
          overflow: hidden;
          margin-top: -56px;
          flex-shrink: 0;
        }
        .creator-name {
          margin-top: 12px;
          font-size: 22px;
          font-weight: 800;
          color: #1a1917;
          display: flex;
          align-items: center;
          gap: 6px;
          text-align: center;
          line-height: 1.2;
        }
        .creator-username {
          font-size: 13px;
          color: #9b9790;
          font-weight: 500;
          margin-top: 2px;
        }
        .category-pill {
          margin-top: 10px;
          display: inline-flex;
          align-items: center;
          background: var(--primary-light);
          color: var(--primary-hover);
          padding: 4px 14px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 700;
        }

        .profile-bio {
          padding: 16px 24px;
          font-size: 13px;
          color: #6b6860;
          line-height: 1.65;
          text-align: center;
          border-bottom: 1px solid #f0ede8;
        }

        .social-section {
          padding: 16px 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          border-bottom: 1px solid #f0ede8;
        }
        .social-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 14px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: opacity 0.15s, transform 0.1s;
        }
        .social-btn:hover { opacity: 0.88; transform: translateX(2px); }

        .stats-section {
          padding: 16px 24px;
          display: flex;
          justify-content: center;
          gap: 32px;
          border-bottom: 1px solid #f0ede8;
        }
        .stat-item { text-align: center; }
        .stat-num { font-size: 22px; font-weight: 800; color: #1a1917; line-height: 1; }
        .stat-label { font-size: 11px; color: #9b9790; margin-top: 4px; font-weight: 500; }

        .share-btn-wrap { padding: 16px 24px; }
        .share-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 10px;
          border: 1.5px solid #e8e5e0;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          color: #4b4844;
          background: white;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .share-btn:hover { background: #f9f8f5; border-color: #d0ccc7; }

        /* ── Right column ── */
        .right-col { display: flex; flex-direction: column; gap: 20px; }

        /* Form card */
        .form-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          padding: 32px;
          margin-top: 72px;
        }
        .form-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 1px solid #f0ede8;
        }
        .form-card-header h2 {
          font-size: 20px;
          font-weight: 800;
          color: #1a1917;
        }

        /* Feed card */
        .feed-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          padding: 28px;
        }
        .feed-title {
          font-size: 16px;
          font-weight: 800;
          color: #1a1917;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .feed-item {
          display: flex;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid #f5f4f0;
          align-items: flex-start;
        }
        .feed-item:last-child { border-bottom: none; }
        .feed-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary) 0%, #ffe066 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 800;
          color: white;
          flex-shrink: 0;
        }
        .feed-name { font-size: 13px; font-weight: 700; color: #1a1917; }
        .feed-amount { font-size: 12px; font-weight: 700; color: var(--primary-hover); }
        .feed-msg { font-size: 12px; color: #6b6860; margin-top: 2px; font-style: italic; }
        .feed-time { font-size: 10px; color: #b0ada8; margin-top: 2px; }

        /* Footer */
        .page-footer {
          text-align: center;
          margin-top: 40px;
          font-size: 12px;
          color: #b0ada8;
        }
        .page-footer a { color: var(--primary-hover); font-weight: 600; text-decoration: none; }

        @media (max-width: 768px) {
          .main-grid { grid-template-columns: 1fr; margin-top: -40px; }
          .profile-card { position: static; }
          .form-card { margin-top: 0; padding: 24px; }
          .cover-wrap { height: 160px; }
          .avatar { width: 88px; height: 88px; margin-top: -44px; font-size: 32px; }
        }
      `}</style>

      <div className="creator-page">
        {/* ── Cover ── */}
        <div className="cover-wrap" style={
          creator.coverUrl
            ? { backgroundImage: `url(${creator.coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { background: `linear-gradient(135deg, #f5a623 0%, #f8d347 50%, #e8724a 100%)` }
        } />

        <div className="page-container">
          <div className="main-grid">

            {/* ── LEFT — Profile Card ── */}
            <div className="profile-card">
              <div className="avatar-wrap">
                <div className="avatar">
                  {creator.avatarUrl
                    ? <img src={creator.avatarUrl} alt={creator.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : creator.name.charAt(0).toUpperCase()
                  }
                </div>
                <div className="creator-name">
                  {creator.name}
                  {creator.user.isVerified && (
                    <CheckCircle size={18} style={{ color: "#3b82f6", fill: "#3b82f6" }} />
                  )}
                </div>
                <div className="creator-username">@{creator.username}</div>
                <div className="category-pill">{creator.category}</div>
              </div>

              {creator.description && (
                <div className="profile-bio">{creator.description}</div>
              )}

              {/* Stats */}
              <div className="stats-section">
                <div className="stat-item">
                  <div className="stat-num">{totalSupporters.toLocaleString("id-ID")}</div>
                  <div className="stat-label">Pendukung</div>
                </div>
              </div>

              {/* Socials */}
              {socials.length > 0 && (
                <div className="social-section">
                  {socials.map((s) => (
                    <a
                      key={s.label}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-btn"
                      style={{ background: s.bg, color: s.color }}
                    >
                      {s.icon}
                      {s.label}
                    </a>
                  ))}
                </div>
              )}

              {/* Share button */}
              <div className="share-btn-wrap">
                <button
                  className="share-btn"
                  onClick={undefined}
                  id="sharePageBtn"
                >
                  <Share2 size={15} />
                  Bagikan Halaman Ini
                </button>
              </div>
            </div>

            {/* ── RIGHT — Donation Form + Feed ── */}
            <div className="right-col">
              {/* Donation Form Card */}
              <div className="form-card">
                <div className="form-card-header">
                  <span style={{ fontSize: "28px" }}>☕</span>
                  <div>
                    <h2>Dukung {creator.name}</h2>
                    <p style={{ fontSize: "13px", color: "#9b9790", marginTop: "2px", fontWeight: 500 }}>
                      Traktir kreator favoritmu secara langsung!
                    </p>
                  </div>
                </div>
                <DonationForm creator={creator} sessionUser={sessionUser} />
              </div>

              {/* Feed */}
              {showFeed && (
                <div className="feed-card">
                  <div className="feed-title">
                    <span>🎉</span>
                    Dukungan Terbaru
                  </div>

                  {successfulDonations.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px 0", color: "#b0ada8", fontSize: "14px" }}>
                      Belum ada dukungan. Jadilah yang pertama! 🌟
                    </div>
                  ) : (
                    <div>
                      {successfulDonations.map((don) => (
                        <div key={don.id} className="feed-item">
                          <div className="feed-avatar">
                            {don.isAnonymous ? "?" : don.senderName.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px" }}>
                              <span className="feed-name" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                {don.isAnonymous ? "Anonim" : don.senderName}
                                {don.sender?.isVerified && (
                                  <CheckCircle size={12} style={{ color: "#3b82f6", fill: "#3b82f6" }} />
                                )}
                              </span>
                              <span className="feed-amount">
                                {showAmount ? `Rp ${don.amount.toLocaleString("id-ID")}` : "💛"}
                              </span>
                            </div>
                            {don.message && (
                              <div className="feed-msg">"{don.message}"</div>
                            )}
                            <div className="feed-time">
                              {new Date(don.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="page-footer">
            Diberdayakan oleh <a href="/">Sorakin</a> · Platform dukungan kreator Indonesia 🇮🇩
          </div>
        </div>
      </div>

      {/* Client-side share button script */}
      <script dangerouslySetInnerHTML={{ __html: `
        document.addEventListener('DOMContentLoaded', function() {
          var btn = document.getElementById('sharePageBtn');
          if (btn) btn.addEventListener('click', function() {
            if (navigator.share) {
              navigator.share({ title: 'Dukung ${creator.name}', url: window.location.href });
            } else {
              navigator.clipboard.writeText(window.location.href).then(function() {
                btn.textContent = '✓ Link tersalin!';
                setTimeout(function() { btn.innerHTML = '<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'15\\' height=\\'15\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'2\\'><path d=\\'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8\\'/><polyline points=\\'16 6 12 2 8 6\\'/><line x1=\\'12\\' y1=\\'2\\' x2=\\'12\\' y2=\\'15\\'/></svg> Bagikan Halaman Ini'; }, 2000);
              });
            }
          });
        });
      `}} />
    </>
  );
}
