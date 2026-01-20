import { Card, CardContent } from "@/components/ui/card";

export default function IndependenceCard() {
  return (
    <Card className="glow-effect" data-testid="independence-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Independence</h3>
          <div className="status-indicator bg-accent rounded-full w-3 h-3" data-testid="independence-indicator"></div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">External APIs</span>
            <span className="text-accent font-mono text-sm" data-testid="external-apis">ZERO</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Pure WSM</span>
            <span className="text-primary font-mono text-sm" data-testid="pure-wsm">TRUE</span>
          </div>
          <div className="text-xs text-muted-foreground" data-testid="independence-description">
            Complete operational independence achieved
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
