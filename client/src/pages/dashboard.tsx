import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  Brain, 
  Upload, 
  MessageSquare, 
  Settings, 
  Activity,
  DollarSign,
  Sparkles,
  Home,
  BarChart3,
  Shield,
  Send,
  Loader2,
  FileText,
  X,
  ChevronDown,
  ChevronRight,
  Paperclip,
  History,
  PanelLeft,
  Zap,
  Code2,
  Lightbulb,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Link } from "wouter";

// Message type for chat
type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  thinking?: string;
  sources?: string[];
  isLoading?: boolean;
};

// File type for uploads
type UploadedFile = {
  id: string;
  name: string;
  size: number;
  status: "uploading" | "processing" | "ready" | "error";
  progress?: number;
};

export default function Dashboard() {
  const [isOnline, setIsOnline] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState<"chat" | "files" | "history">("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Health check
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health');
        setIsOnline(response.ok);
      } catch {
        setIsOnline(false);
      }
    };
    
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch existing files on mount
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch('/api/uploaded-files');
        if (response.ok) {
          const data = await response.json();
          if (data.files && Array.isArray(data.files)) {
            setFiles(data.files.map((f: any) => ({
              id: f.id || f.fileId || String(Date.now()),
              name: f.filename || f.name,
              size: f.fileSize || f.size || 0,
              status: 'ready' as const
            })));
          }
        }
      } catch (error) {
        console.error('Failed to fetch files:', error);
      }
    };
    fetchFiles();
  }, []);

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const tempId = `temp-${Date.now()}-${i}`;
      
      // Add file to list with uploading status
      setFiles(prev => [...prev, {
        id: tempId,
        name: file.name,
        size: file.size,
        status: 'uploading',
        progress: 0
      }]);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/process-file', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const result = await response.json();
          setFiles(prev => prev.map(f => 
            f.id === tempId 
              ? { ...f, id: result.fileId || tempId, status: 'ready' as const }
              : f
          ));
          
          // Add system message about file upload
          setMessages(prev => [...prev, {
            id: `sys-${Date.now()}`,
            role: 'system',
            content: `📎 File "${file.name}" uploaded successfully. You can now ask questions about it.`,
            timestamp: new Date()
          }]);
        } else {
          setFiles(prev => prev.map(f => 
            f.id === tempId ? { ...f, status: 'error' as const } : f
          ));
        }
      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === tempId ? { ...f, status: 'error' as const } : f
        ));
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Add loading message
    const loadingId = `loading-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: loadingId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    }]);

    try {
      const response = await fetch('/api/files/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage.content })
      });

      const data = await response.json();
      
      // Remove loading message and add real response
      setMessages(prev => prev.filter(m => m.id !== loadingId));
      
      setMessages(prev => [...prev, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response || data.answer || "I couldn't find relevant information in your files.",
        timestamp: new Date(),
        thinking: data.thinking || undefined,
        sources: data.sources || data.files || undefined
      }]);
    } catch (error) {
      setMessages(prev => prev.filter(m => m.id !== loadingId));
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Remove file
  const removeFile = async (fileId: string) => {
    try {
      await fetch(`/api/files/${fileId}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <div className={`${showSidebar ? 'w-72' : 'w-0'} transition-all duration-300 border-r border-border bg-card flex flex-col overflow-hidden`}>
        {showSidebar && (
          <>
            {/* Sidebar Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-2">
                  <Brain className="text-white h-5 w-5" />
                </div>
                <div>
                  <h1 className="font-bold text-foreground">WSM AI</h1>
                  <p className="text-xs text-muted-foreground">Mathematical AI</p>
                </div>
              </div>
            </div>

            {/* Sidebar Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
              <TabsList className="mx-4 mt-4 grid grid-cols-3">
                <TabsTrigger value="chat" className="text-xs">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="files" className="text-xs">
                  <FileText className="h-3 w-3 mr-1" />
                  Files
                </TabsTrigger>
                <TabsTrigger value="history" className="text-xs">
                  <History className="h-3 w-3 mr-1" />
                  History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="flex-1 p-4 space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={() => setMessages([])}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  New Conversation
                </Button>
                
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Quick Actions</p>
                  <Link href="/commercial">
                    <Button variant="ghost" size="sm" className="w-full justify-start text-sm">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Commercial API
                    </Button>
                  </Link>
                  <Link href="/vm-benchmarking">
                    <Button variant="ghost" size="sm" className="w-full justify-start text-sm">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Benchmarking
                    </Button>
                  </Link>
                  <Link href="/admin">
                    <Button variant="ghost" size="sm" className="w-full justify-start text-sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Admin Panel
                    </Button>
                  </Link>
                </div>
              </TabsContent>

              <TabsContent value="files" className="flex-1 p-4 overflow-hidden flex flex-col">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="*/*"
                />
                <Button 
                  variant="outline" 
                  className="w-full mb-4"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
                
                <ScrollArea className="flex-1">
                  <div className="space-y-2">
                    {files.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No files uploaded yet
                      </p>
                    ) : (
                      files.map(file => (
                        <div 
                          key={file.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/50 group"
                        >
                          <div className="flex items-center space-x-2 min-w-0">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatSize(file.size)}
                                {file.status === 'uploading' && ' • Uploading...'}
                                {file.status === 'processing' && ' • Processing...'}
                                {file.status === 'ready' && ' • Ready'}
                                {file.status === 'error' && ' • Error'}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeFile(file.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="history" className="flex-1 p-4">
                <p className="text-sm text-muted-foreground text-center py-8">
                  Chat history coming soon
                </p>
              </TabsContent>
            </Tabs>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-xs text-muted-foreground">
                    {isOnline ? 'Connected' : 'Offline'}
                  </span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {files.filter(f => f.status === 'ready').length} files
                </Badge>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="font-semibold text-foreground">WSM AI Assistant</h2>
              <p className="text-xs text-muted-foreground">
                {files.filter(f => f.status === 'ready').length} files available for RAG
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant={isOnline ? "default" : "destructive"} className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>
        </header>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full p-6 mb-6">
                  <Sparkles className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Welcome to WSM AI</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Upload files and ask questions. I'll search through your documents with mathematical precision.
                </p>
                
                <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                  {[
                    "What's in my uploaded files?",
                    "Summarize the key points",
                    "Find specific information",
                    "Compare documents"
                  ].map((prompt, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setInput(prompt);
                        textareaRef.current?.focus();
                      }}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : message.role === 'system'
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                    }`}>
                      {message.role === 'user' ? (
                        <span className="text-sm font-medium">U</span>
                      ) : message.role === 'system' ? (
                        <Zap className="h-4 w-4" />
                      ) : (
                        <Brain className="h-4 w-4" />
                      )}
                    </div>

                    {/* Message Content */}
                    <div className={`rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : message.role === 'system'
                        ? 'bg-muted/50 text-muted-foreground border border-border'
                        : 'bg-muted'
                    }`}>
                      {message.isLoading ? (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Thinking...</span>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          
                          {/* Thinking dropdown */}
                          {message.thinking && (
                            <Collapsible className="mt-3">
                              <CollapsibleTrigger className="flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors">
                                <Lightbulb className="h-3 w-3 mr-1" />
                                View reasoning
                                <ChevronDown className="h-3 w-3 ml-1" />
                              </CollapsibleTrigger>
                              <CollapsibleContent className="mt-2 p-2 rounded bg-background/50 text-xs text-muted-foreground">
                                {message.thinking}
                              </CollapsibleContent>
                            </Collapsible>
                          )}
                          
                          {/* Sources */}
                          {message.sources && message.sources.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border/50">
                              <p className="text-xs text-muted-foreground mb-1">Sources:</p>
                              <div className="flex flex-wrap gap-1">
                                {message.sources.map((source, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    <FileText className="h-3 w-3 mr-1" />
                                    {source}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border p-4 bg-card/50 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question about your files..."
                  className="min-h-[44px] max-h-32 resize-none pr-12"
                  rows={1}
                />
              </div>
              
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground text-center mt-2">
              WSM AI uses mathematical precision for 98-99% accuracy. Press Enter to send, Shift+Enter for new line.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
