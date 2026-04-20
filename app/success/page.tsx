"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function formatCheckinTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });
  } catch {
    return "";
  }
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") || "Player";
  const returning = searchParams.get("returning") === "1";
  const time = searchParams.get("time") || "";
  const uniqueId = searchParams.get("id") || "";
  const location = searchParams.get("loc") || "";
  const firstName = name.split(" ")[0];

  const formattedTime = time ? formatCheckinTime(time) : "";

  return (
    <div className="page-enter flex flex-col items-center text-center min-h-[80dvh] justify-center gap-8">
      {/* Checkmark */}
      <div className="animate-scale-in">
        <div className="w-24 h-24 rounded-full bg-green-500/15 flex items-center justify-center animate-pulse-glow">
          <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17L4 12" />
            </svg>
          </div>
        </div>
      </div>

      {/* Message */}
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">
          {returning ? (
            <>Welcome back, {firstName}!</>
          ) : (
            <>Welcome to Stellarin, {firstName}!</>
          )}
        </h1>
        <p className="text-[var(--text-secondary)]">
          Head to your court and start playing
        </p>

        {location && (
          <p className="text-sm">
            <span className="text-[var(--text-muted)]">at </span>
            <span className="text-amber-400 font-medium">{location}</span>
          </p>
        )}

        {formattedTime && (
          <p className="text-sm text-[var(--text-muted)]">
            Checked in at {formattedTime}
          </p>
        )}

        {uniqueId && (
          <p className="text-xs text-[var(--text-muted)]">ID: {uniqueId}</p>
        )}
      </div>

      {/* People playing */}
      <button className="glass-card px-5 py-3 flex items-center gap-3 text-sm hover:bg-[var(--bg-card-hover)] transition-colors">
        <div className="flex -space-x-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-7 h-7 rounded-full border-2 border-[var(--bg-primary)]"
              style={{
                background: ["#f59e0b", "#6366f1", "#22c55e"][i],
              }}
            />
          ))}
        </div>
        <span className="text-[var(--text-secondary)]">
          12 people playing today
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-[var(--text-muted)]"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60dvh]">
          <div className="spinner" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
