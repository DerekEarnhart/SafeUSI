import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function WSMStatusCard() {
  return (
    <Card className="glow-effect" data-testid="wsm-status-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">WSM Core</h3>
          <div className="status-indicator bg-accent rounded-full w-3 h-3" data-testid="wsm-status-indicator"></div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Model Loaded</span>
            <Badge variant="secondary" className="text-accent font-mono text-sm" data-testid="model-loaded-status">TRUE</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Compressed Size</span>
            <span className="text-primary font-mono text-sm" data-testid="compressed-size">5.08MB</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Architecture</span>
            <span className="text-secondary font-mono text-sm" data-testid="architecture-type">Post-LLM</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
