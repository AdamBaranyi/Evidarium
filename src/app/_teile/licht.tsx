/**
 * Das Licht hinter der Seite — eine warme Lampe und das Licht des Urteils.
 * Gestaltung und Begründung in `src/styles/licht.css`.
 *
 * `bewegt` nur dort, wo es einen Knopf zum Anhalten gibt: auf der
 * Startseite, deren Vorführung ihn mitbringt.
 */
export function Licht({ bewegt = false }: { bewegt?: boolean }) {
  return (
    <div aria-hidden className={`licht ${bewegt ? 'licht-bewegt' : ''}`}>
      <span className="licht-lampe" />
      <span className="licht-belegt" />
      <span className="licht-teilweise" />
      <span className="licht-widerspruch-a" />
      <span className="licht-widerspruch-b" />
    </div>
  );
}
