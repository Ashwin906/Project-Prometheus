import Link from "next/link";
import { SiteShell } from "@/components/site-shell";

const SPEC = [
  { label: "Agents", value: "5, sequential" },
  { label: "Objectives / run", value: "2 – 4" },
  { label: "Data source", value: "Materials Project" },
  { label: "Transport", value: "Server-sent events" },
];

const PIPELINE = [
  {
    name: "Epimetheus",
    role: "Goal analyst",
    body: "Converts the written goal into two to four measurable objectives plus a constraint set covering chemistry, thermodynamic stability and structure.",
  },
  {
    name: "Athena",
    role: "Strategist",
    body: "Maps each objective onto Materials Project property fields and assembles the query, filters and candidate budget used downstream.",
  },
  {
    name: "Hermes",
    role: "Retrieval",
    body: "Executes the query against the Materials Project and normalises the returned records so that every property is comparable.",
  },
  {
    name: "Hephaestus",
    role: "Pareto analysis",
    body: "Scores the candidate set on every objective and returns the non-dominated subset: materials where no property can improve without another degrading.",
  },
  {
    name: "Cassandra",
    role: "Feasibility review",
    body: "Scores each remaining candidate against hull energy and stability flags, then selects the single recommendation returned to the console.",
  },
];

const IO = [
  { term: "Input", detail: "A plain-language research goal, optionally with explicit property constraints." },
  { term: "Parsed objectives", detail: "Two to four objectives and a constraint dictionary, produced by the goal analyst." },
  { term: "Candidates", detail: "The Pareto front: materials that are not dominated on the selected objectives." },
  { term: "Recommendation", detail: "One candidate with its Materials Project ID, property values and feasibility score." },
];

const LIMITS = [
  {
    title: "Shortlists, not discoveries",
    body: "Results are a ranked shortlist drawn from existing database records. Nothing is synthesised or measured during a run.",
  },
  {
    title: "Feasibility is thermodynamic",
    body: "The score reflects hull energy and stability flags. It estimates plausibility, not cost, manufacturability or supply chain.",
  },
  {
    title: "Parsing can miss intent",
    body: "Property mapping is model-driven. Read the parsed objectives before treating a ranking as meaningful.",
  },
  {
    title: "Credentials stay in memory",
    body: "API keys are held for the session and sent to the backend with each request. The client never writes them to storage.",
  },
];

const PARSED_GOAL = `{
  "objectives": [
    "maximize band_gap",
    "minimize formation_energy_per_atom"
  ],
  "constraints": {
    "is_stable": true,
    "nelements": 3
  },
  "search_space_description":
    "stable ternary oxides"
}`;

const CANDIDATE = `{
  "formula": "…",
  "material_id": "mp-…",
  "properties": {
    "band_gap": 0.000,
    "energy_above_hull": 0.000,
    "Feasibility Score": 0.000
  }
}`;

export default function LandingPage() {
  return (
    <SiteShell>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div aria-hidden className="blueprint pointer-events-none absolute inset-0" />
        <div className="container-page relative grid gap-12 py-16 md:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="eyebrow">Multi-agent materials discovery</p>
            <h1 className="mt-6 max-w-xl text-[34px] font-medium leading-[1.08] tracking-tight text-fg md:text-[52px]">
              Research goals in.
              <br />
              Candidate materials out.
            </h1>
            <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-fg-muted md:text-base">
              Prometheus turns a written objective into structured, measurable targets, queries
              the Materials Project, and returns a Pareto front of candidate materials with a
              feasibility score for each. Every step streams to the console as it runs.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/discover" className="btn btn-primary">
                Open console
                <ArrowIcon />
              </Link>
              <Link href="#pipeline" className="btn btn-secondary">
                View pipeline
              </Link>
            </div>
          </div>

          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <span className="label-mono">Parsed objective</span>
              <span className="font-mono text-[10px] text-fg-subtle">response.json</span>
            </div>
            <pre className="scroll-thin overflow-x-auto px-4 py-4 font-mono text-[11.5px] leading-[1.9] text-fg-muted">
              {PARSED_GOAL}
            </pre>
            <p className="border-t border-line px-4 py-3 text-[11.5px] leading-relaxed text-fg-subtle">
              Each run begins by resolving the goal into a schema the retrieval agent can
              execute.
            </p>
          </div>
        </div>
      </section>

      {/* Spec strip */}
      <div className="border-b border-line">
        <div className="container-page">
          <dl className="grid grid-cols-2 gap-px bg-line md:grid-cols-4">
            {SPEC.map((item) => (
              <div key={item.label} className="bg-canvas px-1 py-5 md:px-5">
                <dt className="label-mono">{item.label}</dt>
                <dd className="mt-2 text-[13px] text-fg">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Pipeline */}
      <section id="pipeline" className="container-page py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow">Execution</p>
            <h2 className="mt-5 max-w-sm text-[26px] font-medium leading-tight tracking-tight text-fg md:text-[32px]">
              A fixed sequence, one agent per stage.
            </h2>
            <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-fg-muted">
              The workflow is deterministic: each stage consumes the output of the previous one
              and reports its status over the same stream. There is no hidden branching and no
              concurrent write to shared state.
            </p>
          </div>

          <ol className="border-t border-line">
            {PIPELINE.map((step, index) => (
              <li
                key={step.name}
                className="group grid gap-2 border-b border-line py-5 transition-colors hover:bg-panel/40 md:grid-cols-[44px_180px_1fr] md:gap-5"
              >
                <span className="font-mono text-[11px] text-fg-subtle">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-[13.5px] font-medium text-fg">{step.name}</p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-fg-subtle">
                    {step.role}
                  </p>
                </div>
                <p className="max-w-md text-[13px] leading-relaxed text-fg-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Interface */}
      <section className="border-y border-line bg-panel/30">
        <div className="container-page grid gap-12 py-16 md:py-24 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Interface</p>
            <h2 className="mt-5 text-[26px] font-medium leading-tight tracking-tight text-fg md:text-[32px]">
              What goes in, what comes back.
            </h2>
            <dl className="mt-8 border-t border-line">
              {IO.map((row) => (
                <div key={row.term} className="grid gap-1 border-b border-line py-4 sm:grid-cols-[150px_1fr] sm:gap-6">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-fg-subtle">
                    {row.term}
                  </dt>
                  <dd className="text-[13px] leading-relaxed text-fg-muted">{row.detail}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="space-y-4">
            <div className="panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                <span className="label-mono">Final candidate</span>
                <span className="font-mono text-[10px] text-fg-subtle">final_candidate</span>
              </div>
              <pre className="scroll-thin overflow-x-auto px-4 py-4 font-mono text-[11.5px] leading-[1.9] text-fg-muted">
                {CANDIDATE}
              </pre>
            </div>
            <p className="text-[12px] leading-relaxed text-fg-subtle">
              Values are shown as placeholders; field names match the payload the backend
              emits on the final event.
            </p>
          </div>
        </div>
      </section>

      {/* Limits */}
      <section className="container-page py-16 md:py-24">
        <div className="max-w-2xl">
          <p className="eyebrow">Scope and limits</p>
          <h2 className="mt-5 text-[26px] font-medium leading-tight tracking-tight text-fg md:text-[32px]">
            What this system does not do.
          </h2>
          <p className="mt-5 text-[14px] leading-relaxed text-fg-muted">
            The analysis loop is real; the claims around it should stay modest.
          </p>
        </div>

        <div className="mt-10 grid gap-x-12 gap-y-8 border-t border-line pt-10 md:grid-cols-2">
          {LIMITS.map((item) => (
            <div key={item.title} className="max-w-md">
              <h3 className="text-[13.5px] font-medium text-fg">{item.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-fg-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-20">
        <div className="panel flex flex-col gap-6 px-8 py-9 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[22px] font-medium tracking-tight text-fg">Run a query</h2>
            <p className="mt-2 max-w-md text-[13px] leading-relaxed text-fg-muted">
              You will need an LLM provider key and a Materials Project key. Both are entered in
              the console and used for the session only.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/discover" className="btn btn-primary">
              Open console
            </Link>
            <Link href="/future" className="btn btn-secondary">
              View roadmap
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
