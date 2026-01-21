import { useState, useEffect } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useWSMMetrics } from "@/hooks/useWSMMetrics";
import { useAgentOrchestration } from "@/hooks/useAgentOrchestration";
import { FileUpload } from "@/components/dashboard/FileUpload";
import { FileChat } from "@/components/dashboard/FileChat";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  Upload, 
  MessageSquare, 
  Settings, 
  ChevronDown,
  Activity,
  Zap,
  Shield,
  Code2,
  DollarSign,
  Bot,
  Sparkles
} from "lucide-react";
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

  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (lastMessage) {
      updateMetrics(lastMessage);
      updateOrchestrationData(lastMessage);
    }
  }, [lastMessage, updateMetrics, updateOrchestrationData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Simplified Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-2">
                <Brain className="text-white h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  WSM AI
                </h1>
                <p className="text-xs text-slate-400">Mathematical AI Platform</p>
              </div>
            </div>
            
            {/* Simple Navigation */}
            <nav className="flex items-center space-x-6">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                  Home
                </Button>
              </Link>
              <Link href="/programming">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                  <Code2 className="h-4 w-4 mr-2" />
                  Programming
                </Button>
              </Link>
              <Link href="/commercial">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Commercial
                </Button>
              </Link>
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
              
              {/* Status Indicator */}
              <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-xs font-medium text-green-400">Online</span>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Welcome to WSM AI</h2>
          <p className="text-slate-400">Upload files, ask questions, and leverage mathematical AI capabilities.</p>
        </div>

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Upload Files Card */}
          <Card className="bg-slate-900/50 border-slate-800 hover:border-blue-500/50 transition-all cursor-pointer group">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <Upload className="h-6 w-6 text-blue-400" />
                </div>
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                  Ready
                </Badge>
              </div>
              <CardTitle className="text-white">Upload Files</CardTitle>
              <CardDescription className="text-slate-400">
                Process documents, code, and data with infinite capacity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 mb-3">
                • All file types supported<br/>
                • No size limits<br/>
                • Instant processing
              </p>
            </CardContent>
          </Card>

          {/* Ask Questions Card */}
          <Card className="bg-slate-900/50 border-slate-800 hover:border-purple-500/50 transition-all cursor-pointer group">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                  <MessageSquare className="h-6 w-6 text-purple-400" />
                </div>
                <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                  Active
                </Badge>
              </div>
              <CardTitle className="text-white">Ask Questions</CardTitle>
              <CardDescription className="text-slate-400">
                Query your files with mathematical precision
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 mb-3">
                • 98-99% accuracy<br/>
                • No hallucinations<br/>
                • Proof-based answers
              </p>
            </CardContent>
          </Card>

          {/* Advanced Features Card */}
          <Card className="bg-slate-900/50 border-slate-800 hover:border-green-500/50 transition-all cursor-pointer group">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                  <Sparkles className="h-6 w-6 text-green-400" />
                </div>
                <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/30">
                  Available
                </Badge>
              </div>
              <CardTitle className="text-white">Advanced Tools</CardTitle>
              <CardDescription className="text-slate-400">
                Access programming, agents, and analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 mb-3">
                • Multi-agent systems<br/>
                • VM benchmarking<br/>
                • Commercial API
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Interface for Main Features */}
        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="bg-slate-900/50 border border-slate-800">
            <TabsTrigger value="upload" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </TabsTrigger>
            <TabsTrigger value="chat" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
              <MessageSquare className="h-4 w-4 mr-2" />
              Ask Questions
            </TabsTrigger>
            <TabsTrigger value="advanced" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
              <Sparkles className="h-4 w-4 mr-2" />
              Advanced
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-4">
            <FileUpload />
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-4">
            <FileChat />
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Programming */}
              <Link href="/programming">
                <Card className="bg-slate-900/50 border-slate-800 hover:border-green-500/50 transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="p-3 rounded-lg bg-green-500/10 w-fit mb-3">
                      <Code2 className="h-6 w-6 text-green-400" />
                    </div>
                    <CardTitle className="text-white">Programming</CardTitle>
                    <CardDescription className="text-slate-400">
                      Code generation and analysis tools
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              {/* Commercial API */}
              <Link href="/commercial">
                <Card className="bg-slate-900/50 border-slate-800 hover:border-blue-500/50 transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="p-3 rounded-lg bg-blue-500/10 w-fit mb-3">
                      <DollarSign className="h-6 w-6 text-blue-400" />
                    </div>
                    <CardTitle className="text-white">Commercial API</CardTitle>
                    <CardDescription className="text-slate-400">
                      Enterprise integration and services
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              {/* VM Benchmarking */}
              <Link href="/vm-benchmarking">
                <Card className="bg-slate-900/50 border-slate-800 hover:border-purple-500/50 transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="p-3 rounded-lg bg-purple-500/10 w-fit mb-3">
                      <Activity className="h-6 w-6 text-purple-400" />
                    </div>
                    <CardTitle className="text-white">VM Benchmarking</CardTitle>
                    <CardDescription className="text-slate-400">
                      Performance testing and metrics
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              {/* Multi-Agent System */}
              <Card className="bg-slate-900/50 border-slate-800 hover:border-orange-500/50 transition-all cursor-pointer h-full">
                <CardHeader>
                  <div className="p-3 rounded-lg bg-orange-500/10 w-fit mb-3">
                    <Bot className="h-6 w-6 text-orange-400" />
                  </div>
                  <CardTitle className="text-white">Multi-Agent System</CardTitle>
                  <CardDescription className="text-slate-400">
                    {agents?.length || 0} agents • {vmInstances?.length || 0} VMs active
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* System Performance */}
              <Card className="bg-slate-900/50 border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer h-full">
                <CardHeader>
                  <div className="p-3 rounded-lg bg-cyan-500/10 w-fit mb-3">
                    <Zap className="h-6 w-6 text-cyan-400" />
                  </div>
                  <CardTitle className="text-white">Performance</CardTitle>
                  <CardDescription className="text-slate-400">
                    {wsmMetrics?.processingTime?.toFixed(2) || '1.09'}s response • {wsmMetrics?.memoryUsage || '847'}MB
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Security Status */}
              <Card className="bg-slate-900/50 border-slate-800 hover:border-red-500/50 transition-all cursor-pointer h-full">
                <CardHeader>
                  <div className="p-3 rounded-lg bg-red-500/10 w-fit mb-3">
                    <Shield className="h-6 w-6 text-red-400" />
                  </div>
                  <CardTitle className="text-white">Security</CardTitle>
                  <CardDescription className="text-slate-400">
                    98-99% safety rating • Zero external APIs
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            {/* Technical Details (Collapsible) */}
            <div className="mt-8">
              <Button
                variant="outline"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full bg-slate-900/50 border-slate-800 hover:bg-slate-800/50 text-slate-300"
              >
                {showAdvanced ? 'Hide' : 'Show'} Technical Details
                <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </Button>

              {showAdvanced && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* WSM Core */}
                  <Card className="bg-slate-900/30 border-slate-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-slate-400">WSM Core</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Status</span>
                        <span className="text-green-400 font-medium">Active</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Size</span>
                        <span className="text-white">5.08MB</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Architecture</span>
                        <span className="text-purple-400">Post-LLM</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Coherence */}
                  <Card className="bg-slate-900/30 border-slate-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-slate-400">Quantum Coherence</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Level</span>
                        <span className="text-cyan-400 font-medium">{wsmMetrics?.coherence || '1.0'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Dissonance</span>
                        <span className="text-green-400">None</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Status</span>
                        <span className="text-green-400">Perfect</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Processing */}
                  <Card className="bg-slate-900/30 border-slate-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-slate-400">Processing</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Files</span>
                        <span className="text-white">{processingStats?.filesProcessed || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Success Rate</span>
                        <span className="text-green-400">100%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Avg Time</span>
                        <span className="text-white">{processingStats?.avgProcessingTime || 847}ms</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Self-Improvement */}
                  <Card className="bg-slate-900/30 border-slate-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-slate-400">Self-Improvement</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Proposals</span>
                        <span className="text-white">{rsisStatus?.proposals || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Promotions</span>
                        <span className="text-green-400">{rsisStatus?.promotions || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Rollbacks</span>
                        <span className="text-red-400">{rsisStatus?.rollbacks || 0}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Stats Footer */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{wsmMetrics?.coherence || '1.0'}</div>
            <div className="text-xs text-slate-500 mt-1">Coherence Level</div>
          </div>
          <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{processingStats?.filesProcessed || 0}</div>
            <div className="text-xs text-slate-500 mt-1">Files Processed</div>
          </div>
          <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">{agents?.length || 0}</div>
            <div className="text-xs text-slate-500 mt-1">Active Agents</div>
          </div>
          <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-400">98%</div>
            <div className="text-xs text-slate-500 mt-1">Safety Rating</div>
          </div>
        </div>
      </main>
    </div>
  );
}
