import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { createHash } from 'crypto';
import { type InsertApiUsage } from '@shared/schema';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  apiKeyId?: string;
  subscription?: any;
}

// Subscription tier configurations
export const SUBSCRIPTION_TIERS = {
  basic: {
    monthlyQuota: 1000,
    price: 29.99,
    permissions: ['wsm_chat', 'wsm_status'],
    maxAgents: 0,
    maxVMs: 0,
    name: 'Basic WSM',
    description: 'Conversational WSM without training data dependencies'
  },
  pro: {
    monthlyQuota: 10000,
    price: 299.99,
    permissions: ['wsm_chat', 'wsm_status', 'file_processing', 'harmonic_analysis', 'agents', 'vms'],
    maxAgents: 10,
    maxVMs: 3,
    name: 'Pro Multi-Agent',
    description: 'WSM + Agent orchestration with dedicated VM infrastructure'
  },
  enterprise: {
    monthlyQuota: 100000,
    price: 599.99,
    permissions: ['*'], // All endpoints
    maxAgents: 50,
    maxVMs: 10,
    name: 'Enterprise Orchestration',
    description: 'Complete multi-agent platform with full WSM system access'
  }
};

export class CommercialApiService {
  
  // Generate API key
  async generateApiKey(userId: string, name: string, tier: string): Promise<{ key: string; keyId: string }> {
    // Generate a secure API key
    const key = `wsm_${Buffer.from(`${userId}_${Date.now()}_${Math.random()}`).toString('base64url')}`;
    const keyHash = createHash('sha256').update(key).digest('hex');
    
    const tierConfig = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS];
    const permissions = tierConfig?.permissions || ['wsm_chat'];
    
    const apiKey = await storage.createApiKey({
      userId,
      keyHash,
      name,
      permissions,
      isActive: true
    });
    
    return { key, keyId: apiKey.id };
  }

  // Create subscription
  async createSubscription(userId: string, tier: string): Promise<any> {
    const tierConfig = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS];
    if (!tierConfig) {
      throw new Error('Invalid subscription tier');
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month from now

    return storage.createSubscription({
      userId,
      tier,
      status: 'active',
      monthlyQuota: tierConfig.monthlyQuota,
      currentUsage: 0,
      price: tierConfig.price,
      expiresAt
    });
  }

  // API key authentication middleware
  async authenticateApiKey(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid authorization header' });
        return;
      }

      const apiKey = authHeader.substring(7); // Remove "Bearer "
      const keyHash = createHash('sha256').update(apiKey).digest('hex');
      
      const keyRecord = await storage.getApiKeyByHash(keyHash);
      if (!keyRecord || !keyRecord.isActive) {
        res.status(401).json({ error: 'Invalid or inactive API key' });
        return;
      }

      // Check if user has valid subscription
      const subscription = await storage.getSubscriptionByUserId(keyRecord.userId);
      if (!subscription || subscription.status !== 'active' || subscription.expiresAt < new Date()) {
        res.status(402).json({ error: 'Subscription expired or inactive' });
        return;
      }

      // Check rate limits
      if (subscription.currentUsage >= subscription.monthlyQuota) {
        res.status(429).json({ error: 'Monthly quota exceeded' });
        return;
      }

      // Check endpoint permissions
      const endpoint = req.path;
      const permissions = keyRecord.permissions as string[];
      
      // Map endpoint paths to permission names
      const endpointPermissionMap: { [key: string]: string } = {
        '/api/commercial/wsm/chat': 'wsm_chat',
        '/api/commercial/wsm/status': 'wsm_status', 
        '/api/commercial/wsm/process-file': 'file_processing',
        '/api/harmonic': 'harmonic_analysis',
        '/api/agents': 'agents',
        '/api/vms': 'vms'
      };
      
      const requiredPermission = endpointPermissionMap[endpoint] || endpoint;
      const hasPermission = permissions.includes('*') || 
                           permissions.includes(requiredPermission) ||
                           permissions.some(perm => endpoint.includes(perm));
      
      if (!hasPermission) {
        res.status(403).json({ error: 'Insufficient permissions for this endpoint' });
        return;
      }

      // Attach user info to request
      req.userId = keyRecord.userId;
      req.apiKeyId = keyRecord.id;
      req.subscription = subscription;

      next();
    } catch (error) {
      console.error('API authentication error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  }

  // Authentication middleware for user-based endpoints
  async requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // For now, we'll simulate basic authentication
      // In a real implementation, this would validate JWT tokens or session cookies
      const userId = req.headers['x-user-id'] as string;
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Get user from storage
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ error: 'Invalid user' });
      }

      // Attach user to request
      req.user = user;
      req.userId = userId;
      next();
    } catch (error: any) {
      return res.status(500).json({ error: 'Authentication failed' });
    }
  }

  // Usage tracking middleware
  async trackApiUsage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const startTime = Date.now();
    
    // Wrap res.end to capture response details
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any): Response {
      const responseTime = Date.now() - startTime;
      
      // Track usage asynchronously
      if (req.userId && req.apiKeyId) {
        const usageData: InsertApiUsage = {
          userId: req.userId,
          apiKeyId: req.apiKeyId,
          endpoint: req.path,
          method: req.method,
          responseTime: responseTime / 1000, // Convert to seconds
          statusCode: res.statusCode
        };
        
        storage.createApiUsage(usageData).catch(console.error);
        storage.updateSubscriptionUsage(req.userId, 1).catch(console.error);
        storage.updateApiKeyLastUsed(req.apiKeyId).catch(console.error);
      }
      
      return originalEnd.call(this, chunk, encoding);
    };
    
    next();
  }

  // Get user's API usage analytics
  async getUserAnalytics(userId: string, days: number = 30): Promise<any> {
    const usage = await storage.getUserApiUsage(userId, days);
    const subscription = await storage.getSubscriptionByUserId(userId);
    
    // Calculate analytics
    const totalRequests = usage.length;
    const avgResponseTime = usage.reduce((sum, u) => sum + u.responseTime, 0) / totalRequests || 0;
    const errorRate = usage.filter(u => u.statusCode >= 400).length / totalRequests || 0;
    
    // Group by endpoint
    const endpointStats = usage.reduce((acc, u) => {
      const endpoint = u.endpoint;
      if (!acc[endpoint]) {
        acc[endpoint] = { count: 0, avgTime: 0, errors: 0 };
      }
      acc[endpoint].count++;
      acc[endpoint].avgTime = (acc[endpoint].avgTime + u.responseTime) / 2;
      if (u.statusCode >= 400) acc[endpoint].errors++;
      return acc;
    }, {} as Record<string, any>);

    return {
      subscription: {
        tier: subscription?.tier || 'none',
        usage: subscription?.currentUsage || 0,
        quota: subscription?.monthlyQuota || 0,
        usagePercent: ((subscription?.currentUsage || 0) / (subscription?.monthlyQuota || 1)) * 100
      },
      analytics: {
        totalRequests,
        avgResponseTime,
        errorRate,
        endpointStats
      },
      usage: usage.slice(0, 100) // Last 100 requests
    };
  }
}

export const commercialApi = new CommercialApiService();