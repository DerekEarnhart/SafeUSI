import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';

export interface LlamaRequest {
  text: string;
  taskType: 'summarize' | 'analyze' | 'extract' | 'chat' | 'enhance' | 'question';
  context?: string;
  wsmContext?: {
    harmonicState?: any;
    coherence?: number;
    [key: string]: any;
  };
  preserveReasoning?: boolean;
}

export interface LlamaResponse {
  response: string;
  taskType: string;
  processingTime: number;
  modelUsed: string;
  wsmEnhanced: boolean;
  reasoningPreserved: boolean;
  metadata: Record<string, any>;
}

export interface LlamaConfig {
  modelPath?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  contextLength?: number;
  useLocalFallback?: boolean;
  preserveWsmReasoning?: boolean;
}

export class LlamaService extends EventEmitter {
  private pythonProcess: ChildProcess | null = null;
  private isInitialized = false;
  private requestCounter = 0;
  private requestQueue = new Map<string, { resolve: Function; reject: Function }>();
  private config: LlamaConfig;

  constructor(config: LlamaConfig = {}) {
    super();
    this.config = {
      maxTokens: 1024,
      temperature: 0.7,
      topP: 0.9,
      contextLength: 4096,
      useLocalFallback: true,
      preserveWsmReasoning: true,
      ...config
    };
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      const pythonPath = path.join(process.cwd(), 'python', 'nlp_services', 'llama_processor.py');
      console.log(`[LlamaService] Starting Llama processor: ${pythonPath}`);

      this.pythonProcess = spawn('python3', [pythonPath], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      if (!this.pythonProcess.stdout || !this.pythonProcess.stderr || !this.pythonProcess.stdin) {
        throw new Error('Failed to create Python process streams');
      }

      // Set up event handlers
      this.pythonProcess.stdout.on('data', (data) => {
        this.handlePythonOutput(data.toString());
      });

      this.pythonProcess.stderr.on('data', (data) => {
        const error = data.toString();
        console.error('[LlamaService] Python error:', error);
        this.emit('error', error);
      });

      this.pythonProcess.on('close', (code) => {
        console.log(`[LlamaService] Python process exited with code ${code}`);
        this.isInitialized = false;
        this.pythonProcess = null;
      });

      this.pythonProcess.on('error', (error) => {
        console.error('[LlamaService] Python process error:', error);
        this.emit('error', error);
        this.isInitialized = false;
      });

      // Wait for initialization confirmation
      await this.waitForInitialization();
      
      // Configure the processor
      await this.configure(this.config);
      
      this.isInitialized = true;
      console.log('[LlamaService] Llama service initialized successfully');
      
      return true;

    } catch (error) {
      console.error('[LlamaService] Initialization failed:', error);
      this.cleanup();
      return false;
    }
  }

  private async waitForInitialization(timeout = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Llama service initialization timeout'));
      }, timeout);

      const checkInit = (data: string) => {
        if (data.includes('LLAMA_INITIALIZED')) {
          clearTimeout(timer);
          this.pythonProcess?.stdout?.off('data', checkInit);
          resolve();
        } else if (data.includes('LLAMA_ERROR')) {
          clearTimeout(timer);
          this.pythonProcess?.stdout?.off('data', checkInit);
          reject(new Error('Llama initialization error'));
        }
      };

      this.pythonProcess?.stdout?.on('data', checkInit);
    });
  }

  private handlePythonOutput(data: string): void {
    const lines = data.trim().split('\n');
    
    for (const line of lines) {
      if (line.startsWith('LLAMA_RESULT:')) {
        try {
          const result = JSON.parse(line.substring('LLAMA_RESULT:'.length));
          const requestId = result.request_id;
          
          if (requestId && this.requestQueue.has(requestId)) {
            const { resolve } = this.requestQueue.get(requestId)!;
            this.requestQueue.delete(requestId);
            resolve(result);
          } else {
            // Handle responses without request ID (status, etc.)
            this.emit('response', result);
          }
        } catch (error) {
          console.error('[LlamaService] Failed to parse Python response:', error);
        }
      } else if (line.startsWith('LLAMA_ERROR:')) {
        const error = line.substring('LLAMA_ERROR:'.length);
        console.error('[LlamaService] Python error:', error);
        this.emit('error', error);
      } else if (line.startsWith('LLAMA_INITIALIZED:')) {
        this.emit('initialized');
      }
    }
  }

  async processRequest(request: LlamaRequest): Promise<LlamaResponse> {
    if (!this.isInitialized || !this.pythonProcess?.stdin) {
      throw new Error('Llama service not initialized');
    }

    const requestId = `req_${++this.requestCounter}`;
    const command = {
      request_id: requestId,
      action: 'process',
      request: {
        text: request.text,
        task_type: request.taskType,
        context: request.context,
        wsm_context: request.wsmContext,
        preserve_reasoning: request.preserveReasoning ?? this.config.preserveWsmReasoning
      }
    };

    return new Promise((resolve, reject) => {
      this.requestQueue.set(requestId, { resolve, reject });

      // Set timeout for request
      setTimeout(() => {
        if (this.requestQueue.has(requestId)) {
          this.requestQueue.delete(requestId);
          reject(new Error(`Llama request timeout: ${request.taskType}`));
        }
      }, 30000); // 30 second timeout

      try {
        if (this.pythonProcess?.stdin) {
          this.pythonProcess.stdin.write(JSON.stringify(command) + '\n');
        } else {
          throw new Error('Python process stdin not available');
        }
      } catch (error) {
        this.requestQueue.delete(requestId);
        reject(error);
      }
    }).then((result: any) => {
      // Return the actual response from the nested structure
      return result.response as LlamaResponse;
    });
  }

  async getStatus(): Promise<any> {
    if (!this.isInitialized || !this.pythonProcess?.stdin) {
      return {
        initialized: false,
        error: 'Service not initialized'
      };
    }

    const requestId = `status_${++this.requestCounter}`;
    const command = {
      request_id: requestId,
      action: 'status'
    };

    return new Promise((resolve, reject) => {
      this.requestQueue.set(requestId, { resolve, reject });

      setTimeout(() => {
        if (this.requestQueue.has(requestId)) {
          this.requestQueue.delete(requestId);
          reject(new Error('Status request timeout'));
        }
      }, 5000);

      try {
        if (this.pythonProcess?.stdin) {
          this.pythonProcess.stdin.write(JSON.stringify(command) + '\n');
        } else {
          throw new Error('Python process stdin not available');
        }
      } catch (error) {
        this.requestQueue.delete(requestId);
        reject(error);
      }
    }).then((result: any) => {
      return result.status;
    });
  }

  async configure(config: Partial<LlamaConfig>): Promise<void> {
    this.config = { ...this.config, ...config };

    if (!this.isInitialized || !this.pythonProcess?.stdin) {
      return;
    }

    const requestId = `config_${++this.requestCounter}`;
    const command = {
      request_id: requestId,
      action: 'configure',
      config: this.config
    };

    return new Promise((resolve, reject) => {
      this.requestQueue.set(requestId, { resolve, reject });

      setTimeout(() => {
        if (this.requestQueue.has(requestId)) {
          this.requestQueue.delete(requestId);
          reject(new Error('Configure request timeout'));
        }
      }, 5000);

      try {
        if (this.pythonProcess?.stdin) {
          this.pythonProcess.stdin.write(JSON.stringify(command) + '\n');
        } else {
          throw new Error('Python process stdin not available');
        }
      } catch (error) {
        this.requestQueue.delete(requestId);
        reject(error);
      }
    });
  }

  // WSM Integration Methods
  async processWithWSMContext(
    text: string, 
    taskType: LlamaRequest['taskType'],
    wsmContext: any
  ): Promise<LlamaResponse> {
    return this.processRequest({
      text,
      taskType,
      wsmContext,
      preserveReasoning: true
    });
  }

  async enhanceWithHarmonicContext(
    text: string,
    harmonicState: any,
    coherence: number
  ): Promise<LlamaResponse> {
    return this.processRequest({
      text,
      taskType: 'enhance',
      wsmContext: {
        harmonicState,
        coherence
      },
      preserveReasoning: true
    });
  }

  getConfig(): LlamaConfig {
    return { ...this.config };
  }

  isReady(): boolean {
    return this.isInitialized && this.pythonProcess !== null;
  }

  cleanup(): void {
    if (this.pythonProcess) {
      this.pythonProcess.kill();
      this.pythonProcess = null;
    }
    this.isInitialized = false;
    this.requestQueue.clear();
  }
}

// Singleton instance
let llamaServiceInstance: LlamaService | null = null;

export function getLlamaService(config?: LlamaConfig): LlamaService {
  if (!llamaServiceInstance) {
    llamaServiceInstance = new LlamaService(config);
  }
  return llamaServiceInstance;
}

export async function initializeLlamaService(config?: LlamaConfig): Promise<boolean> {
  const service = getLlamaService(config);
  return await service.initialize();
}