import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  DollarSign, 
  Key, 
  BarChart3, 
  Zap, 
  Shield, 
  CheckCircle,
  Home,
  Settings,
  Copy,
  Eye,
  EyeOff
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

const PRICING_TIERS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    description: "Get started with basic access",
    features: [
      "1,000 API calls/month",
      "Basic file processing",
      "Community support",
      "Standard rate limits"
    ],
    highlighted: false
  },
  {
    id: "pro",
    name: "Pro",
    price: 49,
    description: "For professional developers",
    features: [
      "50,000 API calls/month",
      "Priority processing",
      "Email support",
      "Higher rate limits",
      "Advanced analytics"
    ],
    highlighted: true
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 299,
    description: "For large-scale applications",
    features: [
      "Unlimited API calls",
      "Dedicated infrastructure",
      "24/7 phone support",
      "Custom rate limits",
      "SLA guarantee",
      "Custom integrations"
    ],
    highlighted: false
  }
];

export default function Commercial() {
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey] = useState("wsm_live_sk_" + Math.random().toString(36).substring(2, 15));
  const { toast } = useToast();

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg p-2">
                <DollarSign className="text-white h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  Commercial API
                </h1>
                <p className="text-xs text-slate-400">WSM AI for Developers</p>
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
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                  <Settings className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Integrate WSM AI Into Your Apps
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Access mathematical AI capabilities through our simple REST API. 
            98% accuracy, zero hallucinations, enterprise-ready.
          </p>
        </div>

        {/* API Key Section */}
        <Card className="bg-slate-900/50 border-slate-800 mb-12 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Key className="h-5 w-5 text-amber-400" />
              Your API Key
            </CardTitle>
            <CardDescription className="text-slate-400">
              Use this key to authenticate your API requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  readOnly
                  className="bg-slate-950 border-slate-700 text-slate-300 font-mono pr-10"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button onClick={copyApiKey} variant="outline" className="border-slate-700">
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Keep this key secure. Do not share it publicly.
            </p>
          </CardContent>
        </Card>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {PRICING_TIERS.map((tier) => (
            <Card 
              key={tier.id}
              className={`bg-slate-900/50 border-slate-800 relative ${
                tier.highlighted ? 'border-blue-500 ring-2 ring-blue-500/20' : ''
              }`}
            >
              {tier.highlighted && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600">
                  Most Popular
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-white">{tier.name}</CardTitle>
                <CardDescription className="text-slate-400">
                  {tier.description}
                </CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">${tier.price}</span>
                  <span className="text-slate-400">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-slate-300">
                      <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full ${
                    tier.highlighted 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  {tier.price === 0 ? 'Get Started' : 'Subscribe'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">API Calls</p>
                  <p className="text-2xl font-bold text-white">1,247</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Avg Response</p>
                  <p className="text-2xl font-bold text-white">85ms</p>
                </div>
                <Zap className="h-8 w-8 text-amber-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Uptime</p>
                  <p className="text-2xl font-bold text-green-400">99.9%</p>
                </div>
                <Shield className="h-8 w-8 text-green-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Error Rate</p>
                  <p className="text-2xl font-bold text-white">0.1%</p>
                </div>
                <CheckCircle className="h-8 w-8 text-purple-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* API Example */}
        <Card className="bg-slate-900/50 border-slate-800 max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-white">Quick Start</CardTitle>
            <CardDescription className="text-slate-400">
              Make your first API call in seconds
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-slate-950 p-4 rounded-lg overflow-x-auto text-sm">
              <code className="text-green-400">{`curl -X POST https://safeusi.onrender.com/api/commercial/wsm/chat \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Analyze this data"}'`}</code>
            </pre>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
