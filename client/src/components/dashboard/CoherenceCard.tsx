import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface CoherenceCardProps {
  coherence: number;
}

export default function CoherenceCard({ coherence }: CoherenceCardProps) {
  const coherencePercentage = Math.min(coherence * 100, 100);
  
  return (
    <Card className="glow-effect" data-testid="coherence-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Coherence</h3>
          <div className="text-2xl font-mono text-primary" data-testid="coherence-value">
            {coherence.toFixed(1)}
          </div>
        </div>
        <div className="space-y-3">
          <div className="w-full">
            <Progress 
              value={coherencePercentage} 
              className="h-3"
              data-testid="coherence-meter"
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Dissonance</span>
            <span className="text-accent font-mono" data-testid="dissonance-status">
              {coherence >= 0.95 ? 'NONE' : 'DETECTED'}
            </span>
          </div>
          <div className="text-xs text-muted-foreground" data-testid="coherence-description">
            {coherence >= 0.95 ? 'Perfect quantum coherence maintained' : 'Coherence fluctuation detected'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
