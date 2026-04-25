"use client";

import { useState } from "react";

interface TagManagerProps {
  tags: string[];
  onAddTag: (tag: string) => Promise<void>;
  onRemoveTag: (tag: string) => Promise<void>;
  title?: string;
}

export function TagManager({ tags, onAddTag, onRemoveTag, title = "Batch Tags" }: TagManagerProps) {
  const [newTag, setNewTag] = useState("");
  const [loadingTag, setLoadingTag] = useState("");

  return (
    <section className="mt-4 card p-4">
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-200">
            {tag}
            <button
              type="button"
              disabled={loadingTag === tag}
              onClick={async () => {
                setLoadingTag(tag);
                try {
                  await onRemoveTag(tag);
                } finally {
                  setLoadingTag("");
                }
              }}
              className="text-rose-400 hover:text-rose-300 disabled:opacity-50"
              aria-label={`Remove ${tag}`}
            >
              x
            </button>
          </span>
        ))}
        {tags.length === 0 ? <p className="text-sm text-zinc-400">No tags yet.</p> : null}
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={newTag}
          onChange={(event) => setNewTag(event.target.value)}
          placeholder="Type tag name..."
          className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-sm"
        />
        <button
          type="button"
          onClick={async () => {
            const tag = newTag;
            if (!tag.trim()) return;
            setLoadingTag("__add__");
            try {
              await onAddTag(tag);
              setNewTag("");
            } finally {
              setLoadingTag("");
            }
          }}
          disabled={loadingTag === "__add__"}
          className="rounded-xl bg-[#FFD700] px-4 py-3 text-sm font-semibold text-zinc-900 disabled:opacity-60"
        >
          {loadingTag === "__add__" ? "Adding..." : "Add"}
        </button>
      </div>
    </section>
  );
}
