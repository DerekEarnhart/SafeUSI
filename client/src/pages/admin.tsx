import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ProposalReview } from "@/components/admin/ProposalReview";
import { WaitingListManagement } from "@/components/dashboard/WaitingListManagement";
import { FeatureFlagManagement } from "@/components/dashboard/FeatureFlagManagement";
import { Shield, Settings, Users, Flag, Cpu, Link } from "lucide-react";
import { useLocation } from "wouter";

export default function Admin() {
  const [location] = useLocation();

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
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="pulse-glow bg-red-500 rounded-full p-2">
                <Shield className="text-white h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text-primary">
                  WSM Administration Console
                </h1>
                <p className="text-sm text-muted-foreground">Platform management and oversight</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Navigation Links */}
              <div className="flex items-center space-x-4">
                <Link href="/" className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-accent/20 transition-colors" data-testid="link-dashboard">
                  <Cpu className="h-4 w-4" />
                  <span className="text-sm font-medium">Dashboard</span>
                </Link>
              </div>
              
              {/* Current Time */}
              <div className="text-sm font-mono text-muted-foreground">
                {formatTime()}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="container mx-auto px-6 py-6 space-y-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold gradient-text-primary mb-2">Administration Panel</h2>
          <p className="text-muted-foreground">
            Manage system operations, user access, and platform enhancements
          </p>
        </div>

        <Tabs defaultValue="proposals" className="w-full" data-testid="admin-tabs">
          <TabsList className="grid w-full grid-cols-4" data-testid="admin-tabs-list">
            <TabsTrigger value="proposals" className="flex items-center space-x-2" data-testid="tab-proposals">
              <Settings className="w-4 h-4" />
              <span>VM Proposals</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2" data-testid="tab-users">
              <Users className="w-4 h-4" />
              <span>User Management</span>
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center space-x-2" data-testid="tab-features">
              <Flag className="w-4 h-4" />
              <span>Feature Flags</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center space-x-2" data-testid="tab-system">
              <Shield className="w-4 h-4" />
              <span>System</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="proposals" className="space-y-6">
            <ProposalReview />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <WaitingListManagement />
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <FeatureFlagManagement />
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card data-testid="card-system-health">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>System Health</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">WSM Engine</span>
                      <span className="text-sm font-medium text-green-600" data-testid="status-wsm-engine">Operational</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Database</span>
                      <span className="text-sm font-medium text-green-600" data-testid="status-database">Connected</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">WebSocket</span>
                      <span className="text-sm font-medium text-green-600" data-testid="status-websocket">Active</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Python Bridge</span>
                      <span className="text-sm font-medium text-green-600" data-testid="status-python-bridge">Ready</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-vm-monitor">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Cpu className="w-5 h-5" />
                    <span>VM Monitor</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Active VMs</span>
                      <span className="text-sm font-medium" data-testid="count-active-vms">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total Proposals</span>
                      <span className="text-sm font-medium" data-testid="count-total-proposals">-</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Registry Items</span>
                      <span className="text-sm font-medium" data-testid="count-registry-items">-</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Deployed Tools</span>
                      <span className="text-sm font-medium" data-testid="count-deployed-tools">-</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-security-overview">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>Security</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Validation Checks</span>
                      <span className="text-sm font-medium text-green-600" data-testid="status-validation">Enabled</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Access Control</span>
                      <span className="text-sm font-medium text-green-600" data-testid="status-access-control">Active</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Sandboxing</span>
                      <span className="text-sm font-medium text-green-600" data-testid="status-sandboxing">Enforced</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Audit Log</span>
                      <span className="text-sm font-medium text-green-600" data-testid="status-audit-log">Recording</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 backdrop-blur-lg mt-12">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              WSM-HA Administration v2.0.0 • Secure Management Interface
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>Admin Console</span>
              <span>•</span>
              <span>Restricted Access</span>
              <span>•</span>
              <span>Session: Active</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}