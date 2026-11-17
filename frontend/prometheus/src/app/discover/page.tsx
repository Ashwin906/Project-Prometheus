"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  CartesianGrid,
  Label,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SiteHeader } from "@/components/site-header";

type Status = "idle" | "thinking" | "info" | "success" | "warning" | "error";
type Row = Record<string, unknown>;

interface LogEntry {
  time: string;
  source: string;
  message: string;
  level: Status;
}

interface FinalCandidate {
  formula: string;
  material_id?: string;
  properties: Record<string, unknown>;
}

interface StreamPayload {
  agent?: string;
  status?: Status;
  log?: string;
  pareto_front?: Row[];
  final_candidate?: FinalCandidate;
  keepalive?: boolean;
}

const AGENTS = [
  { name: "Epimetheus", role: "Goal analyst" },
  { name: "Athena", role: "Strategy" },
  { name: "Hermes", role: "Retrieval" },
  { name: "Hephaestus", role: "Pareto analysis" },
  { name: "Cassandra", role: "Feasibility review" },
];

const EXAMPLES = [
  {
    label: "Ternary oxides",
    prompt: "Find stable ternary oxides with a band gap above 2 eV and low formation energy per atom.",
  },
  {
    label: "Light alloys",
    prompt: "Find lightweight stable alloys with high bulk modulus for aerospace structures.",
  },
  {
    label: "Copper sulfides",
    prompt: "Find stable ternary copper sulfides that are magnetic and metallic.",
  },
];

const STATUS_META: Record<Status, { label: string; dot: string; text: string }> = {
  idle: { label: "Queued", dot: "bg-line-strong", text: "text-fg-subtle" },
  thinking: { label: "Running", dot: "bg-accent animate-pulse", text: "text-accent" },
  info: { label: "Info", dot: "bg-fg-muted", text: "text-fg-muted" },
  success: { label: "Done", dot: "bg-ok", text: "text-ok" },
  warning: { label: "Warning", dot: "bg-warn", text: "text-warn" },
  error: { label: "Error", dot: "bg-bad", text: "text-bad" },
};

const RUN_META = {
  idle: { label: "Idle", dot: "bg-line-strong", text: "text-fg-muted" },
  running: { label: "Running", dot: "bg-accent animate-pulse", text: "text-accent" },
  complete: { label: "Complete", dot: "bg-ok", text: "text-ok" },
  failed: { label: "Failed", dot: "bg-bad", text: "text-bad" },
};

function pretty(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(3);
  }
  if (typeof value === "boolean") return value ? "true" : "false";
  if (Array.isArray(value)) return value.map((item) => String(item)).join(", ");
  return String(value);
}

export default function DiscoverPage() {
  const [prompt, setPrompt] = useState(
    "Find stable ternary oxides with a high band gap and low formation energy per atom."
  );
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [chartData, setChartData] = useState<Row[]>([]);
  const [finalCandidate, setFinalCandidate] = useState<FinalCandidate | null>(null);
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [googleApiKey, setGoogleApiKey] = useState("");
  const [mpApiKey, setMpApiKey] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((source: string, message: string, level: Status = "info") => {
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    setLogs((prev) => [...prev, { time, source, message, level }]);
  }, []);

  useEffect(() => {
    const container = logContainerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [logs]);

  const numericKeys = useMemo(() => {
    if (chartData.length === 0) return [] as string[];
    const sample = chartData[0];
    return Object.keys(sample).filter((key) => typeof sample[key] === "number");
  }, [chartData]);

  const axisLabel = (index: number) => {
    const key = numericKeys[index];
    return key ? pretty(key) : `Objective ${index + 1}`;
  };

  const handleStreamData = useCallback(
    (data: StreamPayload) => {
      if (data.keepalive) return;

      if (data.agent) {
        const status = data.status ?? "info";
        if (data.agent !== "System") {
          setStatuses((prev) => ({ ...prev, [data.agent as string]: status }));
        }
        if (data.log) addLog(data.agent, data.log, status);
      } else if (data.log) {
        addLog("System", data.log, "info");
      }

      if (Array.isArray(data.pareto_front)) setChartData(data.pareto_front);

      if (data.final_candidate) {
        setFinalCandidate(data.final_candidate);
        setIsRunning(false);
      }
    },
    [addLog]
  );

  async function runDiscovery() {
    if (!mpApiKey || (!openaiApiKey && !googleApiKey)) {
      setValidationError(
        "Enter a Materials Project key and at least one LLM provider key to start a run."
      );
      return;
    }

    setValidationError(null);
    setIsRunning(true);
    setLogs([]);
    setChartData([]);
    setFinalCandidate(null);
    setStatuses({});
    setHasError(false);

    const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

    let response: Response;
    try {
      response = await fetch(`${apiBase}/discover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: prompt,
          openaiApiKey,
          googleApiKey,
          mpApiKey,
        }),
      });
    } catch {
      addLog("System", `Could not reach the backend at ${apiBase}.`, "error");
      setHasError(true);
      setIsRunning(false);
      return;
    }

    if (!response.ok) {
      let detail = `HTTP ${response.status}`;
      try {
        const body = (await response.json()) as { detail?: unknown };
        if (body?.detail) detail = String(body.detail);
      } catch {
        // Response body was not JSON; keep the status code.
      }
      addLog("System", `Request rejected: ${detail}`, "error");
      setHasError(true);
      setIsRunning(false);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      addLog("System", "Response stream unavailable.", "error");
      setHasError(true);
      setIsRunning(false);
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            handleStreamData(JSON.parse(line.slice(6)) as StreamPayload);
          } catch {
            addLog("System", "Could not parse a server event.", "warning");
          }
        }
      }
    } catch {
      addLog("System", "The stream ended unexpectedly.", "error");
      setHasError(true);
    } finally {
      setIsRunning(false);
      setStatuses((prev) => {
        const next: Record<string, Status> = { ...prev };
        for (const agent of AGENTS) {
          if (next[agent.name] === "thinking") next[agent.name] = "info";
        }
        return next;
      });
    }
  }

  const startRun = () => {
    setRetryCount(0);
    void runDiscovery();
  };

  const retryRun = () => {
    if (retryCount >= 3) {
      addLog("System", "Retry limit reached for this run.", "warning");
      return;
    }
    setRetryCount((count) => count + 1);
    void runDiscovery();
  };

  const runState = isRunning ? "running" : hasError ? "failed" : finalCandidate ? "complete" : "idle";
  const runMeta = RUN_META[runState];
  const candidateEntries = finalCandidate
    ? Object.entries(finalCandidate.properties ?? {})
        .filter(([key]) => key !== "formula_pretty")
        .slice(0, 10)
    : [];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader>
        <span className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1">
          <span className={`h-1.5 w-1.5 rounded-full ${runMeta.dot}`} />
          <span
            className={`font-mono text-[10px] uppercase tracking-[0.14em] ${runMeta.text}`}
          >
            {runMeta.label}
          </span>
        </span>
        <span className="hidden h-4 w-px bg-line-strong sm:block" />
        <a
          href="https://materialsproject.org/api"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-fg-subtle transition-colors hover:text-fg-muted lg:block"
        >
          API keys
        </a>
      </SiteHeader>

      <div className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col lg:flex-row">
        {/* Configuration rail */}
        <aside className="shrink-0 border-b border-line lg:w-[326px] lg:border-b-0 lg:border-r">
          <div className="scroll-thin space-y-7 px-6 py-6 lg:sticky lg:top-14 lg:max-h-[calc(100vh-3.5rem)] lg:overflow-y-auto">
            <div>
              <h2 className="text-[13px] font-medium text-fg">Credentials</h2>
              <p className="mt-1 text-[12px] leading-relaxed text-fg-subtle">
                Passed to the backend with each run. Nothing is stored.
              </p>
            </div>

            <div className="space-y-5">
              <Field
                id="google-key"
                label="Google Gemini"
                badge="Optional"
                value={googleApiKey}
                onChange={setGoogleApiKey}
                placeholder="AIza…"
                disabled={isRunning}
                hint={
                  <>
                    Create a key at{" "}
                    <ExternalLink href="https://aistudio.google.com/apikey" label="aistudio.google.com" />
                  </>
                }
              />
              <Field
                id="openai-key"
                label="OpenAI"
                badge="Optional"
                value={openaiApiKey}
                onChange={setOpenaiApiKey}
                placeholder="sk-…"
                disabled={isRunning}
                hint={<>Alternative to Gemini. One provider is required.</>}
              />
              <Field
                id="mp-key"
                label="Materials Project"
                badge="Required"
                value={mpApiKey}
                onChange={setMpApiKey}
                placeholder="mp-…"
                disabled={isRunning}
                hint={
                  <>
                    Create a key at{" "}
                    <ExternalLink href="https://materialsproject.org/api" label="materialsproject.org/api" />
                  </>
                }
              />
            </div>

            {validationError && (
              <div className="border border-warn/30 bg-warn/5 px-3 py-2.5">
                <p className="label-mono text-warn">Missing credentials</p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-fg-muted">{validationError}</p>
              </div>
            )}

            {hasError && (
              <div className="border border-bad/30 bg-bad/5 px-3 py-2.5">
                <p className="label-mono text-bad">Run interrupted</p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-fg-muted">
                  The workflow did not finish. Retrying restarts it from the goal analyst.
                </p>
                <button
                  type="button"
                  onClick={retryRun}
                  disabled={retryCount >= 3 || isRunning}
                  className="btn btn-secondary mt-3 h-8 w-full text-[12px]"
                >
                  Retry ({retryCount}/3)
                </button>
              </div>
            )}

            <div className="border-t border-line pt-5">
              <p className="label-mono">Development build</p>
              <p className="mt-2 text-[11.5px] leading-relaxed text-fg-subtle">
                Individual agents can fail on unusual goals. A failed stage is reported in the log
                rather than retried automatically.
              </p>
            </div>
          </div>
        </aside>

        {/* Console */}
        <main className="min-w-0 flex-1 px-6 py-6">
          <section className="panel">
            <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
              <div className="flex items-baseline gap-2.5">
                <span className="label-mono">Query</span>
                <span className="text-[11.5px] text-fg-subtle">Natural-language objective</span>
              </div>
              <span className="font-mono text-[10px] text-fg-subtle">{prompt.length} chars</span>
            </div>

            <div className="p-5">
              <label htmlFor="goal" className="sr-only">
                Discovery goal
              </label>
              <textarea
                id="goal"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={3}
                disabled={isRunning}
                placeholder="e.g. Find a non-toxic, earth-abundant catalyst for hydrogen evolution."
                className="field h-24 resize-none py-3 leading-relaxed"
              />

              <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="label-mono mr-1">Examples</span>
                  {EXAMPLES.map((example) => (
                    <button
                      key={example.label}
                      type="button"
                      onClick={() => setPrompt(example.prompt)}
                      disabled={isRunning}
                      className="rounded border border-line px-2.5 py-1 text-[11px] text-fg-subtle transition-colors hover:border-line-strong hover:text-fg-muted disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {example.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={startRun}
                  disabled={isRunning}
                  className="btn btn-primary"
                >
                  {isRunning ? "Running" : "Run discovery"}
                  {!isRunning && <ArrowIcon />}
                </button>
              </div>
            </div>
          </section>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-5">
            <div className="space-y-6 xl:col-span-2">
              {/* Agents */}
              <section className="panel overflow-hidden">
                <div className="flex items-center justify-between border-b border-line px-5 py-3">
                  <span className="label-mono">Workflow</span>
                  <span className="font-mono text-[10px] text-fg-subtle">5 stages</span>
                </div>
                <ul className="divide-y divide-line">
                  {AGENTS.map((agent, index) => {
                    const status = statuses[agent.name] ?? "idle";
                    const meta = STATUS_META[status];
                    return (
                      <li key={agent.name} className="flex items-center gap-3 px-5 py-3">
                        <span className="font-mono text-[10px] text-fg-subtle">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] text-fg">{agent.name}</p>
                          <p className="truncate font-mono text-[10px] uppercase tracking-[0.1em] text-fg-subtle">
                            {agent.role}
                          </p>
                        </div>
                        <span className={`flex shrink-0 items-center gap-1.5 ${meta.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                          <span className="font-mono text-[10px] uppercase tracking-[0.1em]">
                            {meta.label}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>

              {/* Log */}
              <section className="panel flex flex-col overflow-hidden">
                <div className="flex items-center justify-between border-b border-line px-5 py-3">
                  <span className="label-mono">Log</span>
                  <span className="font-mono text-[10px] text-fg-subtle">{logs.length} events</span>
                </div>
                <div
                  ref={logContainerRef}
                  className="scroll-thin h-[300px] overflow-y-auto px-5 py-3"
                >
                  {logs.length === 0 ? (
                    <p className="py-10 text-center text-[12px] leading-relaxed text-fg-subtle">
                      No activity. Start a run to stream agent output here.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {logs.map((entry, index) => (
                        <li
                          key={`${entry.time}-${index}`}
                          className="flex gap-2 font-mono text-[11px] leading-relaxed"
                        >
                          <span className="shrink-0 text-fg-subtle/70">{entry.time}</span>
                          <span className={`shrink-0 ${STATUS_META[entry.level].text}`}>
                            {entry.source}
                          </span>
                          <span className="min-w-0 text-fg-muted">{entry.message}</span>
                        </li>
                      ))}
                      {isRunning && (
                        <li className="flex items-center gap-2 font-mono text-[11px] text-accent">
                          <span className="h-1 w-1 animate-pulse rounded-full bg-accent" />
                          awaiting next event
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              </section>
            </div>

            <div className="space-y-6 xl:col-span-3">
              {/* Chart */}
              <section className="panel overflow-hidden">
                <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
                  <div className="flex items-baseline gap-2.5">
                    <span className="label-mono">Pareto front</span>
                    <span className="hidden text-[11.5px] text-fg-subtle sm:inline">
                      Non-dominated candidates
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-fg-subtle">
                    {chartData.length} candidates
                  </span>
                </div>

                <div className="px-1 pb-2 pt-4">
                  {chartData.length > 0 ? (
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 8, right: 28, bottom: 30, left: 4 }}>
                          <CartesianGrid stroke="#1b1f24" strokeDasharray="2 4" />
                          <XAxis
                            type="number"
                            dataKey={numericKeys[0] ?? "x"}
                            stroke="#2b3239"
                            tick={{ fill: "#6b737c", fontSize: 10 }}
                            tickLine={false}
                          >
                            <Label
                              value={axisLabel(0)}
                              position="insideBottom"
                              offset={-16}
                              fill="#9aa1a9"
                              fontSize={11}
                            />
                          </XAxis>
                          <YAxis
                            type="number"
                            dataKey={numericKeys[1] ?? numericKeys[0] ?? "y"}
                            stroke="#2b3239"
                            tick={{ fill: "#6b737c", fontSize: 10 }}
                            tickLine={false}
                            width={56}
                          >
                            <Label
                              value={axisLabel(numericKeys.length > 1 ? 1 : 0)}
                              angle={-90}
                              position="insideLeft"
                              fill="#9aa1a9"
                              fontSize={11}
                              style={{ textAnchor: "middle" }}
                            />
                          </YAxis>
                          <Tooltip
                            cursor={{ stroke: "#2b3239", strokeDasharray: "2 4" }}
                            content={<ChartTooltip />}
                          />
                          <Scatter data={chartData} fill="#c8934e" />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex h-[300px] flex-col items-center justify-center gap-1.5 px-6 text-center">
                      <p className="text-[13px] text-fg-muted">No candidate data</p>
                      <p className="max-w-xs text-[12px] leading-relaxed text-fg-subtle">
                        The front is plotted once the Pareto stage returns materials for the
                        parsed objectives.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Selected candidate */}
              <section className="panel overflow-hidden">
                <div className="flex items-center justify-between border-b border-line px-5 py-3">
                  <span className="label-mono">Selected candidate</span>
                  {finalCandidate && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ok">
                      final
                    </span>
                  )}
                </div>

                {finalCandidate ? (
                  <div className="p-5">
                    <div className="flex flex-wrap items-baseline gap-3">
                      <span className="font-mono text-[22px] tracking-tight text-fg">
                        {finalCandidate.formula}
                      </span>
                      {finalCandidate.material_id && (
                        <span className="rounded border border-line px-2 py-0.5 font-mono text-[10px] text-fg-subtle">
                          {finalCandidate.material_id}
                        </span>
                      )}
                    </div>

                    {candidateEntries.length > 0 ? (
                      <dl className="mt-5 grid grid-cols-1 gap-x-10 sm:grid-cols-2">
                        {candidateEntries.map(([key, value]) => (
                          <div
                            key={key}
                            className="flex items-baseline justify-between gap-4 border-b border-line py-2.5"
                          >
                            <dt className="text-[12px] text-fg-subtle">{pretty(key)}</dt>
                            <dd className="text-right font-mono text-[12px] tabular-nums text-fg-muted">
                              {formatValue(value)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    ) : (
                      <p className="mt-4 text-[12px] text-fg-subtle">
                        No properties were returned with this candidate.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="px-5 py-12 text-center">
                    <p className="text-[13px] text-fg-muted">No candidate selected</p>
                    <p className="mx-auto mt-1.5 max-w-xs text-[12px] leading-relaxed text-fg-subtle">
                      {isRunning
                        ? "Waiting on the feasibility review stage."
                        : "Run a query to see the recommendation and its property values."}
                    </p>
                  </div>
                )}
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  badge,
  value,
  onChange,
  placeholder,
  disabled,
  hint,
}: {
  id: string;
  label: string;
  badge: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled: boolean;
  hint: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[12px] font-medium text-fg-muted">
          {label}
        </label>
        <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-fg-subtle">
          {badge}
        </span>
      </div>
      <input
        id={id}
        type="password"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="field mt-1.5"
      />
      <p className="mt-1.5 text-[11px] leading-relaxed text-fg-subtle">{hint}</p>
    </div>
  );
}

function ExternalLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-fg-muted underline decoration-line-strong underline-offset-2 transition-colors hover:text-accent"
    >
      {label}
    </a>
  );
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: Row }[] }) {
  if (!active || !payload?.length) return null;

  const row = payload[0].payload;
  const keys = Object.keys(row)
    .filter((key) => typeof row[key] === "number")
    .slice(0, 4);

  return (
    <div className="border border-line-strong bg-panel-2 px-3 py-2 shadow-2xl">
      <p className="font-mono text-[11.5px] text-fg">
        {String(row.formula_pretty ?? "Candidate")}
      </p>
      <dl className="mt-2 space-y-1">
        {keys.map((key) => (
          <div key={key} className="flex items-baseline justify-between gap-5">
            <dt className="text-[10.5px] text-fg-subtle">{pretty(key)}</dt>
            <dd className="font-mono text-[10.5px] tabular-nums text-fg-muted">
              {formatValue(row[key])}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
