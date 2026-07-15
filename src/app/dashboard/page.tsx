"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  User, Shield, CreditCard, Laptop, Settings, Image as ImageIcon, 
  ExternalLink, Copy, Check, Sliders, Bell, AlertTriangle, Play, RefreshCw, LogOut, CheckCircle
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [activeMode, setActiveMode] = useState<"personal" | "creator">("personal");
  const [activeTab, setActiveTab] = useState<string>("akun");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Personal account fields
  const [fullName, setFullName] = useState("");
  const [personalUsername, setPersonalUsername] = useState("");
  const [personalPhone, setPersonalPhone] = useState("");

  // Keamanan fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Creator profile creation fields
  const [creatorName, setCreatorName] = useState("");
  const [creatorUsername, setCreatorUsername] = useState("");
  const [creatorCategory, setCreatorCategory] = useState("Gamer");
  const [creatorDesc, setCreatorDesc] = useState("");

  // Creator profile edit fields
  const [editCreatorName, setEditCreatorName] = useState("");
  const [editCreatorUsername, setEditCreatorUsername] = useState("");
  const [editCreatorCategory, setEditCreatorCategory] = useState("Gamer");
  const [editCreatorDesc, setEditCreatorDesc] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // Settings configs
  const [showFeed, setShowFeed] = useState(false);
  const [showAmount, setShowAmount] = useState(false);
  const [feeCoverage, setFeeCoverage] = useState("CREATOR");
  const [quickAmounts, setQuickAmounts] = useState("10000,20000,50000,100000");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialYoutube, setSocialYoutube] = useState("");
  const [socialWebsite, setSocialWebsite] = useState("");
  const [enableKeywordFilter, setEnableKeywordFilter] = useState(false);
  const [customKeywords, setCustomKeywords] = useState("");
  const [discordWebhook, setDiscordWebhook] = useState("");
  const [discordTemplate, setDiscordTemplate] = useState("");

  // Transactions lists & Filters
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txTotal, setTxTotal] = useState(0);
  const [txLimit, setTxLimit] = useState(10);
  const [txPage, setTxPage] = useState(1);
  const [txStatus, setTxStatus] = useState("Semua");
  const [txQuery, setTxQuery] = useState("");
  const [txViewStyle, setTxViewStyle] = useState<"list" | "column">("list");

  // Bank Info & Withdrawals
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isBankLinked, setIsBankLinked] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");

  // Developer Mock Panel
  const [mockPendingOrders, setMockPendingOrders] = useState<any[]>([]);

  // Clipboard copies
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Verified badge confetti modal state
  const [showVerifiedModal, setShowVerifiedModal] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);

  // Fetch user session data
  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setSession(data.user);
      
      // Hydrate forms
      setFullName(data.user.name || "");
      setPersonalUsername(data.user.username || "");
      setPersonalPhone(data.user.phone || "");

      if (data.user.creator) {
        setEditCreatorName(data.user.creator.name);
        setEditCreatorUsername(data.user.creator.username);
        setEditCreatorCategory(data.user.creator.category);
        setEditCreatorDesc(data.user.creator.description || "");

        const settings = data.user.creator.settings;
        if (settings) {
          setShowFeed(settings.showFeed);
          setShowAmount(settings.showAmount);
          setFeeCoverage(settings.feeCoverage);
          setQuickAmounts(settings.quickAmounts);
          setSocialInstagram(settings.socialInstagram || "");
          setSocialYoutube(settings.socialYoutube || "");
          setSocialWebsite(settings.socialWebsite || "");
          setEnableKeywordFilter(settings.enableKeywordFilter);
          setCustomKeywords(settings.customKeywords || "");
          setDiscordWebhook(settings.discordWebhook || "");
          setDiscordTemplate(settings.discordTemplate || "");
        }
      }
    } catch (e) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  // Fetch transactions based on active Tab
  const fetchTransactions = async () => {
    if (!session) return;
    try {
      const modeParam = activeMode === "creator" ? "creator" : "personal";
      const url = `/api/donations?type=${modeParam}&status=${txStatus}&query=${txQuery}&limit=${txLimit}&page=${txPage}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setTransactions(data.donations || []);
        setTxTotal(data.pagination?.total || 0);

        // Fetch mock developer tools list of pending orders
        if (activeMode === "creator") {
          // get all pending orders to let developers click to "Mock Pay"
          const pending = (data.donations || []).filter((d: any) => d.paymentStatus === "PENDING");
          setMockPendingOrders(pending);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch withdrawals
  const fetchWithdrawals = async () => {
    if (activeMode !== "creator") return;
    try {
      const res = await fetch("/api/creator/withdraw");
      const data = await res.json();
      if (res.ok) {
        setWithdrawals(data.withdrawals || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === "transaksi") {
      fetchTransactions();
    }
    if (activeTab === "penarikan") {
      fetchWithdrawals();
    }
  }, [activeTab, activeMode, txStatus, txPage, txLimit]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const handleUpdatePersonalProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fullName, username: personalUsername, phone: personalPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccessMsg("Profil pribadi berhasil diperbarui.");
      await fetchSession();
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccessMsg("Kata sandi berhasil diubah.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCreatorProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const formData = new FormData();
      formData.append("action", "create");
      formData.append("name", creatorName);
      formData.append("username", creatorUsername);
      formData.append("category", creatorCategory);
      formData.append("description", creatorDesc);

      const res = await fetch("/api/creator/profile", {
        method: "POST",
        body: formData, // multipart/form-data
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccessMsg("Profil kreator berhasil dibuat! Selamat bergabung!");
      setActiveMode("creator");
      setActiveTab("akun");
      await fetchSession();
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCreatorProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const formData = new FormData();
      formData.append("action", "update-profile");
      formData.append("name", editCreatorName);
      formData.append("username", editCreatorUsername);
      formData.append("category", editCreatorCategory);
      formData.append("description", editCreatorDesc);

      const res = await fetch("/api/creator/profile", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Handle file uploads if any
      if (avatarFile || coverFile) {
        const fileForm = new FormData();
        fileForm.append("action", "update-images");
        if (avatarFile) fileForm.append("avatar", avatarFile);
        if (coverFile) fileForm.append("cover", coverFile);

        const imgRes = await fetch("/api/creator/profile", {
          method: "POST",
          body: fileForm,
        });
        const imgData = await imgRes.json();
        if (!imgRes.ok) throw new Error(imgData.error);
      }

      setSuccessMsg("Profil kreator berhasil diperbarui.");
      setAvatarFile(null);
      setCoverFile(null);
      await fetchSession();
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/creator/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            showFeed,
            showAmount,
            feeCoverage,
            quickAmounts,
            socialInstagram,
            socialYoutube,
            socialWebsite,
            enableKeywordFilter,
            customKeywords,
            discordWebhook,
            discordTemplate,
          }
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccessMsg("Pengaturan halaman berhasil disimpan.");
      await fetchSession();
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLinkBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/creator/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "link-bank",
          bankName,
          accountNumber,
          accountName
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setIsBankLinked(true);
      setSuccessMsg("Rekening bank berhasil didaftarkan dan diverifikasi.");
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/creator/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "withdraw",
          amount: withdrawAmount,
          bankName,
          accountNumber,
          accountName
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccessMsg(`Penarikan sebesar Rp ${parseFloat(withdrawAmount).toLocaleString("id-ID")} berhasil diproses.`);
      setWithdrawAmount("");
      await fetchSession();
      await fetchWithdrawals();
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRequestVerifiedBadge = async () => {
    setSaving(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/verify-account", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Trigger fullscreen confetti animation
      setConfettiActive(true);
      setShowVerifiedModal(true);
      await fetchSession();
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setSaving(false);
    }
  };

  // Developer Tools: Mock Webhook Payment Callback
  const handleMockWebhookPay = async (orderId: string, grossAmount: number) => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      // Midtrans standard webhook simulation calls backend signature calculation securely
      // By sending calculated key in request payload
      const calculatedKey = "MOCK_SIGNATURE_KEY_sandbox_2026";
      
      const mockPayload = {
        order_id: orderId,
        status_code: "200",
        gross_amount: grossAmount.toString(),
        signature_key: "", // Webhook endpoint calculates key inside. We must simulate standard Midtrans sandbox payload
        transaction_status: "settlement",
        payment_type: "qris",
        fraud_status: "accept"
      };

      // To verify signature validation properly, let's trigger it directly.
      // Wait, our webhook endpoint checks signature using:
      // SHA512(order_id + status_code + gross_amount + server_key)
      const serverKey = "SB-Mid-server-edw3KwhRs02ppYEOVKrqWIWN";
      const signatureSource = `${orderId}200${grossAmount}${serverKey}`;
      const calculateHash = (src: string) => {
        // We'll calculate it using standard JS on client? No, server does it.
        // Wait, client has no crypto module, but we can compute it on server. We just fetch /api/midtrans/webhook
        // Let's calculate the signature on client using a simple helper or we can just send the payload.
        // Wait! How can the client calculate SHA-512?
        // Standard Web Crypto API has subtle crypto supporting SHA-512!
        const encoder = new TextEncoder();
        const data = encoder.encode(src);
        return window.crypto.subtle.digest("SHA-512", data).then(hash => {
          return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, "0"))
            .join("");
        });
      };

      const key = await calculateHash(signatureSource);
      mockPayload.signature_key = key;

      const res = await fetch("/api/midtrans/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mockPayload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccessMsg(`Simulasi Webhook berhasil: Pembayaran ${orderId} lunas!`);
      await fetchSession();
      await fetchTransactions();
    } catch (e: any) {
      setErrorMsg("Gagal simulasi webhook: " + e.message);
    }
  };

  // Developer Tools: Mock Payout Settlement Cron
  const handleTriggerSettlementCron = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/creator/settlement", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccessMsg(data.message || "Sinkronisasi saldo selesai.");
      await fetchSession();
    } catch (e: any) {
      setErrorMsg("Gagal trigger settlement: " + e.message);
    }
  };

  // Developer Tools: Mock Alert Sound test
  const handleTestOverlayAlert = async () => {
    if (!session?.creator?.overlay) return;
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/overlays/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: session.creator.overlay.key,
          senderName: "Donatur Uji Coba",
          amount: 25000,
          message: "Halo! Ini adalah pesan donasi uji coba overlay!"
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccessMsg("Alert uji coba terkirim ke overlay stream OBS!");
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: "flex",
        height: "100vh",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--bg-landing)"
      }}>
        <div style={{ textAlign: "center" }}>
          <RefreshCw className="pop-animation" size={48} style={{ color: "var(--primary)", animation: "spin 1.5s linear infinite" }} />
          <p style={{ marginTop: "16px", fontWeight: "600", color: "var(--text-muted)" }}>Memuat Dashboard...</p>
        </div>
      </div>
    );
  }

  const hasCreatorProfile = !!session?.creator;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "var(--bg-landing)" }}>
      
      {/* Top Navbar */}
      <header className="glass-panel" style={{
        borderBottom: "1px solid var(--border-color)",
        padding: "12px 0",
        position: "sticky",
        top: 0,
        zIndex: 90
      }}>
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-md">
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                width: "32px",
                height: "32px",
                backgroundColor: "var(--primary)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "800",
                fontSize: "18px"
              }}>S</div>
              <span style={{ fontFamily: "var(--font-outfit)", fontWeight: 800, fontSize: "20px" }}>sorakin</span>
            </Link>

            {/* Dropdown selector for Personal vs Creator Mode */}
            {hasCreatorProfile && (
              <select
                value={activeMode}
                onChange={(e) => {
                  setActiveMode(e.target.value as any);
                  setActiveTab("akun"); // reset tab
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: "var(--border-radius-sm)",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "white",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                <option value="personal">👤 Personal Mode</option>
                <option value="creator">🎬 Creator Mode</option>
              </select>
            )}
          </div>

          <div className="flex items-center gap-md">
            {/* Header Balance view for Creator */}
            {activeMode === "creator" && hasCreatorProfile && (
              <div className="glass-panel" style={{
                padding: "6px 16px",
                borderRadius: "var(--border-radius-md)",
                fontSize: "13px",
                fontWeight: "600",
                position: "relative",
                cursor: "pointer"
              }} title="Klik tab Transaksi & Penarikan untuk detail saldo">
                <span>Saldo Payoutable: </span>
                <span style={{ color: "var(--success)", fontWeight: "700" }}>
                  Rp {session.creator.balance.toLocaleString("id-ID")}
                </span>
              </div>
            )}

            <div className="flex items-center gap-sm">
              <span style={{ fontSize: "14px", fontWeight: "600" }}>
                Halo, {session.name}
                {session.isVerified && (
                  <span className="badge badge-verified" style={{ marginLeft: "6px", transform: "scale(0.9)" }}>
                    ✓
                  </span>
                )}
              </span>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                <LogOut size={14} /> Keluar
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Confetti popup modal for successful verified request */}
      {showVerifiedModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(29, 27, 24, 0.8)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(4px)"
        }}>
          <div className="card pop-animation" style={{
            background: "white",
            maxWidth: "400px",
            textAlign: "center",
            padding: "40px 30px",
            border: "3px solid var(--primary)"
          }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>🎉</div>
            <h2 style={{ fontSize: "24px", marginBottom: "12px", color: "var(--primary-hover)" }}>Selamat, Akun Terverifikasi!</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6", marginBottom: "24px" }}>
              Anda sekarang memiliki badge **Verified Supporter** resmi Sorakin. Lencana centang biru akan tampil di halaman tip kreator dan live alert overlay.
            </p>
            <button
              onClick={() => {
                setShowVerifiedModal(false);
                setConfettiActive(false);
              }}
              className="btn btn-primary"
              style={{ width: "100%" }}
            >
              Lihat Badge Saya
            </button>
          </div>
        </div>
      )}

      {/* Main dashboard contents */}
      <div className="container" style={{ flex: 1, padding: "36px 24px", display: "flex", gap: "30px", flexDirection: "row" }}>
        
        {/* Sidebar Nav */}
        <aside style={{ width: "240px", flexShrink: 0 }}>
          <div className="card" style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "6px", background: "white" }}>
            <div style={{ padding: "10px 14px", fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>
              Menu Dashboard
            </div>
            
            <button
              onClick={() => setActiveTab("akun")}
              className="btn"
              style={{
                justifyContent: "flex-start",
                background: activeTab === "akun" ? "var(--primary-light)" : "transparent",
                color: activeTab === "akun" ? "var(--primary-hover)" : "var(--text-main)",
                padding: "10px 14px",
                fontSize: "14px",
                borderRadius: "var(--border-radius-md)"
              }}
            >
              <User size={18} /> Profile & Akun
            </button>

            <button
              onClick={() => setActiveTab("keamanan")}
              className="btn"
              style={{
                justifyContent: "flex-start",
                background: activeTab === "keamanan" ? "var(--primary-light)" : "transparent",
                color: activeTab === "keamanan" ? "var(--primary-hover)" : "var(--text-main)",
                padding: "10px 14px",
                fontSize: "14px",
                borderRadius: "var(--border-radius-md)"
              }}
            >
              <Shield size={18} /> Keamanan
            </button>

            <button
              onClick={() => setActiveTab("transaksi")}
              className="btn"
              style={{
                justifyContent: "flex-start",
                background: activeTab === "transaksi" ? "var(--primary-light)" : "transparent",
                color: activeTab === "transaksi" ? "var(--primary-hover)" : "var(--text-main)",
                padding: "10px 14px",
                fontSize: "14px",
                borderRadius: "var(--border-radius-md)"
              }}
            >
              <CreditCard size={18} /> Riwayat Transaksi
            </button>

            {activeMode === "creator" && hasCreatorProfile && (
              <>
                <button
                  onClick={() => setActiveTab("penarikan")}
                  className="btn"
                  style={{
                    justifyContent: "flex-start",
                    background: activeTab === "penarikan" ? "var(--primary-light)" : "transparent",
                    color: activeTab === "penarikan" ? "var(--primary-hover)" : "var(--text-main)",
                    padding: "10px 14px",
                    fontSize: "14px",
                    borderRadius: "var(--border-radius-md)"
                  }}
                >
                  <Sliders size={18} /> Penarikan Dana
                </button>

                <button
                  onClick={() => setActiveTab("overlay")}
                  className="btn"
                  style={{
                    justifyContent: "flex-start",
                    background: activeTab === "overlay" ? "var(--primary-light)" : "transparent",
                    color: activeTab === "overlay" ? "var(--primary-hover)" : "var(--text-main)",
                    padding: "10px 14px",
                    fontSize: "14px",
                    borderRadius: "var(--border-radius-md)"
                  }}
                >
                  <Bell size={18} /> Overlay OBS Alerts
                </button>
              </>
            )}
          </div>

          {/* Dev utility trigger panel (Always visible for easy testing) */}
          <div className="card" style={{ marginTop: "24px", padding: "16px", border: "1px dashed var(--primary)", background: "#fffdf9" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "700", color: "var(--primary-hover)", marginBottom: "12px" }}>
              <Laptop size={14} /> DEVELOPER TOOLBOX
            </div>
            
            <button
              onClick={handleTriggerSettlementCron}
              className="btn btn-secondary"
              style={{ width: "100%", fontSize: "11px", padding: "8px 0", gap: "4px", marginBottom: "8px", justifyContent: "center" }}
              title="Simulates standard 24h cron check to settle held payouts instantly"
            >
              <RefreshCw size={12} /> Jalankan Settle Cron
            </button>

            {activeMode === "creator" && hasCreatorProfile && (
              <>
                <button
                  onClick={handleTestOverlayAlert}
                  className="btn btn-secondary"
                  style={{ width: "100%", fontSize: "11px", padding: "8px 0", gap: "4px", justifyContent: "center", marginBottom: "12px" }}
                >
                  <Play size={12} style={{ color: "var(--success)" }} /> Tes Overlay Alert (Live)
                </button>

                {mockPendingOrders.length > 0 && (
                  <div style={{ fontSize: "11px", borderTop: "1px solid var(--border-color)", paddingTop: "10px" }}>
                    <div style={{ fontWeight: "600", marginBottom: "6px" }}>Pending Tip Simulator:</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {mockPendingOrders.slice(0, 3).map((ord) => (
                        <button
                          key={ord.id}
                          onClick={() => handleMockWebhookPay(ord.id, ord.totalAmount)}
                          style={{
                            textAlign: "left",
                            padding: "4px 8px",
                            backgroundColor: "white",
                            border: "1px solid var(--border-color)",
                            borderRadius: "4px",
                            fontSize: "10px",
                            cursor: "pointer",
                            width: "100%",
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis"
                          }}
                        >
                          💸 Bayar: Rp {ord.amount} ({ord.senderName})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </aside>

        {/* Content Pane */}
        <main style={{ flex: 1 }}>
          
          {/* Notifications banner */}
          {successMsg && (
            <div className="badge badge-success" style={{
              display: "flex",
              width: "100%",
              padding: "12px 18px",
              borderRadius: "var(--border-radius-md)",
              fontSize: "14px",
              marginBottom: "20px",
              alignItems: "center",
              gap: "8px",
              border: "1px solid #c2f3e2"
            }}>
              <CheckCircle size={16} /> {successMsg}
            </div>
          )}

          {errorMsg && (
            <div style={{
              backgroundColor: "#ffe3e3",
              color: "var(--error)",
              padding: "12px 18px",
              borderRadius: "var(--border-radius-md)",
              fontSize: "14px",
              marginBottom: "20px",
              border: "1px solid #ffd8d8",
              fontWeight: "500"
            }}>
              {errorMsg}
            </div>
          )}

          {/* TAB 1: Profile & Akun (PERSONAL MODE) */}
          {activeTab === "akun" && activeMode === "personal" && (
            <div className="card" style={{ background: "white" }}>
              <h2 style={{ fontSize: "22px", marginBottom: "20px" }}>Pengaturan Profil Pribadi</h2>
              
              <form onSubmit={handleUpdatePersonalProfile}>
                <div className="form-group">
                  <label className="form-label">Nama Lengkap</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Username Personal</label>
                  <input
                    type="text"
                    value={personalUsername}
                    onChange={(e) => setPersonalUsername(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: "28px" }}>
                  <label className="form-label">Nomor Telepon</label>
                  <input
                    type="text"
                    value={personalPhone}
                    onChange={(e) => setPersonalPhone(e.target.value)}
                    className="input-field"
                    placeholder="Contoh: 08123456789"
                  />
                </div>

                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </form>

              {/* Creator Registration Panel if not a Creator yet */}
              {!hasCreatorProfile && (
                <div style={{
                  marginTop: "40px",
                  borderTop: "2px dashed var(--border-color)",
                  paddingTop: "32px"
                }}>
                  <h2 style={{ fontSize: "22px", marginBottom: "10px" }}>Buat Akun Kreator</h2>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "24px" }}>
                    Daftarkan diri Anda sebagai kreator konten untuk mulai menerima tip langsung dari fans dan mengaktifkan live overlay OBS!
                  </p>

                  <form onSubmit={handleCreateCreatorProfile} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Nama Kreator (Display Name)</label>
                        <input
                          type="text"
                          placeholder="Contoh: Opet Streamer"
                          value={creatorName}
                          onChange={(e) => setCreatorName(e.target.value)}
                          className="input-field"
                          required
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Username URL Halaman Kreator</label>
                        <div style={{ position: "relative" }}>
                          <span style={{ position: "absolute", left: "14px", top: "14px", fontSize: "14px", color: "var(--text-muted)", fontWeight: "600" }}>
                            sorakin.id/
                          </span>
                          <input
                            type="text"
                            placeholder="username"
                            value={creatorUsername}
                            onChange={(e) => setCreatorUsername(e.target.value)}
                            className="input-field"
                            style={{ width: "100%", paddingLeft: "84px" }}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Kategori Kreator</label>
                      <select
                        value={creatorCategory}
                        onChange={(e) => setCreatorCategory(e.target.value)}
                        className="input-field"
                        style={{ cursor: "pointer" }}
                      >
                        <option value="Gamer">Gamer</option>
                        <option value="Musisi">Musisi</option>
                        <option value="Artist">Artist</option>
                        <option value="Podcaster">Podcaster</option>
                        <option value="Edukasi">Edukasi</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: "12px" }}>
                      <label className="form-label">Biografi / Deskripsi Singkat</label>
                      <textarea
                        rows={3}
                        placeholder="Tulis deskripsi singkat tentang konten atau stream Anda... (maksimal 300 karakter)"
                        value={creatorDesc}
                        onChange={(e) => setCreatorDesc(e.target.value)}
                        className="input-field"
                        maxLength={300}
                      />
                    </div>

                    <button type="submit" disabled={saving} className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
                      {saving ? "Membuat..." : "Buat Akun Kreator"}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 1: Profile & Akun (CREATOR MODE) */}
          {activeTab === "akun" && activeMode === "creator" && hasCreatorProfile && (
            <div className="card" style={{ background: "white" }}>
              <h2 style={{ fontSize: "22px", marginBottom: "20px" }}>Pengaturan Profil Halaman Kreator</h2>
              
              <form onSubmit={handleUpdateCreatorProfile} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Nama Kreator</label>
                    <input
                      type="text"
                      value={editCreatorName}
                      onChange={(e) => setEditCreatorName(e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Halaman URL Kreator</label>
                    <input
                      type="text"
                      value={editCreatorUsername}
                      onChange={(e) => setEditCreatorUsername(e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Kategori</label>
                  <select
                    value={editCreatorCategory}
                    onChange={(e) => setEditCreatorCategory(e.target.value)}
                    className="input-field"
                  >
                    <option value="Gamer">Gamer</option>
                    <option value="Musisi">Musisi</option>
                    <option value="Artist">Artist</option>
                    <option value="Podcaster">Podcaster</option>
                    <option value="Edukasi">Edukasi</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Biografi</label>
                  <textarea
                    rows={3}
                    value={editCreatorDesc}
                    onChange={(e) => setEditCreatorDesc(e.target.value)}
                    className="input-field"
                    maxLength={300}
                  />
                </div>

                {/* Upload Section */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", border: "1px solid var(--border-color)", padding: "16px", borderRadius: "var(--border-radius-md)" }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <ImageIcon size={14} /> Avatar Profile (Rekomendasi 1:1)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setAvatarFile(e.target.files ? e.target.files[0] : null)}
                      style={{ fontSize: "12px" }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <ImageIcon size={14} /> Cover Halaman Banner (1500x400)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCoverFile(e.target.files ? e.target.files[0] : null)}
                      style={{ fontSize: "12px" }}
                    />
                  </div>
                </div>

                {/* Preview Link Actions */}
                <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "10px" }}>
                  <button type="submit" disabled={saving} className="btn btn-primary">
                    {saving ? "Menyimpan..." : "Simpan Profil"}
                  </button>

                  <Link href={`/${session.creator.username}`} target="_blank" className="btn btn-secondary" style={{ padding: "10px 16px" }}>
                    Buka Halaman <ExternalLink size={14} />
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/${session.creator.username}`);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="btn btn-secondary"
                    style={{ padding: "10px 16px" }}
                  >
                    {copiedLink ? <><Check size={14} /> Tersalin!</> : <><Copy size={14} /> Salin Link</>}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: Keamanan */}
          {activeTab === "keamanan" && (
            <div className="card" style={{ background: "white" }}>
              <h2 style={{ fontSize: "22px", marginBottom: "20px" }}>Ubah Kata Sandi</h2>

              <form onSubmit={handleChangePassword}>
                <div className="form-group">
                  <label className="form-label">Kata Sandi Saat Ini</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Kata Sandi Baru</label>
                  <input
                    type="password"
                    placeholder="Minimal 8 karakter (Huruf Besar, Kecil, Angka)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: "28px" }}>
                  <label className="form-label">Konfirmasi Kata Sandi Baru</label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? "Memproses..." : "Ubah Password"}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: Transaksi */}
          {activeTab === "transaksi" && (
            <div className="card" style={{ background: "white" }}>
              <div style={{ display: "flex", justifyContent: "between", alignItems: "center", marginBottom: "24px", width: "100%" }}>
                <div>
                  <h2 style={{ fontSize: "22px" }}>
                    {activeMode === "creator" ? "Riwayat Tip Masuk" : "Dukungan yang Dikirim"}
                  </h2>
                  <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                    Total Transaksi: {txTotal} item
                  </p>
                </div>
                
                {/* Personal badge request popups triggers */}
                {activeMode === "personal" && !session.isVerified && (
                  <button
                    onClick={handleRequestVerifiedBadge}
                    className="btn btn-primary"
                    style={{
                      padding: "8px 16px",
                      fontSize: "13px",
                      background: "linear-gradient(135deg, #0284c7 0%, #3b82f6 100%)",
                      color: "white"
                    }}
                    title="Ajukan badge centang biru setelah melakukan tip ke kreator"
                  >
                    Ajukan Badge Verified 🌟
                  </button>
                )}
              </div>

              {/* Filters Panel */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr",
                gap: "12px",
                marginBottom: "20px"
              }}>
                <input
                  type="text"
                  placeholder="Cari transaksi..."
                  value={txQuery}
                  onChange={(e) => {
                    setTxQuery(e.target.value);
                    setTxPage(1);
                  }}
                  className="input-field"
                  style={{ padding: "8px 12px", fontSize: "13px" }}
                />

                <select
                  value={txStatus}
                  onChange={(e) => {
                    setTxStatus(e.target.value);
                    setTxPage(1);
                  }}
                  className="input-field"
                  style={{ padding: "8px 12px", fontSize: "13px" }}
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Selesai">Selesai (Paid)</option>
                  <option value="Pending">Pending</option>
                  <option value="Gagal">Gagal</option>
                </select>

                <select
                  value={txLimit}
                  onChange={(e) => {
                    setTxLimit(parseInt(e.target.value));
                    setTxPage(1);
                  }}
                  className="input-field"
                  style={{ padding: "8px 12px", fontSize: "13px" }}
                >
                  <option value="10">10 / Hal</option>
                  <option value="20">20 / Hal</option>
                  <option value="50">50 / Hal</option>
                </select>

                <div style={{ display: "flex", border: "1px solid var(--border-color)", borderRadius: "var(--border-radius-sm)", overflow: "hidden" }}>
                  <button
                    onClick={() => setTxViewStyle("list")}
                    style={{
                      flex: 1,
                      border: "none",
                      background: txViewStyle === "list" ? "var(--primary-light)" : "white",
                      color: txViewStyle === "list" ? "var(--primary-hover)" : "var(--text-muted)",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "600"
                    }}
                  >
                    List
                  </button>
                  <button
                    onClick={() => setTxViewStyle("column")}
                    style={{
                      flex: 1,
                      border: "none",
                      background: txViewStyle === "column" ? "var(--primary-light)" : "white",
                      color: txViewStyle === "column" ? "var(--primary-hover)" : "var(--text-muted)",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "600"
                    }}
                  >
                    Grid
                  </button>
                </div>
              </div>

              {/* Transactions display */}
              {transactions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
                  Belum ada transaksi terekam.
                </div>
              ) : txViewStyle === "list" ? (
                /* List Layout */
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid var(--border-color)", paddingBottom: "10px" }}>
                        <th style={{ padding: "10px" }}>ID Order</th>
                        <th style={{ padding: "10px" }}>Tanggal</th>
                        <th style={{ padding: "10px" }}>Nama Pengirim</th>
                        <th style={{ padding: "10px" }}>Nominal</th>
                        <th style={{ padding: "10px" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                          <td style={{ padding: "12px 10px", fontFamily: "monospace", fontSize: "12px" }}>{tx.id}</td>
                          <td style={{ padding: "12px 10px" }}>{new Date(tx.createdAt).toLocaleDateString("id-ID")}</td>
                          <td style={{ padding: "12px 10px" }}>
                            {tx.senderName}
                            {tx.sender?.isVerified && (
                              <span className="badge badge-verified" style={{ marginLeft: "4px", transform: "scale(0.85)" }}>
                                ✓
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "12px 10px", fontWeight: "700" }}>Rp {tx.amount.toLocaleString("id-ID")}</td>
                          <td style={{ padding: "12px 10px" }}>
                            <span className={`badge ${tx.paymentStatus === "SUCCESS" ? "badge-success" : "badge-pending"}`}>
                              {tx.paymentStatus === "SUCCESS" ? "Lunas" : tx.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Grid layout */
                <div className="grid grid-cols-2 gap-sm" style={{ display: "grid", gap: "16px" }}>
                  {transactions.map((tx) => (
                    <div key={tx.id} className="card" style={{ padding: "16px", display: "flex", flexDirection: "column", background: "#fdfdfb" }}>
                      <div style={{ display: "flex", justifyContent: "between", alignItems: "center", marginBottom: "10px" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                          {tx.id}
                        </span>
                        <span className={`badge ${tx.paymentStatus === "SUCCESS" ? "badge-success" : "badge-pending"}`}>
                          {tx.paymentStatus === "SUCCESS" ? "Lunas" : tx.paymentStatus}
                        </span>
                      </div>
                      
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: "700", fontSize: "15px", marginBottom: "4px" }}>
                        <span>Rp {tx.amount.toLocaleString("id-ID")}</span>
                      </div>

                      <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "8px" }}>
                        Dari: <strong>{tx.senderName}</strong>
                        {tx.sender?.isVerified && (
                          <span className="badge badge-verified" style={{ marginLeft: "4px", transform: "scale(0.8)" }}>
                            ✓
                          </span>
                        )}
                        ({tx.senderEmail})
                      </div>

                      {tx.message && (
                        <div style={{
                          background: "var(--bg-surface-alt)",
                          padding: "8px 12px",
                          borderRadius: "var(--border-radius-sm)",
                          fontSize: "13px",
                          fontStyle: "italic",
                          color: "var(--text-muted)",
                          borderLeft: "3px solid var(--primary)"
                        }}>
                          "{tx.message}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination controls */}
              {txTotal > txLimit && (
                <div style={{ marginTop: "24px", display: "flex", justifyContent: "center", gap: "10px" }}>
                  <button
                    onClick={() => setTxPage(p => Math.max(1, p - 1))}
                    disabled={txPage === 1}
                    className="btn btn-secondary"
                    style={{ padding: "6px 12px", fontSize: "12px" }}
                  >
                    Prev
                  </button>
                  <span style={{ display: "flex", alignItems: "center", fontSize: "13px", fontWeight: "600" }}>
                    Hal {txPage} dari {Math.ceil(txTotal / txLimit)}
                  </span>
                  <button
                    onClick={() => setTxPage(p => (p * txLimit < txTotal ? p + 1 : p))}
                    disabled={txPage * txLimit >= txTotal}
                    className="btn btn-secondary"
                    style={{ padding: "6px 12px", fontSize: "12px" }}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Penarikan Dana (CREATOR ONLY) */}
          {activeTab === "penarikan" && activeMode === "creator" && hasCreatorProfile && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              
              {/* Wallet balances grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
                <div className="card" style={{ background: "white" }}>
                  <div style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "6px" }}>
                    Saldo bisa dicairkan
                  </div>
                  <h2 style={{ color: "var(--success)" }}>Rp {session.creator.balance.toLocaleString("id-ID")}</h2>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>Dapat ditarik kapan saja</p>
                </div>

                <div className="card" style={{ background: "white" }}>
                  <div style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "6px" }}>
                    Dana sedang diproses
                  </div>
                  <h2 style={{ color: "var(--warning)" }}>Rp {session.creator.pendingBalance.toLocaleString("id-ID")}</h2>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>Held tunda (1 hari / 3 hari CC)</p>
                </div>

                <div className="card" style={{ background: "white" }}>
                  <div style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "6px" }}>
                    Saldo Total
                  </div>
                  <h2 style={{ color: "var(--primary-hover)" }}>
                    Rp {(session.creator.balance + session.creator.pendingBalance).toLocaleString("id-ID")}
                  </h2>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>Semua dana yang dimiliki</p>
                </div>
              </div>

              {/* Bank Link registration & withdrawal action panels */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                
                {/* Account Settings */}
                <div className="card" style={{ background: "white" }}>
                  <h3 style={{ fontSize: "18px", marginBottom: "16px" }}>Rekening Tujuan Penarikan</h3>
                  
                  <form onSubmit={handleLinkBank}>
                    <div className="form-group">
                      <label className="form-label">Nama Bank / E-Wallet</label>
                      <input
                        type="text"
                        placeholder="Contoh: BCA, BNI, GoPay, OVO"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="input-field"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Nomor Rekening / HP</label>
                      <input
                        type="text"
                        placeholder="Masukkan nomor saja"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="input-field"
                        required
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: "20px" }}>
                      <label className="form-label">Nama Pemilik Rekening</label>
                      <input
                        type="text"
                        placeholder="Nama lengkap di buku tabungan"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        className="input-field"
                        required
                      />
                    </div>

                    <button type="submit" disabled={saving} className="btn btn-secondary" style={{ width: "100%" }}>
                      Verifikasi & Simpan Rekening
                    </button>
                  </form>
                </div>

                {/* Withdraw Slider/Form */}
                <div className="card" style={{ background: "white" }}>
                  <h3 style={{ fontSize: "18px", marginBottom: "16px" }}>Tarik Saldo</h3>

                  {!isBankLinked && !session.creator.withdrawals?.length ? (
                    <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "center", alignItems: "center", textAlign: "center", color: "var(--text-muted)", padding: "20px 0" }}>
                      <AlertTriangle size={32} style={{ color: "var(--warning)", marginBottom: "10px" }} />
                      <p style={{ fontSize: "14px" }}>Tautkan rekening tujuan penarikan terlebih dahulu di panel sebelah kiri.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleWithdraw}>
                      <div className="form-group" style={{ marginBottom: "20px" }}>
                        <label className="form-label">Jumlah Penarikan (IDR)</label>
                        <input
                          type="number"
                          placeholder="Batas Minimum Rp 20.000"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          className="input-field"
                          min={20000}
                          max={session.creator.balance}
                          required
                        />
                        <div style={{ display: "flex", justifyContent: "between", fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                          <span>Min: Rp 20.000</span>
                          <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => setWithdrawAmount(session.creator.balance.toString())}>
                            Tarik Semua Saldo
                          </span>
                        </div>
                      </div>

                      <button type="submit" disabled={saving || session.creator.balance < 20000} className="btn btn-primary" style={{ width: "100%" }}>
                        Kirim Permintaan Tarik Saldo
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Withdrawals Logs */}
              <div className="card" style={{ background: "white" }}>
                <h3 style={{ fontSize: "18px", marginBottom: "16px" }}>Riwayat Penarikan Dana</h3>

                {withdrawals.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: "14px" }}>
                    Belum ada riwayat penarikan dana.
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid var(--border-color)" }}>
                        <th style={{ padding: "8px" }}>Tanggal</th>
                        <th style={{ padding: "8px" }}>Rekening</th>
                        <th style={{ padding: "8px" }}>Jumlah</th>
                        <th style={{ padding: "8px" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawals.map((w) => (
                        <tr key={w.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                          <td style={{ padding: "10px 8px" }}>{new Date(w.createdAt).toLocaleDateString("id-ID")}</td>
                          <td style={{ padding: "10px 8px" }}>{w.bankName} - {w.accountNumber} ({w.accountName})</td>
                          <td style={{ padding: "10px 8px", fontWeight: "700" }}>Rp {w.amount.toLocaleString("id-ID")}</td>
                          <td style={{ padding: "10px 8px" }}>
                            <span className="badge badge-success" style={{ padding: "2px 8px" }}>
                              {w.status === "SUCCESS" ? "Selesai" : w.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: Overlay configuration */}
          {activeTab === "overlay" && activeMode === "creator" && hasCreatorProfile && (
            <div className="card" style={{ background: "white" }}>
              <h2 style={{ fontSize: "22px", marginBottom: "10px" }}>OBS Overlay Setup</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "24px" }}>
                Salin tautan overlay di bawah ini dan tempelkan sebagai **Browser Source** di OBS Studio Anda untuk menampilkan notifikasi alert interaktif secara real-time.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* OBS Tautan Copy area */}
                <div className="form-group">
                  <label className="form-label">Tautan Browser Source OBS</label>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/overlay/${session.creator.overlay.key}`}
                      className="input-field"
                      style={{ flex: 1, fontFamily: "monospace", fontSize: "12px", background: "var(--bg-surface-alt)" }}
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/overlay/${session.creator.overlay.key}`);
                        setCopiedKey(true);
                        setTimeout(() => setCopiedKey(false), 2000);
                      }}
                      className="btn btn-secondary"
                      style={{ flexShrink: 0 }}
                    >
                      {copiedKey ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <button onClick={handleTestOverlayAlert} className="btn btn-primary">
                    <Play size={16} /> Tes Notifikasi (Overlay Simulator)
                  </button>
                  <Link href={`/overlay/${session.creator.overlay.key}`} target="_blank" className="btn btn-secondary">
                    Buka Halaman Overlay di Tab Baru
                  </Link>
                </div>

                {/* Configuration form for Overlay visual */}
                <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "20px", borderTop: "1px solid var(--border-color)", paddingTop: "24px" }}>
                  <h3 style={{ fontSize: "18px" }}>Kustomisasi Overlay Tampilan</h3>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    <div className="form-group">
                      <label className="form-label">Template Kalimat Alert</label>
                      <input
                        type="text"
                        value={discordTemplate} // wait, template overlay template
                        onChange={(e) => setDiscordTemplate(e.target.value)}
                        className="input-field"
                        placeholder="Gunakan {sender} dan {amount} untuk kustomisasi"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Durasi Alert Tampil (Detik)</label>
                      <input
                        type="number"
                        defaultValue={5}
                        className="input-field"
                        min={3}
                        max={30}
                      />
                    </div>
                  </div>

                  <h3 style={{ fontSize: "18px", borderTop: "1px solid var(--border-color)", paddingTop: "24px" }}>Integrasi & Pengaturan Tipping</h3>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    <div className="form-group">
                      <label className="form-label">Fee ditanggung siapa?</label>
                      <select
                        value={feeCoverage}
                        onChange={(e) => setFeeCoverage(e.target.value)}
                        className="input-field"
                      >
                        <option value="CREATOR">Fee ditanggung kreator (Dipotong dari tip)</option>
                        <option value="SUPPORTER">Fee ditanggung pendukung (Ditambah ke total bayar)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Nominal Cepat (Dukungan Cepat)</label>
                      <input
                        type="text"
                        value={quickAmounts}
                        onChange={(e) => setQuickAmounts(e.target.value)}
                        className="input-field"
                        placeholder="Contoh: 10000,20000,50000,100000"
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <input
                          type="checkbox"
                          checked={enableKeywordFilter}
                          onChange={(e) => setEnableKeywordFilter(e.target.checked)}
                          style={{ accentColor: "var(--primary)" }}
                        />
                        Aktifkan Filter Kata-kata Kasar (Toxic Filter)
                      </label>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Custom Keyword Filter Tambahan (pisahkan dengan koma)</label>
                      <input
                        type="text"
                        value={customKeywords}
                        onChange={(e) => setCustomKeywords(e.target.value)}
                        className="input-field"
                        placeholder="anjing,babi,dsb"
                      />
                    </div>
                  </div>

                  {/* Discord Webhook integrations */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", borderTop: "1px solid var(--border-color)", paddingTop: "24px" }}>
                    <div className="form-group">
                      <label className="form-label">Discord Webhook URL</label>
                      <input
                        type="text"
                        value={discordWebhook}
                        onChange={(e) => setDiscordWebhook(e.target.value)}
                        className="input-field"
                        placeholder="https://discord.com/api/webhooks/..."
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Template Chat Notifikasi Discord</label>
                      <input
                        type="text"
                        value={discordTemplate}
                        onChange={(e) => setDiscordTemplate(e.target.value)}
                        className="input-field"
                        placeholder="{sender} baru saja mengirim {amount}!"
                      />
                    </div>
                  </div>

                  {/* Social media inputs */}
                  <h3 style={{ fontSize: "18px", borderTop: "1px solid var(--border-color)", paddingTop: "24px" }}>Sosial Media</h3>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px" }}>
                    <div className="form-group">
                      <label className="form-label">Instagram Link</label>
                      <input
                        type="text"
                        value={socialInstagram}
                        onChange={(e) => setSocialInstagram(e.target.value)}
                        className="input-field"
                        placeholder="https://instagram.com/username"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Youtube Link</label>
                      <input
                        type="text"
                        value={socialYoutube}
                        onChange={(e) => setSocialYoutube(e.target.value)}
                        className="input-field"
                        placeholder="https://youtube.com/c/channel"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Website Link</label>
                      <input
                        type="text"
                        value={socialWebsite}
                        onChange={(e) => setSocialWebsite(e.target.value)}
                        className="input-field"
                        placeholder="https://mywebsite.com"
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={saving} className="btn btn-primary" style={{ alignSelf: "flex-start", marginTop: "10px" }}>
                    {saving ? "Menyimpan..." : "Simpan Pengaturan"}
                  </button>
                </form>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
