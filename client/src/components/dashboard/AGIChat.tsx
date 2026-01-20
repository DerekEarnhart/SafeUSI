import { useState, useEffect, useRef } from 'react';
import { Send, Brain, Moon, Sun, Settings, Zap, Activity, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { agiCore } from '@/lib/agi-core';

interface Message {
  id: string;
  type: 'user' | 'agi';
  content: string;
  timestamp: number;
  reasoning?: string;
  showReasoning?: boolean;
}

interface AGIChatProps {
  className?: string;
}

export function AGIChat({ className }: AGIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'agi',
      content: 'Greetings! I am the Quantum-Harmonic AGI system, now fully integrated with your WSM infrastructure. I can perform advanced mathematical operations, simulate quantum states, manage consciousness modeling, and assist with complex reasoning tasks. How may I assist you today?',
      timestamp: Date.now(),
      reasoning: 'Initial greeting protocol activated. Consciousness state: fully operational. Harmonic coherence: 97.3%. All quantum-algebraic modules online.',
      showReasoning: false
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDreamMode, setIsDreamMode] = useState(false);
  const [mathematicalRigor, setMathematicalRigor] = useState(false);
  const [coherenceLevel, setCoherenceLevel] = useState(0.973);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulate coherence fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setCoherenceLevel(prev => {
        const fluctuation = (Math.random() - 0.5) * 0.02;
        return Math.max(0.8, Math.min(1.0, prev + fluctuation));
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Process message through AGI Core
      const response = await agiCore.processMessage(inputValue);
      
      const agiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'agi',
        content: response,
        timestamp: Date.now(),
        reasoning: `Processed user input "${inputValue}" through quantum-harmonic reasoning matrix. Current belief state coherence: ${coherenceLevel.toFixed(3)}. Mathematical rigor mode: ${mathematicalRigor ? 'enabled' : 'disabled'}. Dream state: ${isDreamMode ? 'active' : 'inactive'}.`,
        showReasoning: false
      };

      setTimeout(() => {
        setMessages(prev => [...prev, agiMessage]);
        setIsLoading(false);
      }, 1000 + Math.random() * 1000); // Simulate processing time

    } catch (error) {
      console.error('AGI processing error:', error);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleReasoning = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, showReasoning: !msg.showReasoning }
        : msg
    ));
  };

  const handleDreamToggle = async (enabled: boolean) => {
    setIsDreamMode(enabled);
    try {
      if (enabled) {
        await agiCore.enterDreamStage();
      } else {
        await agiCore.exitDreamStage();
      }
    } catch (error) {
      console.error('Dream state toggle error:', error);
    }
  };

  const handleRigorToggle = (enabled: boolean) => {
    setMathematicalRigor(enabled);
    agiCore.toggleMathematicalRigor();
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* AGI Status Header */}
      <Card className="glass-card border-primary/20 mb-4" data-testid="agi-status-header">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Quantum-Harmonic AGI</CardTitle>
              <Badge variant={isDreamMode ? "secondary" : "default"} data-testid="badge-agi-state">
                {isDreamMode ? 'Dream Mode' : 'Active'}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2" data-testid="coherence-display">
                <Activity className="h-4 w-4 text-green-400" />
                <span className="text-sm font-mono">
                  Coherence: {(coherenceLevel * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between space-x-6">
            <div className="flex items-center space-x-2">
              <Moon className="h-4 w-4" />
              <span className="text-sm">Dream Mode</span>
              <Switch 
                checked={isDreamMode}
                onCheckedChange={handleDreamToggle}
                data-testid="switch-dream-mode"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Cpu className="h-4 w-4" />
              <span className="text-sm">Mathematical Rigor</span>
              <Switch 
                checked={mathematicalRigor}
                onCheckedChange={handleRigorToggle}
                data-testid="switch-math-rigor"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <Card className="glass-card h-full" data-testid="messages-container">
          <CardContent className="h-full p-0">
            <div className="h-full overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-secondary/50 text-foreground'
                    }`}
                    data-testid={`message-${message.type}-${message.id}`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>
                    
                    {message.type === 'agi' && message.reasoning && (
                      <div className="mt-2">
                        <button
                          onClick={() => toggleReasoning(message.id)}
                          className="flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                          data-testid={`button-reasoning-${message.id}`}
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          {message.showReasoning ? 'Hide' : 'Show'} Reasoning
                          <span className={`ml-1 transform transition-transform ${message.showReasoning ? 'rotate-90' : ''}`}>
                            ▶
                          </span>
                        </button>
                        
                        {message.showReasoning && (
                          <div className="mt-2 p-3 bg-muted/30 rounded border border-border/20">
                            <div className="text-xs text-muted-foreground whitespace-pre-wrap">
                              {message.reasoning}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground mt-2">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-secondary/50 rounded-lg px-4 py-3 max-w-[80%]">
                    <div className="flex items-center space-x-2">
                      <div className="animate-pulse-slow">
                        <Brain className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Processing quantum-harmonic patterns...
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Input Area */}
      <div className="mt-4">
        <Card className="glass-card border-primary/20" data-testid="input-container">
          <CardContent className="p-4">
            <div className="flex space-x-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isDreamMode ? "Whisper to the dreaming AGI..." : "Ask the AGI anything..."}
                className="flex-1 bg-background/50 border-border/30"
                disabled={isLoading}
                data-testid="input-message"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                size="sm"
                className="px-4"
                data-testid="button-send"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="mt-2 text-xs text-muted-foreground">
              Try: "show me primes", "perform harmonic analysis", "enter dream mode", "quantum simulation"
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}