import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { Coffee, Shield, Zap, Sparkles, Heart } from "lucide-react";

export default async function LandingPage() {
  const user = await getCurrentUser();

  const faqs = [
    {
      q: "Apa itu Sorakin?",
      a: "Sorakin adalah platform monetisasi dan tipping creator yang memungkinkan supporter memberikan dukungan finansial secara instan ke kreator favorit mereka. Sorakin dirancang sangat simpel seperti Saweria."
    },
    {
      q: "Metode pembayaran apa saja yang didukung?",
      a: "Kami mendukung berbagai pembayaran terintegrasi, termasuk QRIS, GoPay, dan Kartu Kredit yang didukung secara aman oleh payment gateway Midtrans Sandbox untuk uji coba."
    },
    {
      q: "Berapa lama proses pencairan saldo (settlement)?",
      a: "Untuk transaksi menggunakan metode standar (QRIS dan GoPay), dana akan diproses untuk settlement dalam waktu 24 jam. Khusus untuk Kartu Kredit, proses settlement membutuhkan waktu 3 hari demi keamanan transaksi."
    },
    {
      q: "Bagaimana cara memasang overlay di OBS?",
      a: "Setelah membuat akun kreator, Anda akan mendapatkan tautan Overlay unik di dashboard. Cukup salin tautan tersebut dan tempelkan sebagai 'Browser Source' di OBS Studio Anda."
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Header / Navbar */}
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
            <Link href="/explore" style={{ fontWeight: 500 }}>Kreator</Link>
            <a href="#about" style={{ fontWeight: 500 }}>Tentang</a>
            <a href="#fitur" style={{ fontWeight: 500 }}>Fitur</a>
            <a href="#faq" style={{ fontWeight: 500 }}>Bantuan</a>
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

      {/* Hero Section */}
      <section style={{ padding: "80px 0 60px", textAlign: "center", position: "relative" }}>
        <div className="container" style={{ maxWidth: "800px" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: "var(--primary-light)",
            color: "var(--primary-hover)",
            padding: "6px 12px",
            borderRadius: "9999px",
            fontSize: "14px",
            fontWeight: "600",
            marginBottom: "24px"
          }}>
            <Sparkles size={14} />
            <span>Platform Monetisasi Simpel & Cepat</span>
          </div>

          <h1 style={{ fontSize: "52px", letterSpacing: "-1.5px", marginBottom: "20px", fontFamily: "var(--font-outfit)" }}>
            Dukung Kreator Favoritmu dengan <span style={{
              backgroundImage: "linear-gradient(120deg, var(--primary) 0%, #ff8c00 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>Sorakin</span>
          </h1>
          
          <p style={{ fontSize: "18px", color: "var(--text-muted)", marginBottom: "32px", lineHeight: "1.6" }}>
            Cara paling mudah bagi streamer, gamer, dan kreator konten untuk menerima tip, 
            menampilkan alert overlay interaktif di layar, dan mencairkan pendapatan secara instan.
          </p>

          <div className="flex justify-center gap-md" style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
            <Link href="/register" className="btn btn-primary" style={{ padding: "14px 32px", fontSize: "16px" }}>
              Mulai Sekarang
            </Link>
            <Link href="/explore" className="btn btn-secondary" style={{ padding: "14px 32px", fontSize: "16px" }}>
              Cari Kreator
            </Link>
          </div>

          {/* Stats Row */}
          <div style={{
            marginTop: "64px",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "24px",
            borderTop: "1px solid var(--border-color)",
            paddingTop: "40px"
          }}>
            <div>
              <h3 style={{ fontSize: "36px", color: "var(--primary)" }}>15K+</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "14px", fontWeight: "500" }}>Kreator Terdaftar</p>
            </div>
            <div>
              <h3 style={{ fontSize: "36px", color: "var(--primary)" }}>450K+</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "14px", fontWeight: "500" }}>Supporter Aktif</p>
            </div>
            <div>
              <h3 style={{ fontSize: "36px", color: "var(--primary)" }}>Rp 25M+</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "14px", fontWeight: "500" }}>Total Dukungan Disalurkan</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" style={{ padding: "60px 0", backgroundColor: "var(--bg-surface-alt)" }}>
        <div className="container" style={{ maxWidth: "900px", textAlign: "center" }}>
          <h2 style={{ fontSize: "32px", marginBottom: "16px" }}>Kenapa Pilih Sorakin?</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "48px", maxWidth: "600px", margin: "0 auto 48px" }}>
            Kami menyederhanakan alur tipping agar Anda bisa lebih fokus memproduksi konten dan berinteraksi dengan komunitas.
          </p>

          <div className="grid grid-cols-3 gap-md">
            <div className="card" style={{ textAlign: "left", background: "white" }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: "var(--primary-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--primary)",
                marginBottom: "20px"
              }}>
                <Coffee size={24} />
              </div>
              <h3 style={{ fontSize: "20px", marginBottom: "12px" }}>Tampilan Simpel</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                Desain minimalis berfokus pada kemudahan supporter. Hanya butuh 3 klik untuk menyelesaikan tip.
              </p>
            </div>

            <div className="card" style={{ textAlign: "left", background: "white" }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: "var(--primary-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--primary)",
                marginBottom: "20px"
              }}>
                <Zap size={24} />
              </div>
              <h3 style={{ fontSize: "20px", marginBottom: "12px" }}>Alert Instan (OBS)</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                Alert bersuara, GIF menarik, dan Text-to-Speech (TTS) otomatis terpicu secara real-time di layar live stream.
              </p>
            </div>

            <div className="card" style={{ textAlign: "left", background: "white" }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: "var(--primary-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--primary)",
                marginBottom: "20px"
              }}>
                <Shield size={24} />
              </div>
              <h3 style={{ fontSize: "20px", marginBottom: "12px" }}>Aman Terintegrasi</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                Menggunakan gateway Midtrans yang aman untuk memverifikasi pembayaran dan melindungi data pribadi Anda.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature list */}
      <section id="fitur" style={{ padding: "80px 0" }}>
        <div className="container">
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "60px",
            alignItems: "center"
          }}>
            <div>
              <h2 style={{ fontSize: "36px", marginBottom: "20px", lineHeight: "1.2" }}>
                Atur Overlay Sesuai Brand dan Estetika Stream-mu
              </h2>
              <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
                Sesuaikan skema warna, template kata-kata alert, suara chime, hingga animasi GIF overlay. 
                Dukungan browser Speech Synthesis membaca pesan dukungan secara otomatis, mempermudah interaksi streamer dan penonton.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: "600" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--primary)" }}></div>
                  Saring otomatis kata-kata kasar (toxic filtering)
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: "600" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--primary)" }}></div>
                  Integrasi Discord Webhook notifikasi server
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: "600" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--primary)" }}></div>
                  Dukungan badge verifikasi supporter setia
                </div>
              </div>
            </div>

            <div className="card" style={{
              background: "white",
              padding: "40px",
              border: "2px dashed var(--primary)",
              textAlign: "center"
            }}>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                backgroundColor: "var(--primary-light)",
                color: "var(--primary)",
                fontSize: "36px",
                marginBottom: "24px"
              }}>
                📢
              </div>
              <h3 style={{ fontSize: "22px", marginBottom: "8px" }}>Tampilan Alert Simulator</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "20px" }}>
                "Opet mengirim Rp 50.000!"
              </p>
              <div style={{
                background: "var(--bg-surface-alt)",
                padding: "12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontFamily: "monospace",
                color: "var(--text-muted)"
              }}>
                Teks dibacakan otomatis via SpeechSynthesis
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" style={{ padding: "60px 0 80px", backgroundColor: "var(--bg-surface-alt)" }}>
        <div className="container" style={{ maxWidth: "700px" }}>
          <h2 style={{ fontSize: "32px", textAlign: "center", marginBottom: "40px" }}>Pertanyaan yang Sering Diajukan</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {faqs.map((faq, idx) => (
              <details key={idx} className="card" style={{
                background: "white",
                cursor: "pointer",
                padding: "0"
              }}>
                <summary style={{
                  padding: "20px 24px",
                  fontWeight: "600",
                  outline: "none",
                  userSelect: "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  {faq.q}
                </summary>
                <div style={{
                  padding: "0 24px 20px 24px",
                  color: "var(--text-muted)",
                  borderTop: "1px solid var(--border-color)",
                  paddingTop: "16px",
                  fontSize: "15px",
                  lineHeight: "1.6"
                }}>
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: "auto",
        backgroundColor: "#171513",
        color: "#a39f97",
        padding: "48px 0 24px",
        borderTop: "1px solid #2e2b27"
      }}>
        <div className="container">
          <div style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr",
            gap: "48px",
            marginBottom: "40px"
          }}>
            <div>
              <h3 style={{ color: "white", fontFamily: "var(--font-outfit)", marginBottom: "16px" }}>sorakin.</h3>
              <p style={{ fontSize: "14px", lineHeight: "1.6", maxWidth: "300px" }}>
                Solusi monetisasi sederhana, transparan, dan andal untuk semua pembuat konten kreatif di Indonesia.
              </p>
            </div>
            <div>
              <h4 style={{ color: "white", fontSize: "16px", marginBottom: "16px" }}>Link Cepat</h4>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px" }}>
                <li><Link href="/explore">Temukan Kreator</Link></li>
                <li><a href="#about">Tentang Kami</a></li>
                <li><a href="#fitur">Fitur Utama</a></li>
              </ul>
            </div>
            <div>
              <h4 style={{ color: "white", fontSize: "16px", marginBottom: "16px" }}>Kontak & Hubungan</h4>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px" }}>
                <li>Email: support@sorakin.id</li>
                <li>Discord: sorakin-community</li>
                <li>Sosial: @sorakin_id</li>
              </ul>
            </div>
          </div>

          <div style={{
            borderTop: "1px solid #2e2b27",
            paddingTop: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "12px"
          }}>
            <p>&copy; {new Date().getFullYear()} Sorakin. Hak Cipta Dilindungi.</p>
            <div style={{ display: "flex", gap: "16px" }}>
              <Link href="#">Syarat & Ketentuan</Link>
              <Link href="#">Kebijakan Privasi</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
