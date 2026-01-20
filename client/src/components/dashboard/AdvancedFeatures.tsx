import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Moon, Archive, Activity } from "lucide-react";

export default function AdvancedFeatures() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6" data-testid="advanced-features">
      {/* Dream-State Engine */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Dream-State Engine</h3>
            <div className="flex items-center space-x-2">
              <Moon className="text-secondary h-4 w-4" />
              <Badge variant="outline" className="text-secondary" data-testid="dream-state-status">IDLE</Badge>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Next Cycle</span>
              <span className="text-primary font-mono text-sm" data-testid="next-cycle">
                {(() => {
                  const nextCycle = new Date();
                  nextCycle.setHours(nextCycle.getHours() + 2);
                  return nextCycle.toTimeString().slice(0, 8);
                })()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Consolidations</span>
              <span className="text-accent font-mono text-sm" data-testid="consolidations">127</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Distillations</span>
              <span className="text-secondary font-mono text-sm" data-testid="distillations">89</span>
            </div>
            <div className="text-xs text-muted-foreground">Offline replay and memory optimization</div>
          </div>
        </CardContent>
      </Card>

      {/* Compression Memory */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Compression Memory</h3>
            <Archive className="text-primary h-4 w-4" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Algorithm</span>
              <span className="text-primary font-mono text-sm" data-testid="compression-algorithm">LZMA L9</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Ratio</span>
              <span className="text-accent font-mono text-sm" data-testid="compression-ratio">0.61</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Policy</span>
              <span className="text-secondary font-mono text-sm" data-testid="compression-policy">Multi-Fidelity</span>
            </div>
            <div className="text-xs text-muted-foreground">Prime compression techniques active</div>
          </div>
        </CardContent>
      </Card>

      {/* Causal Lattice Resonance */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Causal Lattice</h3>
            <div className="status-indicator bg-accent rounded-full w-3 h-3"></div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Resonance</span>
              <span className="text-primary font-mono text-sm" data-testid="resonance-status">ACTIVE</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Emergence</span>
              <span className="text-accent font-mono text-sm" data-testid="emergence-status">PREDICTED</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Entropy</span>
              <span className="text-secondary font-mono text-sm" data-testid="entropy-value">0.234</span>
            </div>
            <div className="text-xs text-muted-foreground">Advanced pattern prediction active</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
