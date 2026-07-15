"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Sparkles, User, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!identifier || !password) {
      setError("Email/username dan kata sandi wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password, rememberMe }),
      });
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server tidak merespons dengan benar. Silakan coba lagi.");
      }

      if (!response.ok) {
        throw new Error(data.error || "Login gagal. Periksa kembali data Anda.");
      }

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
      const randomEmail = mockGoogleEmails[0]; // defaults to first mock account
      const name = "Rizky Kreatif";

      const response = await fetch("/api/auth/google-mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: randomEmail, name }),
      });
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
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
          <h2 style={{ fontSize: "24px", marginBottom: "8px" }}>Masuk ke Sorakin</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Selamat datang kembali! Masuk untuk mengelola profil dan tip Anda.
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

        <form onSubmit={handleLogin}>
          {/* Email / Username input */}
          <div className="form-group">
            <label className="form-label" htmlFor="identifier">Email / Username</label>
            <div style={{ position: "relative" }}>
              <User size={18} style={{
                position: "absolute",
                left: "14px",
                top: "14px",
                color: "var(--text-muted)"
              }} />
              <input
                id="identifier"
                type="text"
                placeholder="email@domain.com atau username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="input-field"
                style={{ width: "100%", paddingLeft: "42px" }}
                required
              />
            </div>
          </div>

          {/* Password input */}
          <div className="form-group" style={{ marginBottom: "16px" }}>
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
                placeholder="Masukkan kata sandi Anda"
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

          {/* Remember me & forgot password */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "between",
            width: "100%",
            marginBottom: "28px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: "16px", height: "16px", accentColor: "var(--primary)" }}
              />
              <label htmlFor="rememberMe" style={{ fontSize: "13px", color: "var(--text-muted)", cursor: "pointer" }}>
                Ingat saya
              </label>
            </div>
            <Link href="#" style={{ fontSize: "13px", color: "var(--primary-hover)", fontWeight: "600" }}>
              Lupa kata sandi?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: "100%", padding: "14px 0", fontSize: "16px", marginBottom: "20px" }}
          >
            {loading ? "Masuk..." : "Masuk"}
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

        {/* Google OAuth Simulator */}
        <button
          type="button"
          onClick={handleGoogleMock}
          className="btn btn-secondary"
          style={{ width: "100%", padding: "12px 0", gap: "10px" }}
        >
          <Sparkles size={16} style={{ color: "var(--primary)" }} />
          Masuk dengan Google Account
        </button>

        <p style={{
          textAlign: "center",
          marginTop: "32px",
          fontSize: "14px",
          color: "var(--text-muted)"
        }}>
          Belum punya akun? <Link href="/register" style={{ color: "var(--primary-hover)", fontWeight: "600" }}>Daftar di sini</Link>
        </p>
      </div>
    </div>
  );
}
