"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isValidLocation, LOCATIONS } from "@/lib/locations";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") || "";
  const locParam = searchParams.get("loc") || "";
  const location = isValidLocation(locParam) ? locParam : "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    skillLevel: "",
    preferredLocation: "",
    preferredSport: "",
    instagram: "",
    whatsappOptIn: true,
    imageConsent: true,
  });

  if (!location) {
    if (typeof window !== "undefined") {
      router.replace("/");
    }
    return null;
  }

  const update = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.fullName.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!form.skillLevel) {
      setError("Please select your skill level");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, location, ...form }),
      });

      let uniqueId = "";
      let checkinTime = new Date().toISOString();
      try {
        const result = await res.json();
        uniqueId = result.uniqueId || "";
        checkinTime = result.checkinTime || checkinTime;
      } catch {
        /* ignore */
      }

      const params = new URLSearchParams({
        name: form.fullName.trim(),
        returning: "0",
        time: checkinTime,
        id: uniqueId,
        loc: location,
      });
      router.push(`/success?${params.toString()}`);
    } catch {
      const params = new URLSearchParams({
        name: form.fullName.trim(),
        returning: "0",
        time: new Date().toISOString(),
        loc: location,
      });
      router.push(`/success?${params.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  const SKILLS = ["Beginner", "Intermediate", "Advanced", "Pro"];
  const SPORTS = ["Pickleball", "Tennis", "Badminton", "Padel"];

  return (
    <div className="page-enter mx-auto flex min-h-dvh w-full max-w-[400px] flex-col gap-7 px-5 py-8">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold">Tell us about you</h1>
        <p className="text-[var(--text-secondary)] text-sm">
          Checking in at <span className="text-[var(--accent)] font-medium">{location}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-2">Full Name</label>
          <input
            type="text"
            placeholder="Your name"
            value={form.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            className="input-field"
            autoFocus
          />
        </div>

        {/* Skill — pills */}
        <div>
          <label className="block text-sm font-medium mb-2">Skill Level</label>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-5 px-5">
            {SKILLS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  update("skillLevel", s);
                  setError("");
                }}
                className={`pill ${form.skillLevel === s ? "pill-active" : ""}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Optional fields — grouped in a box */}
        <fieldset className="min-w-0 w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 pb-5 pt-3 space-y-6">
          <legend className="px-2 text-xs text-[var(--text-muted)] uppercase tracking-wider">
            Optional
          </legend>

          {/* Preferred Sport — pills */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Preferred Sport
            </label>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4">
              {SPORTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() =>
                    update("preferredSport", form.preferredSport === s ? "" : s)
                  }
                  className={`pill ${form.preferredSport === s ? "pill-active" : ""}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Location */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Preferred Location
            </label>
            <select
              value={form.preferredLocation}
              onChange={(e) => update("preferredLocation", e.target.value)}
              className={`select-field ${form.preferredLocation ? "" : "is-placeholder"}`}
            >
              <option value="">Select preferred location</option>
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Instagram */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Instagram
            </label>
            <div className="flex gap-2 items-stretch">
              <div className="input-field !w-auto !px-3 flex items-center justify-center text-[var(--text-secondary)] shrink-0">
                @
              </div>
              <input
                type="text"
                placeholder="your_handle"
                value={form.instagram}
                onChange={(e) =>
                  update("instagram", e.target.value.replace(/^@/, ""))
                }
                className="input-field min-w-0 flex-1"
              />
            </div>
          </div>
        </fieldset>

        {/* Consent + submit — in normal page flow */}
        <div className="mt-2 space-y-3.5 pt-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.whatsappOptIn}
              onChange={(e) => update("whatsappOptIn", e.target.checked)}
              className="checkbox-custom mt-0.5"
            />
            <div>
              <span className="text-sm">
                Add me to WhatsApp groups to find games & players
              </span>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                By checking in, you agree to receive updates via WhatsApp.
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.imageConsent}
              onChange={(e) => update("imageConsent", e.target.checked)}
              className="checkbox-custom"
            />
            <span className="text-sm">Photos from my play time may be used</span>
          </label>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="spinner" />
                Registering...
              </>
            ) : (
              "Complete Check-In"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-dvh">
          <div className="spinner" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
