import { useState, useCallback } from 'react';
import { 
  type WebSocketMessage, 
  type WSMMetrics, 
  type ComponentStatus, 
  type ProcessingStats, 
  type RSISStatus 
} from '@shared/schema';

interface WSMMetricsData {
  harmonicState: number[];
  coherence: number;
  processingTime: number;
  symplecticOps: number;
  memoryUsage: number;
  timestamp: string;
}

interface ComponentData {
  name: string;
  status: string;
  lastUpdate: string;
}

interface ProcessingStatsData {
  filesProcessed: number;
  successRate: number;
  avgProcessingTime: number;
  apiCalls: number;
}

interface RSISStatusData {
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
}

export function useWSMMetrics() {
  const [wsmMetrics, setWsmMetrics] = useState<WSMMetricsData | null>(null);
  const [components, setComponents] = useState<ComponentData[]>([]);
  const [processingStats, setProcessingStats] = useState<ProcessingStatsData>({
    filesProcessed: 0,
    successRate: 100,
    avgProcessingTime: 847,
    apiCalls: 0,
  });
  const [rsisStatus, setRsisStatus] = useState<RSISStatusData | null>(null);

  const updateMetrics = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'wsm_metrics':
        setWsmMetrics(message.data);
        break;
      
      case 'component_status':
        setComponents(message.data.components);
        break;
      
      case 'processing_stats':
        setProcessingStats(message.data);
        break;
      
      case 'rsis_status':
        setRsisStatus(message.data);
        break;
      
      default:
        console.warn('Unknown message type:', message);
    }
  }, []);

  return {
    wsmMetrics,
    components,
    processingStats,
    rsisStatus,
    updateMetrics,
  };
}
