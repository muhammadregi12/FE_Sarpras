import { memo, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  MdSpaceDashboard,
  MdFolder,
  MdInventory2,
  MdSell,
  MdBusiness,
  MdStorefront,
  MdLocalShipping,
  MdBarChart,
  MdQrCodeScanner,
  MdGridView,
  MdExpandMore,
  MdClose,
} from "react-icons/md";

export const navItems = [
  {
    group: "Utama",
    items: [{ to: "/dashboard", label: "Dashboard", icon: MdSpaceDashboard }],
  },
  {
    group: "Manajemen",
    items: [
      {
        label: "Master",
        icon: MdFolder,
        children: [
          { to: "/barang",   label: "Barang",   icon: MdInventory2 },
          { to: "/kategori", label: "Kategori", icon: MdSell },
          { to: "/ruangan",  label: "Ruangan",  icon: MdBusiness },
          { to: "/cabang",   label: "Cabang",   icon: MdStorefront },
          { to: "/supplier", label: "Supplier", icon: MdLocalShipping },
        ],
      },
    ],
  },
  {
    group: "Laporan",
    items: [
      { to: "/laporan", label: "Laporan", icon: MdBarChart },
      { to: "/scan",    label: "Scan QR", icon: MdQrCodeScanner },
    ],
  },
];

const masterGroup = navItems.find((group) => group.group === "Manajemen");
const masterChildren = masterGroup?.items.find((item) => item.label === "Master")?.children ?? [];

// ─── Styles
const STYLES = `
  @keyframes logoGlow {
    0%,100% { box-shadow: 0 0 10px rgba(59,130,246,0.45); }
    50%      { box-shadow: 0 0 22px rgba(16,185,129,0.65); }
  }
  @keyframes dotPulse {
    0%,100% { opacity:1; transform:scale(1); }
    50%      { opacity:.5; transform:scale(.7); }
  }
  @keyframes overlayIn {
    from { opacity:0; }
    to   { opacity:1; }
  }
  @keyframes shimmer {
    0%   { transform:translateX(-100%); }
    100% { transform:translateX(220%);  }
  }

  .sb-overlay { animation: overlayIn 0.28s ease both; }

  .sb-panel {
    transition:
      width     0.36s cubic-bezier(0.4, 0, 0.2, 1),
      transform 0.36s cubic-bezier(0.4, 0, 0.2, 1),
      box-shadow 0.36s ease;
    will-change: width, transform;
  }

  .sb-label {
    transition: opacity 0.2s ease, transform 0.2s ease;
    white-space: nowrap;
    overflow: hidden;
    flex-shrink: 0;
  }
  .sb-open   .sb-label { opacity:1; transform:translateX(0);    pointer-events:auto; }
  .sb-closed .sb-label { opacity:0; transform:translateX(-8px); pointer-events:none; }

  .sb-group-label {
    transition: opacity 0.18s ease;
    white-space: nowrap;
    overflow: hidden;
  }
  .sb-open   .sb-group-label { opacity:1; }
  .sb-closed .sb-group-label { opacity:0; }

  .sb-chevron {
    flex-shrink: 0;
    transition: transform 0.28s ease, opacity 0.18s ease;
  }
  .sb-chevron.rotated    { transform: rotate(-90deg); }
  .sb-open   .sb-chevron { opacity:1; }
  .sb-closed .sb-chevron { opacity:0; pointer-events:none; }

  .sb-children {
    display: grid;
    transition: grid-template-rows 0.28s ease, opacity 0.22s ease;
  }
  .sb-children.expanded  { grid-template-rows:1fr; opacity:1; }
  .sb-children.collapsed { grid-template-rows:0fr; opacity:0; }
  .sb-children > div { overflow:hidden; }

  .sb-dot { animation: dotPulse 2.2s ease-in-out infinite; }
  .sb-logo-glow { animation: logoGlow 3s ease-in-out infinite; }

  .sb-link { position:relative; overflow:hidden; }
  .sb-link::after {
    content:'';
    position:absolute; inset:0;
    width:55%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent);
    transform:translateX(-100%);
    pointer-events:none;
  }
  .sb-link:hover::after { animation:shimmer 0.55s ease; }

  .sb-scroll::-webkit-scrollbar       { width:3px; }
  .sb-scroll::-webkit-scrollbar-track { background:transparent; }
  .sb-scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:99px; }
  .sb-scroll::-webkit-scrollbar-thumb:hover { background:rgba(255,255,255,0.2); }

  /* ── Floating dropdown ── */
  @keyframes dropdownIn {
    from { opacity:0; transform:translateX(-6px) scale(0.97); }
    to   { opacity:1; transform:translateX(0)    scale(1); }
  }
  .sb-dropdown {
    position: fixed;
    background: linear-gradient(135deg, rgba(13,21,38,0.98) 0%, rgba(9,15,30,0.98) 100%);
    border: 1px solid rgba(59,130,246,0.25);
    border-radius: 14px;
    box-shadow: 0 24px 56px rgba(0,0,0,0.65), 0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06);
    backdrop-filter: blur(12px);
    min-width: 200px;
    z-index: 9999;
    animation: dropdownIn 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    overflow: hidden;
  }
  .sb-dropdown-header {
    padding: 10px 14px 8px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .sb-dropdown-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 14px;
    color: rgba(255,255,255,0.65);
    text-decoration: none;
    font-size: 13px;
    transition: background 0.15s ease, color 0.15s ease, padding-left 0.15s ease;
    border-left: 2px solid transparent;
    position: relative;
  }
  .sb-dropdown-item:hover {
    background: rgba(59,130,246,0.12);
    color: rgba(255,255,255,0.9);
    border-left-color: rgba(59,130,246,0.6);
    padding-left: 16px;
  }
  .sb-dropdown-item.active {
    background: rgba(59,130,246,0.2);
    color: #fff;
    border-left-color: #10b981;
    padding-left: 16px;
  }
  .sb-dropdown-item.active .sb-dd-dot {
    display: block;
  }
  .sb-dd-dot {
    display: none;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #10b981;
    margin-left: auto;
    flex-shrink: 0;
    box-shadow: 0 0 6px rgba(16,185,129,0.6);
    animation: dotPulse 2.2s ease-in-out infinite;
  }
`;

function injectStyles() {
  if (typeof document !== "undefined" && !document.getElementById("sb-styles")) {
    const el = document.createElement("style");
    el.id = "sb-styles";
    el.textContent = STYLES;
    document.head.appendChild(el);
  }
}

const activeStyle = {
  background: "linear-gradient(135deg,rgba(59,130,246,0.22) 0%,rgba(16,185,129,0.13) 100%)",
  border: "1px solid rgba(59,130,246,0.28)",
  boxShadow: "0 2px 14px rgba(59,130,246,0.18)",
};
const idleStyle = { background: "transparent", border: "1px solid transparent" };

// ─── Component ────────────────────────────────────────────────
function Sidebar({ open, onClose, profile }) {
  injectStyles();

  const location  = useLocation();
  const [masterOpen, setMasterOpen] = useState(true);
  const [showMasterDropdown, setShowMasterDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  // Reactive isDesktop — updates on resize
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 1024
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const masterRef        = useRef(null);
  const dropdownRef      = useRef(null);

  const closedWidth = isDesktop ? 72 : 0;

  const isMasterActive = useMemo(
    () => masterChildren.some((child) => location.pathname.startsWith(child.to)),
    [location.pathname]
  );

  // ── Compute dropdown position ──────────────────────────────
  const calcDropdownPos = useCallback(() => {
    if (!masterRef.current) return;
    const rect = masterRef.current.getBoundingClientRect();
    const dropH = dropdownRef.current?.offsetHeight ?? 280;
    const margin = 8;

    // Left = collapsed sidebar width (72px) + small gap
    // Don't use rect.right — the inner div is 256px wide, rect.right would be 256+
    const left = 72 + margin;

    // Vertically align with the trigger button; clamp to viewport
    let top = rect.top;
    const maxTop = window.innerHeight - dropH - margin;
    top = Math.max(margin, Math.min(top, maxTop));

    setDropdownPos({ top, left });
  }, []);

  // ── Close on route change ──────────────────────────────────
  useEffect(() => {
    if (window.innerWidth < 1024) onClose?.();
    setShowMasterDropdown(false);
  }, [location.pathname]);

  // ── Body scroll lock on mobile ─────────────────────────────
  useEffect(() => {
    document.body.style.overflow =
      open && !isDesktop ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open, isDesktop]);

  // ── Hide dropdown when sidebar opens or screen goes mobile ─
  useEffect(() => {
    if (open || !isDesktop) setShowMasterDropdown(false);
  }, [open, isDesktop]);

  // ── Click-outside closes dropdown ─────────────────────────
  useEffect(() => {
    if (!showMasterDropdown) return;
    const handler = (e) => {
      if (
        masterRef.current?.contains(e.target) ||
        dropdownRef.current?.contains(e.target)
      ) return;
      setShowMasterDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMasterDropdown]);

  // ── Keep position synced while dropdown is open ────────────
  useEffect(() => {
    if (!showMasterDropdown) return;
    // Initial calc after paint so we have real height
    const raf = requestAnimationFrame(calcDropdownPos);
    window.addEventListener("resize",  calcDropdownPos);
    window.addEventListener("scroll",  calcDropdownPos, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize",  calcDropdownPos);
      window.removeEventListener("scroll",  calcDropdownPos, true);
    };
  }, [showMasterDropdown, calcDropdownPos]);

  // ── Toggle handler for the Master button ──────────────────
  const handleMasterClick = () => {
    if (open) {
      // Sidebar expanded → use in-place accordion
      setMasterOpen((v) => !v);
    } else if (isDesktop) {
      // Sidebar collapsed on desktop → floating dropdown
      if (!showMasterDropdown) {
        calcDropdownPos();
        setShowMasterDropdown(true);
      } else {
        setShowMasterDropdown(false);
      }
    }
  };

  return (
    <>
      {/* ── Mobile Overlay ── */}
      {open && (
        <div
          className="sb-overlay fixed inset-0 z-20 lg:hidden"
          style={{ background: "rgba(2,6,23,0.72)", backdropFilter: "blur(5px)" }}
          onClick={onClose}
        />
      )}

      {/* ── Floating Dropdown Portal ──
           Rendered outside the sidebar <aside> so it's never clipped */}
      {showMasterDropdown && !open && isDesktop && (
        <div
          ref={dropdownRef}
          className="sb-dropdown"
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
        >
          {/* Header */}
          <div className="sb-dropdown-header">
            <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Master
            </span>
          </div>

          {/* Items */}
          {masterChildren.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setShowMasterDropdown(false)}
                className={({ isActive }) =>
                  `sb-dropdown-item${isActive ? " active" : ""}`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={15}
                      style={{ flexShrink: 0, color: isActive ? "#60a5fa" : "rgba(255,255,255,0.4)" }}
                    />
                    <span>{label}</span>
                    <span className="sb-dd-dot" />
                  </>
                )}
              </NavLink>
            ))}
        </div>
      )}

      {/* ── Sidebar Panel ── */}
      <aside
        className={[
          "sb-panel fixed lg:static h-full flex flex-col z-30",
          open ? "sb-open" : "sb-closed",
        ].join(" ")}
        style={{
          width: open ? 256 : closedWidth,
          transform: open || isDesktop ? "translateX(0)" : "translateX(-100%)",
          background: "linear-gradient(180deg,#0d1526 0%,#090f1e 55%,#060c18 100%)",
          boxShadow: open
            ? "6px 0 36px rgba(0,0,0,0.55),inset -1px 0 0 rgba(255,255,255,0.04)"
            : "none",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        {/* Fixed-width inner so text doesn't wrap while panel resizes */}
        <div className="flex flex-col h-full" style={{ width: 256 }}>

          {/* ── Logo ── */}
          <div
            className="flex items-center gap-3 h-16 px-4 flex-shrink-0 relative"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{
                background:
                  "linear-gradient(90deg,transparent,#3b82f6 40%,#10b981 60%,transparent)",
              }}
            />

            <div
              className="sb-logo-glow w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#3b82f6,#10b981)" }}
            >
              <MdGridView size={18} className="text-white" />
            </div>

            <div className="sb-label flex-1 min-w-0">
              <span
                className="font-black text-white text-sm tracking-[0.16em] block"
                style={{ fontVariant: "small-caps" }}
              >
                SARPRAS
              </span>
              <span className="text-[10px] text-blue-400/55 tracking-widest block -mt-0.5">
                Asset Management
              </span>
            </div>

            <button
              onClick={onClose}
              className="sb-label lg:hidden w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
            >
              <MdClose size={15} />
            </button>
          </div>

          {/* ── Navigation ── */}
          <nav className="sb-scroll flex-1 overflow-y-auto py-4 px-3">
            {navItems.map((group) => (
              <div key={group.group} className="mb-6">
                <p
                  className="sb-group-label text-[10px] font-bold uppercase tracking-[0.2em] px-3 mb-2"
                  style={{ color: "rgba(255,255,255,0.24)" }}
                >
                  {group.group}
                </p>

                {group.items.map(({ to, label, icon: Icon, children }) => {
                  /* ── Accordion / Dropdown trigger ── */
                  if (children?.length) {
                    return (
                      <div key={label} className="mb-1">
                        <button
                          ref={masterRef}
                          type="button"
                          onClick={handleMasterClick}
                          className="sb-link w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-200"
                          style={isMasterActive ? activeStyle : idleStyle}
                          title={!open ? label : undefined}
                          aria-expanded={open ? masterOpen : showMasterDropdown}
                        >
                          <Icon
                            size={18}
                            className={`flex-shrink-0 ${isMasterActive ? "text-white" : "text-gray-400"}`}
                          />
                          <span
                            className={`sb-label text-sm font-semibold flex-1 text-left ${
                              isMasterActive ? "text-white" : "text-gray-400"
                            }`}
                          >
                            {label}
                          </span>
                          {/* Chevron — only visible when sidebar open */}
                          <MdExpandMore
                            size={16}
                            className={`sb-chevron ${
                              isMasterActive ? "text-white" : "text-gray-500"
                            } ${masterOpen ? "" : "rotated"}`}
                          />
                        </button>

                        {/* ── In-place accordion (sidebar open) ── */}
                        {open && (
                          <div
                            className={`sb-children ${
                              masterOpen ? "expanded" : "collapsed"
                            }`}
                          >
                            <div>
                              <div
                                className="mt-1 ml-4 pl-3 pb-1"
                                style={{
                                  borderLeft: "1px solid rgba(59,130,246,0.18)",
                                }}
                              >
                                {children.map(({ to: cTo, label: cLabel, icon: CIcon }) => (
                                  <NavLink
                                    key={cTo}
                                    to={cTo}
                                    className="sb-link flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5 transition-colors duration-200"
                                    style={({ isActive }) =>
                                      isActive ? activeStyle : idleStyle
                                    }
                                    onMouseEnter={(e) => {
                                      if (
                                        e.currentTarget.getAttribute("aria-current") !== "page"
                                      )
                                        e.currentTarget.style.background =
                                          "rgba(255,255,255,0.04)";
                                    }}
                                    onMouseLeave={(e) => {
                                      if (
                                        e.currentTarget.getAttribute("aria-current") !== "page"
                                      )
                                        e.currentTarget.style.background = "transparent";
                                    }}
                                  >
                                    {({ isActive }) => (
                                      <>
                                        <CIcon
                                          size={15}
                                          className={`flex-shrink-0 ${
                                            isActive ? "text-blue-300" : "text-gray-500"
                                          }`}
                                        />
                                        <span
                                          className={`sb-label text-sm ${
                                            isActive
                                              ? "text-white font-semibold"
                                              : "text-gray-400"
                                          }`}
                                        >
                                          {cLabel}
                                        </span>
                                        {isActive && (
                                          <span className="sb-dot ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                                        )}
                                      </>
                                    )}
                                  </NavLink>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  /* ── Regular link ── */
                  return (
                    <NavLink
                      key={to}
                      to={to}
                      title={!open ? label : undefined}
                      className="sb-link flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-colors duration-200"
                      style={({ isActive }) => (isActive ? activeStyle : idleStyle)}
                      onMouseEnter={(e) => {
                        if (e.currentTarget.getAttribute("aria-current") !== "page")
                          e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                      }}
                      onMouseLeave={(e) => {
                        if (e.currentTarget.getAttribute("aria-current") !== "page")
                          e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            size={18}
                            className={`flex-shrink-0 ${
                              isActive ? "text-white" : "text-gray-400"
                            }`}
                          />
                          <span
                            className={`sb-label text-sm font-semibold flex-1 ${
                              isActive ? "text-white" : "text-gray-400"
                            }`}
                          >
                            {label}
                          </span>
                          {isActive && (
                            <span className="sb-dot ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* ── Profile ── */}
          {profile && (
            <div
              className="flex-shrink-0 p-3"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors duration-200"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.borderColor = "rgba(59,130,246,0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg,#3b82f6,#10b981)",
                    boxShadow: "0 2px 8px rgba(59,130,246,0.4)",
                  }}
                >
                  {profile.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="sb-label min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate">
                    {profile.name}
                  </div>
                  <div className="text-[10px] text-blue-400/60 capitalize tracking-wide">
                    {profile.role}
                  </div>
                </div>
                <span
                  className="flex-shrink-0 w-2 h-2 rounded-full"
                  style={{
                    background: "#10b981",
                    boxShadow: "0 0 6px rgba(16,185,129,0.6)",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default memo(Sidebar);