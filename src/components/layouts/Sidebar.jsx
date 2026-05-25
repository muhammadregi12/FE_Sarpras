import { memo, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  MdGridView,
  MdExpandMore,
  MdClose,
} from "react-icons/md";
import { navItems } from "../../utils/navItems";
import "../../assets/style/sidebar.css";

const masterGroup = navItems.find((group) => group.group === "Manajemen");
const masterChildren =
  masterGroup?.items.find((item) => item.label === "Master")?.children ?? [];

const trackingGroup = navItems.find((group) => group.group === "Tracking");
const trackingChildren =
  trackingGroup?.items.find((item) => item.label === "Barang")?.children ?? [];

const reportGroup = navItems.find((group) => group.group === "Laporan");
const reportChildren =
  reportGroup?.items.find((item) => item.label === "Laporan")?.children ?? [];

const activeStyle = {
  background: "linear-gradient(135deg,rgba(59,130,246,0.22) 0%,rgba(16,185,129,0.13) 100%)",
  border: "1px solid rgba(59,130,246,0.28)",
  boxShadow: "0 2px 14px rgba(59,130,246,0.18)",
};
const idleStyle = { background: "transparent", border: "1px solid transparent" };

// ─── Component ────────────────────────────────────────────────
function Sidebar({ open, onClose, profile }) {
  // styles are imported from ../../assets/style/sidebar.css

  const location = useLocation();
  const [masterOpen, setMasterOpen] = useState(false);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [showMasterDropdown, setShowMasterDropdown] = useState(false);
  const [showTrackingDropdown, setShowTrackingDropdown] = useState(false);
  const [showReportDropdown, setShowReportDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [dropdownType, setDropdownType] = useState("master");

  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 1024
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const masterRef = useRef(null);
  const trackingRef = useRef(null);
  const reportRef = useRef(null);
  const dropdownRef = useRef(null);

  const closedWidth = isDesktop ? 72 : 0;

  const isPathActive = useCallback((targetPath) => {
    return (
      location.pathname === targetPath ||
      location.pathname.startsWith(`${targetPath}/`)
    );
  }, [location.pathname]);

  const isMasterActive = useMemo(
    () => masterChildren.some((child) => isPathActive(child.to)),
    [isPathActive]
  );

  const isTrackingActive = useMemo(
    () => trackingChildren.some((child) => isPathActive(child.to)),
    [isPathActive]
  );

  const isReportActive = useMemo(
    () => reportChildren.some((child) => isPathActive(child.to)),
    [isPathActive]
  );

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      if (isMasterActive) {
        setMasterOpen(true);
      }

      if (isTrackingActive) {
        setTrackingOpen(true);
      }

      if (isReportActive) {
        setReportOpen(true);
      }
    });

    return () => cancelAnimationFrame(raf);
  }, [isMasterActive, isTrackingActive, isReportActive]);

  const calcDropdownPos = useCallback((refEl) => {
    if (!refEl) return;
    const rect = refEl.getBoundingClientRect();
    const dropH = dropdownRef.current?.offsetHeight ?? 280;
    const margin = 8;

    const left = 72 + margin;

    let top = rect.top;
    const maxTop = window.innerHeight - dropH - margin;
    top = Math.max(margin, Math.min(top, maxTop));

    setDropdownPos({ top, left });
  }, []);

  useEffect(() => {
    if (window.innerWidth < 1024) onClose?.();
    const raf = requestAnimationFrame(() => {
      setShowMasterDropdown(false);
      setShowTrackingDropdown(false);
      setShowReportDropdown(false);
    });
    return () => cancelAnimationFrame(raf);
  }, [location.pathname, onClose]);

  useEffect(() => {
    document.body.style.overflow = open && !isDesktop ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, isDesktop]);

  useEffect(() => {
    if (open || !isDesktop) {
      const raf = requestAnimationFrame(() => {
        setShowMasterDropdown(false);
        setShowTrackingDropdown(false);
        setShowReportDropdown(false);
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [open, isDesktop]);

  useEffect(() => {
    const activeDropdown = showMasterDropdown
      ? "master"
      : showTrackingDropdown
        ? "tracking"
        : showReportDropdown
          ? "report"
        : null;

    if (!activeDropdown) return;

    const handler = (e) => {
      if (
        masterRef.current?.contains(e.target) ||
        trackingRef.current?.contains(e.target) ||
        reportRef.current?.contains(e.target) ||
        dropdownRef.current?.contains(e.target)
      ) {
        return;
      }
      setShowMasterDropdown(false);
      setShowTrackingDropdown(false);
      setShowReportDropdown(false);
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMasterDropdown, showTrackingDropdown, showReportDropdown]);

  useEffect(() => {
    const activeDropdown = showMasterDropdown
      ? "master"
      : showTrackingDropdown
        ? "tracking"
        : showReportDropdown
          ? "report"
        : null;

    if (!activeDropdown) return;

    const refEl =
      activeDropdown === "master"
        ? masterRef.current
        : activeDropdown === "tracking"
          ? trackingRef.current
          : reportRef.current;

    const raf = requestAnimationFrame(() => calcDropdownPos(refEl));
    window.addEventListener("resize", () => calcDropdownPos(refEl));
    window.addEventListener("scroll", () => calcDropdownPos(refEl), true);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", () => calcDropdownPos(refEl));
      window.removeEventListener("scroll", () => calcDropdownPos(refEl), true);
    };
  }, [showMasterDropdown, showTrackingDropdown, showReportDropdown, calcDropdownPos]);

  const handleParentClick = (type) => {
    if (type === "master") {
      if (open) {
        if (isMasterActive) {
          setMasterOpen(true);
          return;
        }

        setMasterOpen((v) => !v);
      } else if (isDesktop) {
        if (!showMasterDropdown) {
          setDropdownType("master");
          calcDropdownPos(masterRef.current);
          setShowMasterDropdown(true);
          setShowTrackingDropdown(false);
        } else {
          setShowMasterDropdown(false);
        }
      }
      return;
    }

    if (type === "tracking") {
      if (open) {
        if (isTrackingActive) {
          setTrackingOpen(true);
          return;
        }

        setTrackingOpen((v) => !v);
      } else if (isDesktop) {
        if (!showTrackingDropdown) {
          setDropdownType("tracking");
          calcDropdownPos(trackingRef.current);
          setShowTrackingDropdown(true);
          setShowMasterDropdown(false);
        } else {
          setShowTrackingDropdown(false);
        }
      }
      return;
    }

    if (type === "report") {
      if (open) {
        if (isReportActive) {
          setReportOpen(true);
          return;
        }

        setReportOpen((v) => !v);
      } else if (isDesktop) {
        if (!showReportDropdown) {
          setDropdownType("report");
          calcDropdownPos(reportRef.current);
          setShowReportDropdown(true);
          setShowMasterDropdown(false);
          setShowTrackingDropdown(false);
        } else {
          setShowReportDropdown(false);
        }
      }
    }
  };

  const activeDropdownItems =
    dropdownType === "master"
      ? masterChildren
      : dropdownType === "tracking"
        ? trackingChildren
        : reportChildren;

  const activeDropdownLabel =
    dropdownType === "master"
      ? "Master"
      : dropdownType === "tracking"
        ? "Barang"
        : "Laporan";

  return (
    <>
      {open && (
        <div
          className="sb-overlay fixed inset-0 z-20 lg:hidden"
          style={{ background: "rgba(2,6,23,0.72)", backdropFilter: "blur(5px)" }}
          onClick={onClose}
        />
      )}

      {(showMasterDropdown || showTrackingDropdown || showReportDropdown) && !open && isDesktop && (
        <div
          ref={dropdownRef}
          className="sb-dropdown"
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
        >
          <div className="sb-dropdown-header">
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "rgba(255,255,255,0.3)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              {activeDropdownLabel}
            </span>
          </div>

          {activeDropdownItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => {
                setShowMasterDropdown(false);
                setShowTrackingDropdown(false);
                setShowReportDropdown(false);
              }}
              className={({ isActive }) =>
                `sb-dropdown-item${isActive ? " active" : ""}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={15}
                    style={{
                      flexShrink: 0,
                      color: isActive ? "#60a5fa" : "rgba(255,255,255,0.4)",
                    }}
                  />
                  <span>{label}</span>
                  <span className="sb-dd-dot" />
                </>
              )}
            </NavLink>
          ))}
        </div>
      )}

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
        <div className="flex flex-col h-full" style={{ width: 256 }}>
          <div
            className="flex items-center gap-3 h-16 px-4 shrink-0 relative"
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
              className="sb-logo-glow w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
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
              className="sb-label lg:hidden w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            >
              <MdClose size={15} />
            </button>
          </div>

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
                  if (children?.length) {
                    const isMasterItem = label === "Master";
                    const isTrackingItem = label === "Barang";
                    const isReportItem = label === "Laporan";
                    const isActive =
                      (isMasterItem && isMasterActive) ||
                      (isTrackingItem && isTrackingActive) ||
                      (isReportItem && isReportActive);
                    const isExpanded =
                      (isMasterItem && masterOpen) ||
                      (isTrackingItem && trackingOpen) ||
                      (isReportItem && reportOpen);

                    return (
                      <div key={label} className="mb-1">
                        <button
                          ref={isMasterItem ? masterRef : isTrackingItem ? trackingRef : reportRef}
                          type="button"
                          onClick={() =>
                            handleParentClick(
                              isMasterItem ? "master" : isTrackingItem ? "tracking" : "report"
                            )
                          }
                          className="sb-link w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-200"
                          style={isActive ? activeStyle : idleStyle}
                          title={!open ? label : undefined}
                          aria-expanded={
                            open
                              ? isExpanded
                              : showMasterDropdown || showTrackingDropdown || showReportDropdown
                          }
                        >
                          <Icon
                            size={18}
                            className={`shrink-0 ${isActive ? "text-white" : "text-gray-400"}`}
                          />
                          <span
                            className={`sb-label text-sm font-semibold flex-1 text-left ${
                              isActive ? "text-white" : "text-gray-400"
                            }`}
                          >
                            {label}
                          </span>
                          <MdExpandMore
                            size={16}
                            className={`sb-chevron ${
                              isActive ? "text-white" : "text-gray-500"
                            } ${isExpanded ? "" : "rotated"}`}
                          />
                        </button>

                        {open && (
                          <div
                            className={`sb-children ${
                              isExpanded ? "expanded" : "collapsed"
                            }`}
                          >
                            <div>
                              <div
                                className="mt-1 ml-4 pl-3 pb-1"
                                style={{
                                  borderLeft: "1px solid rgba(59,130,246,0.18)",
                                }}
                              >
                                {children.map(
                                  ({ to: cTo, label: cLabel, icon: CIcon }) => (
                                    <NavLink
                                      key={cTo}
                                      to={cTo}
                                      className="sb-link flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5 transition-colors duration-200"
                                      style={({ isActive }) =>
                                        isActive ? activeStyle : idleStyle
                                      }
                                      onMouseEnter={(e) => {
                                        if (
                                          e.currentTarget.getAttribute("aria-current") !==
                                          "page"
                                        ) {
                                          e.currentTarget.style.background =
                                            "rgba(255,255,255,0.04)";
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        if (
                                          e.currentTarget.getAttribute("aria-current") !==
                                          "page"
                                        ) {
                                          e.currentTarget.style.background =
                                            "transparent";
                                        }
                                      }}
                                    >
                                      {({ isActive }) => (
                                        <>
                                          <CIcon
                                            size={15}
                                            className={`shrink-0 ${
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
                                            <span className="sb-dot ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                          )}
                                        </>
                                      )}
                                    </NavLink>
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

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
                            className={`shrink-0 ${
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
                            <span className="sb-dot ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>

          {profile && (
            <div
              className="shrink-0 p-3"
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
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0"
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
                  className="shrink-0 w-2 h-2 rounded-full"
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
