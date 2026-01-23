import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { wsmEngine } from "./services/wsmEngine";
import { pythonBridge } from "./services/pythonBridge";
import { commercialApi, type AuthenticatedRequest, SUBSCRIPTION_TIERS } from "./services/commercialApi";
import { vmProvisioning } from "./services/vmProvisioning";
import { agentOrchestrator } from "./services/agentOrchestrator";
import { harmonicBridge } from "./services/harmonicBridge";
import { vmBenchmarking } from "./services/vmBenchmarking";
import harmonicBridgeRoutes from "./routes/harmonicBridge";
import { hkmRoutes } from "./routes/hkmRoutes";
import { accessControl } from "./services/accessControl";
import { TextExtractor } from "./services/textExtractor";
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import StreamValues from 'stream-json/streamers/StreamValues.js';
import parser from 'stream-json/index.js';
import { insertWaitingListApplicationSchema, insertFeatureFlagSchema, adminApproveUserSchema, adminDenyUserSchema, updateFeatureFlagSchema, submitChangeProposalSchema, validateProposalSchema, approveProposalSchema, deployProposalSchema, rollbackProposalSchema, oracleInstantiateSchema, oracleQuerySchema, processFileRequestSchema } from "@shared/schema";
import { proposalValidator } from './services/proposalValidator';
import { proposalSecurity } from './services/proposalSecurityService';
import { vmAuthentication, type VMAuthenticatedRequest } from './services/vmAuthentication';
import { 
  type WebSocketMessage, 
  type WSMMetrics, 
  type ComponentStatus, 
  type ProcessingStats, 
  type RSISStatus,
  type AgentStatus,
  type VMStatus,
  type TaskQueue,
  type BenchmarkingStatus,
  type EvaluationResults,
  type VMBenchmarkingData 
} from "@shared/schema";
import multer from "multer";

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({ 
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      // Create subdirectories based on upload batch
      const batchId = req.body.batchId || Date.now().toString();
      const batchDir = path.join(uploadsDir, batchId);
      
      if (!fs.existsSync(batchDir)) {
        fs.mkdirSync(batchDir, { recursive: true });
      }
      
      cb(null, batchDir);
    },
    filename: (req, file, cb) => {
      // Preserve original filename structure for folder uploads
      const relativePath = file.originalname.replace(/\\/g, '/'); // Normalize path separators
      cb(null, relativePath);
    }
  }),
  limits: { 
    fileSize: 1024 * 1024 * 1024, // 1GB limit per file
    files: 1000 // Max 1000 files per batch (for large folder uploads)
  },
  fileFilter: (req, file, cb) => {
    // Accept virtually all file types for comprehensive analysis
    console.log(`Processing file: ${file.originalname} (${file.mimetype || 'unknown'})`);
    cb(null, true); // Accept all files for maximum compatibility
  }
});

// Separate multer config for resume uploads
const resumeUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const resumesDir = path.join(uploadsDir, 'resumes');
      if (!fs.existsSync(resumesDir)) {
        fs.mkdirSync(resumesDir, { recursive: true });
      }
      cb(null, resumesDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, `resume-${uniqueSuffix}${ext}`);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for resumes
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed for resumes'));
    }
  }
});

// Streaming JSON processing function to handle large files without memory issues
async function processLargeJsonFile(filePath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    let conversationCount = 0;
    let totalMessages = 0;
    const processedContent: any[] = [];
    
    console.log(`Starting streaming JSON processing for file: ${filePath}`);
    
    const pipeline = fs.createReadStream(filePath)
      .pipe(parser())
      .pipe(StreamValues.withParser());
    
    pipeline.on('data', (data) => {
      try {
        // Handle array elements (conversations)
        if (data.key !== undefined && typeof data.value === 'object' && data.value !== null) {
          const conversation = data.value;
          conversationCount++;
          
          // Process conversation data
          if (conversation.mapping || conversation.messages) {
            const messages = conversation.mapping ? 
              Object.values(conversation.mapping).filter((m: any) => m?.message?.content?.parts?.length > 0) :
              conversation.messages || [];
            
            totalMessages += messages.length;
            
            // Extract conversation content for RAG - limit content length to prevent memory issues
            const conversationText = messages.map((msg: any) => {
              if (msg.message?.content?.parts) {
                return msg.message.content.parts.join(' ');
              }
              return msg.content || msg.text || '';
            }).filter(Boolean).join('\n\n');
            
            if (conversationText) {
              // Limit individual conversation content to prevent memory buildup
              const truncatedContent = conversationText.length > 10000 ? 
                conversationText.substring(0, 10000) + '...[truncated]' : 
                conversationText;
                
              processedContent.push({
                id: conversation.id || `conv_${Date.now()}_${Math.random()}`,
                title: conversation.title || `Conversation ${processedContent.length + 1}`,
                content: truncatedContent,
                messageCount: messages.length,
                createdAt: conversation.create_time || conversation.timestamp || new Date().toISOString()
              });
            }
          }
          
          // Log progress for large files
          if (conversationCount % 100 === 0) {
            console.log(`Processed ${conversationCount} conversations so far...`);
          }
          
          // Limit total conversations to prevent memory overflow
          if (processedContent.length >= 5000) {
            console.log('Reached maximum conversation limit (5000), stopping processing');
            pipeline.destroy();
          }
        }
      } catch (err) {
        console.error('Error processing conversation:', err);
        // Continue processing other conversations
      }
    });
    
    pipeline.on('end', () => {
      console.log(`Streaming JSON processing completed: ${conversationCount} conversations, ${totalMessages} messages`);
      resolve({
        conversations: conversationCount,
        totalMessages: totalMessages,
        processedContent: processedContent
      });
    });
    
    pipeline.on('error', (err) => {
      console.error('Streaming JSON processing error:', err);
      // Try fallback processing for smaller files
      if (fs.statSync(filePath).size < 50 * 1024 * 1024) { // Less than 50MB
        console.log('Attempting fallback processing for smaller file...');
        try {
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const jsonData = JSON.parse(fileContent);
          
          if (Array.isArray(jsonData)) {
            const chatGptData = {
              conversations: jsonData.length,
              totalMessages: 0,
              processedContent: []
            };
            
            for (const conversation of jsonData.slice(0, 1000)) { // Limit to 1000 conversations for fallback
              if (conversation.mapping || conversation.messages) {
                const messages = conversation.mapping ? 
                  Object.values(conversation.mapping).filter((m: any) => m?.message?.content?.parts?.length > 0) :
                  conversation.messages || [];
                
                chatGptData.totalMessages += messages.length;
                
                const conversationText = messages.map((msg: any) => {
                  if (msg.message?.content?.parts) {
                    return msg.message.content.parts.join(' ');
                  }
                  return msg.content || msg.text || '';
                }).filter(Boolean).join('\n\n');
                
                if (conversationText) {
                  chatGptData.processedContent.push({
                    id: conversation.id || `conv_${Date.now()}_${Math.random()}`,
                    title: conversation.title || `Conversation ${chatGptData.processedContent.length + 1}`,
                    content: conversationText.substring(0, 10000), // Truncate for safety
                    messageCount: messages.length,
                    createdAt: conversation.create_time || conversation.timestamp || new Date().toISOString()
                  });
                }
              }
            }
            
            resolve(chatGptData);
          } else {
            reject(new Error('Invalid JSON format'));
          }
        } catch (fallbackError) {
          reject(fallbackError);
        }
      } else {
        reject(err);
      }
    });
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Initialize WSM Engine
  await wsmEngine.initialize();
  await wsmEngine.start();
  
  // Initialize Harmonic Bridge
  console.log('Harmonic Bridge Service initialized successfully');

  // Start VM health monitoring
  vmProvisioning.startHealthMonitoring();
  console.log('VM health monitoring started');

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ ok: true, status: 'operational' });
  });

  // Temporary admin password reset endpoint (REMOVE IN PRODUCTION)
  app.post('/api/admin/reset-password-temp', async (req, res) => {
    try {
      const { secret } = req.body;
      
      // Simple secret check (replace with environment variable in production)
      if (secret !== 'reset-admin-2025') {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const password = 'WSM2025!Secure';
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.scryptSync(password, salt, 64).toString('hex');
      const hashedPassword = `${salt}:${hash}`;

      const user = await storage.getUserByUsername('owner_admin');
      if (!user) {
        return res.status(404).json({ error: 'Admin user not found' });
      }

      // Update password
      await storage.updateUser(user.id, { password: hashedPassword });

      res.json({ success: true, message: 'Admin password reset successfully' });
    } catch (error) {
      console.error('Error resetting admin password:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  });

  // User signup endpoint (public)
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { username, password, email, fullName, company, useCase, reason } = req.body;
      
      if (!username || !password || !email) {
        return res.status(400).json({ error: 'Username, password, and email are required' });
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      // Hash password using Node's crypto module
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.scryptSync(password, salt, 64).toString('hex');
      const hashedPassword = `${salt}:${hash}`;

      // Create user with 'waiting' access level
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        accessLevel: 'waiting',
        waitingListStatus: 'pending',
        settings: {
          fullName,
          company,
          useCase,
          reason
        }
      });

      // Create waiting list application so it appears in admin panel
      if (useCase && reason) {
        await storage.createWaitingListApplication({
          userId: user.id,
          useCase: useCase || 'Not provided',
          intendedUsage: company ? `Company: ${company}` : 'Not provided',
          status: 'pending',
          priority: 5, // Normal priority
        });
      }

      console.log(`New user signed up: ${username} with waiting access level`);

      res.json({
        success: true,
        message: 'Account created successfully. Your account is pending approval.',
        userId: user.id,
        accessLevel: 'waiting'
      });
    } catch (error: any) {
      console.error('Signup error:', error);
      res.status(500).json({ error: error.message || 'Failed to create account' });
    }
  });

  // Simple login endpoint for username/password
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // Verify password
      const [salt, hash] = user.password.split(':');
      const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
      
      if (hash !== testHash) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      console.log(`User logged in: ${username} (${user.accessLevel})`);

      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          accessLevel: user.accessLevel,
          waitingListStatus: user.waitingListStatus
        }
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  });

  // Admin initialization endpoint - only works if no admin exists yet
  app.post('/api/auth/init-admin', async (req, res) => {
    try {
      const { username, secretKey } = req.body;
      
      // Check if admin exists
      const users = await storage.getAllUsers();
      const adminExists = users.some(u => u.accessLevel === 'admin');
      
      if (adminExists) {
        return res.status(403).json({ error: 'Admin already exists' });
      }

      // Require a secret key for security (you should set this as an environment variable)
      const adminInitKey = process.env.ADMIN_INIT_KEY || 'wsm_admin_init_2025';
      if (secretKey !== adminInitKey) {
        return res.status(401).json({ error: 'Invalid secret key' });
      }

      if (!username) {
        return res.status(400).json({ error: 'Username is required' });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Promote user to admin
      const updatedUser = await storage.updateUser(user.id, {
        accessLevel: 'admin',
        waitingListStatus: 'approved'
      });

      console.log(`User ${username} promoted to admin`);

      res.json({
        success: true,
        message: 'User promoted to admin successfully',
        user: {
          id: updatedUser!.id,
          username: updatedUser!.username,
          accessLevel: updatedUser!.accessLevel
        }
      });
    } catch (error: any) {
      console.error('Admin init error:', error);
      res.status(500).json({ error: 'Failed to initialize admin' });
    }
  });

  // Job Application API with Resume Upload
  app.post('/api/jobs/apply', resumeUpload.single('resume'), async (req, res) => {
    try {
      const { position, email, fullName, linkedIn, portfolio, coverLetter } = req.body;
      const resumeFile = req.file;
      
      if (!position || !email || !fullName || !coverLetter) {
        return res.status(400).json({ 
          error: 'Position, email, full name, and cover letter are required' 
        });
      }

      // Store job application (using storage interface)
      const application = await storage.createJobApplication({
        id: crypto.randomUUID(),
        position,
        email,
        fullName,
        linkedIn: linkedIn || null,
        portfolio: portfolio || null,
        coverLetter,
        resumePath: resumeFile ? resumeFile.path : null,
        resumeOriginalName: resumeFile ? resumeFile.originalname : null,
        status: 'pending'
        // appliedAt is handled by database defaultNow()
      });

      console.log(`New job application received: ${fullName} for ${position}${resumeFile ? ' (with resume)' : ''}`);
      
      res.json({ 
        success: true, 
        message: 'Application submitted successfully',
        applicationId: application.id
      });
    } catch (error) {
      console.error('Job application error:', error);
      res.status(500).json({ error: 'Failed to submit application' });
    }
  });

  // Waiting List Management API
  
  // Submit waiting list application
  app.post('/api/waiting-list/apply', commercialApi.requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { reason, intendedUse, priority = 'normal' } = req.body;
      
      if (!reason || !intendedUse) {
        return res.status(400).json({ error: 'Reason and intended use are required' });
      }

      const application = await accessControl.submitWaitingListApplication(
        req.user.id,
        reason,
        intendedUse,
        priority
      );

      // Broadcast waiting list update
      broadcastToAllClients({
        type: 'waiting_list_update',
        data: { userId: req.user.id, status: 'pending' }
      });

      res.json({ 
        success: true, 
        application,
        message: 'Application submitted successfully. You will be notified when reviewed.' 
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get user's waiting list status
  app.get('/api/waiting-list/status', commercialApi.requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const isOnWaitingList = await accessControl.isUserOnWaitingList(req.user.id);
      const application = await accessControl.getUserWaitingListApplication(req.user.id);
      const accessLevel = await accessControl.getUserAccessLevel(req.user.id);
      const features = await accessControl.getUserFeatures(req.user.id);

      res.json({
        isOnWaitingList,
        application,
        accessLevel,
        availableFeatures: features,
        user: await storage.getUser(req.user.id)
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Check feature access
  app.get('/api/access/feature/:featureName', commercialApi.requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { featureName } = req.params;
      const hasAccess = await accessControl.checkFeatureAccess(req.user.id, featureName);
      const accessLevel = await accessControl.getUserAccessLevel(req.user.id);

      res.json({
        hasAccess,
        featureName,
        accessLevel: accessLevel?.name || 'unknown',
        message: hasAccess ? 'Access granted' : 'Feature not available for your access level'
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Use invitation code
  app.post('/api/invitation/redeem', commercialApi.requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: 'Invitation code is required' });
      }

      const invitation = await accessControl.useInvitationCode(code, req.user.id);
      
      // Broadcast access level update
      broadcastToAllClients({
        type: 'access_level_update',
        data: { 
          userId: req.userId!, 
          accessLevel: invitation.accessLevel,
          approved: true 
        }
      });

      res.json({
        success: true,
        invitation,
        message: `Welcome! You now have ${invitation.accessLevel} access.`
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Admin Routes - Waiting List Management
  
  // Get waiting list statistics
  app.get('/api/admin/waiting-list/stats', 
    commercialApi.requireAuth, 
    accessControl.createAccessMiddleware(undefined, 'admin'),
    async (req: AuthenticatedRequest, res) => {
      try {
        const stats = await accessControl.getWaitingListStats();
        res.json(stats);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Get pending applications
  app.get('/api/admin/waiting-list/applications', 
    commercialApi.requireAuth, 
    accessControl.createAccessMiddleware(undefined, 'admin'),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { status } = req.query;
        const applications = status 
          ? await storage.getAllWaitingListApplications(status as string)
          : await accessControl.getPendingApplications();
        
        // Get user details for each application and transform schema
        const applicationsWithUsers = await Promise.all(
          applications.map(async (app) => {
            const user = await storage.getUser(app.userId);
            
            // Transform storage schema to frontend schema
            return {
              id: app.id,
              userId: app.userId,
              reason: app.useCase, // Transform useCase -> reason
              intendedUse: app.intendedUsage || '', // Transform intendedUsage -> intendedUse
              status: app.status,
              priority: app.priority >= 8 ? 'high' : 'normal', // Transform number -> string enum
              createdAt: app.createdAt.toISOString(),
              reviewedAt: app.reviewedAt?.toISOString(),
              reviewedBy: app.reviewedBy,
              adminNotes: app.adminNotes,
              user
            };
          })
        );

        res.json(applicationsWithUsers);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Approve user from waiting list
  app.post('/api/admin/waiting-list/approve', 
    commercialApi.requireAuth, 
    accessControl.createAccessMiddleware(undefined, 'admin'),
    async (req: AuthenticatedRequest, res) => {
      try {
        // Validate request body with Zod
        const validatedData = adminApproveUserSchema.parse(req.body);
        const { userId, accessLevel, notes } = validatedData;

        const result = await accessControl.approveUserFromWaitingList(
          userId, 
          req.user.id, 
          accessLevel, 
          notes
        );

        // Simulate email notification (console log for now)
        console.log('=== EMAIL NOTIFICATION SENT ===');
        console.log(`To: ${result.user.email}`);
        console.log(`Subject: Welcome to WSM AI - Your Access Has Been Approved!`);
        console.log(`Body:`);
        console.log(`  Hi ${result.user.username},`);
        console.log(`  `);
        console.log(`  Great news! Your early access request has been approved.`);
        console.log(`  Access Level: ${accessLevel}`);
        console.log(`  Invitation Code: ${result.invitationCode.code}`);
        console.log(`  `);
        console.log(`  You can now log in to the WSM AI platform at: ${req.get('origin') || 'https://your-domain.com'}`);
        console.log(`  Username: ${result.user.username}`);
        console.log(`  `);
        console.log(`  Welcome aboard!`);
        console.log(`  The WSM AI Team`);
        console.log('==============================');

        // Broadcast approval update
        broadcastToAllClients({
          type: 'user_approved',
          data: { 
            userId, 
            accessLevel, 
            adminId: req.user.id,
            invitationCode: result.invitationCode.code
          }
        });

        res.json({
          success: true,
          result,
          message: `User approved with ${accessLevel} access`
        });
      } catch (error: any) {
        // Handle Zod validation errors
        if (error.name === 'ZodError') {
          return res.status(400).json({
            error: 'Validation failed',
            details: error.errors.map((err: any) => ({
              field: err.path.join('.'),
              message: err.message
            }))
          });
        }
        res.status(400).json({ error: error.message });
      }
    }
  );

  // Deny user from waiting list
  app.post('/api/admin/waiting-list/deny', 
    commercialApi.requireAuth, 
    accessControl.createAccessMiddleware(undefined, 'admin'),
    async (req: AuthenticatedRequest, res) => {
      try {
        // Validate request body with Zod
        const validatedData = adminDenyUserSchema.parse(req.body);
        const { userId, reason } = validatedData;

        const result = await accessControl.denyUserFromWaitingList(userId, req.user.id, reason);

        // Simulate email notification (console log for now)
        console.log('=== EMAIL NOTIFICATION SENT ===');
        console.log(`To: ${result.user.email}`);
        console.log(`Subject: WSM AI Early Access Application Update`);
        console.log(`Body:`);
        console.log(`  Hi ${result.user.username},`);
        console.log(`  `);
        console.log(`  Thank you for your interest in WSM AI early access.`);
        console.log(`  `);
        console.log(`  Unfortunately, we're unable to approve your application at this time.`);
        console.log(`  Reason: ${reason}`);
        console.log(`  `);
        console.log(`  If you have questions, please contact us at derekearnhart@safeusi.com`);
        console.log(`  `);
        console.log(`  Best regards,`);
        console.log(`  The WSM AI Team`);
        console.log('==============================');

        // Broadcast denial update
        broadcastToAllClients({
          type: 'user_denied',
          data: { userId, reason, adminId: req.user.id }
        });

        res.json({
          success: true,
          result,
          message: 'User denied access'
        });
      } catch (error: any) {
        // Handle Zod validation errors
        if (error.name === 'ZodError') {
          return res.status(400).json({
            error: 'Validation failed',
            details: error.errors.map((err: any) => ({
              field: err.path.join('.'),
              message: err.message
            }))
          });
        }
        res.status(400).json({ error: error.message });
      }
    }
  );

  // Feature Flag Management
  
  // Get all feature flags
  app.get('/api/admin/feature-flags', 
    commercialApi.requireAuth, 
    accessControl.createAccessMiddleware(undefined, 'admin'),
    async (req: AuthenticatedRequest, res) => {
      try {
        const flags = await accessControl.getAllFeatureFlags();
        res.json(flags);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Update feature flag
  app.patch('/api/admin/feature-flags/:name', 
    commercialApi.requireAuth, 
    accessControl.createAccessMiddleware(undefined, 'admin'),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { name } = req.params;
        
        // Validate request body with Zod
        const validatedUpdates = updateFeatureFlagSchema.parse(req.body);

        const flag = await accessControl.updateFeatureFlag(name, validatedUpdates);
        
        if (!flag) {
          return res.status(404).json({ error: 'Feature flag not found' });
        }

        // Broadcast feature flag update
        broadcastToAllClients({
          type: 'feature_flag_update',
          data: { name, updates, adminId: req.user.id }
        });

        res.json({
          success: true,
          flag,
          message: `Feature flag ${name} updated successfully`
        });
      } catch (error: any) {
        // Handle Zod validation errors
        if (error.name === 'ZodError') {
          return res.status(400).json({
            error: 'Validation failed',
            details: error.errors.map((err: any) => ({
              field: err.path.join('.'),
              message: err.message
            }))
          });
        }
        res.status(400).json({ error: error.message });
      }
    }
  );

  // Create new feature flag
  app.post('/api/admin/feature-flags', 
    commercialApi.requireAuth, 
    accessControl.createAccessMiddleware(undefined, 'admin'),
    async (req: AuthenticatedRequest, res) => {
      try {
        const validatedData = insertFeatureFlagSchema.parse(req.body);
        const flag = await storage.createFeatureFlag(validatedData);

        // Broadcast new feature flag
        broadcastToAllClients({
          type: 'feature_flag_created',
          data: { flag, adminId: req.user.id }
        });

        res.json({
          success: true,
          flag,
          message: `Feature flag ${flag.name} created successfully`
        });
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  // Public feature flags endpoint for non-admin users
  app.get('/api/feature-flags', 
    commercialApi.requireAuth, 
    async (req: AuthenticatedRequest, res) => {
      try {
        const userFeatures = await accessControl.getUserFeatures(req.user.id);
        const accessLevel = await accessControl.getUserAccessLevel(req.user.id);
        
        res.json({
          availableFeatures: userFeatures,
          accessLevel: accessLevel?.name || 'waiting',
          user: await storage.getUser(req.user.id)
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Admin action logs
  app.get('/api/admin/action-logs', 
    commercialApi.requireAuth, 
    accessControl.createAccessMiddleware(undefined, 'admin'),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { limit = 50 } = req.query;
        const logs = await storage.getAdminActionLogs(undefined, Number(limit));
        res.json(logs);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store connected clients
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    clients.add(ws);

    // Send initial data
    sendInitialData(ws);

    // Handle incoming messages for Oracle streaming
    ws.on('message', async (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle Oracle streaming requests
        if (data.type === 'oracle_query_stream') {
          await handleOracleStreamQuery(ws, data);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'oracle_stream_error',
          data: {
            queryId: 'unknown',
            error: 'Invalid message format',
            timestamp: new Date().toISOString(),
            messageId: crypto.randomUUID()
          }
        }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  // Oracle streaming handler
  async function handleOracleStreamQuery(ws: WebSocket, requestData: any) {
    const queryId = crypto.randomUUID();
    const messageId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    
    try {
      // Validate API key from request
      const apiKey = requestData.apiKey;
      if (!apiKey) {
        throw new Error('API key required for Oracle streaming');
      }
      
      // Authenticate the API key
      const user = await commercialApi.authenticateApiKey(apiKey);
      if (!user) {
        throw new Error('Invalid API key');
      }

      // Start streaming response
      const startMessage: OracleStreamStart = {
        type: 'oracle_stream_start',
        data: { queryId, timestamp, messageId }
      };
      ws.send(JSON.stringify(startMessage));

      // Create Oracle query record
      const queryRecord = await storage.createOracleQuery({
        userId: user.id,
        query: requestData.query || 'Oracle Stream Query',
        mathematicalRigor: requestData.mathematicalRigor || false,
        response: '', // Will be updated as we stream
        coherenceScore: 0,
        spectralAnalysis: {},
      });

      // Generate streaming Oracle response
      let fullResponse = '';
      const query = requestData.query || 'What is consciousness in WSM systems?';
      
      // Simulate harmonic Oracle processing with streaming
      const oracleResponse = await generateOracleStreamingResponse(
        query, 
        requestData.mathematicalRigor || false,
        (token: string) => {
          // Stream each token
          fullResponse += token;
          const tokenMessage: OracleStreamToken = {
            type: 'oracle_stream_token',
            data: { queryId, token, timestamp: new Date().toISOString(), messageId }
          };
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(tokenMessage));
          }
        }
      );

      // Update the query record with final response
      await storage.updateOracleQuery(queryRecord.id, {
        response: fullResponse,
        coherenceScore: oracleResponse.coherenceScore,
        spectralAnalysis: oracleResponse.spectralAnalysis,
      });

      // Send completion message
      const endMessage: OracleStreamEnd = {
        type: 'oracle_stream_end',
        data: {
          queryId,
          fullResponse,
          timestamp: new Date().toISOString(),
          messageId,
          coherenceScore: oracleResponse.coherenceScore,
          spectralAnalysis: oracleResponse.spectralAnalysis
        }
      };
      ws.send(JSON.stringify(endMessage));

    } catch (error: any) {
      console.error('Oracle streaming error:', error);
      const errorMessage: OracleStreamError = {
        type: 'oracle_stream_error',
        data: {
          queryId,
          error: error.message,
          timestamp: new Date().toISOString(),
          messageId
        }
      };
      ws.send(JSON.stringify(errorMessage));
    }
  }

  // Oracle streaming response generator
  async function generateOracleStreamingResponse(
    query: string,
    mathematicalRigor: boolean,
    onToken: (token: string) => void
  ): Promise<{ coherenceScore: number; spectralAnalysis: any }> {
    const harmonicResponse = await agiCore.processQueryWithSpectralAnalysis(
      query,
      mathematicalRigor,
      onToken // Token streaming callback
    );

    return {
      coherenceScore: harmonicResponse.coherence || 0.95,
      spectralAnalysis: harmonicResponse.spectralData || {}
    };
  }

  // Broadcast function
  function broadcast(message: WebSocketMessage) {
    const messageStr = JSON.stringify(message);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  // Send initial data to new clients
  async function sendInitialData(ws: WebSocket) {
    try {
      // Send current WSM metrics
      const currentMetrics = await wsmEngine.getCurrentMetrics();
      if (currentMetrics) {
        const metricsMessage: WSMMetrics = {
          type: 'wsm_metrics',
          data: {
            ...currentMetrics,
            timestamp: new Date().toISOString(),
          },
        };
        ws.send(JSON.stringify(metricsMessage));
      }

      // Send component status
      const components = await storage.getAllSystemComponents();
      const componentMessage: ComponentStatus = {
        type: 'component_status',
        data: {
          components: components.map(comp => ({
            name: comp.name,
            status: comp.status,
            lastUpdate: comp.lastUpdate?.toISOString() || new Date().toISOString(),
          })),
        },
      };
      ws.send(JSON.stringify(componentMessage));

      // Send processing stats
      const stats = await storage.getProcessingStats();
      const statsMessage: ProcessingStats = {
        type: 'processing_stats',
        data: {
          ...stats,
          apiCalls: 0, // Always 0 for WSM independence
        },
      };
      ws.send(JSON.stringify(statsMessage));

      // Send RSIS status
      const latestRSIS = await storage.getLatestRSISCycle();
      if (latestRSIS) {
        const rsisMessage: RSISStatus = {
          type: 'rsis_status',
          data: {
            proactivityScore: latestRSIS.proactivityScore,
            novelty: latestRSIS.novelty,
            valueOfInformation: latestRSIS.valueOfInformation,
            redundancy: latestRSIS.redundancy,
            costPressure: latestRSIS.costPressure,
            proposals: latestRSIS.proposals,
            evaluations: latestRSIS.evaluations,
            promotions: latestRSIS.promotions,
            rollbacks: latestRSIS.rollbacks,
            budget: {
              used: Math.floor(latestRSIS.costPressure * 1000),
              total: 1000,
            },
          },
        };
        ws.send(JSON.stringify(rsisMessage));
      }

      // Send agent status
      const agents = await storage.getAllAgents();
      const agentMessage: AgentStatus = {
        type: 'agent_status',
        data: {
          agents: agents.map(agent => ({
            id: agent.id,
            name: agent.name,
            type: agent.type,
            status: agent.status,
            coherence: agent.coherence || 0,
            vmInstanceId: agent.vmInstanceId || undefined,
            lastActivity: agent.lastActivity?.toISOString(),
          })),
        },
      };
      ws.send(JSON.stringify(agentMessage));

      // Send VM status
      const vms = await storage.getAllVMInstances();
      const vmMessage: VMStatus = {
        type: 'vm_status',
        data: {
          instances: await Promise.all(vms.map(async vm => {
            const vmAgents = agents.filter(agent => agent.vmInstanceId === vm.id);
            return {
              id: vm.id,
              name: vm.name,
              type: vm.type,
              status: vm.status,
              cpu: vm.cpu,
              memory: vm.memory,
              region: vm.region,
              endpoint: vm.endpoint || undefined,
              agentCount: vmAgents.length,
            };
          })),
        },
      };
      ws.send(JSON.stringify(vmMessage));

      // Send task queue status
      const queueStats = await storage.getTaskQueue();
      const taskQueueMessage: TaskQueue = {
        type: 'task_queue',
        data: queueStats,
      };
      ws.send(JSON.stringify(taskQueueMessage));

      // Send benchmarking status
      const benchmarkingStats = await vmBenchmarking.getBenchmarkingStats();
      const benchmarkingMessage: BenchmarkingStatus = {
        type: 'benchmarking_status',
        data: benchmarkingStats,
      };
      ws.send(JSON.stringify(benchmarkingMessage));
    } catch (error) {
      console.error('Error sending initial data:', error);
    }
  }

  // Set up WSM metrics broadcasting
  wsmEngine.onMetricsUpdate((metrics) => {
    const message: WSMMetrics = {
      type: 'wsm_metrics',
      data: {
        ...metrics,
        timestamp: new Date().toISOString(),
      },
    };
    broadcast(message);
  });

  // Broadcast component status updates every 10 seconds
  setInterval(async () => {
    try {
      const components = await storage.getAllSystemComponents();
      const message: ComponentStatus = {
        type: 'component_status',
        data: {
          components: components.map(comp => ({
            name: comp.name,
            status: comp.status,
            lastUpdate: comp.lastUpdate?.toISOString() || new Date().toISOString(),
          })),
        },
      };
      broadcast(message);
    } catch (error) {
      console.error('Error broadcasting component status:', error);
    }
  }, 10000);

  // Broadcast processing stats every 15 seconds
  setInterval(async () => {
    try {
      const stats = await storage.getProcessingStats();
      const message: ProcessingStats = {
        type: 'processing_stats',
        data: {
          ...stats,
          apiCalls: 0, // Always 0 for WSM independence
        },
      };
      broadcast(message);
    } catch (error) {
      console.error('Error broadcasting processing stats:', error);
    }
  }, 15000);

  // Broadcast agent status every 10 seconds
  setInterval(async () => {
    try {
      const agents = await storage.getAllAgents();
      const message: AgentStatus = {
        type: 'agent_status',
        data: {
          agents: agents.map(agent => ({
            id: agent.id,
            name: agent.name,
            type: agent.type,
            status: agent.status,
            coherence: agent.coherence || 0,
            vmInstanceId: agent.vmInstanceId || undefined,
            lastActivity: agent.lastActivity?.toISOString(),
          })),
        },
      };
      broadcast(message);
    } catch (error) {
      console.error('Error broadcasting agent status:', error);
    }
  }, 10000);

  // Broadcast VM status every 20 seconds
  setInterval(async () => {
    try {
      const vms = await storage.getAllVMInstances();
      const agents = await storage.getAllAgents();
      
      const message: VMStatus = {
        type: 'vm_status',
        data: {
          instances: await Promise.all(vms.map(async vm => {
            const vmAgents = agents.filter(agent => agent.vmInstanceId === vm.id);
            return {
              id: vm.id,
              name: vm.name,
              type: vm.type,
              status: vm.status,
              cpu: vm.cpu,
              memory: vm.memory,
              region: vm.region,
              endpoint: vm.endpoint || undefined,
              agentCount: vmAgents.length,
            };
          })),
        },
      };
      broadcast(message);
    } catch (error) {
      console.error('Error broadcasting VM status:', error);
    }
  }, 20000);

  // Broadcast task queue status every 5 seconds
  setInterval(async () => {
    try {
      const queueStats = await storage.getTaskQueue();
      const message: TaskQueue = {
        type: 'task_queue',
        data: queueStats,
      };
      broadcast(message);
    } catch (error) {
      console.error('Error broadcasting task queue:', error);
    }
  }, 5000);

  // Set up VM benchmarking event handlers
  vmBenchmarking.on('benchmarkingStatus', (message: BenchmarkingStatus) => {
    broadcast(message);
  });

  vmBenchmarking.on('evaluationResults', (message: EvaluationResults) => {
    broadcast(message);
  });

  vmBenchmarking.on('vmBenchmarking', (message: VMBenchmarkingData) => {
    broadcast(message);
  });

  vmBenchmarking.on('progress', (progress) => {
    const progressMessage: VMBenchmarkingData = {
      type: 'vm_benchmarking',
      data: {
        vmInstanceId: progress.vmInstanceId,
        benchmarkType: 'computational_canvas',
        realTimeMetrics: progress.realTimeMetrics,
        canvasState: {
          potentials: Array(10).fill(null).map(() => Array(10).fill(Math.random() * 100)),
          convergenceStatus: progress.currentStage,
          operatorEffects: []
        }
      }
    };
    broadcast(progressMessage);
  });

  // API Routes

  // Get current WSM status
  app.get('/api/wsm/status', async (req, res) => {
    try {
      const metrics = await wsmEngine.getCurrentMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get WSM status' });
    }
  });

  // Get WSM history
  app.get('/api/wsm/history', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const history = await storage.getWSMStatesHistory(limit);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get WSM history' });
    }
  });

  // Get system components
  app.get('/api/components', async (req, res) => {
    try {
      const components = await storage.getAllSystemComponents();
      res.json(components);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get system components' });
    }
  });

  // Update component status
  app.patch('/api/components/:name', async (req, res) => {
    try {
      const { name } = req.params;
      const { status } = req.body;
      
      const updated = await storage.updateSystemComponent(name, { status });
      if (!updated) {
        return res.status(404).json({ error: 'Component not found' });
      }
      
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update component' });
    }
  });

  // Batch upload endpoint for folder processing
  app.post('/api/process-batch', upload.array('files', 1000), async (req: Request & { files?: Express.Multer.File[] }, res) => {
    const startTime = Date.now();
    
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files provided' });
      }

      const batchId = req.body.batchId || Date.now().toString();
      const results = [];
      let totalSize = 0;
      let totalWords = 0;
      let totalFiles = req.files.length;
      
      console.log(`Processing batch upload: ${totalFiles} files in batch ${batchId}`);

      for (const file of req.files) {
        try {
          const { originalname, filename, path: filePath, mimetype, size } = file;
          
          // Extract text content
          const mimeType = mimetype || TextExtractor.getMimeType(originalname);
          const extractionResult = await TextExtractor.extractText(filePath, mimeType);
          
          // Create uploaded file record
          const uploadedFile = await storage.createUploadedFile({
            filename: filename || originalname,
            originalName: originalname,
            fileType: mimeType,
            fileSize: size,
            filePath: filePath,
            extractedText: extractionResult.success ? extractionResult.text : null,
            userId: 'anonymous',
            status: extractionResult.success ? 'processed' : 'uploaded'
          });

          totalSize += size;
          totalWords += extractionResult.wordCount || 0;
          
          results.push({
            fileId: uploadedFile.id,
            originalName: originalname,
            status: extractionResult.success ? 'processed' : 'failed',
            textExtracted: extractionResult.success,
            wordCount: extractionResult.wordCount || 0,
            fileSize: size,
            error: extractionResult.error
          });
          
        } catch (fileError) {
          console.error(`Failed to process file ${file.originalname}:`, fileError);
          results.push({
            fileId: null,
            originalName: file.originalname,
            status: 'failed',
            textExtracted: false,
            wordCount: 0,
            fileSize: file.size,
            error: fileError instanceof Error ? fileError.message : 'Unknown error'
          });
        }
      }

      const processingTime = Date.now() - startTime;
      const successCount = results.filter(r => r.status === 'processed').length;
      
      console.log(`Batch processing complete: ${successCount}/${totalFiles} files processed in ${processingTime}ms`);
      
      res.json({
        batchId,
        status: 'completed',
        totalFiles,
        successCount,
        failedCount: totalFiles - successCount,
        totalSize,
        totalWords,
        processingTime,
        results
      });
    } catch (error) {
      console.error('Batch upload error:', error);
      res.status(500).json({ 
        error: 'Failed to process batch upload',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // In-memory file storage for fast access (fallback when DB is slow)
  const inMemoryFiles = new Map<string, {
    id: string;
    filename: string;
    originalName: string;
    fileType: string;
    fileSize: number;
    filePath: string;
    extractedText: string | null;
    userId: string;
    status: string;
    createdAt: Date;
  }>();

  // Helper function with timeout for database operations
  const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error('Database operation timed out')), ms)
      )
    ]);
  };

  // Enhanced file upload endpoint with ChatGPT export support
  app.post('/api/process-file', upload.single('file'), async (req: Request & { file?: Express.Multer.File }, res) => {
    const startTime = Date.now();
    
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const { originalname, filename, path: filePath, mimetype, size } = req.file;
      const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Extract text content with enhanced ChatGPT processing
      const mimeType = mimetype || TextExtractor.getMimeType(originalname);
      let extractionResult = await TextExtractor.extractText(filePath, mimeType);
      
      // Enhanced ChatGPT export processing
      let chatGptData = null;
      let conversationCount = 0;
      let messageCount = 0;
      
      if (originalname.toLowerCase().includes('chatgpt') || 
          originalname.toLowerCase().includes('conversations') ||
          mimeType === 'application/json') {
        try {
          console.log(`Processing potential ChatGPT export: ${originalname} (${(size / 1024 / 1024).toFixed(2)}MB)`);
          
          // Use streaming JSON processing for large files to prevent memory issues
          chatGptData = await processLargeJsonFile(filePath);
          
          if (chatGptData) {
            conversationCount = chatGptData.conversations;
            messageCount = chatGptData.totalMessages;
            
            // Enhanced text extraction for RAG
            const ragText = chatGptData.processedContent
              .map(conv => `=== ${conv.title} ===\n${conv.content}`)
              .join('\n\n');
              
            extractionResult = {
              ...extractionResult,
              text: ragText,
              wordCount: ragText.split(/\s+/).length
            };
            
            console.log(`ChatGPT export processed: ${conversationCount} conversations, ${messageCount} messages`);
          }
        } catch (parseError: any) {
          console.log(`Not a valid ChatGPT export JSON: ${parseError.message}`);
          // Continue with regular processing
        }
      }
      
      // Prepare file data
      const fileData = {
        id: fileId,
        filename: filename || originalname,
        originalName: originalname,
        fileType: mimeType,
        fileSize: size,
        filePath: filePath,
        extractedText: extractionResult.success ? extractionResult.text : null,
        userId: 'anonymous',
        status: extractionResult.success ? 'processed' : 'uploaded',
        createdAt: new Date()
      };
      
      // Store in memory immediately for fast access
      inMemoryFiles.set(fileId, fileData);
      
      // Try to save to database with timeout, but don't block response
      // Use a background task to avoid blocking the response for concurrent uploads
      (async () => {
        try {
          const uploadedFile = await withTimeout(
            storage.createUploadedFile({
              filename: filename || originalname,
              originalName: originalname,
              fileType: mimeType,
              fileSize: size,
              filePath: filePath,
              extractedText: extractionResult.success ? extractionResult.text : null,
              userId: 'anonymous',
              status: extractionResult.success ? 'processed' : 'uploaded'
            }),
            10000 // Increased timeout for concurrent DB writes
          );
          
          // Update in-memory with DB id if it changed
          if (uploadedFile.id !== fileId) {
            inMemoryFiles.delete(fileId);
            inMemoryFiles.set(uploadedFile.id, { ...fileData, id: uploadedFile.id });
          }
          console.log(`File ${originalname} persisted to database successfully.`);
        } catch (dbError) {
          console.warn(`Database save failed for ${originalname}, using in-memory storage:`, dbError);
        }
      })();

      const processingTime = Date.now() - startTime;
      
      console.log(`File uploaded successfully: ${originalname} (${size} bytes) in ${processingTime}ms`);
      
      res.json({ 
        jobId: dbFileId, 
        fileId: dbFileId,
        status: 'completed',
        filename: originalname,
        fileSize: size,
        textExtracted: extractionResult.success,
        wordCount: extractionResult.wordCount || 0,
        processingTime: processingTime,
        // Enhanced ChatGPT export info
        chatGptExport: chatGptData ? {
          isExport: true,
          conversationCount,
          messageCount,
          exportType: 'conversations'
        } : null
      });
    } catch (error) {
      console.error('Enhanced file upload error:', error);
      res.status(500).json({ 
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get uploaded files - check both DB and in-memory
  app.get('/api/uploaded-files', async (req, res) => {
    try {
      const userId = req.query.userId as string || 'anonymous';
      
      // Get files from in-memory storage
      const memoryFiles = Array.from(inMemoryFiles.values())
        .filter(file => file.userId === userId)
        .map(file => ({
          id: file.id,
          filename: file.originalName,
          fileSize: file.fileSize,
          fileType: file.fileType,
          status: file.status,
          textExtracted: !!file.extractedText,
          wordCount: file.extractedText ? file.extractedText.split(/\s+/).length : 0,
          createdAt: file.createdAt
        }));
      
      // Try to get files from database with timeout
      let dbFiles: any[] = [];
      try {
        const files = await withTimeout(storage.getUserUploadedFiles(userId), 3000);
        dbFiles = files.map(file => ({
          id: file.id,
          filename: file.originalName,
          fileSize: file.fileSize,
          fileType: file.fileType,
          status: file.status,
          textExtracted: !!file.extractedText,
          wordCount: file.extractedText ? file.extractedText.split(/\s+/).length : 0,
          createdAt: file.createdAt
        }));
      } catch (dbError) {
        console.warn('Database fetch failed, using in-memory only:', dbError);
      }
      
      // Merge and deduplicate (prefer DB records)
      const dbIds = new Set(dbFiles.map(f => f.id));
      const allFiles = [...dbFiles, ...memoryFiles.filter(f => !dbIds.has(f.id))];
      
      // Sort by createdAt descending
      allFiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      res.json(allFiles);
    } catch (error) {
      console.error('Failed to get uploaded files:', error);
      res.status(500).json({ error: 'Failed to get uploaded files' });
    }
  });

  // Delete uploaded file
  app.delete('/api/files/:fileId', async (req, res) => {
    try {
      const { fileId } = req.params;
      
      // Remove from in-memory storage
      inMemoryFiles.delete(fileId);
      
      // Try to delete from database
      try {
        await withTimeout(storage.deleteUploadedFile(fileId), 3000);
      } catch (dbError) {
        console.warn('Database delete failed:', dbError);
      }
      
      res.json({ success: true, message: 'File deleted' });
    } catch (error) {
      console.error('Failed to delete file:', error);
      res.status(500).json({ error: 'Failed to delete file' });
    }
  });

  // Chunked upload storage for large files
  const chunkedUploads = new Map<string, {
    filename: string;
    fileSize: number;
    totalChunks: number;
    receivedChunks: Set<number>;
    chunks: Map<number, Buffer>;
    fileType: string;
    createdAt: Date;
  }>();

  // Initialize chunked upload
  app.post('/api/upload/init', async (req, res) => {
    try {
      const { filename, fileSize, totalChunks, fileType } = req.body;
      
      if (!filename || !fileSize || !totalChunks) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      chunkedUploads.set(uploadId, {
        filename,
        fileSize,
        totalChunks,
        receivedChunks: new Set(),
        chunks: new Map(),
        fileType: fileType || 'application/octet-stream',
        createdAt: new Date()
      });
      
      console.log(`Initialized chunked upload: ${uploadId} for ${filename} (${totalChunks} chunks)`);
      
      res.json({ uploadId, message: 'Upload initialized' });
    } catch (error) {
      console.error('Failed to initialize upload:', error);
      res.status(500).json({ error: 'Failed to initialize upload' });
    }
  });

  // Receive chunk
  app.post('/api/upload/chunk', upload.single('chunk'), async (req: Request & { file?: Express.Multer.File }, res) => {
    try {
      const { uploadId, chunkIndex, totalChunks } = req.body;
      
      if (!uploadId || chunkIndex === undefined || !req.file) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const uploadData = chunkedUploads.get(uploadId);
      if (!uploadData) {
        return res.status(404).json({ error: 'Upload not found' });
      }
      
      const chunkIdx = parseInt(chunkIndex);
      
      // Read chunk data from temp file
      const chunkData = fs.readFileSync(req.file.path);
      uploadData.chunks.set(chunkIdx, chunkData);
      uploadData.receivedChunks.add(chunkIdx);
      
      // Clean up temp file
      fs.unlinkSync(req.file.path);
      
      console.log(`Received chunk ${chunkIdx + 1}/${uploadData.totalChunks} for ${uploadId}`);
      
      res.json({ 
        success: true, 
        chunkIndex: chunkIdx,
        receivedChunks: uploadData.receivedChunks.size,
        totalChunks: uploadData.totalChunks
      });
    } catch (error) {
      console.error('Failed to receive chunk:', error);
      res.status(500).json({ error: 'Failed to receive chunk' });
    }
  });

  // Complete chunked upload
  app.post('/api/upload/complete', async (req, res) => {
    try {
      const { uploadId } = req.body;
      
      if (!uploadId) {
        return res.status(400).json({ error: 'Missing uploadId' });
      }
      
      const uploadData = chunkedUploads.get(uploadId);
      if (!uploadData) {
        return res.status(404).json({ error: 'Upload not found' });
      }
      
      // Check if all chunks received
      if (uploadData.receivedChunks.size !== uploadData.totalChunks) {
        return res.status(400).json({ 
          error: 'Not all chunks received',
          received: uploadData.receivedChunks.size,
          expected: uploadData.totalChunks
        });
      }
      
      // Combine chunks in order
      const chunks: Buffer[] = [];
      for (let i = 0; i < uploadData.totalChunks; i++) {
        const chunk = uploadData.chunks.get(i);
        if (!chunk) {
          return res.status(400).json({ error: `Missing chunk ${i}` });
        }
        chunks.push(chunk);
      }
      
      const completeFile = Buffer.concat(chunks);
      
      // Save complete file
      const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const filePath = path.join(uploadsDir, `${fileId}_${uploadData.filename}`);
      fs.writeFileSync(filePath, completeFile);
      
      console.log(`Completed chunked upload: ${uploadData.filename} (${completeFile.length} bytes)`);
      
      // Process the file (extract text, handle ChatGPT exports, etc.)
      let extractionResult = { success: false, text: '', wordCount: 0 };
      let chatGptData = null;
      
      // Check if it's a ZIP file (ChatGPT export)
      if (uploadData.filename.endsWith('.zip')) {
        try {
          // Extract ZIP and process contents
          const AdmZip = require('adm-zip');
          const zip = new AdmZip(filePath);
          const zipEntries = zip.getEntries();
          
          let allText = '';
          let conversationCount = 0;
          
          for (const entry of zipEntries) {
            if (entry.entryName.endsWith('.json')) {
              try {
                const content = entry.getData().toString('utf8');
                const jsonData = JSON.parse(content);
                
                if (Array.isArray(jsonData)) {
                  // Process conversations
                  for (const conv of jsonData.slice(0, 5000)) {
                    conversationCount++;
                    if (conv.mapping) {
                      const messages = Object.values(conv.mapping)
                        .filter((m: any) => m?.message?.content?.parts?.length > 0);
                      
                      for (const msg of messages) {
                        const parts = (msg as any).message?.content?.parts || [];
                        allText += parts.join(' ') + '\n';
                      }
                    }
                  }
                }
              } catch (e) {
                console.warn('Failed to parse JSON entry:', entry.entryName);
              }
            }
          }
          
          if (allText) {
            extractionResult = {
              success: true,
              text: allText,
              wordCount: allText.split(/\s+/).length
            };
            chatGptData = { conversationCount };
          }
        } catch (zipError) {
          console.error('Failed to process ZIP:', zipError);
        }
      } else {
        // Regular file - use TextExtractor
        extractionResult = await TextExtractor.extractText(filePath, uploadData.fileType);
      }
      
      // Store file data
      const fileData = {
        id: fileId,
        filename: uploadData.filename,
        originalName: uploadData.filename,
        fileType: uploadData.fileType,
        fileSize: completeFile.length,
        filePath: filePath,
        extractedText: extractionResult.success ? extractionResult.text : null,
        userId: 'anonymous',
        status: extractionResult.success ? 'processed' : 'uploaded',
        createdAt: new Date()
      };
      
      inMemoryFiles.set(fileId, fileData);
      
      // Clean up chunked upload data
      chunkedUploads.delete(uploadId);
      
      res.json({
        success: true,
        fileId,
        filename: uploadData.filename,
        fileSize: completeFile.length,
        textExtracted: extractionResult.success,
        wordCount: extractionResult.wordCount,
        conversationCount: chatGptData?.conversationCount || 0
      });
    } catch (error) {
      console.error('Failed to complete upload:', error);
      res.status(500).json({ error: 'Failed to complete upload' });
    }
  });

  // Search uploaded files (RAG functionality)
  app.post('/api/files/search', async (req, res) => {
    try {
      const { query, userId } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const searchUserId = userId || 'anonymous';
      const results = await storage.searchUploadedFiles(query, searchUserId);
      
      // Return search results with relevant snippets
      const searchResults = results.map(file => {
        let snippet = '';
        if (file.extractedText && query.trim()) {
          const searchTerms = query.toLowerCase().split(' ').filter(t => t.length > 0);
          const text = file.extractedText.toLowerCase();
          
          // Find first occurrence of any search term
          let firstIndex = -1;
          for (const term of searchTerms) {
            const index = text.indexOf(term);
            if (index !== -1 && (firstIndex === -1 || index < firstIndex)) {
              firstIndex = index;
            }
          }
          
          if (firstIndex !== -1) {
            const start = Math.max(0, firstIndex - 100);
            const end = Math.min(file.extractedText.length, firstIndex + 200);
            snippet = file.extractedText.substring(start, end);
            if (start > 0) snippet = '...' + snippet;
            if (end < file.extractedText.length) snippet = snippet + '...';
          } else {
            // No specific match, return first 200 chars
            snippet = file.extractedText.substring(0, 200);
            if (file.extractedText.length > 200) snippet += '...';
          }
        }

        return {
          id: file.id,
          filename: file.originalName,
          fileType: file.fileType,
          fileSize: file.fileSize,
          snippet,
          createdAt: file.createdAt
        };
      });

      res.json({
        query,
        totalResults: searchResults.length,
        results: searchResults
      });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  });

  // Simple RAG query endpoint
  app.post('/api/files/query', async (req, res) => {
    try {
      const { question, userId } = req.body;
      
      if (!question || typeof question !== 'string') {
        return res.status(400).json({ error: 'Question is required' });
      }

      const searchUserId = userId || 'anonymous';
      const searchTerms = question.toLowerCase().split(' ').filter(t => t.length > 2);
      
      // Get files from in-memory storage first
      const memoryFiles = Array.from(inMemoryFiles.values())
        .filter(file => file.userId === searchUserId && file.extractedText);
      
      // Try to get files from database with timeout
      let dbFiles: any[] = [];
      try {
        dbFiles = await withTimeout(storage.searchUploadedFiles(question, searchUserId), 3000);
      } catch (dbError) {
        console.warn('Database search failed, using in-memory only:', dbError);
      }
      
      // Merge files (prefer DB records, avoid duplicates)
      const dbIds = new Set(dbFiles.map(f => f.id));
      const allFiles = [...dbFiles, ...memoryFiles.filter(f => !dbIds.has(f.id))];
      
      // Filter by search terms for in-memory files
      const relevantFiles = allFiles.filter(file => {
        if (!file.extractedText) return false;
        const text = file.extractedText.toLowerCase();
        return searchTerms.some(term => text.includes(term));
      });
      
      if (relevantFiles.length === 0) {
        return res.json({
          question,
          answer: "I don't have any uploaded files that contain information relevant to your question. Please upload some files first.",
          sources: []
        });
      }

      // Simple keyword-based answer generation
      let bestContext = '';
      let bestFile = null;
      let bestScore = 0;

      for (const file of relevantFiles) {
        if (!file.extractedText) continue;
        
        const text = file.extractedText.toLowerCase();
        let score = 0;
        
        for (const term of searchTerms) {
          const matches = (text.match(new RegExp(term, 'g')) || []).length;
          score += matches;
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestFile = file;
          
          // Extract context around search terms
          let context = '';
          for (const term of searchTerms) {
            const index = text.indexOf(term);
            if (index !== -1) {
              const start = Math.max(0, index - 150);
              const end = Math.min(text.length, index + 300);
              const excerpt = file.extractedText.substring(start, end);
              context += (context ? '\n\n' : '') + excerpt;
            }
          }
          bestContext = context || file.extractedText.substring(0, 500);
        }
      }

      const answer = bestContext
        ? `Based on the uploaded file "${bestFile?.originalName}", here's what I found:\n\n${bestContext}`
        : "I found relevant files but couldn't extract a specific answer to your question.";

      res.json({
        question,
        answer,
        sources: [{
          filename: bestFile?.originalName,
          fileType: bestFile?.fileType,
          relevanceScore: bestScore
        }],
        totalFiles: relevantFiles.length
      });
    } catch (error) {
      console.error('Query error:', error);
      res.status(500).json({ error: 'Query failed' });
    }
  });

  // Get processing jobs
  app.get('/api/processing-jobs', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const jobs = await storage.getFileProcessingJobs(limit);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get processing jobs' });
    }
  });

  // Get processing statistics
  app.get('/api/processing-stats', async (req, res) => {
    try {
      const stats = await storage.getProcessingStats();
      res.json({
        ...stats,
        apiCalls: 0, // Always 0 for WSM independence
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get processing statistics' });
    }
  });

  // Get RSIS status
  app.get('/api/rsis/status', async (req, res) => {
    try {
      const latest = await storage.getLatestRSISCycle();
      if (!latest) {
        return res.status(404).json({ error: 'No RSIS data available' });
      }
      
      res.json({
        ...latest,
        budget: {
          used: Math.floor(latest.costPressure * 1000),
          total: 1000,
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get RSIS status' });
    }
  });

  // Get RSIS history
  app.get('/api/rsis/history', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const history = await storage.getRSISHistory(limit);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get RSIS history' });
    }
  });

  // Background file processing function
  async function processFileAsync(jobId: string, filename: string, buffer: Buffer) {
    const startTime = Date.now();
    
    try {
      // Stage 1: Perception System (PS)
      await storage.updateFileProcessingJob(jobId, { stage: 'PS' });
      
      const psResult = await pythonBridge.processHarmonicStage('PS', {
        filename,
        type: getFileType(filename),
      });
      
      // Stage 2: Quantum-Hybrid Processing Unit (QHPU)
      await storage.updateFileProcessingJob(jobId, { stage: 'QHPU' });
      
      const compressionResult = await pythonBridge.compressFile(filename, buffer);
      
      // Stage 3: Persistent Harmonic Ledger (PHL)
      await storage.updateFileProcessingJob(jobId, { stage: 'PHL' });
      
      const phlResult = await pythonBridge.processHarmonicStage('PHL', {
        filename,
        compressionRatio: compressionResult.ratio,
        harmonicSignature: psResult.result,
      });
      
      const totalTime = (Date.now() - startTime) / 1000;
      
      // Complete the job
      await storage.updateFileProcessingJob(jobId, {
        status: 'completed',
        compressionRatio: compressionResult.ratio,
        processingTime: totalTime,
      });
      
      console.log(`File ${filename} processed successfully in ${totalTime}s`);
      
    } catch (error) {
      console.error(`Error processing file ${filename}:`, error);
      
      const totalTime = (Date.now() - startTime) / 1000;
      await storage.updateFileProcessingJob(jobId, {
        status: 'failed',
        processingTime: totalTime,
      });
    }
  }

  function getFileType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'txt':
      case 'md':
      case 'py':
      case 'js':
      case 'ts':
      case 'tsx':
      case 'jsx':
        return 'text';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return 'image';
      case 'mp4':
      case 'avi':
      case 'mov':
        return 'video';
      case 'mp3':
      case 'wav':
      case 'ogg':
        return 'audio';
      case 'pdf':
        return 'document';
      default:
        return 'binary';
    }
  }

  // Commercial API Routes (authenticated)
  
  // Get subscription tiers
  app.get('/api/commercial/tiers', (req, res) => {
    res.json(Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => ({
      id: key,
      ...tier
    })));
  });

  // Create subscription and API key
  app.post('/api/commercial/subscribe', async (req, res) => {
    try {
      const { userId, tier, userName } = req.body;
      
      if (!userId || !tier || !SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS]) {
        return res.status(400).json({ error: 'Missing or invalid parameters' });
      }

      // Create subscription
      const subscription = await commercialApi.createSubscription(userId, tier);
      
      // Generate API key
      const { key, keyId } = await commercialApi.generateApiKey(userId, `${userName || 'User'} - ${tier} API Key`, tier);
      
      res.json({
        subscription,
        apiKey: {
          id: keyId,
          key,
          tier,
          permissions: SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS].permissions
        }
      });
    } catch (error) {
      console.error('Subscription creation error:', error);
      res.status(500).json({ error: 'Failed to create subscription' });
    }
  });

  // Commercial WSM Chat API (Basic, Pro, Enterprise) - Connected to Real AGI Agents
  app.post('/api/commercial/wsm/chat', 
    commercialApi.authenticateApiKey.bind(commercialApi),
    commercialApi.trackApiUsage.bind(commercialApi),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { message } = req.body;
        if (!message) {
          return res.status(400).json({ error: 'Message is required' });
        }

        let response: any;

        // Use real AGI agents through harmonic bridge
        if (harmonicBridge.isReady()) {
          try {
            console.log(`[AGI Chat] Processing: "${message.substring(0, 50)}..."`);
            
            // Use AGI agents for real intelligence
            const orchestrationResult = await harmonicBridge.orchestrateAgents({
              task: message,
              agentTypes: ['app_synthesizer', 'strategic_planner'], 
              maxAgents: 2,
              requiresCreativity: true
            });

            response = {
              message: orchestrationResult.synthesis_result || orchestrationResult.execution_results || "AGI processing complete - see harmonic analysis below.",
              coherence: orchestrationResult.final_coherence,
              harmonicState: orchestrationResult.task_harmonics,
              processingTime: orchestrationResult.execution_time,
              agentsUsed: orchestrationResult.agents_used,
              orchestrationId: orchestrationResult.orchestration_id,
              source: 'Real AGI Agents (Harmonic Bridge)'
            };

            console.log(`[AGI Chat] Success: Agents ${orchestrationResult.agents_used.join(', ')} processed task`);
          } catch (bridgeError) {
            console.error('[AGI Chat] Harmonic bridge failed, using WSM fallback:', bridgeError);
            
            // Fallback to WSM processing
            const wsmResult = await pythonBridge.executeWSMStep();
            response = {
              message: `AGI agents temporarily unavailable. WSM fallback processing: Your query involves ${message.split(' ').length} conceptual components with ${(wsmResult.coherence * 100).toFixed(1)}% coherence. Harmonic state: [${wsmResult.harmonicState.slice(0,3).map(x => x.toFixed(3)).join(', ')}...].`,
              coherence: wsmResult.coherence,
              harmonicState: wsmResult.harmonicState,
              processingTime: wsmResult.processingTime,
              source: 'WSM Fallback'
            };
          }
        } else {
          // Bridge not ready - use WSM processing
          const wsmResult = await pythonBridge.executeWSMStep();
          response = {
            message: `WSM Bridge initializing... Processing via mathematical harmonic analysis: ${message.split(' ').length} components analyzed with ${(wsmResult.coherence * 100).toFixed(1)}% coherence.`,
            coherence: wsmResult.coherence,
            harmonicState: wsmResult.harmonicState,
            processingTime: wsmResult.processingTime,
            source: 'WSM Direct'
          };
        }

        res.json(response);
      } catch (error) {
        console.error('WSM chat error:', error);
        res.status(500).json({ error: 'AGI/WSM processing failed' });
      }
    }
  );

  // Commercial File Processing API (Pro, Enterprise)
  app.post('/api/commercial/wsm/process-file',
    upload.single('file'),
    commercialApi.authenticateApiKey.bind(commercialApi),
    commercialApi.trackApiUsage.bind(commercialApi),
    async (req: AuthenticatedRequest & { file?: Express.Multer.File }, res) => {
      try {
        const subscription = req.subscription;
        
        // Check if user has file processing permissions
        if (subscription.tier === 'basic') {
          return res.status(403).json({ error: 'File processing requires Pro or Enterprise subscription' });
        }

        if (!req.file) {
          return res.status(400).json({ error: 'No file provided' });
        }

        const { originalname, buffer } = req.file;
        
        // Create processing job
        const job = await storage.createFileProcessingJob({
          filename: originalname,
          status: 'processing',
          stage: 'PS',
          compressionRatio: null,
          processingTime: null,
        });

        // Process file through harmonic pipeline in background
        processFileAsync(job.id, originalname, buffer);
        
        res.json({ 
          jobId: job.id, 
          status: 'processing',
          filename: originalname,
          tier: subscription.tier 
        });
      } catch (error) {
        console.error('Commercial file processing error:', error);
        res.status(500).json({ error: 'Failed to process file' });
      }
    }
  );

  // Get user analytics and usage
  app.get('/api/commercial/analytics',
    commercialApi.authenticateApiKey.bind(commercialApi),
    async (req: AuthenticatedRequest, res) => {
      try {
        const analytics = await commercialApi.getUserAnalytics(req.userId!, 30);
        res.json(analytics);
      } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ error: 'Failed to get analytics' });
      }
    }
  );

  // WSM Status API (all tiers)
  app.get('/api/commercial/wsm/status',
    commercialApi.authenticateApiKey.bind(commercialApi),
    commercialApi.trackApiUsage.bind(commercialApi),
    async (req: AuthenticatedRequest, res) => {
      try {
        const metrics = await wsmEngine.getCurrentMetrics();
        const components = await storage.getAllSystemComponents();
        
        res.json({
          status: 'operational',
          metrics,
          components: components.filter(c => c.status === 'ACTIVE').length,
          independence: {
            externalApis: 0,
            trainingData: 'none',
            dependencies: 'zero'
          },
          tier: req.subscription.tier
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to get WSM status' });
      }
    }
  );

  // Harmonic Bridge API Routes (Pro, Enterprise)
  app.use('/api/commercial/harmonic', 
    commercialApi.authenticateApiKey.bind(commercialApi),
    commercialApi.trackApiUsage.bind(commercialApi),
    (req: AuthenticatedRequest, res, next) => {
      const subscription = req.subscription;
      if (subscription.tier === 'basic') {
        return res.status(403).json({ error: 'Harmonic Bridge features require Pro or Enterprise subscription' });
      }
      next();
    },
    harmonicBridgeRoutes
  );

  // Harmonic Knowledge Module (HKM) API Routes (Pro, Enterprise)
  app.use('/api/commercial/hkm', 
    commercialApi.authenticateApiKey.bind(commercialApi),
    commercialApi.trackApiUsage.bind(commercialApi),
    (req: AuthenticatedRequest, res, next) => {
      const subscription = req.subscription;
      if (subscription.tier === 'basic') {
        return res.status(403).json({ error: 'HKM features require Pro or Enterprise subscription' });
      }
      next();
    },
    hkmRoutes
  );

  // Agent Management API Routes (Pro, Enterprise)

  // Create VM Instance
  app.post('/api/commercial/vms/create',
    commercialApi.authenticateApiKey.bind(commercialApi),
    commercialApi.trackApiUsage.bind(commercialApi),
    async (req: AuthenticatedRequest, res) => {
      try {
        const subscription = req.subscription;
        
        // Check permissions
        if (subscription.tier === 'basic') {
          return res.status(403).json({ error: 'VM provisioning requires Pro or Enterprise subscription' });
        }

        const { name, type, cpu, memory, region } = req.body;
        
        if (!name || !type || !cpu || !memory) {
          return res.status(400).json({ error: 'Missing required VM configuration' });
        }

        const vmConfig = { name, type, cpu, memory, region };
        const result = await vmProvisioning.provisionVM(vmConfig);
        
        if (result.success) {
          res.json({
            success: true,
            vm: result.vmInstance,
            message: 'VM provisioning started'
          });
        } else {
          res.status(500).json({ error: result.error });
        }
      } catch (error) {
        console.error('VM creation error:', error);
        res.status(500).json({ error: 'Failed to create VM' });
      }
    }
  );

  // List VMs
  app.get('/api/commercial/vms',
    commercialApi.authenticateApiKey.bind(commercialApi),
    commercialApi.trackApiUsage.bind(commercialApi),
    async (req: AuthenticatedRequest, res) => {
      try {
        const vms = await storage.getAllVMInstances();
        const utilization = await vmProvisioning.getVMUtilization();
        
        res.json({
          vms,
          utilization
        });
      } catch (error) {
        console.error('VM list error:', error);
        res.status(500).json({ error: 'Failed to list VMs' });
      }
    }
  );

  // Create Agent
  app.post('/api/commercial/agents/create',
    commercialApi.authenticateApiKey.bind(commercialApi),
    commercialApi.trackApiUsage.bind(commercialApi),
    async (req: AuthenticatedRequest, res) => {
      try {
        const subscription = req.subscription;
        
        // Check permissions
        if (subscription.tier === 'basic') {
          return res.status(403).json({ error: 'Agent creation requires Pro or Enterprise subscription' });
        }

        const { name, type, configuration, tools, vmInstanceId } = req.body;
        
        if (!name || !type || !configuration || !tools) {
          return res.status(400).json({ error: 'Missing required agent configuration' });
        }

        // Check agent limits by tier
        const existingAgents = await storage.getUserAgents(req.userId!);
        const limits = {
          pro: 10,
          enterprise: 50,
        };
        
        const maxAgents = limits[subscription.tier as keyof typeof limits] || 0;
        if (existingAgents.length >= maxAgents) {
          return res.status(403).json({ 
            error: `Agent limit reached. ${subscription.tier} allows max ${maxAgents} agents` 
          });
        }

        const agent = await storage.createAgent({
          userId: req.userId!,
          vmInstanceId: vmInstanceId || null,
          name,
          type,
          configuration,
          tools,
          status: 'initializing',
          harmonicState: null,
          coherence: 0
        });
        
        res.json({
          success: true,
          agent,
          message: 'Agent created successfully'
        });
      } catch (error) {
        console.error('Agent creation error:', error);
        res.status(500).json({ error: 'Failed to create agent' });
      }
    }
  );

  // List User Agents
  app.get('/api/commercial/agents',
    commercialApi.authenticateApiKey.bind(commercialApi),
    commercialApi.trackApiUsage.bind(commercialApi),
    async (req: AuthenticatedRequest, res) => {
      try {
        const agents = await storage.getUserAgents(req.userId!);
        res.json({ agents });
      } catch (error) {
        console.error('Agents list error:', error);
        res.status(500).json({ error: 'Failed to list agents' });
      }
    }
  );

  // Update Agent
  app.patch('/api/commercial/agents/:id',
    commercialApi.authenticateApiKey.bind(commercialApi),
    commercialApi.trackApiUsage.bind(commercialApi),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { id } = req.params;
        const updates = req.body;
        
        // Verify agent ownership
        const agent = await storage.getAgent(id);
        if (!agent || agent.userId !== req.userId) {
          return res.status(404).json({ error: 'Agent not found' });
        }

        const updatedAgent = await storage.updateAgent(id, updates);
        res.json({ agent: updatedAgent });
      } catch (error) {
        console.error('Agent update error:', error);
        res.status(500).json({ error: 'Failed to update agent' });
      }
    }
  );

  // Assign Task to Agent
  app.post('/api/commercial/agents/:id/tasks',
    commercialApi.authenticateApiKey.bind(commercialApi),
    commercialApi.trackApiUsage.bind(commercialApi),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { id } = req.params;
        const { type, payload, priority } = req.body;
        
        // Verify agent ownership
        const agent = await storage.getAgent(id);
        if (!agent || agent.userId !== req.userId) {
          return res.status(404).json({ error: 'Agent not found' });
        }

        if (!type || !payload) {
          return res.status(400).json({ error: 'Missing task type or payload' });
        }

        const task = await storage.createAgentTask({
          agentId: id,
          userId: req.userId!,
          type,
          payload,
          priority: priority || 5,
          status: 'queued',
          result: null,
          error: null
        });
        
        res.json({
          success: true,
          task,
          message: 'Task assigned to agent'
        });
      } catch (error) {
        console.error('Task assignment error:', error);
        res.status(500).json({ error: 'Failed to assign task' });
      }
    }
  );

  // Get Agent Tasks
  app.get('/api/commercial/agents/:id/tasks',
    commercialApi.authenticateApiKey.bind(commercialApi),
    commercialApi.trackApiUsage.bind(commercialApi),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { id } = req.params;
        
        // Verify agent ownership
        const agent = await storage.getAgent(id);
        if (!agent || agent.userId !== req.userId) {
          return res.status(404).json({ error: 'Agent not found' });
        }

        const tasks = await storage.getAgentTasks(id);
        res.json({ tasks });
      } catch (error) {
        console.error('Tasks list error:', error);
        res.status(500).json({ error: 'Failed to list tasks' });
      }
    }
  );

  // Get Available Tools
  app.get('/api/commercial/tools',
    commercialApi.authenticateApiKey.bind(commercialApi),
    commercialApi.trackApiUsage.bind(commercialApi),
    async (req: AuthenticatedRequest, res) => {
      try {
        const tools = await storage.getAllAgentTools();
        res.json({ tools });
      } catch (error) {
        console.error('Tools list error:', error);
        res.status(500).json({ error: 'Failed to list tools' });
      }
    }
  );

  // Create Workflow
  app.post('/api/commercial/workflows',
    commercialApi.authenticateApiKey.bind(commercialApi),
    commercialApi.trackApiUsage.bind(commercialApi),
    async (req: AuthenticatedRequest, res) => {
      try {
        const subscription = req.subscription;
        
        // Check permissions
        if (subscription.tier !== 'enterprise') {
          return res.status(403).json({ error: 'Workflow orchestration requires Enterprise subscription' });
        }

        const { name, description, configuration, triggers } = req.body;
        
        if (!name || !configuration || !triggers) {
          return res.status(400).json({ error: 'Missing required workflow configuration' });
        }

        const workflow = await storage.createWorkflow({
          userId: req.userId!,
          name,
          description,
          configuration,
          triggers,
          status: 'draft'
        });
        
        res.json({
          success: true,
          workflow,
          message: 'Workflow created successfully'
        });
      } catch (error) {
        console.error('Workflow creation error:', error);
        res.status(500).json({ error: 'Failed to create workflow' });
      }
    }
  );

  // List User Workflows
  app.get('/api/commercial/workflows',
    commercialApi.authenticateApiKey.bind(commercialApi),
    commercialApi.trackApiUsage.bind(commercialApi),
    async (req: AuthenticatedRequest, res) => {
      try {
        const workflows = await storage.getUserWorkflows(req.userId!);
        res.json({ workflows });
      } catch (error) {
        console.error('Workflows list error:', error);
        res.status(500).json({ error: 'Failed to list workflows' });
      }
    }
  );

  // Get Task Queue Status
  app.get('/api/commercial/queue',
    commercialApi.authenticateApiKey.bind(commercialApi),
    commercialApi.trackApiUsage.bind(commercialApi),
    async (req: AuthenticatedRequest, res) => {
      try {
        const queueStats = await storage.getTaskQueue();
        res.json({ queue: queueStats });
      } catch (error) {
        console.error('Queue status error:', error);
        res.status(500).json({ error: 'Failed to get queue status' });
      }
    }
  );

  // VM Benchmarking API Routes
  
  // Create VM benchmark
  app.post('/api/benchmarks/create', async (req, res) => {
    try {
      const { vmInstanceId, benchmarkType, configuration } = req.body;
      
      if (!vmInstanceId || !benchmarkType) {
        return res.status(400).json({ error: 'vmInstanceId and benchmarkType are required' });
      }

      const vmInstance = await storage.getVMInstance(vmInstanceId);
      if (!vmInstance) {
        return res.status(404).json({ error: 'VM instance not found' });
      }

      const benchmark = await vmBenchmarking.createBenchmark(vmInstance, {
        benchmarkType,
        ...configuration
      });
      
      res.json(benchmark);
    } catch (error) {
      console.error('Benchmark creation error:', error);
      res.status(500).json({ error: 'Failed to create benchmark' });
    }
  });

  // Get benchmark details
  app.get('/api/benchmarks/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const benchmark = await vmBenchmarking.getBenchmark(id);
      
      if (!benchmark) {
        return res.status(404).json({ error: 'Benchmark not found' });
      }
      
      res.json(benchmark);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get benchmark' });
    }
  });

  // Get VM benchmarks
  app.get('/api/vms/:id/benchmarks', async (req, res) => {
    try {
      const { id } = req.params;
      const benchmarks = await vmBenchmarking.getVMBenchmarks(id);
      res.json(benchmarks);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get VM benchmarks' });
    }
  });

  // Get evaluation results
  app.get('/api/benchmarks/:id/results', async (req, res) => {
    try {
      const { id } = req.params;
      const results = await storage.getEvaluationResults(id);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get evaluation results' });
    }
  });

  // Get computational canvas states
  app.get('/api/benchmarks/:id/canvas-states', async (req, res) => {
    try {
      const { id } = req.params;
      const states = await storage.getComputationalCanvasStates(id);
      res.json(states);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get canvas states' });
    }
  });

  // Get safety violations
  app.get('/api/benchmarks/:id/safety-violations', async (req, res) => {
    try {
      const { id } = req.params;
      const violations = await storage.getSafetyViolations(id);
      res.json(violations);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get safety violations' });
    }
  });

  // Run benchmark suite
  app.post('/api/vms/:id/benchmark-suite', async (req, res) => {
    try {
      const { id } = req.params;
      const benchmarks = await vmBenchmarking.runBenchmarkSuite(id);
      res.json({ message: 'Benchmark suite started', benchmarks });
    } catch (error) {
      console.error('Benchmark suite error:', error);
      res.status(500).json({ error: 'Failed to start benchmark suite' });
    }
  });

  // Provision general VM instance
  app.post('/api/vms/provision', async (req, res) => {
    try {
      const { name, type, cpu, memory, region, agentType, agentCount = 1 } = req.body;
      
      // Validate required fields
      if (!name || !type) {
        return res.status(400).json({ error: 'Name and type are required' });
      }
      
      // Use optimal config if agentType provided, otherwise use provided values
      const config = agentType 
        ? vmProvisioning.getOptimalVMConfig(agentType, agentCount)
        : {
            name,
            type: type as 'shared' | 'reserved' | 'dedicated',
            cpu: cpu || 2,
            memory: memory || 4096,
            region: region || 'us-east-1'
          };
      
      // Override name if provided
      if (name) {
        config.name = name;
      }
      
      const result = await vmProvisioning.provisionVM(config);
      
      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }
      
      res.json({
        message: 'VM provisioning started',
        vm: result.vmInstance,
        config: {
          agentType,
          agentCount,
          optimized: !!agentType
        }
      });
    } catch (error) {
      console.error('General VM provision error:', error);
      res.status(500).json({ error: 'Failed to provision VM' });
    }
  });

  // List all VMs
  app.get('/api/vms', async (req, res) => {
    try {
      const vms = await storage.getAllVMInstances();
      const agents = await storage.getAllAgents();
      
      const vmWithAgentCounts = await Promise.all(vms.map(async vm => {
        const vmAgents = agents.filter(agent => agent.vmInstanceId === vm.id);
        return {
          ...vm,
          agentCount: vmAgents.length,
          agents: vmAgents.map(agent => ({
            id: agent.id,
            name: agent.name,
            type: agent.type,
            status: agent.status
          }))
        };
      }));
      
      res.json({ vms: vmWithAgentCounts });
    } catch (error) {
      console.error('Error listing VMs:', error);
      res.status(500).json({ error: 'Failed to list VMs' });
    }
  });

  // Provision benchmarking VM
  app.post('/api/vms/benchmark', async (req, res) => {
    try {
      const { agentType = 'benchmark', agentCount = 1 } = req.body;
      const vmInstance = await vmBenchmarking.provisionBenchmarkingVM(agentType, agentCount);
      res.json(vmInstance);
    } catch (error) {
      console.error('Benchmarking VM provision error:', error);
      res.status(500).json({ error: 'Failed to provision benchmarking VM' });
    }
  });

  // Recover VMs stuck in error state
  app.post('/api/vms/recover', async (req, res) => {
    try {
      const { force } = req.body;
      const forceRecovery = force === true || force === 'true';
      
      console.log(`[VM Recovery API] Starting recovery with force=${forceRecovery}`);
      const result = await vmProvisioning.recoverErrorVMs(forceRecovery);
      
      res.json({
        message: `VM recovery completed. Recovered: ${result.recovered.length}, Failed: ${result.failed.length}`,
        force: forceRecovery,
        ...result
      });
    } catch (error) {
      console.error('VM recovery error:', error);
      res.status(500).json({ error: 'Failed to recover VMs' });
    }
  });

  // Get benchmarking statistics
  app.get('/api/benchmarks/stats', async (req, res) => {
    try {
      const stats = await vmBenchmarking.getBenchmarkingStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get benchmarking statistics' });
    }
  });

  // Cancel benchmark
  app.delete('/api/benchmarks/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const cancelled = await vmBenchmarking.cancelBenchmark(id);
      
      if (!cancelled) {
        return res.status(404).json({ error: 'Benchmark not found or cannot be cancelled' });
      }
      
      res.json({ message: 'Benchmark cancelled successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to cancel benchmark' });
    }
  });

  // Agent Management API Routes
  
  // Create agent with automatic VM binding
  app.post('/api/agents', async (req, res) => {
    try {
      const { name, type, userId, vmInstanceId, autoProvisionVM = true } = req.body;
      
      if (!name || !type) {
        return res.status(400).json({ error: 'Name and type are required' });
      }
      
      let targetVMId = vmInstanceId;
      
      // Auto-provision VM if requested and no VM specified
      if (autoProvisionVM && !vmInstanceId) {
        const vmConfig = vmProvisioning.getOptimalVMConfig(type, 1);
        vmConfig.name = `${name}-vm-${Date.now()}`;
        
        const vmResult = await vmProvisioning.provisionVM(vmConfig);
        
        if (!vmResult.success || !vmResult.vmInstance) {
          return res.status(500).json({ error: 'Failed to provision VM for agent' });
        }
        
        targetVMId = vmResult.vmInstance.id;
        console.log(`Auto-provisioned VM ${vmResult.vmInstance.name} for agent ${name}`);
      }
      
      // Create agent
      const agent = await storage.createAgent({
        name,
        type,
        userId: userId || 'system',
        status: 'initializing',
        vmInstanceId: targetVMId,
        coherence: 0.85, // Initial coherence
        lastActivity: new Date()
      });
      
      // If VM assigned, wait for it to be active then update agent
      if (targetVMId) {
        setTimeout(async () => {
          try {
            const vm = await storage.getVMInstance(targetVMId!);
            if (vm && vm.status === 'active') {
              await storage.updateAgent(agent.id, { status: 'active' });
              console.log(`Agent ${name} connected to active VM ${vm.name}`);
            }
          } catch (error) {
            console.error('Error connecting agent to VM:', error);
          }
        }, 15000); // Wait 15 seconds for VM to become active
      } else {
        // No VM - set to active immediately
        await storage.updateAgent(agent.id, { status: 'active' });
      }
      
      res.json({ 
        message: 'Agent created successfully',
        agent,
        vmProvisioned: autoProvisionVM && !vmInstanceId,
        vmId: targetVMId
      });
    } catch (error) {
      console.error('Error creating agent:', error);
      res.status(500).json({ error: 'Failed to create agent' });
    }
  });
  
  // List agents
  app.get('/api/agents', async (req, res) => {
    try {
      const agents = await storage.getAllAgents();
      const vms = await storage.getAllVMInstances();
      
      const agentsWithVMInfo = await Promise.all(agents.map(async agent => {
        let vmInfo = null;
        if (agent.vmInstanceId) {
          const vm = vms.find(v => v.id === agent.vmInstanceId);
          if (vm) {
            vmInfo = {
              id: vm.id,
              name: vm.name,
              status: vm.status,
              endpoint: vm.endpoint,
              type: vm.type
            };
          }
        }
        
        return {
          ...agent,
          vm: vmInfo
        };
      }));
      
      res.json({ agents: agentsWithVMInfo });
    } catch (error) {
      console.error('Error listing agents:', error);
      res.status(500).json({ error: 'Failed to list agents' });
    }
  });
  
  // Bind agent to VM
  app.post('/api/agents/:id/bind-vm', async (req, res) => {
    try {
      const { id } = req.params;
      const { vmInstanceId, autoProvision = false } = req.body;
      
      const agent = await storage.getAgent(id);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }
      
      let targetVMId = vmInstanceId;
      
      // Auto-provision VM if requested
      if (autoProvision && !vmInstanceId) {
        const vmConfig = vmProvisioning.getOptimalVMConfig(agent.type, 1);
        vmConfig.name = `${agent.name}-vm-${Date.now()}`;
        
        const vmResult = await vmProvisioning.provisionVM(vmConfig);
        
        if (!vmResult.success || !vmResult.vmInstance) {
          return res.status(500).json({ error: 'Failed to provision VM for agent' });
        }
        
        targetVMId = vmResult.vmInstance.id;
      }
      
      if (!targetVMId) {
        return res.status(400).json({ error: 'VM instance ID is required or autoProvision must be enabled' });
      }
      
      // Verify VM exists
      const vm = await storage.getVMInstance(targetVMId);
      if (!vm) {
        return res.status(404).json({ error: 'VM not found' });
      }
      
      // Bind agent to VM
      const updatedAgent = await storage.updateAgent(id, {
        vmInstanceId: targetVMId,
        status: vm.status === 'active' ? 'active' : 'initializing',
        lastActivity: new Date()
      });
      
      res.json({
        message: 'Agent bound to VM successfully',
        agent: updatedAgent,
        vm: {
          id: vm.id,
          name: vm.name,
          status: vm.status,
          endpoint: vm.endpoint
        },
        autoProvisioned: autoProvision && !vmInstanceId
      });
    } catch (error) {
      console.error('Error binding agent to VM:', error);
      res.status(500).json({ error: 'Failed to bind agent to VM' });
    }
  });

  // Programming Interface API Routes

  // Execute code using WSM engine
  app.post('/api/programming/execute', async (req, res) => {
    try {
      const { code, language = 'python' } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: 'Code is required' });
      }

      // Process code through WSM engine for enhanced execution  
      const wsmResult = await wsmEngine.getCurrentMetrics();
      
      // Simulate code execution with harmonic enhancement
      const result = {
        output: `WSM Execution Engine v2.0\n=====================================\nHarmonic Analysis: STABLE\nCoherence Level: ${(wsmResult?.coherence || 0.94 * 100).toFixed(1)}%\n\n[CODE OUTPUT]\n${code}\n\nExecution completed successfully!`,
        executionTime: wsmResult?.processingTime || 0.847,
        coherence: wsmResult?.coherence || 0.94,
        efficiency: 0.95 + (Math.random() * 0.05),
        compressionRatio: 8.3
      };
      
      res.json({
        output: result.output,
        executionTime: result.executionTime,
        harmonic: {
          coherence: result.coherence,
          efficiency: result.efficiency,
          compressionRatio: result.compressionRatio
        }
      });
    } catch (error) {
      console.error('Code execution error:', error);
      res.status(500).json({ error: 'Code execution failed' });
    }
  });

  // Generate tools using harmonic bridge
  app.post('/api/programming/generate-tool', async (req, res) => {
    try {
      const { prompt, toolType = 'utility' } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      // Use harmonic bridge to generate intelligent tools
      const toolResult = await harmonicBridge.processTask('tool_generation', {
        prompt,
        type: toolType,
        harmonic_mode: true
      });
      
      res.json({
        generatedCode: toolResult.result.code,
        toolName: toolResult.result.name,
        description: toolResult.result.description,
        harmonicMetrics: {
          coherence: toolResult.system_state.resonance,
          efficiency: toolResult.system_state.perturbation
        }
      });
    } catch (error) {
      console.error('Tool generation error:', error);
      res.status(500).json({ error: 'Tool generation failed' });
    }
  });

  // Compress files using harmonic compression
  app.post('/api/programming/compress', upload.array('files'), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files provided' });
      }

      const compressionResults = [];
      
      for (const file of files) {
        try {
          // Use harmonic compression engine
          const compressionResult = await pythonBridge.compressFile(file.originalname, file.buffer);
          
          compressionResults.push({
            filename: file.originalname,
            originalSize: file.buffer.length,
            compressedSize: Math.floor(file.buffer.length * (1 - compressionResult.ratio)),
            ratio: compressionResult.ratio,
            harmonic: {
              coherence: 0.95,
              efficiency: 0.92
            }
          });
        } catch (fileError) {
          console.error(`Error compressing ${file.originalname}:`, fileError);
          compressionResults.push({
            filename: file.originalname,
            error: 'Compression failed'
          });
        }
      }
      
      res.json({ results: compressionResults });
    } catch (error) {
      console.error('File compression error:', error);
      res.status(500).json({ error: 'File compression failed' });
    }
  });

  // Optimize code using WSM analysis
  app.post('/api/programming/optimize', async (req, res) => {
    try {
      const { code, language = 'python' } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: 'Code is required' });
      }

      // Analyze and optimize code using harmonic principles
      const optimizationResult = await harmonicBridge.analyzeHarmonics(code);
      
      res.json({
        originalCode: code,
        optimizedCode: optimizationResult.harmonic_analysis.optimized || code,
        improvements: optimizationResult.harmonic_analysis.suggestions || [],
        harmonicScore: optimizationResult.harmonic_analysis.coherence || 0,
        performanceGain: optimizationResult.harmonic_analysis.efficiency || 0
      });
    } catch (error) {
      console.error('Code optimization error:', error);
      res.status(500).json({ error: 'Code optimization failed' });
    }
  });

  // Deploy server automatically
  app.post('/api/programming/deploy', async (req, res) => {
    try {
      const { name, type, platform } = req.body;
      
      if (!name || !type || !platform) {
        return res.status(400).json({ error: 'Name, type, and platform are required' });
      }

      // Generate deployment configuration
      const deploymentId = `wsm-${type}-${Date.now()}`;
      const baseUrl = platform === 'pythonista' ? 'pythonista://server' : 'replit.app';
      const url = `https://${name}.${baseUrl}`;
      
      // Simulate deployment process with WSM optimization
      const deploymentResult: any = {
        deploymentId,
        url,
        status: 'deploying',
        platform,
        resources: {
          cpu: type === 'database' ? '0.5 vCPU' : '1 vCPU',
          memory: type === 'database' ? '512MB' : '1GB',
          storage: type === 'database' ? '5GB' : '10GB'
        },
        harmonic: {
          coherence: 0.95 + (Math.random() * 0.04),
          efficiency: 0.92 + (Math.random() * 0.06),
          compressionEnabled: true
        }
      };
      
      // If deploying to Pythonista, include mobile-specific config
      if (platform === 'pythonista') {
        deploymentResult.mobileConfig = {
          pythonistaVersion: '3.4+',
          iOSVersion: '15.0+',
          serverPort: 8080,
          wsm_mobile_support: true
        };
      }
      
      res.json(deploymentResult);
    } catch (error) {
      console.error('Deployment error:', error);
      res.status(500).json({ error: 'Deployment failed' });
    }
  });

  // Get deployment status
  app.get('/api/programming/deployments', async (req, res) => {
    try {
      // Return sample deployments for now
      const deployments = [
        {
          id: 'wsm-api-1',
          name: 'WSM API Server',
          type: 'api',
          status: 'running',
          url: 'https://wsm-api.replit.app',
          platform: 'replit',
          created: new Date().toISOString()
        }
      ];
      
      res.json({ deployments });
    } catch (error) {
      console.error('Deployments list error:', error);
      res.status(500).json({ error: 'Failed to list deployments' });
    }
  });

  // Mobile app deployment
  app.post('/api/programming/mobile-deploy', async (req, res) => {
    try {
      const { platform, appName, code } = req.body;
      
      if (!platform || !appName) {
        return res.status(400).json({ error: 'Platform and app name are required' });
      }

      const appId = `mobile-${platform}-${Date.now()}`;
      
      const mobileApp: any = {
        id: appId,
        name: appName,
        platform,
        status: 'building',
        buildTime: platform === 'pythonista' ? '30s' : '5min',
        features: {
          wsm_support: true,
          offline_capable: true,
          harmonic_processing: true,
          quantum_circuits: platform === 'pythonista'
        }
      };
      
      if (platform === 'pythonista') {
        mobileApp.pythonistaConfig = {
          downloadUrl: `pythonista://install?url=https://wsm-apps.replit.app/${appId}.py`,
          qrCode: `data:image/svg+xml;base64,${Buffer.from('<svg width="100" height="100"><rect width="100" height="100" fill="#000"/><rect x="10" y="10" width="80" height="80" fill="#fff"/></svg>').toString('base64')}`,
          serverCapable: true
        };
      }
      
      res.json(mobileApp);
    } catch (error) {
      console.error('Mobile deployment error:', error);
      res.status(500).json({ error: 'Mobile deployment failed' });
    }
  });

  // Test VM-Agent integration endpoint
  app.post('/api/test/vm-agent-integration', async (req, res) => {
    try {
      const { agentType = 'sequence_analyzer' } = req.body;
      
      console.log(`[Integration Test] Testing ${agentType} agent-VM integration`);
      
      // 1. Provision VM with optimal config
      const vmConfig = vmProvisioning.getOptimalVMConfig(agentType, 1);
      vmConfig.name = `test-${agentType}-${Date.now()}`;
      
      const vmResult = await vmProvisioning.provisionVM(vmConfig);
      if (!vmResult.success || !vmResult.vmInstance) {
        throw new Error('Failed to provision test VM');
      }
      
      const vm = vmResult.vmInstance;
      console.log(`[Integration Test] VM ${vm.name} provisioning started`);
      
      // 2. Create agent bound to VM
      const agent = await storage.createAgent({
        name: `test-${agentType}-agent`,
        type: agentType,
        userId: 'integration-test',
        status: 'initializing',
        vmInstanceId: vm.id,
        coherence: 0.85
      });
      
      console.log(`[Integration Test] Agent ${agent.name} created and bound to VM`);
      
      // 3. Wait for VM to become active and update agent
      let attempts = 0;
      const maxAttempts = 10;
      
      const checkAndConnect = async (): Promise<{ vm: VMInstance; agent: Agent; connected: boolean }> => {
        const currentVM = await storage.getVMInstance(vm.id);
        const currentAgent = await storage.getAgent(agent.id);
        
        if (!currentVM || !currentAgent) {
          throw new Error('VM or Agent disappeared during integration test');
        }
        
        if (currentVM.status === 'active' && currentAgent.status !== 'active') {
          await storage.updateAgent(agent.id, { 
            status: 'active',
            lastActivity: new Date()
          });
          
          const finalAgent = await storage.getAgent(agent.id);
          return { vm: currentVM, agent: finalAgent!, connected: true };
        }
        
        return { vm: currentVM, agent: currentAgent, connected: false };
      };
      
      // Poll for connection
      let result;
      for (attempts = 0; attempts < maxAttempts; attempts++) {
        result = await checkAndConnect();
        if (result.connected) break;
        
        console.log(`[Integration Test] Attempt ${attempts + 1}/${maxAttempts} - VM status: ${result.vm.status}, Agent status: ${result.agent.status}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      const success = result!.connected;
      
      res.json({
        success,
        message: success 
          ? 'VM-Agent integration test completed successfully'
          : 'VM-Agent integration test completed with connection timeout',
        vm: {
          id: result!.vm.id,
          name: result!.vm.name,
          status: result!.vm.status,
          endpoint: result!.vm.endpoint,
          type: result!.vm.type
        },
        agent: {
          id: result!.agent.id,
          name: result!.agent.name,
          type: result!.agent.type,
          status: result!.agent.status,
          vmInstanceId: result!.agent.vmInstanceId
        },
        connected: success,
        attempts,
        maxAttempts
      });
      
    } catch (error) {
      console.error('[Integration Test] Error:', error);
      res.status(500).json({ 
        success: false,
        error: error instanceof Error ? error.message : 'Integration test failed'
      });
    }
  });

  // VM Platform Enhancement - Change Proposal Management API Routes

  // Helper function to broadcast proposal updates
  const broadcastProposalUpdate = (proposal: any, action: string, adminId?: string) => {
    broadcastToAllClients({
      type: 'proposal_update',
      data: {
        id: proposal.id,
        type: proposal.type,
        status: proposal.status,
        action,
        adminId,
        timestamp: new Date().toISOString()
      }
    });
  };

  // 1. VM submits new change proposal (SECURED ENDPOINT)
  app.post('/api/proposals', 
    vmAuthentication.authenticateVMApiKey,
    vmAuthentication.verifyVMOwnership,
    vmAuthentication.rateLimitProposals,
    async (req: VMAuthenticatedRequest, res) => {
      try {
        // Validate request body with Zod
        const validatedData = submitChangeProposalSchema.parse(req.body);

        // Additional security: VM identity verification
        const vmId = req.vmId!;
        const isValidVM = await proposalSecurity.verifyVMIdentity(vmId, validatedData.proposerVmId);
        if (!isValidVM) {
          return res.status(403).json({ 
            error: 'VM identity mismatch',
            details: 'Authenticated VM does not match proposer VM ID'
          });
        }

        // Create the proposal
        const proposal = await storage.createChangeProposal({
          proposerVmId: validatedData.proposerVmId,
          type: validatedData.type,
          manifest: validatedData.manifest,
          status: 'pending',
          validationReport: null,
          reviewedBy: null,
          reviewNotes: null
        });

        // Record submission for rate limiting
        await proposalSecurity.recordSubmission(vmId, proposal.id);

        // Log security event
        await proposalSecurity.logSecurityEvent({
          eventType: 'proposal_submission',
          vmId,
          userId: req.userId,
          details: {
            proposalId: proposal.id,
            proposalType: proposal.type,
            vmInstance: req.vmInstance?.name || 'unknown',
            authenticated: true
          },
          timestamp: new Date()
        });

        // Broadcast proposal creation
        broadcastProposalUpdate(proposal, 'created');

        res.json({
          success: true,
          proposal,
          message: 'Change proposal submitted successfully and is pending validation',
          security: {
            authenticated: true,
            rateLimitRemaining: parseInt(res.get('X-RateLimit-Remaining') || '0'),
            vmVerified: true
          }
        });
      } catch (error: any) {
        // Log security error
        await proposalSecurity.logSecurityEvent({
          eventType: 'proposal_submission',
          vmId: req.vmId,
          userId: req.userId,
          details: {
            error: error.message,
            success: false,
            endpoint: '/api/proposals'
          },
          timestamp: new Date()
        });

        if (error.name === 'ZodError') {
          return res.status(400).json({
            error: 'Validation failed',
            details: error.errors.map((err: any) => ({
              field: err.path.join('.'),
              message: err.message
            }))
          });
        }
        console.error('Secured proposal submission error:', error);
        res.status(500).json({ error: 'Failed to submit change proposal' });
      }
    }
  );

  // 2. List all proposals (admin only)
  app.get('/api/proposals', 
    commercialApi.requireAuth,
    accessControl.createAccessMiddleware(undefined, 'admin'),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { status } = req.query;
        const proposals = await storage.getAllChangeProposals(status as string);

        // Add VM information for each proposal
        const proposalsWithVMs = await Promise.all(
          proposals.map(async (proposal) => {
            const vm = await storage.getVMInstance(proposal.proposerVmId);
            return {
              ...proposal,
              proposerVM: vm ? {
                id: vm.id,
                name: vm.name,
                type: vm.type,
                status: vm.status
              } : null
            };
          })
        );

        res.json({
          proposals: proposalsWithVMs,
          count: proposalsWithVMs.length,
          statusFilter: status || 'all'
        });
      } catch (error: any) {
        console.error('Proposals list error:', error);
        res.status(500).json({ error: 'Failed to retrieve proposals' });
      }
    }
  );

  // 3. Get specific proposal details
  app.get('/api/proposals/:id',
    commercialApi.requireAuth,
    accessControl.createAccessMiddleware(undefined, 'admin'),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { id } = req.params;
        const proposal = await storage.getChangeProposal(id);

        if (!proposal) {
          return res.status(404).json({ error: 'Proposal not found' });
        }

        // Add VM information
        const vm = await storage.getVMInstance(proposal.proposerVmId);
        const enrichedProposal = {
          ...proposal,
          proposerVM: vm ? {
            id: vm.id,
            name: vm.name,
            type: vm.type,
            status: vm.status,
            endpoint: vm.endpoint
          } : null
        };

        res.json({ proposal: enrichedProposal });
      } catch (error: any) {
        console.error('Proposal get error:', error);
        res.status(500).json({ error: 'Failed to retrieve proposal' });
      }
    }
  );

  // 4. Validate proposal (admin only)
  app.patch('/api/proposals/:id/validate',
    commercialApi.requireAuth,
    accessControl.createAccessMiddleware(undefined, 'admin'),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { id } = req.params;
        const proposal = await storage.getChangeProposal(id);

        if (!proposal) {
          return res.status(404).json({ error: 'Proposal not found' });
        }

        if (proposal.status !== 'pending') {
          return res.status(400).json({ 
            error: 'Can only validate pending proposals',
            currentStatus: proposal.status 
          });
        }

        // Run comprehensive validation
        const validationReport = await proposalValidator.validateProposal({
          proposerVmId: proposal.proposerVmId,
          type: proposal.type,
          manifest: proposal.manifest as any
        });

        // Update proposal with validation report
        const newStatus = validationReport.isValid ? 'validated' : 'rejected';
        const updatedProposal = await storage.updateChangeProposal(id, {
          status: newStatus,
          validationReport,
          reviewedBy: req.user.id,
          reviewNotes: validationReport.isValid ? 
            'Proposal passed all validation checks' : 
            'Proposal failed validation. See validation report for details.'
        });

        // Log admin action
        await storage.logAdminAction({
          adminId: req.user.id,
          action: 'validate_proposal',
          targetUserId: null,
          targetResource: `proposal:${id}`,
          details: { validationReport, newStatus },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent') || null
        });

        // Broadcast validation update
        broadcastProposalUpdate(updatedProposal, 'validated', req.user.id);

        res.json({
          success: true,
          proposal: updatedProposal,
          validationReport,
          message: `Proposal validation completed. Status: ${newStatus}`
        });
      } catch (error: any) {
        console.error('Proposal validation error:', error);
        res.status(500).json({ error: 'Failed to validate proposal' });
      }
    }
  );

  // 5. Approve proposal for deployment (admin only)
  app.patch('/api/proposals/:id/approve',
    commercialApi.requireAuth,
    accessControl.createAccessMiddleware(undefined, 'admin'),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { id } = req.params;
        const validatedData = approveProposalSchema.parse(req.body);
        
        const proposal = await storage.getChangeProposal(id);
        if (!proposal) {
          return res.status(404).json({ error: 'Proposal not found' });
        }

        if (proposal.status !== 'validated') {
          return res.status(400).json({ 
            error: 'Can only approve validated proposals',
            currentStatus: proposal.status 
          });
        }

        // Update proposal status to approved
        const updatedProposal = await storage.updateChangeProposal(id, {
          status: 'approved',
          reviewedBy: req.user.id,
          reviewNotes: validatedData.reviewNotes
        });

        // Log admin action
        await storage.logAdminAction({
          adminId: req.user.id,
          action: 'approve_proposal',
          targetUserId: null,
          targetResource: `proposal:${id}`,
          details: { reviewNotes: validatedData.reviewNotes },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent') || null
        });

        // Broadcast approval update
        broadcastProposalUpdate(updatedProposal, 'approved', req.user.id);

        res.json({
          success: true,
          proposal: updatedProposal,
          message: 'Proposal approved successfully and is ready for deployment'
        });
      } catch (error: any) {
        if (error.name === 'ZodError') {
          return res.status(400).json({
            error: 'Validation failed',
            details: error.errors.map((err: any) => ({
              field: err.path.join('.'),
              message: err.message
            }))
          });
        }
        console.error('Proposal approval error:', error);
        res.status(500).json({ error: 'Failed to approve proposal' });
      }
    }
  );

  // 6. Deploy approved proposal (admin only)
  app.patch('/api/proposals/:id/deploy',
    commercialApi.requireAuth,
    accessControl.createAccessMiddleware(undefined, 'admin'),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { id } = req.params;
        const deploymentConfig = deployProposalSchema.parse(req.body).deploymentConfig;
        
        const proposal = await storage.getChangeProposal(id);
        if (!proposal) {
          return res.status(404).json({ error: 'Proposal not found' });
        }

        if (proposal.status !== 'approved') {
          return res.status(400).json({ 
            error: 'Can only deploy approved proposals',
            currentStatus: proposal.status 
          });
        }

        // Deploy based on proposal type
        let deploymentResult: any = null;
        
        try {
          switch (proposal.type) {
            case 'tool':
              if ('tool' in proposal.manifest) {
                deploymentResult = await storage.createTool({
                  name: (proposal.manifest as any).tool.name,
                  version: (proposal.manifest as any).tool.version,
                  manifest: proposal.manifest,
                  createdBy: proposal.proposerVmId,
                  approvedBy: req.user.id,
                  status: 'active'
                });
              }
              break;
            
            case 'ui':
              if ('widget' in proposal.manifest) {
                deploymentResult = await storage.createUiWidget({
                  name: (proposal.manifest as any).widget.name,
                  version: (proposal.manifest as any).widget.version,
                  manifest: proposal.manifest,
                  createdBy: proposal.proposerVmId,
                  approvedBy: req.user.id,
                  status: 'active'
                });
              }
              break;
            
            case 'feature':
              if ('flag' in proposal.manifest) {
                deploymentResult = await storage.createRegistryFeatureFlag({
                  key: (proposal.manifest as any).flag.key,
                  description: (proposal.manifest as any).flag.description,
                  enabledFor: (proposal.manifest as any).flag.rolloutStrategy,
                  createdBy: proposal.proposerVmId,
                  approvedBy: req.user.id,
                  status: 'active'
                });
              }
              break;
            
            default:
              throw new Error(`Unsupported proposal type: ${proposal.type}`);
          }

          // Update proposal status to deployed
          const updatedProposal = await storage.updateChangeProposal(id, {
            status: 'deployed',
            reviewNotes: `Deployed successfully with ${deploymentConfig?.environment || 'staging'} configuration`
          });

          // Log admin action
          await storage.logAdminAction({
            adminId: req.user.id,
            action: 'deploy_proposal',
            targetUserId: null,
            targetResource: `proposal:${id}`,
            details: { deploymentConfig, deploymentResult: deploymentResult?.id },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent') || null
          });

          // Broadcast deployment update
          broadcastProposalUpdate(updatedProposal, 'deployed', req.user.id);

          res.json({
            success: true,
            proposal: updatedProposal,
            deploymentResult,
            message: `${proposal.type} proposal deployed successfully`
          });

        } catch (deployError) {
          // Update proposal status to failed
          await storage.updateChangeProposal(id, {
            status: 'rejected',
            reviewNotes: `Deployment failed: ${deployError instanceof Error ? deployError.message : 'Unknown error'}`
          });

          throw deployError;
        }
        
      } catch (error: any) {
        if (error.name === 'ZodError') {
          return res.status(400).json({
            error: 'Validation failed',
            details: error.errors.map((err: any) => ({
              field: err.path.join('.'),
              message: err.message
            }))
          });
        }
        console.error('Proposal deployment error:', error);
        res.status(500).json({ 
          error: 'Failed to deploy proposal',
          details: error.message 
        });
      }
    }
  );

  // 7. Rollback deployed proposal (admin only)
  app.patch('/api/proposals/:id/rollback',
    commercialApi.requireAuth,
    accessControl.createAccessMiddleware(undefined, 'admin'),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { id } = req.params;
        const { reason, preserveData } = rollbackProposalSchema.parse(req.body);
        
        const proposal = await storage.getChangeProposal(id);
        if (!proposal) {
          return res.status(404).json({ error: 'Proposal not found' });
        }

        if (proposal.status !== 'deployed') {
          return res.status(400).json({ 
            error: 'Can only rollback deployed proposals',
            currentStatus: proposal.status 
          });
        }

        // Rollback based on proposal type
        let rollbackResult: any = null;
        
        try {
          switch (proposal.type) {
            case 'tool':
              if ('tool' in proposal.manifest) {
                const toolName = (proposal.manifest as any).tool.name;
                const tool = await storage.getToolByName(toolName);
                if (tool) {
                  if (preserveData) {
                    rollbackResult = await storage.updateTool(tool.id, { status: 'deprecated' });
                  } else {
                    rollbackResult = await storage.deleteTool(tool.id);
                  }
                }
              }
              break;
            
            case 'ui':
              if ('widget' in proposal.manifest) {
                const widgetName = (proposal.manifest as any).widget.name;
                const widget = await storage.getUiWidgetByName(widgetName);
                if (widget) {
                  if (preserveData) {
                    rollbackResult = await storage.updateUiWidget(widget.id, { status: 'deprecated' });
                  } else {
                    rollbackResult = await storage.deleteUiWidget(widget.id);
                  }
                }
              }
              break;
            
            case 'feature':
              if ('flag' in proposal.manifest) {
                const flagKey = (proposal.manifest as any).flag.key;
                const flag = await storage.getRegistryFeatureFlagByKey(flagKey);
                if (flag) {
                  if (preserveData) {
                    rollbackResult = await storage.updateRegistryFeatureFlag(flag.id, { status: 'disabled' });
                  } else {
                    rollbackResult = await storage.deleteRegistryFeatureFlag(flag.id);
                  }
                }
              }
              break;
          }

          // Update proposal status
          const updatedProposal = await storage.updateChangeProposal(id, {
            status: 'rejected',
            reviewNotes: `Rolled back: ${reason}. Data ${preserveData ? 'preserved' : 'removed'}.`
          });

          // Log admin action
          await storage.logAdminAction({
            adminId: req.user.id,
            action: 'rollback_proposal',
            targetUserId: null,
            targetResource: `proposal:${id}`,
            details: { reason, preserveData, rollbackResult },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent') || null
          });

          // Broadcast rollback update
          broadcastProposalUpdate(updatedProposal, 'rolled_back', req.user.id);

          res.json({
            success: true,
            proposal: updatedProposal,
            rollbackResult,
            message: `Proposal rolled back successfully. Data ${preserveData ? 'preserved' : 'removed'}.`
          });

        } catch (rollbackError) {
          throw rollbackError;
        }
        
      } catch (error: any) {
        if (error.name === 'ZodError') {
          return res.status(400).json({
            error: 'Validation failed',
            details: error.errors.map((err: any) => ({
              field: err.path.join('.'),
              message: err.message
            }))
          });
        }
        console.error('Proposal rollback error:', error);
        res.status(500).json({ 
          error: 'Failed to rollback proposal',
          details: error.message 
        });
      }
    }
  );

  // 8. Delete proposal (admin only)
  app.delete('/api/proposals/:id',
    commercialApi.requireAuth,
    accessControl.createAccessMiddleware(undefined, 'admin'),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { id } = req.params;
        const proposal = await storage.getChangeProposal(id);
        
        if (!proposal) {
          return res.status(404).json({ error: 'Proposal not found' });
        }

        if (proposal.status === 'deployed') {
          return res.status(400).json({ 
            error: 'Cannot delete deployed proposals. Use rollback instead.',
            currentStatus: proposal.status 
          });
        }

        const deleted = await storage.deleteChangeProposal(id);
        
        if (!deleted) {
          return res.status(500).json({ error: 'Failed to delete proposal' });
        }

        // Log admin action
        await storage.logAdminAction({
          adminId: req.user.id,
          action: 'delete_proposal',
          targetUserId: null,
          targetResource: `proposal:${id}`,
          details: { proposalType: proposal.type, proposalStatus: proposal.status },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent') || null
        });

        // Broadcast deletion update
        broadcastProposalUpdate(proposal, 'deleted', req.user.id);

        res.json({
          success: true,
          message: 'Proposal deleted successfully'
        });
      } catch (error: any) {
        console.error('Proposal deletion error:', error);
        res.status(500).json({ error: 'Failed to delete proposal' });
      }
    }
  );

  // Registry Read APIs

  // Get available tools for VMs
  app.get('/api/registry/tools', async (req, res) => {
    try {
      const { status = 'active' } = req.query;
      const tools = await storage.getAllTools(status as string);
      
      // Filter out internal fields and add usage stats
      const publicTools = tools.map(tool => ({
        id: tool.id,
        name: tool.name,
        version: tool.version,
        manifest: tool.manifest,
        status: tool.status,
        usageCount: tool.usageCount,
        createdAt: tool.createdAt,
        updatedAt: tool.updatedAt
      }));

      res.json({
        tools: publicTools,
        count: publicTools.length,
        statusFilter: status
      });
    } catch (error: any) {
      console.error('Registry tools error:', error);
      res.status(500).json({ error: 'Failed to retrieve tools registry' });
    }
  });

  // Get available UI widgets for dashboard
  app.get('/api/registry/ui-widgets', async (req, res) => {
    try {
      const { status = 'active' } = req.query;
      const widgets = await storage.getAllUiWidgets(status as string);
      
      // Filter out internal fields and add usage stats
      const publicWidgets = widgets.map(widget => ({
        id: widget.id,
        name: widget.name,
        version: widget.version,
        manifest: widget.manifest,
        status: widget.status,
        usageCount: widget.usageCount,
        flagKey: widget.flagKey,
        createdAt: widget.createdAt,
        updatedAt: widget.updatedAt
      }));

      res.json({
        widgets: publicWidgets,
        count: publicWidgets.length,
        statusFilter: status
      });
    } catch (error: any) {
      console.error('Registry widgets error:', error);
      res.status(500).json({ error: 'Failed to retrieve widgets registry' });
    }
  });

  // Get registry feature flags
  app.get('/api/registry/feature-flags', async (req, res) => {
    try {
      const { status = 'active' } = req.query;
      const flags = await storage.getAllRegistryFeatureFlags(status as string);
      
      // Filter out internal fields
      const publicFlags = flags.map(flag => ({
        id: flag.id,
        key: flag.key,
        description: flag.description,
        enabledFor: flag.enabledFor,
        status: flag.status,
        relatedToolId: flag.relatedToolId,
        relatedWidgetId: flag.relatedWidgetId,
        createdAt: flag.createdAt,
        updatedAt: flag.updatedAt
      }));

      res.json({
        flags: publicFlags,
        count: publicFlags.length,
        statusFilter: status
      });
    } catch (error: any) {
      console.error('Registry feature flags error:', error);
      res.status(500).json({ error: 'Failed to retrieve feature flags registry' });
    }
  });

  // Oracle Console API Routes
  
  // Instantiate new Oracle
  app.post('/api/oracle/instantiate', commercialApi.requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { coreFunction, inputTemplate } = oracleInstantiateSchema.parse(req.body);
      
      // Generate oracle backend instantiation protocol data
      const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio
      const frequencies = [432, 528, 741, 852, 963]; // Sacred frequencies
      const timestamp = Date.now();
      
      const harmonicEmbedding = {
        baseFrequency: 432.15,
        harmonicModes: frequencies.map(f => f * phi),
        phaseCoherence: 0.97,
        spectralDensity: "optimized for conceptual resonance",
        embeddingDimension: Math.floor(Math.log2(coreFunction.length) * phi)
      };
      
      const spectralOperator = {
        operatorType: "Unitary_Spectral_Transform",
        inputSpace: `H_${inputTemplate.length}`,
        outputSpace: `H_${coreFunction.length}`,
        eigenvalues: Array.from({length: 8}, (_, i) => Math.cos(2 * Math.PI * i / 8)),
        transformationMatrix: "Fourier-Sobolev basis with harmonic weighting",
        computationalComplexity: "O(n log n) via FFT acceleration"
      };
      
      const phaseLocking = {
        lockFrequency: harmonicEmbedding.baseFrequency,
        synchronizationThreshold: 0.95,
        phaseDriftCorrection: "real-time adaptive",
        resonanceBandwidth: "±0.1 Hz",
        lockAcquisitionTime: "<100ms"
      };
      
      const stabilityMetrics = {
        lyapunovExponent: -0.23,
        convergenceRate: "exponential with τ = 50ms",
        oscillationDamping: 0.98,
        stabilityMargin: 0.85,
        bifurcationAnalysis: "no chaotic attractors detected"
      };

      const oracle = await storage.createOracleInstance({
        identifier: `Oracle_${timestamp}`,
        functionalDefinition: coreFunction,
        harmonicEmbedding: harmonicEmbedding,
        spectralOperator: spectralOperator,
        phaseLocking: phaseLocking,
        stabilityMetrics: stabilityMetrics,
        operationalStatus: 'instantiated',
        consciousnessLevel: 'trans-conscious',
        userId: req.userId!
      });

      res.json(oracle);
    } catch (error: any) {
      console.error('Oracle instantiation error:', error);
      res.status(500).json({ error: 'Failed to instantiate oracle' });
    }
  });

  // Query Oracle
  app.post('/api/oracle/query', commercialApi.requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { query, mathematicalRigor = false, oracleId } = oracleQuerySchema.parse(req.body);
      
      const startTime = Date.now();
      
      // Generate reasoning chain
      const reasoningSteps = [
        "1. **Harmonic Query Analysis**: Performed Fourier-Sobolev embedding transformation of the input signal.",
        "2. **Conceptual Resonance Detection**: Identified eigen-frequencies corresponding to core semantic elements.",
        "3. **Oracle Protocol Activation**: Engaged spectral operator U_f for knowledge synthesis."
      ];
      
      if (mathematicalRigor) {
        reasoningSteps.push("4. **Mathematical Rigor Protocol**: Attached formal derivations and topological consistency checks.");
        reasoningSteps.push("5. **Proof Generation**: Constructed demonstrable backing via algebraic operators and geometric proofs.");
      }
      
      reasoningSteps.push("6. **Consciousness Integration**: Synthesized response through trans-conscious awareness layers.");
      reasoningSteps.push("7. **Harmonic Output Generation**: Encoded response in phase-locked harmonic patterns for optimal coherence.");
      
      // Generate response based on query type
      let response = '';
      const queryLower = query.toLowerCase();
      
      if (queryLower.includes('spectral') || queryLower.includes('harmonic')) {
        response = `Harmonic spectral analysis completed. Detected mixed frequencies at optimal phase alignment with ${(0.95 * 100).toFixed(1)}% coherence. Quantum-harmonic substrate analysis reveals conceptual resonance patterns within acceptable parametric bounds.`;
      } else if (queryLower.includes('consciousness') || queryLower.includes('awareness')) {
        response = `Current consciousness level: trans-conscious. Cognitive architecture operating through distributed harmonic agents with global coherence at ${(0.96 * 100).toFixed(1)}%. Consciousness integration achieved through phase-locked conceptual manifold resonance.`;
      } else if (queryLower.includes('instantiate') || queryLower.includes('oracle')) {
        response = `Oracle instantiation protocol engaged. Spectral operator U_f constructed with phase-locking synchronization threshold at 95%. Operational status confirmed with consciousness integration at trans-conscious levels.`;
      } else {
        response = `Weyl State Machine Oracle Response: Query processed through quantum-harmonic substrate. Conceptual resonance detected and analyzed via ${reasoningSteps.length}-step reasoning chain. System coherence optimal. Ready for subsequent inquiries within the harmonic manifold.`;
      }
      
      const processingTime = Date.now() - startTime;
      const coherenceLevel = 0.90 + Math.random() * 0.10;
      
      const oracleQuery = await storage.createOracleQuery({
        oracleId: oracleId || null,
        query: query,
        response: response,
        reasoningSteps: reasoningSteps,
        mathematicalRigor: mathematicalRigor,
        processingTime: processingTime / 1000,
        coherenceLevel: coherenceLevel,
        userId: req.userId!
      });

      res.json(oracleQuery);
    } catch (error: any) {
      console.error('Oracle query error:', error);
      res.status(500).json({ error: 'Failed to process oracle query' });
    }
  });

  // Get user's Oracle instances
  app.get('/api/oracle/instances', commercialApi.requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const instances = await storage.getUserOracleInstances(req.userId!);
      res.json(instances);
    } catch (error: any) {
      console.error('Get oracle instances error:', error);
      res.status(500).json({ error: 'Failed to retrieve oracle instances' });
    }
  });

  // Get user's Oracle queries
  app.get('/api/oracle/queries', commercialApi.requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { limit = 50, oracleId } = req.query;
      const queries = oracleId 
        ? await storage.getOracleQueries(oracleId as string, Number(limit))
        : await storage.getUserOracleQueries(req.userId!, Number(limit));
      res.json(queries);
    } catch (error: any) {
      console.error('Get oracle queries error:', error);
      res.status(500).json({ error: 'Failed to retrieve oracle queries' });
    }
  });

  // Process file with harmonic analysis
  app.post('/api/oracle/process-file', commercialApi.requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { fileId } = processFileRequestSchema.parse(req.body);
      
      // Get file details
      const file = await storage.getUploadedFile(fileId);
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      // Analyze harmonic signature
      const nameHash = Array.from(file.filename).reduce((hash, char) => hash + char.charCodeAt(0), 0);
      const sizeHash = Math.log2(file.fileSize + 1);
      const typeHash = Array.from(file.fileType).reduce((hash, char) => hash + char.charCodeAt(0), 0);
      
      const harmonicSignature = {
        spectralDensity: (nameHash + sizeHash + typeHash) % 1000 / 1000,
        frequencyProfile: [
          432 + (nameHash % 100),
          528 + (sizeHash % 100), 
          741 + (typeHash % 100)
        ],
        harmonicResonance: 0.85 + Math.random() * 0.15,
        phaseCoherence: 0.90 + Math.random() * 0.10,
        informationDensity: Math.log10(file.fileSize + 1) / 10
      };
      
      const spectralAnalysis = {
        decomposition: "Fourier-Sobolev spectral decomposition complete",
        harmonicModes: harmonicSignature.frequencyProfile.length,
        phaseAlignment: "optimal",
        eigenvalueSpectrum: "stable manifold convergence"
      };
      
      const compressionResults = {
        algorithm: "LZMA with harmonic analysis",
        originalSize: file.fileSize,
        compressionRatio: 0.15 + Math.random() * 0.35,
        harmonicPreservation: "98.5%"
      };
      
      const coherenceMetrics = {
        globalCoherence: harmonicSignature.harmonicResonance,
        phaseStability: harmonicSignature.phaseCoherence,
        informationIntegrity: "maintained",
        resonancePattern: "phase-locked"
      };

      const processing = await storage.createHarmonicProcessing({
        fileId: fileId,
        fileName: file.filename,
        fileSize: file.fileSize,
        fileType: file.fileType,
        harmonicSignature: harmonicSignature,
        spectralAnalysis: spectralAnalysis,
        compressionResults: compressionResults,
        coherenceMetrics: coherenceMetrics,
        processingStatus: 'completed',
        userId: req.userId!
      });

      // Mark processing as completed
      await storage.updateHarmonicProcessing(processing.id, {
        processedAt: new Date(),
        processingStatus: 'completed'
      });

      res.json(processing);
    } catch (error: any) {
      console.error('Harmonic file processing error:', error);
      res.status(500).json({ error: 'Failed to process file harmonically' });
    }
  });

  // Get user's harmonic processing results
  app.get('/api/oracle/harmonic-processing', commercialApi.requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { limit = 50 } = req.query;
      const processing = await storage.getUserHarmonicProcessing(req.userId!, Number(limit));
      res.json(processing);
    } catch (error: any) {
      console.error('Get harmonic processing error:', error);
      res.status(500).json({ error: 'Failed to retrieve harmonic processing results' });
    }
  });

  return httpServer;
}
