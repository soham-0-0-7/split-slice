"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GlitchText from "./GlitchText";

export default function Header() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
    } catch (e) {
      // ignore
    }
    // redirect to login
    router.push("/login");
  };

  // Close the mobile panel on navigation
  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, []);

  return (
    <header className="w-full bg-black border-b border-gray-800 sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4">
        {/* Desktop header */}
        <div className="hidden md:flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/groups"
              onClick={() => setOpen(false)}
              className="relative text-sm font-medium text-gray-300 hover:text-white transition-all duration-300 ease-out group"
            >
              <span className="relative z-10">Groups</span>
              <span className="absolute bottom-0 left-0 w-0 h-px bg-white transition-all duration-300 ease-out group-hover:w-full"></span>
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="relative text-sm font-medium text-gray-300 hover:text-white transition-all duration-300 ease-out group"
            >
              <span className="relative z-10">Dashboard</span>
              <span className="absolute bottom-0 left-0 w-0 h-px bg-white transition-all duration-300 ease-out group-hover:w-full"></span>
            </Link>
            <Link
              href="/friends"
              onClick={() => setOpen(false)}
              className="relative text-sm font-medium text-gray-300 hover:text-white transition-all duration-300 ease-out group"
            >
              <span className="relative z-10">Friends</span>
              <span className="absolute bottom-0 left-0 w-0 h-px bg-white transition-all duration-300 ease-out group-hover:w-full"></span>
            </Link>
          </div>

          <div className="flex items-center gap-6">
            <GlitchText
              speed={1}
              enableShadows={false}
              enableOnHover={true}
              className="header-size"
            >
              Split Slice
            </GlitchText>
            <button
              onClick={handleLogout}
              className="px-4 py-1.5 text-sm font-medium text-gray-300 border border-gray-700 hover:border-white hover:text-white bg-transparent transition-all duration-300 ease-out hover:shadow-lg hover:shadow-white/10"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile header */}
        <div className="flex md:hidden items-center justify-between">
          <GlitchText
            speed={1}
            enableShadows={false}
            enableOnHover={true}
            className="header-size"
          >
            Split Slice
          </GlitchText>
          <button
            aria-label="Toggle menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
            className="p-2 border border-gray-700 text-gray-300 hover:text-white hover:border-white transition-colors"
          >
            {/* Hamburger / Close icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              {open ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile panel */}
        {open && (
          <div
            id="mobile-menu"
            className="md:hidden mt-4 border border-gray-800 bg-[#0b0b0b] divide-y divide-gray-800"
          >
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm text-gray-300 hover:bg-[#111] hover:text-white"
            >
              Dashboard
            </Link>
            <Link
              href="/groups"
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm text-gray-300 hover:bg-[#111] hover:text-white"
            >
              Groups
            </Link>
            <Link
              href="/friends"
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm text-gray-300 hover:bg-[#111] hover:text-white"
            >
              Friends
            </Link>
            <button
              onClick={() => {
                setOpen(false);
                handleLogout();
              }}
              className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-[#111] hover:text-white"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
