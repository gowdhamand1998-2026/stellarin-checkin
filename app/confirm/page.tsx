"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isValidLocation } from "@/lib/locations";

function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const name = searchParams.get("name") || "";
  const skill = searchParams.get("skill") || "";
  const uniqueId = searchParams.get("id") || "";
  const phone = searchParams.get("phone") || "";
  const locParam = searchParams.get("loc") || "";
  const location = isValidLocation(locParam) ? locParam : "";

  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  if (!location) {
    if (typeof window !== "undefined") {
      router.replace("/");
    }
    return null;
  }

  const handleConfirm = async () => {
    if (!phone) {
      setError("Missing phone number. Please start over.");
      return;
    }

    setConfirming(true);
    setError("");

    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, location }),
      });

      let checkinTime = new Date().toISOString();
      if (res.ok) {
        const data = await res.json();
        checkinTime = data.checkinTime || checkinTime;
      }

      const params = new URLSearchParams({
        name,
        returning: "1",
        time: checkinTime,
        id: uniqueId,
        loc: location,
      });
      router.push(`/success?${params.toString()}`);
    } catch {
      const params = new URLSearchParams({
        name,
        returning: "1",
        time: new Date().toISOString(),
        id: uniqueId,
        loc: location,
      });
      router.push(`/success?${params.toString()}`);
    }
  };

  return (
    <div className="page-enter flex flex-col min-h-[80dvh] justify-center gap-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Confirm your details</h1>
        <p className="text-[var(--text-secondary)] text-sm">
          Quick check before you check in
        </p>
      </div>

      {/* Info card */}
      <div className="glass-card p-1">
        <DetailRow label="Location" value={location} highlight />
        <Divider />
        <DetailRow label="Stellar ID" value={uniqueId || "—"} />
        <Divider />
        <DetailRow label="Name" value={name || "—"} />
        <Divider />
        <DetailRow label="Level" value={skill || "—"} />
      </div>

      {error && <p className="text-red-400 text-sm text-center">{error}</p>}

      <button
        onClick={handleConfirm}
        disabled={confirming}
        className="btn-primary flex items-center justify-center gap-2"
      >
        {confirming ? (
          <>
            <div className="spinner" />
            Checking in...
          </>
        ) : (
          "Confirm Check-In"
        )}
      </button>
    </div>
  );
}

function DetailRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <span
        className={`text-sm font-medium ${
          highlight ? "text-amber-400" : "text-[var(--text-primary)]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-[var(--border-subtle)] mx-5" />;
}

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60dvh]">
          <div className="spinner" />
        </div>
      }
    >
      <ConfirmContent />
    </Suspense>
  );
}
