"use client";

import React, { createContext, useState, useContext } from "react";

export type UserContextType = {
  token: string | null;
  setToken: (t: string | null) => void;
  friendlist: number[];
  setFriendlist: (f: number[]) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem("token") : null
  );
  const [friendlist, setFriendlist] = useState<number[]>([]);

  // keep localStorage token in sync
  const setTokenSync = (t: string | null) => {
    if (typeof window !== "undefined") {
      if (t) localStorage.setItem("token", t);
      else localStorage.removeItem("token");
    }
    setToken(t);
  };

  return (
    <UserContext.Provider
      value={{ token, setToken: setTokenSync, friendlist, setFriendlist }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
};

export default UserContext;
