import Link from "next/link";
import { SiteShell } from "@/components/site-shell";

const AVAILABLE = [
  "Goal parsing into two to four objectives with a constraint dictionary",
  "Property mapping and query construction against the Materials Project",
  "Pareto front computation across the selected objectives",
  "Feasibility scoring from hull energy and stability flags",
  "Streaming progress over server-sent events",
  "Per-session API credentials, never persisted client-side",
];

const UNAVAILABLE = [
  "Generative design of structures absent from database records",
  "Robotic synthesis and experimental validation",
  "Closed-loop retraining from experimental results",
  "Accounts, saved runs and persistent project storage",
];

type Status = "In development" | "Research" | "Planned" | "Exploratory";

const PHASES: { id: string; title: string; status: Status; body: string }[] = [
  {
    id: "01",
    title: "Objective and constraint coverage",
    status: "In development",
    body: "Broaden the property vocabulary the goal analyst can resolve, with better handling of compound classes, ranges and compound constraints.",
  },
  {
    id: "02",
    title: "Property coverage",
    status: "Research",
    body: "Extend beyond electronic and thermodynamic fields into mechanical, thermal, magnetic and surface properties, with consistent units.",
  },
  {
    id: "03",
    title: "Generative structure proposals",
    status: "Research",
    body: "Propose structures that do not exist in the database, then screen them with surrogate models before any candidate is surfaced.",
  },
  {
    id: "04",
    title: "Synthesis integration",
    status: "Planned",
    body: "Hand selected candidates to synthesis planning tools and capture the resulting measurements as structured records.",
  },
  {
    id: "05",
    title: "Closed-loop refinement",
    status: "Planned",
    body: "Feed measured outcomes back into ranking so that predictions improve with each completed experiment.",
  },
  {
    id: "06",
    title: "Additional domains",
    status: "Exploratory",
    body: "Apply the same workflow to catalysts and interfaces, where the objective set and data sources differ from bulk materials.",
  },
];

const CHIP: Record<Status, string> = {
  "In development": "border-accent/40 bg-accent/10 text-accent",
  Research: "border-line-strong text-fg-muted",
  Planned: "border-line text-fg-subtle",
  Exploratory: "border-line text-fg-subtle",
};

export default function FuturePage() {
  return (
    <SiteShell>
      {/* Header */}
      <section className="relative overflow-hidden border-b border-line">
        <div aria-hidden className="blueprint pointer-events-none absolute inset-0" />
        <div className="container-page relative py-16 md:py-20">
          <p className="eyebrow">Development status</p>
          <h1 className="mt-6 max-w-2xl text-[34px] font-medium leading-[1.1] tracking-tight text-fg md:text-[48px]">
            What ships now, and what comes next.
          </h1>
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-fg-muted">
            The current build covers the analysis loop end to end. Everything beyond it —
            generating structures, making them, learning from the results — is still work in
            progress. The phases below are ordered by priority, not by date.
          </p>
        </div>
      </section>

      {/* Available / not available */}
      <section className="container-page py-16 md:py-20">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <div className="flex items-center gap-2.5">
              <CheckIcon className="h-3.5 w-3.5 text-ok" />
              <h2 className="text-[13px] font-medium text-fg">Available in v0.1</h2>
            </div>
            <ul className="mt-5 border-t border-line">
              {AVAILABLE.map((item) => (
                <li key={item} className="flex gap-3 border-b border-line py-3">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ok" />
                  <span className="text-[13px] leading-relaxed text-fg-muted">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <MinusIcon className="h-3.5 w-3.5 text-fg-subtle" />
              <h2 className="text-[13px] font-medium text-fg">Not yet available</h2>
            </div>
            <ul className="mt-5 border-t border-line">
              {UNAVAILABLE.map((item) => (
                <li key={item} className="flex gap-3 border-b border-line py-3">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-line-strong" />
                  <span className="text-[13px] leading-relaxed text-fg-muted">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Phases */}
      <section className="border-t border-line">
        <div className="container-page py-16 md:py-20">
          <p className="eyebrow">Roadmap</p>
          <h2 className="mt-5 text-[26px] font-medium tracking-tight text-fg md:text-[32px]">
            Phases
          </h2>

          <ol className="mt-10 border-t border-line">
            {PHASES.map((phase) => (
              <li
                key={phase.id}
                className="grid gap-3 border-b border-line py-6 transition-colors hover:bg-panel/40 md:grid-cols-[56px_1fr_140px] md:items-start md:gap-6"
              >
                <span className="font-mono text-[11px] text-fg-subtle">{phase.id}</span>
                <div className="max-w-xl">
                  <h3 className="text-[14px] font-medium text-fg">{phase.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-fg-muted">{phase.body}</p>
                </div>
                <div className="md:justify-self-end">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ${CHIP[phase.status]}`}
                  >
                    {phase.status}
                  </span>
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-6 max-w-xl text-[12px] leading-relaxed text-fg-subtle">
            No delivery dates are published. Items move up the list when the preceding stage is
            validated, not on a calendar.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-20">
        <div className="panel flex flex-col gap-6 px-8 py-9 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[22px] font-medium tracking-tight text-fg">Try the current build</h2>
            <p className="mt-2 max-w-md text-[13px] leading-relaxed text-fg-muted">
              The console reflects the state described above, including its limits.
            </p>
          </div>
          <Link href="/discover" className="btn btn-primary">
            Open console
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MinusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
