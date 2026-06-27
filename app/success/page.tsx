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
    <div className="page-enter flex flex-col items-center text-center gap-10 py-10">
      {/* Checkmark */}
      <div className="animate-scale-in">
        <div className="w-24 h-24 rounded-full bg-[var(--accent)]/15 flex items-center justify-center animate-pulse-glow">
          <div className="w-16 h-16 rounded-full bg-[var(--accent)] flex items-center justify-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#14271f"
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
          Head to your court at{" "}
          {location ? (
            <span className="text-[var(--accent)] font-medium">{location}</span>
          ) : (
            "your location"
          )}
        </p>
        {(formattedTime || uniqueId) && (
          <p className="text-sm text-[var(--text-secondary)] pt-1">
            {formattedTime && <>Checked in at {formattedTime}</>}
            {formattedTime && uniqueId && <span className="mx-1.5">·</span>}
            {uniqueId && <>Stellar ID: {uniqueId}</>}
          </p>
        )}
      </div>

      {/* Unified info card */}
      <div className="w-full text-left rounded-xl bg-white/[0.03] border border-[var(--border-subtle)] overflow-hidden">
        {/* Row 1: People playing */}
        <div className="flex items-center gap-3 px-5 py-4">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--accent)] shrink-0"
          >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          <span className="text-sm text-[var(--text-secondary)]">
            <span className="text-[var(--text-primary)] font-semibold">12+</span>{" "}
            people playing today
          </span>
        </div>

        <div className="h-px bg-[var(--border-subtle)] mx-5" />

        {/* Row 2: Paddles */}
        <div className="flex items-start gap-3 px-5 py-4">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--accent)] shrink-0 mt-0.5"
          >
            <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" />
          </svg>
          <div className="text-sm text-[var(--text-secondary)] leading-relaxed space-y-1.5">
            <p className="text-[var(--text-primary)] font-medium">
              Borrow paddles &amp; balls for free.
            </p>
            <p>
              Just tell the facility partner your Stellar ID — return the gear when you&apos;re done playing.
            </p>
          </div>
        </div>

        <div className="h-px bg-[var(--border-subtle)] mx-5" />

        {/* Row 3: WhatsApp community */}
        <div className="flex flex-col gap-3 px-5 py-4">
          <div className="flex items-start gap-3">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[var(--accent)] shrink-0 mt-0.5"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <div className="text-sm text-[var(--text-secondary)] leading-relaxed space-y-1.5">
              <p className="text-[var(--text-primary)] font-medium">
                Looking for friends to play with?
              </p>
              <p>
                Join our WhatsApp community to find games, players, and events near you.
              </p>
            </div>
          </div>

          <a
            href="https://chat.whatsapp.com/JRhgIwzkPZs3zhpvTWi1bP"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full px-5 py-2.5 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)] font-semibold text-sm hover:bg-[var(--accent)]/20 transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Join the community
          </a>
        </div>
      </div>
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
