/**
 * Ein Balken mit Zahl daneben.
 *
 * Die Zahl steht **immer** da, nicht nur im Tooltip: Ein Balken allein ist
 * bei 4 von 2000 USD nicht von null zu unterscheiden. Die Breite ist die
 * Zugabe, nicht die Aussage.
 */
export function Balken({
  name,
  wert,
  grenze,
  text,
}: {
  name: string;
  wert: number;
  grenze: number;
  text: string;
}) {
  const anteil = grenze > 0 ? Math.min(100, (wert / grenze) * 100) : 0;

  return (
    <div className="flex flex-col gap-1">
      <p className="flex flex-wrap justify-between gap-3">
        <span>{name}</span>
        <span className="text-ink-soft">{text}</span>
      </p>
      <div
        role="meter"
        aria-label={name}
        aria-valuenow={wert}
        aria-valuemin={0}
        aria-valuemax={grenze}
        aria-valuetext={text}
        className="h-2 w-full border border-edge"
      >
        {/* Nur die Füllung trägt Farbe; der Rahmen bleibt neutral. */}
        <div className="h-full bg-beleg" style={{ width: `${anteil}%` }} />
      </div>
    </div>
  );
}
