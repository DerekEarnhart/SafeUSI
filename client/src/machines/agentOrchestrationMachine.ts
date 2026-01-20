import { createMachine, assign, fromPromise } from 'xstate';

// Agent Orchestration Context
interface AgentOrchestrationContext {
  activeAgents: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    coherence: number;
    harmonicState?: number[];
    lastActivity?: string;
  }>;
  workflows: Array<{
    id: string;
    name: string;
    status: string;
    agentIds: string[];
  }>;
  communications: Array<{
    fromAgent: string;
    toAgent: string;
    messageType: string;
    timestamp: string;
    harmonicSignature?: number[];
  }>;
  systemCoherence: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  errorMessage?: string;
}

// Agent Orchestration Events
type AgentOrchestrationEvent = 
  | { type: 'INITIALIZE_ORCHESTRATION' }
  | { type: 'SPAWN_AGENT'; agentConfig: any }
  | { type: 'START_WORKFLOW'; workflow: any }
  | { type: 'AGENT_MESSAGE'; fromAgent: string; toAgent: string; message: any }
  | { type: 'AGENT_COMPLETED_TASK'; agentId: string; result: any }
  | { type: 'AGENT_FAILED_TASK'; agentId: string; error: string }
  | { type: 'UPDATE_SYSTEM_COHERENCE'; coherence: number }
  | { type: 'PAUSE_ORCHESTRATION' }
  | { type: 'RESUME_ORCHESTRATION' }
  | { type: 'SHUTDOWN' }
  | { type: 'ERROR'; error: string };

// Agent Orchestration State Machine
export const agentOrchestrationMachine = createMachine({
  id: 'agentOrchestration',
  initial: 'idle',
  context: {
    activeAgents: [],
    workflows: [],
    communications: [],
    systemCoherence: 0.0,
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    errorMessage: undefined
  } as AgentOrchestrationContext,

  states: {
    idle: {
      on: {
        INITIALIZE_ORCHESTRATION: 'initializing'
      }
    },

    initializing: {
      invoke: {
        id: 'initializeOrchestration',
        src: 'initializeOrchestration',
        onDone: {
          target: 'orchestrating',
          actions: assign({
            activeAgents: ({ event }) => event.output.agents,
            systemCoherence: ({ event }) => event.output.coherence
          })
        },
        onError: {
          target: '#agentOrchestration.error',
          actions: assign({
            errorMessage: ({ event }) => event.error.message
          })
        }
      }
    },

    orchestrating: {
      initial: 'monitoring',
      
      states: {
        monitoring: {
          invoke: {
            id: 'monitorAgents',
            src: 'monitorAgents',
            onDone: [
              {
                target: 'coordinating',
                guard: ({ event }) => event.output.needsCoordination
              },
              {
                target: 'monitoring'
              }
            ]
          },
          after: {
            2000: 'monitoring' // Monitor every 2 seconds
          },
          on: {
            SPAWN_AGENT: {
              target: 'spawning_agent',
              actions: assign({
                totalTasks: ({ context }) => context.totalTasks + 1
              })
            },
            START_WORKFLOW: 'executing_workflow'
          }
        },

        spawning_agent: {
          invoke: {
            id: 'spawnAgent',
            src: 'spawnAgent',
            onDone: {
              target: 'monitoring',
              actions: assign({
                activeAgents: ({ context, event }) => [
                  ...context.activeAgents,
                  event.output.agent
                ]
              })
            },
            onError: {
              target: 'monitoring',
              actions: assign({
                errorMessage: ({ event }) => event.error.message,
                failedTasks: ({ context }) => context.failedTasks + 1
              })
            }
          }
        },

        coordinating: {
          invoke: {
            id: 'coordinateAgents',
            src: 'coordinateAgents',
            onDone: {
              target: 'monitoring',
              actions: assign({
                communications: ({ context, event }) => [
                  ...context.communications,
                  ...event.output.communications
                ].slice(-50), // Keep last 50 communications
                systemCoherence: ({ event }) => event.output.newCoherence
              })
            },
            onError: {
              target: 'monitoring',
              actions: assign({
                errorMessage: ({ event }) => event.error.message
              })
            }
          }
        },

        executing_workflow: {
          invoke: {
            id: 'executeWorkflow',
            src: 'executeWorkflow',
            onDone: {
              target: 'monitoring',
              actions: assign({
                workflows: ({ context, event }) => [
                  ...context.workflows.filter(w => w.id !== event.output.workflow.id),
                  event.output.workflow
                ],
                completedTasks: ({ context }) => context.completedTasks + 1
              })
            },
            onError: {
              target: 'monitoring',
              actions: assign({
                errorMessage: ({ event }) => event.error.message,
                failedTasks: ({ context }) => context.failedTasks + 1
              })
            }
          }
        }
      },

      on: {
        AGENT_MESSAGE: {
          actions: assign({
            communications: ({ context, event }) => [
              ...context.communications,
              {
                fromAgent: event.fromAgent,
                toAgent: event.toAgent,
                messageType: event.message.type || 'general',
                timestamp: new Date().toISOString(),
                harmonicSignature: event.message.harmonicSignature
              }
            ].slice(-50)
          })
        },
        
        AGENT_COMPLETED_TASK: {
          actions: assign({
            completedTasks: ({ context }) => context.completedTasks + 1,
            activeAgents: ({ context, event }) => 
              context.activeAgents.map(agent => 
                agent.id === event.agentId 
                  ? { ...agent, status: 'ready', lastActivity: new Date().toISOString() }
                  : agent
              )
          })
        },

        AGENT_FAILED_TASK: {
          actions: assign({
            failedTasks: ({ context }) => context.failedTasks + 1,
            activeAgents: ({ context, event }) => 
              context.activeAgents.map(agent => 
                agent.id === event.agentId 
                  ? { ...agent, status: 'error', lastActivity: new Date().toISOString() }
                  : agent
              )
          })
        },

        UPDATE_SYSTEM_COHERENCE: {
          actions: assign({
            systemCoherence: ({ event }) => event.coherence
          })
        },

        PAUSE_ORCHESTRATION: '#agentOrchestration.paused'
      }
    },

    paused: {
      on: {
        RESUME_ORCHESTRATION: 'orchestrating'
      }
    },

    error: {
      on: {
        INITIALIZE_ORCHESTRATION: 'initializing'
      }
    }
  },

  on: {
    SHUTDOWN: '#agentOrchestration.idle',
    ERROR: '#agentOrchestration.error'
  }
}, {
  actors: {
    initializeOrchestration: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Initialize default agents based on WSM system
      const agents = [
        {
          id: 'app_synthesizer_001',
          name: 'App Synthesizer',
          type: 'app_synthesizer',
          status: 'ready',
          coherence: 0.85,
          harmonicState: Array.from({ length: 32 }, () => Math.random() * 0.2 - 0.1),
          lastActivity: new Date().toISOString()
        },
        {
          id: 'strategic_planner_001',
          name: 'Strategic Planner', 
          type: 'strategic_planner',
          status: 'ready',
          coherence: 0.91,
          harmonicState: Array.from({ length: 32 }, () => Math.random() * 0.2 - 0.1),
          lastActivity: new Date().toISOString()
        },
        {
          id: 'creative_modulator_001',
          name: 'Creative Modulator',
          type: 'creative_modulator', 
          status: 'ready',
          coherence: 0.78,
          harmonicState: Array.from({ length: 32 }, () => Math.random() * 0.2 - 0.1),
          lastActivity: new Date().toISOString()
        },
        {
          id: 'sequence_analyzer_001',
          name: 'Sequence Analyzer',
          type: 'sequence_analyzer',
          status: 'ready', 
          coherence: 0.88,
          harmonicState: Array.from({ length: 32 }, () => Math.random() * 0.2 - 0.1),
          lastActivity: new Date().toISOString()
        }
      ];

      return {
        agents,
        coherence: agents.reduce((sum, agent) => sum + agent.coherence, 0) / agents.length
      };
    },

    monitorAgents: async ({ context }) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const needsCoordination = Math.random() > 0.7; // 30% chance
      const agentUpdates = context.activeAgents.map(agent => ({
        ...agent,
        coherence: Math.max(0.1, Math.min(1.0, 
          agent.coherence + (Math.random() - 0.5) * 0.05
        )),
        harmonicState: agent.harmonicState?.map(val => 
          val * 0.95 + Math.sin(Date.now() * 0.001) * 0.05
        )
      }));

      return { 
        needsCoordination, 
        agentUpdates,
        systemHealth: agentUpdates.every(agent => agent.status !== 'error')
      };
    },

    spawnAgent: async ({ event }) => {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const agent = {
        id: `agent_${Date.now()}`,
        name: event.agentConfig.name || 'Dynamic Agent',
        type: event.agentConfig.type || 'custom',
        status: 'initializing',
        coherence: 0.5,
        harmonicState: Array.from({ length: 32 }, () => Math.random() * 0.1),
        lastActivity: new Date().toISOString()
      };

      return { agent };
    },

    coordinateAgents: async ({ context }) => {
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Simulate harmonic coordination between agents
      const communications = [];
      const agents = context.activeAgents;
      
      if (agents.length >= 2) {
        const agentA = agents[Math.floor(Math.random() * agents.length)];
        const agentB = agents[Math.floor(Math.random() * agents.length)];
        
        if (agentA.id !== agentB.id) {
          communications.push({
            fromAgent: agentA.id,
            toAgent: agentB.id,
            messageType: 'harmonic_sync',
            timestamp: new Date().toISOString(),
            harmonicSignature: Array.from({ length: 8 }, () => Math.random())
          });
        }
      }

      const newCoherence = Math.min(1.0, context.systemCoherence + 0.01);
      
      return { communications, newCoherence };
    },

    executeWorkflow: async ({ event }) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const workflow = {
        ...event.workflow,
        status: Math.random() > 0.2 ? 'completed' : 'failed',
        completedAt: new Date().toISOString()
      };

      return { workflow };
    }
  }
});

export type AgentOrchestrationMachine = typeof agentOrchestrationMachine;