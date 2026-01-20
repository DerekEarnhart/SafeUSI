import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Bot, 
  Server, 
  Activity, 
  Clock, 
  Zap, 
  Play, 
  Pause, 
  Settings,
  Monitor,
  Cpu,
  MemoryStick
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Agent {
  id: string;
  name: string;
  type: string;
  status: string;
  coherence: number;
  vmInstanceId?: string;
  lastActivity?: string;
}

interface VMInstance {
  id: string;
  name: string;
  type: string;
  status: string;
  cpu: number;
  memory: number;
  region: string;
  endpoint?: string;
  agentCount: number;
}

interface TaskQueueData {
  queued: number;
  running: number;
  completed: number;
  failed: number;
}

interface AgentOrchestrationProps {
  agents: Agent[];
  vmInstances: VMInstance[];
  taskQueue: TaskQueueData;
}

export default function AgentOrchestration({ agents, vmInstances, taskQueue }: AgentOrchestrationProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      case 'initializing': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'busy': return 'secondary';
      case 'error': return 'destructive';
      case 'initializing': return 'outline';
      default: return 'secondary';
    }
  };

  const getTotalTasks = () => {
    return taskQueue.queued + taskQueue.running + taskQueue.completed + taskQueue.failed;
  };

  const getAgentTypeIcon = (type: string) => {
    switch (type) {
      case 'geo_art': return '🎨';
      case 'story_builder': return '📖';
      case 'vfx_sim': return '🎬';
      case 'music_composer': return '🎵';
      case 'sequence_analyzer': return '🔍';
      default: return '🤖';
    }
  };

  return (
    <div className="space-y-6">
      {/* Agent Orchestration Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Bot className="h-5 w-5 text-blue-500" />
              <span>Active Agents</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">
              {agents.filter(a => a.status === 'active' || a.status === 'busy').length}
            </div>
            <div className="text-sm text-muted-foreground">
              of {agents.length} total agents
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Server className="h-5 w-5 text-green-500" />
              <span>VM Instances</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">
              {vmInstances.filter(vm => vm.status === 'active').length}
            </div>
            <div className="text-sm text-muted-foreground">
              of {vmInstances.length} provisioned
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Activity className="h-5 w-5 text-orange-500" />
              <span>Task Queue</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">
              {taskQueue.queued + taskQueue.running}
            </div>
            <div className="text-sm text-muted-foreground">
              active tasks
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Zap className="h-5 w-5 text-purple-500" />
              <span>Coherence</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-500">
              {agents.length > 0 ? 
                Math.round((agents.reduce((sum, a) => sum + (a.coherence || 0), 0) / agents.length) * 100) 
                : 0}%
            </div>
            <div className="text-sm text-muted-foreground">
              average harmonic
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Queue Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Task Queue Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">{taskQueue.queued}</div>
              <div className="text-sm text-muted-foreground">Queued</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{taskQueue.running}</div>
              <div className="text-sm text-muted-foreground">Running</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{taskQueue.completed}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{taskQueue.failed}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
          </div>
          
          {getTotalTasks() > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Queue Progress</span>
                <span>{Math.round((taskQueue.completed / getTotalTasks()) * 100)}% Complete</span>
              </div>
              <Progress value={(taskQueue.completed / getTotalTasks()) * 100} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agent Status Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Agents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bot className="h-5 w-5" />
                <span>Agent Fleet</span>
              </div>
              <Button size="sm" variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Manage
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {agents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No agents deployed</p>
                  <p className="text-sm">Create agents via Commercial API</p>
                </div>
              ) : (
                agents.map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{getAgentTypeIcon(agent.type)}</div>
                      <div>
                        <div className="font-medium">{agent.name}</div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {agent.type.replace('_', ' ')} Agent
                        </div>
                        {agent.lastActivity && (
                          <div className="text-xs text-muted-foreground">
                            Active {formatDistanceToNow(new Date(agent.lastActivity), { addSuffix: true })}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="text-sm font-mono">{Math.round(agent.coherence * 100)}%</div>
                        <div className="text-xs text-muted-foreground">coherence</div>
                      </div>
                      <Badge variant={getStatusBadgeVariant(agent.status)}>
                        {agent.status}
                      </Badge>
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`}></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* VM Instances */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Server className="h-5 w-5" />
                <span>VM Infrastructure</span>
              </div>
              <Button size="sm" variant="outline">
                <Monitor className="h-4 w-4 mr-2" />
                Monitor
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {vmInstances.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No VMs provisioned</p>
                  <p className="text-sm">Deploy VMs for agent hosting</p>
                </div>
              ) : (
                vmInstances.map((vm) => (
                  <div key={vm.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="flex flex-col items-center">
                        <Server className="h-6 w-6 text-blue-500" />
                        <div className="text-xs text-muted-foreground mt-1">{vm.agentCount} agents</div>
                      </div>
                      <div>
                        <div className="font-medium">{vm.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {vm.type} • {vm.region}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <Cpu className="h-3 w-3" />
                          <span>{vm.cpu} CPU</span>
                          <MemoryStick className="h-3 w-3" />
                          <span>{vm.memory}GB RAM</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant={getStatusBadgeVariant(vm.status)}>
                        {vm.status}
                      </Badge>
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(vm.status)}`}></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Agent Communications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Multi-Agent Orchestration</span>
            <div className="flex items-center space-x-2 ml-auto">
              <div className="pulse-glow bg-green-500 rounded-full w-2 h-2"></div>
              <span className="text-sm text-muted-foreground">Live</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black/20 rounded-lg p-4 font-mono text-sm">
            <div className="text-green-400 mb-2">WSM-HA Agent Orchestrator v2.0</div>
            <div className="text-blue-400">→ Harmonic coordination active across {agents.length} agents</div>
            <div className="text-yellow-400">→ Task distribution: {taskQueue.queued} queued, {taskQueue.running} executing</div>
            <div className="text-purple-400">→ VM resource optimization: {vmInstances.length} instances allocated</div>
            <div className="text-green-400">→ Coherence stability: {agents.length > 0 ? 
              Math.round((agents.reduce((sum, a) => sum + (a.coherence || 0), 0) / agents.length) * 100) 
              : 0}% harmonic alignment</div>
            {agents.filter(a => a.status === 'busy').length > 0 && (
              <div className="text-orange-400">→ Active processing: {agents.filter(a => a.status === 'busy').length} agents executing tasks</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}