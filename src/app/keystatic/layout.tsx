import { notFound } from "next/navigation";
import { cmsEnabled } from "@/lib/cms";
import KeystaticApp from "./keystatic";

export default function KeystaticLayout() {
  if (!cmsEnabled) notFound();
  return (
    <html lang="zh-Hant">
      <body>
        <KeystaticApp />
      </body>
    </html>
  );
}
