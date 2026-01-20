import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Activity, 
  Play, 
  RotateCcw, 
  Zap, 
  Brain, 
  GitBranch,
  Workflow,
  Bot
} from "lucide-react";
import { useWSMMachine } from "@/hooks/useWSMMachine";
import { useRSISMachine } from "@/hooks/useRSISMachine";
import { useAgentOrchestration } from "@/hooks/useAgentOrchestration";

export function StateMachinesTab() {
  const wsm = useWSMMachine();
  const rsis = useRSISMachine();
  const orchestration = useAgentOrchestration();

  return (
    <div className="space-y-4">
      {/* WSM State Machine */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Weyl State Machine (WSM)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current State:</span>
                <Badge variant={wsm.isError ? "destructive" : "default"}>
                  {String(wsm.currentState)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Coherence:</span>
                <span className="text-sm font-mono">{wsm.coherence?.toFixed(3) || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Processing Time:</span>
                <span className="text-sm font-mono">{wsm.processingTime || 0}ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Stage:</span>
                <span className="text-sm font-mono">{wsm.currentStage || 'idle'}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={() => wsm.startProcessing({ type: 'harmonic_analysis' })}
                disabled={wsm.isProcessing}
                size="sm"
                className="w-full"
                data-testid="wsm-start-processing"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Processing
              </Button>
              <Button 
                onClick={wsm.analyze}
                disabled={wsm.isProcessing}
                variant="outline"
                size="sm"
                className="w-full"
                data-testid="wsm-analyze"
              >
                <Activity className="h-4 w-4 mr-2" />
                Analyze
              </Button>
              <Button 
                onClick={wsm.reset}
                variant="outline"
                size="sm"
                className="w-full"
                data-testid="wsm-reset"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
          
          {wsm.isError && wsm.errorMessage && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded">
              <p className="text-sm text-red-800 dark:text-red-200">{wsm.errorMessage}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* RSIS Machine */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            RSIS (Recursive Self-Improvement Supervisor)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current State:</span>
                <Badge variant={rsis.isError ? "destructive" : "default"}>
                  {String(rsis.currentState)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Budget Used:</span>
                <span className="text-sm font-mono">{rsis.budget.used || 0}/{rsis.budget.total || 1000}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Proposals:</span>
                <span className="text-sm font-mono">{rsis.proposals || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Proactivity Score:</span>
                <span className="text-sm font-mono">{rsis.proactivityScore?.toFixed(3) || 'N/A'}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={rsis.startCycle}
                disabled={rsis.isGeneratingProposals}
                size="sm"
                className="w-full"
                data-testid="rsis-start-cycle"
              >
                <Zap className="h-4 w-4 mr-2" />
                Start Cycle
              </Button>
              <Button 
                onClick={rsis.pauseCycles}
                disabled={!rsis.isActive}
                variant="outline"
                size="sm"
                className="w-full"
                data-testid="rsis-pause"
              >
                <Activity className="h-4 w-4 mr-2" />
                Pause
              </Button>
              <Button 
                onClick={rsis.reset}
                variant="outline"
                size="sm"
                className="w-full"
                data-testid="rsis-reset"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Orchestration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Agent Orchestration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">XState Status:</span>
                <Badge variant="default">
                  {String(orchestration.xstate.currentState)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Agents:</span>
                <span className="text-sm font-mono">{orchestration.agents.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">VM Instances:</span>
                <span className="text-sm font-mono">{orchestration.vmInstances.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Queued Tasks:</span>
                <span className="text-sm font-mono">{orchestration.taskQueue.queued}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={orchestration.xstateControls.initialize}
                size="sm"
                className="w-full"
                data-testid="orchestration-initialize"
              >
                <Workflow className="h-4 w-4 mr-2" />
                Initialize
              </Button>
              <Button 
                onClick={orchestration.xstateControls.resumeOrchestration}
                variant="outline"
                size="sm"
                className="w-full"
                data-testid="orchestration-start"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Orchestration
              </Button>
              <Button 
                onClick={orchestration.xstateControls.pauseOrchestration}
                variant="outline"
                size="sm"
                className="w-full"
                data-testid="orchestration-pause"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Pause
              </Button>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          {/* Task Queue Details */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Task Queue Status</h4>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded">
                <div className="text-sm font-mono">{orchestration.taskQueue.queued}</div>
                <div className="text-xs text-muted-foreground">Queued</div>
              </div>
              <div className="p-2 bg-yellow-50 dark:bg-yellow-950 rounded">
                <div className="text-sm font-mono">{orchestration.taskQueue.running}</div>
                <div className="text-xs text-muted-foreground">Running</div>
              </div>
              <div className="p-2 bg-green-50 dark:bg-green-950 rounded">
                <div className="text-sm font-mono">{orchestration.taskQueue.completed}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div className="p-2 bg-red-50 dark:bg-red-950 rounded">
                <div className="text-sm font-mono">{orchestration.taskQueue.failed}</div>
                <div className="text-xs text-muted-foreground">Failed</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}