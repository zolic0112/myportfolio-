"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-full border border-black/10 px-4 py-1.5 text-sm transition-colors hover:bg-black/[.04] dark:border-white/15 dark:hover:bg-white/[.06]"
    >
      登出
    </button>
  );
}
