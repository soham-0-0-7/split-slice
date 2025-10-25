"use client";
import React, { useState, useRef, useEffect } from "react";
import { useUser } from "@/context/UserContext";

type SelectMembersProps = {
  onChange: (members: string[]) => void;
  options?: { userid: number; username: string }[];
};

export default function SelectMembers({
  onChange,
  options,
}: SelectMembersProps) {
  const { friendlist } = useUser();
  const [inputValue, setInputValue] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sourceUsernames: string[] = options
    ? options.map((o) => o.username)
    : (friendlist?.map(String) as string[] | undefined) || [];

  const filteredFriends = sourceUsernames.filter(
    (f) =>
      f.toLowerCase().includes(inputValue.toLowerCase()) &&
      !selectedMembers.includes(f)
  );

  const addMember = (member: string) => {
    const trimmed = member.trim();
    if (!trimmed || selectedMembers.includes(trimmed)) return;
    const newList = [...selectedMembers, trimmed];
    setSelectedMembers(newList);
    onChange(newList);
    setInputValue("");
    setShowDropdown(false);
  };

  const removeMember = (member: string) => {
    const newList = selectedMembers.filter((m) => m !== member);
    setSelectedMembers(newList);
    onChange(newList);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addMember(inputValue);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Members
      </label>

      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Enter or select usernames"
          value={inputValue}
          onFocus={() => setShowDropdown(true)} // ✅ ensure dropdown shows instantly
          onClick={() => setShowDropdown(true)} // ✅ show dropdown on any click
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowDropdown(true);
          }}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          onClick={() => addMember(inputValue)}
          className="px-4 py-2 text-sm bg-gray-900 text-white"
        >
          Add
        </button>
      </div>

      {/* ✅ Dropdown instantly appears and copies selected value */}
      {showDropdown && (
        <ul className="absolute z-10 mt-1 w-full border border-gray-300 bg-black rounded shadow max-h-40 overflow-y-auto">
          {filteredFriends.length > 0 ? (
            filteredFriends.map((friend: string) => (
              <li
                key={friend}
                onMouseDown={(e) => {
                  e.preventDefault(); // prevents blur
                  // copy selected value into input field (user can then press Add)
                  setInputValue(friend);
                  // keep dropdown briefly so user sees the selection
                  setShowDropdown(true);
                  setTimeout(() => setShowDropdown(false), 120);
                }}
                className="px-3 py-2 text-sm text-white hover:bg-gray-700 cursor-pointer"
              >
                {friend}
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-sm text-gray-500 italic">
              No matches found
            </li>
          )}
        </ul>
      )}

      {selectedMembers.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {selectedMembers.map((m) => (
            <span
              key={m}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full flex items-center gap-1"
            >
              {m}
              <button
                type="button"
                onClick={() => removeMember(m)}
                className="text-blue-500 hover:text-blue-700"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
