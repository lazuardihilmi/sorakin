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
  const [msSettings, setMsSettings] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"standard" | "voting" | "mediashare" | "soundboard">("standard");
  const [votingOptionId, setVotingOptionId] = useState<string>("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"youtube" | "tiktok" | "ig_reels" | "voice_note">("youtube");
  const [youtubeVidId, setYoutubeVidId] = useState("");
  const [mediaTitle, setMediaTitle] = useState("");
  const [soundboardSoundId, setSoundboardSoundId] = useState<string>("");

  useEffect(() => {
    const fetchWidgets = async () => {
      try {
        const [wRes, mRes] = await Promise.all([
          fetch(`/api/creator/widgets?username=${creator.username}`),
          fetch(`/api/creator/widgets/mediashare?username=${creator.username}`)
        ]);
        const wData = await wRes.json();
        if (wRes.ok) setWidgetsData(wData);
        const mData = await mRes.json();
        if (mRes.ok && mData.settings) setMsSettings(mData.settings);
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
    
    // VAT is disabled (no PPN)
    const vatFee = 0;
    const totalFee = serviceFee + platformFee;

    let totalAmount = amt;
    if (feeCoverage === "SUPPORTER") {
      totalAmount = amt + totalFee;
    }

    return {
      serviceFee: feeCoverage === "SUPPORTER" ? serviceFee : 0,
      platformFee: feeCoverage === "SUPPORTER" ? platformFee : 0,
      vatFee: 0,
      totalAmount: Math.round(totalAmount),
      isVAT: false
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
          mediashareTitle: activeTab === "mediashare" ? (mediaTitle || mediaType) : null,
          mediashareType: activeTab === "mediashare" ? mediaType : null,
          mediashareUrl: activeTab === "mediashare" ? mediaUrl : null,
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

        {/* ── Interactive Tipping Mode Tabs ── */}
        <div style={{
          display: "flex",
          gap: "6px",
          padding: "4px",
          background: "#f5f4f0",
          borderRadius: "12px",
          overflowX: "auto",
          flexShrink: 0
        }}>
          {([
            { key: "standard", label: "☕ Standar" },
            ...(widgetsData?.votingPoll?.isActive ? [{ key: "voting", label: "🗳️ Polling" }] : []),
            { key: "mediashare", label: "🎥 Media Share" },
            ...(widgetsData?.soundboardSounds?.length > 0 ? [{ key: "soundboard", label: "🔊 Sound" }] : []),
          ] as { key: string; label: string }[]).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key as any)}
              style={{
                flex: "1 1 auto",
                padding: "8px 14px",
                fontSize: "12px",
                fontWeight: "700",
                borderRadius: "9px",
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "background 0.15s, color 0.15s, box-shadow 0.15s",
                background: activeTab === t.key ? "white" : "transparent",
                color: activeTab === t.key ? "#1a1917" : "#9b9790",
                boxShadow: activeTab === t.key ? "0 1px 6px rgba(0,0,0,0.12)" : "none",
              }}
            >
              {t.label}
            </button>
          ))}
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

        {activeTab === "mediashare" && (() => {
          // Detect URL type
          const detectType = (url: string): "youtube" | "tiktok" | "ig_reels" | "voice_note" => {
            if (/youtu\.?be|youtube\.com/i.test(url)) return "youtube";
            if (/tiktok\.com/i.test(url)) return "tiktok";
            if (/instagram\.com\/reels?/i.test(url)) return "ig_reels";
            if (/\.(mp3|wav|ogg|m4a)/i.test(url)) return "voice_note";
            return "youtube";
          };

          const parseYoutubeId = (url: string) => {
            const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
            const match = url.match(regExp);
            return (match && match[2].length === 11) ? match[2] : null;
          };

          // Effective settings (defaults if creator hasn't set)
          const settings = msSettings || {
            isActive: true, enableYoutube: true, enableTiktok: false,
            enableIgReels: false, enableVoiceNote: false,
            maxVideoDuration: 300, pricePerSecond: 100, minVideoPrice: 10000,
            maxAudioDuration: 60, audioPricePerSecond: 200, minAudioPrice: 50000
          };

          const acceptedTypes = [
            settings.enableYoutube && { type: "youtube", label: "YT/Shorts", color: "#FF0000" },
            settings.enableTiktok && { type: "tiktok", label: "TikTok", color: "#010101" },
            settings.enableIgReels && { type: "ig_reels", label: "IG Reels", color: "#E1306C" },
            settings.enableVoiceNote && { type: "voice_note", label: "🎙️ Voice Note", color: "#6c63ff" },
          ].filter(Boolean) as { type: string; label: string; color: string }[];

          const isVoice = mediaType === "voice_note";
          const minPrice = isVoice ? settings.minAudioPrice : settings.minVideoPrice;
          const pricePerSec = isVoice ? settings.audioPricePerSecond : settings.pricePerSecond;

          // Calculate suggested min amount based on max duration
          const maxDur = isVoice ? settings.maxAudioDuration : settings.maxVideoDuration;
          const calcMin = Math.max(minPrice, maxDur * pricePerSec);

          if (!settings.isActive) {
            return (
              <div className="form-group" style={{ marginBottom: 0, padding: "16px", background: "#fff5f5", border: "1px solid #fecaca", borderRadius: "var(--border-radius-md)", textAlign: "center", color: "var(--error)", fontSize: "13px", fontWeight: "600" }}>
                Fitur Media Share sedang dinonaktifkan oleh kreator.
              </div>
            );
          }

          return (
            <div className="form-group" style={{ marginBottom: 0, padding: "16px", background: "#fdfbfa", border: "1px solid var(--border-color)", borderRadius: "var(--border-radius-md)", display: "flex", flexDirection: "column", gap: "14px" }}>
              <label className="form-label" style={{ fontWeight: "700" }}>🎥 Kirim Media Share</label>

              {/* Accepted type badges */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {acceptedTypes.map((t) => (
                  <span key={t.type} style={{ background: t.color, color: "white", fontSize: "10px", fontWeight: "800", padding: "3px 10px", borderRadius: "100px" }}>{t.label}</span>
                ))}
                <span style={{ fontSize: "11px", color: "var(--text-muted)", alignSelf: "center", marginLeft: "4px" }}>Tipe yang diterima kreator</span>
              </div>

              {/* Pricing info */}
              <div style={{ background: "white", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "10px 14px", fontSize: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                {(settings.enableYoutube || settings.enableTiktok || settings.enableIgReels) && (
                  <>
                    <span style={{ color: "var(--text-muted)" }}>📹 Maks. durasi video</span>
                    <span style={{ fontWeight: "700" }}>{settings.maxVideoDuration} detik</span>
                    <span style={{ color: "var(--text-muted)" }}>Harga per detik</span>
                    <span style={{ fontWeight: "700" }}>Rp {settings.pricePerSecond.toLocaleString("id-ID")}</span>
                    <span style={{ color: "var(--text-muted)" }}>Min. tip video</span>
                    <span style={{ fontWeight: "700", color: "var(--primary-hover)" }}>Rp {settings.minVideoPrice.toLocaleString("id-ID")}</span>
                  </>
                )}
                {settings.enableVoiceNote && (
                  <>
                    <span style={{ color: "var(--text-muted)" }}>🎙️ Maks. durasi suara</span>
                    <span style={{ fontWeight: "700" }}>{settings.maxAudioDuration} detik</span>
                    <span style={{ color: "var(--text-muted)" }}>Min. tip suara</span>
                    <span style={{ fontWeight: "700", color: "var(--primary-hover)" }}>Rp {settings.minAudioPrice.toLocaleString("id-ID")}</span>
                  </>
                )}
              </div>

              {/* URL Input */}
              <input
                type="text"
                placeholder={
                  acceptedTypes.length === 1 && acceptedTypes[0].type === "youtube"
                    ? "Paste link YouTube (contoh: https://youtu.be/dQw4w9WgXcQ)"
                    : "Paste link YouTube, TikTok, atau IG Reels di sini..."
                }
                value={mediaUrl}
                onChange={(e) => {
                  const val = e.target.value;
                  setMediaUrl(val);
                  const detectedType = detectType(val);
                  setMediaType(detectedType);
                  if (detectedType === "youtube") {
                    const vidId = parseYoutubeId(val);
                    setYoutubeVidId(vidId || "");
                    setMediaTitle(vidId ? "YouTube Video" : "");
                  } else {
                    setYoutubeVidId("");
                    setMediaTitle("");
                  }
                  // Auto-suggest minimum amount
                  const isVid = detectedType !== "voice_note";
                  const minP = isVid ? settings.minVideoPrice : settings.minAudioPrice;
                  if ((parseFloat(amount) || 0) < minP) setAmount(minP.toString());
                }}
                className="input-field"
                required={activeTab === "mediashare"}
              />

              {/* Type detection badge */}
              {mediaUrl && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
                  <span style={{
                    background: mediaType === "youtube" ? "#FF0000" : mediaType === "tiktok" ? "#010101" : mediaType === "ig_reels" ? "#E1306C" : "#6c63ff",
                    color: "white", fontSize: "10px", fontWeight: "800", padding: "2px 8px", borderRadius: "100px"
                  }}>
                    {mediaType === "youtube" ? "YT" : mediaType === "tiktok" ? "TikTok" : mediaType === "ig_reels" ? "IG Reels" : "🎙️ Voice"}
                  </span>
                  <span style={{ color: "var(--text-muted)" }}>Terdeteksi · Tip minimum untuk ini: <strong style={{ color: "var(--primary-hover)" }}>Rp {minPrice.toLocaleString("id-ID")}</strong></span>
                </div>
              )}

              {/* YouTube thumbnail preview */}
              {youtubeVidId && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px", border: "1px solid var(--border-color)", padding: "10px", borderRadius: "8px", background: "white" }}>
                  <img
                    src={`https://img.youtube.com/vi/${youtubeVidId}/mqdefault.jpg`}
                    alt="YouTube Preview"
                    style={{ width: "90px", height: "60px", objectFit: "cover", borderRadius: "6px" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Preview Terdeteksi</div>
                    <input
                      type="text"
                      placeholder="Judul video (opsional)"
                      value={mediaTitle}
                      onChange={(e) => setMediaTitle(e.target.value)}
                      className="input-field"
                      style={{ fontSize: "12px", padding: "4px 8px", height: "auto" }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })()}

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

        {/* ── Tipping Amount ── */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontWeight: "700", fontSize: "13px" }}>Jumlah Dukungan</label>

          {/* Quick amount pills */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
            {quickAmountsList.map((val) => {
              const isSelected = amount === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  style={{
                    padding: "8px 18px",
                    fontSize: "13px",
                    fontWeight: "700",
                    borderRadius: "100px",
                    border: isSelected ? "2px solid var(--primary)" : "1.5px solid #e8e5e0",
                    background: isSelected ? "var(--primary)" : "white",
                    color: isSelected ? "white" : "#4b4844",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  Rp {parseInt(val).toLocaleString("id-ID")}
                </button>
              );
            })}
          </div>

          {/* Manual amount input with Rp prefix */}
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <span style={{
              position: "absolute",
              left: "16px",
              fontSize: "16px",
              fontWeight: "800",
              color: "#9b9790",
              userSelect: "none"
            }}>Rp</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field"
              style={{ fontSize: "18px", fontWeight: "800", paddingLeft: "48px", height: "52px" }}
              min={1000}
              required
            />
          </div>
        </div>

        {/* ── Payment Method ── */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontWeight: "700", fontSize: "13px" }}>Metode Pembayaran</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
            {[
              { key: "qris", label: "QRIS", sublabel: "GoPay · OVO · Dana", emoji: "📱", color: "#e84142" },
              { key: "gopay", label: "GoPay", sublabel: "Redirect GoPay", emoji: "💚", color: "#00AED6" },
              { key: "credit_card", label: "Kartu", sublabel: "Kredit / Debit", emoji: "💳", color: "#4f46e5" },
            ].map((pm) => {
              const isActive = paymentType === pm.key;
              return (
                <button
                  key={pm.key}
                  type="button"
                  onClick={() => setPaymentType(pm.key as any)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "14px 8px",
                    borderRadius: "12px",
                    border: isActive ? `2px solid ${pm.color}` : "1.5px solid #e8e5e0",
                    background: isActive ? `${pm.color}12` : "white",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{ fontSize: "24px", lineHeight: 1 }}>{pm.emoji}</span>
                  <span style={{ fontSize: "12px", fontWeight: "800", color: isActive ? pm.color : "#1a1917" }}>{pm.label}</span>
                  <span style={{ fontSize: "10px", color: "#9b9790", fontWeight: "500", textAlign: "center" }}>{pm.sublabel}</span>
                </button>
              );
            })}
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

        {/* ── Submit Button ── */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "16px 0",
            fontSize: "16px",
            fontWeight: "800",
            borderRadius: "12px",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            background: loading
              ? "#d4d0ca"
              : "linear-gradient(135deg, var(--primary) 0%, #e8a020 100%)",
            color: loading ? "#9b9790" : "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            boxShadow: loading ? "none" : "0 4px 16px rgba(245, 166, 35, 0.4)",
            transition: "all 0.2s",
            letterSpacing: "0.2px",
          }}
        >
          {loading ? (
            <>
              <RefreshCw size={18} style={{ animation: "spin 1.5s linear infinite" }} />
              Memproses Pembayaran...
            </>
          ) : (
            <>
              <span style={{ fontSize: "20px" }}>☕</span>
              Dukung {creator.name}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
