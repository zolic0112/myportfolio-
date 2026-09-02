import { profile } from "@/lib/data";

export default function Footer() {
  return (
    <footer className="border-t border-black/5 py-8 text-center text-sm text-zinc-500 dark:border-white/10 dark:text-zinc-500">
      <p>
        © {new Date().getFullYear()} {profile.name}. All rights reserved.
      </p>
    </footer>
  );
}
