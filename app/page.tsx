"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LOCATIONS } from "@/lib/locations";

export default function LandingPage() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = location && phone.length === 10 && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = phone.replace(/\D/g, "");

    if (!location) {
      setError("Please select a location");
      return;
    }
    if (cleaned.length < 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleaned }),
      });

      if (res.ok) {
        const data = await res.json();
        const params = new URLSearchParams({
          name: data.name,
          skill: data.skillLevel || "",
          id: data.uniqueId || "",
          phone: cleaned,
          loc: location,
        });
        router.push(`/confirm?${params.toString()}`);
      } else {
        const params = new URLSearchParams({ phone: cleaned, loc: location });
        router.push(`/register?${params.toString()}`);
      }
    } catch {
      const params = new URLSearchParams({ phone: cleaned, loc: location });
      router.push(`/register?${params.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter flex flex-col items-center text-center min-h-[85dvh] justify-center gap-8">
      {/* Logo */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z"
              fill="#0f0f1a"
              stroke="#0f0f1a"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold tracking-tight">STELLARIN</h1>
      </div>

      {/* Copy */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold leading-tight">
          Quick check-in
        </h2>
        <p className="text-[var(--text-secondary)] text-sm">
          Takes 10 seconds
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full space-y-5 text-left">
        {/* Location picker */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Location
          </label>
          <select
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setError("");
            }}
            className={`select-field ${location ? "" : "is-placeholder"}`}
          >
            <option value="" disabled>
              Where are you playing today?
            </option>
            {LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Phone Number
          </label>
          <div className="flex gap-2 items-stretch">
            <div className="input-field !w-auto !px-3 flex items-center justify-center text-[var(--text-secondary)] shrink-0">
              +91
            </div>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                setError("");
              }}
              className="input-field min-w-0 flex-1"
            />
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={!canSubmit}
          className="btn-primary flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="spinner" />
              Checking...
            </>
          ) : (
            "Start Check-In"
          )}
        </button>
      </form>
    </div>
  );
}
