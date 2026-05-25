import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { navItems } from "../../utils/navItems";
import { logout } from "../../services/authService";
import { getServerBaseUrl } from "../../services/serverUrl";
import { getDashboardSummary } from "../../services/dashboardService";

function Header({ onToggleSidebar, profile }) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [recentActivities, setRecentActivities] = useState([]);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const menuRef = useRef(null);
  const notificationRef = useRef(null);
  const location = useLocation();

  const formatActivityTime = useCallback((value) => {
    if (!value) return "Baru saja";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const loadRecentActivities = useCallback(async () => {
    setNotificationLoading(true);
    setNotificationError("");

    try {
      const result = await getDashboardSummary();
      setRecentActivities(result?.recentActivity ?? []);
    } catch {
      setNotificationError("Gagal memuat aktivitas terbaru");
    } finally {
      setNotificationLoading(false);
    }
  }, []);

  // Tutup menu saat klik di luar
  useEffect(() => {
    function handleOutsideClick(e) {
      const clickedProfileMenu = menuRef.current?.contains(e.target);
      const clickedNotificationMenu = notificationRef.current?.contains(e.target);

      if (!clickedProfileMenu) {
        setProfileMenuOpen(false);
      }

      if (!clickedNotificationMenu) {
        setNotificationMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Cari label halaman aktif dari navItems
  const currentLabel = useMemo(() => {
    const allItems = navItems.flatMap((group) =>
      group.items.flatMap((item) => [item, ...(item.children ?? [])])
    );
    return allItems.find((item) => item.to === location.pathname)?.label || "Halaman";
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header
      className="h-16 shrink-0 flex items-center justify-between px-6 lg:px-8 bg-white border-b z-10"
      style={{ borderColor: "#e9ecf0" }}
    >
      {/* Left: Toggle + Breadcrumb */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
          aria-label="Toggle Sidebar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 12h18M3 6h18M3 18h18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div>
          <h1 className="font-bold text-gray-800 text-sm lg:text-base leading-tight">
            {currentLabel}
          </h1>
          <p className="text-xs text-gray-400 hidden sm:block">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Right: Notif + Profile */}
      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={() => {
              setProfileMenuOpen(false);
              setNotificationMenuOpen((prev) => {
                const nextOpen = !prev;

                if (nextOpen && !recentActivities.length) {
                  void loadRecentActivities();
                }

                return nextOpen;
              });
            }}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
            aria-label="Aktivitas terbaru"
            aria-expanded={notificationMenuOpen}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M13.73 21a2 2 0 0 1-3.46 0"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
          </button>

          {notificationMenuOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in"
              style={{ border: "1px solid #e9ecf0", boxShadow: "0 12px 40px rgba(0,0,0,0.12)" }}
            >
              <div className="p-4 border-b" style={{ borderColor: "#f1f3f5" }}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-800">Aktivitas Terbaru</div>
                    <div className="text-xs text-gray-400">Diambil dari ringkasan dashboard</div>
                  </div>
                  <span className="text-[11px] px-2 py-1 rounded-full font-medium" style={{ background: "#eff6ff", color: "#3b82f6" }}>
                    Live
                  </span>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notificationLoading ? (
                  <div className="p-4 space-y-3">
                    <div className="h-14 rounded-xl bg-gray-100 animate-pulse" />
                    <div className="h-14 rounded-xl bg-gray-100 animate-pulse" />
                    <div className="h-14 rounded-xl bg-gray-100 animate-pulse" />
                  </div>
                ) : notificationError ? (
                  <div className="p-4 text-sm text-red-500">{notificationError}</div>
                ) : recentActivities.length ? (
                  <div className="p-2 space-y-1">
                    {recentActivities.slice(0, 8).map((activity, index) => (
                      <div
                        key={`${activity?.tanggal ?? "activity"}-${index}`}
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: index % 2 === 0 ? "#eff6ff" : "#ecfdf5" }}
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ background: index % 2 === 0 ? "#3b82f6" : "#10b981" }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-gray-700 truncate">
                            {activity?.nama || activity?.keterangan || "Aktivitas"}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5 truncate">
                            {activity?.keterangan || "Perubahan terbaru pada dashboard"}
                          </div>
                          <div className="text-[11px] text-gray-400 mt-1">
                            {formatActivityTime(activity?.tanggal)}
                          </div>
                        </div>
                        <span
                          className="text-[11px] px-2.5 py-1 rounded-full font-medium shrink-0 capitalize"
                          style={{ background: index % 2 === 0 ? "#eff6ff" : "#ecfdf5", color: index % 2 === 0 ? "#3b82f6" : "#10b981" }}
                        >
                          {activity?.status || "baru"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-sm text-gray-400">
                    Belum ada aktivitas terbaru.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
          >
            {profile?.image ? (
              <img
                src={profile.image.startsWith("http") ? profile.image : `${getServerBaseUrl()}/${profile.image}`}
                alt={profile.name}
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg, #3b82f6, #10b981)" }}
              >
                {profile?.name?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-gray-700 leading-tight">
                {profile?.name || "User"}
              </div>
              <div className="text-xs text-gray-400 capitalize">{profile?.role || "—"}</div>
            </div>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              className={`text-gray-400 transition-transform ${profileMenuOpen ? "rotate-180" : ""}`}
            >
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {profileMenuOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in"
              style={{ border: "1px solid #e9ecf0", boxShadow: "0 12px 40px rgba(0,0,0,0.12)" }}
            >
              <div className="p-4 border-b" style={{ borderColor: "#f1f3f5" }}>
                <div className="text-sm font-semibold text-gray-700">{profile?.name}</div>
                <div className="text-xs text-gray-400 truncate">{profile?.email}</div>
                <span
                  className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                  style={{ background: "#eff6ff", color: "#3b82f6" }}
                >
                  {profile?.role}
                </span>
              </div>

              <div className="py-1">
                <a
                  href="/profile"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  Profil Saya
                </a>
                <a
                  href="/update-password"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Update Password
                </a>
              </div>

              <div className="border-t" style={{ borderColor: "#f1f3f5" }}>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" />
                    <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" />
                    <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default memo(Header);