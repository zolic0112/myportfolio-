import { createReader } from "@keystatic/core/reader";
import config from "../../keystatic.config";

export const reader = createReader(process.cwd(), config);

export async function getProfile() {
  return (
    (await reader.singletons.profile.read()) ?? {
      name: "你的名字",
      title: "",
      tagline: "",
      email: "",
      links: [],
    }
  );
}

export async function getWorks() {
  const works = await reader.collections.works.all();
  return works.sort((a, b) => (a.entry.order ?? 0) - (b.entry.order ?? 0));
}
