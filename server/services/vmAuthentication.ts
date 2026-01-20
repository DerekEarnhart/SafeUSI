import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { createHash, createHmac } from 'crypto';
import { proposalSecurity } from './proposalSecurityService';

export interface VMAuthenticatedRequest extends Request {
  vmId?: string;
  vmInstance?: any;
  userId?: string;
  apiKeyId?: string;
}

export class VMAuthenticationService {

  /**
   * Authenticate VM using API key approach
   * VMs should include their API key in Authorization header
   */
  async authenticateVMApiKey(req: VMAuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        await proposalSecurity.logSecurityEvent({
          eventType: 'authentication_failure',
          details: {
            reason: 'missing_authorization_header',
            endpoint: req.path,
            method: req.method,
            userAgent: req.headers['user-agent']
          },
          timestamp: new Date()
        });
        
        res.status(401).json({ 
          error: 'VM authentication required',
          details: 'Missing or invalid Authorization header. VMs must provide Bearer token.'
        });
        return;
      }

      const apiKey = authHeader.substring(7); // Remove "Bearer "
      const keyHash = createHash('sha256').update(apiKey).digest('hex');
      
      // Look up API key
      const keyRecord = await storage.getApiKeyByHash(keyHash);
      if (!keyRecord || !keyRecord.isActive) {
        await proposalSecurity.logSecurityEvent({
          eventType: 'authentication_failure',
          details: {
            reason: 'invalid_api_key',
            keyHashPartial: keyHash.substring(0, 8) + '...',
            endpoint: req.path
          },
          timestamp: new Date()
        });

        res.status(401).json({ 
          error: 'Invalid or inactive VM API key',
          details: 'The provided API key is not valid or has been deactivated.'
        });
        return;
      }

      // Check if this API key belongs to a VM (not a user)
      // We'll need to extend the API key system to identify VM keys
      // For now, check if user has VM instances associated
      const userVMs = await storage.getVMInstancesByUserId?.(keyRecord.userId);
      if (!userVMs || userVMs.length === 0) {
        await proposalSecurity.logSecurityEvent({
          eventType: 'authentication_failure',
          vmId: undefined,
          userId: keyRecord.userId,
          details: {
            reason: 'no_vm_instances',
            userId: keyRecord.userId,
            endpoint: req.path
          },
          timestamp: new Date()
        });

        res.status(403).json({ 
          error: 'API key not authorized for VM operations',
          details: 'This API key is not associated with any VM instances.'
        });
        return;
      }

      // For proposal submissions, we'll verify the specific VM in the proposal logic
      // For now, attach the user ID and let the endpoint validate VM ownership
      req.vmId = undefined; // Will be set after VM ownership validation
      req.userId = keyRecord.userId;
      req.apiKeyId = keyRecord.id;

      // Update API key last used
      await storage.updateApiKeyLastUsed(keyRecord.id);

      next();
    } catch (error) {
      console.error('VM authentication error:', error);
      res.status(500).json({ 
        error: 'VM authentication failed',
        details: 'Internal authentication error occurred.'
      });
    }
  }

  /**
   * Verify VM ownership and set VM identity in request
   */
  async verifyVMOwnership(req: VMAuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { proposerVmId } = req.body;
      
      if (!proposerVmId) {
        res.status(400).json({ 
          error: 'VM ID required',
          details: 'proposerVmId must be provided in request body.'
        });
        return;
      }

      // Get the VM instance
      const vmInstance = await storage.getVMInstance(proposerVmId);
      if (!vmInstance) {
        res.status(404).json({ 
          error: 'VM instance not found',
          details: `VM instance ${proposerVmId} does not exist.`
        });
        return;
      }

      // Check if authenticated user owns this VM
      const userVMs = await storage.getVMInstancesByUserId?.(req.userId!);
      const ownedVM = userVMs?.find(vm => vm.id === proposerVmId);
      
      if (!ownedVM) {
        await proposalSecurity.logSecurityEvent({
          eventType: 'vm_mismatch',
          vmId: proposerVmId,
          userId: req.userId,
          details: {
            reason: 'vm_ownership_violation',
            claimedVmId: proposerVmId,
            authenticatedUserId: req.userId,
            threat: 'User attempting to submit proposal for VM they do not own'
          },
          timestamp: new Date()
        });

        res.status(403).json({ 
          error: 'VM ownership required',
          details: 'You can only submit proposals for VMs that you own.'
        });
        return;
      }

      // Verify VM is in a state that can submit proposals
      if (vmInstance.status !== 'active') {
        res.status(400).json({ 
          error: 'VM not ready for proposals',
          details: `VM status is '${vmInstance.status}'. Only active VMs can submit proposals.`
        });
        return;
      }

      // Set VM identity in request
      req.vmId = proposerVmId;
      req.vmInstance = vmInstance;

      next();
    } catch (error) {
      console.error('VM ownership verification error:', error);
      res.status(500).json({ 
        error: 'VM ownership verification failed',
        details: 'Internal error during VM ownership verification.'
      });
    }
  }

  /**
   * Rate limiting middleware for proposal submissions
   */
  async rateLimitProposals(req: VMAuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const vmId = req.vmId;
      if (!vmId) {
        res.status(400).json({ error: 'VM ID not set in request' });
        return;
      }

      // Check rate limit
      const rateLimitCheck = await proposalSecurity.checkSubmissionRate(vmId);
      
      if (!rateLimitCheck.allowed) {
        await proposalSecurity.logSecurityEvent({
          eventType: 'rate_limit_exceeded',
          vmId,
          userId: req.userId,
          details: {
            currentSubmissions: await proposalSecurity.getRateLimitStatus(vmId),
            resetTime: rateLimitCheck.resetTime.toISOString(),
            ipAddress: req.ip
          },
          timestamp: new Date()
        });

        res.status(429).json({ 
          error: 'Rate limit exceeded',
          details: 'Too many proposal submissions. Please wait before submitting again.',
          rateLimitInfo: {
            remaining: rateLimitCheck.remaining,
            resetTime: rateLimitCheck.resetTime.toISOString(),
            maxPerHour: 10
          }
        });
        return;
      }

      // Add rate limit info to response headers
      res.set({
        'X-RateLimit-Remaining': rateLimitCheck.remaining.toString(),
        'X-RateLimit-Reset': rateLimitCheck.resetTime.getTime().toString()
      });

      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      res.status(500).json({ 
        error: 'Rate limiting check failed',
        details: 'Internal error during rate limit verification.'
      });
    }
  }
}

export const vmAuthentication = new VMAuthenticationService();