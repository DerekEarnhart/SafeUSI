import { useMachine } from '@xstate/react';
import { wsmMachine } from '../machines/wsmMachine';
import { useEffect } from 'react';

export function useWSMMachine() {
  const [state, send] = useMachine(wsmMachine);

  const startProcessing = (input: any) => {
    send({ type: 'START_PROCESSING', input });
  };

  const initialize = () => {
    send({ type: 'INITIALIZE' });
  };

  const analyze = () => {
    send({ type: 'ANALYZE' });
  };

  const reset = () => {
    send({ type: 'RESET' });
  };

  const updateHarmonicState = (harmonicState: number[]) => {
    send({ type: 'UPDATE_HARMONIC_STATE', harmonicState });
  };

  // Auto-initialize on mount
  useEffect(() => {
    if (state.matches('idle')) {
      initialize();
    }
  }, []);

  return {
    // State information
    currentState: state.value,
    context: state.context,
    isProcessing: state.matches({ processing: {} }),
    isReady: state.matches('ready'),
    isError: state.matches('error'),
    isAnalyzing: state.matches('analyzing'),
    
    // Actions
    startProcessing,
    initialize,
    analyze,
    reset,
    updateHarmonicState,

    // Computed values
    coherence: state.context.coherence,
    harmonicState: state.context.harmonicState,
    processingTime: state.context.processingTime,
    currentStage: state.context.currentStage,
    errorMessage: state.context.errorMessage
  };
}