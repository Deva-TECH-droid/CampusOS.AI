import { PanelLeftClose, PanelLeftOpen, Bell } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import GlobalSearch from "./GlobalSearch";
import { useState,useEffect } from "react";

const pageTitles = {
  "/": "Dashboard",
  "/community/clubs": "Clubs",
  "/community/events": "Events",
  "/academics": "Academics",
  "/discussions": "Discussions",
  "/academics/competitive": "Academics",
  "/career": "Career & Opportunities",
  "/career/opportunities": "Career & Opportunities",
  "/career/interviews": "Career & Opportunities",
  "/admin": "Admin Panel",
  "/admin/drives": "Admin Panel",
  "/admin/moderation": "Admin Panel",
  "/admin/notices": "Admin Panel",
  "/profile": "Profile",
};

const Navbar = ({ onToggleSidebar, sidebarOpen }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const title = pageTitles[pathname] ?? "EventSphere";

  const avatarUrl = user?.profilePicture;

  // ✅ 2. Use a local state key tied to the image URL to reset tracking flags on login/updates
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0 z-30">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          {sidebarOpen ? (
            <PanelLeftClose size={18} />
          ) : (
            <PanelLeftOpen size={18} />
          )}
        </button>
        <h1 className="text-sm font-semibold text-gray-900 tracking-tight">
          {title}
        </h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <GlobalSearch />

        {user ? (
          <>
            <button className="relative p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
              <Bell size={17} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>

            {/* PROFILE IMAGE / INITIAL BUTTON */}
            <button
              onClick={() => navigate("/profile")}
              className="w-8 h-8 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center hover:bg-gray-700 transition-colors overflow-hidden border border-gray-100"
            >
              {/* ✅ 3. Only render image if a valid URL exists and it hasn't failed */}
              {avatarUrl && !imgError ? (
                <img
                  src={avatarUrl}
                  alt={`${user.firstName}'s profile`}
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)} 
                />
              ) : (
                user.firstName?.charAt(0).toUpperCase() || "?"
              )}
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-1.5 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-black transition"
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
};

export default Navbar;
