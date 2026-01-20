import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

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

interface RecursiveSelfImprovementProps {
  rsis: RSISStatusData | null;
}

export default function RecursiveSelfImprovement({ rsis }: RecursiveSelfImprovementProps) {
  const budgetPercentage = rsis ? (rsis.budget.used / rsis.budget.total) * 100 : 0;
  
  return (
    <Card data-testid="recursive-self-improvement">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Recursive Self-Improvement (RSIS)</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Budget</span>
              <span className="text-accent font-mono text-sm" data-testid="budget-usage">
                {rsis ? `${rsis.budget.used}/${rsis.budget.total}` : '0/1000'}
              </span>
            </div>
            <div className="status-indicator bg-accent rounded-full w-3 h-3"></div>
          </div>
        </div>

        {/* Budget Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Budget Utilization</span>
            <span>{budgetPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={budgetPercentage} className="h-2" data-testid="budget-progress" />
        </div>

        {/* Budget Governance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-2">Proactivity Score</div>
            <div className="text-2xl font-mono text-primary mb-2" data-testid="proactivity-score">
              J = {rsis ? rsis.proactivityScore.toFixed(3) : '0.000'}
            </div>
            <div className="text-xs text-muted-foreground">α·S + β·V - μ·R - λ·C</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-2">Novelty (S)</div>
            <div className="text-2xl font-mono text-secondary mb-2" data-testid="novelty-score">
              {rsis ? rsis.novelty.toFixed(3) : '0.000'}
            </div>
            <div className="text-xs text-muted-foreground">Surprise metric</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-2">Cost Pressure (C)</div>
            <div className="text-2xl font-mono text-accent mb-2" data-testid="cost-pressure">
              {rsis ? rsis.costPressure.toFixed(3) : '0.000'}
            </div>
            <div className="text-xs text-muted-foreground">Budget utilization</div>
          </div>
        </div>

        {/* Improvement Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-lg font-mono text-primary" data-testid="proposals-count">
              {rsis ? rsis.proposals : 0}
            </div>
            <div className="text-sm text-muted-foreground">Proposals</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-mono text-accent" data-testid="evaluations-count">
              {rsis ? rsis.evaluations : 0}
            </div>
            <div className="text-sm text-muted-foreground">Evaluations</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-mono text-secondary" data-testid="promotions-count">
              {rsis ? rsis.promotions : 0}
            </div>
            <div className="text-sm text-muted-foreground">Promotions</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-mono text-accent" data-testid="rollbacks-count">
              {rsis ? rsis.rollbacks : 0}
            </div>
            <div className="text-sm text-muted-foreground">Rollbacks</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
