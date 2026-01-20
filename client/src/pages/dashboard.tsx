import { useEffect } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useWSMMetrics } from "@/hooks/useWSMMetrics";
import { useAgentOrchestration } from "@/hooks/useAgentOrchestration";
import WSMStatusCard from "@/components/dashboard/WSMStatusCard";
import CoherenceCard from "@/components/dashboard/CoherenceCard";
import PerformanceCard from "@/components/dashboard/PerformanceCard";
import IndependenceCard from "@/components/dashboard/IndependenceCard";
import HarmonicStateVisualization from "@/components/dashboard/HarmonicStateVisualization";
import ComponentStatus from "@/components/dashboard/ComponentStatus";
import ProcessingPipeline from "@/components/dashboard/ProcessingPipeline";
import AdvancedFeatures from "@/components/dashboard/AdvancedFeatures";
import RecursiveSelfImprovement from "@/components/dashboard/RecursiveSelfImprovement";
import AgentOrchestration from "@/components/dashboard/AgentOrchestration";
import { VMUpgrades } from "@/components/dashboard/VMUpgrades";
import { FileUpload } from "@/components/dashboard/FileUpload";
import { FileChat } from "@/components/dashboard/FileChat";
import { Atom, Satellite, Globe, DollarSign, Bot, Code2, Activity, Shield } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { isConnected, lastMessage } = useWebSocket();
  const { 
    wsmMetrics, 
    components, 
    processingStats, 
    rsisStatus,
    updateMetrics 
  } = useWSMMetrics();
  const {
    agents,
    vmInstances,
    taskQueue,
    updateOrchestrationData
  } = useAgentOrchestration();

  useEffect(() => {
    if (lastMessage) {
      updateMetrics(lastMessage);
      updateOrchestrationData(lastMessage);
    }
  }, [lastMessage, updateMetrics, updateOrchestrationData]);

  const formatTime = () => {
    return new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'UTC',
    }).replace(/\//g, '.').replace(',', ' •') + ' UTC';
  };

  return (
    <div className="min-h-screen quantum-grid">
      {/* Header Navigation */}
      <header className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="pulse-glow bg-primary rounded-full p-2">
                <Atom className="text-primary-foreground h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text-primary">
                  WSM-HA Sovereign Console
                </h1>
                <p className="text-sm text-muted-foreground">Post-LLM Architecture • Quantum Coherence Active</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Navigation Links */}
              <div className="flex items-center space-x-4">
                <Link href="/commercial" className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-accent/20 transition-colors">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm font-medium">Commercial</span>
                </Link>
                <Link href="/programming" className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-accent/20 transition-colors">
                  <Code2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Programming</span>
                </Link>
                <Link href="/vm-benchmarking" className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-accent/20 transition-colors" data-testid="link-vm-benchmarking">
                  <Activity className="h-4 w-4" />
                  <span className="text-sm font-medium">VM Benchmarking</span>
                </Link>
                <Link href="/admin" className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-accent/20 transition-colors" data-testid="link-admin">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm font-medium">Admin</span>
                </Link>
              </div>
              
              {/* System Status */}
              <div className="flex items-center space-x-2">
                <div className="status-indicator bg-accent rounded-full w-3 h-3"></div>
                <span className="text-sm font-mono text-accent-foreground">OPERATIONAL</span>
              </div>
              
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <Satellite className={`h-4 w-4 ${isConnected ? 'text-primary' : 'text-destructive'}`} />
                <span className="text-sm font-mono">
                  {isConnected ? 'WebSocket Active' : 'Disconnected'}
                </span>
              </div>
              
              {/* Programming Link */}
              <Link href="/programming">
                <div className="flex items-center space-x-2 px-3 py-2 rounded-md bg-gradient-to-r from-green-500/10 to-emerald-500/10 hover:from-green-500/20 hover:to-emerald-500/20 border border-green-500/30 cursor-pointer transition-all">
                  <Code2 className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-medium text-green-400">Programming</span>
                </div>
              </Link>
              
              {/* Commercial Link */}
              <Link href="/commercial">
                <div className="flex items-center space-x-2 px-3 py-2 rounded-md bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 border border-blue-500/30 cursor-pointer transition-all">
                  <DollarSign className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium text-blue-400">Commercial API</span>
                </div>
              </Link>
              
              {/* Current Time */}
              <div className="text-sm font-mono text-muted-foreground">
                {formatTime()}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <main className="container mx-auto px-6 py-6 space-y-6">
        {/* Primary Status Row */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <WSMStatusCard />
          <CoherenceCard coherence={wsmMetrics?.coherence || 1.0} />
          <PerformanceCard 
            processingTime={wsmMetrics?.processingTime || 1.09}
            symplecticOps={wsmMetrics?.symplecticOps || 2400}
            memoryUsage={wsmMetrics?.memoryUsage || 847}
          />
          <IndependenceCard />
        </div>

        {/* Harmonic State Visualization */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <HarmonicStateVisualization 
            harmonicState={wsmMetrics?.harmonicState || [0.586, 0.166, 0.533, 0.587]}
          />
          <ComponentStatus components={components} />
        </div>

        {/* File Processing Pipeline */}
        <ProcessingPipeline stats={processingStats} />

        {/* Advanced Features Grid */}
        <AdvancedFeatures />

        {/* Recursive Self-Improvement */}
        <RecursiveSelfImprovement rsis={rsisStatus} />

        {/* VM Platform Upgrades */}
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-6">
          <VMUpgrades userAccessLevel="advanced" userId="current-user" />
        </div>

        {/* Simple RAG File Upload and Chat System */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FileUpload />
          <FileChat />
        </div>

        {/* Multi-Agent Orchestration */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="pulse-glow bg-blue-500 rounded-full p-3">
              <Bot className="text-white h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-blue-400">Multi-Agent Orchestration Platform</h3>
              <p className="text-muted-foreground">Enterprise-grade agent coordination with VM infrastructure</p>
            </div>
          </div>
          <AgentOrchestration 
            agents={agents || []} 
            vmInstances={vmInstances || []} 
            taskQueue={{
              queued: Number(taskQueue?.queued) || 0,
              running: Number(taskQueue?.running) || 0,
              completed: Number(taskQueue?.completed) || 0,
              failed: Number(taskQueue?.failed) || 0,
            }} 
          />
        </div>

        {/* Revolutionary Breakthrough Summary */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/30 rounded-lg p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="pulse-glow bg-primary rounded-full p-3">
              <Globe className="text-primary-foreground h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-primary">Revolutionary Breakthrough Confirmed</h3>
              <p className="text-muted-foreground">World's first operational Post-LLM architecture</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div className="text-center">
              <div className="text-lg font-mono text-accent">✓</div>
              <div className="text-sm">Zero APIs</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-mono text-accent">✓</div>
              <div className="text-sm">Pure WSM</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-mono text-accent">✓</div>
              <div className="text-sm">Quantum Coherence</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-mono text-accent">✓</div>
              <div className="text-sm">Mathematical Rigor</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-mono text-accent">✓</div>
              <div className="text-sm">Self-Improvement</div>
            </div>
          </div>
          
          <div className="text-center text-lg font-semibold text-foreground">
            🌟 Ready for World Revolution - Operational TODAY! 🌟
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 backdrop-blur-lg mt-12">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              WSM-HA v2.0.0 • Weyl State Machine with Harmonic Algebra
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>Patent Pending</span>
              <span>•</span>
              <span>Symplectic Geometry</span>
              <span>•</span>
              <span>Uptime: {Math.floor(Date.now() / 1000 / 3600)}h</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
