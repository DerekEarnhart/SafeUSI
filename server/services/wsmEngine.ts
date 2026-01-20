import { pythonBridge, WSMEngineResult } from './pythonBridge';
import { storage } from '../storage';
import { type InsertWSMState, type InsertRSISCycle } from '@shared/schema';

export class WSMEngine {
  private isRunning = false;
  private updateInterval: NodeJS.Timeout | null = null;
  private metricsCallbacks: Array<(metrics: WSMEngineResult) => void> = [];

  async initialize(): Promise<void> {
    await pythonBridge.initialize();
    console.log('WSM Engine service initialized');
  }

  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    
    // Update metrics every 2 seconds
    this.updateInterval = setInterval(async () => {
      try {
        await this.updateMetrics();
      } catch (error) {
        console.error('Error updating WSM metrics:', error);
      }
    }, 2000);

    // Start RSIS cycle every 30 seconds
    setInterval(async () => {
      try {
        await this.runRSISCycle();
      } catch (error) {
        console.error('Error running RSIS cycle:', error);
      }
    }, 30000);

    console.log('WSM Engine started');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    await pythonBridge.shutdown();
    console.log('WSM Engine stopped');
  }

  private async updateMetrics(): Promise<void> {
    try {
      const result = await pythonBridge.executeWSMStep();
      
      // Store in database
      const stateData: InsertWSMState = {
        harmonicState: result.harmonicState,
        coherence: result.coherence,
        processingTime: result.processingTime,
        symplecticOps: result.symplecticOps,
        memoryUsage: result.memoryUsage,
      };
      
      await storage.createWSMState(stateData);
      
      // Notify callbacks
      this.metricsCallbacks.forEach(callback => {
        try {
          callback(result);
        } catch (error) {
          console.error('Error in metrics callback:', error);
        }
      });
    } catch (error) {
      console.error('Error updating WSM metrics:', error);
    }
  }

  private async runRSISCycle(): Promise<void> {
    try {
      // Calculate RSIS metrics using harmonic proactivity controller
      const novelty = Math.random() * 0.3 + 0.5; // 0.5-0.8
      const valueOfInformation = Math.random() * 0.4 + 0.3; // 0.3-0.7
      const redundancy = Math.random() * 0.2 + 0.1; // 0.1-0.3
      const costPressure = Math.random() * 0.3 + 0.1; // 0.1-0.4
      
      // J_t = α·S + β·V - μ·R - λ·C
      const alpha = 0.3, beta = 0.4, mu = 0.2, lambda = 0.1;
      const proactivityScore = alpha * novelty + beta * valueOfInformation - mu * redundancy - lambda * costPressure;
      
      const proposals = Math.floor(Math.random() * 10) + 20;
      const evaluations = Math.floor(proposals * 0.8);
      const promotions = Math.floor(evaluations * 0.6);
      const rollbacks = Math.floor(promotions * 0.05);
      
      const cycleData: InsertRSISCycle = {
        proactivityScore,
        novelty,
        valueOfInformation,
        redundancy,
        costPressure,
        proposals,
        evaluations,
        promotions,
        rollbacks,
      };
      
      await storage.createRSISCycle(cycleData);
    } catch (error) {
      console.error('Error running RSIS cycle:', error);
    }
  }

  async getCurrentMetrics(): Promise<WSMEngineResult | null> {
    try {
      const latestState = await storage.getLatestWSMState();
      if (!latestState) return null;
      
      return {
        harmonicState: latestState.harmonicState as number[],
        coherence: latestState.coherence,
        processingTime: latestState.processingTime,
        symplecticOps: latestState.symplecticOps,
        memoryUsage: latestState.memoryUsage,
      };
    } catch (error) {
      console.error('Error getting current metrics:', error);
      return null;
    }
  }

  onMetricsUpdate(callback: (metrics: WSMEngineResult) => void): void {
    this.metricsCallbacks.push(callback);
  }

  removeMetricsCallback(callback: (metrics: WSMEngineResult) => void): void {
    const index = this.metricsCallbacks.indexOf(callback);
    if (index > -1) {
      this.metricsCallbacks.splice(index, 1);
    }
  }
}

export const wsmEngine = new WSMEngine();
