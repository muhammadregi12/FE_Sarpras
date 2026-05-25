import { useState, useEffect, useCallback, useRef } from "react";
import { Outlet, Navigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Footer from "./Footer";
import {
  getProfile,
  logout,
  isSessionValid,
  touchSession,
  readCachedProfile,
  persistProfile,
  SESSION_TIMEOUT,
} from "../../services/authService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getSidebarInitialState = () => {
  try {
    const saved = localStorage.getItem("sidebarPreference");
    if (saved !== null) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return window.innerWidth >= 1024;
};

// ─── Komponen ────────────────────────────────────────────────────────────────

export default function MainLayout() {
  // Cek sesi sebelum render apapun — tidak ada side-effect di sini,
  // hanya membaca localStorage secara sinkron.
  if (!isSessionValid()) {
    try { localStorage.clear(); } catch { /* ignore */ }
    return <Navigate to="/login" replace />;
  }

  const [sidebarOpen, setSidebarOpen] = useState(getSidebarInitialState);
  const [profile, setProfile]         = useState(readCachedProfile);
  const [isLoading, setIsLoading]     = useState(() => !readCachedProfile());

  // Ref untuk debounce resize — stabil di semua render, tidak trigger re-render
  const resizeTimerRef = useRef(null);

  // ── Simpan preferensi sidebar ─────────────────────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem("sidebarPreference", JSON.stringify(sidebarOpen));
    } catch { /* ignore */ }
  }, [sidebarOpen]);

  // ── Ambil profil dari API ─────────────────────────────────────────────────
  useEffect(() => {
    let active = true;

    getProfile()
      .then((result) => {
        if (!active) return;
        setProfile(result);
        persistProfile(result);
        touchSession();
      })
      .catch(() => {
        // Token tidak valid / expired → logout
        logout();
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Validasi sesi saat app kembali aktif / dapat fokus ───────────────────
  useEffect(() => {
    const handleSessionCheck = () => {
      if (!isSessionValid()) {
        try { localStorage.clear(); } catch { /* ignore */ }
        window.location.replace("/login");
      } else {
        touchSession();
      }
    };

    const handleActivity = () => touchSession();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") handleSessionCheck();
    };

    window.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleSessionCheck);
    window.addEventListener("click", handleActivity);
    window.addEventListener("keydown", handleActivity);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleSessionCheck);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("keydown", handleActivity);
    };
  }, []); // tidak bergantung pada state, referensi stabil

  // ── Resize handler dengan debounce ────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => {
      clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(() => {
        setSidebarOpen(window.innerWidth >= 1024);
      }, 150);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimerRef.current);
    };
  }, []); // resizeTimerRef stabil, tidak perlu di deps

  // ── Sidebar callbacks — stabil antar render ───────────────────────────────
  const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), []);
  const closeSidebar  = useCallback(() => setSidebarOpen(false), []);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  // ── Render utama ──────────────────────────────────────────────────────────
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{
        fontFamily:
          "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: "#f5f6fa",
      }}
    >
      <Sidebar open={sidebarOpen} onClose={closeSidebar} profile={profile} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0 transition-all duration-300">
        <Header onToggleSidebar={toggleSidebar} profile={profile} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>

        <Footer />
      </div>

      <style>{`
        * { -webkit-tap-highlight-color: transparent; }

        ::-webkit-scrollbar        { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track  { background: transparent; }
        ::-webkit-scrollbar-thumb  {
          background: #cbd5e1;
          border-radius: 10px;
          transition: background 0.2s ease;
        }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        button, a {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  );
}