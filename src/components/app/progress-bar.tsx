type Props = { pct: number; label: string };

// Barra de 2px: trilho #262626, preenchimento branco.
export function ProgressBar({ pct, label }: Props) {
  const value = Math.max(0, Math.min(100, pct));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className="h-0.5 bg-line"
    >
      <div className="h-0.5 bg-white transition-[width] duration-500 ease-out" style={{ width: `${value}%` }} />
    </div>
  );
}
