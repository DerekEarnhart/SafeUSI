import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface HarmonicStateVisualizationProps {
  harmonicState: number[];
}

export default function HarmonicStateVisualization({ harmonicState }: HarmonicStateVisualizationProps) {
  return (
    <Card className="xl:col-span-2" data-testid="harmonic-state-visualization">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Harmonic State Evolution</h3>
          <div className="flex items-center space-x-2">
            <div className="status-indicator bg-primary rounded-full w-2 h-2"></div>
            <Badge variant="outline" className="text-primary" data-testid="live-indicator">LIVE</Badge>
          </div>
        </div>
        
        {/* Quantum State Vector Display */}
        <div className="bg-muted/30 rounded-lg p-4 mb-4">
          <div className="text-sm text-muted-foreground mb-2">Current Harmonic State</div>
          <div className="harmonic-state-display" data-testid="harmonic-state-value">
            [{harmonicState.map(val => val.toFixed(3)).join(', ')}]
          </div>
        </div>

        {/* Waveform Visualization */}
        <div className="space-y-4">
          <div className="waveform-container rounded-lg" data-testid="waveform-container">
            <div className="harmonic-wave h-full w-full"></div>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {harmonicState.map((value, index) => (
              <div key={index} className="text-xs text-muted-foreground" data-testid={`harmonic-component-${index}`}>
                φ{index + 1}: {value.toFixed(3)}
              </div>
            ))}
          </div>
        </div>

        {/* Symplectic Operations */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="text-sm text-muted-foreground">Weyl Operators</div>
            <div className="font-mono text-secondary" data-testid="weyl-operators">W(ξ) Active</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="text-sm text-muted-foreground">BCH Formula</div>
            <div className="font-mono text-primary" data-testid="bch-formula">Preserved</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
