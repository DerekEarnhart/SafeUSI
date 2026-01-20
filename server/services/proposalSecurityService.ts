import { storage } from '../storage';

export interface ProposalSubmissionRate {
  vmId: string;
  submissions: { timestamp: Date; proposalId?: string }[];
  lastCleanup: Date;
}

export interface SecurityAuditEvent {
  eventType: 'proposal_submission' | 'rate_limit_exceeded' | 'authentication_failure' | 'vm_mismatch';
  vmId?: string;
  userId?: string;
  ipAddress?: string;
  details: Record<string, any>;
  timestamp: Date;
}

class ProposalSecurityService {
  private submissionTracking: Map<string, ProposalSubmissionRate> = new Map();
  private readonly RATE_LIMIT_WINDOW_HOURS = 1; // 1 hour window
  private readonly MAX_PROPOSALS_PER_HOUR = 10; // Maximum 10 proposals per hour per VM
  private readonly CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // Cleanup every 5 minutes
  
  constructor() {
    // Start periodic cleanup
    setInterval(() => this.cleanupOldSubmissions(), this.CLEANUP_INTERVAL_MS);
  }

  /**
   * Check if a VM can submit a proposal (rate limiting)
   */
  async checkSubmissionRate(vmId: string): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - (this.RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000));
    
    // Get or create tracking for this VM
    let tracking = this.submissionTracking.get(vmId);
    if (!tracking) {
      tracking = {
        vmId,
        submissions: [],
        lastCleanup: now
      };
      this.submissionTracking.set(vmId, tracking);
    }

    // Remove old submissions
    tracking.submissions = tracking.submissions.filter(sub => sub.timestamp > cutoffTime);
    
    const currentCount = tracking.submissions.length;
    const remaining = Math.max(0, this.MAX_PROPOSALS_PER_HOUR - currentCount);
    const allowed = currentCount < this.MAX_PROPOSALS_PER_HOUR;
    
    // Calculate reset time (when the oldest submission will expire)
    let resetTime = new Date(now.getTime() + (this.RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000));
    if (tracking.submissions.length > 0) {
      const oldestSubmission = tracking.submissions[0];
      resetTime = new Date(oldestSubmission.timestamp.getTime() + (this.RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000));
    }

    return { allowed, remaining, resetTime };
  }

  /**
   * Record a proposal submission for rate limiting
   */
  async recordSubmission(vmId: string, proposalId: string): Promise<void> {
    const now = new Date();
    const tracking = this.submissionTracking.get(vmId);
    
    if (tracking) {
      tracking.submissions.push({
        timestamp: now,
        proposalId
      });
    }
  }

  /**
   * Verify VM identity matches the proposer VM ID
   */
  async verifyVMIdentity(authenticatedVmId: string, proposerVmId: string): Promise<boolean> {
    // Direct match verification
    if (authenticatedVmId !== proposerVmId) {
      await this.logSecurityEvent({
        eventType: 'vm_mismatch',
        vmId: authenticatedVmId,
        details: {
          authenticatedVmId,
          claimedVmId: proposerVmId,
          threat: 'VM identity spoofing attempt'
        },
        timestamp: new Date()
      });
      return false;
    }

    return true;
  }

  /**
   * Log security events for audit trail
   */
  async logSecurityEvent(event: SecurityAuditEvent): Promise<void> {
    console.log(`[SECURITY AUDIT] ${event.eventType}:`, {
      timestamp: event.timestamp.toISOString(),
      vmId: event.vmId,
      userId: event.userId,
      details: event.details
    });

    // In production, this would write to a secure audit log system
    // For now, we'll store in memory and optionally database
    try {
      // Could extend storage interface to include security audit logs
      // await storage.createSecurityAuditLog(event);
    } catch (error) {
      console.error('Failed to persist security audit log:', error);
    }
  }

  /**
   * Clean up old tracking data
   */
  private cleanupOldSubmissions(): void {
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - (this.RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000));

    for (const [vmId, tracking] of Array.from(this.submissionTracking.entries())) {
      // Remove old submissions
      tracking.submissions = tracking.submissions.filter((sub: { timestamp: Date; proposalId?: string }) => sub.timestamp > cutoffTime);
      tracking.lastCleanup = now;

      // Remove empty tracking entries
      if (tracking.submissions.length === 0 && 
          now.getTime() - tracking.lastCleanup.getTime() > (this.CLEANUP_INTERVAL_MS * 2)) {
        this.submissionTracking.delete(vmId);
      }
    }
  }

  /**
   * Get current rate limit status for a VM
   */
  async getRateLimitStatus(vmId: string): Promise<{ submissions: number; limit: number; windowHours: number }> {
    const tracking = this.submissionTracking.get(vmId);
    const submissions = tracking ? tracking.submissions.length : 0;

    return {
      submissions,
      limit: this.MAX_PROPOSALS_PER_HOUR,
      windowHours: this.RATE_LIMIT_WINDOW_HOURS
    };
  }

  /**
   * Emergency reset for testing or admin intervention
   */
  async resetVMRateLimit(vmId: string): Promise<void> {
    this.submissionTracking.delete(vmId);
    await this.logSecurityEvent({
      eventType: 'proposal_submission',
      vmId,
      details: {
        action: 'rate_limit_reset',
        reason: 'administrative_reset'
      },
      timestamp: new Date()
    });
  }
}

export const proposalSecurity = new ProposalSecurityService();