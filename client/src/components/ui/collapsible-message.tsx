import { useState } from 'react';
import { Button } from './button';
import { ChevronDown, ChevronUp, Copy, FileText, RotateCcw } from 'lucide-react';
import { Badge } from './badge';
import { ScrollArea } from './scroll-area';
import { cn } from '@/lib/utils';

interface CollapsibleMessageProps {
  content: string;
  maxLength?: number;
  showMetadata?: boolean;
  title?: string;
  type?: 'input' | 'output' | 'system' | 'info';
  className?: string;
  wordCount?: number;
  characterCount?: number;
  fileInfo?: {
    name?: string;
    size?: number;
    type?: string;
  };
}

export function CollapsibleMessage({
  content,
  maxLength = 500,
  showMetadata = true,
  title,
  type = 'output',
  className,
  wordCount,
  characterCount,
  fileInfo
}: CollapsibleMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  const shouldCollapse = content.length > maxLength;
  const displayContent = shouldCollapse && !isExpanded 
    ? content.slice(0, maxLength) + '...' 
    : content;
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'input':
        return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950';
      case 'output':
        return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950';
      case 'system':
        return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950';
      case 'info':
        return 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950';
      default:
        return 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900';
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'input':
        return '📥';
      case 'output':
        return '📤';
      case 'system':
        return '⚙️';
      case 'info':
        return 'ℹ️';
      default:
        return '💬';
    }
  };

  return (
    <div 
      className={cn(
        'rounded-lg border p-4 transition-all duration-200',
        getTypeStyles(),
        className
      )}
      data-testid={`collapsible-message-${type}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getTypeIcon()}</span>
          {title && (
            <h3 className="font-semibold text-sm">{title}</h3>
          )}
          {showMetadata && (
            <div className="flex gap-2">
              {characterCount && (
                <Badge variant="outline" className="text-xs">
                  {characterCount.toLocaleString()} chars
                </Badge>
              )}
              {wordCount && (
                <Badge variant="outline" className="text-xs">
                  {wordCount.toLocaleString()} words
                </Badge>
              )}
              {fileInfo && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {fileInfo.name}
                  {fileInfo.size && ` (${(fileInfo.size / 1024).toFixed(1)}KB)`}
                </Badge>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className="h-8 px-2"
            data-testid="button-copy-content"
          >
            {isCopied ? (
              <RotateCcw className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
          
          {shouldCollapse && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 px-2"
              data-testid="button-toggle-expand"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  <span className="text-xs">Collapse</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  <span className="text-xs">Expand</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative">
        {isExpanded || !shouldCollapse ? (
          <ScrollArea className="max-h-96 w-full">
            <pre 
              className="whitespace-pre-wrap text-sm font-mono leading-relaxed text-foreground"
              data-testid="message-content-expanded"
            >
              {content}
            </pre>
          </ScrollArea>
        ) : (
          <div>
            <pre 
              className="whitespace-pre-wrap text-sm font-mono leading-relaxed text-foreground"
              data-testid="message-content-collapsed"
            >
              {displayContent}
            </pre>
            {shouldCollapse && (
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
            )}
          </div>
        )}
      </div>

      {/* Footer with additional info */}
      {shouldCollapse && (
        <div className="mt-3 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {isExpanded 
                ? `Showing full content (${content.length.toLocaleString()} characters)`
                : `Showing preview (${maxLength} of ${content.length.toLocaleString()} characters)`
              }
            </span>
            {!isExpanded && (
              <span className="text-primary cursor-pointer" onClick={() => setIsExpanded(true)}>
                Click to expand →
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}