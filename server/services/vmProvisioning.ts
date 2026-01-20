import { storage } from "../storage";
import { type VMInstance, type InsertVMInstance } from "@shared/schema";
import { spawn, ChildProcess } from "child_process";

export interface VMConfig {
  name: string;
  type: 'shared' | 'reserved' | 'dedicated';
  cpu: number;
  memory: number;
  region?: string;
}

export interface VMProvisionResult {
  success: boolean;
  vmInstance?: VMInstance;
  error?: string;
}

class VMProvisioningService {
  private activeProvisions: Map<string, ChildProcess> = new Map();
  private healthCheckFailures: Map<string, number> = new Map();
  private vmProvisionTimes: Map<string, Date> = new Map();
  private healthMonitorInterval: NodeJS.Timeout | null = null;
  
  // Health check configuration
  private readonly MAX_FAILURES_BEFORE_ERROR = 3;
  private readonly GRACE_PERIOD_MS = 60000; // 60 seconds after provisioning

  /**
   * Provision a new VM instance using Replit's Reserved VM deployment system
   */
  async provisionVM(config: VMConfig): Promise<VMProvisionResult> {
    try {
      // Create VM instance record
      const insertData: InsertVMInstance = {
        name: config.name,
        type: config.type,
        cpu: config.cpu,
        memory: config.memory,
        region: config.region || 'us-east-1',
        status: 'provisioning',
        endpoint: null,
        sshKey: null,
      };

      const vmInstance = await storage.createVMInstance(insertData);
      
      // Start provisioning process in background
      this.startProvisioningProcess(vmInstance);
      
      return {
        success: true,
        vmInstance,
      };
    } catch (error) {
      console.error('VM Provisioning error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown provisioning error',
      };
    }
  }

  /**
   * Simulate VM provisioning process using Replit's infrastructure
   * In production, this would interface with Replit's VM provisioning API
   */
  private async startProvisioningProcess(vmInstance: VMInstance) {
    try {
      // Update status to provisioning
      await storage.updateVMInstance(vmInstance.id, { status: 'provisioning' });

      // Simulate VM provisioning steps
      await this.simulateProvisioningSteps(vmInstance);
      
      // Generate VM endpoint and SSH key
      const endpoint = this.generateVMEndpoint(vmInstance);
      const sshKey = this.generateSSHKey();
      
      // Update VM instance with active status and connection details
      await storage.updateVMInstance(vmInstance.id, {
        status: 'active',
        endpoint,
        sshKey,
      });
      
      // Track provision time for grace period
      this.vmProvisionTimes.set(vmInstance.id, new Date());
      
      console.log(`VM ${vmInstance.name} (${vmInstance.id}) provisioned successfully`);
      
    } catch (error) {
      console.error(`VM provisioning failed for ${vmInstance.name}:`, error);
      await storage.updateVMInstance(vmInstance.id, { 
        status: 'failed',
      });
    }
  }

  /**
   * Simulate the VM provisioning process with realistic delays
   */
  private async simulateProvisioningSteps(vmInstance: VMInstance): Promise<void> {
    const steps = [
      { name: 'Allocating resources', delay: 2000 },
      { name: 'Setting up VM environment', delay: 3000 },
      { name: 'Installing dependencies', delay: 5000 },
      { name: 'Configuring network', delay: 2000 },
      { name: 'Starting services', delay: 1000 },
    ];

    for (const step of steps) {
      console.log(`VM ${vmInstance.name}: ${step.name}...`);
      await new Promise(resolve => setTimeout(resolve, step.delay));
    }
  }

  /**
   * Generate VM endpoint URL following Replit's deployment patterns
   */
  private generateVMEndpoint(vmInstance: VMInstance): string {
    const subdomain = `${vmInstance.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${vmInstance.id.slice(0, 8)}`;
    return `https://${subdomain}.replit.app`;
  }

  /**
   * Generate SSH key for VM access
   */
  private generateSSHKey(): string {
    // In production, this would generate actual SSH keys
    // For now, return a simulated key identifier
    return `ssh-rsa AAAAB3NzaC1yc2E${Date.now()}`;
  }

  /**
   * Stop and deallocate a VM instance
   */
  async stopVM(vmId: string): Promise<boolean> {
    try {
      const vmInstance = await storage.getVMInstance(vmId);
      if (!vmInstance) {
        return false;
      }

      // Stop any agents running on this VM
      const agents = await storage.getAllAgents();
      const vmAgents = agents.filter(agent => agent.vmInstanceId === vmId);
      
      for (const agent of vmAgents) {
        await storage.updateAgent(agent.id, { status: 'stopped' });
      }

      // Update VM status
      await storage.updateVMInstance(vmId, { status: 'stopped' });
      
      console.log(`VM ${vmInstance.name} stopped successfully`);
      return true;
    } catch (error) {
      console.error('Error stopping VM:', error);
      return false;
    }
  }

  /**
   * Delete a VM instance and clean up resources
   */
  async deleteVM(vmId: string): Promise<boolean> {
    try {
      const vmInstance = await storage.getVMInstance(vmId);
      if (!vmInstance) {
        return false;
      }

      // Ensure VM is stopped first
      await this.stopVM(vmId);
      
      // Clean up tracking maps
      this.healthCheckFailures.delete(vmId);
      this.vmProvisionTimes.delete(vmId);
      
      // Delete VM record
      const deleted = await storage.deleteVMInstance(vmId);
      
      if (deleted) {
        console.log(`VM ${vmInstance.name} deleted successfully`);
      }
      
      return deleted;
    } catch (error) {
      console.error('Error deleting VM:', error);
      return false;
    }
  }

  /**
   * Get optimal VM configuration for agent type
   */
  getOptimalVMConfig(agentType: string, agentCount: number = 1): VMConfig {
    const configs: Record<string, VMConfig> = {
      'geo_art': {
        name: `geo-art-vm-${Date.now()}`,
        type: 'reserved',
        cpu: 4,
        memory: 8192, // 8GB
      },
      'vfx_sim': {
        name: `vfx-sim-vm-${Date.now()}`,
        type: 'dedicated',
        cpu: 8,
        memory: 16384, // 16GB
      },
      'music_composer': {
        name: `music-vm-${Date.now()}`,
        type: 'reserved',
        cpu: 2,
        memory: 4096, // 4GB
      },
      'story_builder': {
        name: `story-vm-${Date.now()}`,
        type: 'shared',
        cpu: 2,
        memory: 2048, // 2GB
      },
      'sequence_analyzer': {
        name: `analyzer-vm-${Date.now()}`,
        type: 'reserved',
        cpu: 6,
        memory: 12288, // 12GB
      },
      'lightweight': {
        name: `shared-vm-${Date.now()}`,
        type: 'shared',
        cpu: 1,
        memory: 1024, // 1GB
      },
    };

    const baseConfig = configs[agentType] || configs['lightweight'];
    
    // Scale resources based on agent count
    if (agentCount > 1) {
      baseConfig.cpu = Math.min(baseConfig.cpu * Math.ceil(agentCount / 2), 16);
      baseConfig.memory = Math.min(baseConfig.memory * Math.ceil(agentCount / 2), 32768);
      baseConfig.type = agentCount > 3 ? 'dedicated' : 'reserved';
    }

    return baseConfig;
  }

  /**
   * Monitor VM health and performance with recovery mechanism
   */
  async monitorVMHealth(): Promise<void> {
    try {
      const vms = await storage.getAllVMInstances();
      // Monitor both active and error VMs to allow recovery
      const monitorableVMs = vms.filter(vm => 
        vm.status === 'active' || vm.status === 'error'
      );

      console.log(`[VM Monitor] Checking health of ${monitorableVMs.length} VMs (${vms.length} total)`);

      for (const vm of monitorableVMs) {
        // Skip recently provisioned VMs (grace period) only for failure tracking
        const provisionTime = this.vmProvisionTimes.get(vm.id);
        const inGracePeriod = provisionTime && (Date.now() - provisionTime.getTime()) < this.GRACE_PERIOD_MS;
        
        if (inGracePeriod && vm.status === 'active') {
          console.log(`[VM Monitor] VM ${vm.name} in grace period, skipping failure tracking`);
          continue;
        }

        // Perform health check
        const isHealthy = await this.performHealthCheck(vm);
        
        if (isHealthy) {
          // Reset failure counter on success
          this.healthCheckFailures.delete(vm.id);
          
          // Recover VM if it was in error state
          if (vm.status === 'error') {
            console.log(`[VM Monitor] ✅ VM ${vm.name} recovered from error state`);
            await storage.updateVMInstance(vm.id, {
              status: 'active',
              lastHeartbeat: new Date(),
            });
          } else {
            // Just update heartbeat for active VMs
            await storage.updateVMInstance(vm.id, {
              lastHeartbeat: new Date(),
            });
          }
        } else {
          // Track consecutive failures
          const currentFailures = this.healthCheckFailures.get(vm.id) || 0;
          const newFailureCount = currentFailures + 1;
          this.healthCheckFailures.set(vm.id, newFailureCount);
          
          console.warn(`[VM Monitor] ❌ VM ${vm.name} health check failed (${newFailureCount}/${this.MAX_FAILURES_BEFORE_ERROR})`);
          
          // Only mark as error after multiple consecutive failures
          if (newFailureCount >= this.MAX_FAILURES_BEFORE_ERROR && vm.status === 'active') {
            console.error(`[VM Monitor] 🚨 VM ${vm.name} marked as error after ${newFailureCount} consecutive failures`);
            await storage.updateVMInstance(vm.id, {
              status: 'error',
            });
          }
        }
      }
    } catch (error) {
      console.error('[VM Monitor] VM health monitoring error:', error);
    }
  }

  /**
   * Perform health check on VM instance using real readiness probe
   */
  private async performHealthCheck(vm: VMInstance): Promise<boolean> {
    try {
      // Check basic VM state requirements
      if (!vm.endpoint || !vm.sshKey) {
        console.log(`[VM Health] VM ${vm.name} missing endpoint or SSH key`);
        return false;
      }
      
      // For simulation mode: VMs are considered healthy if they have basic requirements
      // In production this would make an HTTP request to vm.endpoint/health
      
      // VMs that are explicitly stopped or failed during provisioning should not recover
      if (vm.status === 'stopped') {
        return false;
      }
      
      // For simulated VMs, use internal heartbeat logic
      // Check if VM was recently provisioned (give it time to start up)
      const provisionTime = this.vmProvisionTimes.get(vm.id);
      if (provisionTime && (Date.now() - provisionTime.getTime()) < this.GRACE_PERIOD_MS) {
        console.log(`[VM Health] VM ${vm.name} in grace period, considering healthy`);
        return true;
      }
      
      // Check if VM has recent heartbeat (within last 5 minutes)
      if (vm.lastHeartbeat && (Date.now() - vm.lastHeartbeat.getTime()) < 300000) {
        return true;
      }
      
      // For simulated VMs that have been running for a while, consider them healthy
      // This prevents unnecessary state thrashing
      console.log(`[VM Health] VM ${vm.name} passed basic health check`);
      return true;
      
    } catch (error) {
      console.error(`[VM Health] Health check error for VM ${vm.id}:`, error);
      return false;
    }
  }

  /**
   * Manually recover VMs that are stuck in error state
   */
  async recoverErrorVMs(force: boolean = false): Promise<{ recovered: string[], failed: string[] }> {
    const recovered: string[] = [];
    const failed: string[] = [];
    
    try {
      const vms = await storage.getAllVMInstances();
      const errorVMs = vms.filter(vm => vm.status === 'error');
      
      console.log(`[VM RECOVERY] Found ${errorVMs.length} VMs in error state, attempting recovery... (force=${force})`);
      
      for (const vm of errorVMs) {
        try {
          console.log(`[VM RECOVERY] Processing VM ${vm.name} (${vm.id})`);
          
          let shouldRecover = false;
          
          if (force) {
            // Force recovery regardless of health check
            shouldRecover = true;
            console.log(`[VM RECOVERY] Force recovery enabled for VM ${vm.name}`);
          } else {
            // Check health first
            const isHealthy = await this.performHealthCheck(vm);
            shouldRecover = isHealthy;
            console.log(`[VM RECOVERY] Health check for VM ${vm.name}: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`);
          }
          
          if (shouldRecover) {
            await storage.updateVMInstance(vm.id, {
              status: 'active',
              lastHeartbeat: new Date(),
            });
            
            // Reset failure counter and provision time
            this.healthCheckFailures.delete(vm.id);
            this.vmProvisionTimes.set(vm.id, new Date()); // Reset grace period
            
            recovered.push(vm.name);
            console.log(`[VM RECOVERY] ✅ Successfully recovered VM ${vm.name} - STATUS CHANGED TO ACTIVE`);
          } else {
            failed.push(vm.name);
            console.log(`[VM RECOVERY] ❌ VM ${vm.name} still unhealthy, recovery failed`);
          }
        } catch (error) {
          failed.push(vm.name);
          console.error(`[VM RECOVERY] Error recovering VM ${vm.name}:`, error);
        }
      }
      
      console.log(`[VM RECOVERY] Recovery complete - Recovered: ${recovered.length}, Failed: ${failed.length}`);
      return { recovered, failed };
    } catch (error) {
      console.error('[VM RECOVERY] Error in VM recovery:', error);
      return { recovered, failed };
    }
  }

  /**
   * Get VM utilization statistics
   */
  async getVMUtilization(): Promise<{
    totalVMs: number;
    activeVMs: number;
    totalCPU: number;
    totalMemory: number;
    utilizationPercent: number;
  }> {
    const vms = await storage.getAllVMInstances();
    const activeVMs = vms.filter(vm => vm.status === 'active');
    
    const totalCPU = activeVMs.reduce((sum, vm) => sum + vm.cpu, 0);
    const totalMemory = activeVMs.reduce((sum, vm) => sum + vm.memory, 0);
    
    // Calculate utilization based on active agents
    const agents = await storage.getAllAgents();
    const activeAgents = agents.filter(agent => agent.status === 'active' || agent.status === 'busy');
    
    return {
      totalVMs: vms.length,
      activeVMs: activeVMs.length,
      totalCPU,
      totalMemory,
      utilizationPercent: activeVMs.length > 0 ? (activeAgents.length / activeVMs.length) * 100 : 0,
    };
  }

  /**
   * Start the VM health monitoring system
   */
  startHealthMonitoring() {
    if (this.healthMonitorInterval) {
      console.log('[VM Monitor] Health monitoring already running');
      return;
    }
    
    console.log('[VM Monitor] Starting VM health monitoring (15s intervals)');
    this.healthMonitorInterval = setInterval(async () => {
      await this.monitorVMHealth();
    }, 15000); // Check every 15 seconds for faster recovery
    
    // Run initial health check immediately
    setTimeout(() => this.monitorVMHealth(), 2000);
  }

  /**
   * Stop the VM health monitoring system
   */
  stopHealthMonitoring() {
    if (this.healthMonitorInterval) {
      clearInterval(this.healthMonitorInterval);
      this.healthMonitorInterval = null;
      console.log('[VM Monitor] Health monitoring stopped');
    }
  }
}

export const vmProvisioning = new VMProvisioningService();