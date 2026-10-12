import type { ReactNode } from "react";
import LogoutButton from "../LogoutButton";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-4xl flex-1 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">作品管理後台</h1>
        <LogoutButton />
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}
