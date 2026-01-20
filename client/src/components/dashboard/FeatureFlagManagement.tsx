import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Settings, Plus, AlertCircle, CheckCircle2, XCircle, Flag, Users, Percent } from 'lucide-react';

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  category: string;
  isEnabled: boolean;
  rolloutPercentage: number;
  requiredAccessLevel: string;
  betaFeature: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { value: 'core', label: 'Core Features' },
  { value: 'advanced', label: 'Advanced Tools' },
  { value: 'premium', label: 'Premium Features' },
  { value: 'experimental', label: 'Experimental' }
];

const ACCESS_LEVELS = [
  { value: 'basic', label: 'Basic' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'premium', label: 'Premium' },
  { value: 'admin', label: 'Admin' }
];

export function FeatureFlagManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [newFlag, setNewFlag] = useState({
    name: '',
    description: '',
    category: 'core',
    isEnabled: false,
    rolloutPercentage: 0,
    requiredAccessLevel: 'basic',
    betaFeature: false
  });

  // Query all feature flags
  const { data: featureFlags, isLoading } = useQuery<FeatureFlag[]>({
    queryKey: ['/api/admin/feature-flags'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Update feature flag mutation
  const updateFlagMutation = useMutation({
    mutationFn: async ({ name, updates }: { name: string; updates: Partial<FeatureFlag> }) => {
      const response = await apiRequest('PATCH', `/api/admin/feature-flags/${name}`, updates);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Feature Flag Updated',
        description: `${data.flag.name} has been updated successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/feature-flags'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update feature flag',
        variant: 'destructive',
      });
    }
  });

  // Create feature flag mutation
  const createFlagMutation = useMutation({
    mutationFn: async (flagData: any) => {
      const response = await apiRequest('POST', '/api/admin/feature-flags', flagData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Feature Flag Created',
        description: `${data.flag.name} has been created successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/feature-flags'] });
      setCreateDialogOpen(false);
      resetNewFlag();
    },
    onError: (error: any) => {
      toast({
        title: 'Creation Failed',
        description: error.message || 'Failed to create feature flag',
        variant: 'destructive',
      });
    }
  });

  const resetNewFlag = () => {
    setNewFlag({
      name: '',
      description: '',
      category: 'core',
      isEnabled: false,
      rolloutPercentage: 0,
      requiredAccessLevel: 'basic',
      betaFeature: false
    });
  };

  const handleToggleFlag = (flag: FeatureFlag) => {
    updateFlagMutation.mutate({
      name: flag.name,
      updates: { isEnabled: !flag.isEnabled }
    });
  };

  const handleRolloutChange = (flag: FeatureFlag, percentage: number) => {
    updateFlagMutation.mutate({
      name: flag.name,
      updates: { rolloutPercentage: percentage }
    });
  };

  const handleAccessLevelChange = (flag: FeatureFlag, accessLevel: string) => {
    updateFlagMutation.mutate({
      name: flag.name,
      updates: { requiredAccessLevel: accessLevel }
    });
  };

  const handleCreateFlag = () => {
    if (!newFlag.name || !newFlag.description) {
      toast({
        title: 'Validation Error',
        description: 'Name and description are required',
        variant: 'destructive',
      });
      return;
    }

    createFlagMutation.mutate(newFlag);
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      core: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      advanced: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      premium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      experimental: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };
    
    return (
      <Badge className={colors[category as keyof typeof colors] || colors.core} data-testid={`badge-category-${category}`}>
        {category}
      </Badge>
    );
  };

  const getAccessLevelBadge = (level: string) => {
    const colors = {
      basic: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      advanced: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      premium: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      admin: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };
    
    return (
      <Badge className={colors[level as keyof typeof colors] || colors.basic} data-testid={`badge-access-${level}`}>
        {level}
      </Badge>
    );
  };

  const getEnabledStats = () => {
    if (!featureFlags) return { enabled: 0, total: 0, percentage: 0 };
    const enabled = featureFlags.filter(flag => flag.isEnabled).length;
    const total = featureFlags.length;
    const percentage = total > 0 ? Math.round((enabled / total) * 100) : 0;
    return { enabled, total, percentage };
  };

  const stats = getEnabledStats();

  return (
    <div className="space-y-6" data-testid="feature-flag-management">
      {/* Feature Flag Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="stats-total-flags">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feature Flags</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-flags">{stats.total}</div>
          </CardContent>
        </Card>

        <Card data-testid="stats-enabled-flags">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enabled Flags</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-enabled-flags">{stats.enabled}</div>
          </CardContent>
        </Card>

        <Card data-testid="stats-enabled-percentage">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enabled Percentage</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-enabled-percentage">{stats.percentage}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Flags Table */}
      <Card data-testid="card-feature-flags">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Feature Flags</CardTitle>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-flag">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Flag
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="dialog-create-flag">
                <DialogHeader>
                  <DialogTitle>Create New Feature Flag</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newFlag.name}
                      onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value })}
                      placeholder="feature_name"
                      data-testid="input-flag-name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newFlag.description}
                      onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
                      placeholder="Describe what this feature does..."
                      data-testid="textarea-flag-description"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={newFlag.category} onValueChange={(value) => setNewFlag({ ...newFlag, category: value })}>
                      <SelectTrigger data-testid="select-flag-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value} data-testid={`option-category-${cat.value}`}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="accessLevel">Required Access Level</Label>
                    <Select value={newFlag.requiredAccessLevel} onValueChange={(value) => setNewFlag({ ...newFlag, requiredAccessLevel: value })}>
                      <SelectTrigger data-testid="select-flag-access-level">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ACCESS_LEVELS.map(level => (
                          <SelectItem key={level.value} value={level.value} data-testid={`option-access-${level.value}`}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enabled"
                      checked={newFlag.isEnabled}
                      onCheckedChange={(checked) => setNewFlag({ ...newFlag, isEnabled: checked })}
                      data-testid="switch-flag-enabled"
                    />
                    <Label htmlFor="enabled">Enabled</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="beta"
                      checked={newFlag.betaFeature}
                      onCheckedChange={(checked) => setNewFlag({ ...newFlag, betaFeature: checked })}
                      data-testid="switch-flag-beta"
                    />
                    <Label htmlFor="beta">Beta Feature</Label>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)} data-testid="button-cancel-create">
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateFlag} 
                      disabled={createFlagMutation.isPending}
                      data-testid="button-confirm-create"
                    >
                      {createFlagMutation.isPending ? 'Creating...' : 'Create Flag'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4" data-testid="loading-flags">Loading feature flags...</div>
          ) : featureFlags?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="no-flags">
              No feature flags configured
            </div>
          ) : (
            <Table data-testid="table-feature-flags">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Access Level</TableHead>
                  <TableHead>Rollout %</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {featureFlags?.map((flag) => (
                  <TableRow key={flag.id} data-testid={`row-flag-${flag.name}`}>
                    <TableCell>
                      <div>
                        <div className="font-medium" data-testid={`text-flag-name-${flag.name}`}>{flag.name}</div>
                        {flag.betaFeature && (
                          <Badge variant="outline" className="text-xs mt-1" data-testid={`badge-beta-${flag.name}`}>
                            Beta
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={flag.description} data-testid={`text-flag-description-${flag.name}`}>
                        {flag.description}
                      </div>
                    </TableCell>
                    <TableCell>{getCategoryBadge(flag.category)}</TableCell>
                    <TableCell>
                      <Select 
                        value={flag.requiredAccessLevel} 
                        onValueChange={(value) => handleAccessLevelChange(flag, value)}
                      >
                        <SelectTrigger className="w-auto" data-testid={`select-access-${flag.name}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACCESS_LEVELS.map(level => (
                            <SelectItem key={level.value} value={level.value} data-testid={`option-access-${level.value}-${flag.name}`}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={flag.rolloutPercentage}
                          onChange={(e) => handleRolloutChange(flag, parseInt(e.target.value) || 0)}
                          className="w-20"
                          data-testid={`input-rollout-${flag.name}`}
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {flag.isEnabled ? (
                          <Badge variant="outline" className="text-green-600 bg-green-50 dark:bg-green-900/20" data-testid={`status-enabled-${flag.name}`}>
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Enabled
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600 bg-red-50 dark:bg-red-900/20" data-testid={`status-disabled-${flag.name}`}>
                            <XCircle className="w-3 h-3 mr-1" />
                            Disabled
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={flag.isEnabled}
                        onCheckedChange={() => handleToggleFlag(flag)}
                        disabled={updateFlagMutation.isPending}
                        data-testid={`switch-toggle-${flag.name}`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}