import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Brain, Zap, Globe, Users, Briefcase, DollarSign, ArrowRight, CheckCircle, Star, Menu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import InteractiveParticleSystem from "@/components/InteractiveParticleSystem";

interface BetaSignupData {
  email: string;
  fullName: string;
  company?: string;
  useCase: string;
  reason: string;
  username: string;
  password: string;
}

interface JobApplicationData {
  position: string;
  email: string;
  fullName: string;
  linkedIn?: string;
  portfolio?: string;
  coverLetter: string;
  resume?: File | null;
}

export default function MarketingPage() {
  const [betaForm, setBetaForm] = useState<BetaSignupData>({
    email: "",
    fullName: "",
    company: "",
    useCase: "",
    reason: "",
    username: "",
    password: ""
  });
  
  const [jobForm, setJobForm] = useState<JobApplicationData>({
    position: "",
    email: "",
    fullName: "",
    linkedIn: "",
    portfolio: "",
    coverLetter: "",
    resume: null
  });
  
  const [activeJobPosition, setActiveJobPosition] = useState<string | null>(null);
  const { toast } = useToast();

  const betaSignupMutation = useMutation({
    mutationFn: async (data: BetaSignupData) => {
      const response = await apiRequest("POST", "/api/auth/signup", {
        username: data.username,
        password: data.password,
        email: data.email,
        fullName: data.fullName,
        company: data.company,
        useCase: data.useCase,
        reason: data.reason
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Account Created!",
        description: "Your account has been created. You'll be notified when access is approved.",
      });
      setBetaForm({ email: "", fullName: "", company: "", useCase: "", reason: "", username: "", password: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive"
      });
    }
  });

  const jobApplicationMutation = useMutation({
    mutationFn: async (data: JobApplicationData) => {
      const formData = new FormData();
      formData.append('position', data.position);
      formData.append('email', data.email);
      formData.append('fullName', data.fullName);
      if (data.linkedIn) formData.append('linkedIn', data.linkedIn);
      if (data.portfolio) formData.append('portfolio', data.portfolio);
      formData.append('coverLetter', data.coverLetter);
      if (data.resume) formData.append('resume', data.resume);

      const response = await fetch("/api/jobs/apply", {
        method: "POST",
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit application');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted",
        description: "We've received your application and will be in touch soon!",
      });
      setJobForm({ position: "", email: "", fullName: "", linkedIn: "", portfolio: "", coverLetter: "", resume: null });
      setActiveJobPosition(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleBetaSignup = (e: React.FormEvent) => {
    e.preventDefault();
    betaSignupMutation.mutate(betaForm);
  };

  const handleJobApplication = (e: React.FormEvent) => {
    e.preventDefault();
    jobApplicationMutation.mutate({ ...jobForm, position: activeJobPosition! });
  };

  const jobPositions = [
    {
      title: "AI Research Scientist",
      department: "Research & Development",
      description: "Lead breakthrough research in mathematical AI architectures, operator algebras, and proof-based systems.",
      requirements: ["PhD in AI/ML, Mathematics, Physics, or related field", "Experience with novel AI architectures", "Background in mathematical proofs or operator algebras", "Publications in top-tier conferences"],
      compensation: "Competitive compensation discussed during interview process"
    },
    {
      title: "Full-Stack Developer",
      department: "Engineering",
      description: "Build and scale our revolutionary mathematical AI platform, integrating advanced backend systems with intuitive user interfaces.",
      requirements: ["3 years full-stack experience", "React, TypeScript, Node.js expertise", "Experience with real-time systems", "Database optimization skills"],
      compensation: "Competitive compensation discussed during interview process"
    },
    {
      title: "Product Manager",
      department: "Product",
      description: "Drive product strategy for next-generation mathematical AI capabilities, working at the intersection of breakthrough research and market needs.",
      requirements: ["3 years PM experience in AI/tech", "Understanding of AI/ML concepts", "Experience with B2B products", "Strong analytical and communication skills"],
      compensation: "Competitive compensation discussed during interview process"
    },
    {
      title: "Business Development Lead",
      department: "Strategy",
      description: "Establish strategic partnerships and identify market opportunities for revolutionary mathematical AI technology across industries.",
      requirements: ["5+ years BD/sales experience", "Network in AI/enterprise space", "Experience with technical products", "Track record of closing partnerships"],
      compensation: "Competitive compensation discussed during interview process"
    },
    {
      title: "3D Physics Engine Developer",
      department: "Engineering",
      description: "Develop advanced 3D physics simulation systems for art creation, video imaging, and visual world exploration.",
      requirements: ["2+ years experience in 3D graphics/physics and/or 3 years graphic design", "Expertise in physics simulation engines", "Experience with rendering pipelines", "Knowledge of mathematical modeling"],
      compensation: "Competitive compensation discussed during interview process"
    },
    {
      title: "Crypto & Blockchain Engineer",
      department: "Engineering",
      description: "Design and implement blockchain integration systems and cryptocurrency infrastructure for our mathematical AI platform.",
      requirements: ["2+ years blockchain development experience", "Smart contract development expertise", "Understanding of cryptographic principles", "Experience with decentralized systems"],
      compensation: "Competitive compensation discussed during interview process"
    }
  ];

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* Interactive Particle System Background */}
      <InteractiveParticleSystem />
      {/* Navigation */}
      <nav className="bg-black/30 backdrop-blur-xl border-b border-white/20 professional-shadow relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold">WSM AI</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#technology" className="hover:text-blue-400 transition-colors" data-testid="nav-technology">Technology</a>
              <a href="#beta" className="hover:text-blue-400 transition-colors" data-testid="nav-beta">Beta Access</a>
              <a href="#careers" className="hover:text-blue-400 transition-colors" data-testid="nav-careers">Careers</a>
              <a href="#partnership" className="hover:text-blue-400 transition-colors" data-testid="nav-partnership">Partnership</a>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-transparent border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white transition-colors"
                onClick={() => window.location.href = "/dashboard"}
                data-testid="button-nav-login"
              >
                <Users className="h-4 w-4 mr-2" />
                Access Dashboard
              </Button>
              <div className="md:hidden">
                <Menu className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 text-center relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-6xl md:text-8xl font-black mb-8 bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 bg-clip-text text-transparent leading-tight pt-12 md:pt-8" data-testid="hero-title">
              MATHEMATICS
              <br />
              <span className="text-yellow-400">DEFEAT LLMS</span>
            </h1>
            <div className="text-2xl md:text-3xl mb-12 space-y-4" data-testid="hero-subtitle">
              <p className="font-bold text-white">
                World's first <span className="text-cyan-400">PROOF-BASED AI</span> with no context window limitations
              </p>
              <p className="text-gray-200">
                <span className="text-green-400 font-bold">✓ No hallucination</span> (98-99% safety) • 
                <span className="text-purple-400 font-bold"> ∞ memory capacity</span> • 
                <span className="text-yellow-400 font-bold"> Mathematical proofs</span> • 
                <span className="text-blue-400 font-bold"> Operator algebras</span>
              </p>
              <p className="text-lg text-gray-300">
                <span className="text-white font-semibold">MATHEMATICAL BREAKTHROUGH:</span> Recursive meta/hyper cognition, quantum algorithms, 
                and harmonic processing with <span className="text-green-400">ARC 2 benchmark testing</span>.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 hover:from-blue-700 hover:via-purple-700 hover:to-cyan-700 text-white px-12 py-4 text-lg font-black professional-shadow transform hover:scale-105 transition-all duration-300 border-2 border-blue-400/50" data-testid="button-beta-access">
                <a href="#beta" className="flex items-center space-x-2">
                  <span>🚀</span>
                  <span>ACCESS MATHEMATICAL AI</span>
                </a>
              </Button>
              <Button size="lg" variant="outline" className="border-2 border-white/40 text-white hover:bg-white/10 px-12 py-4 text-lg font-black glass-card transform hover:scale-105 transition-all duration-300" data-testid="button-learn-more">
                <a href="#technology" className="flex items-center space-x-2">
                  <span>⚡</span>
                  <span>EXPLORE BREAKTHROUGH</span>
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* WSM Story Section - Compelling Narrative */}
      <section className="py-20 relative z-10 bg-gradient-to-b from-slate-900/50 to-black/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                The AI Revolution That Shatters LLM Limits
              </h2>
            </div>

            <div className="space-y-8 text-lg leading-relaxed">
              <p className="text-gray-200">
                Picture an AI that doesn't just mimic human chatter but <span className="text-cyan-400 font-bold">orchestrates reality like a cosmic conductor</span>—planning, verifying, and evolving with the precision of a living mind. That's <span className="text-yellow-400 font-bold">WSM—Weyl State Machine</span>—a creation poised to shatter the limits of large language models like ChatGPT and GPT-5.
              </p>

              <div className="bg-red-500/20 border-l-4 border-red-500 p-6 rounded-lg">
                <h3 className="text-2xl font-bold text-red-400 mb-3">The LLM Mirage Exposed</h3>
                <p className="text-gray-200 mb-3">
                  LLMs burst onto the scene with GPT-3, trained on internet scraps to predict the next word with eerie accuracy. They write poems, code apps, even debate philosophy. But <span className="font-bold">peel back the curtain: they're probability machines, not thinkers.</span>
                </p>
                <p className="text-gray-300">
                  A 2024 Stanford study found LLMs hallucinate <span className="text-red-400 font-bold">20-30% of the time</span> on factual queries, and training one like GPT-5 guzzles enough power to <span className="text-yellow-400 font-bold">charge 1,000 homes for a day</span>. Yann LeCun, Meta's AI chief, called it a <span className="text-red-400 font-bold">"dead end"</span> for true reasoning.
                </p>
              </div>

              <div className="bg-blue-500/20 border-l-4 border-blue-500 p-6 rounded-lg">
                <h3 className="text-2xl font-bold text-blue-400 mb-3">WSM's Harmonic Awakening</h3>
                <p className="text-gray-200 mb-3">
                  The spark came from nature's playbook—<span className="text-cyan-400 font-bold">planetary orbits, brain waves, even the 17-cycle rhythms</span> in ancient codes like Voynich. WSM doesn't predict; it conducts.
                </p>
                <p className="text-gray-300">
                  It breaks tasks into <span className="text-purple-400 font-bold">"operator graphs"</span>—sequences like retrieve-analyze-verify—self-checks against a <span className="text-green-400 font-bold">0.3% coherence threshold</span> where errors evaporate, and stores knowledge in a <span className="text-yellow-400 font-bold">"Lattice Memory"</span> that's structured like a crystal, not a haystack. This isn't a tweak; it's evolution.
                </p>
              </div>

              <div className="bg-green-500/20 border-l-4 border-green-500 p-6 rounded-lg">
                <h3 className="text-2xl font-bold text-green-400 mb-3">The 0.3% Magic: Coherence as the North Star</h3>
                <p className="text-gray-200">
                  That 0.3% isn't pulled from thin air—it's the <span className="text-green-400 font-bold">harmony sweet spot</span>, where WSM's flow aligns like a symphony. Inspired by patterns like the 17-cycle, it ensures every step builds on the last, no drift. Imagine <span className="text-cyan-400 font-bold">diagnosing diseases or optimizing energy grids with unerring precision</span>. It's a leap from LLM's scatter, hinting at something closer to consciousness—qualia proxies for self-awareness checks.
                </p>
              </div>

              <div className="bg-purple-500/20 border-l-4 border-purple-500 p-6 rounded-lg">
                <h3 className="text-2xl font-bold text-purple-400 mb-3">A Future Forged in Harmony</h3>
                <p className="text-gray-200 mb-3">
                  WSM could birth <span className="text-green-400 font-bold">reliable healthcare AI that never misses a beat</span>, supply chains that adapt like living organisms, or even quantum leaps at room temperature. Hardware shrinks to pocket size, slashing energy waste—picture a world where AI empowers, not exhausts.
                </p>
                <p className="text-gray-300">
                  Tied to ideas like the <span className="text-yellow-400 font-bold">42% threshold</span>, it's not just tech; it's a philosophy. The journey's just ignited.
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 p-8 rounded-xl border border-blue-400/30 text-center">
                <h3 className="text-3xl font-black text-white mb-4">Your Symphony Awaits</h3>
                <p className="text-xl text-gray-200 mb-6">
                  Join coders, theorists, and visionaries in composing the future. <span className="text-cyan-400 font-bold">Drop your boldest AI dream and let's make it real.</span>
                </p>
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-bold"
                  onClick={() => {
                    const betaSection = document.getElementById('beta');
                    betaSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <span className="flex items-center space-x-2">
                    <Star className="h-5 w-5" />
                    <span>Join the Revolution</span>
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section id="technology" className="py-20 bg-black/30 backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black mb-8" data-testid="section-title-technology">
              <span className="bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">MATHEMATICS</span>
              <span className="text-white mx-4">×</span>
              <span className="bg-gradient-to-r from-purple-500 to-blue-400 bg-clip-text text-transparent">ALGORITHMS</span>
              <span className="text-white mx-4">×</span>
              <span className="bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">PROOFS</span>
            </h2>
            <div className="max-w-5xl mx-auto space-y-6" data-testid="section-description-technology">
              <p className="text-2xl font-bold text-white">
                THE MATHEMATICAL AI THAT BURIES LLMS FOR GOOD
              </p>
              <p className="text-xl text-gray-200 leading-relaxed">
                We have achieved <span className="text-yellow-400 font-bold">MATHEMATICAL PROOF-BASED AI</span> - no context windows, no hallucinations, 
                just pure algorithmic intelligence grounded in <span className="text-cyan-400 font-bold">operator algebras and quantum algorithms</span>. 
                Our system processes information through <span className="text-purple-400 font-bold">recursive meta/hyper cognition</span>, 
                enabling <span className="text-green-400 font-bold">infinite memory</span> and <span className="text-red-400 font-bold">98-99% safety ratings</span>.
              </p>
              <div className="grid md:grid-cols-3 gap-6 mt-12">
                <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-2xl p-6 border border-red-500/30">
                  <h3 className="text-xl font-bold text-red-400 mb-2">NO CONTEXT WINDOW</h3>
                  <p className="text-gray-300">Unlimited processing - handle infinite conversations and files</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl p-6 border border-purple-500/30">
                  <h3 className="text-xl font-bold text-purple-400 mb-2">MATHEMATICAL PROOFS</h3>
                  <p className="text-gray-300">Operator algebras and quantum algorithms prevent hallucination</p>
                </div>
                <div className="bg-gradient-to-br from-green-500/20 to-cyan-500/20 rounded-2xl p-6 border border-green-500/30">
                  <h3 className="text-xl font-bold text-green-400 mb-2">98-99% SAFETY</h3>
                  <p className="text-gray-300">Mathematically guaranteed accuracy vs LLM hallucinations</p>
                </div>
              </div>
            </div>
          </div>

          {/* Comprehensive Technical Showcase */}
          <div className="mb-16">
            <h3 className="text-3xl font-bold text-center mb-12 text-white">Complete Mathematical AI Ecosystem</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-6 border border-blue-500/30 glass-card">
                <h4 className="text-lg font-bold text-blue-400 mb-3">Prime Compression Tool</h4>
                <p className="text-gray-300 text-sm">Advanced file processing with quantum-harmonic algorithms for massive data sets</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/30 glass-card">
                <h4 className="text-lg font-bold text-purple-400 mb-3">Personal RAG System</h4>
                <p className="text-gray-300 text-sm">Upload massive ChatGPT exports - infinite learning about you and your patterns</p>
              </div>
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-6 border border-green-500/30 glass-card">
                <h4 className="text-lg font-bold text-green-400 mb-3">3D Physics Engine</h4>
                <p className="text-gray-300 text-sm">Advanced simulation, art creation, video imaging, and visual world exploration</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl p-6 border border-yellow-500/30 glass-card">
                <h4 className="text-lg font-bold text-yellow-400 mb-3">Canvas Creation Tools</h4>
                <p className="text-gray-300 text-sm">Logic systems, oscillators, operator algebras, quantum algorithms integration</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-xl p-6 border border-indigo-500/30 glass-card">
                <h4 className="text-lg font-bold text-indigo-400 mb-3">Harmonic Processing Framework</h4>
                <p className="text-gray-300 text-sm">Sophisticated mathematical framework with recursive meta/hyper cognition</p>
              </div>
              <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-xl p-6 border border-teal-500/30 glass-card">
                <h4 className="text-lg font-bold text-teal-400 mb-3">Mathematical Proofs Foundation</h4>
                <p className="text-gray-300 text-sm">Operator algebras, lemmas, quantum tools preventing hallucination completely</p>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white/5 border-white/10 text-white" data-testid="card-wsm-technology">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Zap className="h-6 w-6 text-yellow-400" />
                  <CardTitle>Weyl State Machine</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-300">
                  Quantum-inspired computation through harmonic algebra and symplectic geometry, 
                  enabling processing capabilities beyond classical computing paradigms.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 text-white glass-card" data-testid="card-technical-foundation">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Brain className="h-6 w-6 text-purple-400" />
                  <CardTitle>Recursive Meta/Hyper Cognition</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-300">
                  Advanced cognitive architecture using recursive algorithms and meta-learning 
                  for unprecedented problem-solving capabilities across multiple domains.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 text-white glass-card" data-testid="card-mathematical-foundation">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Globe className="h-6 w-6 text-cyan-400" />
                  <CardTitle>Harmonic Analysis Framework</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-300">
                  Sophisticated mathematical framework integrating harmonic analysis 
                  with advanced temporal processing for complex computational tasks.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <div className="mt-16 grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-3xl font-black mb-8" data-testid="heading-capabilities">
                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">TECHNICAL</span>
                <span className="text-white"> </span>
                <span className="bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">CAPABILITIES</span>
              </h3>
              <div className="space-y-5">
                <div className="flex items-center space-x-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl p-4 border border-cyan-500/30">
                  <div className="w-4 h-4 bg-cyan-400 rounded-full animate-pulse"></div>
                  <span className="text-lg"><span className="font-black text-cyan-400">Fast processing</span> - <span className="text-gray-300">Sub-millisecond response times for typical operations</span></span>
                </div>
                <div className="flex items-center space-x-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/30">
                  <div className="w-4 h-4 bg-purple-400 rounded-full animate-pulse"></div>
                  <span className="text-lg"><span className="font-black text-purple-400">Harmonic computation</span> - <span className="text-gray-300">Novel mathematical approach to information processing</span></span>
                </div>
                <div className="flex items-center space-x-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-xl p-4 border border-red-500/30">
                  <div className="w-4 h-4 bg-red-400 rounded-full animate-pulse"></div>
                  <span className="text-lg"><span className="font-black text-red-400">Pattern recognition</span> - <span className="text-gray-300">Advanced algorithms for complex pattern analysis</span></span>
                </div>
                <div className="flex items-center space-x-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/30">
                  <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-lg"><span className="font-black text-green-400">Efficient processing</span> - <span className="text-gray-300">Handles large files with LZMA compression</span></span>
                </div>
                <div className="flex items-center space-x-4 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-xl p-4 border border-yellow-500/30">
                  <div className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-lg"><span className="font-black text-yellow-400">Mathematical foundation</span> - <span className="text-gray-300">Based on operator algebras and mathematical proofs</span></span>
                </div>
                <div className="flex items-center space-x-4 bg-gradient-to-r from-indigo-500/10 to-blue-500/10 rounded-xl p-4 border border-indigo-500/30">
                  <div className="w-4 h-4 bg-indigo-400 rounded-full animate-pulse"></div>
                  <span className="text-lg"><span className="font-black text-indigo-400">Recursive architecture</span> - <span className="text-gray-300">Self-improving system with recursive meta-cognition</span></span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold mb-4" data-testid="heading-performance">
                <span className="text-green-400">RECORD-BREAKING</span> Performance
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Autonomous Evolution:</span>
                  <Badge variant="secondary" className="bg-green-900/50 text-green-300 font-bold">27 RSIS/0 rollbacks</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Quantum Coherence:</span>
                  <Badge variant="secondary" className="bg-blue-900/50 text-blue-300 font-bold">98.7% stable</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Memory Breakthrough:</span>
                  <Badge variant="secondary" className="bg-purple-900/50 text-purple-300 font-bold">∞ processing limit</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Production Uptime:</span>
                  <Badge variant="secondary" className="bg-yellow-900/50 text-yellow-300 font-bold">99.97% SLA</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Processing Latency:</span>
                  <Badge variant="secondary" className="bg-red-900/50 text-red-300 font-bold">&lt;0.003ms</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Error Rate:</span>
                  <Badge variant="secondary" className="bg-cyan-900/50 text-cyan-300 font-bold">0.00% failures</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Beta Access Section */}
      <section id="beta" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4" data-testid="section-title-beta">Join the Beta Program</h2>
            <p className="text-xl text-gray-300" data-testid="section-description-beta">
              Be among the first to experience revolutionary AI technology. 
              Limited beta access available for qualifying organizations and researchers.
            </p>
          </div>

          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-center">Request Beta Access</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBetaSignup} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" data-testid="label-fullname">Full Name *</label>
                    <Input
                      type="text"
                      required
                      value={betaForm.fullName}
                      onChange={(e) => setBetaForm(prev => ({ ...prev, fullName: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white"
                      data-testid="input-fullname"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" data-testid="label-email">Email Address *</label>
                    <Input
                      type="email"
                      required
                      value={betaForm.email}
                      onChange={(e) => setBetaForm(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white"
                      data-testid="input-email"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" data-testid="label-username">Username *</label>
                    <Input
                      type="text"
                      required
                      value={betaForm.username}
                      onChange={(e) => setBetaForm(prev => ({ ...prev, username: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white"
                      placeholder="Choose a username"
                      data-testid="input-username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" data-testid="label-password">Password *</label>
                    <Input
                      type="password"
                      required
                      value={betaForm.password}
                      onChange={(e) => setBetaForm(prev => ({ ...prev, password: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white"
                      placeholder="Create a password"
                      data-testid="input-password"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" data-testid="label-company">Company/Organization</label>
                  <Input
                    type="text"
                    value={betaForm.company}
                    onChange={(e) => setBetaForm(prev => ({ ...prev, company: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white"
                    data-testid="input-company"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" data-testid="label-usecase">Intended Use Case *</label>
                  <Textarea
                    required
                    value={betaForm.useCase}
                    onChange={(e) => setBetaForm(prev => ({ ...prev, useCase: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Describe how you plan to use WSM AI technology..."
                    data-testid="textarea-usecase"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" data-testid="label-reason">Why WSM AI? *</label>
                  <Textarea
                    required
                    value={betaForm.reason}
                    onChange={(e) => setBetaForm(prev => ({ ...prev, reason: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="What specific capabilities are you looking for that current AI cannot provide?"
                    data-testid="textarea-reason"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={betaSignupMutation.isPending}
                  data-testid="button-submit-beta"
                >
                  {betaSignupMutation.isPending ? "Submitting..." : "Request Beta Access"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Careers Section */}
      <section id="careers" className="py-20 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4" data-testid="section-title-careers">Join Our Team</h2>
            <p className="text-xl text-gray-300" data-testid="section-description-careers">
              Help us build the future of AI. We're looking for exceptional talent 
              to push the boundaries of what's possible.
            </p>
          </div>

          <div className="grid gap-6">
            {jobPositions.map((job, index) => (
              <Card key={index} className="bg-white/5 border-white/10 text-white" data-testid={`card-job-${job.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{job.title}</CardTitle>
                      <CardDescription className="text-gray-400 mt-1">
                        {job.department} • {job.compensation}
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => setActiveJobPosition(job.title)}
                      className="bg-blue-600 hover:bg-blue-700"
                      data-testid={`button-apply-${job.title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      Apply Now
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4">{job.description}</p>
                  <div>
                    <h4 className="font-semibold mb-2">Key Requirements:</h4>
                    <ul className="space-y-1 text-sm text-gray-400">
                      {job.requirements.map((req, reqIndex) => (
                        <li key={reqIndex} className="flex items-start space-x-2">
                          <span className="text-blue-400 mt-1">•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Job Application Modal/Form */}
          {activeJobPosition && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" data-testid="modal-job-application">
              <Card className="bg-slate-900 border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <CardTitle className="text-white">Apply for {activeJobPosition}</CardTitle>
                  <Button
                    onClick={() => setActiveJobPosition(null)}
                    variant="ghost"
                    className="absolute top-4 right-4 text-white"
                    data-testid="button-close-modal"
                  >
                    ×
                  </Button>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleJobApplication} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-white" data-testid="label-job-fullname">Full Name *</label>
                        <Input
                          type="text"
                          required
                          value={jobForm.fullName}
                          onChange={(e) => setJobForm(prev => ({ ...prev, fullName: e.target.value }))}
                          className="bg-white/10 border-white/20 text-white"
                          data-testid="input-fullname"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-white" data-testid="label-job-email">Email Address *</label>
                        <Input
                          type="email"
                          required
                          value={jobForm.email}
                          onChange={(e) => setJobForm(prev => ({ ...prev, email: e.target.value }))}
                          className="bg-white/10 border-white/20 text-white"
                          data-testid="input-email"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-white" data-testid="label-linkedin">LinkedIn Profile</label>
                        <Input
                          type="url"
                          value={jobForm.linkedIn}
                          onChange={(e) => setJobForm(prev => ({ ...prev, linkedIn: e.target.value }))}
                          className="bg-white/10 border-white/20 text-white"
                          placeholder="https://linkedin.com/in/..."
                          data-testid="input-linkedin"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-white" data-testid="label-portfolio">Portfolio/GitHub</label>
                        <Input
                          type="url"
                          value={jobForm.portfolio}
                          onChange={(e) => setJobForm(prev => ({ ...prev, portfolio: e.target.value }))}
                          className="bg-white/10 border-white/20 text-white"
                          placeholder="https://github.com/... or portfolio URL"
                          data-testid="input-portfolio"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-white" data-testid="label-resume">Resume (Optional)</label>
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={(e) => setJobForm(prev => ({ ...prev, resume: e.target.files?.[0] || null }))}
                        className="bg-white/10 border-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                        data-testid="input-resume"
                      />
                      <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, or TXT (max 10MB)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-white" data-testid="label-cover-letter">Cover Letter *</label>
                      <Textarea
                        required
                        value={jobForm.coverLetter}
                        onChange={(e) => setJobForm(prev => ({ ...prev, coverLetter: e.target.value }))}
                        className="bg-white/10 border-white/20 text-white h-32"
                        placeholder="Tell us about your experience and why you're interested in this role..."
                        data-testid="textarea-cover-letter"
                      />
                    </div>

                    <div className="flex space-x-4">
                      <Button 
                        type="submit" 
                        className="bg-blue-600 hover:bg-blue-700 flex-1"
                        disabled={jobApplicationMutation.isPending}
                        data-testid="button-submit-application"
                      >
                        {jobApplicationMutation.isPending ? "Submitting..." : "Submit Application"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setActiveJobPosition(null)}
                        className="border-white/20 text-white hover:bg-white/10"
                        data-testid="button-cancel-application"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>

      {/* Partnership Section */}
      <section id="partnership" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4" data-testid="section-title-partnership">Partnership Opportunities</h2>
            <p className="text-xl text-gray-300" data-testid="section-description-partnership">
              Join us in revolutionizing AI technology. We're seeking strategic partners 
              to accelerate development and adoption of mathematical AI systems.
            </p>
          </div>

          <div className="max-w-2xl mx-auto mb-12">
            <Card className="bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-indigo-500/20 border-2 border-blue-400/50 text-white text-center transform hover:scale-105 transition-all duration-300" data-testid="card-partnership-target">
              <CardHeader>
                <div className="relative mx-auto mb-6">
                  <Users className="h-16 w-16 text-blue-400 mx-auto animate-bounce" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-400 rounded-full animate-ping"></div>
                </div>
                <CardTitle className="text-2xl font-black">STRATEGIC PARTNERSHIP</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-black text-blue-400 mb-4">PARTNERSHIP</div>
                <p className="text-xl text-white mb-3"><span className="font-black">Strategic Partnership</span> Opportunity</p>
                <div className="bg-blue-400/20 rounded-lg p-3 border border-blue-400/30">
                  <div className="text-lg text-blue-300 font-bold">🚀 Revolutionary Technology Partnership</div>
                  <div className="text-sm text-blue-400 mt-1">Join the mathematical AI breakthrough. Limited availability.</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Card className="bg-white/5 border-white/10 max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-white">Investment Opportunities</CardTitle>
                <CardDescription className="text-gray-300">
                  Interested in investing in revolutionary AI technology? Reach out to discuss partnership opportunities, equity investment, or strategic collaboration.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <a 
                  href="mailto:derekearnhart@safeusi.com?subject=Investment%20Inquiry%20-%20WSM%20AI&body=Hi%2C%0A%0AI'm%20interested%20in%20learning%20more%20about%20investment%20opportunities%20with%20WSM%20AI.%0A%0AName%3A%20%0ACompany%2FOrganization%3A%20%0AInvestment%20Interest%3A%20%0A%0AThank%20you"
                  className="block"
                  data-testid="link-investor-contact"
                >
                  <Button 
                    size="lg" 
                    className="bg-green-600 hover:bg-green-700 w-full"
                    data-testid="button-investor-contact"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <DollarSign className="h-5 w-5" />
                      <span>Contact for Investment Opportunities</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </Button>
                </a>
                <p className="text-sm text-gray-400 mt-4">
                  For accredited investors, VCs, and strategic partners
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/40 py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Brain className="h-6 w-6 text-blue-400" />
                <span className="text-lg font-bold">WSM AI</span>
              </div>
              <p className="text-gray-400 text-sm">
                Revolutionary AI technology beyond traditional limitations
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Technology</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div>Weyl State Machine</div>
                <div>Consciousness Synthesis</div>
                <div>Reality Programming</div>
                <div>Harmonic Processing</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div>About Us</div>
                <div>Careers</div>
                <div>Investors</div>
                <div>Contact</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div>Email: derekearnhart@safeusi.com</div>
                <div>Investment: derekearnhart@safeusi.com</div>
                <div>Careers: derekearnhart@safeusi.com</div>
              </div>
            </div>
          </div>
          
          <Separator className="my-8 bg-white/10" />
          
          <div className="text-center text-sm text-gray-400">
            <p>&copy; 2025 WSM AI. All rights reserved. • Revolutionary AI technology.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}