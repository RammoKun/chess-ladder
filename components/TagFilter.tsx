"use client";

interface TagFilterProps {
  allTags: string[];
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}

export function TagFilter({ allTags, selectedTags, onChange }: TagFilterProps) {
  function toggle(tag: string) {
    const isSelected = selectedTags.includes(tag);
    if (isSelected) {
      onChange(selectedTags.filter((item) => item !== tag));
      return;
    }
    onChange([...selectedTags, tag]);
  }

  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <label className="text-sm text-zinc-400">Filter by Batch</label>
        <button type="button" onClick={() => onChange([])} className="text-xs text-zinc-400 hover:text-zinc-200">
          All Tags
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {allTags.map((tag) => {
          const active = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                active ? "border-[#FFD700] bg-[#FFD700]/20 text-[#FFD700]" : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}
