"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Legacy route — flow has been merged into the landing page.
// Redirect to home.
export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60dvh]">
      <div className="spinner" />
    </div>
  );
}
