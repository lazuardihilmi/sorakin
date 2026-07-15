"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import { AlertCircle, QrCode, CreditCard, Sparkles, CheckCircle, RefreshCw } from "lucide-react";

export default function DonationForm({ creator, sessionUser }: { creator: any; sessionUser: any }) {
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState("10000");
  const [paymentType, setPaymentType] = useState<"credit_card" | "qris" | "gopay">("qris");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Interactive Widgets states
  const [widgetsData, setWidgetsData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"standard" | "voting" | "mediashare" | "soundboard">("standard");
  const [votingOptionId, setVotingOptionId] = useState<string>("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeVidId, setYoutubeVidId] = useState("");
  const [youtubeTitle, setYoutubeTitle] = useState("");
  const [soundboardSoundId, setSoundboardSoundId] = useState<string>("");

  useEffect(() => {
    const fetchWidgets = async () => {
      try {
        const res = await fetch(`/api/creator/widgets?username=${creator.username}`);
        const data = await res.json();
        if (res.ok) {
          setWidgetsData(data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchWidgets();
  }, [creator.username]);

  // Card details
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpMonth, setCardExpMonth] = useState("");
  const [cardExpYear, setCardExpYear] = useState("");
  const [cardCVV, setCardCVV] = useState("");

  // UI state
  const [qrisQrCode, setQrisQrCode] = useState("");
  const [orderId, setOrderId] = useState("");
  const [show3dsIframe, setShow3dsIframe] = useState(false);
  const [redirect3dsUrl, setRedirect3dsUrl] = useState("");

  // Pre-populate if logged in
  useEffect(() => {
    if (sessionUser) {
      setSenderName(sessionUser.name || "");
      setSenderEmail(sessionUser.email || "");
    }
  }, [sessionUser]);

  // Quick amount buttons
  const quickAmountsList: string[] = creator.settings?.quickAmounts
    ? (creator.settings.quickAmounts as string).split(",").map((a: string) => a.trim())
    : ["10000", "20000", "50000", "100000"];

  // Fee details logic live calculations
  const calculateFeesLocal = () => {
    const amt = parseFloat(amount) || 0;
    const feeCoverage = creator.settings?.feeCoverage || "CREATOR";
    const platformFee = 500;
    let serviceFee = 0;

    if (paymentType === "credit_card") {
      const percentage = 2.9;
      const fixed = 2000;
      serviceFee = (amt * (percentage / 100)) / (1 - percentage / 100) + fixed;
    } else if (paymentType === "qris") {
      serviceFee = amt * 0.007;
    } else if (paymentType === "gopay") {
      serviceFee = amt * 0.02;
    }

    // Rounding
    serviceFee = Math.round(serviceFee * 100) / 100;
    
    // VAT (11% on sum)
    const vatFee = Math.round((amt + serviceFee + platformFee) * 0.11 * 100) / 100;
    const totalFee = serviceFee + platformFee + vatFee;

    let totalAmount = amt;
    if (feeCoverage === "SUPPORTER") {
      totalAmount = amt + totalFee;
    }

    return {
      serviceFee,
      platformFee,
      vatFee,
      totalAmount: Math.round(totalAmount),
      isVAT: true
    };
  };

  const fees = calculateFeesLocal();

  const handleTippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg("Masukkan jumlah tip yang valid.");
      setLoading(false);
      return;
    }

    try {
      let token_id = "";

      // 1. Get Midtrans Credit Card Token client-side if Credit Card chosen
      if (paymentType === "credit_card") {
        if (!cardNumber || !cardExpMonth || !cardExpYear || !cardCVV) {
          throw new Error("Mohon lengkapi detail data kartu kredit Anda.");
        }

        const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "SB-Mid-client-AWkNxiBJhfUd8aNp";
        
        // Use Midtrans JS library tokenization
        // @ts-ignore
        if (typeof MidtransNew3ds === "undefined") {
          throw new Error("Pustaka pembayaran Midtrans gagal dimuat. Muat ulang halaman.");
        }

        const getCardTokenPromise = () => {
          return new Promise<string>((resolve, reject) => {
            // @ts-ignore
            MidtransNew3ds.getCardToken({
              card_number: cardNumber,
              card_exp_month: cardExpMonth,
              card_exp_year: cardExpYear,
              card_cvv: cardCVV,
              client_key: clientKey
            }, {
              onSuccess: (response: any) => resolve(response.token_id),
              onFailure: (response: any) => reject(new Error(response.status_message || "Tokenization failed."))
            });
          });
        };

        token_id = await getCardTokenPromise();
      }

      // 2. Submit charge request to backend
      const response = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorUsername: creator.username,
          senderName: isAnonymous ? "Anonim" : senderName,
          senderEmail,
          message,
           amount,
          paymentType,
          isAnonymous,
          token_id,
          votingOptionId: activeTab === "voting" ? votingOptionId : null,
          mediashareVidId: activeTab === "mediashare" ? youtubeVidId : null,
          mediashareTitle: activeTab === "mediashare" ? (youtubeTitle || "YouTube Video") : null,
          soundboardSoundId: activeTab === "soundboard" ? soundboardSoundId : null,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setOrderId(data.orderId);

      // 3. Handle Midtrans payment redirect actions
      if (paymentType === "credit_card") {
        if (data.redirectUrl) {
          // Open 3DS verification page
          setRedirect3dsUrl(data.redirectUrl);
          setShow3dsIframe(true);
        } else {
          // Direct capture success
          window.location.href = `/payment-finish?order_id=${data.orderId}`;
        }
      } else if (paymentType === "qris") {
        setQrisQrCode(data.qrisCodeUrl);
      } else if (paymentType === "gopay") {
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan pembayaran.");
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Midtrans Sandbox Client SDK */}
      <Script 
        src="https://api.sandbox.midtrans.com/v2/assets/js/midtrans-new-3ds.js" 
        strategy="beforeInteractive" 
      />

      {errorMsg && (
        <div style={{
          backgroundColor: "#ffe3e3",
          color: "var(--error)",
          padding: "12px 16px",
          borderRadius: "var(--border-radius-md)",
          fontSize: "14px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          border: "1px solid #ffd8d8"
        }}>
          <AlertCircle size={16} />
          {errorMsg}
        </div>
      )}

      {/* QRIS Overlay Modal Code popup */}
      {qrisQrCode && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(29, 27, 24, 0.9)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(6px)"
        }}>
          <div className="card pop-animation" style={{ background: "white", maxWidth: "380px", textAlign: "center", padding: "36px 24px" }}>
            <h3 style={{ fontSize: "20px", marginBottom: "8px" }}>Scan QRIS Pembayaran</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "12px", marginBottom: "20px" }}>
              Silakan pindai QR code berikut menggunakan GoPay, OVO, ShopeePay, atau m-banking Anda.
            </p>

            {/* QR image frame */}
            <div style={{
              background: "white",
              padding: "16px",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              display: "inline-block",
              marginBottom: "24px",
              boxShadow: "var(--shadow-sm)"
            }}>
              <img src={qrisQrCode} alt="QRIS Code" style={{ width: "240px", height: "240px", display: "block" }} />
            </div>

            <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>
              Total Bayar: <span style={{ color: "var(--primary-hover)" }}>Rp {fees.totalAmount.toLocaleString("id-ID")}</span>
            </div>

            <div style={{ color: "var(--text-muted)", fontSize: "11px", marginBottom: "20px" }}>
              ID Order: {orderId}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                onClick={() => {
                  window.location.href = `/payment-finish?order_id=${orderId}`;
                }}
                className="btn btn-primary"
              >
                Saya Sudah Bayar
              </button>
              <button
                onClick={() => {
                  setQrisQrCode("");
                  setLoading(false);
                }}
                className="btn btn-secondary"
              >
                Kembali & Batalkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3DS Credit Card Authentication Iframe Overlay Modal */}
      {show3dsIframe && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(29, 27, 24, 0.9)",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(6px)",
          padding: "24px"
        }}>
          <div className="card pop-animation" style={{
            background: "white",
            width: "100%",
            maxWidth: "500px",
            height: "550px",
            padding: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
          }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "between", alignItems: "center" }}>
              <h3 style={{ fontSize: "16px" }}>Verifikasi 3D Secure Kartu Kredit</h3>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Order: {orderId}</span>
            </div>

            <iframe 
              src={redirect3dsUrl} 
              style={{ flex: 1, border: "none", width: "100%" }}
            />

            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-color)", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  window.location.href = `/payment-finish?order_id=${orderId}`;
                }}
                className="btn btn-primary"
                style={{ padding: "8px 16px", fontSize: "13px" }}
              >
                Selesaikan Pembayaran
              </button>
              <button
                onClick={() => {
                  setShow3dsIframe(false);
                  setLoading(false);
                }}
                className="btn btn-secondary"
                style={{ padding: "8px 16px", fontSize: "13px" }}
              >
                Batalkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Donation form */}
      <form onSubmit={handleTippingSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* Name input */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Nama Pengirim</label>
          <input
            type="text"
            placeholder="Masukkan nama Anda"
            value={isAnonymous ? "Anonim" : senderName}
            onChange={(e) => setSenderName(e.target.value)}
            disabled={isAnonymous}
            className="input-field"
            required
          />
        </div>

        {/* Email input */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Email Pengirim</label>
          <input
            type="email"
            placeholder="nama@domain.com"
            value={senderEmail}
            onChange={(e) => setSenderEmail(e.target.value)}
            className="input-field"
            required
          />
        </div>

        {/* Anonymous toggle */}
        {sessionUser && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              id="anonToggle"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              style={{ width: "16px", height: "16px", accentColor: "var(--primary)" }}
            />
            <label htmlFor="anonToggle" style={{ fontSize: "13px", color: "var(--text-muted)", cursor: "pointer", fontWeight: "500" }}>
              Kirim sebagai Anonim (Sembunyikan nama asli & email dari Kreator)
            </label>
          </div>
        )}

        {/* Interactive Tipping Mode Tabs */}
        <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "10px", display: "flex", gap: "12px", overflowX: "auto" }}>
          <button
            type="button"
            onClick={() => setActiveTab("standard")}
            className="btn"
            style={{
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: "600",
              borderRadius: "100px",
              backgroundColor: activeTab === "standard" ? "var(--primary)" : "transparent",
              color: activeTab === "standard" ? "white" : "var(--text-main)",
              border: activeTab === "standard" ? "1px solid var(--primary)" : "1px solid var(--border-color)"
            }}
          >
            ☕ Dukungan Standar
          </button>
          
          {widgetsData?.votingPoll?.isActive && (
            <button
              type="button"
              onClick={() => setActiveTab("voting")}
              className="btn"
              style={{
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: "600",
                borderRadius: "100px",
                backgroundColor: activeTab === "voting" ? "var(--primary)" : "transparent",
                color: activeTab === "voting" ? "white" : "var(--text-main)",
                border: activeTab === "voting" ? "1px solid var(--primary)" : "1px solid var(--border-color)"
              }}
            >
              🗳️ Polling Suara
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab("mediashare")}
            className="btn"
            style={{
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: "600",
              borderRadius: "100px",
              backgroundColor: activeTab === "mediashare" ? "var(--primary)" : "transparent",
              color: activeTab === "mediashare" ? "white" : "var(--text-main)",
              border: activeTab === "mediashare" ? "1px solid var(--primary)" : "1px solid var(--border-color)"
            }}
          >
            🎥 Media Share
          </button>

          {widgetsData?.soundboardSounds?.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("soundboard")}
              className="btn"
              style={{
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: "600",
                borderRadius: "100px",
                backgroundColor: activeTab === "soundboard" ? "var(--primary)" : "transparent",
                color: activeTab === "soundboard" ? "white" : "var(--text-main)",
                border: activeTab === "soundboard" ? "1px solid var(--primary)" : "1px solid var(--border-color)"
              }}
            >
              🔊 Soundboard
            </button>
          )}
        </div>

        {/* Tab Panels */}
        {activeTab === "voting" && widgetsData?.votingPoll?.isActive && (
          <div className="form-group" style={{ marginBottom: 0, padding: "16px", background: "#fdfbfa", border: "1px solid var(--border-color)", borderRadius: "var(--border-radius-md)" }}>
            <label className="form-label" style={{ fontWeight: "700" }}>Pilihan Polling: "{widgetsData.votingPoll.title}"</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
              {widgetsData.votingPoll.options.map((opt: any) => (
                <label key={opt.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px", border: "1px solid var(--border-color)", borderRadius: "8px", background: "white", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="votingOption"
                    value={opt.id}
                    checked={votingOptionId === opt.id.toString()}
                    onChange={() => setVotingOptionId(opt.id.toString())}
                    style={{ accentColor: "var(--primary)" }}
                    required={activeTab === "voting"}
                  />
                  <span style={{ fontSize: "14px", fontWeight: "600" }}>{opt.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {activeTab === "mediashare" && (
          <div className="form-group" style={{ marginBottom: 0, padding: "16px", background: "#fdfbfa", border: "1px solid var(--border-color)", borderRadius: "var(--border-radius-md)", display: "flex", flexDirection: "column", gap: "12px" }}>
            <label className="form-label" style={{ fontWeight: "700" }}>Kirim YouTube Video Share</label>
            <input
              type="text"
              placeholder="Paste link YouTube (contoh: https://www.youtube.com/watch?v=dQw4w9WgXcQ)"
              value={youtubeUrl}
              onChange={(e) => {
                const val = e.target.value;
                setYoutubeUrl(val);
                const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                const match = val.match(regExp);
                const vidId = (match && match[2].length === 11) ? match[2] : null;
                if (vidId) {
                  setYoutubeVidId(vidId);
                  setYoutubeTitle("YouTube Video");
                } else {
                  setYoutubeVidId("");
                }
              }}
              className="input-field"
              required={activeTab === "mediashare"}
            />
            {youtubeVidId && (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", border: "1px solid var(--border-color)", padding: "10px", borderRadius: "8px", background: "white" }}>
                <img
                  src={`https://img.youtube.com/vi/${youtubeVidId}/mqdefault.jpg`}
                  alt="YouTube Preview"
                  style={{ width: "90px", height: "60px", objectFit: "cover", borderRadius: "6px" }}
                />
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "700", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", width: "180px" }}>Preview Terdeteksi</div>
                  <input
                    type="text"
                    placeholder="Judul Video"
                    value={youtubeTitle}
                    onChange={(e) => setYoutubeTitle(e.target.value)}
                    className="input-field"
                    style={{ fontSize: "12px", padding: "4px 8px", marginTop: "4px", height: "auto" }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "soundboard" && widgetsData?.soundboardSounds?.length > 0 && (
          <div className="form-group" style={{ marginBottom: 0, padding: "16px", background: "#fdfbfa", border: "1px solid var(--border-color)", borderRadius: "var(--border-radius-md)" }}>
            <label className="form-label" style={{ fontWeight: "700" }}>Pilih Efek Suara Soundboard</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "10px" }}>
              {widgetsData.soundboardSounds.map((sound: any) => (
                <button
                  key={sound.id}
                  type="button"
                  onClick={() => {
                    setSoundboardSoundId(sound.id.toString());
                    if ((parseFloat(amount) || 0) < sound.price) {
                      setAmount(sound.price.toString());
                    }
                  }}
                  className="btn"
                  style={{
                    padding: "10px",
                    border: soundboardSoundId === sound.id.toString() ? "2px solid var(--primary)" : "1px solid var(--border-color)",
                    borderRadius: "8px",
                    background: soundboardSoundId === sound.id.toString() ? "var(--primary-light)" : "white",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    textAlign: "left"
                  }}
                >
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-main)" }}>{sound.name}</span>
                  <span style={{ fontSize: "11px", color: "var(--primary-hover)", fontWeight: "600", marginTop: "2px" }}>
                    Min: Rp {sound.price.toLocaleString("id-ID")}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message input */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Pesan Dukungan (Teks Tampil di Live Alert & Dibaca TTS)</label>
          <textarea
            rows={3}
            placeholder="Tulis pesan penyemangat untuk kreator..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="input-field"
          />
        </div>

        {/* Tipping Amount Input */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Jumlah Tip (Rp)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input-field"
            style={{ fontSize: "18px", fontWeight: "700" }}
            min={1000}
            required
          />
          
          {/* Quick values toggles */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" }}>
            {quickAmountsList.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setAmount(val)}
                className="btn btn-secondary"
                style={{ padding: "6px 12px", fontSize: "12px", borderRadius: "100px" }}
              >
                Rp {parseInt(val).toLocaleString("id-ID")}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Channels Grid */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Metode Pembayaran</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setPaymentType("qris")}
              className="btn"
              style={{
                flexDirection: "column",
                padding: "16px",
                background: paymentType === "qris" ? "var(--primary-light)" : "white",
                color: paymentType === "qris" ? "var(--primary-hover)" : "var(--text-main)",
                border: paymentType === "qris" ? "2px solid var(--primary)" : "2px solid var(--border-color)",
                borderRadius: "var(--border-radius-md)"
              }}
            >
              <QrCode size={24} />
              <span style={{ fontSize: "12px", fontWeight: "700", marginTop: "4px" }}>QRIS</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentType("gopay")}
              className="btn"
              style={{
                flexDirection: "column",
                padding: "16px",
                background: paymentType === "gopay" ? "var(--primary-light)" : "white",
                color: paymentType === "gopay" ? "var(--primary-hover)" : "var(--text-main)",
                border: paymentType === "gopay" ? "2px solid var(--primary)" : "2px solid var(--border-color)",
                borderRadius: "var(--border-radius-md)"
              }}
            >
              <Sparkles size={24} />
              <span style={{ fontSize: "12px", fontWeight: "700", marginTop: "4px" }}>GoPay</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentType("credit_card")}
              className="btn"
              style={{
                flexDirection: "column",
                padding: "16px",
                background: paymentType === "credit_card" ? "var(--primary-light)" : "white",
                color: paymentType === "credit_card" ? "var(--primary-hover)" : "var(--text-main)",
                border: paymentType === "credit_card" ? "2px solid var(--primary)" : "2px solid var(--border-color)",
                borderRadius: "var(--border-radius-md)"
              }}
            >
              <CreditCard size={24} />
              <span style={{ fontSize: "12px", fontWeight: "700", marginTop: "4px" }}>Kartu Kredit</span>
            </button>
          </div>
        </div>

        {/* Credit Card Details Sub-form */}
        {paymentType === "credit_card" && (
          <div className="pop-animation" style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            border: "1px solid var(--border-color)",
            padding: "16px",
            borderRadius: "var(--border-radius-md)",
            background: "#fcfcfa"
          }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: "12px" }}>Nomor Kartu Kredit</label>
              <input
                type="text"
                placeholder="4811 1111 1111 1114 (Uji Coba Sandbox)"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value.replace(/\s+/g, ""))}
                className="input-field"
                required
              />
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: "12px" }}>Bulan Exp</label>
                <input
                  type="text"
                  placeholder="MM"
                  value={cardExpMonth}
                  onChange={(e) => setCardExpMonth(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: "12px" }}>Tahun Exp</label>
                <input
                  type="text"
                  placeholder="YYYY"
                  value={cardExpYear}
                  onChange={(e) => setCardExpYear(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: "12px" }}>CVV</label>
                <input
                  type="password"
                  placeholder="123"
                  value={cardCVV}
                  onChange={(e) => setCardCVV(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Billing Calculations display panel */}
        <div style={{
          borderTop: "1px solid var(--border-color)",
          paddingTop: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          fontSize: "14px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-muted)" }}>Nominal Dukungan:</span>
            <span>Rp {(parseFloat(amount) || 0).toLocaleString("id-ID")}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-muted)" }}>Biaya Layanan & Platform:</span>
            <span>
              Rp {(fees.serviceFee + fees.platformFee).toLocaleString("id-ID")}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-muted)" }}>Pajak (PPN 11%):</span>
            <span>Rp {fees.vatFee.toLocaleString("id-ID")}</span>
          </div>

          <div style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: "700",
            fontSize: "16px",
            borderTop: "2px solid var(--border-color)",
            paddingTop: "10px",
            marginTop: "6px"
          }}>
            <span>Total Pembayaran:</span>
            <span style={{ color: "var(--primary-hover)" }}>
              Rp {fees.totalAmount.toLocaleString("id-ID")}
            </span>
          </div>

          {creator.settings?.feeCoverage === "CREATOR" ? (
            <div style={{ fontSize: "11px", color: "var(--success)", fontWeight: "500", marginTop: "4px" }}>
              * Biaya transaksi ditanggung oleh kreator (pembayaran supporter pas sesuai jumlah dukungan).
            </div>
          ) : (
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
              * Biaya transaksi ditanggung oleh pendukung (ditambahkan ke total pembayaran).
            </div>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
          style={{ width: "100%", padding: "14px 0", fontSize: "16px", display: "flex", justifyContent: "center", gap: "8px" }}
        >
          {loading ? (
            <>
              <RefreshCw className="spin" size={18} style={{ animation: "spin 1.5s linear infinite" }} />
              Memproses Pembayaran...
            </>
          ) : (
            "Kirim Dukungan"
          )}
        </button>
      </form>
    </div>
  );
}
