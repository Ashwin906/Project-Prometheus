'use client';

import React from 'react';
import Link from 'next/link';

// --- SVG Icons ---
const IconRocket = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>;
const IconShip = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21c.83.64 2.08 1 3.5 1s2.67-.36 3.5-1"/><path d="M20 21c.83.64 2.08 1 3.5 1s2.67-.36 3.5-1"/><path d="M2 16h4"/><path d="M18 16h4"/><path d="M4 18.5V7a2 2 0 0 1 2-2h.5"/><path d="M9 5h8.5a2 2 0 0 1 1.5.5l1.5 1.5"/><path d="M22 7v10.5a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 17.5V7"/><path d="M12 5v5"/><path d="M12 15l.01 0"/></svg>;
const IconBrain = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-2.5 2.5h-3A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2h3Z"/><path d="M14.5 2A2.5 2.5 0 0 1 17 4.5v15a2.5 2.5 0 0 1-2.5 2.5h-3a2.5 2.5 0 0 1-2.5-2.5v-15A2.5 2.5 0 0 1 11.5 2h3Z"/><path d="M6 16h12"/><path d="M6 12h12"/><path d="M6 8h12"/></svg>;
const IconCpu = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v6"/><path d="M15 1v6"/><path d="M9 17v6"/><path d="M15 17v6"/><path d="M1 9h6"/><path d="M17 9h6"/><path d="M1 15h6"/><path d="M17 15h6"/></svg>;
const IconArrowRight = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>;

const VisionCard: React.FC<{ 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  timeline: string;
  color: string;
}> = ({ icon, title, description, timeline, color }) => (
  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 hover:border-sky-500/50 transition-all duration-300">
    <div className={`text-${color}-400 mb-4`}>{icon}</div>
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-sky-300 font-semibold mb-3">{timeline}</p>
    <p className="text-gray-300 text-sm leading-relaxed">{description}</p>
  </div>
);

export default function FuturePage() {
  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen font-sans">
      {/* Navigation */}
      <nav className="px-6 py-4 border-b border-gray-700/50 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white tracking-wider">
            Project <span className="text-sky-400">Prometheus</span>
          </h1>
          <div className="flex space-x-6">
            <Link href="/landing" className="text-gray-400 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/discover" className="text-gray-400 hover:text-white transition-colors">
              Discover
            </Link>
            <Link href="/future" className="text-sky-400 font-semibold">
              Future
            </Link>
            <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-16">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <IconShip className="mx-auto mb-6 text-sky-400" />
            <h1 className="text-5xl font-bold text-white mb-6">
              Our North Star: The <span className="text-sky-400">Autonomous Ship</span> for the Ocean of Discovery
            </h1>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Projects like Google's GNoME have given us an incredible gift: a near-complete map 
              of the known world of stable materials. They show us the continents and coastlines. 
              But a map is only useful if you have a vessel to explore with.
            </p>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="px-6 py-16 bg-gray-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">
                Building the Discovery Vessel
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                Our vision for Project Prometheus is to build that ship. Not just any ship, 
                but a fully autonomous discovery vessel designed to sail the vast, uncharted 
                ocean of materials science.
              </p>
              <p className="text-gray-300 text-lg leading-relaxed">
                Its mission is not to re-visit the shores cataloged by others, but to venture 
                beyond the map's edge. Using generative AI, Prometheus will learn the fundamental 
                laws of chemistry and physics to dream up and design novel materials that have 
                never existed before—atomic structures conceived by an AI mind to solve humanity's 
                greatest challenges.
              </p>
            </div>
            <div className="bg-gradient-to-br from-sky-900/20 to-gray-900/50 rounded-xl p-8 border border-sky-700/50">
              <h3 className="text-xl font-bold text-sky-400 mb-4">The Ultimate Destination</h3>
              <p className="text-gray-300 mb-4">
                The ultimate destination is a "closed-loop" system where our AI not only designs 
                a new material on Monday but directs a robotic lab to synthesize it on Tuesday 
                and learns from the real-world results by Wednesday.
              </p>
              <p className="text-gray-300">
                This creates a relentless, self-improving cycle of invention, accelerating the 
                pace of discovery from decades to mere days.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              The Roadmap to Discovery
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              We are not building a better search engine for science; we are building an engine for discovery itself.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <VisionCard
              icon={<IconBrain />}
              title="Phase 1: Enhanced AI Agents"
              description="Expand our agent capabilities with more sophisticated reasoning, better natural language understanding, and improved multi-objective optimization algorithms. Add specialized agents for different material classes and applications."
              timeline="Q1-Q2 2024"
              color="blue"
            />
            
            <VisionCard
              icon={<IconCpu />}
              title="Phase 2: Generative Materials Design"
              description="Implement generative AI models that can design novel atomic structures from scratch. Train on quantum mechanical principles to ensure physical feasibility and stability predictions."
              timeline="Q3-Q4 2024"
              color="purple"
            />
            
            <VisionCard
              icon={<IconRocket />}
              title="Phase 3: Autonomous Synthesis"
              description="Integrate with robotic synthesis systems to automatically produce discovered materials. Implement real-time feedback loops between AI predictions and experimental validation."
              timeline="Q1-Q2 2025"
              color="green"
            />
            
            <VisionCard
              icon={<IconShip />}
              title="Phase 4: Closed-Loop Discovery"
              description="Complete the autonomous discovery cycle with self-improving AI that learns from synthesis results and continuously refines its models. Achieve true autonomous materials discovery."
              timeline="Q3-Q4 2025"
              color="yellow"
            />
            
            <VisionCard
              icon={<IconCpu />}
              title="Phase 5: Multi-Domain Expansion"
              description="Extend beyond materials to other scientific domains: drug discovery, catalyst design, and beyond. Create a universal AI discovery platform for all of science."
              timeline="2026+"
              color="red"
            />
            
            <VisionCard
              icon={<IconRocket />}
              title="Phase 6: Global Impact"
              description="Deploy at scale to address humanity's greatest challenges: climate change, energy storage, healthcare, and sustainable development. Make breakthrough discoveries accessible to all."
              timeline="2027+"
              color="sky"
            />
          </div>
        </div>
      </section>

      {/* Current Status Section */}
      <section className="px-6 py-16 bg-gray-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-6">
              Current Development Status
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Project Prometheus is currently in active development. We&apos;re building the foundation 
              for the future of autonomous scientific discovery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-emerald-900/20 to-gray-900/50 rounded-xl p-8 border border-emerald-700/50">
              <h3 className="text-xl font-bold text-emerald-400 mb-4">✅ Completed</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <span className="text-emerald-400 mr-2">•</span>
                  <span>Multi-agent architecture with 5 specialized AI agents</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-400 mr-2">•</span>
                  <span>Materials Project database integration</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-400 mr-2">•</span>
                  <span>Pareto optimization for multi-objective discovery</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-400 mr-2">•</span>
                  <span>Real-time streaming interface</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-400 mr-2">•</span>
                  <span>Natural language goal interpretation</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-yellow-900/20 to-gray-900/50 rounded-xl p-8 border border-yellow-700/50">
              <h3 className="text-xl font-bold text-yellow-400 mb-4">🚧 In Progress</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">•</span>
                  <span>Enhanced agent reasoning capabilities</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">•</span>
                  <span>Improved property mapping and constraint handling</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">•</span>
                  <span>Advanced visualization and analysis tools</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">•</span>
                  <span>API stability and error handling improvements</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">•</span>
                  <span>User experience enhancements</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Join the Discovery Revolution
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Be part of the future of scientific discovery. Help us build the tools that will 
            solve humanity&apos;s greatest challenges.
          </p>
          <div className="flex justify-center space-x-4">
            <Link 
              href="/discover" 
              className="flex items-center space-x-2 px-8 py-4 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-500 transition-all duration-200 transform hover:scale-105"
            >
              <span>Try It Now</span>
              <IconArrowRight />
            </Link>
            <Link 
              href="/" 
              className="px-8 py-4 border border-gray-600 text-white font-bold rounded-lg hover:border-sky-500 hover:text-sky-400 transition-all duration-200"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-gray-700/50 bg-gray-900/50">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-400">
            Project Prometheus - Building the Future of Scientific Discovery
          </p>
        </div>
      </footer>
    </div>
  );
}
