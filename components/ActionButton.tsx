interface ActionButtonProps {
  label: string;
  points: number;
  onClick: () => void;
  disabled?: boolean;
}

export function ActionButton({ label, points, onClick, disabled }: ActionButtonProps) {
  const tone = points >= 0 ? "border-emerald-500/30 hover:border-emerald-400" : "border-rose-500/30 hover:border-rose-400";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-xl border bg-[#111111] p-3 text-left transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 ${tone}`}
    >
      <p className="text-sm text-zinc-100">{label}</p>
      <p className={`text-xs font-semibold ${points >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
        {points > 0 ? "+" : ""}
        {points}
      </p>
    </button>
  );
}
