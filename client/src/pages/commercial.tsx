import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  DollarSign, 
  Key, 
  BarChart3, 
  Zap, 
  Shield, 
  Cpu, 
  Clock,
  Users,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Bot,
  Server
} from "lucide-react";
import { Link } from "wouter";

interface SubscriptionTier {
  id: string;
  name: string;
  description: string;
  price: number;
  monthlyQuota: number;
  permissions: string[];
  maxAgents: number;
  maxVMs: number;
}

interface UserSubscription {
  subscription: {
    tier: string;
    usage: number;
    quota: number;
    usagePercent: number;
  };
  analytics: {
    totalRequests: number;
    avgResponseTime: number;
    errorRate: number;
    endpointStats: Record<string, any>;
  };
}

export default function Commercial() {
  const [selectedTier, setSelectedTier] = useState<string>('basic');
  const [apiKey, setApiKey] = useState<string>('');
  const [testMessage, setTestMessage] = useState<string>('');
  const [testResponse, setTestResponse] = useState<any>(null);
  const [userName, setUserName] = useState<string>('Demo User');

  // Fetch subscription tiers
  const { data: tiers } = useQuery<SubscriptionTier[]>({
    queryKey: ['subscription-tiers'],
    queryFn: async () => {
      const response = await fetch('/api/commercial/tiers');
      return response.json();
    },
  });

  // Demo analytics data
  const demoAnalytics: UserSubscription = {
    subscription: {
      tier: selectedTier,
      usage: Math.floor(Math.random() * 500) + 100,
      quota: tiers?.find(t => t.id === selectedTier)?.monthlyQuota || 1000,
      usagePercent: 0
    },
    analytics: {
      totalRequests: 1247,
      avgResponseTime: 0.085,
      errorRate: 0.012,
      endpointStats: {
        '/api/commercial/wsm/chat': { count: 856, avgTime: 0.095, errors: 8 },
        '/api/commercial/wsm/status': { count: 245, avgTime: 0.045, errors: 2 },
        '/api/commercial/wsm/process-file': { count: 146, avgTime: 0.125, errors: 5 }
      }
    }
  };

  demoAnalytics.subscription.usagePercent = 
    (demoAnalytics.subscription.usage / demoAnalytics.subscription.quota) * 100;

  const handleSubscribe = async () => {
    try {
      const response = await fetch('/api/commercial/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: `demo-${Date.now()}`,
          tier: selectedTier,
          userName
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setApiKey(data.apiKey.key);
      }
    } catch (error) {
      console.error('Subscription error:', error);
    }
  };

  const testApi = async () => {
    if (!apiKey || !testMessage) return;

    try {
      const response = await fetch('/api/commercial/wsm/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: testMessage }),
      });

      const data = await response.json();
      setTestResponse(data);
    } catch (error) {
      console.error('API test error:', error);
      setTestResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatNumber = (num: number) => num.toLocaleString();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <div className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-slate-700/50 cursor-pointer transition-all">
                  <ArrowLeft className="text-slate-400 h-4 w-4" />
                  <span className="text-sm text-slate-400">Dashboard</span>
                </div>
              </Link>
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-2">
                <DollarSign className="text-white h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">WSM Commercial API</h1>
                <p className="text-sm text-slate-400">World's first commercial Post-LLM architecture</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-green-400 border-green-400">
                <CheckCircle className="w-3 h-3 mr-1" />
                Zero Dependencies
              </Badge>
              <Badge variant="outline" className="text-blue-400 border-blue-400">
                <Shield className="w-3 h-3 mr-1" />
                99% Uptime SLA
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Subscription Tiers */}
        <section>
          <h2 className="text-3xl font-bold text-white mb-2">Multi-Agent Orchestration Platform</h2>
          <p className="text-slate-400 mb-6">
            Revolutionary AI without LLM dependencies. Quantum harmonic agents with dedicated VM infrastructure.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers?.map((tier) => (
              <Card 
                key={tier.id} 
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedTier === tier.id 
                    ? 'ring-2 ring-blue-500 bg-slate-800' 
                    : 'bg-slate-800/50 hover:bg-slate-800'
                }`}
                onClick={() => setSelectedTier(tier.id)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white">{tier.name}</CardTitle>
                      <CardDescription className="mt-2 text-slate-400">
                        {tier.description}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        {formatCurrency(tier.price)}
                      </div>
                      <div className="text-sm text-slate-400">per month</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-slate-300">
                      <Cpu className="w-4 h-4 mr-2 text-blue-400" />
                      {formatNumber(tier.monthlyQuota)} API calls/month
                    </div>
                    <div className="flex items-center text-slate-300">
                      <Bot className="w-4 h-4 mr-2 text-purple-400" />
                      {tier.maxAgents > 0 ? `${tier.maxAgents} AI agents` : 'No agent orchestration'}
                    </div>
                    <div className="flex items-center text-slate-300">
                      <Server className="w-4 h-4 mr-2 text-orange-400" />
                      {tier.maxVMs > 0 ? `${tier.maxVMs} dedicated VMs` : 'Shared infrastructure'}
                    </div>
                    <div className="flex items-center text-slate-300">
                      <Zap className="w-4 h-4 mr-2 text-yellow-400" />
                      Average {tier.id === 'basic' ? '85ms' : tier.id === 'pro' ? '65ms' : '45ms'} response time
                    </div>
                    <div className="flex items-center text-slate-300">
                      <Shield className="w-4 h-4 mr-2 text-green-400" />
                      {tier.permissions.includes('*') ? 'All endpoints' : `${tier.permissions.length} endpoints`}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Subscribe Section */}
        <section>
          <Card className="bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Key className="w-5 h-5 mr-2 text-blue-400" />
                Get Your API Key
              </CardTitle>
              <CardDescription>
                Start building with WSM technology in minutes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300">Your Name</label>
                <Input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  className="mt-1 bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <Button 
                onClick={handleSubscribe}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                Subscribe to {tiers?.find(t => t.id === selectedTier)?.name} - {formatCurrency(tiers?.find(t => t.id === selectedTier)?.price || 0)}/month
              </Button>
              
              {apiKey && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-slate-300">Your API Key</label>
                  <Textarea
                    value={apiKey}
                    readOnly
                    className="mt-1 bg-slate-700 border-slate-600 text-white font-mono text-xs"
                    rows={3}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* API Testing Section */}
        {apiKey && (
          <section>
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-green-400" />
                  Test Your API
                </CardTitle>
                <CardDescription>
                  Try the WSM chat endpoint with your new API key
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300">Test Message</label>
                  <Input
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    placeholder="What is consciousness in WSM systems?"
                    className="mt-1 bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                
                <Button onClick={testApi} disabled={!testMessage}>
                  Send Test Request
                </Button>
                
                {testResponse && (
                  <div>
                    <label className="text-sm font-medium text-slate-300">Response</label>
                    <Textarea
                      value={JSON.stringify(testResponse, null, 2)}
                      readOnly
                      className="mt-1 bg-slate-700 border-slate-600 text-white font-mono text-xs"
                      rows={8}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {/* Analytics Dashboard */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">Usage Analytics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
            <Card className="bg-slate-800/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Current Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white capitalize">
                  {demoAnalytics.subscription.tier}
                </div>
                <Badge className="mt-2 bg-blue-500">
                  {formatNumber(demoAnalytics.subscription.quota)} calls/month
                </Badge>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Usage This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {formatNumber(demoAnalytics.subscription.usage)}
                </div>
                <Progress value={demoAnalytics.subscription.usagePercent} className="mt-2" />
                <div className="text-xs text-slate-400 mt-1">
                  {demoAnalytics.subscription.usagePercent.toFixed(1)}% of quota used
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Avg Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {(demoAnalytics.analytics.avgResponseTime * 1000).toFixed(0)}ms
                </div>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-3 h-3 text-green-400 mr-1" />
                  <span className="text-xs text-green-400">15% faster than LLMs</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Error Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {(demoAnalytics.analytics.errorRate * 100).toFixed(2)}%
                </div>
                <div className="flex items-center mt-2">
                  <CheckCircle className="w-3 h-3 text-green-400 mr-1" />
                  <span className="text-xs text-green-400">Excellent reliability</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Endpoint Statistics */}
          <Card className="bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white">Endpoint Usage</CardTitle>
              <CardDescription>Your most used API endpoints</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(demoAnalytics.analytics.endpointStats).map(([endpoint, stats]) => (
                  <div key={endpoint} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <Cpu className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-white font-medium">{endpoint}</div>
                        <div className="text-xs text-slate-400">
                          {formatNumber(stats.count)} requests • {(stats.avgTime * 1000).toFixed(0)}ms avg
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {stats.errors > 0 ? (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {stats.errors} errors
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Healthy
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Value Proposition */}
        <section className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg p-8">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">
              Why Choose WSM Over Traditional LLMs?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Zero Dependencies</h3>
                <p className="text-slate-400">
                  No external APIs, no training data requirements. Pure mathematical coherence.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Superior Performance</h3>
                <p className="text-slate-400">
                  95-99% quantum coherence with sub-100ms response times.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Cpu className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Cost Effective</h3>
                <p className="text-slate-400">
                  Fixed monthly pricing with predictable costs. No per-token surprises.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}