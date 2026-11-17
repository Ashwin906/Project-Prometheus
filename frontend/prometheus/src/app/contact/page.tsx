import { SiteShell } from "@/components/site-shell";

const CHANNELS = [
  {
    label: "Email",
    value: "ashwin90606@gmail.com",
    href: "mailto:ashwin90606@gmail.com",
    note: "Fastest route for questions and collaboration proposals",
  },
  {
    label: "LinkedIn",
    value: "linkedin.com/in/ashwink06",
    href: "https://linkedin.com/in/ashwink06",
    note: "Professional enquiries",
  },
  {
    label: "GitHub",
    value: "github.com/Ashwin906",
    href: "https://github.com/Ashwin906",
    note: "Source, issues and updates",
  },
];

const FACTS = [
  { term: "Status", value: "Research preview, v0.1" },
  { term: "Frontend", value: "Next.js 15, TypeScript" },
  { term: "Backend", value: "FastAPI, LangGraph" },
  { term: "Data source", value: "Materials Project" },
  { term: "License", value: "MIT" },
];

export default function ContactPage() {
  return (
    <SiteShell>
      <section className="relative overflow-hidden border-b border-line">
        <div aria-hidden className="blueprint pointer-events-none absolute inset-0" />
        <div className="container-page relative py-16 md:py-20">
          <p className="eyebrow">Contact</p>
          <h1 className="mt-6 text-[34px] font-medium leading-[1.1] tracking-tight text-fg md:text-[48px]">
            Get in touch.
          </h1>
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-fg-muted">
            Questions about the system, a research use case, or a collaboration proposal. Email
            is the fastest route; the other channels are listed below.
          </p>
          <div className="mt-9">
            <a href="mailto:ashwin90606@gmail.com" className="btn btn-primary">
              Email the maintainer
              <ArrowIcon />
            </a>
          </div>
        </div>
      </section>

      <section className="container-page py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="label-mono">Channels</p>
            <a
              href={CHANNELS[0].href}
              className="group mt-4 block border-t border-line py-6 transition-colors hover:bg-panel/40"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
                <div>
                  <p className="text-[13px] font-medium text-fg">{CHANNELS[0].label}</p>
                  <p className="mt-1 text-[12px] text-fg-subtle">{CHANNELS[0].note}</p>
                </div>
                <p className="font-mono text-[12.5px] text-fg-muted transition-colors group-hover:text-fg">
                  {CHANNELS[0].value}
                </p>
              </div>
            </a>
            {CHANNELS.slice(1).map((channel) => (
              <a
                key={channel.label}
                href={channel.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group block border-t border-line py-6 transition-colors last:border-b hover:bg-panel/40"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
                  <div>
                    <p className="text-[13px] font-medium text-fg">{channel.label}</p>
                    <p className="mt-1 text-[12px] text-fg-subtle">{channel.note}</p>
                  </div>
                  <p className="font-mono text-[12.5px] text-fg-muted transition-colors group-hover:text-fg">
                    {channel.value}
                  </p>
                </div>
              </a>
            ))}

            <p className="mt-8 max-w-md text-[12.5px] leading-relaxed text-fg-subtle">
              For a research enquiry, include the material class, the properties you are
              optimising for and any hard constraints. That is the same information the console
              needs to run.
            </p>
          </div>

          <div>
            <p className="label-mono">About</p>
            <p className="mt-4 text-[13px] leading-relaxed text-fg-muted">
              Prometheus is an independent research project on automated materials discovery. It
              is maintained in the open and documented as it develops.
            </p>
            <dl className="mt-6 border-t border-line">
              {FACTS.map((fact) => (
                <div
                  key={fact.term}
                  className="flex items-baseline justify-between gap-6 border-b border-line py-3"
                >
                  <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-fg-subtle">
                    {fact.term}
                  </dt>
                  <dd className="text-right text-[12.5px] text-fg-muted">{fact.value}</dd>
                </div>
              ))}
            </dl>
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
