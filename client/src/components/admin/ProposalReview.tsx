import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useVMPlatformWebSocket } from '@/hooks/useVMPlatformWebSocket';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Eye, 
  Rocket, 
  RotateCcw,
  Code,
  Palette,
  Flag,
  Settings
} from 'lucide-react';

interface ChangeProposal {
  id: string;
  proposerVmId: string;
  type: 'tool' | 'ui' | 'feature' | 'workflow';
  manifest: any;
  status: 'pending' | 'approved' | 'rejected' | 'deployed';
  validationReport?: {
    isValid: boolean;
    securityChecks: {
      passed: boolean;
      issues: string[];
    };
    dependencyChecks: {
      passed: boolean;
      missing: string[];
      conflicts: string[];
    };
    schemaValidation: {
      passed: boolean;
      errors: string[];
    };
    resourceValidation: {
      passed: boolean;
      warnings: string[];
    };
  };
  reviewedBy?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
  vmInstance?: {
    id: string;
    name: string;
    type: string;
  };
}

const ProposalTypeIcons = {
  tool: Code,
  ui: Palette,
  feature: Flag,
  workflow: Settings,
};

export function ProposalReview() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isConnected } = useVMPlatformWebSocket();
  const [selectedProposal, setSelectedProposal] = useState<ChangeProposal | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'deploy' | 'rollback'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');

  // Fetch all proposals
  const { data: proposals, isLoading } = useQuery<ChangeProposal[]>({
    queryKey: ['/api/admin/proposals'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch pending proposals for quick review
  const { data: pendingProposals } = useQuery<ChangeProposal[]>({
    queryKey: ['/api/admin/proposals', 'pending'],
    refetchInterval: 5000, // More frequent refresh for pending
  });

  // Validate proposal mutation
  const validateMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      const response = await apiRequest('POST', `/api/admin/proposals/${proposalId}/validate`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Validation Complete',
        description: 'Proposal validation has been completed.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/proposals'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Validation Failed',
        description: error.message || 'Failed to validate proposal',
        variant: 'destructive',
      });
    }
  });

  // Review proposal mutation (approve/reject)
  const reviewMutation = useMutation({
    mutationFn: async ({ proposalId, action, notes }: { proposalId: string; action: 'approve' | 'reject'; notes: string }) => {
      const response = await apiRequest('POST', `/api/admin/proposals/${proposalId}/${action}`, {
        reviewNotes: notes
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: variables.action === 'approve' ? 'Proposal Approved' : 'Proposal Rejected',
        description: `Proposal has been ${variables.action}d successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/proposals'] });
      setReviewDialogOpen(false);
      setSelectedProposal(null);
      setReviewNotes('');
    },
    onError: (error: any) => {
      toast({
        title: 'Review Failed',
        description: error.message || 'Failed to review proposal',
        variant: 'destructive',
      });
    }
  });

  // Deploy proposal mutation
  const deployMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      const response = await apiRequest('POST', `/api/admin/proposals/${proposalId}/deploy`, {
        deploymentConfig: {
          environment: 'production',
          rolloutPercentage: 100,
          monitoringEnabled: true
        }
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Deployment Started',
        description: 'Proposal deployment has been initiated.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/proposals'] });
      setReviewDialogOpen(false);
      setSelectedProposal(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Deployment Failed',
        description: error.message || 'Failed to deploy proposal',
        variant: 'destructive',
      });
    }
  });

  // Rollback proposal mutation
  const rollbackMutation = useMutation({
    mutationFn: async ({ proposalId, reason }: { proposalId: string; reason: string }) => {
      const response = await apiRequest('POST', `/api/admin/proposals/${proposalId}/rollback`, {
        reason,
        preserveData: true
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Rollback Complete',
        description: 'Proposal has been rolled back successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/proposals'] });
      setReviewDialogOpen(false);
      setSelectedProposal(null);
      setReviewNotes('');
    },
    onError: (error: any) => {
      toast({
        title: 'Rollback Failed',
        description: error.message || 'Failed to rollback proposal',
        variant: 'destructive',
      });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20" data-testid={`badge-${status}`}><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600 bg-green-50 dark:bg-green-900/20" data-testid={`badge-${status}`}><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 bg-red-50 dark:bg-red-900/20" data-testid={`badge-${status}`}><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'deployed':
        return <Badge variant="outline" className="text-blue-600 bg-blue-50 dark:bg-blue-900/20" data-testid={`badge-${status}`}><Rocket className="w-3 h-3 mr-1" />Deployed</Badge>;
      default:
        return <Badge variant="outline" data-testid={`badge-${status}`}>{status}</Badge>;
    }
  };

  const getValidationStatus = (validationReport?: any) => {
    if (!validationReport) {
      return <Badge variant="secondary" data-testid="badge-not-validated">Not Validated</Badge>;
    }
    return validationReport.isValid
      ? <Badge variant="outline" className="text-green-600 bg-green-50 dark:bg-green-900/20" data-testid="badge-validation-passed">Validation Passed</Badge>
      : <Badge variant="outline" className="text-red-600 bg-red-50 dark:bg-red-900/20" data-testid="badge-validation-failed">Validation Failed</Badge>;
  };

  const handleViewDetails = (proposal: ChangeProposal) => {
    setSelectedProposal(proposal);
    setDetailsDialogOpen(true);
  };

  const handleStartReview = (proposal: ChangeProposal, action: 'approve' | 'reject' | 'deploy' | 'rollback') => {
    setSelectedProposal(proposal);
    setReviewAction(action);
    setReviewDialogOpen(true);
  };

  const handleConfirmReview = () => {
    if (!selectedProposal) return;

    if (reviewAction === 'approve' || reviewAction === 'reject') {
      reviewMutation.mutate({
        proposalId: selectedProposal.id,
        action: reviewAction,
        notes: reviewNotes
      });
    } else if (reviewAction === 'deploy') {
      deployMutation.mutate(selectedProposal.id);
    } else if (reviewAction === 'rollback') {
      rollbackMutation.mutate({
        proposalId: selectedProposal.id,
        reason: reviewNotes
      });
    }
  };

  const TypeIcon = ({ type }: { type: string }) => {
    const Icon = ProposalTypeIcons[type as keyof typeof ProposalTypeIcons] || Settings;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6" data-testid="proposal-review">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text-primary">VM Platform Enhancement</h2>
          <p className="text-muted-foreground">Review and manage VM-generated proposals</p>
        </div>
        <div className="flex space-x-2 text-sm text-muted-foreground">
          <span data-testid="text-pending-count">Pending: {pendingProposals?.length || 0}</span>
          <span>•</span>
          <span data-testid="text-total-count">Total: {proposals?.length || 0}</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['pending', 'approved', 'rejected', 'deployed'].map(status => {
          const count = proposals?.filter(p => p.status === status).length || 0;
          return (
            <Card key={status} data-testid={`stats-${status}`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{status.charAt(0).toUpperCase() + status.slice(1)}</p>
                    <p className="text-2xl font-bold" data-testid={`text-count-${status}`}>{count}</p>
                  </div>
                  {getStatusBadge(status)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Proposals Table */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList data-testid="tabs-proposals">
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending Review ({pendingProposals?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all">
            All Proposals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card data-testid="card-pending-proposals">
            <CardHeader>
              <CardTitle>Pending Proposals</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4" data-testid="loading-pending">Loading proposals...</div>
              ) : pendingProposals?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground" data-testid="no-pending-proposals">
                  No pending proposals to review
                </div>
              ) : (
                <Table data-testid="table-pending-proposals">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>VM Source</TableHead>
                      <TableHead>Validation</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingProposals?.map((proposal) => (
                      <TableRow key={proposal.id} data-testid={`row-proposal-${proposal.id}`}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <TypeIcon type={proposal.type} />
                            <span className="capitalize" data-testid={`text-type-${proposal.id}`}>{proposal.type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium" data-testid={`text-name-${proposal.id}`}>
                            {proposal.manifest?.name || proposal.manifest?.tool?.name || proposal.manifest?.widget?.name || 'Unnamed'}
                          </div>
                          <div className="text-sm text-muted-foreground" data-testid={`text-description-${proposal.id}`}>
                            {proposal.manifest?.description || proposal.manifest?.tool?.description || proposal.manifest?.widget?.description || 'No description'}
                          </div>
                        </TableCell>
                        <TableCell data-testid={`text-vm-source-${proposal.id}`}>
                          {proposal.vmInstance?.name || proposal.proposerVmId}
                        </TableCell>
                        <TableCell>{getValidationStatus(proposal.validationReport)}</TableCell>
                        <TableCell data-testid={`text-created-at-${proposal.id}`}>
                          {new Date(proposal.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(proposal)}
                              data-testid={`button-view-${proposal.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {!proposal.validationReport && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => validateMutation.mutate(proposal.id)}
                                disabled={validateMutation.isPending}
                                data-testid={`button-validate-${proposal.id}`}
                              >
                                <AlertCircle className="w-4 h-4" />
                              </Button>
                            )}
                            {proposal.validationReport?.isValid && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => handleStartReview(proposal, 'approve')}
                                  data-testid={`button-approve-${proposal.id}`}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleStartReview(proposal, 'reject')}
                                  data-testid={`button-reject-${proposal.id}`}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
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
          <Card data-testid="card-all-proposals">
            <CardHeader>
              <CardTitle>All Proposals</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4" data-testid="loading-all">Loading all proposals...</div>
              ) : (
                <Table data-testid="table-all-proposals">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>VM Source</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proposals?.map((proposal) => (
                      <TableRow key={proposal.id} data-testid={`row-all-proposal-${proposal.id}`}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <TypeIcon type={proposal.type} />
                            <span className="capitalize" data-testid={`text-all-type-${proposal.id}`}>{proposal.type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium" data-testid={`text-all-name-${proposal.id}`}>
                            {proposal.manifest?.name || proposal.manifest?.tool?.name || proposal.manifest?.widget?.name || 'Unnamed'}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(proposal.status)}</TableCell>
                        <TableCell data-testid={`text-all-vm-source-${proposal.id}`}>
                          {proposal.vmInstance?.name || proposal.proposerVmId}
                        </TableCell>
                        <TableCell data-testid={`text-all-created-at-${proposal.id}`}>
                          {new Date(proposal.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(proposal)}
                              data-testid={`button-view-all-${proposal.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {proposal.status === 'approved' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-blue-600 hover:text-blue-700"
                                onClick={() => handleStartReview(proposal, 'deploy')}
                                data-testid={`button-deploy-${proposal.id}`}
                              >
                                <Rocket className="w-4 h-4" />
                              </Button>
                            )}
                            {proposal.status === 'deployed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-orange-600 hover:text-orange-700"
                                onClick={() => handleStartReview(proposal, 'rollback')}
                                data-testid={`button-rollback-${proposal.id}`}
                              >
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                            )}
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
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]" data-testid="dialog-proposal-details">
          <DialogHeader>
            <DialogTitle>Proposal Details</DialogTitle>
          </DialogHeader>
          {selectedProposal && (
            <ScrollArea className="h-[60vh]">
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Type</h4>
                    <div className="flex items-center space-x-2">
                      <TypeIcon type={selectedProposal.type} />
                      <span className="capitalize" data-testid="text-details-type">{selectedProposal.type}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Status</h4>
                    {getStatusBadge(selectedProposal.status)}
                  </div>
                </div>

                {/* Manifest */}
                <div>
                  <h4 className="font-medium mb-2">Manifest</h4>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto" data-testid="text-manifest">
                    {JSON.stringify(selectedProposal.manifest, null, 2)}
                  </pre>
                </div>

                {/* Validation Report */}
                {selectedProposal.validationReport && (
                  <div>
                    <h4 className="font-medium mb-2">Validation Report</h4>
                    <div className="space-y-3" data-testid="validation-report">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Overall Status:</span>
                        {getValidationStatus(selectedProposal.validationReport)}
                      </div>
                      
                      {!selectedProposal.validationReport.securityChecks.passed && (
                        <div>
                          <h5 className="font-medium text-red-600">Security Issues:</h5>
                          <ul className="list-disc list-inside text-sm" data-testid="security-issues">
                            {selectedProposal.validationReport.securityChecks.issues.map((issue, i) => (
                              <li key={i}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {!selectedProposal.validationReport.schemaValidation.passed && (
                        <div>
                          <h5 className="font-medium text-red-600">Schema Errors:</h5>
                          <ul className="list-disc list-inside text-sm" data-testid="schema-errors">
                            {selectedProposal.validationReport.schemaValidation.errors.map((error, i) => (
                              <li key={i}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Review Notes */}
                {selectedProposal.reviewNotes && (
                  <div>
                    <h4 className="font-medium mb-2">Review Notes</h4>
                    <p className="text-sm bg-muted p-3 rounded" data-testid="text-review-notes">
                      {selectedProposal.reviewNotes}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent data-testid="dialog-review">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' && 'Approve Proposal'}
              {reviewAction === 'reject' && 'Reject Proposal'}
              {reviewAction === 'deploy' && 'Deploy Proposal'}
              {reviewAction === 'rollback' && 'Rollback Proposal'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                Proposal: {selectedProposal?.manifest?.name || 'Unnamed'}
              </label>
              <p className="text-sm text-muted-foreground">
                Type: {selectedProposal?.type} • VM: {selectedProposal?.vmInstance?.name || selectedProposal?.proposerVmId}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium">
                {reviewAction === 'approve' || reviewAction === 'reject' ? 'Review Notes' : 
                 reviewAction === 'rollback' ? 'Rollback Reason' : 'Deployment Notes'} 
                {(reviewAction === 'reject' || reviewAction === 'rollback') && ' (Required)'}
              </label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={
                  reviewAction === 'approve' ? 'Optional notes about the approval...' :
                  reviewAction === 'reject' ? 'Please provide a reason for rejecting this proposal...' :
                  reviewAction === 'rollback' ? 'Please provide a reason for rolling back...' :
                  'Optional deployment notes...'
                }
                data-testid="textarea-review-notes"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setReviewDialogOpen(false)}
                data-testid="button-cancel-review"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmReview}
                disabled={
                  reviewMutation.isPending || deployMutation.isPending || rollbackMutation.isPending ||
                  ((reviewAction === 'reject' || reviewAction === 'rollback') && !reviewNotes.trim())
                }
                variant={
                  reviewAction === 'approve' ? 'default' :
                  reviewAction === 'reject' ? 'destructive' :
                  reviewAction === 'deploy' ? 'default' :
                  'destructive'
                }
                data-testid="button-confirm-review"
              >
                {reviewMutation.isPending || deployMutation.isPending || rollbackMutation.isPending 
                  ? 'Processing...' 
                  : reviewAction === 'approve' ? 'Approve' :
                    reviewAction === 'reject' ? 'Reject' :
                    reviewAction === 'deploy' ? 'Deploy' :
                    'Rollback'
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}