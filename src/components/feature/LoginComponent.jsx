import { memo, useState } from "react";
import {
  MdGridView,
  MdSecurity,
  MdErrorOutline,
  MdEmail,
  MdLock,
  MdVisibility,
  MdVisibilityOff,
  MdAutorenew,
  MdArrowForward,
} from "react-icons/md";
import "../../assets/style/login.css";

const FEATURES = [
  "Inventaris real-time",
  "Peminjaman otomatis",
  "Laporan lengkap",
];

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  size: Math.random() * 3 + 1,
  x: Math.random() * 100,
  y: Math.random() * 100,
  dur: Math.random() * 12 + 8,
  delay: Math.random() * -15,
}));

/* ─── AnimatedBackground ─── */
export const AnimatedBackground = memo(() => (
  <div className="bg-wrapper">
    <div className="blob blob-blue" />
    <div className="blob blob-teal" />
    <div className="blob blob-purple" />

    <svg className="grid-svg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="dots" width="32" height="32" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="rgba(147,197,253,0.25)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots)" />
    </svg>

    {PARTICLES.map((p) => (
      <span
        key={p.id}
        className="particle"
        style={{
          width: p.size,
          height: p.size,
          left: `${p.x}%`,
          top: `${p.y}%`,
          animationDuration: `${p.dur}s`,
          animationDelay: `${p.delay}s`,
        }}
      />
    ))}
  </div>
));

/* ─── LogoBadge ─── */
export const LogoBadge = memo(({ size = "md" }) => {
  const s = size === "sm" ? 36 : 44;
  const iconSize = size === "sm" ? 18 : 22;
  return (
    <div className="logo-badge">
      <div className="logo-icon" style={{ width: s, height: s }}>
        <MdGridView style={{ width: iconSize, height: iconSize, color: "#fff" }} />
      </div>
      <span className={`logo-text logo-text-${size}`}>SARPRAS</span>
    </div>
  );
});

/* ─── StatItem ─── */
export const StatItem = memo(({ value, label }) => (
  <div className="stat-item">
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
  </div>
));

/* ─── DecorativePanel ─── */
export const DecorativePanel = memo(() => (
  <div className="left-panel">
    <AnimatedBackground />

    <div className="left-content">
      <div className="left-top">
        <LogoBadge />
      </div>

      <div className="hero-block">
        <div className="live-badge">
          <span className="live-dot" />
          Sistem Manajemen Aktif
        </div>

        <h1 className="hero-title">
          Kelola Sarana<br />
          <span className="hero-gradient">& Prasarana</span><br />
          dengan Mudah
        </h1>

        <p className="hero-desc">
          Platform terpadu untuk manajemen inventaris, peminjaman barang,
          dan laporan fasilitas secara real-time.
        </p>

        <div className="feature-row">
          {FEATURES.map((f) => (
            <span key={f} className="feature-pill">
              {f}
            </span>
          ))}
        </div>

      </div>

      <div className="security-card">
        <div className="security-icon">
          <MdSecurity style={{ width: 18, height: 18, color: "#fff" }} />
        </div>
        <div>
          <div className="security-title">Data Aman & Terenkripsi</div>
          <div className="security-sub">Sistem keamanan berlapis untuk data Anda</div>
        </div>
      </div>
    </div>
  </div>
));

/* ─── InputField ─── */
export const InputField = memo(
  ({ label, icon: Icon, type, value, onChange, placeholder, required, action }) => {
    const [focused, setFocused] = useState(false);

    return (
      <div className="input-group">
        <label className="input-label">{label}</label>
        <div className="input-wrapper">
          <Icon className={`input-icon ${focused ? "focused" : ""}`} />
          <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            className="input-field"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              className="input-action"
            >
              {action.icon}
            </button>
          )}
        </div>
      </div>
    );
  }
);

/* ─── ErrorAlert ─── */
export const ErrorAlert = memo(({ message }) => {
  if (!message) return null;
  return (
    <div className="error-box">
      <MdErrorOutline style={{ width: 16, height: 16, flexShrink: 0, marginTop: 1 }} />
      <span>{message}</span>
    </div>
  );
});

/* ─── FormPanel ─── */
export const FormPanel = memo(({ formState, onSubmit }) => {
  const {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    loading,
    error,
    handleSubmit,
  } = formState;

  return (
    <div className="right-panel">
      <div className="form-card">
        <div className="mobile-logo">
          <LogoBadge size="sm" />
        </div>

        <div className="form-heading">
          <h2 className="form-title">Selamat Datang</h2>
          <p className="form-sub">Masuk untuk mengelola sarana dan prasarana Anda</p>
        </div>

        <ErrorAlert message={error} />

        <form
          onSubmit={(e) => handleSubmit(e, onSubmit)}
          noValidate
        >
          <InputField
            label="Alamat Email"
            icon={MdEmail}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            required
          />

          <InputField
            label="Password"
            icon={MdLock}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            action={{
              onClick: () => setShowPassword((v) => !v),
              icon: showPassword ? (
                <MdVisibilityOff style={{ width: 17, height: 17 }} />
              ) : (
                <MdVisibility style={{ width: 17, height: 17 }} />
              ),
            }}
          />

          <button
            type="submit"
            disabled={loading}
            className="submit-btn"
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <>
                <MdAutorenew className="spin-icon" />
                Memproses...
              </>
            ) : (
              <>
                Masuk ke Sistem
                <MdArrowForward style={{ width: 17, height: 17, marginLeft: 6 }} />
              </>
            )}
          </button>
        </form>

        <p className="copyright">
          © {new Date().getFullYear()} Sistem Manajemen Sarana &amp; Prasarana
        </p>
      </div>
    </div>
  );
});