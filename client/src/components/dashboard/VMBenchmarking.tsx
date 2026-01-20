import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Play, Square, Cpu, Activity, Shield, Zap } from 'lucide-react';
import { useVMBenchmarking } from '@/hooks/useVMBenchmarking';
import { useToast } from '@/hooks/use-toast';

const BENCHMARK_TYPES = [
  { value: 'computational_canvas', label: 'Computational Canvas', description: 'Tests harmonic state evolution' },
  { value: 'harmonic_constraint', label: 'Harmonic Constraint', description: 'Evaluates constraint satisfaction' },
  { value: 'safety_protocol', label: 'Safety Protocol', description: 'Validates safety mechanisms' },
  { value: 'performance', label: 'Performance', description: 'Measures computational efficiency' },
];

const MetricCard = ({ title, value, icon: Icon, color, unit = '', description }: {
  title: string;
  value: number;
  icon: any;
  color: string;
  unit?: string;
  description?: string;
}) => (
  <Card className="p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold" style={{ color }}>
          {value.toFixed(3)}{unit}
        </p>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <Icon className="h-8 w-8" style={{ color }} />
    </div>
  </Card>
);

const BenchmarkProgress = ({ benchmark }: { benchmark: any }) => {
  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'initialization': return 'bg-blue-500';
      case 'vm_health_check': return 'bg-yellow-500';
      case 'canvas_initialization': return 'bg-purple-500';
      case 'harmonic_evaluation': return 'bg-green-500';
      case 'safety_validation': return 'bg-orange-500';
      case 'results_compilation': return 'bg-indigo-500';
      default: return 'bg-gray-500';
    }
  };

  const formatStageName = (stage: string) => {
    return stage.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-medium">Benchmark {benchmark.benchmarkId.slice(-8)}</span>
          <Badge variant="secondary">{benchmark.progress}%</Badge>
        </div>
        
        <Progress value={benchmark.progress} className="h-2" />
        
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStageColor(benchmark.currentStage)}`} />
          <span className="text-sm text-muted-foreground">
            {formatStageName(benchmark.currentStage)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="text-center p-2 bg-muted rounded">
            <div className="text-lg font-semibold">{(benchmark.realTimeMetrics.harmonicStability * 100).toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">Harmonic Stability</div>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <div className="text-lg font-semibold">{(benchmark.realTimeMetrics.safetyCompliance * 100).toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">Safety Compliance</div>
          </div>
        </div>
      </div>
    </Card>
  );
};

const EvaluationResults = ({ results }: { results: any }) => {
  if (!results) return null;

  const getMetricColor = (category: string) => {
    switch (category) {
      case 'stability': return '#10b981';
      case 'performance': return '#3b82f6';
      case 'efficiency': return '#8b5cf6';
      case 'safety': return '#f59e0b';
      case 'computational': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getSafetyStatusColor = (status: string) => {
    return status === 'safe' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Latest Evaluation Results
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">Overall Score</span>
          <div className="text-2xl font-bold text-green-600">
            {(results.overallScore * 100).toFixed(1)}%
          </div>
        </div>

        <div className="grid gap-2">
          {results.metrics.map((metric: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-2 rounded bg-muted">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: getMetricColor(metric.category) }}
                />
                <span className="text-sm font-medium">
                  {metric.name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </span>
                {metric.isObjective && (
                  <Badge variant="outline" className="text-xs">Objective</Badge>
                )}
              </div>
              <span className="font-semibold">{(metric.value * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm font-medium">Safety Status</span>
          <Badge className={getSafetyStatusColor(results.safetyStatus)}>
            {results.safetyStatus === 'safe' ? 'Safe' : 'Violation Detected'}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Canvas Convergence</span>
          <Badge variant="outline">{results.canvasConvergence}</Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default function VMBenchmarking() {
  const { toast } = useToast();
  const [selectedVMId, setSelectedVMId] = useState<string>('');
  const [selectedBenchmarkType, setSelectedBenchmarkType] = useState<string>('computational_canvas');
  
  const {
    benchmarkingStatus,
    latestEvaluationResults,
    vmInstances,
    statsLoading,
    vmLoading,
    createBenchmark,
    isCreatingBenchmark,
    runBenchmarkSuite,
    isRunningBenchmarkSuite,
    provisionBenchmarkingVM,
    isProvisioningVM,
    getActiveBenchmarks,
    getBenchmarkingOverview,
  } = useVMBenchmarking();

  const activeBenchmarks = getActiveBenchmarks();
  const overview = getBenchmarkingOverview();

  const handleCreateBenchmark = async () => {
    if (!selectedVMId) {
      toast({
        title: "Error",
        description: "Please select a VM instance",
        variant: "destructive",
      });
      return;
    }

    try {
      await createBenchmark({
        vmInstanceId: selectedVMId,
        benchmarkType: selectedBenchmarkType,
        configuration: {
          iterations: 10,
          safetyThresholds: {
            maxPotential: 120,
            maxDensity: 1500,
          },
        },
      });
      
      toast({
        title: "Success",
        description: "Benchmark created and started successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error", 
        description: error.message || "Failed to create benchmark",
        variant: "destructive",
      });
    }
  };

  const handleRunBenchmarkSuite = async () => {
    if (!selectedVMId) {
      toast({
        title: "Error",
        description: "Please select a VM instance",
        variant: "destructive",
      });
      return;
    }

    try {
      await runBenchmarkSuite(selectedVMId);
      toast({
        title: "Success",
        description: "Benchmark suite started successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start benchmark suite",
        variant: "destructive",
      });
    }
  };

  const handleProvisionBenchmarkingVM = async () => {
    try {
      const vm = await provisionBenchmarkingVM({ agentType: 'benchmark', agentCount: 1 });
      setSelectedVMId(vm.id);
      toast({
        title: "Success",
        description: `Benchmarking VM ${vm.name} provisioned successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to provision VM",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6" data-testid="vm-benchmarking-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">VM Benchmarking</h2>
          <p className="text-muted-foreground">
            Comprehensive AGI model evaluation with VMforAGI computational concepts
          </p>
        </div>
        <Button 
          onClick={handleProvisionBenchmarkingVM}
          disabled={isProvisioningVM}
          data-testid="button-provision-vm"
        >
          <Cpu className="h-4 w-4 mr-2" />
          {isProvisioningVM ? 'Provisioning...' : 'Provision Benchmark VM'}
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Active Benchmarks"
          value={benchmarkingStatus?.activeBenchmarks || 0}
          icon={Play}
          color="#3b82f6"
          description="Currently running benchmarks"
        />
        <MetricCard
          title="Completed Benchmarks"
          value={benchmarkingStatus?.completedBenchmarks || 0}
          icon={Activity}
          color="#10b981"
          description="Successfully finished benchmarks"
        />
        <MetricCard
          title="Failed Benchmarks"
          value={benchmarkingStatus?.failedBenchmarks || 0}
          icon={AlertTriangle}
          color="#ef4444"
          description="Benchmarks with errors"
        />
        <MetricCard
          title="Avg Duration"
          value={benchmarkingStatus?.avgBenchmarkTime || 0}
          icon={Zap}
          color="#8b5cf6"
          unit="s"
          description="Average benchmark completion time"
        />
      </div>

      {/* Benchmark Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Benchmark Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">VM Instance</label>
              <Select value={selectedVMId} onValueChange={setSelectedVMId} data-testid="select-vm-instance">
                <SelectTrigger>
                  <SelectValue placeholder="Select VM instance" />
                </SelectTrigger>
                <SelectContent>
                  {vmInstances?.map((vm: any) => (
                    <SelectItem key={vm.id} value={vm.id}>
                      {vm.name} ({vm.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Benchmark Type</label>
              <Select value={selectedBenchmarkType} onValueChange={setSelectedBenchmarkType} data-testid="select-benchmark-type">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BENCHMARK_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <div className="flex gap-2">
                <Button 
                  onClick={handleCreateBenchmark}
                  disabled={isCreatingBenchmark || !selectedVMId}
                  size="sm"
                  data-testid="button-create-benchmark"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {isCreatingBenchmark ? 'Creating...' : 'Create'}
                </Button>
                <Button 
                  onClick={handleRunBenchmarkSuite}
                  disabled={isRunningBenchmarkSuite || !selectedVMId}
                  size="sm" 
                  variant="outline"
                  data-testid="button-run-suite"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  {isRunningBenchmarkSuite ? 'Running...' : 'Run Suite'}
                </Button>
              </div>
            </div>
          </div>

          {selectedBenchmarkType && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                {BENCHMARK_TYPES.find(t => t.value === selectedBenchmarkType)?.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Benchmarks */}
      {activeBenchmarks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Active Benchmarks ({activeBenchmarks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeBenchmarks.map((benchmark) => (
                <BenchmarkProgress key={benchmark.benchmarkId} benchmark={benchmark} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real-time Metrics */}
      {overview.realTimeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Real-time Benchmarking Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {overview.realTimeData.map((data, index) => (
                <div key={index} className="space-y-3">
                  <MetricCard
                    title="Computational Density"
                    value={data.realTimeMetrics.computationalDensity}
                    icon={Cpu}
                    color="#3b82f6"
                  />
                  <MetricCard
                    title="Harmonic Stability"
                    value={data.realTimeMetrics.harmonicStability}
                    icon={Activity}
                    color="#10b981"
                  />
                  <MetricCard
                    title="Energy Level"
                    value={data.realTimeMetrics.energyLevel}
                    icon={Zap}
                    color="#f59e0b"
                  />
                  <MetricCard
                    title="Safety Compliance"
                    value={data.realTimeMetrics.safetyCompliance}
                    icon={Shield}
                    color="#10b981"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Latest Results */}
      {latestEvaluationResults && (
        <EvaluationResults results={latestEvaluationResults} />
      )}
    </div>
  );
}