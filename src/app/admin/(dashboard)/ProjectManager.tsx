"use client";

import { useState } from "react";
import type { Project } from "@prisma/client";

type FormState = {
  title: string;
  description: string;
  tags: string;
  link: string;
  repo: string;
  image: string;
};

const emptyForm: FormState = {
  title: "",
  description: "",
  tags: "",
  link: "",
  repo: "",
  image: "",
};

function toForm(project: Project): FormState {
  return {
    title: project.title,
    description: project.description,
    tags: project.tags,
    link: project.link ?? "",
    repo: project.repo ?? "",
    image: project.image ?? "",
  };
}

export default function ProjectManager({
  initialProjects,
}: {
  initialProjects: Project[];
}) {
  const [projects, setProjects] = useState(initialProjects);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  function startEdit(project: Project) {
    setEditingId(project.id);
    setForm(toForm(project));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const url = editingId ? `/api/projects/${editingId}` : "/api/projects";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "儲存失敗");
        return;
      }
      if (editingId) {
        setProjects((prev) => prev.map((p) => (p.id === editingId ? data : p)));
      } else {
        setProjects((prev) => [...prev, data]);
      }
      startCreate();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("確定要刪除這個專案嗎?")) return;
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (editingId === id) startCreate();
    }
  }

  return (
    <div className="grid gap-10 sm:grid-cols-[1fr_1.2fr]">
      <div>
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {editingId ? "編輯專案" : "新增專案"}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            required
            placeholder="標題"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-lg border border-black/10 px-4 py-2 outline-none focus:border-black/30 dark:border-white/15 dark:focus:border-white/30 dark:bg-transparent"
          />
          <textarea
            required
            placeholder="描述"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full rounded-lg border border-black/10 px-4 py-2 outline-none focus:border-black/30 dark:border-white/15 dark:focus:border-white/30 dark:bg-transparent"
          />
          <input
            placeholder="標籤(以逗號分隔,例如 Next.js, TypeScript)"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            className="w-full rounded-lg border border-black/10 px-4 py-2 outline-none focus:border-black/30 dark:border-white/15 dark:focus:border-white/30 dark:bg-transparent"
          />
          <input
            placeholder="Live 連結(選填)"
            value={form.link}
            onChange={(e) => setForm({ ...form, link: e.target.value })}
            className="w-full rounded-lg border border-black/10 px-4 py-2 outline-none focus:border-black/30 dark:border-white/15 dark:focus:border-white/30 dark:bg-transparent"
          />
          <input
            placeholder="Repo 連結(選填)"
            value={form.repo}
            onChange={(e) => setForm({ ...form, repo: e.target.value })}
            className="w-full rounded-lg border border-black/10 px-4 py-2 outline-none focus:border-black/30 dark:border-white/15 dark:focus:border-white/30 dark:bg-transparent"
          />
          <input
            placeholder="圖片網址(選填)"
            value={form.image}
            onChange={(e) => setForm({ ...form, image: e.target.value })}
            className="w-full rounded-lg border border-black/10 px-4 py-2 outline-none focus:border-black/30 dark:border-white/15 dark:focus:border-white/30 dark:bg-transparent"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
            >
              {saving ? "儲存中…" : editingId ? "更新" : "新增"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={startCreate}
                className="rounded-full border border-black/10 px-5 py-2 text-sm dark:border-white/15"
              >
                取消編輯
              </button>
            )}
          </div>
        </form>
      </div>

      <div>
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          目前作品({projects.length})
        </h2>
        <ul className="mt-4 space-y-3">
          {projects.map((project) => (
            <li
              key={project.id}
              className="rounded-lg border border-black/10 p-4 dark:border-white/10"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{project.title}</p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {project.description}
                  </p>
                </div>
                <div className="flex shrink-0 gap-3 text-sm font-medium">
                  <button onClick={() => startEdit(project)}>編輯</button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="text-red-600"
                  >
                    刪除
                  </button>
                </div>
              </div>
            </li>
          ))}
          {projects.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              尚無作品,請用左側表單新增。
            </p>
          )}
        </ul>
      </div>
    </div>
  );
}
