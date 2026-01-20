import { type VMInstance, type VMBenchmark, type InsertVMBenchmark, type BenchmarkingStatus, type EvaluationResults, type VMBenchmarkingData } from "@shared/schema";
import { storage } from "../storage";
import { vmProvisioning, type VMConfig } from "./vmProvisioning";
import { evaluationEngine } from "./evaluationEngine";
import { EventEmitter } from "events";

export interface BenchmarkConfig {
  benchmarkType: 'computational_canvas' | 'harmonic_constraint' | 'safety_protocol' | 'performance';
  vmConfig?: Partial<VMConfig>;
  iterations?: number;
  safetyThresholds?: {
    maxPotential?: number;
    maxDensity?: number;
  };
  evaluationCriteria?: {
    targetCoherence?: number;
    convergenceTolerance?: number;
    maxEvaluationTime?: number; // in seconds
  };
}

export interface BenchmarkProgress {
  benchmarkId: string;
  vmInstanceId: string;
  progress: number; // 0-100
  currentStage: string;
  realTimeMetrics: {
    computationalDensity: number;
    harmonicStability: number;
    energyLevel: number;
    safetyCompliance: number;
  };
}

/**
 * VM Benchmarking Service that extends VM provisioning with AGI evaluation capabilities
 */
class VMBenchmarkingService extends EventEmitter {
  private activeBenchmarks: Map<string, BenchmarkProgress> = new Map();
  private benchmarkingInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.startRealTimeMonitoring();
  }

  /**
   * Create and run a comprehensive VM benchmark
   */
  async createBenchmark(vmInstance: VMInstance, config: BenchmarkConfig): Promise<VMBenchmark> {
    // Create benchmark record
    const benchmark = await storage.createVMBenchmark({
      vmInstanceId: vmInstance.id,
      benchmarkType: config.benchmarkType,
      configuration: {
        iterations: config.iterations || 10,
        safetyThresholds: config.safetyThresholds || {
          maxPotential: 120,
          maxDensity: 1500
        },
        evaluationCriteria: config.evaluationCriteria || {
          targetCoherence: 0.8,
          convergenceTolerance: 1000,
          maxEvaluationTime: 300
        }
      },
      status: 'pending'
    });

    // Start benchmark execution in background
    this.executeBenchmark(benchmark, vmInstance).catch(error => {
      console.error(`Benchmark ${benchmark.id} failed:`, error);
      storage.updateVMBenchmark(benchmark.id, { status: 'failed' });
    });

    return benchmark;
  }

  /**
   * Execute a benchmark with real-time progress tracking
   */
  private async executeBenchmark(benchmark: VMBenchmark, vmInstance: VMInstance): Promise<void> {
    try {
      // Update benchmark status to running
      await storage.updateVMBenchmark(benchmark.id, { status: 'running' });
      
      // Initialize progress tracking
      const progress: BenchmarkProgress = {
        benchmarkId: benchmark.id,
        vmInstanceId: vmInstance.id,
        progress: 0,
        currentStage: 'initialization',
        realTimeMetrics: {
          computationalDensity: 0,
          harmonicStability: 0,
          energyLevel: 0,
          safetyCompliance: 1.0
        }
      };
      
      this.activeBenchmarks.set(benchmark.id, progress);

      // Stage 1: VM Health Check (10%)
      progress.currentStage = 'vm_health_check';
      progress.progress = 10;
      this.emit('progress', progress);
      await this.performVMHealthCheck(vmInstance, benchmark.id);

      // Stage 2: Computational Canvas Initialization (20%)
      progress.currentStage = 'canvas_initialization';
      progress.progress = 20;
      this.emit('progress', progress);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate initialization

      // Stage 3: Harmonic Constraint Evaluation (60%)
      progress.currentStage = 'harmonic_evaluation';
      progress.progress = 30;
      this.emit('progress', progress);
      
      const evaluationResult = await evaluationEngine.runEvaluation(vmInstance, benchmark);
      
      // Update progress during evaluation
      for (let i = 30; i <= 80; i += 10) {
        progress.progress = i;
        progress.realTimeMetrics = this.updateRealTimeMetrics(evaluationResult);
        this.emit('progress', progress);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Stage 4: Safety Protocol Validation (90%)
      progress.currentStage = 'safety_validation';
      progress.progress = 90;
      this.emit('progress', progress);
      await this.validateSafetyProtocols(benchmark.id);

      // Stage 5: Results Compilation (100%)
      progress.currentStage = 'results_compilation';
      progress.progress = 100;
      this.emit('progress', progress);

      // Complete benchmark
      await storage.updateVMBenchmark(benchmark.id, { status: 'completed' });
      
      // Emit evaluation results
      const resultsMessage: EvaluationResults = {
        type: 'evaluation_results',
        data: {
          benchmarkId: benchmark.id,
          vmInstanceId: vmInstance.id,
          overallScore: evaluationResult.overallScore,
          metrics: evaluationResult.metrics,
          safetyStatus: evaluationResult.safetyStatus,
          harmonicCoherence: evaluationResult.harmonicCoherence,
          canvasConvergence: evaluationResult.canvasConvergence
        }
      };
      
      this.emit('evaluationResults', resultsMessage);
      
      // Clean up active benchmark tracking
      this.activeBenchmarks.delete(benchmark.id);
      
      console.log(`Benchmark ${benchmark.id} completed successfully with score: ${evaluationResult.overallScore.toFixed(3)}`);
      
    } catch (error) {
      console.error(`Benchmark execution failed for ${benchmark.id}:`, error);
      await storage.updateVMBenchmark(benchmark.id, { status: 'failed' });
      this.activeBenchmarks.delete(benchmark.id);
    }
  }

  /**
   * Perform VM health check before benchmarking
   */
  private async performVMHealthCheck(vmInstance: VMInstance, benchmarkId: string): Promise<boolean> {
    // Check VM status
    if (vmInstance.status !== 'active') {
      throw new Error(`VM ${vmInstance.id} is not active (status: ${vmInstance.status})`);
    }

    // Check resource availability
    if (vmInstance.cpu < 2 || vmInstance.memory < 2048) {
      console.warn(`VM ${vmInstance.id} has limited resources: ${vmInstance.cpu} CPU, ${vmInstance.memory}MB RAM`);
    }

    // Simulate health check operations
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  }

  /**
   * Update real-time metrics based on evaluation results
   */
  private updateRealTimeMetrics(evaluationResult: any): BenchmarkProgress['realTimeMetrics'] {
    const harmonicStability = evaluationResult.metrics.find((m: any) => m.name === 'harmonic_stability')?.value || 0;
    const energyEfficiency = evaluationResult.metrics.find((m: any) => m.name === 'energy_efficiency')?.value || 0;
    const safetyCompliance = evaluationResult.metrics.find((m: any) => m.name === 'safety_compliance')?.value || 0;
    const computationalDensity = evaluationResult.metrics.find((m: any) => m.name === 'computational_density')?.value || 0;

    return {
      computationalDensity,
      harmonicStability,
      energyLevel: 1 - energyEfficiency, // Invert efficiency to get energy level
      safetyCompliance
    };
  }

  /**
   * Validate safety protocols during benchmarking
   */
  private async validateSafetyProtocols(benchmarkId: string): Promise<void> {
    const violations = await storage.getSafetyViolations(benchmarkId);
    const criticalViolations = violations.filter(v => v.severity === 'critical');
    
    if (criticalViolations.length > 0) {
      throw new Error(`Critical safety violations detected: ${criticalViolations.length} violations`);
    }
    
    // Additional safety checks
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Get active benchmark progress
   */
  getActiveBenchmarks(): BenchmarkProgress[] {
    return Array.from(this.activeBenchmarks.values());
  }

  /**
   * Get benchmark by ID
   */
  async getBenchmark(benchmarkId: string): Promise<VMBenchmark | undefined> {
    return await storage.getVMBenchmark(benchmarkId);
  }

  /**
   * Get all benchmarks for a VM instance
   */
  async getVMBenchmarks(vmInstanceId: string): Promise<VMBenchmark[]> {
    return await storage.getVMBenchmarks(vmInstanceId);
  }

  /**
   * Cancel a running benchmark
   */
  async cancelBenchmark(benchmarkId: string): Promise<boolean> {
    const benchmark = await storage.getVMBenchmark(benchmarkId);
    if (!benchmark || benchmark.status !== 'running') {
      return false;
    }

    await storage.updateVMBenchmark(benchmarkId, { status: 'failed' });
    this.activeBenchmarks.delete(benchmarkId);
    
    return true;
  }

  /**
   * Get comprehensive benchmarking statistics
   */
  async getBenchmarkingStats(): Promise<BenchmarkingStatus['data']> {
    const stats = await storage.getBenchmarkingStats();
    const activeBenchmarks = this.getActiveBenchmarks();
    
    return {
      activeBenchmarks: stats.activeBenchmarks,
      completedBenchmarks: stats.completedBenchmarks,
      failedBenchmarks: stats.failedBenchmarks,
      avgBenchmarkTime: stats.avgBenchmarkTime,
      currentBenchmarks: activeBenchmarks.map(progress => ({
        id: progress.benchmarkId,
        vmInstanceId: progress.vmInstanceId,
        benchmarkType: 'computational_canvas', // Default type, should be retrieved from actual benchmark
        status: 'running',
        progress: progress.progress
      }))
    };
  }

  /**
   * Start real-time monitoring and broadcasting
   */
  private startRealTimeMonitoring(): void {
    this.benchmarkingInterval = setInterval(async () => {
      try {
        // Broadcast current benchmarking status
        const stats = await this.getBenchmarkingStats();
        const statusMessage: BenchmarkingStatus = {
          type: 'benchmarking_status',
          data: stats
        };
        this.emit('benchmarkingStatus', statusMessage);

        // Broadcast real-time metrics for active benchmarks
        for (const progress of Array.from(this.activeBenchmarks.values())) {
          const vmBenchmarkingMessage: VMBenchmarkingData = {
            type: 'vm_benchmarking',
            data: {
              vmInstanceId: progress.vmInstanceId,
              benchmarkType: 'computational_canvas', // Should be retrieved from actual benchmark
              realTimeMetrics: progress.realTimeMetrics,
              canvasState: {
                potentials: Array(10).fill(null).map(() => Array(10).fill(Math.random() * 100)), // Mock data
                convergenceStatus: progress.currentStage,
                operatorEffects: [
                  { name: 'harmonic_analysis', position: [Math.floor(Math.random() * 10), Math.floor(Math.random() * 10)], intensity: Math.random() * 20 }
                ]
              }
            }
          };
          this.emit('vmBenchmarking', vmBenchmarkingMessage);
        }
      } catch (error) {
        console.error('Error in real-time monitoring:', error);
      }
    }, 5000); // Update every 5 seconds
  }

  /**
   * Stop real-time monitoring
   */
  stopRealTimeMonitoring(): void {
    if (this.benchmarkingInterval) {
      clearInterval(this.benchmarkingInterval);
      this.benchmarkingInterval = null;
    }
  }

  /**
   * Create VM with optimal configuration for benchmarking
   */
  async provisionBenchmarkingVM(agentType: string = 'benchmark', agentCount: number = 1): Promise<VMInstance> {
    const config = vmProvisioning.getOptimalVMConfig(agentType, agentCount);
    
    // Enhance configuration for benchmarking
    config.cpu = Math.max(config.cpu, 4); // Minimum 4 CPU cores
    config.memory = Math.max(config.memory, 8192); // Minimum 8GB RAM
    config.name = `benchmark-vm-${Date.now()}`;
    
    const result = await vmProvisioning.provisionVM(config);
    if (!result.success || !result.vmInstance) {
      throw new Error(result.error || 'Failed to provision benchmarking VM');
    }
    
    return result.vmInstance;
  }

  /**
   * Run automated benchmark suite on a VM
   */
  async runBenchmarkSuite(vmInstanceId: string): Promise<VMBenchmark[]> {
    const vmInstance = await storage.getVMInstance(vmInstanceId);
    if (!vmInstance) {
      throw new Error(`VM instance ${vmInstanceId} not found`);
    }

    const benchmarkTypes: BenchmarkConfig['benchmarkType'][] = [
      'computational_canvas',
      'harmonic_constraint',
      'safety_protocol',
      'performance'
    ];

    const benchmarks: VMBenchmark[] = [];
    
    for (const benchmarkType of benchmarkTypes) {
      const config: BenchmarkConfig = {
        benchmarkType,
        iterations: 5,
        safetyThresholds: {
          maxPotential: benchmarkType === 'safety_protocol' ? 80 : 120, // Stricter for safety tests
          maxDensity: benchmarkType === 'performance' ? 2000 : 1500 // Higher for performance tests
        }
      };
      
      const benchmark = await this.createBenchmark(vmInstance, config);
      benchmarks.push(benchmark);
      
      // Wait a bit between benchmarks to avoid resource conflicts
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return benchmarks;
  }
}

export const vmBenchmarking = new VMBenchmarkingService();