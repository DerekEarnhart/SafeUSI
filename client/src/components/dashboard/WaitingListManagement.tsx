import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Clock, Users, CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react';

interface WaitingListApplication {
  id: string;
  userId: string;
  reason: string;
  intendedUse: string;
  status: 'pending' | 'approved' | 'denied';
  priority: 'normal' | 'high';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminNotes?: string;
  user: {
    id: string;
    username: string;
    email: string;
    accessLevel: string;
    waitingListStatus: string;
  };
}

interface WaitingListStats {
  totalApplications: number;
  pendingApplications: number;
  approvedToday: number;
  averageWaitTime: number;
}

const ACCESS_LEVELS = [
  { value: 'basic', label: 'Basic Access', description: 'Core WSM functionality' },
  { value: 'advanced', label: 'Advanced Access', description: 'Enhanced tools and analysis' },
  { value: 'premium', label: 'Premium Access', description: 'Full platform capabilities' },
  { value: 'admin', label: 'Administrator', description: 'Full administrative access' }
];

export function WaitingListManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedApplication, setSelectedApplication] = useState<WaitingListApplication | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [denialDialogOpen, setDenialDialogOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [denialReason, setDenialReason] = useState('');
  const [selectedAccessLevel, setSelectedAccessLevel] = useState('basic');

  // Query waiting list statistics
  const { data: stats } = useQuery<WaitingListStats>({
    queryKey: ['/api/admin/waiting-list/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Query pending applications
  const { data: pendingApplications, isLoading: loadingPending } = useQuery<WaitingListApplication[]>({
    queryKey: ['/api/admin/waiting-list/applications', 'pending'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Query all applications
  const { data: allApplications, isLoading: loadingAll } = useQuery<WaitingListApplication[]>({
    queryKey: ['/api/admin/waiting-list/applications'],
    refetchInterval: 30000,
  });

  // Approve user mutation
  const approveMutation = useMutation({
    mutationFn: async ({ userId, accessLevel, notes }: { userId: string; accessLevel: string; notes?: string }) => {
      const response = await apiRequest('POST', `/api/admin/waiting-list/approve`, { userId, accessLevel, notes });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'User Approved',
        description: `User has been approved with ${data.result.user.accessLevel} access. Invitation code: ${data.result.invitationCode.code}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/waiting-list/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/waiting-list/applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/waiting-list/applications', 'pending'] });
      setApprovalDialogOpen(false);
      setSelectedApplication(null);
      setApprovalNotes('');
    },
    onError: (error: any) => {
      toast({
        title: 'Approval Failed',
        description: error.message || 'Failed to approve user',
        variant: 'destructive',
      });
    }
  });

  // Deny user mutation
  const denyMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const response = await apiRequest('POST', `/api/admin/waiting-list/deny`, { userId, reason });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'User Denied',
        description: 'User has been denied access',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/waiting-list/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/waiting-list/applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/waiting-list/applications', 'pending'] });
      setDenialDialogOpen(false);
      setSelectedApplication(null);
      setDenialReason('');
    },
    onError: (error: any) => {
      toast({
        title: 'Denial Failed',
        description: error.message || 'Failed to deny user',
        variant: 'destructive',
      });
    }
  });

  const handleApprove = (application: WaitingListApplication) => {
    setSelectedApplication(application);
    setApprovalDialogOpen(true);
  };

  const handleDeny = (application: WaitingListApplication) => {
    setSelectedApplication(application);
    setDenialDialogOpen(true);
  };

  const confirmApproval = () => {
    if (selectedApplication) {
      approveMutation.mutate({
        userId: selectedApplication.userId,
        accessLevel: selectedAccessLevel,
        notes: approvalNotes
      });
    }
  };

  const confirmDenial = () => {
    if (selectedApplication) {
      denyMutation.mutate({
        userId: selectedApplication.userId,
        reason: denialReason
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20" data-testid={`badge-${status}`}><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600 bg-green-50 dark:bg-green-900/20" data-testid={`badge-${status}`}><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'denied':
        return <Badge variant="outline" className="text-red-600 bg-red-50 dark:bg-red-900/20" data-testid={`badge-${status}`}><XCircle className="w-3 h-3 mr-1" />Denied</Badge>;
      default:
        return <Badge variant="outline" data-testid={`badge-${status}`}>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    return priority === 'high' 
      ? <Badge variant="destructive" data-testid={`priority-${priority}`}><AlertCircle className="w-3 h-3 mr-1" />High Priority</Badge>
      : <Badge variant="secondary" data-testid={`priority-${priority}`}>Normal</Badge>;
  };

  return (
    <div className="space-y-6" data-testid="waiting-list-management">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="stats-total">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-applications">{stats?.totalApplications || 0}</div>
          </CardContent>
        </Card>

        <Card data-testid="stats-pending">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="text-pending-applications">{stats?.pendingApplications || 0}</div>
          </CardContent>
        </Card>

        <Card data-testid="stats-approved-today">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-approved-today">{stats?.approvedToday || 0}</div>
          </CardContent>
        </Card>

        <Card data-testid="stats-avg-wait">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Wait Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-wait-time">{stats?.averageWaitTime?.toFixed(1) || 0} days</div>
          </CardContent>
        </Card>
      </div>

      {/* Applications Management */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList data-testid="tabs-applications">
          <TabsTrigger value="pending" data-testid="tab-pending">Pending Applications ({stats?.pendingApplications || 0})</TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all">All Applications</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card data-testid="card-pending-applications">
            <CardHeader>
              <CardTitle>Pending Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPending ? (
                <div className="text-center py-4" data-testid="loading-pending">Loading pending applications...</div>
              ) : pendingApplications?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground" data-testid="no-pending-applications">
                  No pending applications to review
                </div>
              ) : (
                <Table data-testid="table-pending-applications">
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Intended Use</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingApplications?.map((application) => (
                      <TableRow key={application.id} data-testid={`row-application-${application.id}`}>
                        <TableCell>
                          <div>
                            <div className="font-medium" data-testid={`text-username-${application.user.id}`}>{application.user.username}</div>
                            <div className="text-sm text-muted-foreground" data-testid={`text-email-${application.user.id}`}>{application.user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={application.reason} data-testid={`text-reason-${application.id}`}>
                            {application.reason}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={application.intendedUse} data-testid={`text-intended-use-${application.id}`}>
                            {application.intendedUse}
                          </div>
                        </TableCell>
                        <TableCell>{getPriorityBadge(application.priority)}</TableCell>
                        <TableCell data-testid={`text-created-at-${application.id}`}>
                          {new Date(application.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleApprove(application)}
                              data-testid={`button-approve-${application.id}`}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeny(application)}
                              data-testid={`button-deny-${application.id}`}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Deny
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card data-testid="card-all-applications">
            <CardHeader>
              <CardTitle>All Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAll ? (
                <div className="text-center py-4" data-testid="loading-all">Loading all applications...</div>
              ) : (
                <Table data-testid="table-all-applications">
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead>Reviewed</TableHead>
                      <TableHead>Access Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allApplications?.map((application) => (
                      <TableRow key={application.id} data-testid={`row-all-application-${application.id}`}>
                        <TableCell>
                          <div>
                            <div className="font-medium" data-testid={`text-all-username-${application.user.id}`}>{application.user.username}</div>
                            <div className="text-sm text-muted-foreground" data-testid={`text-all-email-${application.user.id}`}>{application.user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(application.status)}</TableCell>
                        <TableCell>{getPriorityBadge(application.priority)}</TableCell>
                        <TableCell data-testid={`text-all-created-at-${application.id}`}>
                          {new Date(application.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell data-testid={`text-all-reviewed-at-${application.id}`}>
                          {application.reviewedAt ? new Date(application.reviewedAt).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell data-testid={`text-all-access-level-${application.id}`}>
                          <Badge variant="outline">{application.user.accessLevel}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent data-testid="dialog-approve">
          <DialogHeader>
            <DialogTitle>Approve User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">User: {selectedApplication?.user.username}</label>
              <p className="text-sm text-muted-foreground">{selectedApplication?.user.email}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium">Access Level</label>
              <Select value={selectedAccessLevel} onValueChange={setSelectedAccessLevel}>
                <SelectTrigger data-testid="select-access-level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCESS_LEVELS.map(level => (
                    <SelectItem key={level.value} value={level.value} data-testid={`option-${level.value}`}>
                      <div>
                        <div className="font-medium">{level.label}</div>
                        <div className="text-xs text-muted-foreground">{level.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Admin Notes (Optional)</label>
              <Textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Add any notes about this approval..."
                data-testid="textarea-approval-notes"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setApprovalDialogOpen(false)} data-testid="button-cancel-approve">
                Cancel
              </Button>
              <Button 
                onClick={confirmApproval} 
                disabled={approveMutation.isPending}
                data-testid="button-confirm-approve"
              >
                {approveMutation.isPending ? 'Approving...' : 'Approve User'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Denial Dialog */}
      <Dialog open={denialDialogOpen} onOpenChange={setDenialDialogOpen}>
        <DialogContent data-testid="dialog-deny">
          <DialogHeader>
            <DialogTitle>Deny User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">User: {selectedApplication?.user.username}</label>
              <p className="text-sm text-muted-foreground">{selectedApplication?.user.email}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium">Reason for Denial</label>
              <Textarea
                value={denialReason}
                onChange={(e) => setDenialReason(e.target.value)}
                placeholder="Please provide a reason for denying access..."
                required
                data-testid="textarea-denial-reason"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setDenialDialogOpen(false)} data-testid="button-cancel-deny">
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={confirmDenial} 
                disabled={denyMutation.isPending || !denialReason.trim()}
                data-testid="button-confirm-deny"
              >
                {denyMutation.isPending ? 'Denying...' : 'Deny User'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}