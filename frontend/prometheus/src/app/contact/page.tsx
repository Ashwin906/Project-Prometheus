'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// --- SVG Icons ---
const IconMail = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/></svg>;
const IconLinkedin = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>;
const IconGithub = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>;
const IconRocket = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>;
const IconSparkles = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>;
const IconArrowRight = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>;
const IconCopy = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const IconCheck = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>;

// --- Animated Background Component ---
const AnimatedBackground = () => {
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, delay: number}>>([]);

  useEffect(() => {
    const generateParticles = () => {
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 20
      }));
      setParticles(newParticles);
    };

    generateParticles();
    const interval = setInterval(generateParticles, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-1 h-1 bg-sky-400/20 rounded-full animate-pulse"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: '3s'
          }}
        />
      ))}
    </div>
  );
};

// --- Contact Card Component ---
const ContactCard: React.FC<{ 
  icon: React.ReactNode; 
  title: string; 
  subtitle: string; 
  value: string; 
  href: string;
  color: string;
  copyable?: boolean;
}> = ({ icon, title, subtitle, value, href, color, copyable = false }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (copyable) {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative bg-gradient-to-br from-${color}-900/20 to-gray-900/50 rounded-2xl p-8 border border-${color}-700/50 hover:border-${color}-500/70 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-${color}-900/20`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-${color}-900/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10">
        <div className={`text-${color}-400 mb-6 group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-${color}-300 transition-colors duration-300">
          {title}
        </h3>
        
        <p className="text-gray-400 mb-4 group-hover:text-gray-300 transition-colors duration-300">
          {subtitle}
        </p>
        
        <div className="flex items-center justify-between">
          <p className="text-lg font-mono text-gray-300 group-hover:text-white transition-colors duration-300 truncate">
            {value}
          </p>
          
          {copyable && (
            <button
              onClick={handleCopy}
              className="ml-4 p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors duration-200 opacity-0 group-hover:opacity-100"
            >
              {copied ? (
                <IconCheck className="text-green-400" />
              ) : (
                <IconCopy className="text-gray-400" />
              )}
            </button>
          )}
        </div>
        
        <div className="mt-4 flex items-center text-${color}-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="text-sm font-medium">Visit Profile</span>
          <IconArrowRight className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
        </div>
      </div>
    </a>
  );
};

// --- Floating Elements ---
const FloatingElement: React.FC<{ 
  children: React.ReactNode; 
  delay: number; 
  duration: number;
  className?: string;
}> = ({ children, delay, duration, className = "" }) => (
  <div 
    className={`absolute ${className}`}
    style={{
      animation: `float ${duration}s ease-in-out infinite`,
      animationDelay: `${delay}s`
    }}
  >
    {children}
  </div>
);

export default function ContactPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="bg-gray-900 text-gray-200 min-h-screen font-sans flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Project <span className="text-sky-400">Prometheus</span>
          </h1>
          <p className="text-gray-400">Loading contact page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen font-sans relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Floating Elements */}
      <FloatingElement delay={0} duration={6} className="top-20 left-10">
        <div className="w-4 h-4 bg-sky-400/30 rounded-full" />
      </FloatingElement>
      <FloatingElement delay={2} duration={8} className="top-40 right-20">
        <div className="w-6 h-6 bg-purple-400/20 rounded-full" />
      </FloatingElement>
      <FloatingElement delay={4} duration={7} className="bottom-40 left-20">
        <div className="w-3 h-3 bg-yellow-400/25 rounded-full" />
      </FloatingElement>
      <FloatingElement delay={1} duration={9} className="bottom-20 right-10">
        <div className="w-5 h-5 bg-green-400/20 rounded-full" />
      </FloatingElement>

      {/* Navigation */}
      <nav className="relative z-20 px-6 py-4 border-b border-gray-700/50 bg-gray-900/80 backdrop-blur-sm sticky top-0">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/landing" className="text-2xl font-bold text-white tracking-wider hover:text-sky-400 transition-colors">
            Project <span className="text-sky-400">Prometheus</span>
          </Link>
          <div className="flex space-x-6">
            <Link href="/landing" className="text-gray-400 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/discover" className="text-gray-400 hover:text-white transition-colors">
              Discover
            </Link>
            <Link href="/future" className="text-gray-400 hover:text-white transition-colors">
              Future
            </Link>
            <Link href="/contact" className="text-sky-400 font-semibold">
              Contact
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-12">
            <div className="inline-flex items-center space-x-2 mb-6">
              <IconSparkles className="text-yellow-400 animate-pulse" />
              <span className="text-yellow-400 font-semibold text-sm uppercase tracking-wider">Let's Connect</span>
              <IconSparkles className="text-yellow-400 animate-pulse" />
            </div>
            
            <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
              Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-purple-400 to-pink-400">Transform</span><br />
              Materials Discovery?
            </h1>
            
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Join the revolution in materials science. Whether you're a researcher, innovator, 
              or simply curious about the future of discovery, let's build something extraordinary together.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16">
            <Link 
              href="/discover" 
              className="group flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-sky-600 to-purple-600 text-white font-bold rounded-xl hover:from-sky-500 hover:to-purple-500 transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-sky-900/30"
            >
              <IconRocket />
              <span>Start Discovering</span>
              <IconArrowRight className="group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            
            <Link 
              href="/future" 
              className="px-8 py-4 border-2 border-gray-600 text-white font-bold rounded-xl hover:border-sky-500 hover:text-sky-400 transition-all duration-300 transform hover:scale-105"
            >
              See Our Vision
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Cards Section */}
      <section className="relative z-10 px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              Get in <span className="text-sky-400">Touch</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Connect with the mind behind Project Prometheus. Let's discuss collaboration, 
              innovation, and the future of AI-driven scientific discovery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <ContactCard
              icon={<IconMail />}
              title="Email"
              subtitle="Direct communication"
              value="ashwin90606@gmail.com"
              href="mailto:ashwin90606@gmail.com"
              color="blue"
              copyable={true}
            />
            
            <ContactCard
              icon={<IconLinkedin />}
              title="LinkedIn"
              subtitle="Professional network"
              value="linkedin.com/in/ashwink06"
              href="https://linkedin.com/in/ashwink06"
              color="purple"
            />
            
            <ContactCard
              icon={<IconGithub />}
              title="GitHub"
              subtitle="Code & projects"
              value="github.com/Ashwin906"
              href="https://github.com/Ashwin906"
              color="green"
            />
          </div>
        </div>
      </section>

      {/* Mission Statement Section */}
      <section className="relative z-10 px-6 py-16 bg-gradient-to-r from-gray-800/30 to-gray-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-8">
              Our <span className="text-sky-400">Mission</span>
            </h2>
            
            <div className="max-w-4xl mx-auto">
              <p className="text-lg text-gray-300 leading-relaxed mb-6">
                Project Prometheus represents more than just a tool—it's a vision for the future of scientific discovery. 
                We're building the infrastructure that will enable humanity to solve its greatest challenges through 
                intelligent, autonomous materials discovery.
              </p>
              
              <p className="text-lg text-gray-300 leading-relaxed mb-8">
                From climate change to energy storage, from healthcare to space exploration, the materials we discover 
                today will shape the world of tomorrow. Join us in this journey to accelerate discovery and unlock 
                the infinite potential of materials science.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-sky-400 mb-2">15+ Years</div>
                  <div className="text-gray-400">Traditional Discovery Time</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-2">Minutes</div>
                  <div className="text-gray-400">With Project Prometheus</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">∞</div>
                  <div className="text-gray-400">Possibilities</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-gray-700/50 bg-gray-900/50">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              Project <span className="text-sky-400">Prometheus</span>
            </h3>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Accelerating the future of materials discovery through AI. 
              Building the tools that will solve humanity's greatest challenges.
            </p>
          </div>
          
          <div className="flex justify-center space-x-8 mb-8">
            <Link href="/landing" className="text-gray-400 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/discover" className="text-gray-400 hover:text-white transition-colors">
              Discover
            </Link>
            <Link href="/future" className="text-gray-400 hover:text-white transition-colors">
              Future
            </Link>
            <Link href="/contact" className="text-sky-400 font-semibold">
              Contact
            </Link>
          </div>
          
          <div className="text-gray-500 text-sm">
            <p>© 2024 Project Prometheus. Accelerating discovery, one material at a time.</p>
          </div>
        </div>
      </footer>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
      `}</style>
    </div>
  );
}

