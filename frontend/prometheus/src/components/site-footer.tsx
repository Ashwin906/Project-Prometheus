import Link from "next/link";
import { Mark } from "./mark";

const LINKS = [
  { href: "/landing", label: "Overview" },
  { href: "/discover", label: "Console" },
  { href: "/future", label: "Roadmap" },
  { href: "/contact", label: "Contact" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line">
      <div className="container-page py-12">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <Mark className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium tracking-tight text-fg">Prometheus</span>
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-fg-subtle">
              A multi-agent system for materials discovery. FastAPI and LangGraph on the
              server, Next.js on the client, the Materials Project as the data source.
            </p>
          </div>

          <div className="flex gap-14">
            <nav aria-label="Pages">
              <p className="label-mono">Pages</p>
              <ul className="mt-3 space-y-2 text-[12.5px]">
                {LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-fg-muted transition-colors hover:text-fg">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div>
              <p className="label-mono">External</p>
              <ul className="mt-3 space-y-2 text-[12.5px]">
                <li>
                  <a
                    href="https://materialsproject.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-fg-muted transition-colors hover:text-fg"
                  >
                    Materials Project
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/Ashwin906"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-fg-muted transition-colors hover:text-fg"
                  >
                    Source
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 text-[11.5px] text-fg-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Project Prometheus</p>
          <p className="font-mono uppercase tracking-[0.14em]">v0.1 · research preview</p>
        </div>
      </div>
    </footer>
  );
}
