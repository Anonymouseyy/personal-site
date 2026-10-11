import PuttingGame from "@/components/PuttingGame";
import { site } from "@/lib/content";

export default function Page() {
  const { profile } = site;
  const paragraphs = Array.isArray(profile.summary) ? profile.summary : [profile.summary];
  return (
    <main className="shell">
      <div className="wrap">
        <header className="hero">
          <h1>{profile.name}</h1>
          <p className="tagline">{profile.tagline}</p>
          {paragraphs.map((p) => (
            <p key={p} className="summary">{p}</p>
          ))}
          <ul className="links">
            {profile.links.map((l) => (
              <li key={l.href}>
                <a
                  className="linkbtn"
                  href={l.href}
                  {...(/^https?:/.test(l.href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </header>
        <PuttingGame />
      </div>
    </main>
  );
}
