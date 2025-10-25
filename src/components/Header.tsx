"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GlitchText from "./GlitchText";

export default function Header() {
  const router = useRouter();

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
    } catch (e) {
      // ignore
    }
    // redirect to login
    router.push("/login");
  };

  return (
    <header className="w-full bg-black border-b border-gray-800 sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href="/groups"
            className="relative text-sm font-medium text-gray-300 hover:text-white transition-all duration-300 ease-out group"
          >
            <span className="relative z-10">Groups</span>
            <span className="absolute bottom-0 left-0 w-0 h-px bg-white transition-all duration-300 ease-out group-hover:w-full"></span>
          </Link>
          <Link
            href="/dashboard"
            className="relative text-sm font-medium text-gray-300 hover:text-white transition-all duration-300 ease-out group"
          >
            <span className="relative z-10">Dashboard</span>
            <span className="absolute bottom-0 left-0 w-0 h-px bg-white transition-all duration-300 ease-out group-hover:w-full"></span>
          </Link>
          <Link
            href="/friends"
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
    </header>
  );
}
