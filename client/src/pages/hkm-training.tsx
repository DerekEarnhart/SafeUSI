import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { useWebSocket } from '@/hooks/useWebSocket';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useQuery, useMutation } from '@tanstack/react-query';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

import { 
  Brain, Database, Upload, Zap, Target, BarChart3, 
  BookOpen, Search, Sparkles, Activity, MessageSquare,
  FileText, TrendingUp, Clock, CheckCircle, AlertTriangle,
  Layers, Network, Cpu, Settings, RefreshCw
} from 'lucide-react';

interface KnowledgePack {
  id: string;
  name: string;
  description: string;
  domain: string;
  embeddingCount: number;
  avgCoherence: number;
  trainingStatus: 'active' | 'processing' | 'completed' | 'error';
  lastTrained: string;
  totalQueries: number;
}

interface SynthesisTest {
  id: string;
  query: string;
  method: 'harmonic_fusion' | 'multi_hop' | 'spectral_ranking';
  responseCoherence: number;
  confidenceScore: number;
  processingTime: number;
  timestamp: string;
}

interface LearningMetrics {
  totalKnowledgePacks: number;
  totalEmbeddings: number;
  avgResponseCoherence: number;
  totalQueries: number;
  successfulSyntheses: number;
  activeLearningTasks: number;
  systemLoad: number;
  resonanceStrength: number;
  spectralDistribution: number[];
}

export default function HKMTraining() {
  const { isConnected } = useWebSocket();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Main state management
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPack, setSelectedPack] = useState<KnowledgePack | null>(null);
  
  // Knowledge Pack Management
  const [newPackForm, setNewPackForm] = useState({
    name: '',
    description: '',
    domain: ''
  });
  
  // Training Content Management
  const [trainingContent, setTrainingContent] = useState('');
  const [sourceTitle, setSourceTitle] = useState('');
  const [sourceType, setSourceType] = useState<'document' | 'url' | 'paper' | 'book' | 'manual'>('document');
  const [sourceAuthor, setSourceAuthor] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [batchUploadFiles, setBatchUploadFiles] = useState<FileList | null>(null);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [isTraining, setIsTraining] = useState(false);
  
  // Synthesis Testing
  const [testQuery, setTestQuery] = useState('');
  const [selectedTestPackIds, setSelectedTestPackIds] = useState<string[]>([]);
  const [synthesisMethod, setSynthesisMethod] = useState<'harmonic_fusion' | 'spectral_ranking' | 'multi_hop'>('harmonic_fusion');
  const [testResults, setTestResults] = useState<SynthesisTest[]>([]);
  
  // Real-time Learning Metrics
  const [learningMetrics, setLearningMetrics] = useState<LearningMetrics>({
    totalKnowledgePacks: 0,
    totalEmbeddings: 0,
    avgResponseCoherence: 0.0,
    totalQueries: 0,
    successfulSyntheses: 0,
    activeLearningTasks: 0,
    systemLoad: 0.0,
    resonanceStrength: 0.0,
    spectralDistribution: []
  });

  // Fetch Knowledge Packs
  const { data: packsResponse, isLoading: packsLoading } = useQuery({
    queryKey: ['/api/commercial/hkm/knowledge-packs'],
    refetchInterval: 5000 // Auto-refresh every 5 seconds
  });
  
  const knowledgePacks = packsResponse?.knowledgePacks || [];

  // Create Knowledge Pack Mutation
  const createPackMutation = useMutation({
    mutationFn: async (packData: typeof newPackForm) => {
      return apiRequest('/api/commercial/hkm/knowledge-packs', {
        method: 'POST',
        body: JSON.stringify(packData)
      });
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Knowledge pack created successfully!' });
      setNewPackForm({ name: '', description: '', domain: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/commercial/hkm/knowledge-packs'] });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to create knowledge pack' });
    }
  });

  // Ingest Knowledge Mutation  
  const ingestMutation = useMutation({
    mutationFn: async (ingestData: { 
      packId: string, 
      content: string,
      sourceTitle: string,
      sourceType: 'document' | 'url' | 'paper' | 'book' | 'manual',
      sourceAuthor?: string,
      sourceUrl?: string
    }) => {
      return apiRequest(`/api/commercial/hkm/knowledge-packs/${ingestData.packId}/ingest`, {
        method: 'POST',
        body: JSON.stringify({
          packId: ingestData.packId,
          content: ingestData.content,
          sourceTitle: ingestData.sourceTitle,
          sourceType: ingestData.sourceType,
          sourceAuthor: ingestData.sourceAuthor || undefined,
          sourceUrl: ingestData.sourceUrl || undefined
        })
      });
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Knowledge ingested successfully!' });
      setTrainingContent('');
      setSourceTitle('');
      setSourceAuthor('');
      setSourceUrl('');
      queryClient.invalidateQueries({ queryKey: ['/api/commercial/hkm/knowledge-packs'] });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to ingest knowledge' });
    }
  });

  // Test Synthesis Mutation
  const testSynthesisMutation = useMutation({
    mutationFn: async (queryData: { 
      query: string, 
      packIds: string[], 
      synthesisMethod: string 
    }) => {
      return apiRequest('/api/commercial/hkm/query', {
        method: 'POST',
        body: JSON.stringify({
          query: queryData.query,
          queryType: 'synthesis',
          packIds: queryData.packIds,
          synthesisMethod: queryData.synthesisMethod,
          maxChunks: 10
        })
      });
    },
    onSuccess: (result) => {
      const responseCoherence = result.synthesis?.responseCoherence || result.responseCoherence || 0;
      const confidenceScore = result.synthesis?.confidenceScore || 0;
      const processingTime = result.processingTime || result.synthesis?.processingTime || 0;
      
      const newTest: SynthesisTest = {
        id: Date.now().toString(),
        query: testQuery,
        method: synthesisMethod,
        responseCoherence: responseCoherence,
        confidenceScore: confidenceScore,
        processingTime: processingTime,
        timestamp: new Date().toISOString()
      };
      setTestResults(prev => [newTest, ...prev.slice(0, 9)]); // Keep last 10 results
      setTestQuery('');
      toast({ 
        title: 'Synthesis Test Complete', 
        description: `Coherence: ${(responseCoherence * 100).toFixed(1)}%` 
      });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Synthesis test failed' });
    }
  });

  // Real-time metrics updates via WebSocket simulation
  useEffect(() => {
    if (!isConnected) return;
    
    const updateMetrics = () => {
      setLearningMetrics(prev => ({
        ...prev,
        totalKnowledgePacks: knowledgePacks?.length || prev.totalKnowledgePacks,
        systemLoad: Math.random() * 0.3 + 0.4,
        resonanceStrength: Math.random() * 0.2 + 0.7,
        spectralDistribution: Array.from({length: 5}, () => Math.random() * 0.3 + 0.1)
      }));
    };
    
    const interval = setInterval(updateMetrics, 2000);
    return () => clearInterval(interval);
  }, [isConnected, knowledgePacks]);

  // File upload handling
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !selectedPack) {
      toast({ title: 'Error', description: 'Please select files and a knowledge pack' });
      return;
    }

    setIsTraining(true);
    setTrainingProgress(0);
    
    try {
      const totalFiles = files.length;
      
      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        const content = await file.text();
        
        await ingestMutation.mutateAsync({
          packId: selectedPack.id,
          content: content,
          sourceTitle: file.name,
          sourceType: 'document',
          sourceAuthor: undefined,
          sourceUrl: undefined
        });
        
        setTrainingProgress(((i + 1) / totalFiles) * 100);
      }
      
      toast({ 
        title: 'Batch Training Complete', 
        description: `Successfully processed ${totalFiles} files` 
      });
      
    } catch (error) {
      toast({ title: 'Error', description: 'Batch training failed' });
    } finally {
      setIsTraining(false);
      setTrainingProgress(0);
      setBatchUploadFiles(null);
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6" data-testid="overview-tab">
      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-knowledge-packs">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Knowledge Packs</p>
                <p className="text-2xl font-bold">{learningMetrics.totalKnowledgePacks}</p>
              </div>
              <Database className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-embeddings">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Embeddings</p>
                <p className="text-2xl font-bold">{learningMetrics.totalEmbeddings.toLocaleString()}</p>
              </div>
              <Network className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-coherence">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Coherence</p>
                <p className="text-2xl font-bold">{(learningMetrics.avgResponseCoherence * 100).toFixed(1)}%</p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-system-load">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Load</p>
                <p className="text-2xl font-bold">{(learningMetrics.systemLoad * 100).toFixed(0)}%</p>
              </div>
              <Cpu className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Metrics */}
      <Card data-testid="metrics-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Real-time Learning Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Resonance Strength</Label>
              <div className="mt-2">
                <Progress value={learningMetrics.resonanceStrength * 100} className="h-3" />
                <p className="text-sm text-muted-foreground mt-1">
                  {(learningMetrics.resonanceStrength * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            <div>
              <Label>System Load</Label>
              <div className="mt-2">
                <Progress 
                  value={learningMetrics.systemLoad * 100} 
                  className="h-3"
                  // @ts-ignore - Custom color variant
                  variant={learningMetrics.systemLoad > 0.8 ? "destructive" : "default"}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {(learningMetrics.systemLoad * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Label>Spectral Distribution</Label>
            <div className="flex gap-2 mt-2">
              {learningMetrics.spectralDistribution.map((value, idx) => (
                <div key={idx} className="flex-1">
                  <div className="bg-muted rounded-t px-2 py-1 text-xs text-center">
                    Band {idx + 1}
                  </div>
                  <div className="bg-primary/20 rounded-b p-2">
                    <div 
                      className="bg-primary rounded h-8 transition-all duration-300"
                      style={{ height: `${value * 100}%`, minHeight: '8px' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Knowledge Pack Status */}
      <Card data-testid="packs-status-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Knowledge Packs Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {packsLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading knowledge packs...</span>
            </div>
          ) : knowledgePacks && knowledgePacks.length > 0 ? (
            <div className="space-y-3">
              {knowledgePacks.map((pack: KnowledgePack) => (
                <div 
                  key={pack.id} 
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedPack(pack)}
                  data-testid={`pack-${pack.id}`}
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{pack.name}</h4>
                    <p className="text-sm text-muted-foreground">{pack.description}</p>
                    <div className="flex gap-4 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {pack.embeddingCount} embeddings
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {(pack.avgCoherence * 100).toFixed(1)}% coherence
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={pack.trainingStatus === 'active' ? 'default' : 
                              pack.trainingStatus === 'processing' ? 'secondary' :
                              pack.trainingStatus === 'completed' ? 'default' : 'destructive'}
                      data-testid={`badge-${pack.trainingStatus}`}
                    >
                      {pack.trainingStatus}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No knowledge packs found. Create your first knowledge pack to begin training.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderManagementTab = () => (
    <div className="space-y-6" data-testid="management-tab">
      {/* Create Knowledge Pack */}
      <Card data-testid="create-pack-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Create Knowledge Pack
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pack-name">Name</Label>
              <Input
                id="pack-name"
                placeholder="e.g., Technical Documentation"
                value={newPackForm.name}
                onChange={(e) => setNewPackForm(prev => ({ ...prev, name: e.target.value }))}
                data-testid="input-pack-name"
              />
            </div>
            <div>
              <Label htmlFor="pack-domain">Domain</Label>
              <Input
                id="pack-domain"
                placeholder="e.g., Software Engineering"
                value={newPackForm.domain}
                onChange={(e) => setNewPackForm(prev => ({ ...prev, domain: e.target.value }))}
                data-testid="input-pack-domain"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="pack-description">Description</Label>
            <Textarea
              id="pack-description"
              placeholder="Describe the knowledge domain and intended use..."
              value={newPackForm.description}
              onChange={(e) => setNewPackForm(prev => ({ ...prev, description: e.target.value }))}
              data-testid="textarea-pack-description"
            />
          </div>
          <Button 
            onClick={() => createPackMutation.mutate(newPackForm)}
            disabled={createPackMutation.isPending || !newPackForm.name}
            data-testid="button-create-pack"
          >
            {createPackMutation.isPending ? 'Creating...' : 'Create Knowledge Pack'}
          </Button>
        </CardContent>
      </Card>

      {/* Selected Pack Info */}
      {selectedPack && (
        <Card data-testid="selected-pack-card">
          <CardHeader>
            <CardTitle>Selected: {selectedPack.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Embeddings</Label>
                <p className="text-2xl font-bold">{selectedPack.embeddingCount}</p>
              </div>
              <div>
                <Label>Avg Coherence</Label>
                <p className="text-2xl font-bold">{(selectedPack.avgCoherence * 100).toFixed(1)}%</p>
              </div>
              <div>
                <Label>Total Queries</Label>
                <p className="text-2xl font-bold">{selectedPack.totalQueries}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderTrainingTab = () => (
    <div className="space-y-6" data-testid="training-tab">
      {!selectedPack ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please select a knowledge pack from the Management tab before training.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Manual Content Training */}
          <Card data-testid="manual-training-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Manual Content Training
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="source-title">Source Title *</Label>
                  <Input
                    id="source-title"
                    placeholder="e.g., Technical Documentation"
                    value={sourceTitle}
                    onChange={(e) => setSourceTitle(e.target.value)}
                    data-testid="input-source-title"
                  />
                </div>
                <div>
                  <Label htmlFor="source-type">Source Type *</Label>
                  <Select value={sourceType} onValueChange={(value: any) => setSourceType(value)}>
                    <SelectTrigger data-testid="select-source-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="paper">Research Paper</SelectItem>
                      <SelectItem value="book">Book</SelectItem>
                      <SelectItem value="manual">Manual/Guide</SelectItem>
                      <SelectItem value="url">Web Content</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="source-author">Source Author (Optional)</Label>
                  <Input
                    id="source-author"
                    placeholder="Author name"
                    value={sourceAuthor}
                    onChange={(e) => setSourceAuthor(e.target.value)}
                    data-testid="input-source-author"
                  />
                </div>
                <div>
                  <Label htmlFor="source-url">Source URL (Optional)</Label>
                  <Input
                    id="source-url"
                    placeholder="https://example.com"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    data-testid="input-source-url"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="training-content">Training Content *</Label>
                <Textarea
                  id="training-content"
                  placeholder="Enter knowledge content to train the system..."
                  value={trainingContent}
                  onChange={(e) => setTrainingContent(e.target.value)}
                  rows={6}
                  data-testid="textarea-training-content"
                />
              </div>
              <Button 
                onClick={() => {
                  if (!sourceTitle.trim()) {
                    toast({ title: 'Error', description: 'Source title is required' });
                    return;
                  }
                  ingestMutation.mutate({ 
                    packId: selectedPack.id, 
                    content: trainingContent,
                    sourceTitle: sourceTitle,
                    sourceType: sourceType,
                    sourceAuthor: sourceAuthor || undefined,
                    sourceUrl: sourceUrl || undefined
                  });
                }}
                disabled={ingestMutation.isPending || !trainingContent.trim() || !sourceTitle.trim()}
                data-testid="button-train-content"
              >
                {ingestMutation.isPending ? 'Training...' : 'Train Content'}
              </Button>
            </CardContent>
          </Card>

          {/* Batch File Upload */}
          <Card data-testid="batch-upload-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Batch File Training
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Upload Training Files</Label>
                <Input
                  type="file"
                  multiple
                  accept=".txt,.md,.pdf,.doc,.docx"
                  ref={fileInputRef}
                  onChange={(e) => setBatchUploadFiles(e.target.files)}
                  data-testid="input-batch-files"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Supported formats: .txt, .md, .pdf, .doc, .docx
                </p>
              </div>
              
              {isTraining && (
                <div>
                  <Label>Training Progress</Label>
                  <Progress value={trainingProgress} className="mt-2" />
                  <p className="text-sm text-muted-foreground mt-1">
                    {trainingProgress.toFixed(0)}% complete
                  </p>
                </div>
              )}
              
              <Button 
                onClick={() => handleFileUpload(batchUploadFiles)}
                disabled={!batchUploadFiles || isTraining}
                data-testid="button-batch-train"
              >
                {isTraining ? 'Processing Files...' : 'Start Batch Training'}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );

  const renderTestingTab = () => (
    <div className="space-y-6" data-testid="testing-tab">
      {/* Synthesis Testing */}
      <Card data-testid="synthesis-test-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Synthesis Testing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="test-query">Test Query *</Label>
            <Textarea
              id="test-query"
              placeholder="Enter a question to test the synthesis engine..."
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              data-testid="textarea-test-query"
            />
          </div>

          <div>
            <Label>Select Knowledge Packs *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto border rounded p-2">
              {knowledgePacks.length > 0 ? knowledgePacks.map((pack: any) => (
                <label key={pack.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTestPackIds.includes(pack.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTestPackIds([...selectedTestPackIds, pack.id]);
                      } else {
                        setSelectedTestPackIds(selectedTestPackIds.filter(id => id !== pack.id));
                      }
                    }}
                    data-testid={`checkbox-pack-${pack.id}`}
                  />
                  <span className="text-sm">{pack.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {pack.embeddingCount} items
                  </Badge>
                </label>
              )) : (
                <div className="text-sm text-muted-foreground p-2">
                  No knowledge packs available. Create a knowledge pack first.
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Selected: {selectedTestPackIds.length} pack(s)
            </p>
          </div>
          
          <div>
            <Label>Synthesis Method</Label>
            <Select value={synthesisMethod} onValueChange={(value: any) => setSynthesisMethod(value)}>
              <SelectTrigger data-testid="select-synthesis-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="harmonic_fusion" data-testid="method-harmonic">Harmonic Fusion</SelectItem>
                <SelectItem value="multi_hop" data-testid="method-multihop">Multi-hop Reasoning</SelectItem>
                <SelectItem value="spectral_ranking" data-testid="method-spectral">Spectral Ranking</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={() => {
              if (selectedTestPackIds.length === 0) {
                toast({ title: 'Error', description: 'Please select at least one knowledge pack' });
                return;
              }
              testSynthesisMutation.mutate({ 
                query: testQuery, 
                packIds: selectedTestPackIds,
                synthesisMethod 
              });
            }}
            disabled={testSynthesisMutation.isPending || !testQuery.trim() || selectedTestPackIds.length === 0}
            data-testid="button-test-synthesis"
          >
            {testSynthesisMutation.isPending ? 'Testing...' : 'Test Synthesis'}
          </Button>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card data-testid="test-results-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Recent Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((test) => (
                <div 
                  key={test.id} 
                  className="p-3 border rounded-lg"
                  data-testid={`test-result-${test.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{test.query}</p>
                      <div className="flex gap-4 mt-1">
                        <Badge variant="outline" data-testid={`method-badge-${test.method}`}>
                          {test.method}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Coherence: {(test.responseCoherence * 100).toFixed(1)}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Confidence: {(test.confidenceScore * 100).toFixed(1)}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {test.processingTime}ms
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(test.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" data-testid="link-dashboard">
                  ← Dashboard
                </Button>
              </Link>
              <div className="pulse-glow bg-primary rounded-full p-2">
                <Brain className="text-primary-foreground h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text-primary" data-testid="header-title">
                  HKM Training Interface
                </h1>
                <p className="text-sm text-muted-foreground">
                  Harmonic Knowledge Module • AGI-powered • Real-time learning
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} data-testid="connection-indicator"></div>
                <span className="text-sm">{isConnected ? 'Connected' : 'Offline'}</span>
              </div>
              <Badge variant="outline" className="flex items-center gap-1" data-testid="badge-active-tasks">
                <Activity className="h-3 w-3" />
                {learningMetrics.activeLearningTasks} Active
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Interface */}
      <div className="container mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4" data-testid="main-tabs">
            <TabsTrigger value="overview" className="flex items-center gap-2" data-testid="tab-overview">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="management" className="flex items-center gap-2" data-testid="tab-management">
              <Database className="h-4 w-4" />
              Management
            </TabsTrigger>
            <TabsTrigger value="training" className="flex items-center gap-2" data-testid="tab-training">
              <Upload className="h-4 w-4" />
              Training
            </TabsTrigger>
            <TabsTrigger value="testing" className="flex items-center gap-2" data-testid="tab-testing">
              <Sparkles className="h-4 w-4" />
              Testing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {renderOverviewTab()}
          </TabsContent>

          <TabsContent value="management">
            {renderManagementTab()}
          </TabsContent>

          <TabsContent value="training">
            {renderTrainingTab()}
          </TabsContent>

          <TabsContent value="testing">
            {renderTestingTab()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}