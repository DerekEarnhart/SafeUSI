import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useVMPlatformWebSocket } from '@/hooks/useVMPlatformWebSocket';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RegistryRenderer } from '@/components/ui/RegistryRenderer';
import { 
  Sparkles, 
  Wrench, 
  Palette, 
  Flag, 
  TrendingUp, 
  Eye, 
  Users,
  Activity,
  Star,
  Clock
} from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  version: string;
  manifest: {
    name: string;
    description: string;
    category: string;
    permissions: string[];
  };
  status: 'active' | 'deprecated' | 'disabled';
  usageCount: number;
  createdAt: string;
}

interface UiWidget {
  id: string;
  name: string;
  version: string;
  manifest: {
    name: string;
    description: string;
    component: {
      type: string;
      props: Record<string, any>;
    };
  };
  status: 'active' | 'deprecated' | 'disabled';
  flagKey?: string;
  usageCount: number;
  createdAt: string;
}

interface RegistryFeatureFlag {
  id: string;
  key: string;
  description: string;
  enabledFor: any;
  status: 'active' | 'deprecated' | 'disabled';
  relatedToolId?: string;
  relatedWidgetId?: string;
}

interface VMUpgradesProps {
  userAccessLevel?: string;
  userId?: string;
  isAdmin?: boolean;
}

export function VMUpgrades({ userAccessLevel = 'basic', userId, isAdmin = false }: VMUpgradesProps) {
  const { isConnected } = useVMPlatformWebSocket();
  const [selectedWidget, setSelectedWidget] = useState<UiWidget | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [toolDialogOpen, setToolDialogOpen] = useState(false);

  // Fetch available tools
  const { data: toolsResponse, isLoading: toolsLoading } = useQuery<{tools: Tool[], count: number, statusFilter: string}>({
    queryKey: ['/api/registry/tools'],
    refetchInterval: 30000,
  });
  const tools = toolsResponse?.tools || [];

  // Fetch available widgets
  const { data: widgetsResponse, isLoading: widgetsLoading } = useQuery<{widgets: UiWidget[], count: number, statusFilter: string}>({
    queryKey: ['/api/registry/ui-widgets'],
    refetchInterval: 30000,
  });
  const widgets = widgetsResponse?.widgets || [];

  // Fetch feature flags
  const { data: flagsResponse, isLoading: flagsLoading } = useQuery<{flags: RegistryFeatureFlag[], count: number, statusFilter: string}>({
    queryKey: ['/api/registry/feature-flags'],
    refetchInterval: 30000,
  });
  const featureFlags = flagsResponse?.flags || [];

  // Fetch registry stats
  const { data: stats } = useQuery<{
    totalTools: number;
    totalWidgets: number;
    totalFlags: number;
    recentDeployments: number;
  }>({
    queryKey: ['/api/registry/stats'],
    refetchInterval: 60000,
  });

  // Filter content based on user access level
  const accessibleTools = tools?.filter(tool => {
    if (userAccessLevel === 'admin') return true;
    if (userAccessLevel === 'premium') return tool.manifest.category !== 'system';
    if (userAccessLevel === 'advanced') return !['system', 'analysis'].includes(tool.manifest.category);
    return tool.manifest.category === 'utility';
  }) || [];

  const accessibleWidgets = widgets?.filter(widget => {
    if (userAccessLevel === 'admin') return true;
    if (!widget.flagKey) return true; // Public widgets
    // Check if user has access to flagged widgets
    const flag = featureFlags?.find(f => f.key === widget.flagKey);
    if (!flag) return false;
    // Simple access check - in real implementation this would be more sophisticated
    return userAccessLevel === 'premium' || userAccessLevel === 'admin';
  }) || [];

  const accessibleFlags = featureFlags?.filter(flag => {
    if (userAccessLevel === 'admin') return true;
    return flag.status === 'active';
  }) || [];

  const handlePreviewWidget = (widget: UiWidget) => {
    setSelectedWidget(widget);
    setPreviewDialogOpen(true);
  };

  const handleViewTool = (tool: Tool) => {
    setSelectedTool(tool);
    setToolDialogOpen(true);
  };

  const getAccessLevelBadge = (level: string) => {
    const configs = {
      basic: { color: 'text-gray-600 bg-gray-50 dark:bg-gray-900/20', label: 'Basic' },
      advanced: { color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20', label: 'Advanced' },
      premium: { color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20', label: 'Premium' },
      admin: { color: 'text-gold-600 bg-gold-50 dark:bg-gold-900/20', label: 'Admin' },
    };
    const config = configs[level as keyof typeof configs] || configs.basic;
    return (
      <Badge variant="outline" className={config.color} data-testid={`badge-access-${level}`}>
        <Star className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6" data-testid="vm-upgrades">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold gradient-text-primary flex items-center space-x-2">
            <Sparkles className="w-5 h-5" />
            <span>VM Platform Upgrades</span>
          </h3>
          <p className="text-muted-foreground">Enhanced capabilities from VM intelligence</p>
        </div>
        <div className="flex items-center space-x-2">
          {getAccessLevelBadge(userAccessLevel)}
          <Badge variant="secondary" data-testid="badge-upgrade-count">
            {accessibleTools.length + accessibleWidgets.length} Available
          </Badge>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="stats-tools">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available Tools</p>
                <p className="text-2xl font-bold" data-testid="text-tools-count">{accessibleTools.length}</p>
              </div>
              <Wrench className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stats-widgets">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">UI Widgets</p>
                <p className="text-2xl font-bold" data-testid="text-widgets-count">{accessibleWidgets.length}</p>
              </div>
              <Palette className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stats-flags">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Feature Flags</p>
                <p className="text-2xl font-bold" data-testid="text-flags-count">{accessibleFlags.length}</p>
              </div>
              <Flag className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stats-usage">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Usage</p>
                <p className="text-2xl font-bold" data-testid="text-total-usage">
                  {(accessibleTools.reduce((sum, t) => sum + t.usageCount, 0) + 
                    accessibleWidgets.reduce((sum, w) => sum + w.usageCount, 0)).toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Capabilities */}
      <Tabs defaultValue="widgets" className="w-full">
        <TabsList data-testid="tabs-upgrades">
          <TabsTrigger value="widgets" data-testid="tab-widgets">
            UI Widgets ({accessibleWidgets.length})
          </TabsTrigger>
          <TabsTrigger value="tools" data-testid="tab-tools">
            Tools ({accessibleTools.length})
          </TabsTrigger>
          <TabsTrigger value="flags" data-testid="tab-flags">
            Features ({accessibleFlags.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="widgets" className="space-y-4">
          <Card data-testid="card-widgets">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="w-5 h-5" />
                <span>Available UI Widgets</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {widgetsLoading ? (
                <div className="text-center py-4" data-testid="loading-widgets">Loading widgets...</div>
              ) : accessibleWidgets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground" data-testid="no-widgets">
                  No widgets available for your access level
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {accessibleWidgets.map((widget) => (
                    <Card key={widget.id} className="hover:shadow-md transition-shadow cursor-pointer" data-testid={`card-widget-${widget.id}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm" data-testid={`text-widget-name-${widget.id}`}>
                            {widget.manifest.name}
                          </CardTitle>
                          <Badge variant="secondary" data-testid={`badge-widget-type-${widget.id}`}>
                            {widget.manifest.component.type}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground mb-3" data-testid={`text-widget-description-${widget.id}`}>
                          {widget.manifest.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <Users className="w-3 h-3" />
                            <span data-testid={`text-widget-usage-${widget.id}`}>{widget.usageCount}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePreviewWidget(widget)}
                            data-testid={`button-preview-widget-${widget.id}`}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Preview
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <Card data-testid="card-tools">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wrench className="w-5 h-5" />
                <span>Available Tools</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {toolsLoading ? (
                <div className="text-center py-4" data-testid="loading-tools">Loading tools...</div>
              ) : accessibleTools.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground" data-testid="no-tools">
                  No tools available for your access level
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {accessibleTools.map((tool) => (
                    <Card key={tool.id} className="hover:shadow-md transition-shadow cursor-pointer" data-testid={`card-tool-${tool.id}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm" data-testid={`text-tool-name-${tool.id}`}>
                            {tool.manifest.name}
                          </CardTitle>
                          <Badge variant="secondary" data-testid={`badge-tool-category-${tool.id}`}>
                            {tool.manifest.category}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground mb-3" data-testid={`text-tool-description-${tool.id}`}>
                          {tool.manifest.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <Activity className="w-3 h-3" />
                            <span data-testid={`text-tool-usage-${tool.id}`}>{tool.usageCount}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewTool(tool)}
                            data-testid={`button-view-tool-${tool.id}`}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flags" className="space-y-4">
          <Card data-testid="card-flags">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Flag className="w-5 h-5" />
                <span>Feature Flags</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {flagsLoading ? (
                <div className="text-center py-4" data-testid="loading-flags">Loading feature flags...</div>
              ) : accessibleFlags.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground" data-testid="no-flags">
                  No feature flags available
                </div>
              ) : (
                <div className="space-y-3">
                  {accessibleFlags.map((flag) => (
                    <Card key={flag.id} className="p-4" data-testid={`card-flag-${flag.id}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium" data-testid={`text-flag-key-${flag.id}`}>{flag.key}</h4>
                          <p className="text-sm text-muted-foreground" data-testid={`text-flag-description-${flag.id}`}>
                            {flag.description}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={flag.status === 'active' ? 'default' : 'secondary'}
                            data-testid={`badge-flag-status-${flag.id}`}
                          >
                            {flag.status}
                          </Badge>
                          {(flag.relatedToolId || flag.relatedWidgetId) && (
                            <Badge variant="outline" data-testid={`badge-flag-linked-${flag.id}`}>
                              Linked
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Widget Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]" data-testid="dialog-widget-preview">
          <DialogHeader>
            <DialogTitle>Widget Preview: {selectedWidget?.manifest.name}</DialogTitle>
          </DialogHeader>
          {selectedWidget && (
            <ScrollArea className="h-[60vh]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Type:</span> {selectedWidget.manifest.component.type}
                  </div>
                  <div>
                    <span className="font-medium">Version:</span> {selectedWidget.version}
                  </div>
                  <div>
                    <span className="font-medium">Usage:</span> {selectedWidget.usageCount} times
                  </div>
                  <div>
                    <span className="font-medium">Created:</span> {new Date(selectedWidget.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="border rounded-lg p-4 bg-muted/10">
                  <h4 className="font-medium mb-2">Live Preview</h4>
                  <RegistryRenderer 
                    widgetId={selectedWidget.id} 
                    userAccessLevel={userAccessLevel}
                    data-testid={`preview-widget-${selectedWidget.id}`}
                  />
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Tool Details Dialog */}
      <Dialog open={toolDialogOpen} onOpenChange={setToolDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-tool-details">
          <DialogHeader>
            <DialogTitle>Tool Details: {selectedTool?.manifest.name}</DialogTitle>
          </DialogHeader>
          {selectedTool && (
            <ScrollArea className="h-[50vh]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Category:</span> {selectedTool.manifest.category}
                  </div>
                  <div>
                    <span className="font-medium">Version:</span> {selectedTool.version}
                  </div>
                  <div>
                    <span className="font-medium">Usage:</span> {selectedTool.usageCount} executions
                  </div>
                  <div>
                    <span className="font-medium">Created:</span> {new Date(selectedTool.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground" data-testid={`tool-full-description-${selectedTool.id}`}>
                    {selectedTool.manifest.description}
                  </p>
                </div>

                {selectedTool.manifest.permissions && selectedTool.manifest.permissions.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Required Permissions</h4>
                    <div className="flex flex-wrap gap-1" data-testid={`tool-permissions-${selectedTool.id}`}>
                      {selectedTool.manifest.permissions.map((permission, i) => (
                        <Badge key={i} variant="outline" data-testid={`permission-${selectedTool.id}-${i}`}>
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}