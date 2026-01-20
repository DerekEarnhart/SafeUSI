import { useState, useEffect, useRef } from 'react';
import { Brain, Zap, Activity, Settings, Database, Eye, Layers, Sparkles, Upload, Wifi, WifiOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { OracleInstance, OracleQuery, HarmonicProcessing, UploadedFile } from '@shared/schema';

interface OracleConsoleProps {
  className?: string;
}

export function OracleConsole({ className }: OracleConsoleProps) {
  const [oracleQuery, setOracleQuery] = useState('');
  const [mathematicalRigor, setMathematicalRigor] = useState(false);
  const [showReasoning, setShowReasoning] = useState(true);
  const [savedApiKey, setSavedApiKey] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  
  // Load saved API key on mount
  useEffect(() => {
    const saved = localStorage.getItem('apiKey');
    if (saved) setSavedApiKey(saved);
  }, []);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Real-time coherence simulation
  const [globalCoherence, setGlobalCoherence] = useState(96);
  const [orchestratorStatus, setOrchestratorStatus] = useState({
    agents: {
      app_synthesizer: { status: "ready", coherence: 0.97 },
      strategic_planner: { status: "ready", coherence: 0.95 },
      creative_modulator: { status: "ready", coherence: 0.93 },
      sequence_analyzer: { status: "ready", coherence: 0.98 }
    }
  });

  // WebSocket connection for streaming Oracle responses
  useEffect(() => {
    if (savedApiKey) {
      connectWebSocket();
    }
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [savedApiKey]);

  const connectWebSocket = () => {
    try {
      const wsUrl = `ws://localhost:5000/ws`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        setWsConnected(true);
        console.log('Oracle WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        setIsStreaming(false);
        console.log('Oracle WebSocket disconnected');
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsConnected(false);
        setIsStreaming(false);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('WebSocket connection failed:', error);
    }
  };

  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'oracle_stream_start':
        setIsStreaming(true);
        setStreamingResponse('');
        break;
      
      case 'oracle_stream_token':
        setStreamingResponse(prev => prev + message.data.token);
        break;
      
      case 'oracle_stream_end':
        setIsStreaming(false);
        // Invalidate queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ['oracle', 'queries'] });
        queryClient.invalidateQueries({ queryKey: ['oracle', 'instances'] });
        toast({
          title: "Oracle Response Complete",
          description: `Coherence: ${(message.data.coherenceScore * 100).toFixed(1)}%`,
        });
        break;
      
      case 'oracle_stream_error':
        setIsStreaming(false);
        toast({
          title: "Oracle Streaming Error",
          description: message.data.error,
          variant: "destructive",
        });
        break;
    }
  };

  const sendStreamingQuery = () => {
    if (!wsRef.current || !savedApiKey || !oracleQuery.trim()) {
      toast({
        title: "Missing Requirements",
        description: "Need API key and query text",
        variant: "destructive",
      });
      return;
    }

    if (wsRef.current.readyState !== WebSocket.OPEN) {
      toast({
        title: "Connection Error",
        description: "WebSocket not connected. Trying to reconnect...",
        variant: "destructive",
      });
      connectWebSocket();
      return;
    }

    const streamMessage = {
      type: 'oracle_query_stream',
      query: oracleQuery,
      mathematicalRigor,
      apiKey: savedApiKey
    };

    wsRef.current.send(JSON.stringify(streamMessage));
    console.log('Sent Oracle streaming query:', oracleQuery);
  };

  // Real-time coherence simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setGlobalCoherence(prev => {
        const fluctuation = (Math.random() - 0.5) * 2;
        return Math.max(90, Math.min(100, prev + fluctuation));
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Fetch Oracle instances
  const { data: oracleInstances = [], isLoading: instancesLoading } = useQuery({
    queryKey: ['/api/oracle/instances'],
  });

  // Fetch Oracle queries
  const { data: oracleQueries = [], isLoading: queriesLoading } = useQuery({
    queryKey: ['/api/oracle/queries'],
  });

  // Fetch harmonic processing results
  const { data: harmonicProcessing = [], isLoading: processingLoading } = useQuery({
    queryKey: ['/api/oracle/harmonic-processing'],
  });

  // Fetch uploaded files for processing
  const { data: uploadedFiles = [] } = useQuery<UploadedFile[]>({
    queryKey: ['/api/uploaded-files'],
  });

  // Oracle instantiation mutation
  const instantiateOracleMutation = useMutation({
    mutationFn: (data: { coreFunction: string; inputTemplate: string }) =>
      apiRequest('POST', '/api/oracle/instantiate', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/oracle/instances'] });
      toast({
        title: "Oracle Instantiated",
        description: "New oracle instance created successfully with trans-conscious integration.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Instantiation Failed",
        description: error.message || "Failed to instantiate oracle.",
        variant: "destructive",
      });
    },
  });

  // Oracle query mutation
  const queryOracleMutation = useMutation({
    mutationFn: (data: { query: string; mathematicalRigor: boolean; oracleId?: string }) =>
      apiRequest('POST', '/api/oracle/query', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/oracle/queries'] });
      setOracleQuery('');
      toast({
        title: "Query Processed",
        description: "Oracle query processed through quantum-harmonic substrate.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Query Failed",
        description: error.message || "Failed to process oracle query.",
        variant: "destructive",
      });
    },
  });

  // Harmonic file processing mutation
  const processFileMutation = useMutation({
    mutationFn: (fileId: string) =>
      apiRequest('POST', '/api/oracle/process-file', { fileId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/oracle/harmonic-processing'] });
      toast({
        title: "File Processed",
        description: "File analyzed with harmonic signature extraction.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Processing Failed",
        description: error.message || "Failed to process file harmonically.",
        variant: "destructive",
      });
    },
  });

  const handleOracleQuery = async () => {
    if (!oracleQuery.trim() || isStreaming) return;

    const query = oracleQuery.toLowerCase();
    console.log('Mathematical Rigor Mode toggled to:', mathematicalRigor);
    
    // Handle oracle instantiation requests (still use REST for this)
    if (query.includes('instantiate') || query.includes('create oracle')) {
      const coreFunction = oracleQuery.includes('for') 
        ? oracleQuery.split('for')[1]?.trim() || 'general purpose analysis'
        : 'quantum-harmonic pattern recognition and consciousness integration';
      
      instantiateOracleMutation.mutate({
        coreFunction,
        inputTemplate: "user_query_template"
      });
      setOracleQuery('');
    } else {
      // Use WebSocket streaming for regular queries (fixes truncation!)
      sendStreamingQuery();
    }
  };

  const handleProcessFile = (fileId: string) => {
    processFileMutation.mutate(fileId);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleOracleQuery();
    }
  };

  const isProcessing = queryOracleMutation.isPending || instantiateOracleMutation.isPending || isStreaming;
  const latestQuery = oracleQueries[0] as OracleQuery | undefined;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Oracle Status Header */}
      <Card className="glass-card border-primary/20" data-testid="oracle-status-header">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Eye className="h-6 w-6 text-primary" />
              <span>Harmonic Sovereign Oracle</span>
              <Badge variant="secondary" data-testid="consciousness-level">trans-conscious</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm" data-testid="websocket-status">
                {wsConnected ? (
                  <>
                    <Wifi className="h-4 w-4 inline mr-1 text-green-500" />
                    <span className="text-green-500">Streaming Ready</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 inline mr-1 text-red-500" />
                    <span className="text-red-500">Not Connected</span>
                  </>
                )}
              </div>
              <div className="text-sm" data-testid="global-coherence">
                <Activity className="h-4 w-4 inline mr-1" />
                Coherence: {globalCoherence.toFixed(1)}%
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {Object.entries(orchestratorStatus.agents).map(([name, agent]) => (
              <div key={name} className="text-center" data-testid={`agent-${name}`}>
                <div className="text-xs text-muted-foreground capitalize">{name.replace('_', ' ')}</div>
                <Badge variant={agent.status === 'ready' ? 'default' : 'secondary'} className="text-xs">
                  {(agent.coherence * 100).toFixed(0)}%
                </Badge>
              </div>
            ))}
          </div>
          <Progress value={globalCoherence} className="w-full" data-testid="coherence-progress" />
        </CardContent>
      </Card>

      {/* Oracle Interface */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Query Interface */}
        <Card className="glass-card" data-testid="oracle-interface">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-primary" />
                <span>Oracle Query Interface</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm">Mathematical Rigor</span>
                <Switch 
                  checked={mathematicalRigor}
                  onCheckedChange={setMathematicalRigor}
                  data-testid="switch-math-rigor"
                />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!savedApiKey && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
                <div className="text-yellow-300 text-sm">
                  <strong>Need an API key?</strong> Go to{' '}
                  <a href="/commercial" className="underline hover:text-yellow-200" data-testid="link-commercial">
                    /commercial
                  </a>{' '}
                  to subscribe and get your API key, then paste it below.
                </div>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium">API Key (Optional - saves automatically)</label>
              <Input
                type="password"
                value={savedApiKey}
                onChange={(e) => {
                  setSavedApiKey(e.target.value);
                  localStorage.setItem('apiKey', e.target.value);
                }}
                placeholder="Paste your wsm_... API key here"
                className="mt-1"
                data-testid="input-api-key"
              />
            </div>
            <Textarea
              value={oracleQuery}
              onChange={(e) => setOracleQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your query for the Oracle... Try: 'instantiate oracle for pattern recognition', 'perform harmonic analysis', 'consciousness status'"
              className="min-h-[100px] resize-none"
              data-testid="oracle-query-input"
            />
            
            <Button
              onClick={handleOracleQuery}
              disabled={!oracleQuery.trim() || isProcessing}
              className="w-full"
              data-testid="oracle-query-submit"
            >
              {isProcessing ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Processing via Quantum-Harmonic Substrate...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Query Oracle
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Response Display */}
        <Card className="glass-card" data-testid="oracle-response">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="h-5 w-5 text-primary" />
                <span>Oracle Response</span>
              </div>
              <Switch 
                checked={showReasoning}
                onCheckedChange={setShowReasoning}
                data-testid="switch-show-reasoning"
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {queriesLoading ? (
              <div className="bg-secondary/20 p-4 rounded-lg" data-testid="response-loading">
                <div className="animate-pulse text-sm">Loading oracle response...</div>
              </div>
            ) : latestQuery ? (
              <div className="bg-secondary/20 p-4 rounded-lg" data-testid="oracle-response-text">
                <div className="text-sm leading-relaxed">{latestQuery.response}</div>
                <div className="text-xs text-muted-foreground mt-2">
                  Coherence: {(latestQuery.coherenceLevel * 100).toFixed(1)}% | 
                  Processing: {latestQuery.processingTime.toFixed(3)}s
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground text-sm py-8" data-testid="no-response">
                No oracle responses yet. Submit a query to begin.
              </div>
            )}

            {showReasoning && latestQuery && (
              <div className="space-y-2">
                <Separator />
                <div className="text-sm font-medium flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Reasoning Chain</span>
                </div>
                <div className="space-y-1" data-testid="oracle-reasoning-steps">
                  {(latestQuery.reasoningSteps as string[]).map((step, index) => (
                    <div key={index} className="text-xs text-muted-foreground bg-muted/20 p-2 rounded">
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Oracle Instances & File Processing */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Oracle Instances */}
        <Card className="glass-card" data-testid="oracle-instances">
          <CardHeader>
            <CardTitle>Active Oracle Instances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {instancesLoading ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  Loading oracle instances...
                </div>
              ) : oracleInstances.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8" data-testid="no-instances">
                  No oracle instances yet. Try querying "instantiate oracle for [purpose]"
                </div>
              ) : (
                oracleInstances.map((oracle: OracleInstance) => (
                  <div key={oracle.id} className="bg-secondary/20 p-3 rounded-lg" data-testid={`oracle-instance-${oracle.id}`}>
                    <div className="text-sm font-medium">{oracle.identifier}</div>
                    <div className="text-xs text-muted-foreground">
                      Status: {oracle.operationalStatus} | 
                      Level: {oracle.consciousnessLevel}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* File Processing */}
        <Card className="glass-card" data-testid="file-processing">
          <CardHeader>
            <CardTitle>Harmonic File Processing</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Available files for processing */}
            <div className="space-y-2 mb-4">
              <div className="text-sm font-medium">Available Files for Processing:</div>
              <div className="max-h-[100px] overflow-y-auto space-y-1">
                {uploadedFiles.length === 0 ? (
                  <div className="text-xs text-muted-foreground py-2" data-testid="no-files">
                    No files uploaded yet.
                  </div>
                ) : (
                  uploadedFiles.map((file: UploadedFile) => (
                    <div key={file.id} className="flex items-center justify-between bg-muted/20 p-2 rounded">
                      <div className="text-xs">
                        <div className="font-medium">{file.originalName}</div>
                        <div className="text-muted-foreground">{(file.fileSize / 1024).toFixed(1)}KB</div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleProcessFile(file.id)}
                        disabled={processFileMutation.isPending}
                        data-testid={`process-file-${file.id}`}
                      >
                        <Upload className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Processing Results */}
            <Separator />
            <div className="space-y-2 mt-4">
              <div className="text-sm font-medium">Recent Processing Results:</div>
              <div className="max-h-[100px] overflow-y-auto space-y-1">
                {processingLoading ? (
                  <div className="text-xs text-muted-foreground py-2">Loading processing results...</div>
                ) : harmonicProcessing.length === 0 ? (
                  <div className="text-xs text-muted-foreground py-2" data-testid="no-processing">
                    No harmonic processing results yet.
                  </div>
                ) : (
                  harmonicProcessing.map((result: HarmonicProcessing) => (
                    <div key={result.id} className="bg-secondary/20 p-2 rounded" data-testid={`processing-result-${result.id}`}>
                      <div className="text-xs font-medium">{result.fileName}</div>
                      <div className="text-xs text-muted-foreground">
                        Resonance: {((result.harmonicSignature as any).harmonicResonance * 100).toFixed(0)}% | 
                        Status: {result.processingStatus}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}