import { useState, useEffect, useRef } from 'react';
import { Command, Search, Upload, Settings, Brain, Zap, Database, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CommandPaletteItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (path: string) => void;
}

export function CommandPalette({ isOpen, onClose, onNavigate }: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Command palette items
  const commands: CommandPaletteItem[] = [
    {
      id: 'upload-file',
      title: 'Upload File',
      description: 'Upload and process a new file',
      icon: Upload,
      category: 'Files',
      action: () => {
        onNavigate?.('/');
        onClose();
        // Focus file input after navigation
        setTimeout(() => {
          const fileInput = document.querySelector('[data-testid="input-file-upload"]') as HTMLInputElement;
          fileInput?.click();
        }, 100);
      }
    },
    {
      id: 'wsm-metrics',
      title: 'WSM Metrics',
      description: 'View harmonic processing metrics',
      icon: Brain,
      category: 'WSM',
      action: () => {
        onNavigate?.('/wsm');
        onClose();
      }
    },
    {
      id: 'system-components',
      title: 'System Components',
      description: 'Monitor component health status',
      icon: Settings,
      category: 'System',
      action: () => {
        onNavigate?.('/components');
        onClose();
      }
    },
    {
      id: 'vm-platform',
      title: 'VM Platform',
      description: 'Manage virtual machine instances',
      icon: Database,
      category: 'Infrastructure',
      action: () => {
        onNavigate?.('/vm');
        onClose();
      }
    },
    {
      id: 'agent-management',
      title: 'Agent Management',
      description: 'Control autonomous agents',
      icon: Users,
      category: 'Agents',
      action: () => {
        onNavigate?.('/agents');
        onClose();
      }
    },
    {
      id: 'quantum-processing',
      title: 'Quantum Processing',
      description: 'Access quantum-harmonic capabilities',
      icon: Zap,
      category: 'Advanced',
      action: () => {
        onNavigate?.('/quantum');
        onClose();
      }
    }
  ];

  // Filter commands based on search query
  const filteredCommands = commands.filter(cmd =>
    cmd.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cmd.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cmd.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 command-palette-backdrop"
      onClick={onClose}
      data-testid="modal-command-palette"
    >
      <div 
        className="relative w-full max-w-lg command-palette-content rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="content-command-palette"
      >
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search commands or navigate to..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-lg outline-none border-none bg-transparent focus:ring-0"
              data-testid="input-command-search"
            />
          </div>
        </div>

        {/* Results */}
        <ul 
          ref={listRef}
          className="p-2 max-h-80 overflow-y-auto"
          data-testid="list-command-results"
        >
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, index) => {
              const Icon = cmd.icon;
              return (
                <li
                  key={cmd.id}
                  className={`px-3 py-3 rounded-md cursor-pointer transition-all ${
                    index === selectedIndex
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-foreground hover:bg-muted'
                  }`}
                  onClick={() => cmd.action()}
                  data-testid={`item-command-${cmd.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="icon-wrapper p-2 rounded-md">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{cmd.title}</div>
                      <div className="text-sm text-muted-foreground">{cmd.description}</div>
                    </div>
                    <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {cmd.category}
                    </div>
                  </div>
                </li>
              );
            })
          ) : (
            <li className="px-3 py-6 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <div>No commands found</div>
              <div className="text-sm">Try a different search term</div>
            </li>
          )}
        </ul>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background rounded text-xs font-mono">↑↓</kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background rounded text-xs font-mono">↵</kbd>
                <span>Select</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-background rounded text-xs font-mono">esc</kbd>
              <span>Close</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Command Palette Button Component
interface CommandPaletteButtonProps {
  onClick: () => void;
}

export function CommandPaletteButton({ onClick }: CommandPaletteButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      data-testid="button-command-palette"
    >
      <Command className="h-4 w-4" />
      <span className="hidden md:inline">Command Palette</span>
      <kbd className="hidden md:inline text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
        ⌘K
      </kbd>
    </Button>
  );
}