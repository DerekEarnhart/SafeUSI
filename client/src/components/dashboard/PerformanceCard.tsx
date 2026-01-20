import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface PerformanceCardProps {
  processingTime: number;
  symplecticOps: number;
  memoryUsage: number;
}

export default function PerformanceCard({ processingTime, symplecticOps, memoryUsage }: PerformanceCardProps) {
  return (
    <Card className="glow-effect" data-testid="performance-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Performance</h3>
          <Clock className="text-primary h-5 w-5" />
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Response Time</span>
            <span className="text-primary font-mono text-sm" data-testid="response-time">
              {processingTime.toFixed(2)}s
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Symplectic Ops</span>
            <span className="text-secondary font-mono text-sm" data-testid="symplectic-ops">
              {(symplecticOps / 1000).toFixed(1)}K/s
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Memory Usage</span>
            <span className="text-accent font-mono text-sm" data-testid="memory-usage">
              {memoryUsage}MB
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
