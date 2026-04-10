"use client";

import { useEffect, useState, useRef } from "react";
import { Avatar } from "@/components/ui/avatar";
import { getUser, logout } from "@/lib/auth";
import { Menu, Bell, ChevronDown, LogOut } from "lucide-react";

export default function Topbar({ title, onToggleSidebar }) {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const [notifications, setNotifications] = useState([
    { id: 1, text: "You have a new update available.", time: "1 hour ago", read: false },
    { id: 2, text: "A new patient has registered.", time: "3 hours ago", read: false },
    { id: 3, text: "System maintenance scheduled.", time: "5 hours ago", read: false },
  ]);

  const hasUnread = notifications.some(n => !n.read);

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleDeleteNotification = (e, id) => {
    e.preventDefault();
    setNotifications(notifications.filter(n => n.id !== id));
  };

  useEffect(() => {
    setMounted(true);
    setUser(getUser());
  }, []);

  useEffect(() => {
    if (title) document.title = `${title} — MediTrack`;
  }, [title]);

  useEffect(() => {
    // Close dropdowns if clicked outside
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
         setUserMenuOpen(false);
         setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
  };

  const displayName = mounted && user ? [user.first_name, user.last_name].filter(Boolean).join(" ") || user.full_name || "User" : "User";

  return (
    <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-md px-4 sm:px-6 shadow-sm shadow-black/5">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <button
          type="button"
          className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl"
          onClick={onToggleSidebar}
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-4 sm:gap-6 pl-4" ref={menuRef}>
        {/* Notifications */}
        <div className="relative">
          <button 
            className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
            onClick={() => {
               setNotificationsOpen(!notificationsOpen);
               setUserMenuOpen(false);
            }}
          >
            <Bell className="w-5 h-5" />
            {hasUnread && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
          </button>
          
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fadeIn">
              <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                {hasUnread && (
                  <button onClick={handleMarkAllRead} className="text-xs text-blue-600 font-medium hover:underline">Mark read</button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500">You have no notifications.</div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      onContextMenu={(e) => handleDeleteNotification(e, n.id)}
                      className={`p-4 border-b border-gray-50 cursor-pointer transition-colors ${n.read ? "bg-white hover:bg-gray-50" : "bg-blue-50/30 hover:bg-blue-50/50"}`}
                      title="Right-click to delete"
                    >
                      <p className={`text-sm ${n.read ? "text-gray-600" : "text-gray-900 font-medium"}`}>{n.text}</p>
                      <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-[1px] bg-gray-200 hidden sm:block"></div>

        {/* User */}
        <div className="relative">
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => {
               setUserMenuOpen(!userMenuOpen);
               setNotificationsOpen(false);
            }}
          >
            <Avatar size="sm" name={displayName} />
            <div className="hidden sm:flex items-center gap-2">
               <span className="text-sm font-bold text-gray-800">{displayName}</span>
               <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
            </div>
          </div>

          {userMenuOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fadeIn pb-1 pt-1">
              <div className="px-4 py-3 border-b border-gray-50 mb-1 bg-gray-50/50">
                <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
                <p className="text-xs font-medium text-gray-500 truncate">{user?.email || "No email"}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 font-bold hover:bg-red-50 hover:text-red-700 transition-colors flex items-center gap-2.5"
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
