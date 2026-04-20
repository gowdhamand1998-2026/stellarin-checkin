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
    whatsappOptIn: false,
    imageConsent: false,
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

  return (
    <div className="page-enter flex flex-col gap-6 py-4">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold">Tell us about you</h1>
        <p className="text-[var(--text-secondary)] text-sm">
          Checking in at <span className="text-amber-400 font-medium">{location}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Required fields */}
        <div className="space-y-4">
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

          <div>
            <label className="block text-sm font-medium mb-2">Skill Level</label>
            <select
              value={form.skillLevel}
              onChange={(e) => update("skillLevel", e.target.value)}
              className={`select-field ${form.skillLevel ? "" : "is-placeholder"}`}
            >
              <option value="" disabled>
                Select your level
              </option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Pro">Pro</option>
            </select>
          </div>
        </div>

        {/* Optional divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--border-subtle)]" />
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
            Optional
          </span>
          <div className="h-px flex-1 bg-[var(--border-subtle)]" />
        </div>

        {/* Optional fields */}
        <div className="space-y-4">
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

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Preferred Sport
            </label>
            <select
              value={form.preferredSport}
              onChange={(e) => update("preferredSport", e.target.value)}
              className={`select-field ${form.preferredSport ? "" : "is-placeholder"}`}
            >
              <option value="">Select sport</option>
              <option value="Pickleball">Pickleball</option>
              <option value="Tennis">Tennis</option>
              <option value="Badminton">Badminton</option>
              <option value="Padel">Padel</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Instagram
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                @
              </span>
              <input
                type="text"
                placeholder="your_handle"
                value={form.instagram}
                onChange={(e) => update("instagram", e.target.value)}
                className="input-field pl-8"
              />
            </div>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="space-y-4 pt-1">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.whatsappOptIn}
              onChange={(e) => update("whatsappOptIn", e.target.checked)}
              className="checkbox-custom mt-0.5"
            />
            <div>
              <span className="text-sm font-medium">
                Find games & players near you on WhatsApp
              </span>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                We&apos;ll add you to relevant groups based on your skill level
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.imageConsent}
              onChange={(e) => update("imageConsent", e.target.checked)}
              className="checkbox-custom mt-0.5"
            />
            <div>
              <span className="text-sm font-medium">
                You may use images taken during my play time
              </span>
            </div>
          </label>
        </div>

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

        <p className="text-xs text-[var(--text-muted)] text-center">
          By checking in, you agree to receive updates via WhatsApp/SMS
        </p>
      </form>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60dvh]">
          <div className="spinner" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
