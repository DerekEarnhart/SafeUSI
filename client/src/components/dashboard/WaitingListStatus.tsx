import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Clock, CheckCircle, XCircle, AlertCircle, Mail, Key, Users, Star } from 'lucide-react';

interface WaitingListStatus {
  isOnWaitingList: boolean;
  application?: {
    id: string;
    reason: string;
    intendedUse: string;
    status: 'pending' | 'approved' | 'denied';
    priority: 'normal' | 'high';
    createdAt: string;
    reviewedAt?: string;
    adminNotes?: string;
  };
  accessLevel?: {
    name: string;
    displayName: string;
    description: string;
    features: string[];
  };
  availableFeatures: string[];
  user: {
    id: string;
    username: string;
    email: string;
    accessLevel: string;
    waitingListStatus: string;
  };
}

const FEATURE_DESCRIPTIONS = {
  wsm_chat: 'Interactive WSM Chat Interface',
  wsm_status: 'Real-time WSM Status Monitoring',
  file_processing: 'Advanced File Processing and Analysis',
  harmonic_analysis: 'Sophisticated Harmonic Analysis Tools',
  vm_provisioning: 'VM Provisioning and Management',
  agent_orchestration: 'Agent Orchestration and Workflows',
  vm_benchmarking: 'VM Benchmarking and Performance Testing'
};

export function WaitingListStatus() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [inviteCodeDialogOpen, setInviteCodeDialogOpen] = useState(false);
  const [applicationForm, setApplicationForm] = useState({
    reason: '',
    intendedUse: '',
    priority: 'normal'
  });
  const [invitationCode, setInvitationCode] = useState('');

  // Query user's waiting list status
  const { data: status, isLoading } = useQuery<WaitingListStatus>({
    queryKey: ['/api/waiting-list/status'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Submit waiting list application mutation
  const applyMutation = useMutation({
    mutationFn: async (applicationData: any) => {
      const response = await apiRequest('POST', '/api/waiting-list/apply', applicationData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Application Submitted',
        description: 'Your waiting list application has been submitted successfully. You will be notified when reviewed.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/waiting-list/status'] });
      setApplyDialogOpen(false);
      setApplicationForm({ reason: '', intendedUse: '', priority: 'normal' });
    },
    onError: (error: any) => {
      toast({
        title: 'Application Failed',
        description: error.message || 'Failed to submit application',
        variant: 'destructive',
      });
    }
  });

  // Redeem invitation code mutation
  const redeemMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest('POST', '/api/invitation/redeem', { code });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Invitation Redeemed',
        description: `Welcome! You now have ${data.invitation.accessLevel} access.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/waiting-list/status'] });
      setInviteCodeDialogOpen(false);
      setInvitationCode('');
    },
    onError: (error: any) => {
      toast({
        title: 'Redemption Failed',
        description: error.message || 'Invalid or expired invitation code',
        variant: 'destructive',
      });
    }
  });

  const handleSubmitApplication = () => {
    if (!applicationForm.reason.trim() || !applicationForm.intendedUse.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    applyMutation.mutate(applicationForm);
  };

  const handleRedeemCode = () => {
    if (!invitationCode.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter an invitation code',
        variant: 'destructive',
      });
      return;
    }

    redeemMutation.mutate(invitationCode);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20" data-testid="badge-status-pending"><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600 bg-green-50 dark:bg-green-900/20" data-testid="badge-status-approved"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'denied':
        return <Badge variant="outline" className="text-red-600 bg-red-50 dark:bg-red-900/20" data-testid="badge-status-denied"><XCircle className="w-3 h-3 mr-1" />Denied</Badge>;
      default:
        return <Badge variant="outline" data-testid="badge-status-unknown">{status}</Badge>;
    }
  };

  const getAccessLevelBadge = (level: string) => {
    const colors = {
      waiting: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
      basic: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      advanced: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      premium: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      admin: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };
    
    return (
      <Badge className={colors[level as keyof typeof colors] || colors.waiting} data-testid={`badge-access-${level}`}>
        {level}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8" data-testid="loading-status">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your access status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="waiting-list-status">
      {/* Current Status Card */}
      <Card data-testid="card-current-status">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Your Access Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Access Level</p>
              <div className="flex items-center space-x-2 mt-1">
                {getAccessLevelBadge(status?.user.accessLevel || 'waiting')}
                <span className="font-medium" data-testid="text-access-level-name">
                  {status?.accessLevel?.displayName || 'Waiting List'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Available Features</p>
              <p className="text-2xl font-bold text-primary" data-testid="text-feature-count">
                {status?.availableFeatures.length || 0}
              </p>
            </div>
          </div>

          {status?.accessLevel?.description && (
            <p className="text-sm text-muted-foreground" data-testid="text-access-description">
              {status.accessLevel.description}
            </p>
          )}

          <div className="flex space-x-2">
            {!status?.isOnWaitingList && status?.user.waitingListStatus !== 'approved' && (
              <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-apply-waiting-list">
                    <Mail className="w-4 h-4 mr-2" />
                    Apply for Access
                  </Button>
                </DialogTrigger>
              </Dialog>
            )}

            <Dialog open={inviteCodeDialogOpen} onOpenChange={setInviteCodeDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-redeem-code">
                  <Key className="w-4 h-4 mr-2" />
                  Redeem Invitation
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Waiting List Application Status */}
      {status?.isOnWaitingList && status?.application && (
        <Card data-testid="card-application-status">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Waiting List Application
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Application Status</p>
                <div className="mt-1">
                  {getStatusBadge(status.application.status)}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Submitted</p>
                <p className="font-medium" data-testid="text-submitted-date">
                  {new Date(status.application.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Reason for Access</p>
              <p className="text-sm bg-muted p-2 rounded" data-testid="text-application-reason">
                {status.application.reason}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Intended Use</p>
              <p className="text-sm bg-muted p-2 rounded" data-testid="text-application-intended-use">
                {status.application.intendedUse}
              </p>
            </div>

            {status.application.adminNotes && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Admin Notes</p>
                <p className="text-sm bg-muted p-2 rounded" data-testid="text-admin-notes">
                  {status.application.adminNotes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Available Features */}
      <Card data-testid="card-available-features">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Star className="w-5 h-5 mr-2" />
            Available Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          {status?.availableFeatures.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="no-features">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No Features Available</p>
              <p className="text-sm">
                Apply for access to unlock platform features
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="features-grid">
              {status?.availableFeatures.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center p-3 border rounded-lg bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
                  data-testid={`feature-${feature}`}
                >
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">
                      {FEATURE_DESCRIPTIONS[feature as keyof typeof FEATURE_DESCRIPTIONS] || feature}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Dialog */}
      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent data-testid="dialog-apply">
          <DialogHeader>
            <DialogTitle>Apply for Platform Access</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Why do you want access to this platform?</Label>
              <Textarea
                id="reason"
                value={applicationForm.reason}
                onChange={(e) => setApplicationForm({ ...applicationForm, reason: e.target.value })}
                placeholder="Explain your background and why you need access..."
                className="mt-1"
                data-testid="textarea-reason"
              />
            </div>
            
            <div>
              <Label htmlFor="intendedUse">How do you plan to use the platform?</Label>
              <Textarea
                id="intendedUse"
                value={applicationForm.intendedUse}
                onChange={(e) => setApplicationForm({ ...applicationForm, intendedUse: e.target.value })}
                placeholder="Describe your specific use cases and projects..."
                className="mt-1"
                data-testid="textarea-intended-use"
              />
            </div>

            <div>
              <Label htmlFor="priority">Priority Level</Label>
              <Select value={applicationForm.priority} onValueChange={(value) => setApplicationForm({ ...applicationForm, priority: value })}>
                <SelectTrigger className="mt-1" data-testid="select-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal" data-testid="option-normal">Normal</SelectItem>
                  <SelectItem value="high" data-testid="option-high">High Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setApplyDialogOpen(false)} data-testid="button-cancel-apply">
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitApplication} 
                disabled={applyMutation.isPending}
                data-testid="button-submit-application"
              >
                {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invitation Code Dialog */}
      <Dialog open={inviteCodeDialogOpen} onOpenChange={setInviteCodeDialogOpen}>
        <DialogContent data-testid="dialog-redeem">
          <DialogHeader>
            <DialogTitle>Redeem Invitation Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="inviteCode">Invitation Code</Label>
              <Input
                id="inviteCode"
                value={invitationCode}
                onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                placeholder="Enter your 8-character code"
                className="mt-1 font-mono"
                maxLength={8}
                data-testid="input-invitation-code"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter the invitation code you received via email
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setInviteCodeDialogOpen(false)} data-testid="button-cancel-redeem">
                Cancel
              </Button>
              <Button 
                onClick={handleRedeemCode} 
                disabled={redeemMutation.isPending || !invitationCode.trim()}
                data-testid="button-confirm-redeem"
              >
                {redeemMutation.isPending ? 'Redeeming...' : 'Redeem Code'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}