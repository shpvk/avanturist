"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SiteHeader } from "../_components/site-header";
import { useAuth } from "../_hooks/use-auth";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    router.replace(user ? `/users/${user.id}` : "/login");
  }, [isLoading, user, router]);

  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="all-builds-main">
        <p className="auth-status" role="status">Opening your profile…</p>
      </main>
    </div>
  );
}
