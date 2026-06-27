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
    <div className="mx-auto flex min-h-dvh w-full max-w-[460px] flex-col bg-[var(--bg-primary)]">
      {/* Hero — drop your photo in at public/hero.jpg.
          Falls back to the flow pattern on forest until you add it. */}
      <div
        className="relative min-h-[320px] flex-1 bg-[var(--bg-elevated)] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/hero.jpg), url(/flow-pattern.svg)" }}
      >
        {/* Logo sits on the image — dark/positive version for the bright sky */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/stellarin-logo-dark.svg"
          alt="Stellarin"
          className="absolute left-0 top-0 w-44 drop-shadow-[0_1px_8px_rgba(255,255,255,0.55)]"
        />
        {/* Gradient fade into the sheet below */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-[var(--bg-elevated)]" />
      </div>

      {/* Content sheet — hugs its content and sits at the bottom */}
      <div className="page-enter sheet relative z-10 -mt-6 flex shrink-0 flex-col gap-7 px-6 pb-12 pt-9">
        <h1 className="text-[2rem] font-bold leading-[1.1] tracking-tight text-[var(--text-primary)]">
          Meet. Play. <span className="accent-italic">Stay.</span>
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-left">
          {/* Location picker */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
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
            <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
              Phone Number
            </label>
            <div className="flex items-stretch gap-2">
              <div className="input-field !w-auto !px-3 flex shrink-0 items-center justify-center text-[var(--text-secondary)]">
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

          {error && <p className="text-sm text-red-500">{error}</p>}

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
    </div>
  );
}
