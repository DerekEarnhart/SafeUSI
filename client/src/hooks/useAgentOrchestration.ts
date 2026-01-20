import { useState, useCallback } from 'react';
import { useMachine } from '@xstate/react';
import { agentOrchestrationMachine } from '../machines/agentOrchestrationMachine';

interface Agent {
  id: string;
  name: string;
  type: string;
  status: string;
  coherence: number;
  vmInstanceId?: string;
  lastActivity?: string;
}

interface VMInstance {
  id: string;
  name: string;
  type: string;
  status: string;
  cpu: number;
  memory: number;
  region: string;
  endpoint?: string;
  agentCount: number;
}

interface TaskQueueData {
  queued: number;
  running: number;
  completed: number;
  failed: number;
}

interface AgentOrchestrationState {
  agents: Agent[];
  vmInstances: VMInstance[];
  taskQueue: TaskQueueData;
}

interface WebSocketMessage {
  type: string;
  data: any;
}

export function useAgentOrchestration() {
  // Legacy WebSocket-based state (for backward compatibility)
  const [state, setState] = useState<AgentOrchestrationState>({
    agents: [],
    vmInstances: [],
    taskQueue: {
      queued: 0,
      running: 0,
      completed: 0,
      failed: 0,
    },
  });

  // XState machine for enhanced orchestration
  const [xstate, send] = useMachine(agentOrchestrationMachine);

  const updateOrchestrationData = useCallback((message: WebSocketMessage) => {
    if (!message) return;

    switch (message.type) {
      case 'agent_status':
        setState(prev => ({
          ...prev,
          agents: message.data.agents || [],
        }));
        break;

      case 'vm_status':
        setState(prev => ({
          ...prev,
          vmInstances: message.data.instances || [],
        }));
        break;

      case 'task_queue':
        setState(prev => ({
          ...prev,
          taskQueue: {
            queued: Number(message.data?.queuedTasks) || 0,
            running: Number(message.data?.runningTasks) || 0,
            completed: Number(message.data?.completedTasks) || 0,
            failed: Number(message.data?.failedTasks) || 0,
          },
        }));
        break;

      default:
        // Ignore other message types
        break;
    }
  }, []);

  // XState machine controls
  const initialize = () => send({ type: 'INITIALIZE_ORCHESTRATION' });
  const spawnAgent = (agentConfig: any) => send({ type: 'SPAWN_AGENT', agentConfig });
  const pauseOrchestration = () => send({ type: 'PAUSE_ORCHESTRATION' });
  const resumeOrchestration = () => send({ type: 'RESUME_ORCHESTRATION' });

  return {
    // Legacy API (backward compatibility)
    agents: state.agents,
    vmInstances: state.vmInstances,
    taskQueue: state.taskQueue,
    updateOrchestrationData,

    // XState machine API (enhanced features)
    xstate: {
      currentState: xstate.value,
      context: xstate.context,
      isInitializing: xstate.matches('initializing'),
      isOrchestrating: xstate.matches({ orchestrating: {} }),
      isMonitoring: xstate.matches({ orchestrating: 'monitoring' }),
      isPaused: xstate.matches('paused'),
      isError: xstate.matches('error'),
      
      // Data from XState (with null safety)
      activeAgents: xstate.context?.activeAgents ?? [],
      workflows: xstate.context?.workflows ?? [],
      communications: xstate.context?.communications ?? [],
      systemCoherence: xstate.context?.systemCoherence ?? 0,
      
      // Metrics (with null safety)
      totalTasks: xstate.context?.totalTasks ?? 0,
      completedTasks: xstate.context?.completedTasks ?? 0,
      failedTasks: xstate.context?.failedTasks ?? 0,
      successRate: (xstate.context?.totalTasks ?? 0) > 0 
        ? ((xstate.context?.completedTasks ?? 0) / (xstate.context?.totalTasks ?? 1)) * 100 
        : 0,
      
      // Agent stats (with null safety)
      agentCount: xstate.context?.activeAgents?.length ?? 0,
      averageCoherence: (xstate.context?.activeAgents?.length ?? 0) > 0
        ? (xstate.context?.activeAgents ?? []).reduce((sum, agent) => sum + agent.coherence, 0) / (xstate.context?.activeAgents?.length ?? 1)
        : 0,
    },

    // XState controls
    xstateControls: {
      initialize,
      spawnAgent,
      pauseOrchestration,
      resumeOrchestration,
    }
  };
}