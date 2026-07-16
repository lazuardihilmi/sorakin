export const dynamic = "force-dynamic";

import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Search, Globe, Heart } from "lucide-react";

const Instagram = ({ size = 18 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
);

const Youtube = ({ size = 18 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z"/><path d="m10 15 5-3-5-3z"/></svg>
);

// Mock Creator Seed Data
async function seedMockCreatorsIfNeeded() {
  const count = await db.creator.count();
  if (count > 0) return;

  const mockUsers = [
    { email: "opet@sorakin.id", name: "Opet Gaming", username: "opet", category: "Gamer", desc: "Streamer game retro & RPG. Main bareng kuy setiap malam jam 8!" },
    { email: "budi@sorakin.id", name: "Budi Piano", username: "budi", category: "Musisi", desc: "Pianis & komposer amatir. Terima request lagu pop dan klasik." },
    { email: "siti@sorakin.id", name: "Siti Ngoding", username: "siti", category: "Edukasi", desc: "Berbagi tutorial React, Node.js, dan tips karir software engineer." },
    { email: "andika@sorakin.id", name: "Andika Art", username: "andika", category: "Artist", desc: "Digital illustrator. Gambar fanart anime dan konsep ilustrasi." },
    { email: "ratna@sorakin.id", name: "Ratna Podcast", username: "ratna", category: "Podcaster", desc: "Podcast mingguan membahas kesehatan mental dan pengembangan diri." }
  ];

  for (const mu of mockUsers) {
    // Check if user exists
    let user = await db.user.findUnique({ where: { email: mu.email } });
    if (!user) {
      user = await db.user.create({
        data: {
          email: mu.email,
          password: "$2a$10$7Z2D5T.333/Fk5V5G5S5S.z8L2/P5G5G5G5G5G5G5G5G5G5G5G5G5", // fake hash
          name: mu.name,
          username: mu.username,
          isVerified: mu.username === "opet" || mu.username === "budi", // Seed some verified users
        }
      });
    }

    const overlayKey = Math.random().toString(36).substring(2, 15);
    await db.creator.create({
      data: {
        userId: user.id,
        name: mu.name,
        username: mu.username,
        category: mu.category,
        description: mu.desc,
        avatarUrl: `/images/placeholders/avatar-${mu.username}.png`,
        coverUrl: `/images/placeholders/cover-${mu.username}.png`,
        balance: 150000.0,
        pendingBalance: 50000.0,
        settings: {
          create: {
            showFeed: true,
            showAmount: true,
            feeCoverage: "CREATOR",
            socialInstagram: `https://instagram.com/${mu.username}`,
            socialYoutube: `https://youtube.com/${mu.username}`,
            socialWebsite: `https://${mu.username}.id`,
          }
        },
        overlay: {
          create: {
            key: overlayKey,
            activeThemeId: 1,
            alertSoundUrl: "/sounds/default-alert.mp3",
            alertImageUrl: "/images/default-alert.gif",
          }
        }
      }
    });
  }
}

export default async function ExplorePage(props: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  await seedMockCreatorsIfNeeded();
  const searchParams = await props.searchParams;
  const user = await getCurrentUser();

  const searchQuery = searchParams.q || "";
  const activeCategory = searchParams.category || "Semua";
  const currentPage = parseInt(searchParams.page || "1");
  const limit = 20;
  const skip = (currentPage - 1) * limit;

  // Build query where clause
  const where: any = {};
  if (searchQuery) {
    where.OR = [
      { name: { contains: searchQuery } },
      { username: { contains: searchQuery } },
      { description: { contains: searchQuery } }
    ];
  }

  if (activeCategory !== "Semua") {
    where.category = activeCategory;
  }

  // Fetch list and count
  const totalCreators = await db.creator.count({ where });
  const creators = await db.creator.findMany({
    where,
    skip,
    take: limit,
    include: {
      user: {
        select: {
          isVerified: true
        }
      },
      settings: true
    }
  });

  const categories = ["Semua", "Gamer", "Musisi", "Artist", "Podcaster", "Edukasi"];
  const totalPages = Math.ceil(totalCreators / limit);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Header */}
      <header className="glass-panel" style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        borderBottom: "1px solid var(--border-color)",
        padding: "16px 0"
      }}>
        <div className="container flex items-center justify-between">
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "36px",
              height: "36px",
              backgroundColor: "var(--primary)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "800",
              fontSize: "20px",
              fontFamily: "var(--font-outfit)"
            }}>S</div>
            <span style={{ fontFamily: "var(--font-outfit)", fontWeight: 800, fontSize: "22px", letterSpacing: "-0.5px" }}>
              sorakin<span style={{ color: "var(--primary)" }}>.</span>
            </span>
          </Link>
          
          <nav className="flex items-center gap-md" style={{ display: "flex", gap: "24px" }}>
            <Link href="/explore" style={{ fontWeight: 600, color: "var(--primary)" }}>Kreator</Link>
            <Link href="/#about" style={{ fontWeight: 500 }}>Tentang</Link>
            <Link href="/#fitur" style={{ fontWeight: 500 }}>Fitur</Link>
            <Link href="/#faq" style={{ fontWeight: 500 }}>Bantuan</Link>
          </nav>

          <div className="flex items-center gap-sm">
            {user ? (
              <Link href="/dashboard" className="btn btn-primary">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn btn-secondary" style={{ padding: "8px 18px" }}>
                  Masuk
                </Link>
                <Link href="/register" className="btn btn-primary" style={{ padding: "8px 18px" }}>
                  Daftar
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Explore Area */}
      <main style={{ flex: 1, padding: "48px 0 80px" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h1 style={{ fontSize: "36px", fontFamily: "var(--font-outfit)", marginBottom: "12px" }}>
              Cari Kreator Favoritmu
            </h1>
            <p style={{ color: "var(--text-muted)", maxWidth: "600px", margin: "0 auto" }}>
              Dukung secara langsung agar mereka bisa terus berkreasi dan menghasilkan konten menarik.
            </p>
          </div>

          {/* Search bar & Category lists */}
          <div style={{
            maxWidth: "700px",
            margin: "0 auto 40px",
            display: "flex",
            flexDirection: "column",
            gap: "20px"
          }}>
            {/* Search Input Form */}
            <form method="GET" action="/explore" style={{
              display: "flex",
              position: "relative",
              alignItems: "center"
            }}>
              <Search size={20} style={{
                position: "absolute",
                left: "16px",
                color: "var(--text-muted)"
              }} />
              <input
                type="text"
                name="q"
                defaultValue={searchQuery}
                placeholder="Cari nama kreator atau deskripsi..."
                className="input-field"
                style={{
                  width: "100%",
                  paddingLeft: "48px",
                  borderRadius: "100px",
                  fontSize: "16px"
                }}
              />
              {activeCategory !== "Semua" && (
                <input type="hidden" name="category" value={activeCategory} />
              )}
            </form>

            {/* Categories Toggles */}
            <div style={{
              display: "flex",
              gap: "10px",
              justifyContent: "center",
              flexWrap: "wrap"
            }}>
              {categories.map((cat) => {
                const isSelected = activeCategory === cat;
                const searchParamString = searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : "";
                const url = `/explore?category=${encodeURIComponent(cat)}${searchParamString}`;

                return (
                  <Link
                    key={cat}
                    href={url}
                    className="btn"
                    style={{
                      padding: "8px 16px",
                      borderRadius: "100px",
                      fontSize: "14px",
                      background: isSelected ? "var(--primary)" : "var(--bg-surface)",
                      color: isSelected ? "#1d1b18" : "var(--text-main)",
                      border: isSelected ? "none" : "1px solid var(--border-color)",
                      boxShadow: "var(--shadow-sm)"
                    }}
                  >
                    {cat}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Creators Listing Grid */}
          {creators.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 0", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
              <h3>Kreator tidak ditemukan</h3>
              <p>Coba gunakan kata kunci pencarian yang lain.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-md" style={{ display: "grid", gap: "30px" }}>
              {creators.map((creator) => {
                // Determine mock banner color/style
                const mockBannerGradients: Record<string, string> = {
                  opet: "linear-gradient(135deg, #f53f5b 0%, #ff85a1 100%)",
                  budi: "linear-gradient(135deg, #3b82f6 0%, #93c5fd 100%)",
                  siti: "linear-gradient(135deg, #10b981 0%, #6ee7b7 100%)",
                  andika: "linear-gradient(135deg, #8b5cf6 0%, #c4b5fd 100%)",
                  ratna: "linear-gradient(135deg, #f59e0b 0%, #fde68a 100%)"
                };
                const gradient = mockBannerGradients[creator.username] || "linear-gradient(135deg, var(--primary) 0%, #ffe066 100%)";

                return (
                  <div key={creator.id} className="card" style={{
                    padding: 0,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    background: "white"
                  }}>
                    {/* Banner header */}
                    <div style={{
                      height: "110px",
                      background: gradient,
                      position: "relative"
                    }}>
                      <div style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        backgroundColor: "rgba(29, 27, 24, 0.6)",
                        color: "white",
                        padding: "4px 10px",
                        borderRadius: "100px",
                        fontSize: "12px",
                        fontWeight: "600",
                        backdropFilter: "blur(4px)"
                      }}>
                        {creator.category}
                      </div>
                    </div>

                    {/* Content area */}
                    <div style={{
                      padding: "24px",
                      paddingTop: "0",
                      position: "relative",
                      flex: 1,
                      display: "flex",
                      flexDirection: "column"
                    }}>
                      {/* Avatar picture (half overlap) */}
                      <div style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "50%",
                        border: "4px solid white",
                        backgroundColor: "var(--border-color)",
                        marginTop: "-32px",
                        backgroundImage: "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "28px",
                        boxShadow: "var(--shadow-sm)",
                        overflow: "hidden",
                        fontWeight: "800",
                        color: "var(--text-muted)"
                      }}>
                        {creator.name.charAt(0)}
                      </div>

                      {/* Info */}
                      <div style={{ marginTop: "12px", marginBottom: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <h3 style={{ fontSize: "18px" }}>{creator.name}</h3>
                          {creator.user.isVerified && (
                            <span className="badge badge-verified" style={{ padding: "2px 6px", fontSize: "10px" }}>
                              ✓ Verified
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                          @{creator.username}
                        </span>
                      </div>

                      <p style={{
                        color: "var(--text-muted)",
                        fontSize: "14px",
                        lineHeight: "1.5",
                        marginBottom: "20px",
                        flex: 1
                      }}>
                        {creator.description}
                      </p>

                      {/* Social media connections */}
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingTop: "16px",
                        borderTop: "1px solid var(--border-color)"
                      }}>
                        <div style={{ display: "flex", gap: "10px", color: "var(--text-muted)" }}>
                          {creator.settings?.socialInstagram && (
                            <a href={creator.settings.socialInstagram} target="_blank" rel="noopener noreferrer">
                              <Instagram size={18} />
                            </a>
                          )}
                          {creator.settings?.socialYoutube && (
                            <a href={creator.settings.socialYoutube} target="_blank" rel="noopener noreferrer">
                              <Youtube size={18} />
                            </a>
                          )}
                          {creator.settings?.socialWebsite && (
                            <a href={creator.settings.socialWebsite} target="_blank" rel="noopener noreferrer">
                              <Globe size={18} />
                            </a>
                          )}
                        </div>

                        <Link href={`/${creator.username}`} className="btn btn-primary" style={{
                          padding: "6px 16px",
                          fontSize: "13px",
                          borderRadius: "8px"
                        }}>
                          Kirim Tip
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination links */}
          {totalPages > 1 && (
            <div style={{
              marginTop: "48px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px"
            }}>
              {/* Previous page link */}
              {currentPage > 1 ? (
                <Link
                  href={`/explore?page=${currentPage - 1}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}${activeCategory !== "Semua" ? `&category=${encodeURIComponent(activeCategory)}` : ""}`}
                  className="btn btn-secondary"
                  style={{ padding: "8px 16px", fontSize: "14px" }}
                >
                  Prev
                </Link>
              ) : (
                <span className="btn btn-secondary" style={{ padding: "8px 16px", fontSize: "14px", opacity: 0.5, cursor: "not-allowed" }}>
                  Prev
                </span>
              )}

              {/* Page numbers */}
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                const isCurrent = pageNum === currentPage;
                const url = `/explore?page=${pageNum}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}${activeCategory !== "Semua" ? `&category=${encodeURIComponent(activeCategory)}` : ""}`;

                return (
                  <Link
                    key={pageNum}
                    href={url}
                    className="btn"
                    style={{
                      padding: "8px 14px",
                      fontSize: "14px",
                      borderRadius: "8px",
                      background: isCurrent ? "var(--primary-light)" : "transparent",
                      color: isCurrent ? "var(--primary-hover)" : "var(--text-main)",
                      border: isCurrent ? "1px solid var(--primary)" : "none",
                      textDecoration: isCurrent ? "underline" : "none",
                      fontWeight: isCurrent ? "700" : "500"
                    }}
                  >
                    {pageNum}
                  </Link>
                );
              })}

              {/* Next page link */}
              {currentPage < totalPages ? (
                <Link
                  href={`/explore?page=${currentPage + 1}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}${activeCategory !== "Semua" ? `&category=${encodeURIComponent(activeCategory)}` : ""}`}
                  className="btn btn-secondary"
                  style={{ padding: "8px 16px", fontSize: "14px" }}
                >
                  Next
                </Link>
              ) : (
                <span className="btn btn-secondary" style={{ padding: "8px 16px", fontSize: "14px", opacity: 0.5, cursor: "not-allowed" }}>
                  Next
                </span>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
