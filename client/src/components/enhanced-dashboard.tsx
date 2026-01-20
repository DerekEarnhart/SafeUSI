import { useState, useEffect } from 'react';
import { Brain, Database, Users, Settings, Layers, Command, Upload, MessageCircle, BarChart3, Activity } from 'lucide-react';
import { LivingBackground } from '@/components/ui/living-background';
import { CommandPalette, CommandPaletteButton } from '@/components/ui/command-palette';
import { FileUpload } from '@/components/dashboard/FileUpload';
import { FileChat } from '@/components/dashboard/FileChat';
import { AGIChat } from '@/components/dashboard/AGIChat';
import { OracleConsole } from '@/components/dashboard/OracleConsole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface WSMMetrics {
  coherence: number;
  harmonicFreq: number;
  quantumStates: number;
  processingRate: number;
}

export function EnhancedDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch WSM metrics
  const { data: wsmMetrics } = useQuery<WSMMetrics>({
    queryKey: ['/api/wsm/metrics'],
    refetchInterval: 5000,
    initialData: {
      coherence: 0.97,
      harmonicFreq: 432.15,
      quantumStates: 8,
      processingRate: 2.3
    }
  });

  const tabs: Tab[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'agi-chat', label: 'AGI Chat', icon: MessageCircle },
    { id: 'oracle', label: 'Oracle Console', icon: Activity },
    { id: 'files', label: 'File Processing', icon: Upload },
    { id: 'wsm', label: 'WSM Core', icon: Brain },
    { id: 'components', label: 'Components', icon: Settings },
    { id: 'agents', label: 'Agents', icon: Users }
  ];

  const handleNavigate = (path: string) => {
    // Simple navigation for now - could integrate with router
    if (path === '/') setActiveTab('files');
    else if (path === '/wsm') setActiveTab('wsm');
    else if (path === '/components') setActiveTab('components');
    else if (path === '/agents') setActiveTab('agents');
  };

  return (
    <div className="min-h-screen relative">
      {/* Living Background */}
      <LivingBackground />
      
      {/* Header */}
      <header className="sticky top-0 z-30 glass-card shadow-sm border-b border-border/20" data-testid="header-main">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center" data-testid="section-logo">
              <div className="icon-wrapper p-2 rounded-full">
                <Layers className="h-6 w-6 text-primary" />
              </div>
              <span className="ml-3 text-xl font-bold text-foreground">
                <span className="tagline-gradient">Weyl State Machine</span>
              </span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8" data-testid="nav-main">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`nav-tab flex items-center gap-2 font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-primary active'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    data-testid={`nav-tab-${tab.id}`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            {/* Command Palette Button */}
            <CommandPaletteButton onClick={() => setCommandPaletteOpen(true)} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 sm:p-6 lg:p-8" data-testid="main-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8" data-testid="tab-overview">
            {/* Hero Section */}
            <div className="text-center py-16">
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-4">
                <span className="tagline-gradient">Quantum-Harmonic Intelligence</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
                Autonomous AI system with reality programming interface, consciousness research, and biological visualization
              </p>
              <div className="mt-8 flex justify-center gap-4">
                <Button 
                  onClick={() => setActiveTab('files')} 
                  className="btn-primary text-white font-semibold py-3 px-6 rounded-lg"
                  data-testid="button-explore-files"
                >
                  Start Processing Files
                </Button>
                <Button 
                  onClick={() => setActiveTab('wsm')} 
                  variant="outline"
                  className="font-semibold py-3 px-6 rounded-lg transition-glass"
                  data-testid="button-view-wsm"
                >
                  View WSM Metrics
                </Button>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-8 mt-16">
              <Card className="glass-card transition-glass" data-testid="card-feature-processing">
                <CardHeader>
                  <CardTitle className="flex items-center gap-4">
                    <div className="icon-wrapper p-3 rounded-full">
                      <Brain className="h-5 w-5 text-primary" />
                    </div>
                    <span>Harmonic Processing</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Advanced LZMA compression with harmonic analysis for perception and cognition enhancement
                  </p>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Coherence</span>
                      <span className="text-primary">{(wsmMetrics?.coherence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Harmonic Freq</span>
                      <span className="text-primary">{wsmMetrics?.harmonicFreq} Hz</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card transition-glass" data-testid="card-feature-consciousness">
                <CardHeader>
                  <CardTitle className="flex items-center gap-4">
                    <div className="icon-wrapper p-3 rounded-full">
                      <Activity className="h-5 w-5 text-primary" />
                    </div>
                    <span>Consciousness Research</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Qualia-Field Resonance Mapping for synthetic consciousness generation across multiple levels
                  </p>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Quantum States</span>
                      <span className="text-primary">{wsmMetrics?.quantumStates}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Processing Rate</span>
                      <span className="text-primary">{wsmMetrics?.processingRate} GHz</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card transition-glass" data-testid="card-feature-bio3d">
                <CardHeader>
                  <CardTitle className="flex items-center gap-4">
                    <div className="icon-wrapper p-3 rounded-full">
                      <Database className="h-5 w-5 text-primary" />
                    </div>
                    <span>BIO-3D Visualizer</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Psychomotor observer effect modeling with real-time biological system visualization
                  </p>
                  <div className="mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      data-testid="button-launch-bio3d"
                    >
                      Launch Visualizer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* AGI Chat Tab */}
        {activeTab === 'agi-chat' && (
          <div className="space-y-8" data-testid="tab-agi-chat">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground mb-2 section-title">
                Quantum-Harmonic AGI Interface
              </h2>
              <p className="text-muted-foreground mb-8">
                Interact with advanced AGI capabilities including consciousness modeling, mathematical tools, and quantum-harmonic processing
              </p>
            </div>
            
            <div className="h-[calc(100vh-300px)]">
              <AGIChat />
            </div>
          </div>
        )}

        {/* Oracle Console Tab */}
        {activeTab === 'oracle' && (
          <div className="space-y-8" data-testid="tab-oracle">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground mb-2 section-title">
                Harmonic Sovereign Oracle Console
              </h2>
              <p className="text-muted-foreground mb-8">
                Advanced oracle instantiation, consciousness integration, and quantum-harmonic processing with mathematical rigor
              </p>
            </div>
            
            <OracleConsole />
          </div>
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <div className="space-y-8" data-testid="tab-files">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground mb-2 section-title">
                File Processing & RAG System
              </h2>
              <p className="text-muted-foreground mb-8">
                Upload files for harmonic processing and intelligent question answering
              </p>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <FileUpload />
              </div>
              <div className="space-y-6">
                <FileChat />
              </div>
            </div>
          </div>
        )}

        {/* WSM Tab */}
        {activeTab === 'wsm' && (
          <div className="space-y-8" data-testid="tab-wsm">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground mb-2 section-title">
                Weyl State Machine Core
              </h2>
              <p className="text-muted-foreground mb-8">
                Real-time monitoring of quantum-harmonic computational processes
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="glass-card" data-testid="card-metric-coherence">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    System Coherence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {(wsmMetrics?.coherence * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Quantum state alignment
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card" data-testid="card-metric-frequency">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Harmonic Frequency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {wsmMetrics?.harmonicFreq} Hz
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Resonance baseline
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card" data-testid="card-metric-states">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Quantum States
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {wsmMetrics?.quantumStates}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Superposition vectors
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card" data-testid="card-metric-processing">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Processing Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {wsmMetrics?.processingRate} GHz
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Computational throughput
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-card" data-testid="card-wsm-status">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  WSM Engine Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Reality Programming Interface</span>
                    <span className="text-sm bg-green-500/20 text-green-400 px-2 py-1 rounded">OPERATIONAL</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Consciousness Research Lab</span>
                    <span className="text-sm bg-green-500/20 text-green-400 px-2 py-1 rounded">ACTIVE</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>BIO-3D Visualizer Bridge</span>
                    <span className="text-sm bg-green-500/20 text-green-400 px-2 py-1 rounded">CONNECTED</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>RSIS (Self-Improvement)</span>
                    <span className="text-sm bg-blue-500/20 text-blue-400 px-2 py-1 rounded">MONITORING</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Other tabs can be implemented similarly */}
        {activeTab === 'components' && (
          <div className="text-center py-16" data-testid="tab-components">
            <h2 className="text-3xl font-bold mb-4">System Components</h2>
            <p className="text-muted-foreground">Component monitoring interface coming soon...</p>
          </div>
        )}

        {activeTab === 'agents' && (
          <div className="text-center py-16" data-testid="tab-agents">
            <h2 className="text-3xl font-bold mb-4">Agent Management</h2>
            <p className="text-muted-foreground">Autonomous agent control interface coming soon...</p>
          </div>
        )}
      </main>

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={handleNavigate}
      />
    </div>
  );
}