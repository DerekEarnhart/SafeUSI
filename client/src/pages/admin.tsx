import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Shield, 
  Settings, 
  Users, 
  Flag, 
  Home,
  DollarSign,
  Activity,
  Database,
  Server,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { Link } from "wouter";

export default function Admin() {
  const [features, setFeatures] = useState({
    fileUpload: true,
    ragChat: true,
    commercialApi: true,
    vmBenchmarking: false
  });

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-lg p-2">
                <Shield className="text-white h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent">
                  Admin Panel
                </h1>
                <p className="text-xs text-slate-400">System Management</p>
              </div>
            </div>
            
            {/* Navigation */}
            <nav className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/commercial">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                  <DollarSign className="h-4 w-4 mr-2" />
                  API
                </Button>
              </Link>
              <div className="text-sm font-mono text-slate-500">
                {formatTime()}
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Administration</h2>
          <p className="text-slate-400">Manage system settings, users, and features</p>
        </div>

        <Tabs defaultValue="system" className="space-y-6">
          <TabsList className="bg-slate-900/50 border border-slate-800">
            <TabsTrigger value="system" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">
              <Server className="h-4 w-4 mr-2" />
              System
            </TabsTrigger>
            <TabsTrigger value="features" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
              <Flag className="h-4 w-4 mr-2" />
              Features
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
          </TabsList>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">API Status</p>
                      <div className="flex items-center gap-2 mt-1">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span className="text-lg font-semibold text-green-400">Healthy</span>
                      </div>
                    </div>
                    <Activity className="h-8 w-8 text-green-400 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Database</p>
                      <div className="flex items-center gap-2 mt-1">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span className="text-lg font-semibold text-green-400">Connected</span>
                      </div>
                    </div>
                    <Database className="h-8 w-8 text-blue-400 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">WSM Engine</p>
                      <div className="flex items-center gap-2 mt-1">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span className="text-lg font-semibold text-green-400">Running</span>
                      </div>
                    </div>
                    <Server className="h-8 w-8 text-purple-400 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Memory</p>
                      <p className="text-lg font-semibold text-white">847 MB</p>
                    </div>
                    <Settings className="h-8 w-8 text-amber-400 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">System Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <p className="text-sm text-slate-400">Version</p>
                    <p className="text-lg font-semibold text-white">2.0.0</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <p className="text-sm text-slate-400">Environment</p>
                    <p className="text-lg font-semibold text-white">Production</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <p className="text-sm text-slate-400">Uptime</p>
                    <p className="text-lg font-semibold text-white">99.9%</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <p className="text-sm text-slate-400">Region</p>
                    <p className="text-lg font-semibold text-white">US-East</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Feature Flags</CardTitle>
                <CardDescription className="text-slate-400">
                  Enable or disable platform features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white">File Upload</Label>
                    <p className="text-sm text-slate-400">Allow users to upload and process files</p>
                  </div>
                  <Switch 
                    checked={features.fileUpload} 
                    onCheckedChange={(checked) => setFeatures({...features, fileUpload: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white">RAG Chat</Label>
                    <p className="text-sm text-slate-400">Enable question-answering on uploaded files</p>
                  </div>
                  <Switch 
                    checked={features.ragChat} 
                    onCheckedChange={(checked) => setFeatures({...features, ragChat: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white">Commercial API</Label>
                    <p className="text-sm text-slate-400">Enable commercial API access</p>
                  </div>
                  <Switch 
                    checked={features.commercialApi} 
                    onCheckedChange={(checked) => setFeatures({...features, commercialApi: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white">VM Benchmarking</Label>
                    <p className="text-sm text-slate-400">Enable VM performance testing</p>
                  </div>
                  <Switch 
                    checked={features.vmBenchmarking} 
                    onCheckedChange={(checked) => setFeatures({...features, vmBenchmarking: checked})}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">User Management</CardTitle>
                <CardDescription className="text-slate-400">
                  View and manage platform users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-slate-400">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No users registered yet</p>
                  <p className="text-sm mt-2">Users will appear here when they sign up</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
