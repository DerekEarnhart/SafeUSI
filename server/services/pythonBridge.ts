import { spawn, ChildProcess } from 'child_process';
import path from 'path';

export interface WSMEngineResult {
  harmonicState: number[];
  coherence: number;
  processingTime: number;
  symplecticOps: number;
  memoryUsage: number;
}

export interface CompressionResult {
  ratio: number;
  processingTime: number;
  success: boolean;
}

export interface HarmonicProcessingResult {
  stage: string;
  result: any;
  processingTime: number;
}

export class PythonBridge {
  private wsmProcess: ChildProcess | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Start the WSM engine process
      const pythonPath = path.join(process.cwd(), 'python');
      this.wsmProcess = spawn('python3', ['-u', path.join(pythonPath, 'wsm_engine.py')], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: pythonPath,
      });

      if (!this.wsmProcess.stdout || !this.wsmProcess.stderr) {
        throw new Error('Failed to create Python process pipes');
      }

      // Handle process errors
      this.wsmProcess.on('error', (error) => {
        console.error('WSM Engine process error:', error);
        this.isInitialized = false;
      });

      this.wsmProcess.on('exit', (code) => {
        console.log(`WSM Engine process exited with code ${code}`);
        this.isInitialized = false;
      });

      // Wait for initialization confirmation
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('WSM Engine initialization timeout'));
        }, 10000);

        this.wsmProcess!.stdout!.on('data', (data) => {
          const output = data.toString();
          if (output.includes('WSM_ENGINE_READY')) {
            clearTimeout(timeout);
            this.isInitialized = true;
            resolve();
          }
        });
      });

      console.log('WSM Engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize WSM Engine:', error);
      throw error;
    }
  }

  async executeWSMStep(input?: any): Promise<WSMEngineResult> {
    if (!this.isInitialized || !this.wsmProcess) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const command = {
        action: 'wsm_step',
        input: input || {},
      };

      const timeout = setTimeout(() => {
        reject(new Error('WSM step execution timeout'));
      }, 5000);

      const handleResponse = (data: Buffer) => {
        try {
          const output = data.toString();
          const lines = output.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            if (line.startsWith('WSM_RESULT:')) {
              const resultJson = line.replace('WSM_RESULT:', '');
              const result = JSON.parse(resultJson);
              clearTimeout(timeout);
              this.wsmProcess!.stdout!.off('data', handleResponse);
              resolve(result);
              return;
            }
          }
        } catch (error) {
          clearTimeout(timeout);
          this.wsmProcess!.stdout!.off('data', handleResponse);
          reject(error);
        }
      };

      this.wsmProcess!.stdout!.on('data', handleResponse);
      this.wsmProcess!.stdin!.write(JSON.stringify(command) + '\n');
    });
  }

  async compressFile(filename: string, content: Buffer): Promise<CompressionResult> {
    return new Promise((resolve, reject) => {
      const pythonPath = path.join(process.cwd(), 'python');
      const compressProcess = spawn('python3', ['-u', path.join(pythonPath, 'compression_engine.py')], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: pythonPath,
      });

      const command = {
        action: 'compress',
        filename,
        content: content.toString('base64'),
      };

      let result = '';
      compressProcess.stdout!.on('data', (data) => {
        result += data.toString();
      });

      compressProcess.on('close', (code) => {
        try {
          if (code === 0) {
            const lines = result.split('\n').filter(line => line.trim());
            for (const line of lines) {
              if (line.startsWith('COMPRESSION_RESULT:')) {
                const resultJson = line.replace('COMPRESSION_RESULT:', '');
                resolve(JSON.parse(resultJson));
                return;
              }
            }
            reject(new Error('No compression result found'));
          } else {
            reject(new Error(`Compression failed with code ${code}`));
          }
        } catch (error) {
          reject(error);
        }
      });

      compressProcess.stdin!.write(JSON.stringify(command) + '\n');
      compressProcess.stdin!.end();
    });
  }

  async processHarmonicStage(stage: string, input: any): Promise<HarmonicProcessingResult> {
    return new Promise((resolve, reject) => {
      const pythonPath = path.join(process.cwd(), 'python');
      const harmonicProcess = spawn('python3', ['-u', path.join(pythonPath, 'harmonic_processor.py')], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: pythonPath,
      });

      const command = {
        action: 'process_stage',
        stage,
        input,
      };

      let result = '';
      harmonicProcess.stdout!.on('data', (data) => {
        result += data.toString();
      });

      harmonicProcess.on('close', (code) => {
        try {
          if (code === 0) {
            const lines = result.split('\n').filter(line => line.trim());
            for (const line of lines) {
              if (line.startsWith('HARMONIC_RESULT:')) {
                const resultJson = line.replace('HARMONIC_RESULT:', '');
                resolve(JSON.parse(resultJson));
                return;
              }
            }
            reject(new Error('No harmonic result found'));
          } else {
            reject(new Error(`Harmonic processing failed with code ${code}`));
          }
        } catch (error) {
          reject(error);
        }
      });

      harmonicProcess.stdin!.write(JSON.stringify(command) + '\n');
      harmonicProcess.stdin!.end();
    });
  }

  async shutdown(): Promise<void> {
    if (this.wsmProcess) {
      this.wsmProcess.kill();
      this.wsmProcess = null;
      this.isInitialized = false;
    }
  }
}

export const pythonBridge = new PythonBridge();
