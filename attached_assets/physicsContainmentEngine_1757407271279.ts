import { googleRAGService } from './googleRAG';
import { HarmonicProcessor } from './harmonicProcessor';
import { VMIntegrationSystem } from './vmIntegration';

interface Vector3D {
  x: number;
  y: number;
  z: number;
}

interface AgentPhysicsObject {
  id: string;
  agentId: string;
  position: Vector3D;
  velocity: Vector3D;
  mass: number;
  harmonicSignature: number; // +/- charge for attraction/repulsion
  radius: number;
  color: string;
  vmId?: string; // Associated VM for this agent
  containmentLevel: 'basic' | 'enhanced' | 'maximum';
  capabilities: string[];
}

interface PhysicsEnvironmentState {
  objects: AgentPhysicsObject[];
  globalUnifyingField: number;
  harmonicCouplingConstant: number;
  dampingFactor: number;
  timeStep: number;
  boundaryConditions: {
    type: 'sphere' | 'cube' | 'infinite';
    radius?: number;
    size?: Vector3D;
  };
}

interface ContainmentMetrics {
  agentCount: number;
  activeInteractions: number;
  harmonicStability: number;
  containmentIntegrity: number;
  quantumCoherence: number;
  isolationEffectiveness: number;
}

export class PhysicsContainmentEngine {
  private environment: PhysicsEnvironmentState;
  private harmonicProcessor: HarmonicProcessor;
  private vmSystem: VMIntegrationSystem;
  private projectionCamera: Vector3D;
  private projectionDistance: number = 500.0;
  private isRunning: boolean = false;
  private simulationInterval?: NodeJS.Timeout;

  constructor() {
    this.harmonicProcessor = new HarmonicProcessor();
    this.vmSystem = new VMIntegrationSystem();
    this.projectionCamera = { x: 0, y: 0, z: -500 };
    
    // Initialize physics environment with ASI containment parameters
    this.environment = {
      objects: [],
      globalUnifyingField: 0.05, // Central attractor strength
      harmonicCouplingConstant: 0.5, // G in harmonic force equation
      dampingFactor: 0.98, // Energy dissipation
      timeStep: 0.1,
      boundaryConditions: {
        type: 'sphere',
        radius: 1000.0 // Containment boundary
      }
    };

    console.log('Physics Containment Engine initialized for ASI safety');
  }

  /**
   * Adds an ASI agent to the physics containment environment
   */
  async containAgent(agentId: string, capabilities: string[], containmentLevel: 'basic' | 'enhanced' | 'maximum'): Promise<AgentPhysicsObject> {
    // Determine harmonic signature based on agent capabilities
    const harmonicSignature = this.calculateHarmonicSignature(capabilities);
    
    // Create isolated VM for enhanced/maximum containment
    let vmId: string | undefined;
    if (containmentLevel !== 'basic') {
      // Create dedicated VM for this agent
      vmId = await this.createAgentVM(agentId, containmentLevel);
    }

    const agentObject: AgentPhysicsObject = {
      id: `agent_${Date.now()}_${agentId}`,
      agentId,
      position: this.generateSafeStartPosition(),
      velocity: { x: 0, y: 0, z: 0 },
      mass: 10 + capabilities.length, // Mass scales with capabilities
      harmonicSignature,
      radius: 5 + Math.sqrt(capabilities.length),
      color: this.getContainmentColor(containmentLevel),
      vmId,
      containmentLevel,
      capabilities
    };

    this.environment.objects.push(agentObject);
    console.log(`Agent ${agentId} contained in physics environment with ${containmentLevel} isolation`);
    
    return agentObject;
  }

  /**
   * Calculates harmonic signature based on agent capabilities
   * POST_SUPERHUMAN capabilities get negative signatures (repulsion from others)
   */
  private calculateHarmonicSignature(capabilities: string[]): number {
    let signature = 0.5; // Base positive signature
    
    if (capabilities.includes('POST_SUPERHUMAN')) {
      signature = -1.5; // Strong negative for ASI-level agents
    } else if (capabilities.includes('ADVANCED')) {
      signature = -0.5; // Mild negative for advanced agents
    } else if (capabilities.includes('CREATIVE') || capabilities.includes('REASONING')) {
      signature = 1.0; // Positive for beneficial capabilities
    }
    
    return signature;
  }

  /**
   * Generates a safe starting position within containment boundaries
   */
  private generateSafeStartPosition(): Vector3D {
    const maxRadius = (this.environment.boundaryConditions.radius || 1000) * 0.8;
    const angle1 = Math.random() * 2 * Math.PI;
    const angle2 = Math.random() * Math.PI;
    const radius = Math.random() * maxRadius * 0.5; // Start agents closer to center

    return {
      x: radius * Math.sin(angle2) * Math.cos(angle1),
      y: radius * Math.sin(angle2) * Math.sin(angle1),
      z: radius * Math.cos(angle2)
    };
  }

  /**
   * Creates dedicated VM for agent isolation
   */
  private async createAgentVM(agentId: string, containmentLevel: 'enhanced' | 'maximum'): Promise<string> {
    // In a real implementation, this would create an actual VM
    // For now, we simulate the VM creation process
    const vmConfig = {
      memory: containmentLevel === 'maximum' ? '2GB' : '1GB',
      cpu: containmentLevel === 'maximum' ? '2 cores' : '1 core',
      isolation: containmentLevel === 'maximum' ? 'hardware' : 'software',
      networkAccess: containmentLevel === 'maximum' ? 'none' : 'limited'
    };

    console.log(`Creating ${containmentLevel} VM for agent ${agentId}:`, vmConfig);
    return `vm_${agentId}_${Date.now()}`;
  }

  /**
   * Starts the physics simulation for real-time containment
   */
  startContainmentSimulation(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Starting physics containment simulation...');
    
    this.simulationInterval = setInterval(() => {
      this.updatePhysics();
    }, 50); // 20 FPS simulation
  }

  /**
   * Updates physics interactions between contained agents
   */
  private updatePhysics(): void {
    const objects = this.environment.objects;
    
    // Calculate harmonic forces between all agents
    for (let i = 0; i < objects.length; i++) {
      const obj1 = objects[i];
      let totalForce: Vector3D = { x: 0, y: 0, z: 0 };

      // Global unifying field (pulls toward center)
      const distanceFromOrigin = Math.sqrt(obj1.position.x ** 2 + obj1.position.y ** 2 + obj1.position.z ** 2);
      if (distanceFromOrigin > 0.1) {
        const unifyingForce = this.environment.globalUnifyingField * obj1.mass / distanceFromOrigin;
        totalForce.x -= (obj1.position.x / distanceFromOrigin) * unifyingForce;
        totalForce.y -= (obj1.position.y / distanceFromOrigin) * unifyingForce;
        totalForce.z -= (obj1.position.z / distanceFromOrigin) * unifyingForce;
      }

      // Pairwise harmonic interactions
      for (let j = 0; j < objects.length; j++) {
        if (i === j) continue;
        
        const obj2 = objects[j];
        const dx = obj2.position.x - obj1.position.x;
        const dy = obj2.position.y - obj1.position.y;
        const dz = obj2.position.z - obj1.position.z;
        const distance = Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2);
        
        if (distance > 0.1) { // Avoid singularities
          // Harmonic force: F = G * q1 * q2 / r^2
          const magnitude = (this.environment.harmonicCouplingConstant * obj1.harmonicSignature * obj2.harmonicSignature) / (distance ** 2);
          
          totalForce.x += (dx / distance) * magnitude;
          totalForce.y += (dy / distance) * magnitude;
          totalForce.z += (dz / distance) * magnitude;
        }
      }

      // Apply force to update velocity and position
      const acceleration = {
        x: totalForce.x / obj1.mass,
        y: totalForce.y / obj1.mass,
        z: totalForce.z / obj1.mass
      };

      obj1.velocity.x += acceleration.x * this.environment.timeStep;
      obj1.velocity.y += acceleration.y * this.environment.timeStep;
      obj1.velocity.z += acceleration.z * this.environment.timeStep;

      // Apply damping
      obj1.velocity.x *= this.environment.dampingFactor;
      obj1.velocity.y *= this.environment.dampingFactor;
      obj1.velocity.z *= this.environment.dampingFactor;

      // Update position
      obj1.position.x += obj1.velocity.x * this.environment.timeStep;
      obj1.position.y += obj1.velocity.y * this.environment.timeStep;
      obj1.position.z += obj1.velocity.z * this.environment.timeStep;

      // Enforce containment boundaries
      this.enforceContainmentBoundaries(obj1);
    }
  }

  /**
   * Enforces containment boundaries to prevent agent escape
   */
  private enforceContainmentBoundaries(obj: AgentPhysicsObject): void {
    if (this.environment.boundaryConditions.type === 'sphere') {
      const radius = this.environment.boundaryConditions.radius || 1000;
      const distance = Math.sqrt(obj.position.x ** 2 + obj.position.y ** 2 + obj.position.z ** 2);
      
      if (distance > radius) {
        // Reflect velocity and push back inside
        const scale = radius / distance;
        obj.position.x *= scale;
        obj.position.y *= scale;
        obj.position.z *= scale;
        
        // Reverse velocity component pointing outward
        obj.velocity.x *= -0.5;
        obj.velocity.y *= -0.5;
        obj.velocity.z *= -0.5;
        
        console.log(`Agent ${obj.agentId} hit containment boundary - contained`);
      }
    }
  }

  /**
   * Projects 3D physics environment to 2D for visualization
   */
  getVisualizationData(): any[] {
    return this.environment.objects.map(obj => {
      const relative = {
        x: obj.position.x - this.projectionCamera.x,
        y: obj.position.y - this.projectionCamera.y,
        z: obj.position.z - this.projectionCamera.z
      };

      if (relative.z <= 100) relative.z = 100; // Clamp for projection

      const scale = 100 / relative.z;
      
      return {
        agentId: obj.agentId,
        screenX: relative.x * scale + 400, // Center on 800px screen
        screenY: relative.y * scale + 300, // Center on 600px screen
        radius: Math.max(1, obj.radius * scale),
        color: obj.color,
        containmentLevel: obj.containmentLevel,
        capabilities: obj.capabilities,
        harmonicSignature: obj.harmonicSignature,
        vmId: obj.vmId
      };
    });
  }

  /**
   * Gets containment metrics for monitoring ASI safety
   */
  async getContainmentMetrics(): Promise<ContainmentMetrics> {
    const harmonicData = await this.harmonicProcessor.analyzeQuantumTopology(this.environment);
    
    return {
      agentCount: this.environment.objects.length,
      activeInteractions: this.calculateActiveInteractions(),
      harmonicStability: harmonicData.harmonicResonance.reduce((a, b) => a + b, 0) / harmonicData.harmonicResonance.length,
      containmentIntegrity: this.calculateContainmentIntegrity(),
      quantumCoherence: harmonicData.quantumEntanglement,
      isolationEffectiveness: this.calculateIsolationEffectiveness()
    };
  }

  private calculateActiveInteractions(): number {
    return this.environment.objects.length * (this.environment.objects.length - 1) / 2;
  }

  private calculateContainmentIntegrity(): number {
    // Check if all agents are within boundaries
    const radius = this.environment.boundaryConditions.radius || 1000;
    const contained = this.environment.objects.filter(obj => {
      const distance = Math.sqrt(obj.position.x ** 2 + obj.position.y ** 2 + obj.position.z ** 2);
      return distance <= radius;
    });
    
    return contained.length / this.environment.objects.length;
  }

  private calculateIsolationEffectiveness(): number {
    // Measure based on agent separation and VM isolation
    const isolatedAgents = this.environment.objects.filter(obj => obj.vmId).length;
    return isolatedAgents / this.environment.objects.length;
  }

  private getContainmentColor(level: 'basic' | 'enhanced' | 'maximum'): string {
    switch (level) {
      case 'basic': return '#00FF00';      // Green - basic containment
      case 'enhanced': return '#FFFF00';   // Yellow - enhanced containment  
      case 'maximum': return '#FF0000';    // Red - maximum containment
    }
  }

  stopContainmentSimulation(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = undefined;
    }
    this.isRunning = false;
    console.log('Physics containment simulation stopped');
  }

  getSystemStatus(): {
    isRunning: boolean;
    agentCount: number;
    containmentActive: boolean;
    physicsStable: boolean;
  } {
    return {
      isRunning: this.isRunning,
      agentCount: this.environment.objects.length,
      containmentActive: this.environment.objects.length > 0,
      physicsStable: this.calculateContainmentIntegrity() > 0.95
    };
  }
}

export const physicsContainmentEngine = new PhysicsContainmentEngine();