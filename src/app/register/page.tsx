"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Sparkles, Mail, Lock } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreement, setAgreement] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password || !confirmPassword) {
      setError("Semua data wajib diisi.");
      return;
    }

    if (!agreement) {
      setError("Anda harus menyetujui syarat & ketentuan.");
      return;
    }

    // Password strength check
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError("Kata sandi harus minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password dan konfirmasi belum cocok. Coba dicek lagi, ya.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, confirmPassword, agreement }),
      });
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server tidak merespons dengan benar. Silakan coba lagi.");
      }

      if (!response.ok) {
        throw new Error(data.error || "Gagal melakukan registrasi.");
      }

      // Success - Redirect to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleMock = async () => {
    setError("");
    setLoading(true);
    try {
      // Simulate Google OAuth response
      const mockGoogleEmails = ["rizky.kreatif@gmail.com", "dian.streaming@gmail.com", "gaming.master@gmail.com"];
      const randomEmail = mockGoogleEmails[Math.floor(Math.random() * mockGoogleEmails.length)];
      const name = randomEmail.split("@")[0].split(".").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

      const response = await fetch("/api/auth/google-mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: randomEmail, name }),
      });
      const text2 = await response.text();
      let data;
      try {
        data = JSON.parse(text2);
      } catch {
        throw new Error("Server tidak merespons dengan benar. Silakan coba lagi.");
      }

      if (!response.ok) {
        throw new Error(data.error || "Gagal masuk menggunakan Google Account.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      backgroundColor: "var(--bg-landing)"
    }}>
      <div className="card glass-panel" style={{
        width: "100%",
        maxWidth: "460px",
        padding: "40px"
      }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <Link href="/" style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "16px"
          }}>
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
              color: "#1d1b18"
            }}>S</div>
            <span style={{ fontFamily: "var(--font-outfit)", fontWeight: 800, fontSize: "24px", color: "var(--text-main)" }}>
              sorakin<span style={{ color: "var(--primary)" }}>.</span>
            </span>
          </Link>
          <h2 style={{ fontSize: "24px", marginBottom: "8px" }}>Daftar Akun Baru</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Mulai menerima tip dan dukung kreator favorit Anda!
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: "#ffe3e3",
            color: "var(--error)",
            padding: "12px 16px",
            borderRadius: "var(--border-radius-md)",
            fontSize: "14px",
            marginBottom: "20px",
            fontWeight: "500",
            border: "1px solid #ffd8d8"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          {/* Email input */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <div style={{ position: "relative" }}>
              <Mail size={18} style={{
                position: "absolute",
                left: "14px",
                top: "14px",
                color: "var(--text-muted)"
              }} />
              <input
                id="email"
                type="email"
                placeholder="nama@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                style={{ width: "100%", paddingLeft: "42px" }}
                required
              />
            </div>
          </div>

          {/* Password input */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">Kata Sandi</label>
            <div style={{ position: "relative" }}>
              <Lock size={18} style={{
                position: "absolute",
                left: "14px",
                top: "14px",
                color: "var(--text-muted)"
              }} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Minimal 8 karakter (A-Z, a-z, 0-9)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                style={{ width: "100%", paddingLeft: "42px", paddingRight: "42px" }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "14px",
                  top: "14px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)"
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password input */}
          <div className="form-group" style={{ marginBottom: "24px" }}>
            <label className="form-label" htmlFor="confirmPassword">Konfirmasi Kata Sandi</label>
            <div style={{ position: "relative" }}>
              <Lock size={18} style={{
                position: "absolute",
                left: "14px",
                top: "14px",
                color: "var(--text-muted)"
              }} />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Tulis ulang kata sandi"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                style={{ width: "100%", paddingLeft: "42px", paddingRight: "42px" }}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: "absolute",
                  right: "14px",
                  top: "14px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)"
                }}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Agreement Checkbox */}
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            marginBottom: "28px"
          }}>
            <input
              type="checkbox"
              id="agreement"
              checked={agreement}
              onChange={(e) => setAgreement(e.target.checked)}
              style={{ marginTop: "4px", width: "16px", height: "16px", accentColor: "var(--primary)" }}
            />
            <label htmlFor="agreement" style={{ fontSize: "13px", color: "var(--text-muted)", cursor: "pointer", lineHeight: "1.4" }}>
              Saya menyetujui <Link href="#" style={{ color: "var(--primary-hover)", fontWeight: "600" }}>Syarat & Ketentuan</Link> serta <Link href="#" style={{ color: "var(--primary-hover)", fontWeight: "600" }}>Kebijakan Privasi</Link> Sorakin.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: "100%", padding: "14px 0", fontSize: "16px", marginBottom: "20px" }}
          >
            {loading ? "Mendaftarkan..." : "Daftar Akun"}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: "flex",
          alignItems: "center",
          margin: "10px 0 24px",
          color: "var(--text-muted)",
          fontSize: "12px"
        }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-color)" }}></div>
          <span style={{ padding: "0 10px", fontWeight: "500" }}>ATAU</span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-color)" }}></div>
        </div>

        {/* Google register simulator */}
        <button
          type="button"
          onClick={handleGoogleMock}
          className="btn btn-secondary"
          style={{ width: "100%", padding: "12px 0", gap: "10px" }}
        >
          <Sparkles size={16} style={{ color: "var(--primary)" }} />
          Daftar dengan Google Account
        </button>

        <p style={{
          textAlign: "center",
          marginTop: "32px",
          fontSize: "14px",
          color: "var(--text-muted)"
        }}>
          Sudah punya akun? <Link href="/login" style={{ color: "var(--primary-hover)", fontWeight: "600" }}>Masuk di sini</Link>
        </p>
      </div>
    </div>
  );
}
