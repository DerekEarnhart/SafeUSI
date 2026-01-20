import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';

export interface HarmonicState {
  state: number[];
  coherence: number;
  resonance: number;
  perturbation: number;
}

export interface HarmonicAnalysis {
  harmonic_state: number[];
  coherence: number;
  processing_time: number;
  harmonic_efficiency: number;
}

export interface OrchestrationResult {
  orchestration_id: string;
  task: string;
  agents_used: string[];
  execution_results: any;
  synthesis_result: any;
  task_harmonics: number[];
  final_coherence: number;
  execution_time: number;
}

export interface SystemStatus {
  agi_core: {
    resonance: number;
    perturbation: number;
    operational_rules: Record<string, any>;
    mathematical_rigor_mode: boolean;
    harmonic_stability: number;
  };
  orchestrator: {
    active_agents: number;
    system_coherence: number;
    harmonic_resonance: number;
    is_busy: boolean;
    total_orchestrations: number;
  };
}

export class HarmonicBridgeService extends EventEmitter {
  private pythonProcess: ChildProcess | null = null;
  private isInitialized = false;
  private requestQueue: Map<string, {resolve: Function, reject: Function}> = new Map();
  private requestCounter = 0;

  constructor() {
    super();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      const pythonPath = path.join(process.cwd(), 'python', 'harmonic_bridge', 'bridge_service.py');
      console.log('Starting Python bridge with path:', pythonPath);
      console.log('Working directory:', process.cwd());

      // Set up initialization promise before spawning process to avoid race condition
      const initPromise = this.waitForInitialization();
      
      this.pythonProcess = spawn('python3', [pythonPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: path.join(process.cwd(), 'python', 'harmonic_bridge'),
        env: { ...process.env, PYTHONPATH: path.join(process.cwd(), 'python', 'harmonic_bridge') }
      });

      if (!this.pythonProcess.stdout || !this.pythonProcess.stdin) {
        throw new Error('Failed to create Python process pipes');
      }

      // Handle Python process output
      this.pythonProcess.stdout.on('data', (data: Buffer) => {
        const output = data.toString();
        console.log('Python process stdout:', output);
        
        const lines = output.split('\n').filter((line: string) => line.trim());
        for (const line of lines) {
          try {
            const response = JSON.parse(line);
            this.handlePythonResponse(response);
          } catch (err) {
            console.error('Failed to parse Python response:', line);
          }
        }
      });

      // Handle Python process errors
      this.pythonProcess.stderr?.on('data', (data) => {
        console.error('Python process error:', data.toString());
      });

      this.pythonProcess.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);
        this.isInitialized = false;
        this.emit('bridge_disconnected');
      });

      // Wait for initialization
      await initPromise;
      
      console.log('Harmonic Bridge Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Harmonic Bridge:', error);
      console.warn('Harmonic Bridge will not be available. Server will continue without it.');
      // Don't throw - allow server to continue without this service
      this.isInitialized = false;
    }
  }

  private waitForInitialization(timeout = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Python bridge initialization timeout'));
      }, timeout);

      const onResponse = (response: any) => {
        if (response.type === 'bridge_initialized') {
          clearTimeout(timer);
          this.isInitialized = true;
          resolve();
        }
      };

      this.on('python_response', onResponse);
    });
  }

  private handlePythonResponse(response: any): void {
    this.emit('python_response', response);

    // Handle request-response pattern
    if (response.request_id) {
      const pending = this.requestQueue.get(response.request_id);
      if (pending) {
        this.requestQueue.delete(response.request_id);
        if (response.success) {
          pending.resolve(response);
        } else {
          pending.reject(new Error(response.error || 'Unknown Python error'));
        }
      }
    }

    // Handle notifications and events
    if (response.type) {
      switch (response.type) {
        case 'bridge_initialized':
          this.emit('initialized');
          break;
        case 'bridge_shutdown':
          this.emit('shutdown');
          break;
        case 'warning':
          this.emit('warning', response.message);
          break;
      }
    }
  }

  private async sendRequest(command: string, params: any = {}): Promise<any> {
    if (!this.isInitialized || !this.pythonProcess?.stdin) {
      throw new Error('Harmonic bridge not initialized');
    }

    const requestId = `req_${++this.requestCounter}`;
    const request = {
      request_id: requestId,
      command,
      params
    };

    return new Promise((resolve, reject) => {
      this.requestQueue.set(requestId, { resolve, reject });

      // Set timeout for request
      setTimeout(() => {
        if (this.requestQueue.has(requestId)) {
          this.requestQueue.delete(requestId);
          reject(new Error(`Request timeout: ${command}`));
        }
      }, 30000); // 30 second timeout

      try {
        if (this.pythonProcess?.stdin) {
          this.pythonProcess.stdin.write(JSON.stringify(request) + '\n');
        } else {
          throw new Error('Python process stdin not available');
        }
      } catch (error) {
        this.requestQueue.delete(requestId);
        reject(error);
      }
    });
  }

  async processTask(taskType: string, payload: any, agentConfig?: any): Promise<any> {
    return this.sendRequest('process_task', {
      type: taskType,
      payload,
      agent_config: agentConfig
    });
  }

  async createAgent(agentType: string, agentId?: string): Promise<{agent_id: string, agent_status: any}> {
    const response = await this.sendRequest('create_agent', {
      type: agentType,
      id: agentId
    });
    return {
      agent_id: response.agent_id,
      agent_status: response.agent_status
    };
  }

  async analyzeHarmonics(data: any): Promise<{harmonic_state: number[], harmonic_analysis: any}> {
    const response = await this.sendRequest('analyze_harmonics', { data });
    return {
      harmonic_state: response.harmonic_state,
      harmonic_analysis: response.harmonic_analysis
    };
  }

  async calculateCoherence(state1: number[], state2: number[]): Promise<number> {
    const response = await this.sendRequest('calculate_coherence', { state1, state2 });
    return response.coherence;
  }

  async orchestrateAgents(task: string, agents?: string[], refine = false): Promise<OrchestrationResult> {
    const response = await this.sendRequest('orchestrate_agents', {
      task,
      agents,
      refine
    });
    return response.orchestration_result;
  }

  async recursiveImprove(performanceMetric: number): Promise<any> {
    return this.sendRequest('recursive_improve', {
      performance_metric: performanceMetric
    });
  }

  async getSystemStatus(includeMemory = false, includeAgents = true): Promise<SystemStatus> {
    const response = await this.sendRequest('get_system_status', {
      include_memory: includeMemory,
      include_agents: includeAgents
    });
    return response.system_status;
  }

  async spectralMultiply(
    freq1: number, amp1: number, phase1: number,
    freq2: number, amp2: number, phase2: number,
    numSamples = 128
  ): Promise<any> {
    return this.sendRequest('spectral_multiply', {
      freq1, amp1, phase1, freq2, amp2, phase2, num_samples: numSamples
    });
  }

  async searchMemory(query: string, threshold = 0.5): Promise<any> {
    return this.sendRequest('memory_search', { query, threshold });
  }

  async optimizeParameters(
    performanceData: number[], 
    configHistory: any[], 
    currentConfig: any
  ): Promise<any> {
    return this.sendRequest('optimize_parameters', {
      performance_data: performanceData,
      config_history: configHistory,
      current_config: currentConfig
    });
  }

  async coordinateEnsemble(agentHarmonics?: number[][], taskRequirements?: any): Promise<any> {
    return this.sendRequest('coordinate_ensemble', {
      agent_harmonics: agentHarmonics,
      task_requirements: taskRequirements
    });
  }

  async shutdown(): Promise<void> {
    if (this.pythonProcess) {
      this.pythonProcess.kill();
      this.pythonProcess = null;
    }
    this.isInitialized = false;
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

// Singleton instance
export const harmonicBridge = new HarmonicBridgeService();