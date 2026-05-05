import { useState, useEffect, useCallback } from "react";
import { Outlet, Navigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Footer from "./Footer";
import { getProfile } from "../../services/authService";

const readCachedProfile = () => {
  try {
    const cachedProfile = localStorage.getItem("profileCache");
    return cachedProfile ? JSON.parse(cachedProfile) : null;
  } catch {
    return null;
  }
};

const persistProfile = (profile) => {
  try {
    if (profile) {
      localStorage.setItem("profileCache", JSON.stringify(profile));
    }
  } catch {
    // Ignore storage failures.
  }
};

export default function MainLayout() {
  const cachedProfile = readCachedProfile();

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // Cek dari localStorage preferensi user
    const saved = localStorage.getItem("sidebarPreference");
    if (saved !== null) return JSON.parse(saved);
    return window.innerWidth >= 1024;
  });
  
  const [profile, setProfile] = useState(cachedProfile);
  const [isLoading, setIsLoading] = useState(!cachedProfile);

  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;

  useEffect(() => {
    // Simpan preferensi sidebar ke localStorage
    localStorage.setItem("sidebarPreference", JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  useEffect(() => {
    let active = true;

    getProfile()
      .then((result) => {
        if (!active) return;
        setProfile(result);
        persistProfile(result);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Handle resize dengan debounce untuk performa
  useEffect(() => {
    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (window.innerWidth >= 1024) {
          setSidebarOpen(true);
        } else {
          setSidebarOpen(false);
        }
      }, 150);
    };
    
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  // Toggle sidebar dengan smooth transition
  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ 
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", 
        background: "#f5f6fa" 
      }}
    >
      <Sidebar
        open={sidebarOpen}
        onClose={closeSidebar}
        profile={profile}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0 transition-all duration-300">
        <Header
          onToggleSidebar={toggleSidebar}
          profile={profile}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>

        <Footer />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        * {
          -webkit-tap-highlight-color: transparent;
        }
        
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
          transition: background 0.2s ease;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: translateY(-8px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        /* Responsive padding adjustments */
        @media (max-width: 640px) {
          .p-4 {
            padding: 1rem;
          }
        }
        
        /* Smooth transitions for all interactive elements */
        button, a {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  );
}