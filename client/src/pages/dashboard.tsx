import { useState, useEffect } from "react";
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
  Activity,
  Code2,
  DollarSign,
  Sparkles,
  Home,
  BarChart3,
  Shield
} from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const [isOnline, setIsOnline] = useState(true);

  // Simple health check
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health');
        setIsOnline(response.ok);
      } catch {
        setIsOnline(false);
      }
    };
    
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
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
            
            {/* Navigation */}
            <nav className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
              <Link href="/commercial">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                  <DollarSign className="h-4 w-4 mr-2" />
                  API
                </Button>
              </Link>
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                  <Settings className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              </Link>
              
              {/* Status */}
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                isOnline 
                  ? 'bg-green-500/10 border border-green-500/30' 
                  : 'bg-red-500/10 border border-red-500/30'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                }`}></div>
                <span className={`text-xs font-medium ${
                  isOnline ? 'text-green-400' : 'text-red-400'
                }`}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Welcome to WSM AI</h2>
          <p className="text-slate-400">Upload files and ask questions using our mathematical AI system.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">System Status</p>
                  <p className="text-2xl font-bold text-green-400">Active</p>
                </div>
                <Activity className="h-8 w-8 text-green-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Accuracy</p>
                  <p className="text-2xl font-bold text-blue-400">98%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Processing</p>
                  <p className="text-2xl font-bold text-purple-400">Ready</p>
                </div>
                <Sparkles className="h-8 w-8 text-purple-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Security</p>
                  <p className="text-2xl font-bold text-amber-400">Secure</p>
                </div>
                <Shield className="h-8 w-8 text-amber-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Feature Tabs */}
        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="bg-slate-900/50 border border-slate-800 p-1">
            <TabsTrigger 
              value="upload" 
              className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </TabsTrigger>
            <TabsTrigger 
              value="chat" 
              className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Ask Questions
            </TabsTrigger>
            <TabsTrigger 
              value="tools" 
              className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              More Tools
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

          {/* Tools Tab */}
          <TabsContent value="tools" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Commercial API */}
              <Link href="/commercial">
                <Card className="bg-slate-900/50 border-slate-800 hover:border-blue-500/50 transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="p-3 rounded-lg bg-blue-500/10 w-fit mb-3">
                      <DollarSign className="h-6 w-6 text-blue-400" />
                    </div>
                    <CardTitle className="text-white">Commercial API</CardTitle>
                    <CardDescription className="text-slate-400">
                      Access WSM capabilities via API for your applications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-400">
                      Available
                    </Badge>
                  </CardContent>
                </Card>
              </Link>

              {/* VM Benchmarking */}
              <Link href="/vm-benchmarking">
                <Card className="bg-slate-900/50 border-slate-800 hover:border-purple-500/50 transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="p-3 rounded-lg bg-purple-500/10 w-fit mb-3">
                      <BarChart3 className="h-6 w-6 text-purple-400" />
                    </div>
                    <CardTitle className="text-white">VM Benchmarking</CardTitle>
                    <CardDescription className="text-slate-400">
                      Test and benchmark AI model performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary" className="bg-purple-500/10 text-purple-400">
                      Available
                    </Badge>
                  </CardContent>
                </Card>
              </Link>

              {/* Admin Panel */}
              <Link href="/admin">
                <Card className="bg-slate-900/50 border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="p-3 rounded-lg bg-amber-500/10 w-fit mb-3">
                      <Settings className="h-6 w-6 text-amber-400" />
                    </div>
                    <CardTitle className="text-white">Admin Panel</CardTitle>
                    <CardDescription className="text-slate-400">
                      Manage users, settings, and system configuration
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-400">
                      Available
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer Info */}
        <div className="mt-12 text-center text-slate-500 text-sm">
          <p>WSM AI Platform • Mathematical Precision • Zero Hallucinations</p>
        </div>
      </main>
    </div>
  );
}
