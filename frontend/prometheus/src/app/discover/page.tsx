'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
import Link from 'next/link';

// --- Type Definitions ---
interface AgentStatus {
  icon: React.ReactNode;
  name: string;
  status: 'idle' | 'thinking' | 'success' | 'error' | 'warning';
  color: string;
}

interface LogEntry {
  time: string;
  message: string;
}

interface MaterialPoint {
  [key: string]: any;
}

interface FinalCandidate {
  formula: string;
  properties: { [key: string]: any };
}

// --- SVG Icons ---
const IconBrain = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-2.5 2.5h-3A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2h3Z"/><path d="M14.5 2A2.5 2.5 0 0 1 17 4.5v15a2.5 2.5 0 0 1-2.5 2.5h-3a2.5 2.5 0 0 1-2.5-2.5v-15A2.5 2.5 0 0 1 11.5 2h3Z"/><path d="M6 16h12"/><path d="M6 12h12"/><path d="M6 8h12"/></svg>;
const IconBeaker = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 3h15"/><path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3"/><path d="M6 14h12"/></svg>;
const IconZap = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2z"/></svg>;
const IconShieldCheck = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>;
const IconClipboardList = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>;
const IconPlay = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const IconRefresh = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>;
const IconExternalLink = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;

// --- UI Components ---
const AgentStatusCard: React.FC<{ agent: AgentStatus }> = ({ agent }) => (
    <div className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg">
        <div className={`text-${agent.color}-400`}>{agent.icon}</div>
        <div className="flex-1">
            <p className="font-semibold text-white">{agent.name}</p>
            <p className="text-sm text-gray-400 capitalize">{agent.status.replace(/_/g, ' ')}</p>
        </div>
        {agent.status === 'thinking' && <div className="w-4 h-4 border-2 border-dashed rounded-full border-sky-400 animate-spin"></div>}
        {agent.status === 'success' && <div className="w-4 h-4 text-emerald-400"><IconShieldCheck /></div>}
    </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload.payload;
    return (
      <div className="p-2 bg-gray-900 border border-gray-700 rounded-md shadow-lg text-sm">
        <p className="font-bold text-sky-300">{data.formula_pretty}</p>
        {Object.keys(data).map(key => {
            if (key!== 'formula_pretty' && typeof data[key] === 'number') {
                return <p key={key} className="text-gray-300">{`${key.replace(/_/g, ' ')}: ${data[key].toFixed(3)}`}</p>
            }
            return null;
        })}
      </div>
    );
  }
  return null;
};

// --- Main App Component ---
export default function DiscoverPage() {
    const [prompt, setPrompt] = useState("Find stable ternary oxides with a high band gap and low formation energy per atom.");
    const [isRunning, setIsRunning] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [chartData, setChartData] = useState<MaterialPoint[]>([]);
    const [finalCandidate, setFinalCandidate] = useState<FinalCandidate | null>(null);
    const [objectives, setObjectives] = useState<string[]>([]);
    const [openaiApiKey, setOpenaiApiKey] = useState('');
    const [googleApiKey, setGoogleApiKey] = useState('');
    const [mpApiKey, setMpApiKey] = useState('');
    const [retryCount, setRetryCount] = useState(0);
    const [hasError, setHasError] = useState(false);
    const logContainerRef = useRef<HTMLDivElement>(null);

    const initialAgents: AgentStatus[] = [
        { icon: <IconBrain />, name: 'Epimetheus', status: 'idle', color: 'blue' },
        { icon: <IconBeaker />, name: 'Athena', status: 'idle', color: 'purple' },
        { icon: <IconZap />, name: 'Hermes', status: 'idle', color: 'yellow' },
        { icon: <IconClipboardList />, name: 'Hephaestus', status: 'idle', color: 'green' },
        { icon: <IconShieldCheck />, name: 'Cassandra', status: 'idle', color: 'red' }
    ];
    const [agents, setAgents] = useState<AgentStatus[]>(initialAgents);

    const addLog = useCallback((message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { time: timestamp, message }]);
    }, []);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    const handleDiscovery = async () => {
        if (!mpApiKey || (!openaiApiKey && !googleApiKey)) {
            alert("Please enter Materials Project API key and at least one LLM API key (OpenAI or Google).");
            return;
        }

        setIsRunning(true);
        setLogs([]);
        setChartData([]);
        setFinalCandidate(null);
        setAgents(initialAgents);
        setObjectives([]);
        setHasError(false);
        setRetryCount(0);

        // EventSource doesn't support POST, so we'll use fetch with streaming
        const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
        const response = await fetch(`${apiBase}/discover`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                goal: prompt,
                openaiApiKey: openaiApiKey,
                googleApiKey: googleApiKey,
                mpApiKey: mpApiKey,
            }),
        });

        if (!response.ok) {
            setHasError(true);
            addLog(`System: HTTP error! status: ${response.status}. Please check your API keys and try again.`);
            setIsRunning(false);
            return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
            setHasError(true);
            addLog('System: No response body reader available. Please try again.');
            setIsRunning(false);
            return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        const handleStreamData = (data: any) => {
            if (data.agent) {
                setAgents(prev => prev.map(a => a.name === data.agent ? {...a, status: data.status} : a));
                if (data.log) addLog(`${data.agent}: ${data.log}`);
            }
            if (data.pareto_front) {
                setChartData(data.pareto_front);
            }
            if (data.final_candidate) {
                setFinalCandidate(data.final_candidate);
                if (data.log) addLog(`System: ${data.log}`);
                setIsRunning(false);
            }
        };

        const processStream = async () => {
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                handleStreamData(data);
                            } catch (parseError) {
                                console.error('JSON parse error:', parseError);
                                addLog("System: Error parsing server response.");
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Stream processing error:', error);
                addLog("System: An error occurred while processing the stream. Please try again.");
                setHasError(true);
                setIsRunning(false);
            }
        };

        processStream();
    };

    const handleRetry = () => {
        if (retryCount < 3) {
            setRetryCount(prev => prev + 1);
            addLog(`System: Retry attempt ${retryCount + 1}/3...`);
            handleDiscovery();
        } else {
            addLog("System: Maximum retry attempts reached. Please check your configuration and try again later.");
        }
    };
    
    const getAxisProps = (index: number) => {
        if (objectives.length > index) {
            const [action, name] = objectives[index].split(' ');
            return { dataKey: name, name: `${name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} (${action})` };
        }
        return { dataKey: 'x', name: 'Objective 1' };
    };
    
    const axis1 = getAxisProps(0);
    const axis2 = getAxisProps(1);

    return (
        <div className="bg-gray-900 text-gray-200 min-h-screen font-sans flex flex-col">
            <header className="px-6 py-4 border-b border-gray-700/50 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <Link href="/" className="text-2xl font-bold text-white tracking-wider hover:text-sky-400 transition-colors">
                        Project <span className="text-sky-400">Prometheus</span>
                    </Link>
                    <div className="flex items-center space-x-6">
                        <p className="text-sm text-gray-400">The AI Inverse Design Strategist</p>
                        <div className="flex space-x-4">
                            <Link href="/landing" className="text-gray-400 hover:text-white transition-colors">
                                Home
                            </Link>
                            <Link href="/discover" className="text-sky-400 font-semibold">
                                Discover
                            </Link>
                            <Link href="/future" className="text-gray-400 hover:text-white transition-colors">
                                Future
                            </Link>
                            <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                                Contact
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex flex-1">
                <aside className="w-80 bg-gray-900/50 p-4 border-r border-gray-700/50 flex flex-col">
                    <h2 className="text-lg font-semibold mb-4 text-white">Configuration</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-400">OpenAI API Key (Optional)</label>
                            <input type="password" value={openaiApiKey} onChange={e => setOpenaiApiKey(e.target.value)} className="w-full mt-1 p-2 bg-gray-800 border border-gray-600 rounded-md text-sm" placeholder="sk-..." />
                            <p className="text-xs text-gray-500 mt-1">If OpenAI key doesn't work, try with Google Gemini</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-400">Google API Key (Optional)</label>
                            <input type="password" value={googleApiKey} onChange={e => setGoogleApiKey(e.target.value)} className="w-full mt-1 p-2 bg-gray-800 border border-gray-600 rounded-md text-sm" placeholder="AI..." />
                            <p className="text-xs text-gray-500 mt-1">Get your key at <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 inline-flex items-center">makersuite.google.com <IconExternalLink /></a></p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-400">Materials Project API Key (Required)</label>
                            <input type="password" value={mpApiKey} onChange={e => setMpApiKey(e.target.value)} className="w-full mt-1 p-2 bg-gray-800 border border-gray-600 rounded-md text-sm" placeholder="Get your free key..." />
                            <p className="text-xs text-gray-500 mt-1">Get your free key at <a href="https://materialsproject.org/api" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 inline-flex items-center">materialsproject.org/api <IconExternalLink /></a></p>
                        </div>
                    </div>
                    
                    {/* Development Notice */}
                    <div className="mt-6 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-md">
                        <p className="text-xs text-yellow-300 font-semibold mb-1">⚠️ Development Notice</p>
                        <p className="text-xs text-yellow-200">Project Prometheus is still in development. If any agent fails, try retrying the discovery process.</p>
                    </div>

                    {/* Retry Section */}
                    {hasError && (
                        <div className="mt-4 p-3 bg-red-900/20 border border-red-700/50 rounded-md">
                            <p className="text-xs text-red-300 font-semibold mb-2">❌ Error Detected</p>
                            <p className="text-xs text-red-200 mb-3">An error occurred during discovery. You can retry up to 3 times.</p>
                            <button
                                onClick={handleRetry}
                                disabled={retryCount >= 3 || isRunning}
                                className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white text-xs font-semibold rounded-md hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200"
                            >
                                <IconRefresh />
                                <span>Retry ({retryCount}/3)</span>
                            </button>
                        </div>
                    )}

                    <div className="mt-auto text-xs text-gray-500">
                        <p>Your API keys are used only for this session and are not stored.</p>
                        <p className="mt-1">At least one LLM API key (OpenAI or Google) is required.</p>
                    </div>
                </aside>

                <main className="flex-grow p-6 w-full">
                    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 shadow-2xl shadow-sky-900/10 mb-6">
                        <label htmlFor="prompt" className="block text-lg font-semibold mb-2 text-sky-300">Your Discovery Goal</label>
                        <div className="flex space-x-4">
                            <textarea
                                id="prompt"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="w-full p-3 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-sky-500 focus:outline-none transition duration-200 resize-none"
                                rows={2}
                                placeholder="e.g., Find a non-toxic, earth-abundant catalyst for green hydrogen production..."
                                disabled={isRunning}
                            />
                            <button
                                onClick={handleDiscovery}
                                disabled={isRunning}
                                className="flex items-center justify-center space-x-2 px-6 bg-sky-600 text-white font-bold rounded-md hover:bg-sky-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                            >
                                <IconPlay />
                                <span>{isRunning? 'Discovering...' : 'Start'}</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 flex flex-col gap-6">
                            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                                <h2 className="text-lg font-semibold mb-4 text-white">Agent Workflow</h2>
                                <div className="space-y-3">
                                    {agents.map(agent => <AgentStatusCard key={agent.name} agent={agent} />)}
                                </div>
                            </div>
                            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 flex-grow flex flex-col">
                                <h2 className="text-lg font-semibold mb-4 text-white">AI Thought Process</h2>
                                <div ref={logContainerRef} className="flex-grow bg-gray-900/70 rounded-md p-3 overflow-y-auto h-64 lg:h-auto">
                                    <ul className="space-y-2 text-sm">
                                        {logs.map((log, index) => (
                                            <li key={index} className="flex items-start">
                                                <span className="text-gray-500 mr-2">{log.time}</span>
                                                <p className="text-gray-300">{log.message}</p>
                                            </li>
                                        ))}
                                        {isRunning && <li className="flex items-center text-sky-400"><div className="w-2 h-2 bg-sky-400 rounded-full mr-2 animate-pulse"></div> Thinking...</li>}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2 bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                            <h2 className="text-lg font-semibold mb-4 text-white">Discovery Landscape: Pareto Front</h2>
                            <div className="w-full h-72 mb-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                                        <XAxis type="number" dataKey={axis1.dataKey} stroke="#A0AEC0">
                                            <Label value={axis1.name} offset={-15} position="insideBottom" fill="#A0AEC0" />
                                        </XAxis>
                                        <YAxis type="number" dataKey={axis2.dataKey} stroke="#A0AEC0">
                                            <Label value={axis2.name} angle={-90} position="insideLeft" fill="#A0AEC0" style={{ textAnchor: 'middle' }} />
                                        </YAxis>
                                        <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                                        <Scatter name="Optimal Candidates" data={chartData || []} fill="#0891b2" />
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </div>
                            
                            <h2 className="text-lg font-semibold mb-4 text-white">Best Candidate Found</h2>
                            {finalCandidate? (
                                <div className="bg-gradient-to-br from-sky-900/50 to-gray-900/50 rounded-lg p-6 border border-sky-700/50">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-2xl font-bold text-sky-300">{finalCandidate.formula}</h3>
                                        </div>
                                        <div className="text-xs font-mono px-2 py-1 bg-emerald-900/50 text-emerald-300 rounded border border-emerald-700">OPTIMAL</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        {Object.entries(finalCandidate.properties).map(([key, value]) => (
                                            <div key={key}>
                                                <p className="text-sm text-gray-400">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                                                <p className="text-lg font-semibold text-white">{typeof value === 'number' ? value.toFixed(3) : value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-10 text-gray-500">
                                    {isRunning? "Awaiting final results from the Reporter agent..." : "Run a discovery campaign to see results here."}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
