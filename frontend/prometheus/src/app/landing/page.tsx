'use client';

import React from 'react';
import Link from 'next/link';

// --- SVG Icons ---
const IconBrain = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-2.5 2.5h-3A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2h3Z"/><path d="M14.5 2A2.5 2.5 0 0 1 17 4.5v15a2.5 2.5 0 0 1-2.5 2.5h-3a2.5 2.5 0 0 1-2.5-2.5v-15A2.5 2.5 0 0 1 11.5 2h3Z"/><path d="M6 16h12"/><path d="M6 12h12"/><path d="M6 8h12"/></svg>;
const IconBeaker = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 3h15"/><path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3"/><path d="M6 14h12"/></svg>;
const IconZap = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2z"/></svg>;
const IconShieldCheck = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>;
const IconClipboardList = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>;
const IconArrowRight = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>;
const IconRocket = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>;

const AgentCard: React.FC<{ 
  icon: React.ReactNode; 
  name: string; 
  role: string; 
  description: string; 
  color: string; 
}> = ({ icon, name, role, description, color }) => (
  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 hover:border-sky-500/50 transition-all duration-300">
    <div className={`text-${color}-400 mb-4`}>{icon}</div>
    <h3 className="text-xl font-bold text-white mb-2">{name}</h3>
    <p className="text-sky-300 font-semibold mb-3">{role}</p>
    <p className="text-gray-300 text-sm leading-relaxed">{description}</p>
  </div>
);

export default function LandingPage() {
  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen font-sans">
      {/* Navigation */}
      <nav className="px-6 py-4 border-b border-gray-700/50 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white tracking-wider">
            Project <span className="text-sky-400">Prometheus</span>
          </h1>
          <div className="flex space-x-6">
            <Link href="/landing" className="text-sky-400 font-semibold">
              Home
            </Link>
            <Link href="/discover" className="text-gray-400 hover:text-white transition-colors">
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
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-16">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <IconRocket className="mx-auto mb-6 text-sky-400" />
            <h1 className="text-5xl font-bold text-white mb-6">
              The <span className="text-sky-400">AI Scientist</span> That Never Sleeps
            </h1>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Project Prometheus is an autonomous AI scientist that accelerates materials discovery 
              from 15 years to minutes, turning the climate crisis into a sprint we can win.
            </p>
          </div>
          
          <div className="flex justify-center space-x-4">
            <Link 
              href="/discover" 
              className="flex items-center space-x-2 px-8 py-4 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-500 transition-all duration-200 transform hover:scale-105"
            >
              <span>Start Discovering</span>
              <IconArrowRight />
            </Link>
            <Link 
              href="/future" 
              className="px-8 py-4 border border-gray-600 text-white font-bold rounded-lg hover:border-sky-500 hover:text-sky-400 transition-all duration-200"
            >
              Our Vision
            </Link>
          </div>
        </div>
      </section>

      {/* Problem & Solution Section */}
      <section className="px-6 py-16 bg-gray-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">
                The Problem: A Race Against Time We're Losing 🚀
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                Right now, the quest for breakthrough materials—the key to better batteries, 
                next-gen solar panels, and a sustainable future—is like searching for a single 
                grain of sand on a global beach, by hand.
              </p>
              <p className="text-gray-300 text-lg leading-relaxed">
                It's a slow, brutally expensive process, often taking scientists over 15 years 
                and millions of dollars to find just one useful material. This pace isn't just 
                slow; it's a critical bottleneck that puts our climate goals dangerously out of reach.
              </p>
            </div>
            <div className="bg-gradient-to-br from-red-900/20 to-gray-900/50 rounded-xl p-8 border border-red-700/50">
              <h3 className="text-xl font-bold text-red-400 mb-4">The Crisis</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <span className="text-red-400 mr-2">•</span>
                  <span>15+ years to discover one material</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-400 mr-2">•</span>
                  <span>Millions of dollars per discovery</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-400 mr-2">•</span>
                  <span>20th-century methods for 21st-century crisis</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-400 mr-2">•</span>
                  <span>Climate goals slipping away</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="bg-gradient-to-br from-sky-900/20 to-gray-900/50 rounded-xl p-8 border border-sky-700/50">
              <h3 className="text-xl font-bold text-sky-400 mb-4">The Solution</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <span className="text-sky-400 mr-2">•</span>
                  <span>AI that explores millions of possibilities</span>
                </li>
                <li className="flex items-start">
                  <span className="text-sky-400 mr-2">•</span>
                  <span>Understands complex trade-offs</span>
                </li>
                <li className="flex items-start">
                  <span className="text-sky-400 mr-2">•</span>
                  <span>Invents novel materials not in databases</span>
                </li>
                <li className="flex items-start">
                  <span className="text-sky-400 mr-2">•</span>
                  <span>15-year marathon becomes a sprint</span>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">
                The Solution: An AI Scientist That Never Sleeps
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                Project Prometheus isn't just another search tool; it's an autonomous AI scientist 
                in a box. We've assembled a dream team of specialized AI agents who work together 
                to automate the entire scientific discovery process.
              </p>
              <p className="text-gray-300 text-lg leading-relaxed">
                Instead of a human manually testing a few ideas, our AI team can intelligently 
                explore millions of possibilities, understand complex trade-offs, and invent novel 
                materials that don't exist in any database.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="px-6 py-16 bg-gray-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              Meet the Prometheus Team: Your AI Dream Team 🧠
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Project Prometheus is powered by a crew of five specialized AI agents, 
              each with a critical role. Think of them as your personal, super-intelligent research group.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AgentCard
              icon={<IconBrain />}
              name="Epimetheus"
              role="The Visionary Translator 🗣️"
              description="Epimetheus is the master communicator. He listens to your high-level, human goal—like 'I need a better battery material'—and translates it into the precise, mathematical language the AI team can execute. He defines the mission's objectives and constraints, ensuring everyone knows exactly what they're looking for."
              color="blue"
            />
            
            <AgentCard
              icon={<IconBeaker />}
              name="Athena"
              role="The Master Tactician 🗺️"
              description="With the mission defined, Athena devises the brilliant plan of attack. She is the grand strategist who determines the most efficient way to search the vast universe of chemical possibilities. She formulates the perfect query to gather the exact data needed, wasting no time or resources."
              color="purple"
            />
            
            <AgentCard
              icon={<IconZap />}
              name="Hermes"
              role="The Swift Data Messenger ⚡"
              description="As the team's courier, Hermes is all about speed and access. Armed with Athena's plan, he instantly connects to global materials databases (like the Materials Project) and retrieves mountains of relevant data in the blink of an eye, bringing back the raw ingredients for discovery."
              color="yellow"
            />
            
            <AgentCard
              icon={<IconClipboardList />}
              name="Hephaestus"
              role="The Digital Craftsman 🔨"
              description="Hephaestus is the master artisan who forges raw data into profound knowledge. He takes the information gathered by Hermes and performs the most critical calculation: identifying the Pareto Front. This reveals the optimal trade-offs between conflicting properties (like performance vs. cost)."
              color="green"
            />
            
            <AgentCard
              icon={<IconShieldCheck />}
              name="Cassandra"
              role="The Guardian of Reality 🔮"
              description="Cassandra has the crucial final say. She is the pragmatist who keeps the team grounded. She scrutinizes the 'perfect' materials identified by Hephaestus and assesses their real-world viability. She answers the most important question: 'Is this material stable, and can we actually make it?'"
              color="red"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Accelerate Discovery?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join the revolution in materials science. Start discovering breakthrough materials today.
          </p>
          <div className="flex justify-center space-x-4">
            <Link 
              href="/discover" 
              className="flex items-center space-x-2 px-8 py-4 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-500 transition-all duration-200 transform hover:scale-105"
            >
              <span>Start Your Discovery</span>
              <IconArrowRight />
            </Link>
            <Link 
              href="/future" 
              className="px-8 py-4 border border-gray-600 text-white font-bold rounded-lg hover:border-sky-500 hover:text-sky-400 transition-all duration-200"
            >
              See Our Vision
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-gray-700/50 bg-gray-900/50">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-400">
            Project Prometheus - Accelerating the Future of Materials Discovery
          </p>
        </div>
      </footer>
    </div>
  );
}
