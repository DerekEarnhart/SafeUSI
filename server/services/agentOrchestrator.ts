import { storage } from "../storage";
import { vmProvisioning } from "./vmProvisioning";
import { wsmEngine } from "./wsmEngine";
import { harmonicBridge } from "./harmonicBridge";
import { 
  type Agent, 
  type AgentTask, 
  type Workflow,
  type AgentCommunication,
  type VMInstance 
} from "@shared/schema";
import { randomUUID } from "crypto";

interface TaskExecution {
  taskId: string;
  agentId: string;
  startTime: Date;
  retryCount: number;
}

interface HarmonicAnalysis {
  coherence: number;
  harmonicState: number[];
  phase: number;
  frequency: number;
  resonanceStrength?: number;
  harmonicStability?: number;
}

interface PythonHarmonicState {
  state: number[];
  coherence: number;
  resonance: number;
  perturbation: number;
}

interface RecursiveImprovementResult {
  new_resonance: number;
  new_perturbation: number;
  performance_delta: number;
  harmonic_stability: number;
}

class AgentOrchestratorService {
  private activeExecutions: Map<string, TaskExecution> = new Map();
  private communicationQueue: Map<string, AgentCommunication[]> = new Map();
  private harmonicMonitor: Map<string, HarmonicAnalysis> = new Map();
  private processInterval: NodeJS.Timeout | null = null;
  private performanceHistory: number[] = [];
  private configHistory: any[] = [];
  private currentConfig: any = {
    resonance_factor: 1.0,
    perturbation_rate: 0.1,
    coherence_threshold: 0.7,
    optimization_mode: 'balanced'
  };

  constructor() {
    this.startOrchestrator();
    this.initializeHarmonicBridge();
  }

  /**
   * Initialize connection to Python harmonic bridge
   */
  private async initializeHarmonicBridge() {
    try {
      if (harmonicBridge.isReady()) {
        console.log('Harmonic Bridge already connected');
        return;
      }

      // Wait for harmonic bridge to be ready
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Harmonic bridge initialization timeout'));
        }, 30000);

        harmonicBridge.on('initialized', () => {
          clearTimeout(timeout);
          console.log('Harmonic Bridge connected successfully');
          resolve();
        });

        harmonicBridge.on('bridge_disconnected', () => {
          console.warn('Harmonic Bridge disconnected');
          this.handleBridgeDisconnection();
        });
      });
    } catch (error) {
      console.error('Failed to initialize Harmonic Bridge:', error);
      // Continue with basic operation without Python enhancement
    }
  }

  /**
   * Handle harmonic bridge disconnection
   */
  private handleBridgeDisconnection() {
    console.log('Falling back to basic harmonic calculations');
    // Could implement automatic reconnection logic here
  }

  /**
   * Start the orchestrator main loop
   */
  private startOrchestrator() {
    console.log('Agent Orchestrator starting...');
    
    // Main orchestration loop - runs every 5 seconds
    this.processInterval = setInterval(async () => {
      await this.processTaskQueue();
      await this.monitorAgentHealth();
      await this.optimizeResourceAllocation();
      await this.processAgentCommunications();
    }, 5000);

    // Harmonic analysis runs every 2 seconds for real-time coherence monitoring
    setInterval(async () => {
      await this.updateHarmonicStates();
    }, 2000);
  }

  /**
   * Stop the orchestrator
   */
  stop() {
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
    console.log('Agent Orchestrator stopped');
  }

  /**
   * Process the task queue and assign tasks to available agents
   */
  private async processTaskQueue() {
    try {
      // Get all queued tasks
      const queuedTasks = await storage.getAgentTasks(undefined, undefined, 'queued');
      
      if (queuedTasks.length === 0) return;

      // Sort by priority (higher priority first)
      queuedTasks.sort((a, b) => b.priority - a.priority);

      for (const task of queuedTasks) {
        const agent = await storage.getAgent(task.agentId);
        if (!agent) continue;

        // Check if agent is available
        if (this.isAgentAvailable(agent)) {
          await this.executeTask(task, agent);
        }
      }
    } catch (error) {
      console.error('Error processing task queue:', error);
    }
  }

  /**
   * Check if an agent is available for task execution
   */
  private isAgentAvailable(agent: Agent): boolean {
    return agent.status === 'active' && !this.activeExecutions.has(agent.id);
  }

  /**
   * Execute a task on an agent
   */
  private async executeTask(task: AgentTask, agent: Agent) {
    try {
      // Mark task as running
      await storage.updateAgentTask(task.id, { 
        status: 'running',
        startedAt: new Date()
      });

      // Mark agent as busy
      await storage.updateAgent(agent.id, { status: 'busy' });

      // Track execution
      this.activeExecutions.set(agent.id, {
        taskId: task.id,
        agentId: agent.id,
        startTime: new Date(),
        retryCount: 0,
      });

      // Execute task based on type
      const result = await this.performTaskExecution(task, agent);

      // Update task with result
      await storage.updateAgentTask(task.id, {
        status: 'completed',
        result,
        completedAt: new Date()
      });

      // Mark agent as active again
      await storage.updateAgent(agent.id, { status: 'active' });

      // Remove from active executions
      this.activeExecutions.delete(agent.id);

      console.log(`Task ${task.id} completed successfully on agent ${agent.name}`);

    } catch (error) {
      console.error(`Task execution failed for ${task.id}:`, error);
      
      // Handle task failure
      await this.handleTaskFailure(task, agent, error);
    }
  }

  /**
   * Perform the actual task execution based on task type
   */
  private async performTaskExecution(task: AgentTask, agent: Agent): Promise<any> {
    const { type, payload } = task;

    switch (type) {
      case 'chat':
        return await this.executeChatTask(payload, agent);
      
      case 'file_process':
        return await this.executeFileProcessTask(payload, agent);
      
      case 'tool_execution':
        return await this.executeToolTask(payload, agent);
      
      case 'orchestration':
        return await this.executeOrchestrationTask(payload, agent);
      
      default:
        throw new Error(`Unknown task type: ${type}`);
    }
  }

  /**
   * Execute a chat task using enhanced harmonic processing
   */
  private async executeChatTask(payload: any, agent: Agent): Promise<any> {
    const { message } = payload;
    
    try {
      // Use Python harmonic bridge for advanced processing
      if (harmonicBridge.isReady()) {
        const taskResult = await harmonicBridge.processTask('chat', { message }, { agent_type: agent.type });
        
        // Update agent's harmonic state with Python-calculated values
        await this.updateAgentHarmonicState(agent.id, taskResult.result.harmonic_analysis.state);
        
        return {
          message: taskResult.result.result.response,
          harmonicState: taskResult.result.harmonic_analysis.state,
          coherence: taskResult.result.harmonic_analysis.coherence,
          processingTime: taskResult.result.harmonic_analysis.processing_time,
          agentType: agent.type,
          enhancedHarmonics: true,
          resonance: taskResult.result.agent_enhancement.resonance_applied,
          optimization_level: taskResult.result.agent_enhancement.optimization_level
        };
      } else {
        // Fallback to local harmonic processing
        const wsmMetrics = await wsmEngine.getCurrentMetrics();
        const response = await this.generateHarmonicResponse(message, agent, wsmMetrics);
        
        await this.updateAgentHarmonicState(agent.id, response.harmonicState);
        
        return {
          message: response.text,
          harmonicState: response.harmonicState,
          coherence: response.coherence,
          processingTime: response.processingTime,
          agentType: agent.type,
          enhancedHarmonics: false
        };
      }
    } catch (error) {
      console.error('Error in enhanced chat processing:', error);
      // Fallback to basic processing
      const wsmMetrics = await wsmEngine.getCurrentMetrics();
      const response = await this.generateHarmonicResponse(message, agent, wsmMetrics);
      
      await this.updateAgentHarmonicState(agent.id, response.harmonicState);
      
      return {
        message: response.text,
        harmonicState: response.harmonicState,
        coherence: response.coherence,
        processingTime: response.processingTime,
        agentType: agent.type,
        enhancedHarmonics: false,
        error: 'Fallback processing used'
      };
    }
  }

  /**
   * Execute a file processing task with harmonic enhancement
   */
  private async executeFileProcessTask(payload: any, agent: Agent): Promise<any> {
    const { filename, fileData } = payload;
    
    try {
      // Use Python harmonic bridge for enhanced file processing
      if (harmonicBridge.isReady()) {
        const fileSize = fileData?.length || filename.length;
        const taskResult = await harmonicBridge.processTask('file_process', { 
          filename, 
          size: fileSize 
        }, { agent_type: agent.type });
        
        return {
          filename,
          processed: true,
          processingTime: taskResult.result.harmonic_analysis.processing_time,
          agent: agent.name,
          harmonicSignature: taskResult.result.harmonic_analysis.state,
          enhancedProcessing: true,
          processingEfficiency: taskResult.result.result.processing_efficiency,
          estimatedTime: taskResult.result.result.estimated_time,
          compressionRatio: taskResult.result.result.compression_ratio
        };
      } else {
        // Fallback to basic processing
        const processingTime = this.calculateProcessingTime(agent.type, fileData?.length || 1000);
        await new Promise(resolve => setTimeout(resolve, processingTime));
        
        return {
          filename,
          processed: true,
          processingTime: processingTime / 1000,
          agent: agent.name,
          harmonicSignature: this.generateHarmonicSignature(filename),
          enhancedProcessing: false
        };
      }
    } catch (error) {
      console.error('Error in enhanced file processing:', error);
      // Fallback to basic processing
      const processingTime = this.calculateProcessingTime(agent.type, fileData?.length || 1000);
      await new Promise(resolve => setTimeout(resolve, processingTime));
      
      return {
        filename,
        processed: true,
        processingTime: processingTime / 1000,
        agent: agent.name,
        harmonicSignature: this.generateHarmonicSignature(filename),
        enhancedProcessing: false,
        error: 'Fallback processing used'
      };
    }
  }

  /**
   * Execute a tool-based task
   */
  private async executeToolTask(payload: any, agent: Agent): Promise<any> {
    const { toolName, parameters } = payload;
    
    // Check if agent has access to the tool
    const agentTools = agent.tools as string[];
    if (!agentTools.includes(toolName)) {
      throw new Error(`Agent ${agent.name} does not have access to tool ${toolName}`);
    }
    
    // Simulate tool execution
    const result = await this.simulateToolExecution(toolName, parameters, agent);
    
    return result;
  }

  /**
   * Execute an orchestration task (multi-agent coordination)
   */
  private async executeOrchestrationTask(payload: any, agent: Agent): Promise<any> {
    const { workflow, subTasks } = payload;
    
    // Create sub-tasks for other agents
    const subTaskResults = [];
    
    for (const subTask of subTasks) {
      const targetAgent = await storage.getAgent(subTask.agentId);
      if (targetAgent && this.isAgentAvailable(targetAgent)) {
        const task = await storage.createAgentTask({
          agentId: subTask.agentId,
          userId: agent.userId,
          type: subTask.type,
          payload: subTask.payload,
          priority: 7, // Higher priority for orchestrated tasks
          status: 'queued',
          result: null,
          error: null
        });
        
        subTaskResults.push({ taskId: task.id, agentId: subTask.agentId });
      }
    }
    
    return {
      orchestrationId: randomUUID(),
      subTasks: subTaskResults,
      coordinator: agent.name,
      status: 'coordinating'
    };
  }

  /**
   * Generate harmonic response using enhanced WSM principles
   */
  private async generateHarmonicResponse(message: string, agent: Agent, wsmMetrics: any): Promise<{
    text: string;
    harmonicState: number[];
    coherence: number;
    processingTime: number;
  }> {
    const startTime = Date.now();
    
    try {
      // Try using Python harmonic bridge for enhanced analysis
      if (harmonicBridge.isReady()) {
        const harmonicAnalysis = await harmonicBridge.analyzeHarmonics(message);
        const coherence = await this.calculateCoherence(harmonicAnalysis.harmonic_state, wsmMetrics?.harmonicState || []);
        const responseText = this.generateAgentResponse(message, agent, coherence);
        
        return {
          text: responseText,
          harmonicState: harmonicAnalysis.harmonic_state,
          coherence,
          processingTime: Date.now() - startTime
        };
      }
    } catch (error) {
      console.error('Error in enhanced harmonic response generation:', error);
    }
    
    // Fallback to local harmonic processing
    const harmonicState = this.calculateMessageHarmonics(message, agent.type);
    const coherence = await this.calculateCoherence(harmonicState, wsmMetrics?.harmonicState || []);
    const responseText = this.generateAgentResponse(message, agent, coherence);
    
    return {
      text: responseText,
      harmonicState,
      coherence,
      processingTime: Date.now() - startTime
    };
  }

  /**
   * Calculate harmonic signature for message analysis
   */
  private calculateMessageHarmonics(message: string, agentType: string): number[] {
    const baseFrequencies = {
      'geo_art': [1.0, 0.8, 0.6, 0.4],
      'story_builder': [0.9, 0.7, 0.5, 0.8],
      'vfx_sim': [0.8, 0.9, 0.7, 0.6],
      'music_composer': [0.7, 0.6, 0.9, 0.8],
      'sequence_analyzer': [0.6, 0.8, 0.4, 0.9],
      'custom': [0.5, 0.5, 0.5, 0.5]
    };
    
    const base = baseFrequencies[agentType as keyof typeof baseFrequencies] || baseFrequencies.custom;
    const messageComplexity = Math.min(message.length / 100, 1.0);
    
    return base.map(freq => freq * (0.5 + messageComplexity * 0.5));
  }

  /**
   * Calculate coherence between two harmonic states (enhanced with Python bridge)
   */
  private async calculateCoherence(state1: number[], state2: number[]): Promise<number> {
    try {
      if (harmonicBridge.isReady()) {
        return await harmonicBridge.calculateCoherence(state1, state2);
      }
    } catch (error) {
      console.error('Error calculating coherence with harmonic bridge:', error);
    }
    
    // Fallback to local calculation
    if (!state2 || state2.length === 0) return 0.5;
    
    const minLength = Math.min(state1.length, state2.length);
    let correlation = 0;
    
    for (let i = 0; i < minLength; i++) {
      correlation += state1[i] * state2[i];
    }
    
    return Math.max(0, Math.min(1, correlation / minLength));
  }

  /**
   * Generate agent-specific response text
   */
  private generateAgentResponse(message: string, agent: Agent, coherence: number): string {
    const responses = {
      'geo_art': `Analyzing geometric patterns in your query. Current coherence: ${(coherence * 100).toFixed(1)}%. Generating spatial harmonic visualization based on input complexity.`,
      'story_builder': `Processing narrative elements with ${(coherence * 100).toFixed(1)}% harmonic coherence. Weaving story threads through quantum narrative space.`,
      'vfx_sim': `Rendering visual effects simulation with coherence ${(coherence * 100).toFixed(1)}%. Applying physics-based harmonic transformations.`,
      'music_composer': `Composing harmonic structures at ${(coherence * 100).toFixed(1)}% coherence. Translating linguistic patterns into musical harmonics.`,
      'sequence_analyzer': `Analyzing sequence patterns with ${(coherence * 100).toFixed(1)}% coherence. Identifying harmonic relationships in data structure.`,
      'custom': `Processing through custom harmonic filters. Coherence: ${(coherence * 100).toFixed(1)}%. Applying specialized transformation protocols.`
    };
    
    return responses[agent.type as keyof typeof responses] || responses.custom;
  }

  /**
   * Handle task execution failure
   */
  private async handleTaskFailure(task: AgentTask, agent: Agent, error: any) {
    const execution = this.activeExecutions.get(agent.id);
    
    if (execution && execution.retryCount < 3) {
      // Retry task
      execution.retryCount++;
      console.log(`Retrying task ${task.id}, attempt ${execution.retryCount}`);
      
      await storage.updateAgentTask(task.id, { status: 'queued' });
      await storage.updateAgent(agent.id, { status: 'active' });
      this.activeExecutions.delete(agent.id);
    } else {
      // Mark as failed
      await storage.updateAgentTask(task.id, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date()
      });
      
      await storage.updateAgent(agent.id, { status: 'error' });
      this.activeExecutions.delete(agent.id);
    }
  }

  /**
   * Monitor agent health and status
   */
  private async monitorAgentHealth() {
    try {
      const agents = await storage.getAllAgents();
      
      for (const agent of agents) {
        // Check for stuck tasks
        const execution = this.activeExecutions.get(agent.id);
        if (execution) {
          const elapsed = Date.now() - execution.startTime.getTime();
          if (elapsed > 300000) { // 5 minutes timeout
            console.warn(`Task ${execution.taskId} timed out on agent ${agent.name}`);
            await this.handleTaskTimeout(execution);
          }
        }
        
        // Update agent coherence
        await this.updateAgentCoherence(agent);
      }
    } catch (error) {
      console.error('Error monitoring agent health:', error);
    }
  }

  /**
   * Handle task timeout
   */
  private async handleTaskTimeout(execution: TaskExecution) {
    await storage.updateAgentTask(execution.taskId, {
      status: 'failed',
      error: 'Task execution timeout',
      completedAt: new Date()
    });
    
    await storage.updateAgent(execution.agentId, { status: 'error' });
    this.activeExecutions.delete(execution.agentId);
  }

  /**
   * Update agent coherence based on harmonic analysis
   */
  private async updateAgentCoherence(agent: Agent) {
    const harmonic = this.harmonicMonitor.get(agent.id);
    if (harmonic) {
      await storage.updateAgent(agent.id, {
        coherence: harmonic.coherence
      });
    }
  }

  /**
   * Update harmonic states for all active agents
   */
  private async updateHarmonicStates() {
    try {
      const agents = await storage.getAllAgents();
      const activeAgents = agents.filter(agent => agent.status === 'active' || agent.status === 'busy');
      
      for (const agent of activeAgents) {
        const harmonicAnalysis = await this.analyzeAgentHarmonics(agent);
        this.harmonicMonitor.set(agent.id, harmonicAnalysis);
      }
    } catch (error) {
      console.error('Error updating harmonic states:', error);
    }
  }

  /**
   * Analyze harmonic state for a specific agent
   */
  private async analyzeAgentHarmonics(agent: Agent): Promise<HarmonicAnalysis> {
    // Get recent tasks for this agent
    const recentTasks = await storage.getAgentTasks(agent.id);
    const completedTasks = recentTasks.filter(task => task.status === 'completed').slice(0, 10);
    
    // Calculate coherence based on task success rate and timing
    const successRate = completedTasks.length > 0 ? 1.0 : 0.5;
    const avgProcessingTime = this.calculateAverageProcessingTime(completedTasks);
    
    // Generate harmonic state based on agent performance
    const harmonicState = this.generatePerformanceHarmonics(agent, successRate, avgProcessingTime);
    
    return {
      coherence: successRate * 0.8 + (agent.coherence || 0) * 0.2,
      harmonicState,
      phase: (Date.now() / 10000) % (2 * Math.PI),
      frequency: this.calculateAgentFrequency(agent.type)
    };
  }

  /**
   * Calculate average processing time for tasks
   */
  private calculateAverageProcessingTime(tasks: AgentTask[]): number {
    if (tasks.length === 0) return 1000;
    
    const times = tasks
      .filter(task => task.startedAt && task.completedAt)
      .map(task => task.completedAt!.getTime() - task.startedAt!.getTime());
    
    return times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 1000;
  }

  /**
   * Generate performance-based harmonics
   */
  private generatePerformanceHarmonics(agent: Agent, successRate: number, avgTime: number): number[] {
    const timeNormalized = Math.min(avgTime / 10000, 1.0); // Normalize to 0-1
    const performance = successRate * (1 - timeNormalized * 0.5);
    
    return [
      performance * 0.9,
      performance * 0.8,
      performance * 0.7,
      performance * 0.6
    ];
  }

  /**
   * Calculate agent frequency based on type
   */
  private calculateAgentFrequency(agentType: string): number {
    const frequencies = {
      'geo_art': 1.2,
      'story_builder': 0.8,
      'vfx_sim': 1.5,
      'music_composer': 2.0,
      'sequence_analyzer': 1.8,
      'custom': 1.0
    };
    
    return frequencies[agentType as keyof typeof frequencies] || 1.0;
  }

  /**
   * Optimize resource allocation across agents and VMs with harmonic coordination
   */
  private async optimizeResourceAllocation() {
    try {
      const agents = await storage.getAllAgents();
      const vms = await storage.getAllVMInstances();
      const queuedTasks = await storage.getAgentTasks(undefined, undefined, 'queued');
      
      // Apply recursive self-improvement based on system performance
      await this.applyRecursiveSelfImprovement(agents);
      
      // Use harmonic ensemble coordination for optimal agent allocation
      if (harmonicBridge.isReady() && agents.length > 1) {
        await this.harmonicEnsembleOptimization(agents, queuedTasks);
      }
      
      // If we have queued tasks but no available agents, consider provisioning new VMs
      if (queuedTasks.length > 5 && this.getAvailableAgents(agents).length === 0) {
        await this.considerVMProvisioning(queuedTasks);
      }
      
      // Optimize agent placement on VMs
      await this.optimizeAgentPlacement(agents, vms);
      
    } catch (error) {
      console.error('Error optimizing resource allocation:', error);
    }
  }

  /**
   * Apply recursive self-improvement to the orchestrator
   */
  private async applyRecursiveSelfImprovement(agents: Agent[]) {
    try {
      if (!harmonicBridge.isReady()) return;

      // Calculate current system performance
      const activeAgents = agents.filter(agent => agent.status === 'active' || agent.status === 'busy');
      const avgCoherence = activeAgents.reduce((sum, agent) => sum + (agent.coherence || 0.5), 0) / Math.max(activeAgents.length, 1);
      const systemPerformance = Math.min(1.0, avgCoherence * (activeAgents.length / Math.max(agents.length, 1)));
      
      // Apply recursive improvement
      const improvementResult = await harmonicBridge.recursiveImprove(systemPerformance);
      
      // Update performance history
      this.performanceHistory.push(systemPerformance);
      if (this.performanceHistory.length > 100) {
        this.performanceHistory = this.performanceHistory.slice(-50);
      }
      
      // Update config history
      this.configHistory.push({ ...this.currentConfig, timestamp: Date.now() });
      if (this.configHistory.length > 50) {
        this.configHistory = this.configHistory.slice(-25);
      }
      
      // Optimize parameters if we have enough data
      if (this.performanceHistory.length >= 5) {
        const optimizationResult = await harmonicBridge.optimizeParameters(
          this.performanceHistory,
          this.configHistory,
          this.currentConfig
        );
        
        if (optimizationResult.success && optimizationResult.optimized_config) {
          this.currentConfig = optimizationResult.optimized_config;
          console.log('Applied parameter optimization:', optimizationResult.meta_recommendations);
        }
      }
      
      console.log(`Recursive self-improvement applied. Performance: ${systemPerformance.toFixed(3)}, Stability: ${improvementResult.improvement_result.harmonic_stability.toFixed(3)}`);
      
    } catch (error) {
      console.error('Error in recursive self-improvement:', error);
    }
  }

  /**
   * Apply harmonic ensemble coordination for optimal agent allocation
   */
  private async harmonicEnsembleOptimization(agents: Agent[], queuedTasks: AgentTask[]) {
    try {
      if (!harmonicBridge.isReady()) return;

      // Get agent harmonic states
      const agentHarmonics = agents
        .filter(agent => agent.harmonicState && Array.isArray(agent.harmonicState))
        .map(agent => agent.harmonicState as number[]);
      
      if (agentHarmonics.length === 0) return;

      // Analyze task requirements
      const taskRequirements = this.analyzeTaskRequirements(queuedTasks);
      
      // Get coordination strategy
      const coordinationResult = await harmonicBridge.coordinateEnsemble(agentHarmonics, taskRequirements);
      
      if (coordinationResult.success) {
        const strategy = coordinationResult.coordination_strategy;
        console.log(`Applying harmonic ensemble coordination: ${strategy.coordination_strategy} (strength: ${strategy.coordination_strength.toFixed(3)})`);
        
        // Apply coordination recommendations
        if (strategy.recommendations) {
          for (const recommendation of strategy.recommendations) {
            console.log(`Harmonic recommendation: ${recommendation}`);
          }
        }
        
        // Reorder agents based on task alignment if provided
        if (strategy.optimal_agent_order && strategy.optimal_agent_order.length > 0) {
          // This could be used to prioritize agent assignment
          console.log('Optimal agent order determined by harmonic analysis');
        }
      }
      
    } catch (error) {
      console.error('Error in harmonic ensemble optimization:', error);
    }
  }

  /**
   * Analyze task requirements for harmonic coordination
   */
  private analyzeTaskRequirements(tasks: AgentTask[]): Record<string, number> {
    const requirements: Record<string, number> = {
      creativity: 0,
      analysis: 0,
      planning: 0,
      execution: 0
    };
    
    for (const task of tasks) {
      switch (task.type) {
        case 'chat':
          requirements.creativity += 0.3;
          requirements.analysis += 0.7;
          break;
        case 'file_process':
          requirements.analysis += 0.5;
          requirements.execution += 0.5;
          break;
        case 'tool_execution':
          requirements.execution += 0.8;
          requirements.planning += 0.2;
          break;
        case 'orchestration':
          requirements.planning += 0.6;
          requirements.creativity += 0.4;
          break;
      }
    }
    
    // Normalize to [0, 1] range
    const total = Object.values(requirements).reduce((sum, val) => sum + val, 0);
    if (total > 0) {
      for (const key in requirements) {
        requirements[key] /= total;
      }
    }
    
    return requirements;
  }

  /**
   * Get available agents
   */
  private getAvailableAgents(agents: Agent[]): Agent[] {
    return agents.filter(agent => this.isAgentAvailable(agent));
  }

  /**
   * Consider provisioning new VMs when needed
   */
  private async considerVMProvisioning(queuedTasks: AgentTask[]) {
    // Analyze task types to determine optimal VM configuration
    const taskTypes = queuedTasks.map(task => task.type);
    const predominantType = this.getMostCommonTaskType(taskTypes);
    
    // Get optimal VM config for the task type
    const vmConfig = vmProvisioning.getOptimalVMConfig(predominantType, queuedTasks.length);
    
    console.log(`Considering VM provisioning for ${queuedTasks.length} queued tasks of type ${predominantType}`);
    
    // For demo purposes, we'll log this but not actually provision
    // In production, this would trigger actual VM provisioning
  }

  /**
   * Get the most common task type from a list
   */
  private getMostCommonTaskType(taskTypes: string[]): string {
    const counts = taskTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts).reduce((a, b) => counts[a[0]] > counts[b[0]] ? a : b)[0] || 'custom';
  }

  /**
   * Optimize agent placement across VMs
   */
  private async optimizeAgentPlacement(agents: Agent[], vms: VMInstance[]) {
    // For now, just ensure agents are distributed across available VMs
    // In a full implementation, this would consider load balancing and affinity
    const activeVMs = vms.filter(vm => vm.status === 'active');
    
    if (activeVMs.length === 0) return;
    
    // This is a simplified optimization - in production would be more sophisticated
    console.log(`Optimizing placement of ${agents.length} agents across ${activeVMs.length} VMs`);
  }

  /**
   * Process inter-agent communications
   */
  private async processAgentCommunications() {
    try {
      // Get recent communications
      const communications = await storage.getAgentCommunications();
      const recentComms = communications.slice(0, 50); // Process last 50 communications
      
      // Analyze communication patterns for optimization
      this.analyzeCommunicationPatterns(recentComms);
      
    } catch (error) {
      console.error('Error processing agent communications:', error);
    }
  }

  /**
   * Analyze communication patterns between agents
   */
  private analyzeCommunicationPatterns(communications: AgentCommunication[]) {
    // Group by workflow
    const workflowComms = communications.reduce((acc, comm) => {
      if (comm.workflowId) {
        if (!acc[comm.workflowId]) acc[comm.workflowId] = [];
        acc[comm.workflowId].push(comm);
      }
      return acc;
    }, {} as Record<string, AgentCommunication[]>);
    
    // Log communication statistics
    Object.entries(workflowComms).forEach(([workflowId, comms]) => {
      if (comms.length > 10) {
        console.log(`High communication activity in workflow ${workflowId}: ${comms.length} messages`);
      }
    });
  }

  /**
   * Helper methods for task execution
   */
  
  private calculateProcessingTime(agentType: string, dataSize: number): number {
    const baseTime = {
      'geo_art': 2000,
      'story_builder': 1500,
      'vfx_sim': 5000,
      'music_composer': 3000,
      'sequence_analyzer': 4000,
      'custom': 2500
    };
    
    const base = baseTime[agentType as keyof typeof baseTime] || baseTime.custom;
    return base + (dataSize / 1000) * 100; // Scale with data size
  }

  private generateHarmonicSignature(filename: string): number[] {
    // Generate a harmonic signature based on filename
    const hash = this.simpleHash(filename);
    return [
      (hash % 1000) / 1000,
      ((hash * 2) % 1000) / 1000,
      ((hash * 3) % 1000) / 1000,
      ((hash * 4) % 1000) / 1000
    ];
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

  private async simulateToolExecution(toolName: string, parameters: any, agent: Agent): Promise<any> {
    // Simulate different tool executions
    const executionTime = Math.random() * 2000 + 500; // 500-2500ms
    await new Promise(resolve => setTimeout(resolve, executionTime));
    
    return {
      tool: toolName,
      parameters,
      result: `Tool ${toolName} executed successfully by ${agent.name}`,
      executionTime: executionTime / 1000,
      success: true
    };
  }

  private async updateAgentHarmonicState(agentId: string, harmonicState: number[]) {
    await storage.updateAgent(agentId, {
      harmonicState: harmonicState,
      lastActivity: new Date()
    });
  }

  /**
   * Public methods for external interaction
   */

  /**
   * Get orchestrator status
   */
  async getStatus() {
    const activeExecutions = Array.from(this.activeExecutions.values());
    const harmonicStates = Array.from(this.harmonicMonitor.entries());
    
    return {
      activeExecutions: activeExecutions.length,
      harmonicMonitoring: harmonicStates.length,
      queueStats: await storage.getTaskQueue(),
      isRunning: this.processInterval !== null
    };
  }

  /**
   * Force process task queue (for testing/manual trigger)
   */
  async forceProcessQueue() {
    await this.processTaskQueue();
  }

  /**
   * Get agent harmonic analysis
   */
  getAgentHarmonics(agentId: string): HarmonicAnalysis | undefined {
    return this.harmonicMonitor.get(agentId);
  }
}

export const agentOrchestrator = new AgentOrchestratorService();