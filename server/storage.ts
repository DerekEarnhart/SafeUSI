import { 
  type User, 
  type InsertUser, 
  type WSMState, 
  type InsertWSMState,
  type FileProcessingJob,
  type InsertFileProcessingJob,
  type SystemComponent,
  type InsertSystemComponent,
  type RSISCycle,
  type InsertRSISCycle,
  type Subscription,
  type InsertSubscription,
  type ApiKey,
  type InsertApiKey,
  type ApiUsage,
  type InsertApiUsage,
  type VMInstance,
  type InsertVMInstance,
  type Agent,
  type InsertAgent,
  type AgentTask,
  type InsertAgentTask,
  type Workflow,
  type InsertWorkflow,
  type AgentCommunication,
  type InsertAgentCommunication,
  type AgentTool,
  type InsertAgentTool,
  type CreatorTool,
  type InsertCreatorTool,
  type ToolUsage,
  type InsertToolUsage,
  type ToolPreset,
  type InsertToolPreset,
  type VMBenchmark,
  type InsertVMBenchmark,
  type EvaluationResult,
  type InsertEvaluationResult,
  type ComputationalCanvasState,
  type InsertComputationalCanvasState,
  type SafetyViolation,
  type InsertSafetyViolation,
  type WaitingListApplication,
  type InsertWaitingListApplication,
  type FeatureFlag,
  type InsertFeatureFlag,
  type AccessLevelPermission,
  type InsertAccessLevelPermission,
  type InvitationCode,
  type InsertInvitationCode,
  type AdminActionLog,
  type InsertAdminActionLog,
  type ChangeProposal,
  type InsertChangeProposal,
  type Tool,
  type InsertTool,
  type UiWidget,
  type InsertUiWidget,
  type RegistryFeatureFlag,
  type InsertRegistryFeatureFlag,
  type UploadedFile,
  type InsertUploadedFile,
  type OracleInstance,
  type InsertOracleInstance,
  type OracleQuery,
  type InsertOracleQuery,
  type HarmonicProcessing,
  type InsertHarmonicProcessing,
  type KnowledgePack,
  type InsertKnowledgePack,
  type KnowledgeEmbedding,
  type InsertKnowledgeEmbedding,
  type KnowledgeCitation,
  type InsertKnowledgeCitation,
  type JobApplication,
  type InsertJobApplication,
  type LearningMetric,
  type InsertLearningMetric,
  type HkmQuery,
  type InsertHkmQuery
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  
  // WSM State methods
  createWSMState(state: InsertWSMState): Promise<WSMState>;
  getLatestWSMState(): Promise<WSMState | undefined>;
  getWSMStatesHistory(limit?: number): Promise<WSMState[]>;
  
  // File Processing methods
  createFileProcessingJob(job: InsertFileProcessingJob): Promise<FileProcessingJob>;
  updateFileProcessingJob(id: string, updates: Partial<FileProcessingJob>): Promise<FileProcessingJob | undefined>;
  getFileProcessingJobs(limit?: number): Promise<FileProcessingJob[]>;
  getProcessingStats(): Promise<{
    filesProcessed: number;
    successRate: number;
    avgProcessingTime: number;
  }>;

  // Uploaded Files methods (Simple RAG system)
  createUploadedFile(file: InsertUploadedFile): Promise<UploadedFile>;
  getUploadedFile(id: string): Promise<UploadedFile | undefined>;
  getUserUploadedFiles(userId: string): Promise<UploadedFile[]>;
  updateUploadedFile(id: string, updates: Partial<UploadedFile>): Promise<UploadedFile | undefined>;
  deleteUploadedFile(id: string): Promise<boolean>;
  searchUploadedFiles(query: string, userId?: string): Promise<UploadedFile[]>;
  
  // System Components methods
  createSystemComponent(component: InsertSystemComponent): Promise<SystemComponent>;
  updateSystemComponent(name: string, updates: Partial<SystemComponent>): Promise<SystemComponent | undefined>;
  getAllSystemComponents(): Promise<SystemComponent[]>;
  
  // RSIS methods
  createRSISCycle(cycle: InsertRSISCycle): Promise<RSISCycle>;
  getLatestRSISCycle(): Promise<RSISCycle | undefined>;
  getRSISHistory(limit?: number): Promise<RSISCycle[]>;
  
  // Commercial API methods
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscriptionByUserId(userId: string): Promise<Subscription | undefined>;
  updateSubscriptionUsage(userId: string, increment: number): Promise<void>;
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  getApiKeyByHash(keyHash: string): Promise<ApiKey | undefined>;
  updateApiKeyLastUsed(keyId: string): Promise<void>;
  createApiUsage(usage: InsertApiUsage): Promise<ApiUsage>;
  getUserApiUsage(userId: string, days?: number): Promise<ApiUsage[]>;
  
  // Agent Management methods
  
  // VM Instance operations
  createVMInstance(instance: InsertVMInstance): Promise<VMInstance>;
  getVMInstance(id: string): Promise<VMInstance | undefined>;
  getAllVMInstances(): Promise<VMInstance[]>;
  getVMInstancesByUserId(userId: string): Promise<VMInstance[]>;
  updateVMInstance(id: string, updates: Partial<VMInstance>): Promise<VMInstance | undefined>;
  deleteVMInstance(id: string): Promise<boolean>;
  
  // Agent operations
  createAgent(agent: InsertAgent): Promise<Agent>;
  getAgent(id: string): Promise<Agent | undefined>;
  getUserAgents(userId: string): Promise<Agent[]>;
  getAllAgents(): Promise<Agent[]>;
  updateAgent(id: string, updates: Partial<Agent>): Promise<Agent | undefined>;
  deleteAgent(id: string): Promise<boolean>;
  
  // Agent Task operations
  createAgentTask(task: InsertAgentTask): Promise<AgentTask>;
  getAgentTask(id: string): Promise<AgentTask | undefined>;
  getAgentTasks(agentId?: string, userId?: string, status?: string): Promise<AgentTask[]>;
  updateAgentTask(id: string, updates: Partial<AgentTask>): Promise<AgentTask | undefined>;
  getTaskQueue(): Promise<{
    queuedTasks: number;
    runningTasks: number;
    completedTasks: number;
    failedTasks: number;
    avgTaskTime: number;
  }>;
  
  // Workflow operations
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  getWorkflow(id: string): Promise<Workflow | undefined>;
  getUserWorkflows(userId: string): Promise<Workflow[]>;
  updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow | undefined>;
  deleteWorkflow(id: string): Promise<boolean>;
  
  // Agent Communication operations
  createAgentCommunication(communication: InsertAgentCommunication): Promise<AgentCommunication>;
  getAgentCommunications(agentId?: string, workflowId?: string): Promise<AgentCommunication[]>;
  
  // Agent Tools operations
  createAgentTool(tool: InsertAgentTool): Promise<AgentTool>;
  getAgentTool(id: string): Promise<AgentTool | undefined>;
  getAllAgentTools(): Promise<AgentTool[]>;
  updateAgentTool(id: string, updates: Partial<AgentTool>): Promise<AgentTool | undefined>;
  deleteAgentTool(id: string): Promise<boolean>;
  
  // Creator Tools operations
  createCreatorTool(tool: InsertCreatorTool): Promise<CreatorTool>;
  getCreatorTool(id: string): Promise<CreatorTool | undefined>;
  getCreatorToolByName(name: string): Promise<CreatorTool | undefined>;
  getAllCreatorTools(): Promise<CreatorTool[]>;
  updateCreatorTool(id: string, updates: Partial<CreatorTool>): Promise<CreatorTool | undefined>;
  deleteCreatorTool(id: string): Promise<boolean>;
  
  // Tool Usage operations
  logToolUsage(usage: InsertToolUsage): Promise<ToolUsage>;
  getUserToolUsage(userId: string, days?: number): Promise<ToolUsage[]>;
  
  // Tool Presets operations
  createToolPreset(preset: InsertToolPreset): Promise<ToolPreset>;
  getToolPresets(toolName?: string): Promise<ToolPreset[]>;
  updateToolPreset(id: string, updates: Partial<ToolPreset>): Promise<ToolPreset | undefined>;
  deleteToolPreset(id: string): Promise<boolean>;
  
  // VM Benchmarking operations
  createVMBenchmark(benchmark: InsertVMBenchmark): Promise<VMBenchmark>;
  getVMBenchmark(id: string): Promise<VMBenchmark | undefined>;
  getVMBenchmarks(vmInstanceId?: string, status?: string): Promise<VMBenchmark[]>;
  updateVMBenchmark(id: string, updates: Partial<VMBenchmark>): Promise<VMBenchmark | undefined>;
  deleteVMBenchmark(id: string): Promise<boolean>;
  
  // Evaluation Results operations
  createEvaluationResult(result: InsertEvaluationResult): Promise<EvaluationResult>;
  getEvaluationResults(benchmarkId: string): Promise<EvaluationResult[]>;
  getAllEvaluationResults(limit?: number): Promise<EvaluationResult[]>;
  
  // Computational Canvas State operations
  createComputationalCanvasState(state: InsertComputationalCanvasState): Promise<ComputationalCanvasState>;
  getComputationalCanvasStates(benchmarkId: string): Promise<ComputationalCanvasState[]>;
  getLatestComputationalCanvasState(benchmarkId: string): Promise<ComputationalCanvasState | undefined>;
  
  // Safety Violation operations
  createSafetyViolation(violation: InsertSafetyViolation): Promise<SafetyViolation>;
  getSafetyViolations(benchmarkId?: string): Promise<SafetyViolation[]>;
  getCriticalSafetyViolations(): Promise<SafetyViolation[]>;
  
  // Waiting List Management operations
  createWaitingListApplication(application: InsertWaitingListApplication): Promise<WaitingListApplication>;
  getWaitingListApplication(id: string): Promise<WaitingListApplication | undefined>;
  getWaitingListApplicationByUserId(userId: string): Promise<WaitingListApplication | undefined>;
  getAllWaitingListApplications(status?: string): Promise<WaitingListApplication[]>;
  updateWaitingListApplication(id: string, updates: Partial<WaitingListApplication>): Promise<WaitingListApplication | undefined>;
  getWaitingListStats(): Promise<{
    totalApplications: number;
    pendingApplications: number;
    approvedToday: number;
    averageWaitTime: number;
  }>;
  
  // Feature Flag operations
  createFeatureFlag(flag: InsertFeatureFlag): Promise<FeatureFlag>;
  getFeatureFlag(name: string): Promise<FeatureFlag | undefined>;
  getAllFeatureFlags(): Promise<FeatureFlag[]>;
  updateFeatureFlag(name: string, updates: Partial<FeatureFlag>): Promise<FeatureFlag | undefined>;
  deleteFeatureFlag(name: string): Promise<boolean>;
  getEnabledFeaturesForAccessLevel(accessLevel: string): Promise<string[]>;
  
  // Access Level Permission operations
  createAccessLevelPermission(permission: InsertAccessLevelPermission): Promise<AccessLevelPermission>;
  getAccessLevelPermissions(accessLevel?: string): Promise<AccessLevelPermission[]>;
  updateAccessLevelPermission(id: string, updates: Partial<AccessLevelPermission>): Promise<AccessLevelPermission | undefined>;
  deleteAccessLevelPermission(id: string): Promise<boolean>;
  checkUserPermission(userId: string, featureName: string): Promise<boolean>;
  
  // Invitation Code operations
  createInvitationCode(code: InsertInvitationCode): Promise<InvitationCode>;
  getInvitationCode(code: string): Promise<InvitationCode | undefined>;
  getInvitationCodesByUserId(userId: string): Promise<InvitationCode[]>;
  markInvitationCodeAsUsed(code: string): Promise<boolean>;
  getValidInvitationCode(code: string): Promise<InvitationCode | undefined>;
  
  // Admin Action Log operations
  logAdminAction(action: InsertAdminActionLog): Promise<AdminActionLog>;
  getAdminActionLogs(adminId?: string, limit?: number): Promise<AdminActionLog[]>;
  
  // Extended User operations
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  approveUser(userId: string, adminId: string, accessLevel: string): Promise<boolean>;
  denyUser(userId: string, adminId: string, reason: string): Promise<boolean>;
  
  // Benchmarking Statistics
  getBenchmarkingStats(): Promise<{
    activeBenchmarks: number;
    completedBenchmarks: number;
    failedBenchmarks: number;
    avgBenchmarkTime: number;
  }>;
  
  // VM Platform Enhancement - Change Proposal System operations
  
  // Change Proposal operations
  createChangeProposal(proposal: InsertChangeProposal): Promise<ChangeProposal>;
  getChangeProposal(id: string): Promise<ChangeProposal | undefined>;
  getAllChangeProposals(status?: string): Promise<ChangeProposal[]>;
  updateChangeProposal(id: string, updates: Partial<ChangeProposal>): Promise<ChangeProposal | undefined>;
  deleteChangeProposal(id: string): Promise<boolean>;
  
  // Tools registry operations
  createTool(tool: InsertTool): Promise<Tool>;
  getTool(id: string): Promise<Tool | undefined>;
  getToolByName(name: string): Promise<Tool | undefined>;
  getAllTools(status?: string): Promise<Tool[]>;
  updateTool(id: string, updates: Partial<Tool>): Promise<Tool | undefined>;
  deleteTool(id: string): Promise<boolean>;
  incrementToolUsage(id: string): Promise<void>;
  
  // UI Widget operations
  createUiWidget(widget: InsertUiWidget): Promise<UiWidget>;
  getUiWidget(id: string): Promise<UiWidget | undefined>;
  getUiWidgetByName(name: string): Promise<UiWidget | undefined>;
  getAllUiWidgets(status?: string): Promise<UiWidget[]>;
  updateUiWidget(id: string, updates: Partial<UiWidget>): Promise<UiWidget | undefined>;
  deleteUiWidget(id: string): Promise<boolean>;
  incrementUiWidgetUsage(id: string): Promise<void>;
  
  // Registry Feature Flag operations
  createRegistryFeatureFlag(flag: InsertRegistryFeatureFlag): Promise<RegistryFeatureFlag>;
  getRegistryFeatureFlag(id: string): Promise<RegistryFeatureFlag | undefined>;
  getRegistryFeatureFlagByKey(key: string): Promise<RegistryFeatureFlag | undefined>;
  getAllRegistryFeatureFlags(status?: string): Promise<RegistryFeatureFlag[]>;
  updateRegistryFeatureFlag(id: string, updates: Partial<RegistryFeatureFlag>): Promise<RegistryFeatureFlag | undefined>;
  deleteRegistryFeatureFlag(id: string): Promise<boolean>;
  isRegistryFeatureEnabled(key: string, userId?: string, accessLevel?: string): Promise<boolean>;
  
  // Oracle Console operations
  createOracleInstance(oracle: InsertOracleInstance): Promise<OracleInstance>;
  getOracleInstance(id: string): Promise<OracleInstance | undefined>;
  getUserOracleInstances(userId: string): Promise<OracleInstance[]>;
  getAllOracleInstances(): Promise<OracleInstance[]>;
  updateOracleInstance(id: string, updates: Partial<OracleInstance>): Promise<OracleInstance | undefined>;
  deleteOracleInstance(id: string): Promise<boolean>;
  
  // Oracle Query operations
  createOracleQuery(query: InsertOracleQuery): Promise<OracleQuery>;
  getOracleQuery(id: string): Promise<OracleQuery | undefined>;
  getUserOracleQueries(userId: string, limit?: number): Promise<OracleQuery[]>;
  getOracleQueries(oracleId?: string, limit?: number): Promise<OracleQuery[]>;
  
  // Harmonic Processing operations
  createHarmonicProcessing(processing: InsertHarmonicProcessing): Promise<HarmonicProcessing>;
  getHarmonicProcessing(id: string): Promise<HarmonicProcessing | undefined>;
  getFileHarmonicProcessing(fileId: string): Promise<HarmonicProcessing[]>;
  getUserHarmonicProcessing(userId: string, limit?: number): Promise<HarmonicProcessing[]>;
  updateHarmonicProcessing(id: string, updates: Partial<HarmonicProcessing>): Promise<HarmonicProcessing | undefined>;
  
  // HKM Knowledge Pack operations
  createKnowledgePack(pack: InsertKnowledgePack): Promise<KnowledgePack>;
  getKnowledgePack(id: string): Promise<KnowledgePack | undefined>;
  getUserKnowledgePacks(userId: string, limit?: number): Promise<KnowledgePack[]>;
  getKnowledgePacksByCategory(category: string, limit?: number): Promise<KnowledgePack[]>;
  updateKnowledgePack(id: string, updates: Partial<KnowledgePack>): Promise<KnowledgePack | undefined>;
  deleteKnowledgePack(id: string): Promise<boolean>;
  
  // HKM Knowledge Embedding operations
  createKnowledgeEmbedding(embedding: InsertKnowledgeEmbedding): Promise<KnowledgeEmbedding>;
  getKnowledgeEmbedding(id: string): Promise<KnowledgeEmbedding | undefined>;
  getPackEmbeddings(packId: string, limit?: number): Promise<KnowledgeEmbedding[]>;
  searchEmbeddingsByContent(packId: string, content: string, limit?: number): Promise<KnowledgeEmbedding[]>;
  getEmbeddingsBySpectralRank(packId: string, minRank: number, limit?: number): Promise<KnowledgeEmbedding[]>;
  updateKnowledgeEmbedding(id: string, updates: Partial<KnowledgeEmbedding>): Promise<KnowledgeEmbedding | undefined>;
  
  // HKM Knowledge Citation operations
  createKnowledgeCitation(citation: InsertKnowledgeCitation): Promise<KnowledgeCitation>;
  getKnowledgeCitation(id: string): Promise<KnowledgeCitation | undefined>;
  getEmbeddingCitations(embeddingId: string): Promise<KnowledgeCitation[]>;
  getCitationsBySource(sourceTitle: string, limit?: number): Promise<KnowledgeCitation[]>;
  
  // HKM Learning Metric operations
  createLearningMetric(metric: InsertLearningMetric): Promise<LearningMetric>;
  getPackLearningMetrics(packId: string, metricType?: string, limit?: number): Promise<LearningMetric[]>;
  getLatestLearningMetric(packId: string, metricType: string): Promise<LearningMetric | undefined>;
  
  // HKM Query operations
  createHkmQuery(query: InsertHkmQuery): Promise<HkmQuery>;
  getHkmQuery(id: string): Promise<HkmQuery | undefined>;
  getUserHkmQueries(userId: string, limit?: number): Promise<HkmQuery[]>;
  getHkmQueriesByType(queryType: string, limit?: number): Promise<HkmQuery[]>;

  // Job Application methods
  createJobApplication(application: InsertJobApplication): Promise<JobApplication>;
  getJobApplication(id: string): Promise<JobApplication | undefined>;
  getAllJobApplications(): Promise<JobApplication[]>;
  getJobApplicationsByPosition(position: string): Promise<JobApplication[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private wsmStates: Map<string, WSMState>;
  private fileProcessingJobs: Map<string, FileProcessingJob>;
  private systemComponents: Map<string, SystemComponent>;
  private rsisCycles: Map<string, RSISCycle>;
  private subscriptions: Map<string, Subscription>;
  private apiKeys: Map<string, ApiKey>;
  private apiUsages: Map<string, ApiUsage>;
  private vmInstances: Map<string, VMInstance>;
  private agents: Map<string, Agent>;
  private agentTasks: Map<string, AgentTask>;
  private workflows: Map<string, Workflow>;
  private agentCommunications: Map<string, AgentCommunication>;
  private agentTools: Map<string, AgentTool>;
  private creatorTools: Map<string, CreatorTool>;
  private toolUsages: Map<string, ToolUsage>;
  private toolPresets: Map<string, ToolPreset>;
  private vmBenchmarks: Map<string, VMBenchmark>;
  private evaluationResults: Map<string, EvaluationResult>;
  private computationalCanvasStates: Map<string, ComputationalCanvasState>;
  private safetyViolations: Map<string, SafetyViolation>;
  private waitingListApplications: Map<string, WaitingListApplication>;
  private featureFlags: Map<string, FeatureFlag>;
  private accessLevelPermissions: Map<string, AccessLevelPermission>;
  private invitationCodes: Map<string, InvitationCode>;
  private adminActionLogs: Map<string, AdminActionLog>;
  
  // VM Platform Enhancement maps
  private changeProposals: Map<string, ChangeProposal>;
  private tools: Map<string, Tool>;
  private uiWidgets: Map<string, UiWidget>;
  private registryFeatureFlags: Map<string, RegistryFeatureFlag>;
  
  // Simple file storage for RAG system
  private uploadedFiles: Map<string, UploadedFile>;
  
  // Oracle Console storage
  private oracleInstances: Map<string, OracleInstance>;
  private oracleQueries: Map<string, OracleQuery>;
  private harmonicProcessing: Map<string, HarmonicProcessing>;
  
  // HKM (Harmonic Knowledge Module) storage
  private knowledgePacks: Map<string, KnowledgePack>;
  private knowledgeEmbeddings: Map<string, KnowledgeEmbedding>;
  private knowledgeCitations: Map<string, KnowledgeCitation>;
  private learningMetrics: Map<string, LearningMetric>;
  private hkmQueries: Map<string, HkmQuery>;

  // Job Applications storage
  private jobApplications: Map<string, JobApplication>;

  constructor() {
    this.users = new Map();
    this.wsmStates = new Map();
    this.fileProcessingJobs = new Map();
    this.systemComponents = new Map();
    this.rsisCycles = new Map();
    this.subscriptions = new Map();
    this.apiKeys = new Map();
    this.apiUsages = new Map();
    this.vmInstances = new Map();
    this.agents = new Map();
    this.agentTasks = new Map();
    this.workflows = new Map();
    this.agentCommunications = new Map();
    this.agentTools = new Map();
    this.creatorTools = new Map();
    this.toolUsages = new Map();
    this.toolPresets = new Map();
    this.vmBenchmarks = new Map();
    this.evaluationResults = new Map();
    this.computationalCanvasStates = new Map();
    this.safetyViolations = new Map();
    this.waitingListApplications = new Map();
    this.featureFlags = new Map();
    this.accessLevelPermissions = new Map();
    this.invitationCodes = new Map();
    this.adminActionLogs = new Map();
    
    // Initialize VM Platform Enhancement maps
    this.changeProposals = new Map();
    this.tools = new Map();
    this.uiWidgets = new Map();
    this.registryFeatureFlags = new Map();
    
    // Initialize simple file storage for RAG system
    this.uploadedFiles = new Map();
    
    // Initialize Oracle Console storage
    this.oracleInstances = new Map();
    this.oracleQueries = new Map();
    this.harmonicProcessing = new Map();
    
    // Initialize HKM storage
    this.knowledgePacks = new Map();
    this.knowledgeEmbeddings = new Map();
    this.knowledgeCitations = new Map();
    this.learningMetrics = new Map();
    this.hkmQueries = new Map();

    // Initialize job applications storage
    this.jobApplications = new Map();
    
    // Initialize system components and default feature flags
    this.initializeSystemComponents();
    this.initializeDefaultFeatureFlags();
  }

  private async initializeDefaultFeatureFlags() {
    const defaultFlags = [
      { name: 'wsm_chat', description: 'WSM Chat Interface', category: 'core', isEnabled: true, requiredAccessLevel: 'basic' },
      { name: 'wsm_status', description: 'WSM Status Monitoring', category: 'core', isEnabled: true, requiredAccessLevel: 'basic' },
      { name: 'file_processing', description: 'File Processing and Analysis', category: 'advanced', isEnabled: true, requiredAccessLevel: 'advanced' },
      { name: 'harmonic_analysis', description: 'Harmonic Analysis Tools', category: 'advanced', isEnabled: true, requiredAccessLevel: 'advanced' },
      { name: 'vm_provisioning', description: 'VM Provisioning and Management', category: 'premium', isEnabled: true, requiredAccessLevel: 'premium' },
      { name: 'agent_orchestration', description: 'Agent Orchestration and Workflows', category: 'premium', isEnabled: true, requiredAccessLevel: 'premium' },
      { name: 'vm_benchmarking', description: 'VM Benchmarking and Testing', category: 'experimental', isEnabled: false, requiredAccessLevel: 'admin', betaFeature: true },
    ];

    for (const flag of defaultFlags) {
      if (!this.featureFlags.has(flag.name)) {
        const featureFlag: FeatureFlag = {
          id: randomUUID(),
          name: flag.name,
          description: flag.description,
          category: flag.category,
          isEnabled: flag.isEnabled,
          rolloutPercentage: flag.isEnabled ? 100 : 0,
          requiredAccessLevel: flag.requiredAccessLevel,
          betaFeature: flag.betaFeature || false,
          expiresAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.featureFlags.set(flag.name, featureFlag);
      }
    }
  }

  private async initializeSystemComponents() {
    const components = [
      { name: 'wsm_ha', status: 'ACTIVE' },
      { name: 'rag_system', status: 'READY' },
      { name: 'bio3d_bridge', status: 'READY' },
      { name: 'compressia', status: 'ACTIVE' },
      { name: 'qho_generator', status: 'READY' },
      { name: 'world_generator', status: 'READY' },
    ];
    
    for (const comp of components) {
      await this.createSystemComponent(comp);
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      username: insertUser.username,
      password: insertUser.password,
      email: insertUser.email || null,
      preferredEngine: insertUser.preferredEngine || 'wsm',
      accessLevel: insertUser.accessLevel || 'waiting',
      waitingListStatus: insertUser.waitingListStatus || 'pending',
      invitedBy: insertUser.invitedBy || null,
      settings: insertUser.settings || {},
      createdAt: new Date(),
      approvedAt: null
    };
    this.users.set(id, user);
    return user;
  }

  // WSM State methods
  async createWSMState(state: InsertWSMState): Promise<WSMState> {
    const id = randomUUID();
    const wsmState: WSMState = {
      id,
      timestamp: new Date(),
      ...state,
    };
    this.wsmStates.set(id, wsmState);
    return wsmState;
  }

  async getLatestWSMState(): Promise<WSMState | undefined> {
    const states = Array.from(this.wsmStates.values())
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
    return states[0];
  }

  async getWSMStatesHistory(limit: number = 100): Promise<WSMState[]> {
    return Array.from(this.wsmStates.values())
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(0, limit);
  }

  // File Processing methods
  async createFileProcessingJob(job: InsertFileProcessingJob): Promise<FileProcessingJob> {
    const id = randomUUID();
    const fileJob: FileProcessingJob = {
      id,
      createdAt: new Date(),
      completedAt: null,
      processingTime: job.processingTime ?? null,
      compressionRatio: job.compressionRatio ?? null,
      ...job,
    };
    this.fileProcessingJobs.set(id, fileJob);
    return fileJob;
  }

  async updateFileProcessingJob(id: string, updates: Partial<FileProcessingJob>): Promise<FileProcessingJob | undefined> {
    const existing = this.fileProcessingJobs.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    if (updates.status === 'completed' || updates.status === 'failed') {
      updated.completedAt = new Date();
    }
    
    this.fileProcessingJobs.set(id, updated);
    return updated;
  }

  async getFileProcessingJobs(limit: number = 100): Promise<FileProcessingJob[]> {
    return Array.from(this.fileProcessingJobs.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
  }

  async getProcessingStats(): Promise<{
    filesProcessed: number;
    successRate: number;
    avgProcessingTime: number;
  }> {
    const jobs = Array.from(this.fileProcessingJobs.values());
    const completedJobs = jobs.filter(job => job.status === 'completed' || job.status === 'failed');
    const successfulJobs = jobs.filter(job => job.status === 'completed');
    
    const avgProcessingTime = completedJobs.length > 0 
      ? completedJobs.reduce((sum, job) => sum + (job.processingTime || 0), 0) / completedJobs.length
      : 0;
    
    return {
      filesProcessed: completedJobs.length,
      successRate: completedJobs.length > 0 ? (successfulJobs.length / completedJobs.length) * 100 : 100,
      avgProcessingTime: avgProcessingTime * 1000, // Convert to ms
    };
  }

  // Uploaded Files methods (Simple RAG system)
  async createUploadedFile(file: InsertUploadedFile): Promise<UploadedFile> {
    const id = randomUUID();
    const uploadedFile: UploadedFile = {
      id,
      filename: file.filename,
      originalName: file.originalName,
      fileType: file.fileType,
      fileSize: file.fileSize,
      filePath: file.filePath,
      status: file.status || 'uploaded',
      extractedText: file.extractedText || null,
      userId: file.userId || null,
      createdAt: new Date(),
      processedAt: file.extractedText ? new Date() : null,
    };
    this.uploadedFiles.set(id, uploadedFile);
    return uploadedFile;
  }

  async getUploadedFile(id: string): Promise<UploadedFile | undefined> {
    return this.uploadedFiles.get(id);
  }

  async getUserUploadedFiles(userId: string): Promise<UploadedFile[]> {
    return Array.from(this.uploadedFiles.values())
      .filter(file => file.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async updateUploadedFile(id: string, updates: Partial<UploadedFile>): Promise<UploadedFile | undefined> {
    const existing = this.uploadedFiles.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    if (updates.extractedText && !existing.extractedText) {
      updated.processedAt = new Date();
      updated.status = 'processed';
    }
    
    this.uploadedFiles.set(id, updated);
    return updated;
  }

  async deleteUploadedFile(id: string): Promise<boolean> {
    return this.uploadedFiles.delete(id);
  }

  async searchUploadedFiles(query: string, userId?: string): Promise<UploadedFile[]> {
    const allFiles = Array.from(this.uploadedFiles.values());
    const userFiles = userId ? allFiles.filter(file => file.userId === userId) : allFiles;
    
    if (!query.trim()) return userFiles;
    
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    
    return userFiles.filter(file => {
      const searchableText = [
        file.filename.toLowerCase(),
        file.originalName.toLowerCase(),
        file.extractedText?.toLowerCase() || ''
      ].join(' ');
      
      return searchTerms.some(term => searchableText.includes(term));
    }).sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  // System Components methods
  async createSystemComponent(component: InsertSystemComponent): Promise<SystemComponent> {
    const id = randomUUID();
    const comp: SystemComponent = {
      id,
      lastUpdate: new Date(),
      ...component,
    };
    this.systemComponents.set(component.name, comp);
    return comp;
  }

  async updateSystemComponent(name: string, updates: Partial<SystemComponent>): Promise<SystemComponent | undefined> {
    const existing = this.systemComponents.get(name);
    if (!existing) return undefined;
    
    const updated = { 
      ...existing, 
      ...updates, 
      lastUpdate: new Date() 
    };
    this.systemComponents.set(name, updated);
    return updated;
  }

  async getAllSystemComponents(): Promise<SystemComponent[]> {
    return Array.from(this.systemComponents.values());
  }

  // RSIS methods
  async createRSISCycle(cycle: InsertRSISCycle): Promise<RSISCycle> {
    const id = randomUUID();
    const rsisCycle: RSISCycle = {
      id,
      timestamp: new Date(),
      ...cycle,
    };
    this.rsisCycles.set(id, rsisCycle);
    return rsisCycle;
  }

  async getLatestRSISCycle(): Promise<RSISCycle | undefined> {
    const cycles = Array.from(this.rsisCycles.values())
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
    return cycles[0];
  }

  async getRSISHistory(limit: number = 100): Promise<RSISCycle[]> {
    return Array.from(this.rsisCycles.values())
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(0, limit);
  }

  // Commercial API methods
  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const id = randomUUID();
    const subscription: Subscription = {
      id,
      createdAt: new Date(),
      status: insertSubscription.status || 'active',
      currentUsage: insertSubscription.currentUsage || 0,
      ...insertSubscription,
    };
    this.subscriptions.set(id, subscription);
    return subscription;
  }

  async getSubscriptionByUserId(userId: string): Promise<Subscription | undefined> {
    return Array.from(this.subscriptions.values()).find(sub => sub.userId === userId);
  }

  async updateSubscriptionUsage(userId: string, increment: number): Promise<void> {
    const subscription = await this.getSubscriptionByUserId(userId);
    if (subscription) {
      subscription.currentUsage += increment;
      this.subscriptions.set(subscription.id, subscription);
    }
  }

  async createApiKey(insertApiKey: InsertApiKey): Promise<ApiKey> {
    const id = randomUUID();
    const apiKey: ApiKey = {
      id,
      createdAt: new Date(),
      lastUsed: null,
      isActive: insertApiKey.isActive ?? true,
      ...insertApiKey,
    };
    this.apiKeys.set(id, apiKey);
    return apiKey;
  }

  async getApiKeyByHash(keyHash: string): Promise<ApiKey | undefined> {
    return Array.from(this.apiKeys.values()).find(key => key.keyHash === keyHash);
  }

  async updateApiKeyLastUsed(keyId: string): Promise<void> {
    const apiKey = this.apiKeys.get(keyId);
    if (apiKey) {
      apiKey.lastUsed = new Date();
      this.apiKeys.set(keyId, apiKey);
    }
  }

  async createApiUsage(insertUsage: InsertApiUsage): Promise<ApiUsage> {
    const id = randomUUID();
    const usage: ApiUsage = {
      id,
      timestamp: new Date(),
      ...insertUsage,
    };
    this.apiUsages.set(id, usage);
    return usage;
  }

  async getUserApiUsage(userId: string, days: number = 30): Promise<ApiUsage[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return Array.from(this.apiUsages.values())
      .filter(usage => usage.userId === userId && (usage.timestamp?.getTime() || 0) >= cutoffDate.getTime())
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
  }

  // Agent Management methods implementation

  // VM Instance operations
  async createVMInstance(insertInstance: InsertVMInstance): Promise<VMInstance> {
    const id = randomUUID();
    const instance: VMInstance = {
      id,
      type: insertInstance.type,
      name: insertInstance.name,
      status: insertInstance.status || 'provisioning',
      cpu: insertInstance.cpu,
      memory: insertInstance.memory,
      region: insertInstance.region || 'us-east-1',
      endpoint: insertInstance.endpoint || null,
      sshKey: insertInstance.sshKey || null,
      createdAt: new Date(),
      lastHeartbeat: null,
    };
    this.vmInstances.set(id, instance);
    return instance;
  }

  async getVMInstance(id: string): Promise<VMInstance | undefined> {
    return this.vmInstances.get(id);
  }

  async getAllVMInstances(): Promise<VMInstance[]> {
    return Array.from(this.vmInstances.values());
  }

  async getVMInstancesByUserId(userId: string): Promise<VMInstance[]> {
    // Note: VM instances don't directly have userId field
    // We need to find VMs that belong to agents owned by this user
    const userAgents = await this.getUserAgents(userId);
    const vmIds = new Set(userAgents.map(agent => agent.vmInstanceId).filter(Boolean));
    
    return Array.from(this.vmInstances.values()).filter(vm => vmIds.has(vm.id));
  }

  async updateVMInstance(id: string, updates: Partial<VMInstance>): Promise<VMInstance | undefined> {
    const existing = this.vmInstances.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    if (updates.status === 'active') {
      updated.lastHeartbeat = new Date();
    }
    
    this.vmInstances.set(id, updated);
    return updated;
  }

  async deleteVMInstance(id: string): Promise<boolean> {
    return this.vmInstances.delete(id);
  }

  // Agent operations
  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const id = randomUUID();
    const agent: Agent = {
      id,
      type: insertAgent.type,
      name: insertAgent.name,
      status: insertAgent.status || 'initializing',
      createdAt: new Date(),
      harmonicState: insertAgent.harmonicState || null,
      coherence: insertAgent.coherence || null,
      userId: insertAgent.userId,
      vmInstanceId: insertAgent.vmInstanceId || null,
      configuration: insertAgent.configuration,
      tools: insertAgent.tools,
      lastActivity: null,
    };
    this.agents.set(id, agent);
    return agent;
  }

  async getAgent(id: string): Promise<Agent | undefined> {
    return this.agents.get(id);
  }

  async getUserAgents(userId: string): Promise<Agent[]> {
    return Array.from(this.agents.values()).filter(agent => agent.userId === userId);
  }

  async getAllAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values());
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent | undefined> {
    const existing = this.agents.get(id);
    if (!existing) return undefined;
    
    const updated = { 
      ...existing, 
      ...updates,
      lastActivity: new Date()
    };
    
    this.agents.set(id, updated);
    return updated;
  }

  async deleteAgent(id: string): Promise<boolean> {
    return this.agents.delete(id);
  }

  // Agent Task operations
  async createAgentTask(insertTask: InsertAgentTask): Promise<AgentTask> {
    const id = randomUUID();
    const task: AgentTask = {
      id,
      type: insertTask.type,
      result: insertTask.result || null,
      error: insertTask.error || null,
      status: insertTask.status || 'queued',
      createdAt: new Date(),
      completedAt: null,
      userId: insertTask.userId,
      agentId: insertTask.agentId,
      priority: insertTask.priority || 5,
      payload: insertTask.payload,
      startedAt: null,
    };
    this.agentTasks.set(id, task);
    return task;
  }

  async getAgentTask(id: string): Promise<AgentTask | undefined> {
    return this.agentTasks.get(id);
  }

  async getAgentTasks(agentId?: string, userId?: string, status?: string): Promise<AgentTask[]> {
    let tasks = Array.from(this.agentTasks.values());
    
    if (agentId) {
      tasks = tasks.filter(task => task.agentId === agentId);
    }
    if (userId) {
      tasks = tasks.filter(task => task.userId === userId);
    }
    if (status) {
      tasks = tasks.filter(task => task.status === status);
    }
    
    return tasks.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async updateAgentTask(id: string, updates: Partial<AgentTask>): Promise<AgentTask | undefined> {
    const existing = this.agentTasks.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    
    if (updates.status === 'running' && !existing.startedAt) {
      updated.startedAt = new Date();
    }
    if ((updates.status === 'completed' || updates.status === 'failed') && !existing.completedAt) {
      updated.completedAt = new Date();
    }
    
    this.agentTasks.set(id, updated);
    return updated;
  }

  async getTaskQueue(): Promise<{
    queuedTasks: number;
    runningTasks: number;
    completedTasks: number;
    failedTasks: number;
    avgTaskTime: number;
  }> {
    const tasks = Array.from(this.agentTasks.values());
    const completedTasks = tasks.filter(task => task.status === 'completed');
    const failedTasks = tasks.filter(task => task.status === 'failed');
    
    const avgTaskTime = completedTasks.length > 0 
      ? completedTasks.reduce((sum, task) => {
          if (task.startedAt && task.completedAt) {
            return sum + (task.completedAt.getTime() - task.startedAt.getTime());
          }
          return sum;
        }, 0) / completedTasks.length
      : 0;
    
    return {
      queuedTasks: tasks.filter(task => task.status === 'queued').length,
      runningTasks: tasks.filter(task => task.status === 'running').length,
      completedTasks: completedTasks.length,
      failedTasks: failedTasks.length,
      avgTaskTime: avgTaskTime / 1000, // Convert to seconds
    };
  }

  // Workflow operations
  async createWorkflow(insertWorkflow: InsertWorkflow): Promise<Workflow> {
    const id = randomUUID();
    const workflow: Workflow = {
      id,
      createdAt: new Date(),
      lastRun: null,
      status: insertWorkflow.status || 'draft',
      description: insertWorkflow.description || null,
      ...insertWorkflow,
    };
    this.workflows.set(id, workflow);
    return workflow;
  }

  async getWorkflow(id: string): Promise<Workflow | undefined> {
    return this.workflows.get(id);
  }

  async getUserWorkflows(userId: string): Promise<Workflow[]> {
    return Array.from(this.workflows.values())
      .filter(workflow => workflow.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow | undefined> {
    const existing = this.workflows.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.workflows.set(id, updated);
    return updated;
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    return this.workflows.delete(id);
  }

  // Agent Communication operations
  async createAgentCommunication(insertCommunication: InsertAgentCommunication): Promise<AgentCommunication> {
    const id = randomUUID();
    const communication: AgentCommunication = {
      id,
      timestamp: new Date(),
      harmonicSignature: insertCommunication.harmonicSignature || null,
      fromAgentId: insertCommunication.fromAgentId || null,
      toAgentId: insertCommunication.toAgentId || null,
      workflowId: insertCommunication.workflowId || null,
      ...insertCommunication,
    };
    this.agentCommunications.set(id, communication);
    return communication;
  }

  async getAgentCommunications(agentId?: string, workflowId?: string): Promise<AgentCommunication[]> {
    let communications = Array.from(this.agentCommunications.values());
    
    if (agentId) {
      communications = communications.filter(comm => 
        comm.fromAgentId === agentId || comm.toAgentId === agentId
      );
    }
    if (workflowId) {
      communications = communications.filter(comm => comm.workflowId === workflowId);
    }
    
    return communications.sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
  }

  // Agent Tools operations
  async createAgentTool(insertTool: InsertAgentTool): Promise<AgentTool> {
    const id = randomUUID();
    const tool: AgentTool = {
      id,
      createdAt: new Date(),
      isActive: insertTool.isActive ?? true,
      harmonicProfile: insertTool.harmonicProfile || null,
      ...insertTool,
    };
    this.agentTools.set(id, tool);
    return tool;
  }

  async getAgentTool(id: string): Promise<AgentTool | undefined> {
    return this.agentTools.get(id);
  }

  async getAllAgentTools(): Promise<AgentTool[]> {
    return Array.from(this.agentTools.values())
      .filter(tool => tool.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async updateAgentTool(id: string, updates: Partial<AgentTool>): Promise<AgentTool | undefined> {
    const existing = this.agentTools.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.agentTools.set(id, updated);
    return updated;
  }

  async deleteAgentTool(id: string): Promise<boolean> {
    return this.agentTools.delete(id);
  }

  // Creator Tools operations
  async createCreatorTool(insertTool: InsertCreatorTool): Promise<CreatorTool> {
    const id = randomUUID();
    const tool: CreatorTool = {
      id,
      createdAt: new Date(),
      isActive: insertTool.isActive ?? true,
      isPremium: insertTool.isPremium ?? false,
      version: insertTool.version || '1.0',
      ...insertTool,
    };
    this.creatorTools.set(id, tool);
    return tool;
  }

  async getCreatorTool(id: string): Promise<CreatorTool | undefined> {
    return this.creatorTools.get(id);
  }

  async getCreatorToolByName(name: string): Promise<CreatorTool | undefined> {
    return Array.from(this.creatorTools.values()).find(tool => tool.name === name);
  }

  async getAllCreatorTools(): Promise<CreatorTool[]> {
    return Array.from(this.creatorTools.values())
      .filter(tool => tool.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async updateCreatorTool(id: string, updates: Partial<CreatorTool>): Promise<CreatorTool | undefined> {
    const existing = this.creatorTools.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.creatorTools.set(id, updated);
    return updated;
  }

  async deleteCreatorTool(id: string): Promise<boolean> {
    return this.creatorTools.delete(id);
  }

  // Tool Usage operations
  async logToolUsage(insertUsage: InsertToolUsage): Promise<ToolUsage> {
    const id = randomUUID();
    const usage: ToolUsage = {
      id,
      timestamp: new Date(),
      resultSize: insertUsage.resultSize || null,
      errorMessage: insertUsage.errorMessage || null,
      ...insertUsage,
    };
    this.toolUsages.set(id, usage);
    return usage;
  }

  async getUserToolUsage(userId: string, days: number = 30): Promise<ToolUsage[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return Array.from(this.toolUsages.values())
      .filter(usage => usage.userId === userId && (usage.timestamp?.getTime() || 0) >= cutoffDate.getTime())
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
  }

  // Tool Presets operations
  async createToolPreset(insertPreset: InsertToolPreset): Promise<ToolPreset> {
    const id = randomUUID();
    const preset: ToolPreset = {
      id,
      createdAt: new Date(),
      isPremium: insertPreset.isPremium ?? false,
      tags: insertPreset.tags || [],
      ...insertPreset,
    };
    this.toolPresets.set(id, preset);
    return preset;
  }

  async getToolPresets(toolName?: string): Promise<ToolPreset[]> {
    let presets = Array.from(this.toolPresets.values());
    
    if (toolName) {
      presets = presets.filter(preset => preset.toolName === toolName);
    }
    
    return presets.sort((a, b) => a.name.localeCompare(b.name));
  }

  async updateToolPreset(id: string, updates: Partial<ToolPreset>): Promise<ToolPreset | undefined> {
    const existing = this.toolPresets.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.toolPresets.set(id, updated);
    return updated;
  }

  async deleteToolPreset(id: string): Promise<boolean> {
    return this.toolPresets.delete(id);
  }

  // VM Benchmarking operations
  async createVMBenchmark(insertBenchmark: InsertVMBenchmark): Promise<VMBenchmark> {
    const id = randomUUID();
    const benchmark: VMBenchmark = {
      id,
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
      status: insertBenchmark.status || 'pending',
      ...insertBenchmark,
    };
    this.vmBenchmarks.set(id, benchmark);
    return benchmark;
  }

  async getVMBenchmark(id: string): Promise<VMBenchmark | undefined> {
    return this.vmBenchmarks.get(id);
  }

  async getVMBenchmarks(vmInstanceId?: string, status?: string): Promise<VMBenchmark[]> {
    let benchmarks = Array.from(this.vmBenchmarks.values());
    
    if (vmInstanceId) {
      benchmarks = benchmarks.filter(benchmark => benchmark.vmInstanceId === vmInstanceId);
    }
    if (status) {
      benchmarks = benchmarks.filter(benchmark => benchmark.status === status);
    }
    
    return benchmarks.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async updateVMBenchmark(id: string, updates: Partial<VMBenchmark>): Promise<VMBenchmark | undefined> {
    const existing = this.vmBenchmarks.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    
    if (updates.status === 'running' && !existing.startedAt) {
      updated.startedAt = new Date();
    }
    if ((updates.status === 'completed' || updates.status === 'failed') && !existing.completedAt) {
      updated.completedAt = new Date();
    }
    
    this.vmBenchmarks.set(id, updated);
    return updated;
  }

  async deleteVMBenchmark(id: string): Promise<boolean> {
    return this.vmBenchmarks.delete(id);
  }

  // Evaluation Results operations
  async createEvaluationResult(insertResult: InsertEvaluationResult): Promise<EvaluationResult> {
    const id = randomUUID();
    const result: EvaluationResult = {
      id,
      timestamp: new Date(),
      isObjective: insertResult.isObjective ?? true,
      rawData: insertResult.rawData || null,
      validationHash: insertResult.validationHash || null,
      ...insertResult,
    };
    this.evaluationResults.set(id, result);
    return result;
  }

  async getEvaluationResults(benchmarkId: string): Promise<EvaluationResult[]> {
    return Array.from(this.evaluationResults.values())
      .filter(result => result.benchmarkId === benchmarkId)
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
  }

  async getAllEvaluationResults(limit: number = 100): Promise<EvaluationResult[]> {
    return Array.from(this.evaluationResults.values())
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(0, limit);
  }

  // Computational Canvas State operations
  async createComputationalCanvasState(insertState: InsertComputationalCanvasState): Promise<ComputationalCanvasState> {
    const id = randomUUID();
    const state: ComputationalCanvasState = {
      id,
      timestamp: new Date(),
      ...insertState,
    };
    this.computationalCanvasStates.set(id, state);
    return state;
  }

  async getComputationalCanvasStates(benchmarkId: string): Promise<ComputationalCanvasState[]> {
    return Array.from(this.computationalCanvasStates.values())
      .filter(state => state.benchmarkId === benchmarkId)
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
  }

  async getLatestComputationalCanvasState(benchmarkId: string): Promise<ComputationalCanvasState | undefined> {
    const states = await this.getComputationalCanvasStates(benchmarkId);
    return states[0];
  }

  // Safety Violation operations
  async createSafetyViolation(insertViolation: InsertSafetyViolation): Promise<SafetyViolation> {
    const id = randomUUID();
    const violation: SafetyViolation = {
      id,
      timestamp: new Date(),
      potentialValue: insertViolation.potentialValue || null,
      thresholdValue: insertViolation.thresholdValue || null,
      ...insertViolation,
    };
    this.safetyViolations.set(id, violation);
    return violation;
  }

  async getSafetyViolations(benchmarkId?: string): Promise<SafetyViolation[]> {
    let violations = Array.from(this.safetyViolations.values());
    
    if (benchmarkId) {
      violations = violations.filter(violation => violation.benchmarkId === benchmarkId);
    }
    
    return violations.sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
  }

  async getCriticalSafetyViolations(): Promise<SafetyViolation[]> {
    return Array.from(this.safetyViolations.values())
      .filter(violation => violation.severity === 'critical' || violation.severity === 'high')
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
  }

  // Benchmarking Statistics
  async getBenchmarkingStats(): Promise<{
    activeBenchmarks: number;
    completedBenchmarks: number;
    failedBenchmarks: number;
    avgBenchmarkTime: number;
  }> {
    const benchmarks = Array.from(this.vmBenchmarks.values());
    const completedBenchmarks = benchmarks.filter(b => b.status === 'completed');
    const failedBenchmarks = benchmarks.filter(b => b.status === 'failed');
    
    const avgBenchmarkTime = completedBenchmarks.length > 0 
      ? completedBenchmarks.reduce((sum, benchmark) => {
          if (benchmark.startedAt && benchmark.completedAt) {
            return sum + (benchmark.completedAt.getTime() - benchmark.startedAt.getTime());
          }
          return sum;
        }, 0) / completedBenchmarks.length / 1000 // Convert to seconds
      : 0;
    
    return {
      activeBenchmarks: benchmarks.filter(b => b.status === 'running').length,
      completedBenchmarks: completedBenchmarks.length,
      failedBenchmarks: failedBenchmarks.length,
      avgBenchmarkTime,
    };
  }

  // Waiting List Management operations
  async createWaitingListApplication(insertApplication: InsertWaitingListApplication): Promise<WaitingListApplication> {
    const id = randomUUID();
    const application: WaitingListApplication = {
      id,
      userId: insertApplication.userId,
      status: insertApplication.status || 'pending',
      priority: insertApplication.priority || 5,
      submittedReason: insertApplication.submittedReason,
      githubProfile: insertApplication.githubProfile || null,
      twitterProfile: insertApplication.twitterProfile || null,
      useCase: insertApplication.useCase || null,
      referralSource: insertApplication.referralSource || null,
      createdAt: new Date(),
      reviewedAt: null,
      reviewNotes: insertApplication.reviewNotes || null,
    };
    this.waitingListApplications.set(id, application);
    return application;
  }

  async getWaitingListApplication(id: string): Promise<WaitingListApplication | undefined> {
    return this.waitingListApplications.get(id);
  }

  async getWaitingListApplicationByUserId(userId: string): Promise<WaitingListApplication | undefined> {
    return Array.from(this.waitingListApplications.values()).find(app => app.userId === userId);
  }

  async getAllWaitingListApplications(status?: string): Promise<WaitingListApplication[]> {
    let applications = Array.from(this.waitingListApplications.values());
    if (status) {
      applications = applications.filter(app => app.status === status);
    }
    return applications.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async updateWaitingListApplication(id: string, updates: Partial<WaitingListApplication>): Promise<WaitingListApplication | undefined> {
    const application = this.waitingListApplications.get(id);
    if (!application) return undefined;
    
    const updated = { ...application, ...updates };
    this.waitingListApplications.set(id, updated);
    return updated;
  }

  async getWaitingListStats(): Promise<{
    totalApplications: number;
    pendingApplications: number;
    approvedToday: number;
    averageWaitTime: number;
  }> {
    const applications = Array.from(this.waitingListApplications.values());
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const approvedToday = applications.filter(app => 
      app.status === 'approved' && 
      app.reviewedAt && 
      app.reviewedAt >= today
    ).length;
    
    const approvedApps = applications.filter(app => app.status === 'approved' && app.reviewedAt);
    const avgWaitTime = approvedApps.length > 0 
      ? approvedApps.reduce((sum, app) => {
          if (app.reviewedAt) {
            return sum + (app.reviewedAt.getTime() - app.createdAt.getTime());
          }
          return sum;
        }, 0) / approvedApps.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;
    
    return {
      totalApplications: applications.length,
      pendingApplications: applications.filter(app => app.status === 'pending').length,
      approvedToday,
      averageWaitTime: Math.round(avgWaitTime * 10) / 10, // Round to 1 decimal
    };
  }

  // Feature Flag operations
  async createFeatureFlag(insertFlag: InsertFeatureFlag): Promise<FeatureFlag> {
    const id = randomUUID();
    const flag: FeatureFlag = {
      id,
      name: insertFlag.name,
      description: insertFlag.description,
      isEnabled: insertFlag.isEnabled || false,
      requiredAccessLevel: insertFlag.requiredAccessLevel || 'waiting',
      rolloutPercentage: insertFlag.rolloutPercentage || 0,
      betaFeature: insertFlag.betaFeature || false,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: insertFlag.expiresAt || null,
    };
    this.featureFlags.set(flag.name, flag);
    return flag;
  }

  async getFeatureFlag(name: string): Promise<FeatureFlag | undefined> {
    return this.featureFlags.get(name);
  }

  async getAllFeatureFlags(): Promise<FeatureFlag[]> {
    return Array.from(this.featureFlags.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async updateFeatureFlag(name: string, updates: Partial<FeatureFlag>): Promise<FeatureFlag | undefined> {
    const flag = this.featureFlags.get(name);
    if (!flag) return undefined;
    
    const updated = { ...flag, ...updates, updatedAt: new Date() };
    this.featureFlags.set(name, updated);
    return updated;
  }

  async deleteFeatureFlag(name: string): Promise<boolean> {
    return this.featureFlags.delete(name);
  }

  async getEnabledFeaturesForAccessLevel(accessLevel: string): Promise<string[]> {
    const flags = Array.from(this.featureFlags.values());
    return flags
      .filter(flag => flag.isEnabled && this.hasAccessToFeature(accessLevel, flag.requiredAccessLevel))
      .map(flag => flag.name);
  }

  private hasAccessToFeature(userLevel: string, requiredLevel: string): boolean {
    const levels = ['waiting', 'basic', 'advanced', 'premium', 'admin'];
    const userIndex = levels.indexOf(userLevel);
    const requiredIndex = levels.indexOf(requiredLevel);
    return userIndex >= requiredIndex;
  }

  // Access Level Permission operations
  async createAccessLevelPermission(insertPermission: InsertAccessLevelPermission): Promise<AccessLevelPermission> {
    const id = randomUUID();
    const permission: AccessLevelPermission = {
      id,
      accessLevel: insertPermission.accessLevel,
      featureName: insertPermission.featureName,
      isAllowed: insertPermission.isAllowed || false,
      quotaLimit: insertPermission.quotaLimit || null,
      createdAt: new Date(),
    };
    this.accessLevelPermissions.set(id, permission);
    return permission;
  }

  async getAccessLevelPermissions(accessLevel?: string): Promise<AccessLevelPermission[]> {
    let permissions = Array.from(this.accessLevelPermissions.values());
    if (accessLevel) {
      permissions = permissions.filter(perm => perm.accessLevel === accessLevel);
    }
    return permissions;
  }

  async updateAccessLevelPermission(id: string, updates: Partial<AccessLevelPermission>): Promise<AccessLevelPermission | undefined> {
    const permission = this.accessLevelPermissions.get(id);
    if (!permission) return undefined;
    
    const updated = { ...permission, ...updates };
    this.accessLevelPermissions.set(id, updated);
    return updated;
  }

  async deleteAccessLevelPermission(id: string): Promise<boolean> {
    return this.accessLevelPermissions.delete(id);
  }

  async checkUserPermission(userId: string, featureName: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    
    const feature = this.featureFlags.get(featureName);
    if (!feature || !feature.isEnabled) return false;
    
    return this.hasAccessToFeature(user.accessLevel, feature.requiredAccessLevel);
  }

  // Invitation Code operations
  async createInvitationCode(insertCode: InsertInvitationCode): Promise<InvitationCode> {
    const id = randomUUID();
    const code: InvitationCode = {
      id,
      code: insertCode.code,
      userId: insertCode.userId,
      accessLevel: insertCode.accessLevel || 'basic',
      maxUses: insertCode.maxUses,
      usedAt: null,
      isUsed: false,
      createdAt: new Date(),
    };
    this.invitationCodes.set(code.code, code);
    return code;
  }

  async getInvitationCode(code: string): Promise<InvitationCode | undefined> {
    return this.invitationCodes.get(code);
  }

  async getInvitationCodesByUserId(userId: string): Promise<InvitationCode[]> {
    return Array.from(this.invitationCodes.values())
      .filter(code => code.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async markInvitationCodeAsUsed(code: string): Promise<boolean> {
    const invitation = this.invitationCodes.get(code);
    if (!invitation) return false;
    
    invitation.isUsed = true;
    invitation.usedAt = new Date();
    this.invitationCodes.set(code, invitation);
    return true;
  }

  async getValidInvitationCode(code: string): Promise<InvitationCode | undefined> {
    const invitation = this.invitationCodes.get(code);
    if (!invitation || invitation.isUsed || invitation.expiresAt < new Date()) {
      return undefined;
    }
    return invitation;
  }

  // Admin Action Log operations
  async logAdminAction(insertAction: InsertAdminActionLog): Promise<AdminActionLog> {
    const id = randomUUID();
    const action: AdminActionLog = {
      id,
      adminId: insertAction.adminId,
      action: insertAction.action,
      targetUserId: insertAction.targetUserId || null,
      targetResource: insertAction.targetResource || null,
      details: insertAction.details,
      ipAddress: insertAction.ipAddress || null,
      userAgent: insertAction.userAgent || null,
      timestamp: new Date(),
    };
    this.adminActionLogs.set(id, action);
    return action;
  }

  async getAdminActionLogs(adminId?: string, limit: number = 100): Promise<AdminActionLog[]> {
    let logs = Array.from(this.adminActionLogs.values());
    if (adminId) {
      logs = logs.filter(log => log.adminId === adminId);
    }
    return logs
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(0, limit);
  }

  // Extended User operations
  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async approveUser(userId: string, adminId: string, accessLevel: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    
    // Update user status
    user.accessLevel = accessLevel;
    user.waitingListStatus = 'approved';
    user.approvedAt = new Date();
    user.invitedBy = adminId;
    this.users.set(userId, user);
    
    // Update waiting list application
    const application = await this.getWaitingListApplicationByUserId(userId);
    if (application) {
      await this.updateWaitingListApplication(application.id, {
        status: 'approved',
        reviewedBy: adminId,
        reviewedAt: new Date(),
      });
    }
    
    // Log admin action
    await this.logAdminAction({
      adminId,
      action: 'approve_user',
      targetUserId: userId,
      targetResource: null,
      details: { accessLevel, username: user.username },
      ipAddress: null,
      userAgent: null,
    });
    
    return true;
  }

  async denyUser(userId: string, adminId: string, reason: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    
    // Update user status
    user.waitingListStatus = 'denied';
    this.users.set(userId, user);
    
    // Update waiting list application
    const application = await this.getWaitingListApplicationByUserId(userId);
    if (application) {
      await this.updateWaitingListApplication(application.id, {
        status: 'denied',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        adminNotes: reason,
      });
    }
    
    // Log admin action
    await this.logAdminAction({
      adminId,
      action: 'deny_user',
      targetUserId: userId,
      targetResource: null,
      details: { reason, username: user.username },
      ipAddress: null,
      userAgent: null,
    });
    
    return true;
  }

  // VM Platform Enhancement - Change Proposal System operations

  // Change Proposal operations
  async createChangeProposal(insertProposal: InsertChangeProposal): Promise<ChangeProposal> {
    const id = randomUUID();
    const proposal: ChangeProposal = {
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'pending',
      validationReport: null,
      reviewedBy: null,
      reviewNotes: null,
      ...insertProposal,
    };
    this.changeProposals.set(id, proposal);
    return proposal;
  }

  async getChangeProposal(id: string): Promise<ChangeProposal | undefined> {
    return this.changeProposals.get(id);
  }

  async getAllChangeProposals(status?: string): Promise<ChangeProposal[]> {
    let proposals = Array.from(this.changeProposals.values());
    if (status) {
      proposals = proposals.filter(p => p.status === status);
    }
    return proposals.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async updateChangeProposal(id: string, updates: Partial<ChangeProposal>): Promise<ChangeProposal | undefined> {
    const proposal = this.changeProposals.get(id);
    if (!proposal) return undefined;
    
    const updated = { 
      ...proposal, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.changeProposals.set(id, updated);
    return updated;
  }

  async deleteChangeProposal(id: string): Promise<boolean> {
    return this.changeProposals.delete(id);
  }

  // Tools registry operations
  async createTool(insertTool: InsertTool): Promise<Tool> {
    const id = randomUUID();
    const tool: Tool = {
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
      usageCount: 0,
      createdBy: null,
      approvedBy: null,
      ...insertTool,
    };
    this.tools.set(id, tool);
    return tool;
  }

  async getTool(id: string): Promise<Tool | undefined> {
    return this.tools.get(id);
  }

  async getToolByName(name: string): Promise<Tool | undefined> {
    return Array.from(this.tools.values()).find(tool => tool.name === name);
  }

  async getAllTools(status?: string): Promise<Tool[]> {
    let tools = Array.from(this.tools.values());
    if (status) {
      tools = tools.filter(t => t.status === status);
    }
    return tools.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async updateTool(id: string, updates: Partial<Tool>): Promise<Tool | undefined> {
    const tool = this.tools.get(id);
    if (!tool) return undefined;
    
    const updated = { 
      ...tool, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.tools.set(id, updated);
    return updated;
  }

  async deleteTool(id: string): Promise<boolean> {
    return this.tools.delete(id);
  }

  async incrementToolUsage(id: string): Promise<void> {
    const tool = this.tools.get(id);
    if (tool) {
      tool.usageCount += 1;
      tool.updatedAt = new Date();
      this.tools.set(id, tool);
    }
  }

  // UI Widget operations
  async createUiWidget(insertWidget: InsertUiWidget): Promise<UiWidget> {
    const id = randomUUID();
    const widget: UiWidget = {
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
      usageCount: 0,
      flagKey: null,
      createdBy: null,
      approvedBy: null,
      ...insertWidget,
    };
    this.uiWidgets.set(id, widget);
    return widget;
  }

  async getUiWidget(id: string): Promise<UiWidget | undefined> {
    return this.uiWidgets.get(id);
  }

  async getUiWidgetByName(name: string): Promise<UiWidget | undefined> {
    return Array.from(this.uiWidgets.values()).find(widget => widget.name === name);
  }

  async getAllUiWidgets(status?: string): Promise<UiWidget[]> {
    let widgets = Array.from(this.uiWidgets.values());
    if (status) {
      widgets = widgets.filter(w => w.status === status);
    }
    return widgets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateUiWidget(id: string, updates: Partial<UiWidget>): Promise<UiWidget | undefined> {
    const widget = this.uiWidgets.get(id);
    if (!widget) return undefined;
    
    const updated = { 
      ...widget, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.uiWidgets.set(id, updated);
    return updated;
  }

  async deleteUiWidget(id: string): Promise<boolean> {
    return this.uiWidgets.delete(id);
  }

  async incrementUiWidgetUsage(id: string): Promise<void> {
    const widget = this.uiWidgets.get(id);
    if (widget) {
      widget.usageCount += 1;
      widget.updatedAt = new Date();
      this.uiWidgets.set(id, widget);
    }
  }

  // Registry Feature Flag operations
  async createRegistryFeatureFlag(insertFlag: InsertRegistryFeatureFlag): Promise<RegistryFeatureFlag> {
    const id = randomUUID();
    const flag: RegistryFeatureFlag = {
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
      relatedToolId: null,
      relatedWidgetId: null,
      createdBy: null,
      approvedBy: null,
      ...insertFlag,
    };
    this.registryFeatureFlags.set(id, flag);
    return flag;
  }

  async getRegistryFeatureFlag(id: string): Promise<RegistryFeatureFlag | undefined> {
    return this.registryFeatureFlags.get(id);
  }

  async getRegistryFeatureFlagByKey(key: string): Promise<RegistryFeatureFlag | undefined> {
    return Array.from(this.registryFeatureFlags.values()).find(flag => flag.key === key);
  }

  async getAllRegistryFeatureFlags(status?: string): Promise<RegistryFeatureFlag[]> {
    let flags = Array.from(this.registryFeatureFlags.values());
    if (status) {
      flags = flags.filter(f => f.status === status);
    }
    return flags.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateRegistryFeatureFlag(id: string, updates: Partial<RegistryFeatureFlag>): Promise<RegistryFeatureFlag | undefined> {
    const flag = this.registryFeatureFlags.get(id);
    if (!flag) return undefined;
    
    const updated = { 
      ...flag, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.registryFeatureFlags.set(id, updated);
    return updated;
  }

  async deleteRegistryFeatureFlag(id: string): Promise<boolean> {
    return this.registryFeatureFlags.delete(id);
  }

  async isRegistryFeatureEnabled(key: string, userId?: string, accessLevel?: string): Promise<boolean> {
    const flag = await this.getRegistryFeatureFlagByKey(key);
    if (!flag || flag.status !== 'active') {
      return false;
    }

    const enabledFor = flag.enabledFor as any;
    
    // Check if enabled for all
    if (enabledFor.includes('*') || enabledFor.includes('all')) {
      return true;
    }

    // Check if enabled for specific user
    if (userId && enabledFor.includes(userId)) {
      return true;
    }

    // Check if enabled for access level
    if (accessLevel && enabledFor.includes(accessLevel)) {
      return true;
    }

    // Check percentage rollout
    if (typeof enabledFor.percentage === 'number') {
      // Simple hash-based percentage rollout
      const userHash = userId ? this.simpleHash(userId) : Math.random();
      return (userHash % 100) < enabledFor.percentage;
    }

    return false;
  }

  // Oracle Console implementation methods
  async createOracleInstance(oracle: InsertOracleInstance): Promise<OracleInstance> {
    const id = randomUUID();
    const now = new Date();
    const oracleInstance: OracleInstance = {
      id,
      name: oracle.name,
      type: oracle.type,
      configuration: oracle.configuration,
      userId: oracle.userId || null,
      createdAt: now,
    };
    this.oracleInstances.set(id, oracleInstance);
    return oracleInstance;
  }

  async getOracleInstance(id: string): Promise<OracleInstance | undefined> {
    return this.oracleInstances.get(id);
  }

  async getUserOracleInstances(userId: string): Promise<OracleInstance[]> {
    return Array.from(this.oracleInstances.values())
      .filter(oracle => oracle.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getAllOracleInstances(): Promise<OracleInstance[]> {
    return Array.from(this.oracleInstances.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async updateOracleInstance(id: string, updates: Partial<OracleInstance>): Promise<OracleInstance | undefined> {
    const oracle = this.oracleInstances.get(id);
    if (!oracle) return undefined;
    
    const updatedOracle = { ...oracle, ...updates };
    this.oracleInstances.set(id, updatedOracle);
    return updatedOracle;
  }

  async deleteOracleInstance(id: string): Promise<boolean> {
    return this.oracleInstances.delete(id);
  }

  // Oracle Query implementation methods
  async createOracleQuery(query: InsertOracleQuery): Promise<OracleQuery> {
    const id = randomUUID();
    const now = new Date();
    const oracleQuery: OracleQuery = {
      id,
      oracleId: query.oracleId,
      prompt: query.prompt,
      response: query.response,
      context: query.context,
      userId: query.userId || null,
      createdAt: now,
    };
    this.oracleQueries.set(id, oracleQuery);
    return oracleQuery;
  }

  async getOracleQuery(id: string): Promise<OracleQuery | undefined> {
    return this.oracleQueries.get(id);
  }

  async getUserOracleQueries(userId: string, limit: number = 50): Promise<OracleQuery[]> {
    return Array.from(this.oracleQueries.values())
      .filter(query => query.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
  }

  async getOracleQueries(oracleId?: string, limit: number = 50): Promise<OracleQuery[]> {
    let queries = Array.from(this.oracleQueries.values());
    
    if (oracleId) {
      queries = queries.filter(query => query.oracleId === oracleId);
    }
    
    return queries
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
  }

  // Harmonic Processing implementation methods
  async createHarmonicProcessing(processing: InsertHarmonicProcessing): Promise<HarmonicProcessing> {
    const id = randomUUID();
    const now = new Date();
    const harmonicProcessing: HarmonicProcessing = {
      id,
      fileId: processing.fileId,
      userId: processing.userId || null,
      harmonicSignature: processing.harmonicSignature,
      coherenceScore: processing.coherenceScore,
      processedAt: processing.processedAt || now,
      createdAt: now,
    };
    this.harmonicProcessing.set(id, harmonicProcessing);
    return harmonicProcessing;
  }

  async getHarmonicProcessing(id: string): Promise<HarmonicProcessing | undefined> {
    return this.harmonicProcessing.get(id);
  }

  async getFileHarmonicProcessing(fileId: string): Promise<HarmonicProcessing[]> {
    return Array.from(this.harmonicProcessing.values())
      .filter(processing => processing.fileId === fileId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getUserHarmonicProcessing(userId: string, limit: number = 50): Promise<HarmonicProcessing[]> {
    return Array.from(this.harmonicProcessing.values())
      .filter(processing => processing.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
  }

  async updateHarmonicProcessing(id: string, updates: Partial<HarmonicProcessing>): Promise<HarmonicProcessing | undefined> {
    const processing = this.harmonicProcessing.get(id);
    if (!processing) return undefined;
    
    const updatedProcessing = { ...processing, ...updates };
    this.harmonicProcessing.set(id, updatedProcessing);
    return updatedProcessing;
  }

  // ========================================
  // HKM (Harmonic Knowledge Module) Implementation Methods
  // ========================================

  // Knowledge Pack operations
  async createKnowledgePack(pack: InsertKnowledgePack): Promise<KnowledgePack> {
    const id = randomUUID();
    const now = new Date();
    const knowledgePack: KnowledgePack = {
      id,
      name: pack.name,
      description: pack.description || null,
      category: pack.category,
      userId: pack.userId,
      createdAt: now,
      updatedAt: now,
    };
    this.knowledgePacks.set(id, knowledgePack);
    return knowledgePack;
  }

  async getKnowledgePack(id: string): Promise<KnowledgePack | undefined> {
    return this.knowledgePacks.get(id);
  }

  async getUserKnowledgePacks(userId: string, limit?: number): Promise<KnowledgePack[]> {
    return Array.from(this.knowledgePacks.values())
      .filter(pack => pack.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
  }

  async getKnowledgePacksByCategory(category: string, limit?: number): Promise<KnowledgePack[]> {
    return Array.from(this.knowledgePacks.values())
      .filter(pack => pack.category === category)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
  }

  async updateKnowledgePack(id: string, updates: Partial<KnowledgePack>): Promise<KnowledgePack | undefined> {
    const pack = this.knowledgePacks.get(id);
    if (!pack) return undefined;
    
    const updatedPack = { 
      ...pack, 
      ...updates, 
      updatedAt: new Date()
    };
    this.knowledgePacks.set(id, updatedPack);
    return updatedPack;
  }

  async deleteKnowledgePack(id: string): Promise<boolean> {
    const deleted = this.knowledgePacks.delete(id);
    if (deleted) {
      // Also delete associated embeddings and citations
      const embeddings = Array.from(this.knowledgeEmbeddings.values())
        .filter(emb => emb.packId === id);
      
      for (const embedding of embeddings) {
        this.knowledgeEmbeddings.delete(embedding.id);
        // Delete citations for this embedding
        const citations = Array.from(this.knowledgeCitations.values())
          .filter(cit => cit.embeddingId === embedding.id);
        citations.forEach(cit => this.knowledgeCitations.delete(cit.id));
      }
      
      // Delete learning metrics for this pack
      const metrics = Array.from(this.learningMetrics.values())
        .filter(metric => metric.packId === id);
      metrics.forEach(metric => this.learningMetrics.delete(metric.id));
    }
    return deleted;
  }

  // Knowledge Embedding operations
  async createKnowledgeEmbedding(embedding: InsertKnowledgeEmbedding): Promise<KnowledgeEmbedding> {
    const id = randomUUID();
    const now = new Date();
    const knowledgeEmbedding: KnowledgeEmbedding = {
      id,
      packId: embedding.packId,
      content: embedding.content,
      embeddingVector: embedding.embeddingVector,
      spectralRank: embedding.spectralRank,
      harmonicSignature: embedding.harmonicSignature,
      semanticCluster: embedding.semanticCluster || null,
      citations: embedding.citations || null,
      createdAt: now,
    };
    this.knowledgeEmbeddings.set(id, knowledgeEmbedding);
    return knowledgeEmbedding;
  }

  async getKnowledgeEmbedding(id: string): Promise<KnowledgeEmbedding | undefined> {
    return this.knowledgeEmbeddings.get(id);
  }

  async getPackEmbeddings(packId: string, limit?: number): Promise<KnowledgeEmbedding[]> {
    return Array.from(this.knowledgeEmbeddings.values())
      .filter(emb => emb.packId === packId)
      .sort((a, b) => b.spectralRank - a.spectralRank) // Sort by spectral rank desc
      .slice(0, limit);
  }

  async searchEmbeddingsByContent(packId: string, content: string, limit?: number): Promise<KnowledgeEmbedding[]> {
    const searchTerm = content.toLowerCase();
    return Array.from(this.knowledgeEmbeddings.values())
      .filter(emb => 
        emb.packId === packId && 
        emb.content.toLowerCase().includes(searchTerm)
      )
      .sort((a, b) => b.spectralRank - a.spectralRank)
      .slice(0, limit);
  }

  async getEmbeddingsBySpectralRank(packId: string, minRank: number, limit?: number): Promise<KnowledgeEmbedding[]> {
    return Array.from(this.knowledgeEmbeddings.values())
      .filter(emb => emb.packId === packId && emb.spectralRank >= minRank)
      .sort((a, b) => b.spectralRank - a.spectralRank)
      .slice(0, limit);
  }

  async updateKnowledgeEmbedding(id: string, updates: Partial<KnowledgeEmbedding>): Promise<KnowledgeEmbedding | undefined> {
    const embedding = this.knowledgeEmbeddings.get(id);
    if (!embedding) return undefined;
    
    const updatedEmbedding = { ...embedding, ...updates };
    this.knowledgeEmbeddings.set(id, updatedEmbedding);
    return updatedEmbedding;
  }

  // Knowledge Citation operations
  async createKnowledgeCitation(citation: InsertKnowledgeCitation): Promise<KnowledgeCitation> {
    const id = randomUUID();
    const now = new Date();
    const knowledgeCitation: KnowledgeCitation = {
      id,
      embeddingId: citation.embeddingId,
      sourceTitle: citation.sourceTitle,
      sourceType: citation.sourceType,
      sourceUrl: citation.sourceUrl || null,
      sourceAuthor: citation.sourceAuthor || null,
      publicationDate: citation.publicationDate || null,
      reliabilityScore: citation.reliabilityScore,
      createdAt: now,
    };
    this.knowledgeCitations.set(id, knowledgeCitation);
    return knowledgeCitation;
  }

  async getKnowledgeCitation(id: string): Promise<KnowledgeCitation | undefined> {
    return this.knowledgeCitations.get(id);
  }

  async getEmbeddingCitations(embeddingId: string): Promise<KnowledgeCitation[]> {
    return Array.from(this.knowledgeCitations.values())
      .filter(cit => cit.embeddingId === embeddingId)
      .sort((a, b) => b.reliabilityScore - a.reliabilityScore);
  }

  async getCitationsBySource(sourceTitle: string, limit?: number): Promise<KnowledgeCitation[]> {
    return Array.from(this.knowledgeCitations.values())
      .filter(cit => cit.sourceTitle.toLowerCase().includes(sourceTitle.toLowerCase()))
      .sort((a, b) => b.reliabilityScore - a.reliabilityScore)
      .slice(0, limit);
  }

  // Learning Metric operations
  async createLearningMetric(metric: InsertLearningMetric): Promise<LearningMetric> {
    const id = randomUUID();
    const now = new Date();
    const learningMetric: LearningMetric = {
      id,
      packId: metric.packId,
      metricType: metric.metricType,
      metricValue: metric.metricValue,
      metricMetadata: metric.metricMetadata || {},
      timestamp: now,
    };
    this.learningMetrics.set(id, learningMetric);
    return learningMetric;
  }

  async getPackLearningMetrics(packId: string, metricType?: string, limit?: number): Promise<LearningMetric[]> {
    let metrics = Array.from(this.learningMetrics.values())
      .filter(metric => metric.packId === packId);
    
    if (metricType) {
      metrics = metrics.filter(metric => metric.metricType === metricType);
    }
    
    return metrics
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(0, limit);
  }

  async getLatestLearningMetric(packId: string, metricType: string): Promise<LearningMetric | undefined> {
    const metrics = await this.getPackLearningMetrics(packId, metricType, 1);
    return metrics[0];
  }

  // HKM Query operations
  async createHkmQuery(query: InsertHkmQuery): Promise<HkmQuery> {
    const id = randomUUID();
    const now = new Date();
    const hkmQuery: HkmQuery = {
      id,
      queryType: query.queryType,
      queryText: query.queryText,
      response: query.response,
      userId: query.userId || null,
      createdAt: now,
    };
    this.hkmQueries.set(id, hkmQuery);
    return hkmQuery;
  }

  async getHkmQuery(id: string): Promise<HkmQuery | undefined> {
    return this.hkmQueries.get(id);
  }

  async getUserHkmQueries(userId: string, limit?: number): Promise<HkmQuery[]> {
    return Array.from(this.hkmQueries.values())
      .filter(query => query.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
  }

  async getHkmQueriesByType(queryType: string, limit?: number): Promise<HkmQuery[]> {
    return Array.from(this.hkmQueries.values())
      .filter(query => query.queryType === queryType)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
  }

  // Job Application operations
  async createJobApplication(application: InsertJobApplication): Promise<JobApplication> {
    const id = randomUUID();
    const now = new Date();
    const jobApplication: JobApplication = {
      ...application,
      id,
      appliedAt: now,
    };
    this.jobApplications.set(id, jobApplication);
    return jobApplication;
  }

  async getJobApplication(id: string): Promise<JobApplication | undefined> {
    return this.jobApplications.get(id);
  }

  async getAllJobApplications(): Promise<JobApplication[]> {
    return Array.from(this.jobApplications.values())
      .sort((a, b) => b.appliedAt!.getTime() - a.appliedAt!.getTime());
  }

  async getJobApplicationsByPosition(position: string): Promise<JobApplication[]> {
    return Array.from(this.jobApplications.values())
      .filter(app => app.position === position)
      .sort((a, b) => b.appliedAt!.getTime() - a.appliedAt!.getTime());
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

export class DbStorage implements IStorage {
  private db = db;

  async getUser(id: string): Promise<User | undefined> {
    try {
      const result = await this.db.query.users.findFirst({
        where: (users: any, { eq }: any) => eq(users.id, id)
      });
      return result;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await this.db.query.users.findFirst({
        where: (users: any, { eq }: any) => eq(users.username, username)
      });
      return result;
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const result = await this.db.query.users.findMany();
      return result;
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const { users } = await import('@shared/schema');
      const [newUser] = await this.db.insert(users).values(user).returning();
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    try {
      const { users } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const [updated] = await this.db.update(users)
        .set(updates)
        .where(eq(users.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await this.db.query.users.findFirst({
        where: (users: any, { eq }: any) => eq(users.email, email)
      });
      return result;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  async approveUser(userId: string, adminId: string, accessLevel: string): Promise<boolean> {
    try {
      const updated = await this.updateUser(userId, {
        waitingListStatus: 'approved',
        accessLevel: accessLevel,
        approvedAt: new Date(),
        invitedBy: adminId
      });
      return !!updated;
    } catch (error) {
      console.error('Error approving user:', error);
      throw error;
    }
  }

  async denyUser(userId: string, adminId: string, reason: string): Promise<boolean> {
    try {
      const updated = await this.updateUser(userId, {
        waitingListStatus: 'denied'
      });
      return !!updated;
    } catch (error) {
      console.error('Error denying user:', error);
      throw error;
    }
  }

  async createWSMState(state: InsertWSMState): Promise<WSMState> {
    try {
      const { wsmStates } = await import('@shared/schema');
      const [newState] = await this.db.insert(wsmStates).values(state).returning();
      return newState;
    } catch (error) {
      console.error('Error creating WSM state:', error);
      throw error;
    }
  }

  async getLatestWSMState(): Promise<WSMState | undefined> {
    try {
      const { desc } = await import('drizzle-orm');
      const { wsmStates } = await import('@shared/schema');
      const result = await this.db.query.wsmStates.findFirst({
        orderBy: [desc(wsmStates.timestamp)]
      });
      return result;
    } catch (error) {
      console.error('Error getting latest WSM state:', error);
      throw error;
    }
  }

  async getWSMStatesHistory(limit: number = 100): Promise<WSMState[]> {
    try {
      const { desc } = await import('drizzle-orm');
      const { wsmStates } = await import('@shared/schema');
      const result = await this.db.query.wsmStates.findMany({
        orderBy: [desc(wsmStates.timestamp)],
        limit
      });
      return result;
    } catch (error) {
      console.error('Error getting WSM states history:', error);
      throw error;
    }
  }

  async createFileProcessingJob(job: InsertFileProcessingJob): Promise<FileProcessingJob> {
    try {
      const { fileProcessingJobs } = await import('@shared/schema');
      const [newJob] = await this.db.insert(fileProcessingJobs).values(job).returning();
      return newJob;
    } catch (error) {
      console.error('Error creating file processing job:', error);
      throw error;
    }
  }

  async updateFileProcessingJob(id: string, updates: Partial<FileProcessingJob>): Promise<FileProcessingJob | undefined> {
    try {
      const { fileProcessingJobs } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const [updated] = await this.db.update(fileProcessingJobs)
        .set({ ...updates, completedAt: updates.status === 'completed' || updates.status === 'failed' ? new Date() : undefined })
        .where(eq(fileProcessingJobs.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating file processing job:', error);
      throw error;
    }
  }

  async getFileProcessingJobs(limit: number = 100): Promise<FileProcessingJob[]> {
    try {
      const { desc } = await import('drizzle-orm');
      const { fileProcessingJobs } = await import('@shared/schema');
      const result = await this.db.query.fileProcessingJobs.findMany({
        orderBy: [desc(fileProcessingJobs.createdAt)],
        limit
      });
      return result;
    } catch (error) {
      console.error('Error getting file processing jobs:', error);
      throw error;
    }
  }

  async getProcessingStats(): Promise<{ filesProcessed: number; successRate: number; avgProcessingTime: number; }> {
    try {
      const { fileProcessingJobs } = await import('@shared/schema');
      const { eq, or, avg, count } = await import('drizzle-orm');
      
      const allJobs = await this.db.query.fileProcessingJobs.findMany({
        where: or(
          eq(fileProcessingJobs.status, 'completed'),
          eq(fileProcessingJobs.status, 'failed')
        )
      });
      
      const filesProcessed = allJobs.length;
      const successfulJobs = allJobs.filter(job => job.status === 'completed').length;
      const avgTime = allJobs.reduce((sum, job) => sum + (job.processingTime || 0), 0) / (filesProcessed || 1);
      
      return {
        filesProcessed,
        successRate: filesProcessed > 0 ? (successfulJobs / filesProcessed) * 100 : 100,
        avgProcessingTime: avgTime * 1000
      };
    } catch (error) {
      console.error('Error getting processing stats:', error);
      throw error;
    }
  }

  async createUploadedFile(file: InsertUploadedFile): Promise<UploadedFile> {
    try {
      const { uploadedFiles } = await import('@shared/schema');
      const [newFile] = await this.db.insert(uploadedFiles).values(file).returning();
      return newFile;
    } catch (error) {
      console.error('Error creating uploaded file:', error);
      throw error;
    }
  }

  async getUploadedFile(id: string): Promise<UploadedFile | undefined> {
    try {
      const result = await this.db.query.uploadedFiles.findFirst({
        where: (uploadedFiles: any, { eq }: any) => eq(uploadedFiles.id, id)
      });
      return result;
    } catch (error) {
      console.error('Error getting uploaded file:', error);
      throw error;
    }
  }

  async getUserUploadedFiles(userId: string): Promise<UploadedFile[]> {
    try {
      const { desc } = await import('drizzle-orm');
      const { uploadedFiles } = await import('@shared/schema');
      const result = await this.db.query.uploadedFiles.findMany({
        where: (files: any, { eq }: any) => eq(files.userId, userId),
        orderBy: [desc(uploadedFiles.createdAt)]
      });
      return result;
    } catch (error) {
      console.error('Error getting user uploaded files:', error);
      throw error;
    }
  }

  async updateUploadedFile(id: string, updates: Partial<UploadedFile>): Promise<UploadedFile | undefined> {
    try {
      const { uploadedFiles } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const [updated] = await this.db.update(uploadedFiles)
        .set(updates)
        .where(eq(uploadedFiles.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating uploaded file:', error);
      throw error;
    }
  }

  async deleteUploadedFile(id: string): Promise<boolean> {
    try {
      const { uploadedFiles } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      await this.db.delete(uploadedFiles).where(eq(uploadedFiles.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting uploaded file:', error);
      return false;
    }
  }

  async searchUploadedFiles(query: string, userId?: string): Promise<UploadedFile[]> {
    try {
      const { uploadedFiles } = await import('@shared/schema');
      const { eq, or, like, and, desc } = await import('drizzle-orm');
      
      const conditions = [];
      if (userId) {
        conditions.push(eq(uploadedFiles.userId, userId));
      }
      
      if (query.trim()) {
        conditions.push(
          or(
            like(uploadedFiles.filename, `%${query}%`),
            like(uploadedFiles.originalName, `%${query}%`),
            like(uploadedFiles.extractedText, `%${query}%`)
          )
        );
      }
      
      const result = await this.db.query.uploadedFiles.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: [desc(uploadedFiles.createdAt)]
      });
      return result;
    } catch (error) {
      console.error('Error searching uploaded files:', error);
      throw error;
    }
  }

  async createSystemComponent(component: InsertSystemComponent): Promise<SystemComponent> {
    try {
      const { systemComponents } = await import('@shared/schema');
      const [newComponent] = await this.db.insert(systemComponents).values(component).returning();
      return newComponent;
    } catch (error) {
      console.error('Error creating system component:', error);
      throw error;
    }
  }

  async updateSystemComponent(name: string, updates: Partial<SystemComponent>): Promise<SystemComponent | undefined> {
    try {
      const { systemComponents } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const [updated] = await this.db.update(systemComponents)
        .set({ ...updates, lastUpdate: new Date() })
        .where(eq(systemComponents.name, name))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating system component:', error);
      throw error;
    }
  }

  async getAllSystemComponents(): Promise<SystemComponent[]> {
    try {
      const result = await this.db.query.systemComponents.findMany();
      return result;
    } catch (error) {
      console.error('Error getting all system components:', error);
      throw error;
    }
  }

  async createRSISCycle(cycle: InsertRSISCycle): Promise<RSISCycle> {
    try {
      const { rsisCycles } = await import('@shared/schema');
      const [newCycle] = await this.db.insert(rsisCycles).values(cycle).returning();
      return newCycle;
    } catch (error) {
      console.error('Error creating RSIS cycle:', error);
      throw error;
    }
  }

  async getLatestRSISCycle(): Promise<RSISCycle | undefined> {
    try {
      const { desc } = await import('drizzle-orm');
      const { rsisCycles } = await import('@shared/schema');
      const result = await this.db.query.rsisCycles.findFirst({
        orderBy: [desc(rsisCycles.timestamp)]
      });
      return result;
    } catch (error) {
      console.error('Error getting latest RSIS cycle:', error);
      throw error;
    }
  }

  async getRSISHistory(limit: number = 100): Promise<RSISCycle[]> {
    try {
      const { desc } = await import('drizzle-orm');
      const { rsisCycles } = await import('@shared/schema');
      const result = await this.db.query.rsisCycles.findMany({
        orderBy: [desc(rsisCycles.timestamp)],
        limit
      });
      return result;
    } catch (error) {
      console.error('Error getting RSIS history:', error);
      throw error;
    }
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    try {
      const { subscriptions } = await import('@shared/schema');
      const [newSubscription] = await this.db.insert(subscriptions).values(subscription).returning();
      return newSubscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  async getSubscriptionByUserId(userId: string): Promise<Subscription | undefined> {
    try {
      const result = await this.db.query.subscriptions.findFirst({
        where: (subscriptions: any, { eq }: any) => eq(subscriptions.userId, userId)
      });
      return result;
    } catch (error) {
      console.error('Error getting subscription by user ID:', error);
      throw error;
    }
  }

  async updateSubscriptionUsage(userId: string, increment: number): Promise<void> {
    try {
      const { subscriptions } = await import('@shared/schema');
      const { eq, sql } = await import('drizzle-orm');
      await this.db.update(subscriptions)
        .set({ currentUsage: sql`${subscriptions.currentUsage} + ${increment}` })
        .where(eq(subscriptions.userId, userId));
    } catch (error) {
      console.error('Error updating subscription usage:', error);
      throw error;
    }
  }

  async createApiKey(apiKey: InsertApiKey): Promise<ApiKey> {
    try {
      const { apiKeys } = await import('@shared/schema');
      const [newKey] = await this.db.insert(apiKeys).values(apiKey).returning();
      return newKey;
    } catch (error) {
      console.error('Error creating API key:', error);
      throw error;
    }
  }

  async getApiKeyByHash(keyHash: string): Promise<ApiKey | undefined> {
    try {
      const result = await this.db.query.apiKeys.findFirst({
        where: (apiKeys: any, { eq }: any) => eq(apiKeys.keyHash, keyHash)
      });
      return result;
    } catch (error) {
      console.error('Error getting API key by hash:', error);
      throw error;
    }
  }

  async updateApiKeyLastUsed(keyId: string): Promise<void> {
    try {
      const { apiKeys } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      await this.db.update(apiKeys)
        .set({ lastUsed: new Date() })
        .where(eq(apiKeys.id, keyId));
    } catch (error) {
      console.error('Error updating API key last used:', error);
      throw error;
    }
  }

  async createApiUsage(usage: InsertApiUsage): Promise<ApiUsage> {
    try {
      const { apiUsage } = await import('@shared/schema');
      const [newUsage] = await this.db.insert(apiUsage).values(usage).returning();
      return newUsage;
    } catch (error) {
      console.error('Error creating API usage:', error);
      throw error;
    }
  }

  async getUserApiUsage(userId: string, days: number = 30): Promise<ApiUsage[]> {
    try {
      const { apiUsage } = await import('@shared/schema');
      const { eq, gte, and, desc } = await import('drizzle-orm');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const result = await this.db.query.apiUsage.findMany({
        where: and(
          eq(apiUsage.userId, userId),
          gte(apiUsage.timestamp, cutoffDate)
        ),
        orderBy: [desc(apiUsage.timestamp)]
      });
      return result;
    } catch (error) {
      console.error('Error getting user API usage:', error);
      throw error;
    }
  }

  async createVMInstance(instance: InsertVMInstance): Promise<VMInstance> {
    try {
      const { vmInstances } = await import('@shared/schema');
      const [newInstance] = await this.db.insert(vmInstances).values(instance).returning();
      return newInstance;
    } catch (error) {
      console.error('Error creating VM instance:', error);
      throw error;
    }
  }

  async getVMInstance(id: string): Promise<VMInstance | undefined> {
    try {
      const result = await this.db.query.vmInstances.findFirst({
        where: (vmInstances: any, { eq }: any) => eq(vmInstances.id, id)
      });
      return result;
    } catch (error) {
      console.error('Error getting VM instance:', error);
      throw error;
    }
  }

  async getAllVMInstances(): Promise<VMInstance[]> {
    try {
      const result = await this.db.query.vmInstances.findMany();
      return result;
    } catch (error) {
      console.error('Error getting all VM instances:', error);
      throw error;
    }
  }

  async getVMInstancesByUserId(userId: string): Promise<VMInstance[]> {
    try {
      const userAgents = await this.getUserAgents(userId);
      const vmIds = [...new Set(userAgents.map(agent => agent.vmInstanceId).filter(Boolean))];
      
      if (vmIds.length === 0) return [];
      
      const { vmInstances } = await import('@shared/schema');
      const { inArray } = await import('drizzle-orm');
      const result = await this.db.query.vmInstances.findMany({
        where: inArray(vmInstances.id, vmIds)
      });
      return result;
    } catch (error) {
      console.error('Error getting VM instances by user ID:', error);
      throw error;
    }
  }

  async updateVMInstance(id: string, updates: Partial<VMInstance>): Promise<VMInstance | undefined> {
    try {
      const { vmInstances } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const [updated] = await this.db.update(vmInstances)
        .set(updates)
        .where(eq(vmInstances.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating VM instance:', error);
      throw error;
    }
  }

  async deleteVMInstance(id: string): Promise<boolean> {
    try {
      const { vmInstances } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      await this.db.delete(vmInstances).where(eq(vmInstances.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting VM instance:', error);
      return false;
    }
  }

  async createAgent(agent: InsertAgent): Promise<Agent> {
    try {
      const { agents } = await import('@shared/schema');
      const [newAgent] = await this.db.insert(agents).values(agent).returning();
      return newAgent;
    } catch (error) {
      console.error('Error creating agent:', error);
      throw error;
    }
  }

  async getAgent(id: string): Promise<Agent | undefined> {
    try {
      const result = await this.db.query.agents.findFirst({
        where: (agents: any, { eq }: any) => eq(agents.id, id)
      });
      return result;
    } catch (error) {
      console.error('Error getting agent:', error);
      throw error;
    }
  }

  async getUserAgents(userId: string): Promise<Agent[]> {
    try {
      const result = await this.db.query.agents.findMany({
        where: (agents: any, { eq }: any) => eq(agents.userId, userId)
      });
      return result;
    } catch (error) {
      console.error('Error getting user agents:', error);
      throw error;
    }
  }

  async getAllAgents(): Promise<Agent[]> {
    try {
      const result = await this.db.query.agents.findMany();
      return result;
    } catch (error) {
      console.error('Error getting all agents:', error);
      throw error;
    }
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent | undefined> {
    try {
      const { agents } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const [updated] = await this.db.update(agents)
        .set({ ...updates, lastActivity: new Date() })
        .where(eq(agents.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating agent:', error);
      throw error;
    }
  }

  async deleteAgent(id: string): Promise<boolean> {
    try {
      const { agents } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      await this.db.delete(agents).where(eq(agents.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting agent:', error);
      return false;
    }
  }

  async createAgentTask(task: InsertAgentTask): Promise<AgentTask> {
    try {
      const { agentTasks } = await import('@shared/schema');
      const [newTask] = await this.db.insert(agentTasks).values(task).returning();
      return newTask;
    } catch (error) {
      console.error('Error creating agent task:', error);
      throw error;
    }
  }

  async getAgentTask(id: string): Promise<AgentTask | undefined> {
    try {
      const result = await this.db.query.agentTasks.findFirst({
        where: (agentTasks: any, { eq }: any) => eq(agentTasks.id, id)
      });
      return result;
    } catch (error) {
      console.error('Error getting agent task:', error);
      throw error;
    }
  }

  async getAgentTasks(agentId?: string, userId?: string, status?: string): Promise<AgentTask[]> {
    try {
      const { agentTasks } = await import('@shared/schema');
      const { eq, and, desc } = await import('drizzle-orm');
      
      const conditions = [];
      if (agentId) conditions.push(eq(agentTasks.agentId, agentId));
      if (userId) conditions.push(eq(agentTasks.userId, userId));
      if (status) conditions.push(eq(agentTasks.status, status));
      
      const result = await this.db.query.agentTasks.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: [desc(agentTasks.createdAt)]
      });
      return result;
    } catch (error) {
      console.error('Error getting agent tasks:', error);
      throw error;
    }
  }

  async updateAgentTask(id: string, updates: Partial<AgentTask>): Promise<AgentTask | undefined> {
    try {
      const { agentTasks } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const updateData: any = { ...updates };
      if (updates.status === 'running' && !updateData.startedAt) {
        updateData.startedAt = new Date();
      }
      if ((updates.status === 'completed' || updates.status === 'failed') && !updateData.completedAt) {
        updateData.completedAt = new Date();
      }
      
      const [updated] = await this.db.update(agentTasks)
        .set(updateData)
        .where(eq(agentTasks.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating agent task:', error);
      throw error;
    }
  }

  async getTaskQueue(): Promise<{ queuedTasks: number; runningTasks: number; completedTasks: number; failedTasks: number; avgTaskTime: number; }> {
    try {
      const { agentTasks } = await import('@shared/schema');
      const { eq, sql } = await import('drizzle-orm');
      
      const allTasks = await this.db.query.agentTasks.findMany();
      const queuedTasks = allTasks.filter(t => t.status === 'queued').length;
      const runningTasks = allTasks.filter(t => t.status === 'running').length;
      const completedTasks = allTasks.filter(t => t.status === 'completed');
      const failedTasks = allTasks.filter(t => t.status === 'failed').length;
      
      const avgTaskTime = completedTasks.length > 0
        ? completedTasks.reduce((sum, task) => {
            if (task.startedAt && task.completedAt) {
              return sum + (task.completedAt.getTime() - task.startedAt.getTime());
            }
            return sum;
          }, 0) / completedTasks.length / 1000
        : 0;
      
      return {
        queuedTasks,
        runningTasks,
        completedTasks: completedTasks.length,
        failedTasks,
        avgTaskTime
      };
    } catch (error) {
      console.error('Error getting task queue:', error);
      throw error;
    }
  }

  async createWorkflow(workflow: InsertWorkflow): Promise<Workflow> {
    try {
      const { workflows } = await import('@shared/schema');
      const [newWorkflow] = await this.db.insert(workflows).values(workflow).returning();
      return newWorkflow;
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }
  }

  async getWorkflow(id: string): Promise<Workflow | undefined> {
    try {
      const result = await this.db.query.workflows.findFirst({
        where: (workflows: any, { eq }: any) => eq(workflows.id, id)
      });
      return result;
    } catch (error) {
      console.error('Error getting workflow:', error);
      throw error;
    }
  }

  async getUserWorkflows(userId: string): Promise<Workflow[]> {
    try {
      const result = await this.db.query.workflows.findMany({
        where: (workflows: any, { eq }: any) => eq(workflows.userId, userId)
      });
      return result;
    } catch (error) {
      console.error('Error getting user workflows:', error);
      throw error;
    }
  }

  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow | undefined> {
    try {
      const { workflows } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const [updated] = await this.db.update(workflows)
        .set(updates)
        .where(eq(workflows.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating workflow:', error);
      throw error;
    }
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    try {
      const { workflows } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      await this.db.delete(workflows).where(eq(workflows.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting workflow:', error);
      return false;
    }
  }

  async createAgentCommunication(communication: InsertAgentCommunication): Promise<AgentCommunication> {
    try {
      const { agentCommunications } = await import('@shared/schema');
      const [newComm] = await this.db.insert(agentCommunications).values(communication).returning();
      return newComm;
    } catch (error) {
      console.error('Error creating agent communication:', error);
      throw error;
    }
  }

  async getAgentCommunications(agentId?: string, workflowId?: string): Promise<AgentCommunication[]> {
    try {
      const { agentCommunications } = await import('@shared/schema');
      const { eq, or, and, desc } = await import('drizzle-orm');
      
      const conditions = [];
      if (agentId) {
        conditions.push(or(
          eq(agentCommunications.fromAgentId, agentId),
          eq(agentCommunications.toAgentId, agentId)
        ));
      }
      if (workflowId) conditions.push(eq(agentCommunications.workflowId, workflowId));
      
      const result = await this.db.query.agentCommunications.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: [desc(agentCommunications.timestamp)]
      });
      return result;
    } catch (error) {
      console.error('Error getting agent communications:', error);
      throw error;
    }
  }

  async createAgentTool(tool: InsertAgentTool): Promise<AgentTool> {
    try {
      const { agentTools } = await import('@shared/schema');
      const [newTool] = await this.db.insert(agentTools).values(tool).returning();
      return newTool;
    } catch (error) {
      console.error('Error creating agent tool:', error);
      throw error;
    }
  }

  async getAgentTool(id: string): Promise<AgentTool | undefined> {
    try {
      const result = await this.db.query.agentTools.findFirst({
        where: (agentTools: any, { eq }: any) => eq(agentTools.id, id)
      });
      return result;
    } catch (error) {
      console.error('Error getting agent tool:', error);
      throw error;
    }
  }

  async getAllAgentTools(): Promise<AgentTool[]> {
    try {
      const result = await this.db.query.agentTools.findMany();
      return result;
    } catch (error) {
      console.error('Error getting all agent tools:', error);
      throw error;
    }
  }

  async updateAgentTool(id: string, updates: Partial<AgentTool>): Promise<AgentTool | undefined> {
    try {
      const { agentTools } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const [updated] = await this.db.update(agentTools)
        .set(updates)
        .where(eq(agentTools.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating agent tool:', error);
      throw error;
    }
  }

  async deleteAgentTool(id: string): Promise<boolean> {
    try {
      const { agentTools } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      await this.db.delete(agentTools).where(eq(agentTools.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting agent tool:', error);
      return false;
    }
  }

  async createCreatorTool(tool: InsertCreatorTool): Promise<CreatorTool> {
    try {
      const { creatorTools } = await import('@shared/schema');
      const [newTool] = await this.db.insert(creatorTools).values(tool).returning();
      return newTool;
    } catch (error) {
      console.error('Error creating creator tool:', error);
      throw error;
    }
  }

  async getCreatorTool(id: string): Promise<CreatorTool | undefined> {
    try {
      const result = await this.db.query.creatorTools.findFirst({
        where: (creatorTools: any, { eq }: any) => eq(creatorTools.id, id)
      });
      return result;
    } catch (error) {
      console.error('Error getting creator tool:', error);
      throw error;
    }
  }

  async getCreatorToolByName(name: string): Promise<CreatorTool | undefined> {
    try {
      const result = await this.db.query.creatorTools.findFirst({
        where: (creatorTools: any, { eq }: any) => eq(creatorTools.name, name)
      });
      return result;
    } catch (error) {
      console.error('Error getting creator tool by name:', error);
      throw error;
    }
  }

  async getAllCreatorTools(): Promise<CreatorTool[]> {
    try {
      const result = await this.db.query.creatorTools.findMany();
      return result;
    } catch (error) {
      console.error('Error getting all creator tools:', error);
      throw error;
    }
  }

  async updateCreatorTool(id: string, updates: Partial<CreatorTool>): Promise<CreatorTool | undefined> {
    try {
      const { creatorTools } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const [updated] = await this.db.update(creatorTools)
        .set(updates)
        .where(eq(creatorTools.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating creator tool:', error);
      throw error;
    }
  }

  async deleteCreatorTool(id: string): Promise<boolean> {
    try {
      const { creatorTools } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      await this.db.delete(creatorTools).where(eq(creatorTools.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting creator tool:', error);
      return false;
    }
  }

  async logToolUsage(usage: InsertToolUsage): Promise<ToolUsage> {
    try {
      const { toolUsage } = await import('@shared/schema');
      const [newUsage] = await this.db.insert(toolUsage).values(usage).returning();
      return newUsage;
    } catch (error) {
      console.error('Error logging tool usage:', error);
      throw error;
    }
  }

  async getUserToolUsage(userId: string, days: number = 30): Promise<ToolUsage[]> {
    try {
      const { toolUsage } = await import('@shared/schema');
      const { eq, gte, and, desc } = await import('drizzle-orm');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const result = await this.db.query.toolUsage.findMany({
        where: and(
          eq(toolUsage.userId, userId),
          gte(toolUsage.timestamp, cutoffDate)
        ),
        orderBy: [desc(toolUsage.timestamp)]
      });
      return result;
    } catch (error) {
      console.error('Error getting user tool usage:', error);
      throw error;
    }
  }

  async createToolPreset(preset: InsertToolPreset): Promise<ToolPreset> {
    try {
      const { toolPresets } = await import('@shared/schema');
      const [newPreset] = await this.db.insert(toolPresets).values(preset).returning();
      return newPreset;
    } catch (error) {
      console.error('Error creating tool preset:', error);
      throw error;
    }
  }

  async getToolPresets(toolName?: string): Promise<ToolPreset[]> {
    try {
      const { toolPresets } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const result = await this.db.query.toolPresets.findMany({
        where: toolName ? eq(toolPresets.toolName, toolName) : undefined
      });
      return result;
    } catch (error) {
      console.error('Error getting tool presets:', error);
      throw error;
    }
  }

  async updateToolPreset(id: string, updates: Partial<ToolPreset>): Promise<ToolPreset | undefined> {
    try {
      const { toolPresets } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const [updated] = await this.db.update(toolPresets)
        .set(updates)
        .where(eq(toolPresets.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating tool preset:', error);
      throw error;
    }
  }

  async deleteToolPreset(id: string): Promise<boolean> {
    try {
      const { toolPresets } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      await this.db.delete(toolPresets).where(eq(toolPresets.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting tool preset:', error);
      return false;
    }
  }

  async createVMBenchmark(benchmark: InsertVMBenchmark): Promise<VMBenchmark> {
    try {
      const { vmBenchmarks } = await import('@shared/schema');
      const [newBenchmark] = await this.db.insert(vmBenchmarks).values(benchmark).returning();
      return newBenchmark;
    } catch (error) {
      console.error('Error creating VM benchmark:', error);
      throw error;
    }
  }

  async getVMBenchmark(id: string): Promise<VMBenchmark | undefined> {
    try {
      const result = await this.db.query.vmBenchmarks.findFirst({
        where: (vmBenchmarks: any, { eq }: any) => eq(vmBenchmarks.id, id)
      });
      return result;
    } catch (error) {
      console.error('Error getting VM benchmark:', error);
      throw error;
    }
  }

  async getVMBenchmarks(vmInstanceId?: string, status?: string): Promise<VMBenchmark[]> {
    try {
      const { vmBenchmarks } = await import('@shared/schema');
      const { eq, and } = await import('drizzle-orm');
      
      const conditions = [];
      if (vmInstanceId) conditions.push(eq(vmBenchmarks.vmInstanceId, vmInstanceId));
      if (status) conditions.push(eq(vmBenchmarks.status, status));
      
      const result = await this.db.query.vmBenchmarks.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined
      });
      return result;
    } catch (error) {
      console.error('Error getting VM benchmarks:', error);
      throw error;
    }
  }

  async updateVMBenchmark(id: string, updates: Partial<VMBenchmark>): Promise<VMBenchmark | undefined> {
    try {
      const { vmBenchmarks } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const [updated] = await this.db.update(vmBenchmarks)
        .set(updates)
        .where(eq(vmBenchmarks.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating VM benchmark:', error);
      throw error;
    }
  }

  async deleteVMBenchmark(id: string): Promise<boolean> {
    try {
      const { vmBenchmarks } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      await this.db.delete(vmBenchmarks).where(eq(vmBenchmarks.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting VM benchmark:', error);
      return false;
    }
  }

  async createEvaluationResult(result: InsertEvaluationResult): Promise<EvaluationResult> {
    try {
      const { evaluationResults } = await import('@shared/schema');
      const [newResult] = await this.db.insert(evaluationResults).values(result).returning();
      return newResult;
    } catch (error) {
      console.error('Error creating evaluation result:', error);
      throw error;
    }
  }

  async getEvaluationResults(benchmarkId: string): Promise<EvaluationResult[]> {
    try {
      const { evaluationResults } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const result = await this.db.query.evaluationResults.findMany({
        where: eq(evaluationResults.benchmarkId, benchmarkId)
      });
      return result;
    } catch (error) {
      console.error('Error getting evaluation results:', error);
      throw error;
    }
  }

  async getAllEvaluationResults(limit: number = 100): Promise<EvaluationResult[]> {
    try {
      const { evaluationResults } = await import('@shared/schema');
      const { desc } = await import('drizzle-orm');
      const result = await this.db.query.evaluationResults.findMany({
        orderBy: [desc(evaluationResults.timestamp)],
        limit
      });
      return result;
    } catch (error) {
      console.error('Error getting all evaluation results:', error);
      throw error;
    }
  }

  async createComputationalCanvasState(state: InsertComputationalCanvasState): Promise<ComputationalCanvasState> {
    try {
      const { computationalCanvasStates } = await import('@shared/schema');
      const [newState] = await this.db.insert(computationalCanvasStates).values(state).returning();
      return newState;
    } catch (error) {
      console.error('Error creating computational canvas state:', error);
      throw error;
    }
  }

  async getComputationalCanvasStates(benchmarkId: string): Promise<ComputationalCanvasState[]> {
    try {
      const { computationalCanvasStates } = await import('@shared/schema');
      const { eq, desc } = await import('drizzle-orm');
      const result = await this.db.query.computationalCanvasStates.findMany({
        where: eq(computationalCanvasStates.benchmarkId, benchmarkId),
        orderBy: [desc(computationalCanvasStates.timestamp)]
      });
      return result;
    } catch (error) {
      console.error('Error getting computational canvas states:', error);
      throw error;
    }
  }

  async getLatestComputationalCanvasState(benchmarkId: string): Promise<ComputationalCanvasState | undefined> {
    try {
      const { computationalCanvasStates } = await import('@shared/schema');
      const { eq, desc } = await import('drizzle-orm');
      const result = await this.db.query.computationalCanvasStates.findFirst({
        where: eq(computationalCanvasStates.benchmarkId, benchmarkId),
        orderBy: [desc(computationalCanvasStates.timestamp)]
      });
      return result;
    } catch (error) {
      console.error('Error getting latest computational canvas state:', error);
      throw error;
    }
  }

  async createSafetyViolation(violation: InsertSafetyViolation): Promise<SafetyViolation> {
    try {
      const { safetyViolations } = await import('@shared/schema');
      const [newViolation] = await this.db.insert(safetyViolations).values(violation).returning();
      return newViolation;
    } catch (error) {
      console.error('Error creating safety violation:', error);
      throw error;
    }
  }

  async getSafetyViolations(benchmarkId?: string): Promise<SafetyViolation[]> {
    try {
      const { safetyViolations } = await import('@shared/schema');
      const { eq, desc } = await import('drizzle-orm');
      const result = await this.db.query.safetyViolations.findMany({
        where: benchmarkId ? eq(safetyViolations.benchmarkId, benchmarkId) : undefined,
        orderBy: [desc(safetyViolations.timestamp)]
      });
      return result;
    } catch (error) {
      console.error('Error getting safety violations:', error);
      throw error;
    }
  }

  async getCriticalSafetyViolations(): Promise<SafetyViolation[]> {
    try {
      const { safetyViolations } = await import('@shared/schema');
      const { eq, desc } = await import('drizzle-orm');
      const result = await this.db.query.safetyViolations.findMany({
        where: eq(safetyViolations.severity, 'critical'),
        orderBy: [desc(safetyViolations.timestamp)]
      });
      return result;
    } catch (error) {
      console.error('Error getting critical safety violations:', error);
      throw error;
    }
  }

  async createWaitingListApplication(application: InsertWaitingListApplication): Promise<WaitingListApplication> {
    try {
      const { waitingListApplications } = await import('@shared/schema');
      const [newApp] = await this.db.insert(waitingListApplications).values(application).returning();
      return newApp;
    } catch (error) {
      console.error('Error creating waiting list application:', error);
      throw error;
    }
  }

  async getWaitingListApplication(id: string): Promise<WaitingListApplication | undefined> {
    try {
      const result = await this.db.query.waitingListApplications.findFirst({
        where: (waitingListApplications: any, { eq }: any) => eq(waitingListApplications.id, id)
      });
      return result;
    } catch (error) {
      console.error('Error getting waiting list application:', error);
      throw error;
    }
  }

  async getWaitingListApplicationByUserId(userId: string): Promise<WaitingListApplication | undefined> {
    try {
      const result = await this.db.query.waitingListApplications.findFirst({
        where: (waitingListApplications: any, { eq }: any) => eq(waitingListApplications.userId, userId)
      });
      return result;
    } catch (error) {
      console.error('Error getting waiting list application by user ID:', error);
      throw error;
    }
  }

  async getAllWaitingListApplications(status?: string): Promise<WaitingListApplication[]> {
    try {
      const { waitingListApplications } = await import('@shared/schema');
      const { eq, desc } = await import('drizzle-orm');
      const result = await this.db.query.waitingListApplications.findMany({
        where: status ? eq(waitingListApplications.status, status) : undefined,
        orderBy: [desc(waitingListApplications.createdAt)]
      });
      return result;
    } catch (error) {
      console.error('Error getting all waiting list applications:', error);
      throw error;
    }
  }

  async updateWaitingListApplication(id: string, updates: Partial<WaitingListApplication>): Promise<WaitingListApplication | undefined> {
    try {
      const { waitingListApplications } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const [updated] = await this.db.update(waitingListApplications)
        .set(updates)
        .where(eq(waitingListApplications.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating waiting list application:', error);
      throw error;
    }
  }

  async getWaitingListStats(): Promise<{ totalApplications: number; pendingApplications: number; approvedToday: number; averageWaitTime: number; }> {
    try {
      const { waitingListApplications } = await import('@shared/schema');
      const { eq, gte, and } = await import('drizzle-orm');
      
      const allApps = await this.db.query.waitingListApplications.findMany();
      const pending = allApps.filter(app => app.status === 'pending');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const approvedToday = allApps.filter(app => 
        app.status === 'approved' && app.reviewedAt && app.reviewedAt >= today
      );
      
      const approved = allApps.filter(app => app.status === 'approved' && app.createdAt && app.reviewedAt);
      const avgWaitTime = approved.length > 0
        ? approved.reduce((sum, app) => {
            const waitTime = app.reviewedAt!.getTime() - app.createdAt!.getTime();
            return sum + waitTime;
          }, 0) / approved.length / (1000 * 60 * 60 * 24)
        : 0;
      
      return {
        totalApplications: allApps.length,
        pendingApplications: pending.length,
        approvedToday: approvedToday.length,
        averageWaitTime: avgWaitTime
      };
    } catch (error) {
      console.error('Error getting waiting list stats:', error);
      throw error;
    }
  }

  async createFeatureFlag(flag: InsertFeatureFlag): Promise<FeatureFlag> {
    try {
      const { featureFlags } = await import('@shared/schema');
      const [newFlag] = await this.db.insert(featureFlags).values(flag).returning();
      return newFlag;
    } catch (error) {
      console.error('Error creating feature flag:', error);
      throw error;
    }
  }

  async getFeatureFlag(name: string): Promise<FeatureFlag | undefined> {
    try {
      const result = await this.db.query.featureFlags.findFirst({
        where: (featureFlags: any, { eq }: any) => eq(featureFlags.name, name)
      });
      return result;
    } catch (error) {
      console.error('Error getting feature flag:', error);
      throw error;
    }
  }

  async getAllFeatureFlags(): Promise<FeatureFlag[]> {
    try {
      const result = await this.db.query.featureFlags.findMany();
      return result;
    } catch (error) {
      console.error('Error getting all feature flags:', error);
      throw error;
    }
  }

  async updateFeatureFlag(name: string, updates: Partial<FeatureFlag>): Promise<FeatureFlag | undefined> {
    try {
      const { featureFlags } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const [updated] = await this.db.update(featureFlags)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(featureFlags.name, name))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating feature flag:', error);
      throw error;
    }
  }

  async deleteFeatureFlag(name: string): Promise<boolean> {
    try {
      const { featureFlags } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      await this.db.delete(featureFlags).where(eq(featureFlags.name, name));
      return true;
    } catch (error) {
      console.error('Error deleting feature flag:', error);
      return false;
    }
  }

  async getEnabledFeaturesForAccessLevel(accessLevel: string): Promise<string[]> {
    try {
      const { featureFlags } = await import('@shared/schema');
      const { eq, and, lte } = await import('drizzle-orm');
      
      const accessLevelOrder: any = { 'waiting': 0, 'basic': 1, 'advanced': 2, 'premium': 3, 'admin': 4 };
      const userLevel = accessLevelOrder[accessLevel] || 0;
      
      const allFlags = await this.db.query.featureFlags.findMany({
        where: eq(featureFlags.isEnabled, true)
      });
      
      const enabled = allFlags
        .filter(flag => {
          const requiredLevel = accessLevelOrder[flag.requiredAccessLevel] || 0;
          return userLevel >= requiredLevel;
        })
        .map(flag => flag.name);
      
      return enabled;
    } catch (error) {
      console.error('Error getting enabled features for access level:', error);
      throw error;
    }
  }

  async createAccessLevelPermission(permission: InsertAccessLevelPermission): Promise<AccessLevelPermission> {
    try {
      const { accessLevelPermissions } = await import('@shared/schema');
      const [newPermission] = await this.db.insert(accessLevelPermissions).values(permission).returning();
      return newPermission;
    } catch (error) {
      console.error('Error creating access level permission:', error);
      throw error;
    }
  }

  async getAccessLevelPermissions(accessLevel?: string): Promise<AccessLevelPermission[]> {
    try {
      const { accessLevelPermissions } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const result = await this.db.query.accessLevelPermissions.findMany({
        where: accessLevel ? eq(accessLevelPermissions.accessLevel, accessLevel) : undefined
      });
      return result;
    } catch (error) {
      console.error('Error getting access level permissions:', error);
      throw error;
    }
  }

  async updateAccessLevelPermission(id: string, updates: Partial<AccessLevelPermission>): Promise<AccessLevelPermission | undefined> {
    try {
      const { accessLevelPermissions } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const [updated] = await this.db.update(accessLevelPermissions)
        .set(updates)
        .where(eq(accessLevelPermissions.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating access level permission:', error);
      throw error;
    }
  }

  async deleteAccessLevelPermission(id: string): Promise<boolean> {
    try {
      const { accessLevelPermissions } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      await this.db.delete(accessLevelPermissions).where(eq(accessLevelPermissions.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting access level permission:', error);
      return false;
    }
  }

  async checkUserPermission(userId: string, featureName: string): Promise<boolean> {
    try {
      const user = await this.getUser(userId);
      if (!user) return false;
      
      const enabledFeatures = await this.getEnabledFeaturesForAccessLevel(user.accessLevel);
      return enabledFeatures.includes(featureName);
    } catch (error) {
      console.error('Error checking user permission:', error);
      return false;
    }
  }

  async createInvitationCode(code: InsertInvitationCode): Promise<InvitationCode> {
    try {
      const { invitationCodes } = await import('@shared/schema');
      const [newCode] = await this.db.insert(invitationCodes).values(code).returning();
      return newCode;
    } catch (error) {
      console.error('Error creating invitation code:', error);
      throw error;
    }
  }

  async getInvitationCode(code: string): Promise<InvitationCode | undefined> {
    try {
      const result = await this.db.query.invitationCodes.findFirst({
        where: (invitationCodes: any, { eq }: any) => eq(invitationCodes.code, code)
      });
      return result;
    } catch (error) {
      console.error('Error getting invitation code:', error);
      throw error;
    }
  }

  async getInvitationCodesByUserId(userId: string): Promise<InvitationCode[]> {
    try {
      const { invitationCodes } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const result = await this.db.query.invitationCodes.findMany({
        where: eq(invitationCodes.userId, userId)
      });
      return result;
    } catch (error) {
      console.error('Error getting invitation codes by user ID:', error);
      throw error;
    }
  }

  async markInvitationCodeAsUsed(code: string): Promise<boolean> {
    try {
      const { invitationCodes } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const [updated] = await this.db.update(invitationCodes)
        .set({ isUsed: true, usedAt: new Date() })
        .where(eq(invitationCodes.code, code))
        .returning();
      return !!updated;
    } catch (error) {
      console.error('Error marking invitation code as used:', error);
      return false;
    }
  }

  async getValidInvitationCode(code: string): Promise<InvitationCode | undefined> {
    try {
      const { invitationCodes } = await import('@shared/schema');
      const { eq, and, gt } = await import('drizzle-orm');
      const result = await this.db.query.invitationCodes.findFirst({
        where: and(
          eq(invitationCodes.code, code),
          eq(invitationCodes.isUsed, false),
          gt(invitationCodes.expiresAt, new Date())
        )
      });
      return result;
    } catch (error) {
      console.error('Error getting valid invitation code:', error);
      throw error;
    }
  }

  async logAdminAction(action: InsertAdminActionLog): Promise<AdminActionLog> {
    try {
      const { adminActionLogs } = await import('@shared/schema');
      const [newLog] = await this.db.insert(adminActionLogs).values(action).returning();
      return newLog;
    } catch (error) {
      console.error('Error logging admin action:', error);
      throw error;
    }
  }

  async getAdminActionLogs(adminId?: string, limit?: number): Promise<AdminActionLog[]> {
    try {
      const { adminActionLogs } = await import('@shared/schema');
      const { eq, desc } = await import('drizzle-orm');
      const result = await this.db.query.adminActionLogs.findMany({
        where: adminId ? eq(adminActionLogs.adminId, adminId) : undefined,
        orderBy: [desc(adminActionLogs.timestamp)],
        limit
      });
      return result;
    } catch (error) {
      console.error('Error getting admin action logs:', error);
      throw error;
    }
  }

  async getBenchmarkingStats(): Promise<{ activeBenchmarks: number; completedBenchmarks: number; failedBenchmarks: number; avgBenchmarkTime: number; }> {
    try {
      const { vmBenchmarks } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const allBenchmarks = await this.db.query.vmBenchmarks.findMany();
      const active = allBenchmarks.filter(b => b.status === 'running' || b.status === 'pending');
      const completed = allBenchmarks.filter(b => b.status === 'completed');
      const failed = allBenchmarks.filter(b => b.status === 'failed');
      
      const avgTime = completed.length > 0
        ? completed.reduce((sum, b) => {
            if (b.startedAt && b.completedAt) {
              return sum + (b.completedAt.getTime() - b.startedAt.getTime());
            }
            return sum;
          }, 0) / completed.length / 1000
        : 0;
      
      return {
        activeBenchmarks: active.length,
        completedBenchmarks: completed.length,
        failedBenchmarks: failed.length,
        avgBenchmarkTime: avgTime
      };
    } catch (error) {
      console.error('Error getting benchmarking stats:', error);
      throw error;
    }
  }

  async createChangeProposal(proposal: InsertChangeProposal): Promise<ChangeProposal> {
    try {
      const { changeProposals } = await import('@shared/schema');
      const [newProposal] = await this.db.insert(changeProposals).values(proposal).returning();
      return newProposal;
    } catch (error) {
      console.error('Error creating change proposal:', error);
      throw error;
    }
  }

  async getChangeProposal(id: string): Promise<ChangeProposal | undefined> {
    try {
      const result = await this.db.query.changeProposals.findFirst({
        where: (changeProposals: any, { eq }: any) => eq(changeProposals.id, id)
      });
      return result;
    } catch (error) {
      console.error('Error getting change proposal:', error);
      throw error;
    }
  }

  async getAllChangeProposals(status?: string): Promise<ChangeProposal[]> {
    try {
      const { changeProposals } = await import('@shared/schema');
      const { eq, desc } = await import('drizzle-orm');
      const result = await this.db.query.changeProposals.findMany({
        where: status ? eq(changeProposals.status, status) : undefined,
        orderBy: [desc(changeProposals.createdAt)]
      });
      return result;
    } catch (error) {
      console.error('Error getting all change proposals:', error);
      throw error;
    }
  }

  async updateChangeProposal(id: string, updates: Partial<ChangeProposal>): Promise<ChangeProposal | undefined> {
    try {
      const { changeProposals } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const [updated] = await this.db.update(changeProposals)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(changeProposals.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating change proposal:', error);
      throw error;
    }
  }

  async deleteChangeProposal(id: string): Promise<boolean> {
    try {
      const { changeProposals } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      await this.db.delete(changeProposals).where(eq(changeProposals.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting change proposal:', error);
      return false;
    }
  }

  async createTool(tool: InsertTool): Promise<Tool> {
    try {
      const { tools } = await import('@shared/schema');
      const [newTool] = await this.db.insert(tools).values(tool).returning();
      return newTool;
    } catch (error) {
      console.error('Error creating tool:', error);
      throw error;
    }
  }

  async getTool(id: string): Promise<Tool | undefined> {
    try {
      const result = await this.db.query.tools.findFirst({
        where: (tools: any, { eq }: any) => eq(tools.id, id)
      });
      return result;
    } catch (error) {
      console.error('Error getting tool:', error);
      throw error;
    }
  }

  async getToolByName(name: string): Promise<Tool | undefined> {
    try {
      const result = await this.db.query.tools.findFirst({
        where: (tools: any, { eq }: any) => eq(tools.name, name)
      });
      return result;
    } catch (error) {
      console.error('Error getting tool by name:', error);
      throw error;
    }
  }

  async getAllTools(status?: string): Promise<Tool[]> {
    try {
      const { tools } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const result = await this.db.query.tools.findMany({
        where: status ? eq(tools.status, status) : undefined
      });
      return result;
    } catch (error) {
      console.error('Error getting all tools:', error);
      throw error;
    }
  }

  async updateTool(id: string, updates: Partial<Tool>): Promise<Tool | undefined> {
    try {
      const { tools } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const [updated] = await this.db.update(tools)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(tools.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating tool:', error);
      throw error;
    }
  }

  async deleteTool(id: string): Promise<boolean> {
    try {
      const { tools } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      await this.db.delete(tools).where(eq(tools.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting tool:', error);
      return false;
    }
  }

  async incrementToolUsage(id: string): Promise<void> {
    try {
      const { tools } = await import('@shared/schema');
      const { eq, sql } = await import('drizzle-orm');
      await this.db.update(tools)
        .set({ usageCount: sql`${tools.usageCount} + 1` })
        .where(eq(tools.id, id));
    } catch (error) {
      console.error('Error incrementing tool usage:', error);
      throw error;
    }
  }

  async createUiWidget(widget: InsertUiWidget): Promise<UiWidget> {
    try {
      const { uiWidgets } = await import('@shared/schema');
      const [newWidget] = await this.db.insert(uiWidgets).values(widget).returning();
      return newWidget;
    } catch (error) {
      console.error('Error creating UI widget:', error);
      throw error;
    }
  }

  async getUiWidget(id: string): Promise<UiWidget | undefined> {
    try {
      const result = await this.db.query.uiWidgets.findFirst({
        where: (uiWidgets: any, { eq }: any) => eq(uiWidgets.id, id)
      });
      return result;
    } catch (error) {
      console.error('Error getting UI widget:', error);
      throw error;
    }
  }

  async getUiWidgetByName(name: string): Promise<UiWidget | undefined> {
    try {
      const result = await this.db.query.uiWidgets.findFirst({
        where: (uiWidgets: any, { eq }: any) => eq(uiWidgets.name, name)
      });
      return result;
    } catch (error) {
      console.error('Error getting UI widget by name:', error);
      throw error;
    }
  }

  async getAllUiWidgets(status?: string): Promise<UiWidget[]> {
    try {
      const { uiWidgets } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const result = await this.db.query.uiWidgets.findMany({
        where: status ? eq(uiWidgets.status, status) : undefined
      });
      return result;
    } catch (error) {
      console.error('Error getting all UI widgets:', error);
      throw error;
    }
  }

  async updateUiWidget(id: string, updates: Partial<UiWidget>): Promise<UiWidget | undefined> {
    try {
      const { uiWidgets } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const [updated] = await this.db.update(uiWidgets)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(uiWidgets.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating UI widget:', error);
      throw error;
    }
  }

  async deleteUiWidget(id: string): Promise<boolean> {
    try {
      const { uiWidgets } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      await this.db.delete(uiWidgets).where(eq(uiWidgets.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting UI widget:', error);
      return false;
    }
  }

  async incrementUiWidgetUsage(id: string): Promise<void> {
    try {
      const { uiWidgets } = await import('@shared/schema');
      const { eq, sql } = await import('drizzle-orm');
      await this.db.update(uiWidgets)
        .set({ usageCount: sql`${uiWidgets.usageCount} + 1` })
        .where(eq(uiWidgets.id, id));
    } catch (error) {
      console.error('Error incrementing UI widget usage:', error);
      throw error;
    }
  }

  async createRegistryFeatureFlag(flag: InsertRegistryFeatureFlag): Promise<RegistryFeatureFlag> {
    try {
      const { registryFeatureFlags } = await import('@shared/schema');
      const [newFlag] = await this.db.insert(registryFeatureFlags).values(flag).returning();
      return newFlag;
    } catch (error) {
      console.error('Error creating registry feature flag:', error);
      throw error;
    }
  }

  async getRegistryFeatureFlag(id: string): Promise<RegistryFeatureFlag | undefined> {
    try {
      const result = await this.db.query.registryFeatureFlags.findFirst({
        where: (registryFeatureFlags: any, { eq }: any) => eq(registryFeatureFlags.id, id)
      });
      return result;
    } catch (error) {
      console.error('Error getting registry feature flag:', error);
      throw error;
    }
  }

  async getRegistryFeatureFlagByKey(key: string): Promise<RegistryFeatureFlag | undefined> {
    try {
      const result = await this.db.query.registryFeatureFlags.findFirst({
        where: (registryFeatureFlags: any, { eq }: any) => eq(registryFeatureFlags.key, key)
      });
      return result;
    } catch (error) {
      console.error('Error getting registry feature flag by key:', error);
      throw error;
    }
  }

  async getAllRegistryFeatureFlags(status?: string): Promise<RegistryFeatureFlag[]> {
    try {
      const { registryFeatureFlags } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const result = await this.db.query.registryFeatureFlags.findMany({
        where: status ? eq(registryFeatureFlags.status, status) : undefined
      });
      return result;
    } catch (error) {
      console.error('Error getting all registry feature flags:', error);
      throw error;
    }
  }

  async updateRegistryFeatureFlag(id: string, updates: Partial<RegistryFeatureFlag>): Promise<RegistryFeatureFlag | undefined> {
    try {
      const { registryFeatureFlags } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const [updated] = await this.db.update(registryFeatureFlags)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(registryFeatureFlags.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating registry feature flag:', error);
      throw error;
    }
  }

  async deleteRegistryFeatureFlag(id: string): Promise<boolean> {
    try {
      const { registryFeatureFlags } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      await this.db.delete(registryFeatureFlags).where(eq(registryFeatureFlags.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting registry feature flag:', error);
      return false;
    }
  }

  async isRegistryFeatureEnabled(key: string, userId?: string, accessLevel?: string): Promise<boolean> {
    try {
      const flag = await this.getRegistryFeatureFlagByKey(key);
      if (!flag || flag.status !== 'active') return false;
      
      const enabledFor: any = flag.enabledFor;
      if (!enabledFor) return false;
      
      if (Array.isArray(enabledFor.userIds) && userId && enabledFor.userIds.includes(userId)) return true;
      if (Array.isArray(enabledFor.accessLevels) && accessLevel && enabledFor.accessLevels.includes(accessLevel)) return true;
      if (typeof enabledFor.percentage === 'number' && Math.random() * 100 < enabledFor.percentage) return true;
      
      return false;
    } catch (error) {
      console.error('Error checking if registry feature is enabled:', error);
      return false;
    }
  }

  async createOracleInstance(oracle: InsertOracleInstance): Promise<OracleInstance> {
    try {
      const { oracleInstances } = await import('@shared/schema');
      const [newOracle] = await this.db.insert(oracleInstances).values(oracle).returning();
      return newOracle;
    } catch (error) {
      console.error('Error creating oracle instance:', error);
      throw error;
    }
  }

  async getOracleInstance(id: string): Promise<OracleInstance | undefined> {
    try {
      const result = await this.db.query.oracleInstances.findFirst({
        where: (oracleInstances: any, { eq }: any) => eq(oracleInstances.id, id)
      });
      return result;
    } catch (error) {
      console.error('Error getting oracle instance:', error);
      throw error;
    }
  }

  async getUserOracleInstances(userId: string): Promise<OracleInstance[]> {
    try {
      const { oracleInstances } = await import('@shared/schema');
      const { eq, desc } = await import('drizzle-orm');
      const result = await this.db.query.oracleInstances.findMany({
        where: eq(oracleInstances.userId, userId),
        orderBy: [desc(oracleInstances.createdAt)]
      });
      return result;
    } catch (error) {
      console.error('Error getting user oracle instances:', error);
      throw error;
    }
  }

  async getAllOracleInstances(): Promise<OracleInstance[]> {
    try {
      const { oracleInstances } = await import('@shared/schema');
      const { desc } = await import('drizzle-orm');
      const result = await this.db.query.oracleInstances.findMany({
        orderBy: [desc(oracleInstances.createdAt)]
      });
      return result;
    } catch (error) {
      console.error('Error getting all oracle instances:', error);
      throw error;
    }
  }

  async updateOracleInstance(id: string, updates: Partial<OracleInstance>): Promise<OracleInstance | undefined> {
    try {
      const { oracleInstances } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const [updated] = await this.db.update(oracleInstances)
        .set(updates)
        .where(eq(oracleInstances.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating oracle instance:', error);
      throw error;
    }
  }

  async deleteOracleInstance(id: string): Promise<boolean> {
    try {
      const { oracleInstances } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      await this.db.delete(oracleInstances).where(eq(oracleInstances.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting oracle instance:', error);
      return false;
    }
  }

  async createOracleQuery(query: InsertOracleQuery): Promise<OracleQuery> {
    try {
      const { oracleQueries } = await import('@shared/schema');
      const [newQuery] = await this.db.insert(oracleQueries).values(query).returning();
      return newQuery;
    } catch (error) {
      console.error('Error creating oracle query:', error);
      throw error;
    }
  }

  async getOracleQuery(id: string): Promise<OracleQuery | undefined> {
    try {
      const result = await this.db.query.oracleQueries.findFirst({
        where: (oracleQueries: any, { eq }: any) => eq(oracleQueries.id, id)
      });
      return result;
    } catch (error) {
      console.error('Error getting oracle query:', error);
      throw error;
    }
  }

  async getUserOracleQueries(userId: string, limit?: number): Promise<OracleQuery[]> {
    try {
      const { oracleQueries } = await import('@shared/schema');
      const { eq, desc } = await import('drizzle-orm');
      const result = await this.db.query.oracleQueries.findMany({
        where: eq(oracleQueries.userId, userId),
        orderBy: [desc(oracleQueries.createdAt)],
        limit
      });
      return result;
    } catch (error) {
      console.error('Error getting user oracle queries:', error);
      throw error;
    }
  }

  async getOracleQueries(oracleId?: string, limit?: number): Promise<OracleQuery[]> {
    try {
      const { oracleQueries } = await import('@shared/schema');
      const { eq, desc } = await import('drizzle-orm');
      const result = await this.db.query.oracleQueries.findMany({
        where: oracleId ? eq(oracleQueries.oracleId, oracleId) : undefined,
        orderBy: [desc(oracleQueries.createdAt)],
        limit
      });
      return result;
    } catch (error) {
      console.error('Error getting oracle queries:', error);
      throw error;
    }
  }

  async createHarmonicProcessing(processing: InsertHarmonicProcessing): Promise<HarmonicProcessing> {
    try {
      const { harmonicProcessing } = await import('@shared/schema');
      const [newProcessing] = await this.db.insert(harmonicProcessing).values(processing).returning();
      return newProcessing;
    } catch (error) {
      console.error('Error creating harmonic processing:', error);
      throw error;
    }
  }

  async getHarmonicProcessing(id: string): Promise<HarmonicProcessing | undefined> {
    try {
      const result = await this.db.query.harmonicProcessing.findFirst({
        where: (harmonicProcessing: any, { eq }: any) => eq(harmonicProcessing.id, id)
      });
      return result;
    } catch (error) {
      console.error('Error getting harmonic processing:', error);
      throw error;
    }
  }

  async getFileHarmonicProcessing(fileId: string): Promise<HarmonicProcessing[]> {
    try {
      const { harmonicProcessing } = await import('@shared/schema');
      const { eq, desc } = await import('drizzle-orm');
      const result = await this.db.query.harmonicProcessing.findMany({
        where: eq(harmonicProcessing.fileId, fileId),
        orderBy: [desc(harmonicProcessing.createdAt)]
      });
      return result;
    } catch (error) {
      console.error('Error getting file harmonic processing:', error);
      throw error;
    }
  }

  async getUserHarmonicProcessing(userId: string, limit?: number): Promise<HarmonicProcessing[]> {
    try {
      const { harmonicProcessing } = await import('@shared/schema');
      const { eq, desc } = await import('drizzle-orm');
      const result = await this.db.query.harmonicProcessing.findMany({
        where: eq(harmonicProcessing.userId, userId),
        orderBy: [desc(harmonicProcessing.createdAt)],
        limit
      });
      return result;
    } catch (error) {
      console.error('Error getting user harmonic processing:', error);
      throw error;
    }
  }

  async updateHarmonicProcessing(id: string, updates: Partial<HarmonicProcessing>): Promise<HarmonicProcessing | undefined> {
    try {
      const { harmonicProcessing } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const [updated] = await this.db.update(harmonicProcessing)
        .set(updates)
        .where(eq(harmonicProcessing.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating harmonic processing:', error);
      throw error;
    }
  }

  async createKnowledgePack(pack: InsertKnowledgePack): Promise<KnowledgePack> {
    try {
      const { knowledgePacks } = await import('@shared/schema');
      const [newPack] = await this.db.insert(knowledgePacks).values(pack).returning();
      return newPack;
    } catch (error) {
      console.error('Error creating knowledge pack:', error);
      throw error;
    }
  }

  async getKnowledgePack(id: string): Promise<KnowledgePack | undefined> {
    try {
      const result = await this.db.query.knowledgePacks.findFirst({
        where: (knowledgePacks: any, { eq }: any) => eq(knowledgePacks.id, id)
      });
      return result;
    } catch (error) {
      console.error('Error getting knowledge pack:', error);
      throw error;
    }
  }

  async getUserKnowledgePacks(userId: string, limit?: number): Promise<KnowledgePack[]> {
    try {
      const { knowledgePacks } = await import('@shared/schema');
      const { eq, desc } = await import('drizzle-orm');
      const result = await this.db.query.knowledgePacks.findMany({
        where: eq(knowledgePacks.userId, userId),
        orderBy: [desc(knowledgePacks.createdAt)],
        limit
      });
      return result;
    } catch (error) {
      console.error('Error getting user knowledge packs:', error);
      throw error;
    }
  }

  async getKnowledgePacksByCategory(category: string, limit?: number): Promise<KnowledgePack[]> {
    try {
      const { knowledgePacks } = await import('@shared/schema');
      const { eq, desc } = await import('drizzle-orm');
      const result = await this.db.query.knowledgePacks.findMany({
        where: eq(knowledgePacks.category, category),
        orderBy: [desc(knowledgePacks.createdAt)],
        limit
      });
      return result;
    } catch (error) {
      console.error('Error getting knowledge packs by category:', error);
      throw error;
    }
  }

  async updateKnowledgePack(id: string, updates: Partial<KnowledgePack>): Promise<KnowledgePack | undefined> {
    try {
      const { knowledgePacks } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const [updated] = await this.db.update(knowledgePacks)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(knowledgePacks.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating knowledge pack:', error);
      throw error;
    }
  }

  async deleteKnowledgePack(id: string): Promise<boolean> {
    try {
      const { knowledgePacks } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      await this.db.delete(knowledgePacks).where(eq(knowledgePacks.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting knowledge pack:', error);
      return false;
    }
  }

  async createKnowledgeEmbedding(embedding: InsertKnowledgeEmbedding): Promise<KnowledgeEmbedding> {
    try {
      const { knowledgeEmbeddings } = await import('@shared/schema');
      const [newEmbedding] = await this.db.insert(knowledgeEmbeddings).values(embedding).returning();
      return newEmbedding;
    } catch (error) {
      console.error('Error creating knowledge embedding:', error);
      throw error;
    }
  }

  async getKnowledgeEmbedding(id: string): Promise<KnowledgeEmbedding | undefined> {
    try {
      const result = await this.db.query.knowledgeEmbeddings.findFirst({
        where: (knowledgeEmbeddings: any, { eq }: any) => eq(knowledgeEmbeddings.id, id)
      });
      return result;
    } catch (error) {
      console.error('Error getting knowledge embedding:', error);
      throw error;
    }
  }

  async getPackEmbeddings(packId: string, limit?: number): Promise<KnowledgeEmbedding[]> {
    try {
      const { knowledgeEmbeddings } = await import('@shared/schema');
      const { eq, desc } = await import('drizzle-orm');
      const result = await this.db.query.knowledgeEmbeddings.findMany({
        where: eq(knowledgeEmbeddings.packId, packId),
        orderBy: [desc(knowledgeEmbeddings.spectralRank)],
        limit
      });
      return result;
    } catch (error) {
      console.error('Error getting pack embeddings:', error);
      throw error;
    }
  }

  async searchEmbeddingsByContent(packId: string, content: string, limit?: number): Promise<KnowledgeEmbedding[]> {
    try {
      const { knowledgeEmbeddings } = await import('@shared/schema');
      const { eq, like, and } = await import('drizzle-orm');
      const result = await this.db.query.knowledgeEmbeddings.findMany({
        where: and(
          eq(knowledgeEmbeddings.packId, packId),
          like(knowledgeEmbeddings.content, `%${content}%`)
        ),
        limit
      });
      return result;
    } catch (error) {
      console.error('Error searching embeddings by content:', error);
      throw error;
    }
  }

  async getEmbeddingsBySpectralRank(packId: string, minRank: number, limit?: number): Promise<KnowledgeEmbedding[]> {
    try {
      const { knowledgeEmbeddings } = await import('@shared/schema');
      const { eq, gte, and, desc } = await import('drizzle-orm');
      const result = await this.db.query.knowledgeEmbeddings.findMany({
        where: and(
          eq(knowledgeEmbeddings.packId, packId),
          gte(knowledgeEmbeddings.spectralRank, minRank)
        ),
        orderBy: [desc(knowledgeEmbeddings.spectralRank)],
        limit
      });
      return result;
    } catch (error) {
      console.error('Error getting embeddings by spectral rank:', error);
      throw error;
    }
  }

  async updateKnowledgeEmbedding(id: string, updates: Partial<KnowledgeEmbedding>): Promise<KnowledgeEmbedding | undefined> {
    try {
      const { knowledgeEmbeddings } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const [updated] = await this.db.update(knowledgeEmbeddings)
        .set(updates)
        .where(eq(knowledgeEmbeddings.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating knowledge embedding:', error);
      throw error;
    }
  }

  async createKnowledgeCitation(citation: InsertKnowledgeCitation): Promise<KnowledgeCitation> {
    try {
      const { knowledgeCitations } = await import('@shared/schema');
      const [newCitation] = await this.db.insert(knowledgeCitations).values(citation).returning();
      return newCitation;
    } catch (error) {
      console.error('Error creating knowledge citation:', error);
      throw error;
    }
  }

  async getKnowledgeCitation(id: string): Promise<KnowledgeCitation | undefined> {
    try {
      const result = await this.db.query.knowledgeCitations.findFirst({
        where: (knowledgeCitations: any, { eq }: any) => eq(knowledgeCitations.id, id)
      });
      return result;
    } catch (error) {
      console.error('Error getting knowledge citation:', error);
      throw error;
    }
  }

  async getEmbeddingCitations(embeddingId: string): Promise<KnowledgeCitation[]> {
    try {
      const { knowledgeCitations } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const result = await this.db.query.knowledgeCitations.findMany({
        where: eq(knowledgeCitations.embeddingId, embeddingId)
      });
      return result;
    } catch (error) {
      console.error('Error getting embedding citations:', error);
      throw error;
    }
  }

  async getCitationsBySource(sourceTitle: string, limit?: number): Promise<KnowledgeCitation[]> {
    try {
      const { knowledgeCitations } = await import('@shared/schema');
      const { like } = await import('drizzle-orm');
      const result = await this.db.query.knowledgeCitations.findMany({
        where: like(knowledgeCitations.sourceTitle, `%${sourceTitle}%`),
        limit
      });
      return result;
    } catch (error) {
      console.error('Error getting citations by source:', error);
      throw error;
    }
  }

  async createLearningMetric(metric: InsertLearningMetric): Promise<LearningMetric> {
    try {
      const { learningMetrics } = await import('@shared/schema');
      const [newMetric] = await this.db.insert(learningMetrics).values(metric).returning();
      return newMetric;
    } catch (error) {
      console.error('Error creating learning metric:', error);
      throw error;
    }
  }

  async getPackLearningMetrics(packId: string, metricType?: string, limit?: number): Promise<LearningMetric[]> {
    try {
      const { learningMetrics } = await import('@shared/schema');
      const { eq, and, desc } = await import('drizzle-orm');
      
      const conditions = [eq(learningMetrics.packId, packId)];
      if (metricType) conditions.push(eq(learningMetrics.metricType, metricType));
      
      const result = await this.db.query.learningMetrics.findMany({
        where: and(...conditions),
        orderBy: [desc(learningMetrics.timestamp)],
        limit
      });
      return result;
    } catch (error) {
      console.error('Error getting pack learning metrics:', error);
      throw error;
    }
  }

  async getLatestLearningMetric(packId: string, metricType: string): Promise<LearningMetric | undefined> {
    try {
      const { learningMetrics } = await import('@shared/schema');
      const { eq, and, desc } = await import('drizzle-orm');
      const result = await this.db.query.learningMetrics.findFirst({
        where: and(
          eq(learningMetrics.packId, packId),
          eq(learningMetrics.metricType, metricType)
        ),
        orderBy: [desc(learningMetrics.timestamp)]
      });
      return result;
    } catch (error) {
      console.error('Error getting latest learning metric:', error);
      throw error;
    }
  }

  async createHkmQuery(query: InsertHkmQuery): Promise<HkmQuery> {
    try {
      const { hkmQueries } = await import('@shared/schema');
      const [newQuery] = await this.db.insert(hkmQueries).values(query).returning();
      return newQuery;
    } catch (error) {
      console.error('Error creating HKM query:', error);
      throw error;
    }
  }

  async getHkmQuery(id: string): Promise<HkmQuery | undefined> {
    try {
      const result = await this.db.query.hkmQueries.findFirst({
        where: (hkmQueries: any, { eq }: any) => eq(hkmQueries.id, id)
      });
      return result;
    } catch (error) {
      console.error('Error getting HKM query:', error);
      throw error;
    }
  }

  async getUserHkmQueries(userId: string, limit?: number): Promise<HkmQuery[]> {
    try {
      const { hkmQueries } = await import('@shared/schema');
      const { eq, desc } = await import('drizzle-orm');
      const result = await this.db.query.hkmQueries.findMany({
        where: eq(hkmQueries.userId, userId),
        orderBy: [desc(hkmQueries.createdAt)],
        limit
      });
      return result;
    } catch (error) {
      console.error('Error getting user HKM queries:', error);
      throw error;
    }
  }

  async getHkmQueriesByType(queryType: string, limit?: number): Promise<HkmQuery[]> {
    try {
      const { hkmQueries } = await import('@shared/schema');
      const { eq, desc } = await import('drizzle-orm');
      const result = await this.db.query.hkmQueries.findMany({
        where: eq(hkmQueries.queryType, queryType),
        orderBy: [desc(hkmQueries.createdAt)],
        limit
      });
      return result;
    } catch (error) {
      console.error('Error getting HKM queries by type:', error);
      throw error;
    }
  }

  async createJobApplication(application: InsertJobApplication): Promise<JobApplication> {
    try {
      const { jobApplications } = await import('@shared/schema');
      const [newApp] = await this.db.insert(jobApplications).values(application).returning();
      return newApp;
    } catch (error) {
      console.error('Error creating job application:', error);
      throw error;
    }
  }

  async getJobApplication(id: string): Promise<JobApplication | undefined> {
    try {
      const result = await this.db.query.jobApplications.findFirst({
        where: (jobApplications: any, { eq }: any) => eq(jobApplications.id, id)
      });
      return result;
    } catch (error) {
      console.error('Error getting job application:', error);
      throw error;
    }
  }

  async getAllJobApplications(): Promise<JobApplication[]> {
    try {
      const { jobApplications } = await import('@shared/schema');
      const { desc } = await import('drizzle-orm');
      const result = await this.db.query.jobApplications.findMany({
        orderBy: [desc(jobApplications.appliedAt)]
      });
      return result;
    } catch (error) {
      console.error('Error getting all job applications:', error);
      throw error;
    }
  }

  async getJobApplicationsByPosition(position: string): Promise<JobApplication[]> {
    try {
      const { jobApplications } = await import('@shared/schema');
      const { eq, desc } = await import('drizzle-orm');
      const result = await this.db.query.jobApplications.findMany({
        where: eq(jobApplications.position, position),
        orderBy: [desc(jobApplications.appliedAt)]
      });
      return result;
    } catch (error) {
      console.error('Error getting job applications by position:', error);
      throw error;
    }
  }
}

// Switch to DbStorage for persistent PostgreSQL storage
export const storage = new DbStorage();
