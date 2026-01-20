import { useMachine } from '@xstate/react';
import { rsisMachine } from '../machines/rsisMachine';
import { useEffect } from 'react';

export function useRSISMachine() {
  const [state, send] = useMachine(rsisMachine);

  const startCycle = () => {
    send({ type: 'START_CYCLE' });
  };

  const pauseCycles = () => {
    send({ type: 'PAUSE_CYCLES' });
  };

  const resumeCycles = () => {
    send({ type: 'RESUME_CYCLES' });
  };

  const reset = () => {
    send({ type: 'RESET' });
  };

  const updateBudget = (used: number) => {
    send({ type: 'UPDATE_BUDGET', used });
  };

  return {
    // State information
    currentState: state.value,
    context: state.context,
    isActive: !state.matches('idle') && !state.matches('paused') && !state.matches('error'),
    isAnalyzing: state.matches('analyzing_system'),
    isGeneratingProposals: state.matches('generating_proposals'),
    isEvaluating: state.matches('evaluating_proposals'),
    isImplementing: state.matches('implementing_improvements'),
    isValidating: state.matches('validating_improvements'),
    isMonitoring: state.matches('monitoring_system'),
    isPaused: state.matches('paused'),
    isError: state.matches('error'),
    
    // Actions
    startCycle,
    pauseCycles,
    resumeCycles,
    reset,
    updateBudget,

    // Metrics
    proactivityScore: state.context.proactivityScore,
    novelty: state.context.novelty,
    valueOfInformation: state.context.valueOfInformation,
    redundancy: state.context.redundancy,
    costPressure: state.context.costPressure,
    currentCycle: state.context.currentCycle,
    
    // Counters
    proposals: state.context.proposals,
    evaluations: state.context.evaluations,
    promotions: state.context.promotions,
    rollbacks: state.context.rollbacks,
    
    // Budget
    budget: state.context.budget,
    budgetPercentUsed: (state.context.budget.used / state.context.budget.total) * 100,
    
    // History
    improvementHistory: state.context.improvementHistory,
    errorMessage: state.context.errorMessage
  };
}