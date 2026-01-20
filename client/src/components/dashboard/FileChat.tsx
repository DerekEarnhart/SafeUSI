import { useState } from 'react';
import { Send, MessageCircle, FileText, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface UploadedFile {
  id: string;
  filename: string;
  fileSize: number;
  fileType: string;
  status: string;
  textExtracted: boolean;
  wordCount: number;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  type: 'question' | 'answer';
  content: string;
  sources?: { filename: string; fileType: string; relevanceScore: number }[];
  timestamp: Date;
}

interface QueryResponse {
  question: string;
  answer: string;
  sources: { filename: string; fileType: string; relevanceScore: number }[];
  totalFiles: number;
}

export function FileChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get uploaded files
  const { data: uploadedFiles = [], isLoading: filesLoading } = useQuery<UploadedFile[]>({
    queryKey: ['/api/uploaded-files'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Query mutation
  const queryMutation = useMutation({
    mutationFn: async (question: string): Promise<QueryResponse> => {
      const response = await fetch('/api/files/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question, userId: 'anonymous' }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to query files');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      const answerMessage: ChatMessage = {
        id: `answer-${Date.now()}`,
        type: 'answer',
        content: data.answer,
        sources: data.sources,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, answerMessage]);
    },
    onError: (error) => {
      toast({
        title: "Query failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    // Add question to chat
    const questionMessage: ChatMessage = {
      id: `question-${Date.now()}`,
      type: 'question',
      content: question,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, questionMessage]);

    // Send query
    queryMutation.mutate(question);
    setQuestion('');
  };

  const processedFiles = uploadedFiles.filter(file => file.textExtracted);

  return (
    <Card className="border-blue-200/20 bg-blue-50/5 dark:bg-blue-950/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          Ask Questions About Your Files
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Status */}
        <div className="p-3 bg-background/50 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">
              Files Available: {processedFiles.length} of {uploadedFiles.length}
            </span>
          </div>
          {processedFiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Upload some files first to start asking questions
            </p>
          ) : (
            <div className="text-xs text-muted-foreground">
              {processedFiles.map(file => file.filename).join(', ')}
            </div>
          )}
        </div>

        {/* Chat Messages */}
        <ScrollArea className="h-64 w-full">
          <div className="space-y-3 p-2">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Ask questions about your uploaded files</p>
                <p className="text-xs mt-1">Example: "What is this document about?"</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'question' ? 'justify-end' : 'justify-start'}`}
                  data-testid={`message-${message.id}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 text-sm ${
                      message.type === 'question'
                        ? 'bg-blue-600 text-white'
                        : 'bg-background border'
                    }`}
                  >
                    <p>{message.content}</p>
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-300/20">
                        <p className="text-xs opacity-80">Sources:</p>
                        {message.sources.map((source, idx) => (
                          <p key={idx} className="text-xs opacity-70">
                            • {source.filename}
                          </p>
                        ))}
                      </div>
                    )}
                    <p className="text-xs opacity-60 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
            {queryMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-background border rounded-lg p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-500 border-t-transparent" />
                    Searching your files...
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Question Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={
              processedFiles.length === 0 
                ? "Upload files first to ask questions" 
                : "Ask a question about your files..."
            }
            disabled={processedFiles.length === 0 || queryMutation.isPending}
            className="flex-1"
            data-testid="question-input"
          />
          <Button 
            type="submit" 
            disabled={!question.trim() || processedFiles.length === 0 || queryMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
            data-testid="ask-button"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>

        {/* Instructions */}
        <div className="p-2 text-xs text-muted-foreground bg-background/30 rounded border">
          <p>
            💡 <strong>Tip:</strong> This simple RAG system searches through your uploaded files 
            to answer questions. Ask about content, summaries, or specific information.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}