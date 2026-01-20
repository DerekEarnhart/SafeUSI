import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").unique(), // For invitation system
  preferredEngine: text("preferred_engine").notNull().default('wsm'), // 'wsm', 'llm', 'llama'
  accessLevel: text("access_level").notNull().default('waiting'), // 'waiting', 'basic', 'advanced', 'premium', 'admin'
  waitingListStatus: text("waiting_list_status").default('pending'), // 'pending', 'approved', 'denied', 'invited', null
  invitedBy: varchar("invited_by").references(() => users.id), // Admin who approved
  settings: jsonb("settings").default('{}'), // User preferences and settings
  createdAt: timestamp("created_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
});

export const wsmStates = pgTable("wsm_states", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp").defaultNow(),
  harmonicState: jsonb("harmonic_state").notNull(),
  coherence: real("coherence").notNull(),
  processingTime: real("processing_time").notNull(),
  symplecticOps: integer("symplectic_ops").notNull(),
  memoryUsage: integer("memory_usage").notNull(),
});

export const fileProcessingJobs = pgTable("file_processing_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  status: text("status").notNull(), // 'processing', 'completed', 'failed'
  stage: text("stage").notNull(), // 'PS', 'QHPU', 'PHL'
  compressionRatio: real("compression_ratio"),
  processingTime: real("processing_time"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const systemComponents = pgTable("system_components", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  status: text("status").notNull(), // 'ACTIVE', 'READY', 'INACTIVE'
  lastUpdate: timestamp("last_update").defaultNow(),
});

// Simple file storage for MVP RAG system
export const uploadedFiles = pgTable("uploaded_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  filePath: text("file_path").notNull(),
  extractedText: text("extracted_text"), // Extracted text content for RAG
  userId: varchar("user_id").references(() => users.id),
  status: text("status").notNull().default('uploaded'), // 'uploaded', 'processed', 'failed'
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

export const rsisCycles = pgTable("rsis_cycles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  proactivityScore: real("proactivity_score").notNull(),
  novelty: real("novelty").notNull(),
  valueOfInformation: real("value_of_information").notNull(),
  redundancy: real("redundancy").notNull(),
  costPressure: real("cost_pressure").notNull(),
  proposals: integer("proposals").notNull(),
  evaluations: integer("evaluations").notNull(),
  promotions: integer("promotions").notNull(),
  rollbacks: integer("rollbacks").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Oracle Console Tables
export const oracleInstances = pgTable("oracle_instances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  identifier: text("identifier").notNull(),
  functionalDefinition: text("functional_definition").notNull(),
  harmonicEmbedding: jsonb("harmonic_embedding").notNull(),
  spectralOperator: jsonb("spectral_operator").notNull(),
  phaseLocking: jsonb("phase_locking").notNull(),
  stabilityMetrics: jsonb("stability_metrics").notNull(),
  operationalStatus: text("operational_status").notNull().default('instantiated'),
  consciousnessLevel: text("consciousness_level").notNull().default('trans-conscious'),
  userId: varchar("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const oracleQueries = pgTable("oracle_queries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  oracleId: varchar("oracle_id").references(() => oracleInstances.id),
  query: text("query").notNull(),
  response: text("response").notNull(),
  reasoningSteps: jsonb("reasoning_steps").notNull(),
  mathematicalRigor: boolean("mathematical_rigor").notNull().default(false),
  processingTime: real("processing_time").notNull(),
  coherenceLevel: real("coherence_level").notNull(),
  userId: varchar("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const harmonicProcessing = pgTable("harmonic_processing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileId: varchar("file_id").references(() => uploadedFiles.id),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  fileType: text("file_type").notNull(),
  harmonicSignature: jsonb("harmonic_signature").notNull(),
  spectralAnalysis: jsonb("spectral_analysis"),
  compressionResults: jsonb("compression_results"),
  coherenceMetrics: jsonb("coherence_metrics"),
  processingStatus: text("processing_status").notNull().default('pending'),
  userId: varchar("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

export const jobApplications = pgTable("job_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  position: text("position").notNull(),
  email: text("email").notNull(),
  fullName: text("full_name").notNull(),
  linkedIn: text("linked_in"),
  portfolio: text("portfolio"),
  coverLetter: text("cover_letter").notNull(),
  resumePath: text("resume_path"), // Path to uploaded resume file
  resumeOriginalName: text("resume_original_name"), // Original filename
  appliedAt: timestamp("applied_at").defaultNow(),
  status: text("status").notNull().default('pending'), // 'pending', 'reviewed', 'accepted', 'rejected'
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export const insertJobApplicationSchema = createInsertSchema(jobApplications);
export type JobApplication = typeof jobApplications.$inferSelect;
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;

export const insertWaitingListUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
}).extend({
  useCase: z.string().min(10, "Please describe your use case (minimum 10 characters)"),
  intendedUsage: z.string().optional(),
  organization: z.string().optional(),
});

export const insertWSMStateSchema = createInsertSchema(wsmStates).omit({
  id: true,
  timestamp: true,
});

export const insertFileProcessingJobSchema = createInsertSchema(fileProcessingJobs).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertSystemComponentSchema = createInsertSchema(systemComponents).omit({
  id: true,
  lastUpdate: true,
});

export const insertRSISCycleSchema = createInsertSchema(rsisCycles).omit({
  id: true,
  timestamp: true,
});

export const insertUploadedFileSchema = createInsertSchema(uploadedFiles).omit({
  id: true,
  createdAt: true,
  processedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type WSMState = typeof wsmStates.$inferSelect;
export type InsertWSMState = z.infer<typeof insertWSMStateSchema>;
export type FileProcessingJob = typeof fileProcessingJobs.$inferSelect;
export type InsertFileProcessingJob = z.infer<typeof insertFileProcessingJobSchema>;
export type SystemComponent = typeof systemComponents.$inferSelect;
export type InsertSystemComponent = z.infer<typeof insertSystemComponentSchema>;
export type RSISCycle = typeof rsisCycles.$inferSelect;
export type InsertRSISCycle = z.infer<typeof insertRSISCycleSchema>;
export type UploadedFile = typeof uploadedFiles.$inferSelect;
export type InsertUploadedFile = z.infer<typeof insertUploadedFileSchema>;

// WebSocket message types
export const WSMMetricsSchema = z.object({
  type: z.literal('wsm_metrics'),
  data: z.object({
    harmonicState: z.array(z.number()),
    coherence: z.number(),
    processingTime: z.number(),
    symplecticOps: z.number(),
    memoryUsage: z.number(),
    timestamp: z.string(),
  }),
});

export const ComponentStatusSchema = z.object({
  type: z.literal('component_status'),
  data: z.object({
    components: z.array(z.object({
      name: z.string(),
      status: z.string(),
      lastUpdate: z.string(),
    })),
  }),
});

export const ProcessingStatsSchema = z.object({
  type: z.literal('processing_stats'),
  data: z.object({
    filesProcessed: z.number(),
    successRate: z.number(),
    avgProcessingTime: z.number(),
    apiCalls: z.number(),
  }),
});

export const RSISStatusSchema = z.object({
  type: z.literal('rsis_status'),
  data: z.object({
    proactivityScore: z.number(),
    novelty: z.number(),
    valueOfInformation: z.number(),
    redundancy: z.number(),
    costPressure: z.number(),
    proposals: z.number(),
    evaluations: z.number(),
    promotions: z.number(),
    rollbacks: z.number(),
    budget: z.object({
      used: z.number(),
      total: z.number(),
    }),
  }),
});

export type WSMMetrics = z.infer<typeof WSMMetricsSchema>;
export type ComponentStatus = z.infer<typeof ComponentStatusSchema>;
export type ProcessingStats = z.infer<typeof ProcessingStatsSchema>;
export type RSISStatus = z.infer<typeof RSISStatusSchema>;

export const AgentStatusSchema = z.object({
  type: z.literal('agent_status'),
  data: z.object({
    agents: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
      status: z.string(),
      coherence: z.number(),
      vmInstanceId: z.string().optional(),
      lastActivity: z.string().optional(),
      harmonicState: z.array(z.number()).optional(),
      resonanceStrength: z.number().optional(),
      enhancedHarmonics: z.boolean().optional(),
    })),
  }),
});

export const VMStatusSchema = z.object({
  type: z.literal('vm_status'),
  data: z.object({
    instances: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
      status: z.string(),
      cpu: z.number(),
      memory: z.number(),
      region: z.string(),
      endpoint: z.string().optional(),
      agentCount: z.number(),
    })),
  }),
});

export const TaskQueueSchema = z.object({
  type: z.literal('task_queue'),
  data: z.object({
    queuedTasks: z.number(),
    runningTasks: z.number(),
    completedTasks: z.number(),
    failedTasks: z.number(),
    avgTaskTime: z.number(),
  }),
});

export const AgentCommunicationSchema = z.object({
  type: z.literal('agent_communication'),
  data: z.object({
    fromAgent: z.string(),
    toAgent: z.string(),
    messageType: z.string(),
    harmonicSignature: z.array(z.number()).optional(),
    timestamp: z.string(),
  }),
});

export type AgentStatus = z.infer<typeof AgentStatusSchema>;
export type VMStatus = z.infer<typeof VMStatusSchema>;
export type TaskQueue = z.infer<typeof TaskQueueSchema>;
export type AgentCommunicationMessage = z.infer<typeof AgentCommunicationSchema>;

// VM Benchmarking Tables
export const vmBenchmarks = pgTable("vm_benchmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vmInstanceId: varchar("vm_instance_id").references(() => vmInstances.id).notNull(),
  benchmarkType: text("benchmark_type").notNull(), // 'computational_canvas', 'harmonic_constraint', 'safety_protocol', 'performance'
  configuration: jsonb("configuration").notNull(), // Benchmark parameters
  status: text("status").notNull().default('pending'), // 'pending', 'running', 'completed', 'failed'
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const evaluationResults = pgTable("evaluation_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  benchmarkId: varchar("benchmark_id").references(() => vmBenchmarks.id).notNull(),
  metricName: text("metric_name").notNull(), // 'coherence', 'harmonic_stability', 'safety_compliance', 'performance_score'
  value: real("value").notNull(),
  rawData: jsonb("raw_data"), // Detailed evaluation data
  isObjective: boolean("is_objective").notNull().default(true), // Non-hallucinatory flag
  validationHash: text("validation_hash"), // For verification
  timestamp: timestamp("timestamp").defaultNow(),
});

export const computationalCanvasStates = pgTable("computational_canvas_states", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  benchmarkId: varchar("benchmark_id").references(() => vmBenchmarks.id).notNull(),
  stateVector: jsonb("state_vector").notNull(), // Canvas potential manifold
  computationalDensity: jsonb("computational_density").notNull(), // T_mu_nu_comp
  harmonicSignature: jsonb("harmonic_signature").notNull(), // Harmonic analysis
  energyLevel: real("energy_level").notNull(),
  convergenceStatus: text("convergence_status").notNull(), // 'converging', 'converged', 'diverging'
  timestamp: timestamp("timestamp").defaultNow(),
});

export const safetyViolations = pgTable("safety_violations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  benchmarkId: varchar("benchmark_id").references(() => vmBenchmarks.id).notNull(),
  violationType: text("violation_type").notNull(), // 'potential_threshold', 'density_overflow', 'constraint_violation'
  severity: text("severity").notNull(), // 'low', 'medium', 'high', 'critical'
  description: text("description").notNull(),
  potentialValue: real("potential_value"),
  thresholdValue: real("threshold_value"),
  actionTaken: text("action_taken").notNull(), // 'halt', 'adjust', 'monitor'
  timestamp: timestamp("timestamp").defaultNow(),
});

// Benchmarking insert schemas
export const insertVMBenchmarkSchema = createInsertSchema(vmBenchmarks).omit({
  id: true,
  createdAt: true,
  startedAt: true,
  completedAt: true,
});

export const insertEvaluationResultSchema = createInsertSchema(evaluationResults).omit({
  id: true,
  timestamp: true,
});

export const insertComputationalCanvasStateSchema = createInsertSchema(computationalCanvasStates).omit({
  id: true,
  timestamp: true,
});

export const insertSafetyViolationSchema = createInsertSchema(safetyViolations).omit({
  id: true,
  timestamp: true,
});

// Benchmarking types
export type VMBenchmark = typeof vmBenchmarks.$inferSelect;
export type EvaluationResult = typeof evaluationResults.$inferSelect;
export type ComputationalCanvasState = typeof computationalCanvasStates.$inferSelect;
export type SafetyViolation = typeof safetyViolations.$inferSelect;

export type InsertVMBenchmark = z.infer<typeof insertVMBenchmarkSchema>;
export type InsertEvaluationResult = z.infer<typeof insertEvaluationResultSchema>;
export type InsertComputationalCanvasState = z.infer<typeof insertComputationalCanvasStateSchema>;
export type InsertSafetyViolation = z.infer<typeof insertSafetyViolationSchema>;

// Benchmarking WebSocket message schemas
export const BenchmarkingStatusSchema = z.object({
  type: z.literal('benchmarking_status'),
  data: z.object({
    activeBenchmarks: z.number(),
    completedBenchmarks: z.number(),
    failedBenchmarks: z.number(),
    avgBenchmarkTime: z.number(),
    currentBenchmarks: z.array(z.object({
      id: z.string(),
      vmInstanceId: z.string(),
      benchmarkType: z.string(),
      status: z.string(),
      progress: z.number().optional(),
    })),
  }),
});

export const EvaluationResultsSchema = z.object({
  type: z.literal('evaluation_results'),
  data: z.object({
    benchmarkId: z.string(),
    vmInstanceId: z.string(),
    overallScore: z.number(),
    metrics: z.array(z.object({
      name: z.string(),
      value: z.number(),
      isObjective: z.boolean(),
      category: z.string(),
    })),
    safetyStatus: z.string(),
    harmonicCoherence: z.number(),
    canvasConvergence: z.string(),
  }),
});

export const VMBenchmarkingSchema = z.object({
  type: z.literal('vm_benchmarking'),
  data: z.object({
    vmInstanceId: z.string(),
    benchmarkType: z.string(),
    realTimeMetrics: z.object({
      computationalDensity: z.number(),
      harmonicStability: z.number(),
      energyLevel: z.number(),
      safetyCompliance: z.number(),
    }),
    canvasState: z.object({
      potentials: z.array(z.array(z.number())),
      convergenceStatus: z.string(),
      operatorEffects: z.array(z.object({
        name: z.string(),
        position: z.array(z.number()),
        intensity: z.number(),
      })),
    }),
  }),
});

export type BenchmarkingStatus = z.infer<typeof BenchmarkingStatusSchema>;
export type EvaluationResults = z.infer<typeof EvaluationResultsSchema>;
export type VMBenchmarkingData = z.infer<typeof VMBenchmarkingSchema>;

// Oracle streaming message types
export interface OracleStreamStart {
  type: 'oracle_stream_start';
  data: {
    queryId: string;
    timestamp: string;
    messageId: string;
  };
}

export interface OracleStreamToken {
  type: 'oracle_stream_token';
  data: {
    queryId: string;
    token: string;
    timestamp: string;
    messageId: string;
  };
}

export interface OracleStreamEnd {
  type: 'oracle_stream_end';
  data: {
    queryId: string;
    fullResponse: string;
    timestamp: string;
    messageId: string;
    coherenceScore?: number;
    spectralAnalysis?: any;
  };
}

export interface OracleStreamError {
  type: 'oracle_stream_error';
  data: {
    queryId: string;
    error: string;
    timestamp: string;
    messageId: string;
  };
}

export type WebSocketMessage = WSMMetrics | ComponentStatus | ProcessingStats | RSISStatus | AgentStatus | VMStatus | TaskQueue | AgentCommunicationMessage | BenchmarkingStatus | EvaluationResults | VMBenchmarkingData | WaitingListStatus | UserAccessUpdate | FeatureFlagUpdate | OracleStreamStart | OracleStreamToken | OracleStreamEnd | OracleStreamError;

// Commercial API Tables
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  tier: text("tier").notNull(), // 'basic', 'pro', 'enterprise'
  status: text("status").notNull().default('active'), // 'active', 'cancelled', 'suspended'
  monthlyQuota: integer("monthly_quota").notNull(), // API calls per month
  currentUsage: integer("current_usage").notNull().default(0),
  price: real("price").notNull(), // Monthly price in USD
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  keyHash: text("key_hash").notNull().unique(),
  name: text("name").notNull(),
  permissions: jsonb("permissions").notNull(), // Array of allowed endpoints
  isActive: boolean("is_active").notNull().default(true),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const apiUsage = pgTable("api_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  apiKeyId: varchar("api_key_id").references(() => apiKeys.id).notNull(),
  endpoint: text("endpoint").notNull(),
  method: text("method").notNull(),
  responseTime: real("response_time").notNull(),
  statusCode: integer("status_code").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Commercial API insert schemas
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
  lastUsed: true,
});

export const insertApiUsageSchema = createInsertSchema(apiUsage).omit({
  id: true,
  timestamp: true,
});

// Commercial API types
export type Subscription = typeof subscriptions.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type ApiUsage = typeof apiUsage.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type InsertApiUsage = z.infer<typeof insertApiUsageSchema>;

// Agent Management Tables

// VM Instances for agent deployment
export const vmInstances = pgTable("vm_instances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'shared', 'reserved', 'dedicated'
  status: text("status").notNull().default('provisioning'), // 'provisioning', 'active', 'stopped', 'failed'
  cpu: integer("cpu").notNull(), // CPU cores
  memory: integer("memory").notNull(), // Memory in MB
  region: text("region").notNull().default('us-east-1'),
  endpoint: text("endpoint"), // VM endpoint URL
  sshKey: text("ssh_key"), // SSH access key
  createdAt: timestamp("created_at").defaultNow(),
  lastHeartbeat: timestamp("last_heartbeat"),
});

// Agents deployed on VMs
export const agents = pgTable("agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  vmInstanceId: varchar("vm_instance_id").references(() => vmInstances.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'geo_art', 'story_builder', 'vfx_sim', 'music_composer', 'sequence_analyzer', 'app_synthesizer', 'strategic_planner', 'creative_modulator', 'custom'
  status: text("status").notNull().default('initializing'), // 'initializing', 'active', 'busy', 'error', 'stopped'
  configuration: jsonb("configuration").notNull(), // Agent-specific config
  tools: jsonb("tools").notNull(), // Array of available tools
  harmonicState: jsonb("harmonic_state"), // Current harmonic state vector
  coherence: real("coherence").default(0), // Coherence score 0-1
  lastActivity: timestamp("last_activity"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tasks assigned to agents
export const agentTasks = pgTable("agent_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").references(() => agents.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // 'chat', 'file_process', 'tool_execution', 'orchestration'
  status: text("status").notNull().default('queued'), // 'queued', 'running', 'completed', 'failed', 'cancelled'
  priority: integer("priority").notNull().default(5), // 1-10, higher = more priority
  payload: jsonb("payload").notNull(), // Task input data
  result: jsonb("result"), // Task output data
  error: text("error"), // Error message if failed
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Agent orchestration workflows
export const workflows = pgTable("workflows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default('draft'), // 'draft', 'active', 'paused', 'completed', 'failed'
  configuration: jsonb("configuration").notNull(), // Workflow definition
  triggers: jsonb("triggers").notNull(), // When to execute
  createdAt: timestamp("created_at").defaultNow(),
  lastRun: timestamp("last_run"),
});

// Agent communication logs
export const agentCommunications = pgTable("agent_communications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromAgentId: varchar("from_agent_id").references(() => agents.id),
  toAgentId: varchar("to_agent_id").references(() => agents.id),
  workflowId: varchar("workflow_id").references(() => workflows.id),
  messageType: text("message_type").notNull(), // 'task_assignment', 'result_sharing', 'coordination', 'error'
  content: jsonb("content").notNull(),
  harmonicSignature: jsonb("harmonic_signature"), // Harmonic analysis of communication
  timestamp: timestamp("timestamp").defaultNow(),
});

// Tool registry for creator tools
export const creatorTools = pgTable("creator_tools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  category: text("category").notNull(), // 'geo_art', 'story_builder', 'vfx_sim', 'music_composer', 'sequence_analyzer', 'guide'
  description: text("description").notNull(),
  version: text("version").notNull().default('1.0'),
  schema: jsonb("schema").notNull(), // JSON schema for tool parameters
  isPremium: boolean("is_premium").notNull().default(false), // Requires paid subscription
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tool usage tracking
export const toolUsage = pgTable("tool_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  toolName: text("tool_name").notNull(),
  engine: text("engine").notNull(), // 'llm', 'wsm'
  parameters: jsonb("parameters").notNull(),
  executionTime: real("execution_time").notNull(),
  success: boolean("success").notNull(),
  errorMessage: text("error_message"),
  resultSize: integer("result_size"), // Size of output in bytes
  timestamp: timestamp("timestamp").defaultNow(),
});

// Premium presets and packs
export const toolPresets = pgTable("tool_presets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  toolName: text("tool_name").notNull(),
  description: text("description").notNull(),
  parameters: jsonb("parameters").notNull(),
  isPremium: boolean("is_premium").notNull().default(false),
  category: text("category").notNull(), // 'themes', 'palettes', 'styles', 'templates'
  tags: jsonb("tags").default('[]'), // Array of tags for filtering
  createdAt: timestamp("created_at").defaultNow(),
});

// Tool registry for agents (renamed from agentTools to avoid confusion)
export const agentTools = pgTable("agent_tools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  category: text("category").notNull(), // 'physics', 'creative', 'analysis', 'system'
  description: text("description").notNull(),
  implementation: text("implementation").notNull(), // 'python', 'nodejs', 'binary', 'wsm'
  configuration: jsonb("configuration").notNull(), // Tool-specific config schema
  harmonicProfile: jsonb("harmonic_profile"), // Harmonic characteristics
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Creator tools insert schemas
export const insertCreatorToolSchema = createInsertSchema(creatorTools).omit({
  id: true,
  createdAt: true,
});

export const insertToolUsageSchema = createInsertSchema(toolUsage).omit({
  id: true,
  timestamp: true,
});

export const insertToolPresetSchema = createInsertSchema(toolPresets).omit({
  id: true,
  createdAt: true,
});

// Agent insert schemas
export const insertVMInstanceSchema = createInsertSchema(vmInstances).omit({
  id: true,
  createdAt: true,
  lastHeartbeat: true,
});

export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
  createdAt: true,
  lastActivity: true,
});

export const insertAgentTaskSchema = createInsertSchema(agentTasks).omit({
  id: true,
  createdAt: true,
  startedAt: true,
  completedAt: true,
});

export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  createdAt: true,
  lastRun: true,
});

export const insertAgentCommunicationSchema = createInsertSchema(agentCommunications).omit({
  id: true,
  timestamp: true,
});

export const insertAgentToolSchema = createInsertSchema(agentTools).omit({
  id: true,
  createdAt: true,
});

// Creator tools types
export type CreatorTool = typeof creatorTools.$inferSelect;
export type ToolUsage = typeof toolUsage.$inferSelect;
export type ToolPreset = typeof toolPresets.$inferSelect;
export type InsertCreatorTool = z.infer<typeof insertCreatorToolSchema>;
export type InsertToolUsage = z.infer<typeof insertToolUsageSchema>;
export type InsertToolPreset = z.infer<typeof insertToolPresetSchema>;

// Agent types
export type VMInstance = typeof vmInstances.$inferSelect;
export type Agent = typeof agents.$inferSelect;
export type AgentTask = typeof agentTasks.$inferSelect;
export type Workflow = typeof workflows.$inferSelect;
export type AgentCommunication = typeof agentCommunications.$inferSelect;
export type AgentTool = typeof agentTools.$inferSelect;

export type InsertVMInstance = z.infer<typeof insertVMInstanceSchema>;
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type InsertAgentTask = z.infer<typeof insertAgentTaskSchema>;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type InsertAgentCommunication = z.infer<typeof insertAgentCommunicationSchema>;
export type InsertAgentTool = z.infer<typeof insertAgentToolSchema>;

// Tool execution request/response schemas
export const ToolExecutionRequestSchema = z.object({
  tool: z.string(),
  args: z.record(z.any()).default({}),
  engine: z.enum(['llm', 'wsm']).default('llm'),
});

export const ToolExecutionResponseSchema = z.object({
  ok: z.boolean(),
  result: z.any().optional(),
  error: z.string().optional(),
  executionTime: z.number().optional(),
  engine: z.string().optional(),
});

export type ToolExecutionRequest = z.infer<typeof ToolExecutionRequestSchema>;
export type ToolExecutionResponse = z.infer<typeof ToolExecutionResponseSchema>;

// Waiting List and Access Control Tables

// Waiting list applications
export const waitingListApplications = pgTable("waiting_list_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  useCase: text("use_case").notNull(), // Why they want access
  intendedUsage: text("intended_usage"), // What they plan to do
  organization: text("organization"), // Company/institution
  priority: integer("priority").notNull().default(5), // 1-10, higher = more urgent
  adminNotes: text("admin_notes"), // Internal admin comments
  status: text("status").notNull().default('pending'), // 'pending', 'under_review', 'approved', 'denied'
  reviewedBy: varchar("reviewed_by").references(() => users.id), // Admin who reviewed
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Feature flags for controlling access
export const featureFlags = pgTable("feature_flags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(), // 'wsm_chat', 'vm_provisioning', 'agent_orchestration', etc.
  description: text("description").notNull(),
  category: text("category").notNull(), // 'core', 'advanced', 'experimental', 'premium'
  isEnabled: boolean("is_enabled").notNull().default(false),
  rolloutPercentage: integer("rollout_percentage").notNull().default(0), // 0-100
  requiredAccessLevel: text("required_access_level").notNull().default('basic'), // 'basic', 'advanced', 'premium', 'admin'
  betaFeature: boolean("beta_feature").notNull().default(false), // Is this a beta feature
  expiresAt: timestamp("expires_at"), // For time-limited features
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Access level permissions matrix
export const accessLevelPermissions = pgTable("access_level_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accessLevel: text("access_level").notNull(), // 'basic', 'advanced', 'premium', 'admin'
  featureName: text("feature_name").notNull(),
  isAllowed: boolean("is_allowed").notNull().default(false),
  quotaLimit: integer("quota_limit"), // Usage limits for this feature
  createdAt: timestamp("created_at").defaultNow(),
});

// Invitation codes for approved users
export const invitationCodes = pgTable("invitation_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(), // Unique invitation code
  userId: varchar("user_id").references(() => users.id).notNull(), // Who this code is for
  createdBy: varchar("created_by").references(() => users.id).notNull(), // Admin who created it
  accessLevel: text("access_level").notNull().default('basic'), // Access level granted
  expiresAt: timestamp("expires_at").notNull(), // Code expiration
  usedAt: timestamp("used_at"), // When code was used
  isUsed: boolean("is_used").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin action logs
export const adminActionLogs = pgTable("admin_action_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").references(() => users.id).notNull(),
  action: text("action").notNull(), // 'approve_user', 'deny_user', 'update_feature_flag', 'create_invitation'
  targetUserId: varchar("target_user_id").references(() => users.id),
  targetResource: text("target_resource"), // Feature flag name, etc.
  details: jsonb("details").notNull(), // Action details
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Waiting list insert schemas
export const insertWaitingListApplicationSchema = createInsertSchema(waitingListApplications).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
});

export const insertFeatureFlagSchema = createInsertSchema(featureFlags).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAccessLevelPermissionSchema = createInsertSchema(accessLevelPermissions).omit({
  id: true,
  createdAt: true,
});

export const insertInvitationCodeSchema = createInsertSchema(invitationCodes).omit({
  id: true,
  createdAt: true,
  usedAt: true,
});

export const insertAdminActionLogSchema = createInsertSchema(adminActionLogs).omit({
  id: true,
  timestamp: true,
});

// Waiting list types
export type WaitingListApplication = typeof waitingListApplications.$inferSelect;
export type FeatureFlag = typeof featureFlags.$inferSelect;
export type AccessLevelPermission = typeof accessLevelPermissions.$inferSelect;
export type InvitationCode = typeof invitationCodes.$inferSelect;
export type AdminActionLog = typeof adminActionLogs.$inferSelect;

export type InsertWaitingListApplication = z.infer<typeof insertWaitingListApplicationSchema>;
export type InsertFeatureFlag = z.infer<typeof insertFeatureFlagSchema>;
export type InsertAccessLevelPermission = z.infer<typeof insertAccessLevelPermissionSchema>;
export type InsertInvitationCode = z.infer<typeof insertInvitationCodeSchema>;
export type InsertAdminActionLog = z.infer<typeof insertAdminActionLogSchema>;

// Admin endpoint validation schemas
export const adminApproveUserSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  accessLevel: z.enum(['basic', 'advanced', 'premium', 'admin'], {
    errorMap: () => ({ message: 'Access level must be basic, advanced, premium, or admin' })
  }),
  notes: z.string().optional()
});

export const adminDenyUserSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  reason: z.string().min(10, 'Denial reason must be at least 10 characters')
});

export const updateFeatureFlagSchema = z.object({
  isEnabled: z.boolean().optional(),
  rolloutPercentage: z.number().min(0).max(100).optional(),
  requiredAccessLevel: z.enum(['waiting', 'basic', 'advanced', 'premium', 'admin']).optional()
});

export type AdminApproveUser = z.infer<typeof adminApproveUserSchema>;
export type AdminDenyUser = z.infer<typeof adminDenyUserSchema>;
export type UpdateFeatureFlag = z.infer<typeof updateFeatureFlagSchema>;

// WebSocket message schemas for waiting list
export const WaitingListStatusSchema = z.object({
  type: z.literal('waiting_list_status'),
  data: z.object({
    totalApplications: z.number(),
    pendingApplications: z.number(),
    approvedToday: z.number(),
    averageWaitTime: z.number(), // In days
    recentApprovals: z.array(z.object({
      userId: z.string(),
      username: z.string(),
      approvedAt: z.string(),
      accessLevel: z.string(),
    })),
  }),
});

export const UserAccessUpdateSchema = z.object({
  type: z.literal('user_access_update'),
  data: z.object({
    userId: z.string(),
    accessLevel: z.string(),
    waitingListStatus: z.string().optional(),
    availableFeatures: z.array(z.string()),
    message: z.string().optional(),
  }),
});

export const FeatureFlagUpdateSchema = z.object({
  type: z.literal('feature_flag_update'),
  data: z.object({
    featureName: z.string(),
    isEnabled: z.boolean(),
    rolloutPercentage: z.number(),
    affectedUsers: z.number(),
  }),
});

export type WaitingListStatus = z.infer<typeof WaitingListStatusSchema>;
export type UserAccessUpdate = z.infer<typeof UserAccessUpdateSchema>;
export type FeatureFlagUpdate = z.infer<typeof FeatureFlagUpdateSchema>;

// VM Platform Enhancement - Change Proposal System Tables

// Change proposals for VM-driven platform enhancements
export const changeProposals = pgTable("change_proposals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  proposerVmId: varchar("proposer_vm_id").references(() => vmInstances.id).notNull(), // VM that proposed the change
  type: text("type").notNull(), // 'tool', 'ui', 'feature', 'workflow'
  manifest: jsonb("manifest").notNull(), // Complete change manifest
  status: text("status").notNull().default('pending'), // 'pending', 'approved', 'rejected', 'deployed'
  validationReport: jsonb("validation_report"), // Safety and compatibility validation results
  reviewedBy: varchar("reviewed_by").references(() => users.id), // Admin who reviewed
  reviewNotes: text("review_notes"), // Admin review comments
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tools registry for VM-created tools
export const tools = pgTable("tools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(), // Tool identifier
  version: text("version").notNull(), // Semantic version
  manifest: jsonb("manifest").notNull(), // Tool definition and metadata
  status: text("status").notNull().default('active'), // 'active', 'deprecated', 'disabled'
  createdBy: varchar("created_by").references(() => vmInstances.id), // VM that created the tool
  approvedBy: varchar("approved_by").references(() => users.id), // Admin who approved
  usageCount: integer("usage_count").notNull().default(0), // How many times tool has been used
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// UI widgets registry for VM-created interface components
export const uiWidgets = pgTable("ui_widgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(), // Widget identifier
  version: text("version").notNull(), // Semantic version
  manifest: jsonb("manifest").notNull(), // Widget definition, React component, styles
  status: text("status").notNull().default('active'), // 'active', 'deprecated', 'disabled'
  flagKey: text("flag_key"), // Feature flag that controls this widget
  createdBy: varchar("created_by").references(() => vmInstances.id), // VM that created the widget
  approvedBy: varchar("approved_by").references(() => users.id), // Admin who approved
  usageCount: integer("usage_count").notNull().default(0), // How many times widget has been rendered
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Registry-specific feature flags (separate from main feature flags)
export const registryFeatureFlags = pgTable("registry_feature_flags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(), // Flag identifier
  description: text("description").notNull(),
  enabledFor: jsonb("enabled_for").notNull(), // Array of user IDs, access levels, or percentage rollout
  status: text("status").notNull().default('active'), // 'active', 'deprecated', 'disabled'
  relatedToolId: varchar("related_tool_id").references(() => tools.id), // Associated tool if any
  relatedWidgetId: varchar("related_widget_id").references(() => uiWidgets.id), // Associated widget if any
  createdBy: varchar("created_by").references(() => vmInstances.id), // VM that requested the flag
  approvedBy: varchar("approved_by").references(() => users.id), // Admin who approved
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// VM Platform Enhancement insert schemas
export const insertChangeProposalSchema = createInsertSchema(changeProposals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertToolSchema = createInsertSchema(tools).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUiWidgetSchema = createInsertSchema(uiWidgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRegistryFeatureFlagSchema = createInsertSchema(registryFeatureFlags).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// VM Platform Enhancement types
export type ChangeProposal = typeof changeProposals.$inferSelect;
export type Tool = typeof tools.$inferSelect;
export type UiWidget = typeof uiWidgets.$inferSelect;
export type RegistryFeatureFlag = typeof registryFeatureFlags.$inferSelect;

export type InsertChangeProposal = z.infer<typeof insertChangeProposalSchema>;
export type InsertTool = z.infer<typeof insertToolSchema>;
export type InsertUiWidget = z.infer<typeof insertUiWidgetSchema>;
export type InsertRegistryFeatureFlag = z.infer<typeof insertRegistryFeatureFlagSchema>;

// Change Proposal Validation Schemas

// Tool manifest validation
export const ToolManifestSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[a-z][a-z0-9_]*$/, "Tool name must be lowercase alphanumeric with underscores"),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, "Version must be semantic version (e.g., 1.0.0)"),
  description: z.string().min(10).max(500),
  category: z.enum(['physics', 'creative', 'analysis', 'system', 'utility', 'data_processing']),
  implementation: z.enum(['python', 'nodejs', 'binary', 'wsm']),
  entrypoint: z.string().min(1),
  dependencies: z.array(z.string()).default([]),
  resourceLimits: z.object({
    maxMemoryMb: z.number().min(1).max(2048).default(512),
    maxCpuPercent: z.number().min(1).max(100).default(50),
    maxExecutionTimeSeconds: z.number().min(1).max(300).default(30),
  }).default({}),
  permissions: z.array(z.enum(['file_read', 'file_write', 'network', 'system_info'])).default([]),
  schema: z.object({
    input: z.record(z.any()),
    output: z.record(z.any()),
  }),
  examples: z.array(z.object({
    name: z.string(),
    input: z.record(z.any()),
    expectedOutput: z.record(z.any()).optional(),
  })).default([]),
});

// UI Widget manifest validation
export const UiWidgetManifestSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[A-Z][a-zA-Z0-9]*$/, "Widget name must be PascalCase"),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, "Version must be semantic version (e.g., 1.0.0)"),
  description: z.string().min(10).max(500),
  category: z.enum(['dashboard', 'visualization', 'control', 'navigation', 'data_display']),
  component: z.object({
    type: z.literal('react'),
    code: z.string().min(1).max(50000), // React component code
    styles: z.string().max(10000).optional(), // CSS styles
    dependencies: z.array(z.string()).default([]), // NPM dependencies
  }),
  props: z.object({
    schema: z.record(z.any()), // Props schema
    defaults: z.record(z.any()).optional(), // Default props
  }),
  permissions: z.array(z.enum(['data_access', 'api_calls', 'state_management'])).default([]),
  responsive: z.boolean().default(true),
  accessibility: z.object({
    role: z.string().optional(),
    ariaLabels: z.record(z.string()).optional(),
  }).optional(),
});

// Feature flag manifest validation
export const FeatureFlagManifestSchema = z.object({
  key: z.string().min(1).max(50).regex(/^[a-z][a-z0-9_]*$/, "Flag key must be lowercase alphanumeric with underscores"),
  description: z.string().min(10).max(500),
  rolloutStrategy: z.object({
    type: z.enum(['percentage', 'user_list', 'access_level']),
    percentage: z.number().min(0).max(100).optional(),
    userIds: z.array(z.string()).optional(),
    accessLevels: z.array(z.enum(['basic', 'advanced', 'premium', 'admin'])).optional(),
  }),
  relatedResource: z.object({
    type: z.enum(['tool', 'widget', 'feature']),
    id: z.string().optional(),
  }).optional(),
});

// Workflow manifest validation
export const WorkflowManifestSchema = z.object({
  name: z.string().min(1).max(100),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  description: z.string().min(10).max(1000),
  steps: z.array(z.object({
    id: z.string(),
    type: z.enum(['tool_execution', 'condition', 'loop', 'parallel']),
    config: z.record(z.any()),
    dependencies: z.array(z.string()).default([]),
  })),
  triggers: z.array(z.object({
    type: z.enum(['manual', 'scheduled', 'event']),
    config: z.record(z.any()),
  })),
  permissions: z.array(z.string()).default([]),
});

// Main change proposal validation schema
export const ChangeProposalManifestSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('tool'),
    tool: ToolManifestSchema,
  }),
  z.object({
    type: z.literal('ui'),
    widget: UiWidgetManifestSchema,
  }),
  z.object({
    type: z.literal('feature'),
    flag: FeatureFlagManifestSchema,
  }),
  z.object({
    type: z.literal('workflow'),
    workflow: WorkflowManifestSchema,
  }),
]);

// Change proposal submission schema
export const submitChangeProposalSchema = z.object({
  proposerVmId: z.string().uuid('Invalid VM ID format'),
  type: z.enum(['tool', 'ui', 'feature', 'workflow']),
  manifest: ChangeProposalManifestSchema,
});

// Change proposal update schemas
export const validateProposalSchema = z.object({
  validationReport: z.object({
    isValid: z.boolean(),
    securityChecks: z.object({
      passed: z.boolean(),
      issues: z.array(z.string()).default([]),
    }),
    dependencyChecks: z.object({
      passed: z.boolean(),
      missing: z.array(z.string()).default([]),
      conflicts: z.array(z.string()).default([]),
    }),
    schemaValidation: z.object({
      passed: z.boolean(),
      errors: z.array(z.string()).default([]),
    }),
    resourceValidation: z.object({
      passed: z.boolean(),
      warnings: z.array(z.string()).default([]),
    }),
  }),
});

export const approveProposalSchema = z.object({
  reviewNotes: z.string().min(10, "Review notes must be at least 10 characters"),
});

export const deployProposalSchema = z.object({
  deploymentConfig: z.object({
    environment: z.enum(['staging', 'production']).default('staging'),
    rolloutPercentage: z.number().min(0).max(100).default(0),
    monitoringEnabled: z.boolean().default(true),
  }).optional(),
});

export const rollbackProposalSchema = z.object({
  reason: z.string().min(10, "Rollback reason must be at least 10 characters"),
  preserveData: z.boolean().default(true),
});

export type SubmitChangeProposal = z.infer<typeof submitChangeProposalSchema>;
export type ValidateProposal = z.infer<typeof validateProposalSchema>;
export type ApproveProposal = z.infer<typeof approveProposalSchema>;
export type DeployProposal = z.infer<typeof deployProposalSchema>;
export type RollbackProposal = z.infer<typeof rollbackProposalSchema>;

// Harmonic Knowledge Module (HKM) Tables
export const knowledgePacks = pgTable("knowledge_packs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'technical', 'scientific', 'general', 'domain-specific'
  totalDocuments: integer("total_documents").notNull().default(0),
  totalTokens: integer("total_tokens").notNull().default(0),
  harmonicSignature: real("harmonic_signature").notNull(), // Unique harmonic fingerprint
  compressionRatio: real("compression_ratio"), // How well the knowledge compresses
  coherenceScore: real("coherence_score").notNull().default(0), // Internal consistency
  status: text("status").notNull().default('ingesting'), // 'ingesting', 'ready', 'updating', 'archived'
  userId: varchar("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const knowledgeEmbeddings = pgTable("knowledge_embeddings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  packId: varchar("pack_id").notNull().references(() => knowledgePacks.id, { onDelete: 'cascade' }),
  chunkId: text("chunk_id").notNull(), // Unique identifier for the text chunk
  content: text("content").notNull(), // The actual text content
  harmonicVector: text("harmonic_vector").notNull(), // JSON array of harmonic embedding
  spectralRank: real("spectral_rank").notNull(), // Importance ranking for retrieval
  semanticCluster: integer("semantic_cluster"), // Cluster ID for related concepts
  citations: jsonb("citations").default('[]'), // Source attribution array
  tokenCount: integer("token_count").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const knowledgeCitations = pgTable("knowledge_citations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  embeddingId: varchar("embedding_id").notNull().references(() => knowledgeEmbeddings.id, { onDelete: 'cascade' }),
  sourceType: text("source_type").notNull(), // 'document', 'url', 'paper', 'book', 'manual'
  sourceTitle: text("source_title").notNull(),
  sourceAuthor: text("source_author"),
  sourceUrl: text("source_url"),
  pageNumber: integer("page_number"),
  sectionTitle: text("section_title"),
  publicationDate: timestamp("publication_date"),
  reliabilityScore: real("reliability_score").notNull().default(0.8), // Source trustworthiness
  createdAt: timestamp("created_at").defaultNow(),
});

export const learningMetrics = pgTable("learning_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  packId: varchar("pack_id").notNull().references(() => knowledgePacks.id, { onDelete: 'cascade' }),
  metricType: text("metric_type").notNull(), // 'ingestion_rate', 'retrieval_accuracy', 'synthesis_quality'
  metricValue: real("metric_value").notNull(),
  metricMetadata: jsonb("metric_metadata").default('{}'), // Additional metric details
  timestamp: timestamp("timestamp").defaultNow(),
});

export const hkmQueries = pgTable("hkm_queries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  query: text("query").notNull(),
  queryType: text("query_type").notNull(), // 'search', 'synthesis', 'analysis', 'generation'
  packIds: text("pack_ids").notNull(), // JSON array of knowledge pack IDs used
  retrievedChunks: integer("retrieved_chunks").notNull().default(0),
  synthesisMethod: text("synthesis_method"), // 'harmonic_fusion', 'spectral_ranking', 'multi_hop'
  response: text("response"),
  responseCoherence: real("response_coherence"),
  sourceCitations: jsonb("source_citations").default('[]'), // Full citation details
  processingTime: real("processing_time").notNull(),
  userId: varchar("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Oracle Console Schemas and Types
export const insertOracleInstanceSchema = createInsertSchema(oracleInstances).omit({
  id: true,
  createdAt: true,
});

export const insertOracleQuerySchema = createInsertSchema(oracleQueries).omit({
  id: true,
  createdAt: true,
});

export const insertHarmonicProcessingSchema = createInsertSchema(harmonicProcessing).omit({
  id: true,
  createdAt: true,
  processedAt: true,
});

// Oracle API Schemas
export const oracleInstantiateSchema = z.object({
  coreFunction: z.string().min(10, "Core function must be at least 10 characters"),
  inputTemplate: z.string().min(3, "Input template is required"),
});

export const oracleQuerySchema = z.object({
  query: z.string().min(1, "Query is required"),
  mathematicalRigor: z.boolean().default(false),
  oracleId: z.string().uuid().optional(),
});

export const harmonicProcessingSchema = z.object({
  fileId: z.string().uuid("Invalid file ID"),
});

export const processFileRequestSchema = z.object({
  fileId: z.string().uuid("Invalid file ID"),
});

// Oracle Types
// HKM Insert Schemas
export const insertKnowledgePackSchema = createInsertSchema(knowledgePacks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertKnowledgeEmbeddingSchema = createInsertSchema(knowledgeEmbeddings).omit({
  id: true,
  createdAt: true,
});

export const insertKnowledgeCitationSchema = createInsertSchema(knowledgeCitations).omit({
  id: true,
  createdAt: true,
});

export const insertLearningMetricSchema = createInsertSchema(learningMetrics).omit({
  id: true,
  timestamp: true,
});

export const insertHkmQuerySchema = createInsertSchema(hkmQueries).omit({
  id: true,
  createdAt: true,
});

// HKM API Request Schemas
export const createKnowledgePackSchema = z.object({
  name: z.string().min(1, "Pack name is required"),
  description: z.string().optional(),
  category: z.enum(['technical', 'scientific', 'general', 'domain-specific']),
});

export const ingestKnowledgeSchema = z.object({
  packId: z.string().uuid("Invalid pack ID"),
  content: z.string().min(1, "Content is required"),
  sourceTitle: z.string().min(1, "Source title is required"),
  sourceType: z.enum(['document', 'url', 'paper', 'book', 'manual']),
  sourceAuthor: z.string().optional(),
  sourceUrl: z.string().url().optional(),
});

export const hkmQuerySchema = z.object({
  query: z.string().min(1, "Query is required"),
  queryType: z.enum(['search', 'synthesis', 'analysis', 'generation']).default('search'),
  packIds: z.array(z.string().uuid()).min(1, "At least one knowledge pack required"),
  synthesisMethod: z.enum(['harmonic_fusion', 'spectral_ranking', 'multi_hop']).optional(),
  maxChunks: z.number().min(1).max(100).default(10),
});

// WebSocket Message Types for Oracle Streaming
export const oracleStreamMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('oracle_query_stream'),
    query: z.string(),
    mathematicalRigor: z.boolean(),
    apiKey: z.string(),
  }),
  z.object({
    type: z.literal('oracle_stream_start'),
    data: z.object({
      queryId: z.string(),
    }),
  }),
  z.object({
    type: z.literal('oracle_stream_token'),
    data: z.object({
      token: z.string(),
    }),
  }),
  z.object({
    type: z.literal('oracle_stream_end'),
    data: z.object({
      coherenceScore: z.number(),
      totalTokens: z.number(),
    }),
  }),
  z.object({
    type: z.literal('oracle_stream_error'),
    data: z.object({
      error: z.string(),
    }),
  }),
]);

// Oracle Types
export type OracleInstance = typeof oracleInstances.$inferSelect;
export type InsertOracleInstance = z.infer<typeof insertOracleInstanceSchema>;

export type OracleQuery = typeof oracleQueries.$inferSelect;
export type InsertOracleQuery = z.infer<typeof insertOracleQuerySchema>;

export type HarmonicProcessing = typeof harmonicProcessing.$inferSelect;
export type InsertHarmonicProcessing = z.infer<typeof insertHarmonicProcessingSchema>;

export type OracleInstantiate = z.infer<typeof oracleInstantiateSchema>;
export type OracleQueryRequest = z.infer<typeof oracleQuerySchema>;
export type HarmonicProcessingRequest = z.infer<typeof harmonicProcessingSchema>;

// HKM Types
export type KnowledgePack = typeof knowledgePacks.$inferSelect;
export type InsertKnowledgePack = z.infer<typeof insertKnowledgePackSchema>;

export type KnowledgeEmbedding = typeof knowledgeEmbeddings.$inferSelect;
export type InsertKnowledgeEmbedding = z.infer<typeof insertKnowledgeEmbeddingSchema>;

export type KnowledgeCitation = typeof knowledgeCitations.$inferSelect;
export type InsertKnowledgeCitation = z.infer<typeof insertKnowledgeCitationSchema>;

export type LearningMetric = typeof learningMetrics.$inferSelect;
export type InsertLearningMetric = z.infer<typeof insertLearningMetricSchema>;

export type HkmQuery = typeof hkmQueries.$inferSelect;
export type InsertHkmQuery = z.infer<typeof insertHkmQuerySchema>;

export type CreateKnowledgePack = z.infer<typeof createKnowledgePackSchema>;
export type IngestKnowledge = z.infer<typeof ingestKnowledgeSchema>;
export type HkmQueryRequest = z.infer<typeof hkmQuerySchema>;
export type OracleStreamMessage = z.infer<typeof oracleStreamMessageSchema>;
