import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/useWebSocket';

interface ProposalUpdateMessage {
  type: 'proposal_update';
  data: {
    proposalId: string;
    status: 'pending' | 'approved' | 'rejected' | 'deployed';
    validationReport?: any;
    reviewNotes?: string;
    deploymentStatus?: 'success' | 'failed' | 'in_progress';
  };
}

interface RegistryUpdateMessage {
  type: 'registry_update';
  data: {
    type: 'tool' | 'widget' | 'flag';
    id: string;
    action: 'created' | 'updated' | 'deleted' | 'deployed';
    status?: string;
    usageCount?: number;
  };
}

interface VMStatusMessage {
  type: 'vm_platform_status';
  data: {
    activeProposals: number;
    pendingValidations: number;
    deployedTools: number;
    activeWidgets: number;
  };
}

type VMPlatformMessage = ProposalUpdateMessage | RegistryUpdateMessage | VMStatusMessage;

export function useVMPlatformWebSocket() {
  const { lastMessage } = useWebSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!lastMessage) return;

    try {
      // lastMessage is already a parsed object from useWebSocket
      const message = lastMessage as unknown as VMPlatformMessage;

      switch (message.type) {
        case 'proposal_update':
          // Invalidate all proposal queries
          queryClient.invalidateQueries({ queryKey: ['/api/admin/proposals'] });
          queryClient.invalidateQueries({ queryKey: ['/api/admin/proposals', 'pending'] });
          
          // Update specific proposal in cache if we have it
          const proposalId = message.data.proposalId;
          queryClient.setQueryData(
            ['/api/admin/proposals', proposalId],
            (oldData: any) => {
              if (!oldData) return oldData;
              return {
                ...oldData,
                status: message.data.status,
                validationReport: message.data.validationReport || oldData.validationReport,
                reviewNotes: message.data.reviewNotes || oldData.reviewNotes,
              };
            }
          );
          break;

        case 'registry_update':
          // Invalidate registry queries based on the type of update
          if (message.data.type === 'tool') {
            queryClient.invalidateQueries({ queryKey: ['/api/registry/tools'] });
          } else if (message.data.type === 'widget') {
            queryClient.invalidateQueries({ queryKey: ['/api/registry/widgets'] });
          } else if (message.data.type === 'flag') {
            queryClient.invalidateQueries({ queryKey: ['/api/registry/feature-flags'] });
          }
          
          // Invalidate stats
          queryClient.invalidateQueries({ queryKey: ['/api/registry/stats'] });
          break;

        case 'vm_platform_status':
          // Update platform status cache
          queryClient.setQueryData(['/api/vm-platform/status'], message.data);
          
          // Invalidate related queries to ensure consistency
          queryClient.invalidateQueries({ queryKey: ['/api/registry/stats'] });
          break;

        default:
          // Handle unknown message types gracefully
          break;
      }
    } catch (error) {
      console.warn('Failed to parse VM platform WebSocket message:', error);
    }
  }, [lastMessage, queryClient]);

  return {
    isConnected: !!lastMessage,
  };
}