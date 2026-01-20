import { storage } from '../storage';
import { User } from '@shared/schema';

export interface AccessLevel {
  name: string;
  priority: number;
  displayName: string;
  description: string;
  features: string[];
}

export const ACCESS_LEVELS: Record<string, AccessLevel> = {
  waiting: {
    name: 'waiting',
    priority: 0,
    displayName: 'Waiting List',
    description: 'Limited access while on waiting list',
    features: []
  },
  basic: {
    name: 'basic',
    priority: 1,
    displayName: 'Basic Access',
    description: 'Core WSM functionality',
    features: ['wsm_chat', 'wsm_status']
  },
  advanced: {
    name: 'advanced',
    priority: 2,
    displayName: 'Advanced Access',
    description: 'Enhanced tools and analysis',
    features: ['wsm_chat', 'wsm_status', 'file_processing', 'harmonic_analysis']
  },
  premium: {
    name: 'premium',
    priority: 3,
    displayName: 'Premium Access',
    description: 'Full platform capabilities',
    features: ['wsm_chat', 'wsm_status', 'file_processing', 'harmonic_analysis', 'vm_provisioning', 'agent_orchestration']
  },
  admin: {
    name: 'admin',
    priority: 4,
    displayName: 'Administrator',
    description: 'Full administrative access',
    features: ['*'] // All features
  }
};

export class AccessControlService {
  /**
   * Check if user has access to a specific feature
   */
  async checkFeatureAccess(userId: string, featureName: string): Promise<boolean> {
    const user = await storage.getUser(userId);
    if (!user) return false;

    // Admin has access to everything
    if (user.accessLevel === 'admin') return true;

    // Check if feature is enabled via feature flags
    const featureFlag = await storage.getFeatureFlag(featureName);
    if (!featureFlag || !featureFlag.isEnabled) return false;

    // Check if user's access level has permission for this feature
    return await storage.checkUserPermission(userId, featureName);
  }

  /**
   * Get all features available to a user's access level
   */
  async getUserFeatures(userId: string): Promise<string[]> {
    const user = await storage.getUser(userId);
    if (!user) return [];

    if (user.accessLevel === 'admin') {
      // Admin gets all enabled features
      const allFlags = await storage.getAllFeatureFlags();
      return allFlags.filter(flag => flag.isEnabled).map(flag => flag.name);
    }

    return await storage.getEnabledFeaturesForAccessLevel(user.accessLevel);
  }

  /**
   * Check if user has required access level
   */
  async checkAccessLevel(userId: string, requiredLevel: string): Promise<boolean> {
    const user = await storage.getUser(userId);
    if (!user) return false;

    const userLevel = ACCESS_LEVELS[user.accessLevel];
    const requiredLevelInfo = ACCESS_LEVELS[requiredLevel];

    if (!userLevel || !requiredLevelInfo) return false;

    return userLevel.priority >= requiredLevelInfo.priority;
  }

  /**
   * Get user's current access level information
   */
  async getUserAccessLevel(userId: string): Promise<AccessLevel | null> {
    const user = await storage.getUser(userId);
    if (!user) return null;

    return ACCESS_LEVELS[user.accessLevel] || null;
  }

  /**
   * Check if user is on waiting list
   */
  async isUserOnWaitingList(userId: string): Promise<boolean> {
    const user = await storage.getUser(userId);
    if (!user) return false;

    return user.waitingListStatus === 'pending' || user.accessLevel === 'waiting';
  }

  /**
   * Get user's waiting list application
   */
  async getUserWaitingListApplication(userId: string) {
    return await storage.getWaitingListApplicationByUserId(userId);
  }

  /**
   * Create waiting list application for user
   */
  async submitWaitingListApplication(userId: string, reason: string, intendedUse: string, priority: 'normal' | 'high' = 'normal') {
    const user = await storage.getUser(userId);
    if (!user) throw new Error('User not found');

    // Check if user already has an application
    const existingApp = await storage.getWaitingListApplicationByUserId(userId);
    if (existingApp) {
      throw new Error('User already has a waiting list application');
    }

    // Create waiting list application
    const application = await storage.createWaitingListApplication({
      userId,
      useCase: reason,
      intendedUsage: intendedUse,
      status: 'pending',
      priority: priority === 'high' ? 8 : 5, // Convert string to number (1-10 scale)
      reviewedBy: null,
      adminNotes: null,
    });

    // Update user status
    await storage.updateUser(userId, {
      waitingListStatus: 'pending',
      accessLevel: 'waiting'
    });

    return application;
  }

  /**
   * Approve user from waiting list
   */
  async approveUserFromWaitingList(userId: string, adminId: string, accessLevel: string, notes?: string) {
    const user = await storage.getUser(userId);
    if (!user) throw new Error('User not found');

    const application = await storage.getWaitingListApplicationByUserId(userId);
    if (!application) {
      throw new Error('No waiting list application found for user');
    }

    if (application.status !== 'pending') {
      throw new Error('Application is not pending');
    }

    // Validate access level
    if (!ACCESS_LEVELS[accessLevel]) {
      throw new Error('Invalid access level');
    }

    // Approve user
    const success = await storage.approveUser(userId, adminId, accessLevel);
    if (!success) {
      throw new Error('Failed to approve user');
    }

    // Generate invitation code
    const invitationCode = await this.generateInvitationCode(userId, adminId, accessLevel);

    return {
      user: await storage.getUser(userId),
      application: await storage.getWaitingListApplicationByUserId(userId),
      invitationCode
    };
  }

  /**
   * Deny user from waiting list
   */
  async denyUserFromWaitingList(userId: string, adminId: string, reason: string) {
    const user = await storage.getUser(userId);
    if (!user) throw new Error('User not found');

    const application = await storage.getWaitingListApplicationByUserId(userId);
    if (!application) {
      throw new Error('No waiting list application found for user');
    }

    if (application.status !== 'pending') {
      throw new Error('Application is not pending');
    }

    // Deny user
    const success = await storage.denyUser(userId, adminId, reason);
    if (!success) {
      throw new Error('Failed to deny user');
    }

    return {
      user: await storage.getUser(userId),
      application: await storage.getWaitingListApplicationByUserId(userId)
    };
  }

  /**
   * Generate invitation code for approved user
   */
  async generateInvitationCode(userId: string, adminId: string, accessLevel: string) {
    const code = this.generateRandomCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    return await storage.createInvitationCode({
      code,
      userId,
      accessLevel,
      expiresAt,
      createdBy: adminId
    });
  }

  /**
   * Validate and use invitation code
   */
  async useInvitationCode(code: string, userId: string) {
    const invitation = await storage.getValidInvitationCode(code);
    if (!invitation) {
      throw new Error('Invalid or expired invitation code');
    }

    if (invitation.userId !== userId) {
      throw new Error('Invitation code is not for this user');
    }

    // Mark invitation as used
    await storage.markInvitationCodeAsUsed(code);

    // Update user access level
    await storage.updateUser(userId, {
      accessLevel: invitation.accessLevel,
      waitingListStatus: 'approved',
      approvedAt: new Date(),
      invitedBy: invitation.createdBy
    });

    return invitation;
  }

  /**
   * Get waiting list statistics for admin dashboard
   */
  async getWaitingListStats() {
    return await storage.getWaitingListStats();
  }

  /**
   * Get all pending waiting list applications for admin review
   */
  async getPendingApplications() {
    return await storage.getAllWaitingListApplications('pending');
  }

  /**
   * Update feature flag settings
   */
  async updateFeatureFlag(name: string, updates: { isEnabled?: boolean; rolloutPercentage?: number; requiredAccessLevel?: string }) {
    return await storage.updateFeatureFlag(name, updates);
  }

  /**
   * Get all feature flags for admin management
   */
  async getAllFeatureFlags() {
    return await storage.getAllFeatureFlags();
  }

  /**
   * Create middleware for route protection
   */
  createAccessMiddleware(requiredFeature?: string, requiredLevel?: string) {
    return async (req: any, res: any, next: any) => {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check access level if required
      if (requiredLevel) {
        const hasLevel = await this.checkAccessLevel(userId, requiredLevel);
        if (!hasLevel) {
          return res.status(403).json({ 
            error: 'Insufficient access level',
            required: requiredLevel,
            current: (await this.getUserAccessLevel(userId))?.name || 'unknown'
          });
        }
      }

      // Check feature access if required
      if (requiredFeature) {
        const hasAccess = await this.checkFeatureAccess(userId, requiredFeature);
        if (!hasAccess) {
          return res.status(403).json({ 
            error: 'Feature not available',
            feature: requiredFeature,
            accessLevel: (await this.getUserAccessLevel(userId))?.name || 'unknown'
          });
        }
      }

      next();
    };
  }

  /**
   * Generate random invitation code
   */
  private generateRandomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

export const accessControl = new AccessControlService();