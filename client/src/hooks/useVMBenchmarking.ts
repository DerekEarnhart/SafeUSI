import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from './useWebSocket';
import { type BenchmarkingStatus, type EvaluationResults, type VMBenchmarkingData } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

export interface VMBenchmark {
  id: string;
  vmInstanceId: string;
  benchmarkType: string;
  status: string;
  configuration: any;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface EvaluationResult {
  id: string;
  benchmarkId: string;
  metricName: string;
  value: number;
  rawData?: any;
  isObjective: boolean;
  validationHash?: string;
  timestamp: string;
}

export interface BenchmarkProgress {
  benchmarkId: string;
  vmInstanceId: string;
  progress: number;
  currentStage: string;
  realTimeMetrics: {
    computationalDensity: number;
    harmonicStability: number;
    energyLevel: number;
    safetyCompliance: number;
  };
}

export function useVMBenchmarking() {
  const { lastMessage } = useWebSocket();
  const queryClient = useQueryClient();
  
  const [benchmarkingStatus, setBenchmarkingStatus] = useState<BenchmarkingStatus['data'] | null>(null);
  const [latestEvaluationResults, setLatestEvaluationResults] = useState<EvaluationResults['data'] | null>(null);
  const [realTimeBenchmarkData, setRealTimeBenchmarkData] = useState<Map<string, VMBenchmarkingData['data']>>(new Map());

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case 'benchmarking_status':
        setBenchmarkingStatus((lastMessage as BenchmarkingStatus).data);
        break;
      case 'evaluation_results':
        setLatestEvaluationResults((lastMessage as EvaluationResults).data);
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['/api/benchmarks'] });
        break;
      case 'vm_benchmarking':
        const vmData = (lastMessage as VMBenchmarkingData).data;
        setRealTimeBenchmarkData(prev => {
          const updated = new Map(prev);
          updated.set(vmData.vmInstanceId, vmData);
          return updated;
        });
        break;
    }
  }, [lastMessage, queryClient]);

  // Fetch benchmarking statistics
  const { data: benchmarkStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/benchmarks/stats'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch VM instances
  const { data: vmInstances, isLoading: vmLoading } = useQuery({
    queryKey: ['/api/vms'],
    refetchInterval: 15000,
  });

  // Create benchmark mutation
  const createBenchmarkMutation = useMutation({
    mutationFn: async (params: {
      vmInstanceId: string;
      benchmarkType: string;
      configuration?: any;
    }) => {
      return apiRequest('/api/benchmarks/create', 'POST', params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/benchmarks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vms'] });
    },
  });

  // Run benchmark suite mutation
  const runBenchmarkSuiteMutation = useMutation({
    mutationFn: async (vmInstanceId: string) => {
      return apiRequest(`/api/vms/${vmInstanceId}/benchmark-suite`, 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/benchmarks'] });
    },
  });

  // Provision benchmarking VM mutation
  const provisionBenchmarkingVMMutation = useMutation({
    mutationFn: async (params: { agentType?: string; agentCount?: number } = {}) => {
      return apiRequest('/api/vms/benchmark', 'POST', params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vms'] });
    },
  });

  // Cancel benchmark mutation
  const cancelBenchmarkMutation = useMutation({
    mutationFn: async (benchmarkId: string) => {
      return apiRequest(`/api/benchmarks/${benchmarkId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/benchmarks'] });
    },
  });

  // Get VM benchmarks
  const getVMBenchmarks = (vmInstanceId: string) => {
    return useQuery({
      queryKey: ['/api/vms', vmInstanceId, 'benchmarks'],
      queryFn: () => apiRequest('GET', `/api/vms/${vmInstanceId}/benchmarks`),
      enabled: !!vmInstanceId,
    });
  };

  // Get benchmark details
  const getBenchmark = (benchmarkId: string) => {
    return useQuery({
      queryKey: ['/api/benchmarks', benchmarkId],
      queryFn: () => apiRequest('GET', `/api/benchmarks/${benchmarkId}`),
      enabled: !!benchmarkId,
    });
  };

  // Get evaluation results
  const getEvaluationResults = (benchmarkId: string) => {
    return useQuery({
      queryKey: ['/api/benchmarks', benchmarkId, 'results'],
      queryFn: () => apiRequest('GET', `/api/benchmarks/${benchmarkId}/results`),
      enabled: !!benchmarkId,
    });
  };

  // Get computational canvas states
  const getCanvasStates = (benchmarkId: string) => {
    return useQuery({
      queryKey: ['/api/benchmarks', benchmarkId, 'canvas-states'],
      queryFn: () => apiRequest(`/api/benchmarks/${benchmarkId}/canvas-states`),
      enabled: !!benchmarkId,
    });
  };

  // Get safety violations
  const getSafetyViolations = (benchmarkId: string) => {
    return useQuery({
      queryKey: ['/api/benchmarks', benchmarkId, 'safety-violations'],
      queryFn: () => apiRequest(`/api/benchmarks/${benchmarkId}/safety-violations`),
      enabled: !!benchmarkId,
    });
  };

  // Helper functions
  const getActiveBenchmarks = (): BenchmarkProgress[] => {
    if (!benchmarkingStatus) return [];
    return benchmarkingStatus.currentBenchmarks.map(benchmark => ({
      benchmarkId: benchmark.id,
      vmInstanceId: benchmark.vmInstanceId,
      progress: benchmark.progress || 0,
      currentStage: 'running',
      realTimeMetrics: realTimeBenchmarkData.get(benchmark.vmInstanceId)?.realTimeMetrics || {
        computationalDensity: 0,
        harmonicStability: 0,
        energyLevel: 0,
        safetyCompliance: 1.0,
      },
    }));
  };

  const getBenchmarkingOverview = () => {
    return {
      stats: benchmarkStats,
      activeBenchmarks: getActiveBenchmarks(),
      latestResults: latestEvaluationResults,
      realTimeData: Array.from(realTimeBenchmarkData.values()),
    };
  };

  return {
    // State
    benchmarkingStatus,
    latestEvaluationResults,
    realTimeBenchmarkData,
    vmInstances,
    
    // Loading states
    statsLoading,
    vmLoading,
    
    // Mutations
    createBenchmark: createBenchmarkMutation.mutateAsync,
    isCreatingBenchmark: createBenchmarkMutation.isPending,
    
    runBenchmarkSuite: runBenchmarkSuiteMutation.mutateAsync,
    isRunningBenchmarkSuite: runBenchmarkSuiteMutation.isPending,
    
    provisionBenchmarkingVM: provisionBenchmarkingVMMutation.mutateAsync,
    isProvisioningVM: provisionBenchmarkingVMMutation.isPending,
    
    cancelBenchmark: cancelBenchmarkMutation.mutateAsync,
    isCancellingBenchmark: cancelBenchmarkMutation.isPending,
    
    // Query hooks
    getVMBenchmarks,
    getBenchmark,
    getEvaluationResults,
    getCanvasStates,
    getSafetyViolations,
    
    // Helper functions
    getActiveBenchmarks,
    getBenchmarkingOverview,
  };
}