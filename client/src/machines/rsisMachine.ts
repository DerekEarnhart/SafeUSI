import { createMachine, assign, fromPromise } from 'xstate';

// RSIS Context for Recursive Self-Improvement Supervisor
interface RSISContext {
  proactivityScore: number;
  novelty: number;
  valueOfInformation: number;
  redundancy: number;
  costPressure: number;
  proposals: number;
  evaluations: number;
  promotions: number;
  rollbacks: number;
  budget: {
    used: number;
    total: number;
  };
  currentCycle: number;
  improvementHistory: Array<{
    cycle: number;
    improvement: number;
    timestamp: string;
  }>;
  errorMessage?: string;
}

// RSIS Events
type RSISEvent = 
  | { type: 'START_CYCLE' }
  | { type: 'EVALUATE_PROPOSAL'; proposal: any }
  | { type: 'PROMOTE_IMPROVEMENT'; improvement: any }
  | { type: 'ROLLBACK_CHANGE'; reason: string }
  | { type: 'UPDATE_BUDGET'; used: number }
  | { type: 'PAUSE_CYCLES' }
  | { type: 'RESUME_CYCLES' }
  | { type: 'RESET' }
  | { type: 'ERROR'; error: string };

// RSIS State Machine for Self-Improvement Cycles
export const rsisMachine = createMachine({
  id: 'rsis',
  initial: 'idle',
  context: {
    proactivityScore: 0.7,
    novelty: 0.5,
    valueOfInformation: 0.6,
    redundancy: 0.3,
    costPressure: 0.4,
    proposals: 0,
    evaluations: 0,
    promotions: 0,
    rollbacks: 0,
    budget: {
      used: 0,
      total: 1000
    },
    currentCycle: 0,
    improvementHistory: []
  } as RSISContext,

  states: {
    idle: {
      on: {
        START_CYCLE: 'analyzing_system',
        RESET: {
          actions: assign({
            currentCycle: 0,
            proposals: 0,
            evaluations: 0,
            promotions: 0,
            rollbacks: 0,
            budget: { used: 0, total: 1000 },
            improvementHistory: []
          })
        }
      }
    },

    analyzing_system: {
      invoke: {
        id: 'analyzeCurrentSystem',
        src: 'analyzeCurrentSystem',
        onDone: {
          target: 'generating_proposals',
          actions: assign({
            novelty: ({ event }) => event.output.novelty,
            valueOfInformation: ({ event }) => event.output.valueOfInformation,
            redundancy: ({ event }) => event.output.redundancy
          })
        },
        onError: {
          target: '#rsis.error',
          actions: assign({
            errorMessage: ({ event }) => event.error.message
          })
        }
      },
      after: {
        10000: '#rsis.error' // Timeout after 10 seconds
      }
    },

    generating_proposals: {
      invoke: {
        id: 'generateImprovementProposals',
        src: 'generateImprovementProposals',
        onDone: {
          target: 'evaluating_proposals',
          actions: assign({
            proposals: ({ event }) => event.output.proposals.length,
            proactivityScore: ({ context }) => 
              Math.min(1.0, context.proactivityScore + 0.1)
          })
        },
        onError: {
          target: '#rsis.error',
          actions: assign({
            errorMessage: ({ event }) => event.error.message
          })
        }
      }
    },

    evaluating_proposals: {
      invoke: {
        id: 'evaluateProposals',
        src: 'evaluateProposals',
        onDone: [
          {
            target: 'implementing_improvements',
            guard: ({ event }) => event.output.bestProposals.length > 0,
            actions: assign({
              evaluations: ({ context }) => context.evaluations + 1
            })
          },
          {
            target: 'monitoring_system',
            actions: assign({
              evaluations: ({ context }) => context.evaluations + 1
            })
          }
        ],
        onError: {
          target: '#rsis.error',
          actions: assign({
            errorMessage: ({ event }) => event.error.message
          })
        }
      }
    },

    implementing_improvements: {
      invoke: {
        id: 'implementImprovements',
        src: 'implementImprovements',
        onDone: [
          {
            target: 'validating_improvements',
            guard: ({ event }) => event.output.success,
            actions: assign({
              promotions: ({ context }) => context.promotions + 1,
              budget: ({ context, event }) => ({
                ...context.budget,
                used: context.budget.used + event.output.cost
              })
            })
          },
          {
            target: 'rolling_back',
            actions: assign({
              rollbacks: ({ context }) => context.rollbacks + 1
            })
          }
        ],
        onError: {
          target: 'rolling_back',
          actions: assign({
            errorMessage: ({ event }) => event.error.message,
            rollbacks: ({ context }) => context.rollbacks + 1
          })
        }
      }
    },

    validating_improvements: {
      invoke: {
        id: 'validateImprovements',
        src: 'validateImprovements',
        onDone: {
          target: 'monitoring_system',
          actions: assign({
            currentCycle: ({ context }) => context.currentCycle + 1,
            improvementHistory: ({ context, event }) => [
              ...context.improvementHistory,
              {
                cycle: context.currentCycle + 1,
                improvement: event.output.improvementScore,
                timestamp: new Date().toISOString()
              }
            ].slice(-10) // Keep only last 10 improvements
          })
        },
        onError: {
          target: 'rolling_back',
          actions: assign({
            errorMessage: ({ event }) => event.error.message,
            rollbacks: ({ context }) => context.rollbacks + 1
          })
        }
      }
    },

    rolling_back: {
      invoke: {
        id: 'rollbackChanges',
        src: 'rollbackChanges',
        onDone: 'monitoring_system',
        onError: {
          target: '#rsis.error',
          actions: assign({
            errorMessage: ({ event }) => event.error.message
          })
        }
      }
    },

    monitoring_system: {
      invoke: {
        id: 'monitorSystem',
        src: 'monitorSystem',
        onDone: [
          {
            target: 'analyzing_system',
            guard: ({ context, event }) => 
              event.output.shouldContinue && 
              context.budget.used < context.budget.total * 0.9
          },
          {
            target: '#rsis.idle'
          }
        ]
      },
      after: {
        5000: 'analyzing_system' // Continue cycle after monitoring
      }
    },

    paused: {
      on: {
        RESUME_CYCLES: 'analyzing_system',
        RESET: '#rsis.idle'
      }
    },

    error: {
      on: {
        RESET: '#rsis.idle'
      }
    }
  },

  on: {
    PAUSE_CYCLES: '#rsis.paused',
    UPDATE_BUDGET: {
      actions: assign({
        budget: ({ context, event }) => ({
          ...context.budget,
          used: event.used
        })
      })
    },
    ERROR: '#rsis.error'
  }
}, {
  actors: {
    analyzeCurrentSystem: fromPromise(async ({ input }: { input: any }) => {
      // Analyze current system state for improvement opportunities
      await new Promise(resolve => setTimeout(resolve, 200));
      
      return {
        novelty: Math.max(0, (input.novelty || 0.5) + (Math.random() - 0.5) * 0.2),
        valueOfInformation: Math.max(0, (input.valueOfInformation || 0.6) + (Math.random() - 0.5) * 0.1),
        redundancy: Math.min(1, (input.redundancy || 0.3) + Math.random() * 0.1),
        systemComplexity: Math.random(),
        improvementPotential: Math.random() * 0.3 + 0.1
      };
    }),

    generateImprovementProposals: fromPromise(async ({ input }: { input: any }) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const numProposals = Math.floor(Math.random() * 5) + 2;
      const proposals = Array.from({ length: numProposals }, (_, i) => ({
        id: `proposal_${input.currentCycle || 0}_${i}`,
        type: ['optimization', 'feature', 'refactor', 'security'][Math.floor(Math.random() * 4)],
        priority: Math.random(),
        expectedImprovement: Math.random() * 0.3,
        cost: Math.floor(Math.random() * 100) + 10,
        risk: Math.random()
      }));
      
      return { proposals };
    }),

    evaluateProposals: fromPromise(async ({ input }: { input: any }) => {
      await new Promise(resolve => setTimeout(resolve, 250));
      
      const proposals = input.proposals || [];
      const bestProposals = proposals
        .sort((a: any, b: any) => 
          (b.expectedImprovement / b.cost) - (a.expectedImprovement / a.cost)
        )
        .slice(0, Math.floor(Math.random() * 3) + 1);
      
      return { bestProposals };
    }),

    implementImprovements: fromPromise(async ({ input }: { input: any }) => {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const success = Math.random() > 0.3; // 70% success rate
      const cost = (input.bestProposals || []).reduce((sum: number, p: any) => sum + p.cost, 0);
      
      return { success, cost };
    }),

    validateImprovements: fromPromise(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const improvementScore = Math.random() * 0.5 + 0.1;
      return { improvementScore, valid: true };
    }),

    rollbackChanges: fromPromise(async ({ input }: { input: any }) => {
      await new Promise(resolve => setTimeout(resolve, 150));
      
      return { rolled_back: true };
    }),

    monitorSystem: fromPromise(async ({ input }: { input: any }) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const shouldContinue = 
        (input.proactivityScore || 0) > 0.3 &&
        (input.currentCycle || 0) < 20 && // Limit cycles
        Math.random() > 0.4; // Random continuation
      
      return { shouldContinue };
    })
  }
});

export type RSISMachine = typeof rsisMachine;