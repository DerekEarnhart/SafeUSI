import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Brain, 
  Settings, 
  Home,
  DollarSign,
  Bell,
  Shield,
  Database,
  Palette,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

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
                <p className="text-xs text-slate-400">Settings</p>
              </div>
            </div>
            
            {/* Navigation */}
            <nav className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Settings</h2>
          <p className="text-slate-400">Configure your WSM AI experience</p>
        </div>

        <div className="space-y-6">
          {/* General Settings */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-400" />
                General Settings
              </CardTitle>
              <CardDescription className="text-slate-400">
                Basic application preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Dark Mode</Label>
                  <p className="text-sm text-slate-400">Use dark theme throughout the application</p>
                </div>
                <Switch 
                  checked={darkMode} 
                  onCheckedChange={setDarkMode}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Auto-save Files</Label>
                  <p className="text-sm text-slate-400">Automatically save uploaded files for future sessions</p>
                </div>
                <Switch 
                  checked={autoSave} 
                  onCheckedChange={setAutoSave}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bell className="h-5 w-5 text-purple-400" />
                Notifications
              </CardTitle>
              <CardDescription className="text-slate-400">
                Manage notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Enable Notifications</Label>
                  <p className="text-sm text-slate-400">Receive notifications for file processing and queries</p>
                </div>
                <Switch 
                  checked={notifications} 
                  onCheckedChange={setNotifications}
                />
              </div>
            </CardContent>
          </Card>

          {/* System Info */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Database className="h-5 w-5 text-green-400" />
                System Information
              </CardTitle>
              <CardDescription className="text-slate-400">
                Current system status and version info
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <p className="text-sm text-slate-400">Version</p>
                  <p className="text-lg font-semibold text-white">2.0.0</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <p className="text-sm text-slate-400">Status</p>
                  <Badge className="bg-green-500/20 text-green-400 mt-1">Operational</Badge>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <p className="text-sm text-slate-400">API Version</p>
                  <p className="text-lg font-semibold text-white">v1</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <p className="text-sm text-slate-400">Environment</p>
                  <p className="text-lg font-semibold text-white">Production</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-400" />
                Quick Links
              </CardTitle>
              <CardDescription className="text-slate-400">
                Access other areas of the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full border-slate-700 hover:bg-slate-800">
                    <Home className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/commercial">
                  <Button variant="outline" className="w-full border-slate-700 hover:bg-slate-800">
                    <DollarSign className="h-4 w-4 mr-2" />
                    API
                  </Button>
                </Link>
                <Link href="/admin">
                  <Button variant="outline" className="w-full border-slate-700 hover:bg-slate-800">
                    <Settings className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full border-slate-700 hover:bg-slate-800">
                    <Palette className="h-4 w-4 mr-2" />
                    Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
