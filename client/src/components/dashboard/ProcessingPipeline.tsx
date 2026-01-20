import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Atom, Database, ArrowRight } from "lucide-react";

interface ProcessingStatsData {
  filesProcessed: number;
  successRate: number;
  avgProcessingTime: number;
  apiCalls: number;
}

interface ProcessingPipelineProps {
  stats: ProcessingStatsData;
}

export default function ProcessingPipeline({ stats }: ProcessingPipelineProps) {
  return (
    <Card data-testid="processing-pipeline">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Harmonic Cognition Pipeline</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">PS → QHPU → PHL</span>
            <div className="status-indicator bg-primary rounded-full w-2 h-2"></div>
          </div>
        </div>

        {/* Pipeline Flow Visualization */}
        <div className="processing-flow rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            {/* Perception System */}
            <div className="flex flex-col items-center space-y-2" data-testid="ps-stage">
              <div className="pulse-glow bg-primary rounded-full p-3">
                <Eye className="text-primary-foreground h-5 w-5" />
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">Perception System</div>
                <div className="text-xs text-muted-foreground">Type Detection</div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full h-0.5 bg-gradient-to-r from-primary to-secondary"></div>
              <ArrowRight className="text-primary mx-2 h-4 w-4" />
            </div>

            {/* Quantum-Hybrid Processing Unit */}
            <div className="flex flex-col items-center space-y-2" data-testid="qhpu-stage">
              <div className="pulse-glow bg-secondary rounded-full p-3">
                <Atom className="text-primary-foreground h-5 w-5" />
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">QHPU</div>
                <div className="text-xs text-muted-foreground">Compression</div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full h-0.5 bg-gradient-to-r from-secondary to-accent"></div>
              <ArrowRight className="text-secondary mx-2 h-4 w-4" />
            </div>

            {/* Persistent Harmonic Ledger */}
            <div className="flex flex-col items-center space-y-2" data-testid="phl-stage">
              <div className="pulse-glow bg-accent rounded-full p-3">
                <Database className="text-primary-foreground h-5 w-5" />
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">PHL</div>
                <div className="text-xs text-muted-foreground">Storage</div>
              </div>
            </div>
          </div>
        </div>

        {/* Processing Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-muted/30 rounded-lg p-4 text-center">
            <div className="text-2xl font-mono text-primary mb-1" data-testid="files-processed">
              {stats.filesProcessed.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Files Processed</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-4 text-center">
            <div className="text-2xl font-mono text-secondary mb-1" data-testid="success-rate">
              {stats.successRate.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-4 text-center">
            <div className="text-2xl font-mono text-accent mb-1" data-testid="avg-processing-time">
              {Math.round(stats.avgProcessingTime)}ms
            </div>
            <div className="text-sm text-muted-foreground">Avg Processing</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-4 text-center">
            <div className="text-2xl font-mono text-primary mb-1" data-testid="api-calls">
              {stats.apiCalls}
            </div>
            <div className="text-sm text-muted-foreground">API Calls</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
