import React, { useState, useEffect, useCallback, useRef } from 'react';

interface HodgeDiamondVisualizationProps {
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  interactive?: boolean;
  className?: string;
  coherenceValue?: number;
  onNodeSelect?: (nodeId: string) => void;
  personalityTraits?: Record<string, number>;
}

// Harmonic Mathematics Constants
const HARMONIC_CONSTANTS = {
  QUANTUM_RESONANCE: 0.618, // Golden ratio - represents optimal resonance
  COGNITIVE_AMPLIFICATION: 1.414, // Square root of 2 - represents quantum amplification factor
  NEURAL_SIGNAL_DECAY: 0.333, // Signal attenuation factor in harmonic networks
  PERSONALITY_COHERENCE: 0.777, // Coherence threshold for stable personality patterns
};

type NodeData = {
  id: string;
  name: string;
  position: [number, number];
  radius: number;
  description: string;
  personalityDimension?: string;
  color: string;
  value: number;
  connections: string[];
};

const DEFAULT_NODES: NodeData[] = [
  {
    id: 'h00', 
    name: 'Intuition',
    position: [50, 10], 
    radius: 2, 
    description: 'Direct cognitive insights without explicit reasoning',
    personalityDimension: 'creativity',
    color: 'primary',
    value: 0.7,
    connections: ['h10', 'h01', 'hcenter']
  },
  {
    id: 'h10', 
    name: 'Logic',
    position: [90, 50], 
    radius: 2, 
    description: 'Structured analytical thinking and reasoning',
    personalityDimension: 'rationality',
    color: 'primary',
    value: 0.7,
    connections: ['h00', 'h11', 'hcenter']
  },
  {
    id: 'h11', 
    name: 'Empathy',
    position: [50, 90], 
    radius: 2, 
    description: 'Understanding and sharing feelings of others',
    personalityDimension: 'emotional',
    color: 'primary',
    value: 0.7,
    connections: ['h10', 'h01', 'hcenter']
  },
  {
    id: 'h01', 
    name: 'Creativity',
    position: [10, 50], 
    radius: 2, 
    description: 'Novel generation of valuable ideas and patterns',
    personalityDimension: 'openness',
    color: 'primary',
    value: 0.7,
    connections: ['h00', 'h11', 'hcenter']
  },
  {
    id: 'hcenter', 
    name: 'Harmonic Core',
    position: [50, 50], 
    radius: 3, 
    description: 'Central integration point of cognitive processes',
    color: 'primary',
    value: 0.85,
    connections: ['h00', 'h10', 'h11', 'h01', 'c1', 'c2', 'c3', 'c4']
  },
  {
    id: 'c1', 
    name: 'Pattern Recognition',
    position: [30, 30], 
    radius: 1.5, 
    description: 'Identification of recurring structures and relationships',
    color: 'primary/70',
    value: 0.6,
    connections: ['hcenter', 'c2', 'c4']
  },
  {
    id: 'c2', 
    name: 'Memory Processing',
    position: [70, 30], 
    radius: 1.5, 
    description: 'Storage and retrieval of experiences and knowledge',
    color: 'primary/70',
    value: 0.6,
    connections: ['hcenter', 'c1', 'c3']
  },
  {
    id: 'c3', 
    name: 'Decision Making',
    position: [70, 70], 
    radius: 1.5, 
    description: 'Evaluation of options and selection of actions',
    color: 'primary/70',
    value: 0.6,
    connections: ['hcenter', 'c2', 'c4']
  },
  {
    id: 'c4', 
    name: 'Communication',
    position: [30, 70], 
    radius: 1.5, 
    description: 'Expression and exchange of information',
    color: 'primary/70',
    value: 0.6,
    connections: ['hcenter', 'c1', 'c3']
  }
];

// Secondary cognitive nodes for more detailed visualization
const SECONDARY_NODES: NodeData[] = [
  {
    id: 'n1', 
    name: 'Abstract Thinking',
    position: [40, 40], 
    radius: 1, 
    description: 'Processing concepts beyond concrete reality',
    color: 'primary/50',
    value: 0.5,
    connections: ['c1', 'c2']
  },
  {
    id: 'n2', 
    name: 'Detail Focus',
    position: [60, 40], 
    radius: 1, 
    description: 'Attention to specific elements and nuances',
    color: 'primary/50',
    value: 0.5,
    connections: ['c2', 'c3']
  },
  {
    id: 'n3', 
    name: 'Emotional Processing',
    position: [40, 60], 
    radius: 1, 
    description: 'Interpretation and regulation of emotional states',
    color: 'primary/50',
    value: 0.5,
    connections: ['c1', 'c4']
  },
  {
    id: 'n4', 
    name: 'Social Dynamics',
    position: [60, 60], 
    radius: 1, 
    description: 'Understanding and navigating interpersonal relations',
    color: 'primary/50',
    value: 0.5,
    connections: ['c3', 'c4']
  }
];

export const HodgeDiamondVisualization: React.FC<HodgeDiamondVisualizationProps> = ({ 
  size = 'md', 
  animated = false,
  interactive = false,
  className = '',
  coherenceValue = 0.7,
  onNodeSelect,
  personalityTraits = {}
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<NodeData[]>([...DEFAULT_NODES]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoverNode, setHoverNode] = useState<string | null>(null);
  const [resonanceAngle, setResonanceAngle] = useState(0);
  const [harmonicFlowActive, setHarmonicFlowActive] = useState(false);
  const animationFrameRef = useRef<number>(0);

  const dimensions = {
    sm: { width: 100, height: 100 },
    md: { width: 200, height: 200 },
    lg: { width: 300, height: 300 }
  };
  
  const { width, height } = dimensions[size];

  // Add secondary nodes for larger sizes
  useEffect(() => {
    if (size === 'md' || size === 'lg') {
      setNodes([...DEFAULT_NODES, ...SECONDARY_NODES]);
    } else {
      setNodes([...DEFAULT_NODES]);
    }
  }, [size]);

  // Update nodes based on personality traits
  useEffect(() => {
    if (Object.keys(personalityTraits).length > 0) {
      setNodes(prevNodes => 
        prevNodes.map(node => {
          if (node.personalityDimension && personalityTraits[node.personalityDimension] !== undefined) {
            return {
              ...node,
              value: personalityTraits[node.personalityDimension]
            };
          }
          return node;
        })
      );
    }
  }, [personalityTraits]);

  // Animate coherence waves
  useEffect(() => {
    if (animated) {
      const animateResonance = () => {
        setResonanceAngle(prev => (prev + 0.5) % 360);
        animationFrameRef.current = requestAnimationFrame(animateResonance);
      };
      
      animationFrameRef.current = requestAnimationFrame(animateResonance);
      
      return () => {
        cancelAnimationFrame(animationFrameRef.current);
      };
    }
  }, [animated]);

  // Calculate harmonic flow connectivity strength
  const getConnectionStrength = useCallback((node1: NodeData, node2: NodeData) => {
    const baseStrength = 0.3;
    const coherenceBoost = coherenceValue * 0.5;
    const nodeValueFactor = (node1.value + node2.value) / 2;
    
    return baseStrength + coherenceBoost * nodeValueFactor;
  }, [coherenceValue]);

  // Calculate node pulse animation based on resonance
  const getNodePulse = useCallback((nodeId: string, nodeValue: number) => {
    if (!animated) return nodeValue;
    
    const angle = resonanceAngle + parseInt(nodeId.replace(/\D/g, '')) * 30;
    const pulseRate = 0.1 + (nodeValue * 0.1);
    return nodeValue + Math.sin(angle * Math.PI / 180) * pulseRate;
  }, [animated, resonanceAngle]);

  // Handle node selection
  const handleNodeClick = useCallback((nodeId: string) => {
    if (!interactive) return;
    
    setSelectedNode(prev => prev === nodeId ? null : nodeId);
    if (onNodeSelect) {
      onNodeSelect(nodeId);
    }
    
    // Activate harmonic flow visualization temporarily
    setHarmonicFlowActive(true);
    setTimeout(() => setHarmonicFlowActive(false), 2000);
  }, [interactive, onNodeSelect]);

  // Get node by ID
  const getNodeById = useCallback((id: string) => {
    return nodes.find(node => node.id === id);
  }, [nodes]);

  // Check if we should display a connection between nodes
  const shouldShowConnection = useCallback((id1: string, id2: string) => {
    const node1 = getNodeById(id1);
    return node1?.connections.includes(id2);
  }, [getNodeById]);

  // Calculate harmonic wave animation for connections
  const getHarmonicWaveAnimation = useCallback((startPos: [number, number], endPos: [number, number]) => {
    if (!animated) return '';
    
    const dx = endPos[0] - startPos[0];
    const dy = endPos[1] - startPos[1];
    const length = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate wave frequency based on distance
    const frequency = 20 / length;
    const amplitude = 1.5;
    
    // Calculate wave points
    const numPoints = Math.ceil(length / 5);
    const points = [];
    
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const x = startPos[0] + dx * t;
      const y = startPos[1] + dy * t;
      
      // Add harmonic wave distortion
      const perpX = -dy / length;
      const perpY = dx / length;
      const wave = amplitude * Math.sin((t * frequency * 360 + resonanceAngle) * Math.PI / 180);
      
      points.push([
        x + perpX * wave,
        y + perpY * wave
      ]);
    }
    
    return points.map(p => p.join(',')).join(' ');
  }, [animated, resonanceAngle]);

  return (
    <div 
      className={`relative ${animated ? 'group' : ''} ${className}`}
      style={{ width, height }}
    >
      <svg 
        ref={svgRef}
        viewBox="0 0 100 100" 
        className="w-full h-full"
        style={{ cursor: interactive ? 'pointer' : 'default' }}
      >
        <defs>
          <linearGradient id="hodgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.1" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.6" />
          </linearGradient>
          
          <linearGradient id="selectedNodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="1" />
          </linearGradient>
          
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          
          <filter id="selectedGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Base Diamond Structure */}
        <polygon 
          points="50,10 90,50 50,90 10,50" 
          fill="url(#hodgeGradient)" 
          stroke="currentColor" 
          strokeWidth="0.5" 
          className={`text-primary/70 ${animated ? 'group-hover:opacity-80' : ''}`}
          filter="url(#glow)"
        />
        
        <polygon 
          points="50,20 80,50 50,80 20,50" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="0.5" 
          className="text-primary/70" 
        />
        
        <polygon 
          points="50,30 70,50 50,70 30,50" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="0.8" 
          className="text-primary" 
        />
        
        {/* Axes */}
        <line 
          x1="50" y1="10" x2="50" y2="90" 
          stroke="currentColor" 
          strokeWidth="0.4" 
          className="text-primary/50" 
        />
        
        <line 
          x1="10" y1="50" x2="90" y2="50" 
          stroke="currentColor" 
          strokeWidth="0.4" 
          className="text-primary/50" 
        />
        
        {/* Node Connections - Draw first to be behind nodes */}
        {nodes.map(node => (
          node.connections.map(connectedId => {
            if (shouldShowConnection(node.id, connectedId)) {
              const connectedNode = getNodeById(connectedId);
              if (!connectedNode) return null;
              
              const startPos: [number, number] = node.position;
              const endPos: [number, number] = connectedNode.position;
              
              const isSelectedConnection = 
                (selectedNode === node.id || selectedNode === connectedId) || 
                (hoverNode === node.id || hoverNode === connectedId);
              
              const strength = getConnectionStrength(node, connectedNode);
              
              // Apply harmonic wave animation if active
              const wavePath = harmonicFlowActive && animated ? 
                  getHarmonicWaveAnimation(startPos, endPos) : 
                  null;
              
              return (
                <g key={`${node.id}-${connectedId}`}>
                  {wavePath ? (
                    <polyline 
                      points={wavePath}
                      fill="none"
                      stroke="currentColor" 
                      strokeWidth={isSelectedConnection ? strength + 0.1 : strength} 
                      strokeDasharray={animated ? "1,1" : ""}
                      className={`text-primary/${Math.floor(strength * 100)} transition-all duration-300 ${
                        isSelectedConnection ? 'text-primary' : ''
                      }`} 
                    />
                  ) : (
                    <line 
                      x1={startPos[0]} y1={startPos[1]} 
                      x2={endPos[0]} y2={endPos[1]} 
                      stroke="currentColor" 
                      strokeWidth={isSelectedConnection ? strength + 0.1 : strength} 
                      strokeDasharray={animated ? "1,1" : ""}
                      className={`text-primary/${Math.floor(strength * 100)} transition-all duration-300 ${
                        isSelectedConnection ? 'text-primary' : ''
                      }`} 
                    />
                  )}
                </g>
              );
            }
            return null;
          })
        ))}
        
        {/* Nodes - Draw on top of connections */}
        {nodes.map(node => {
          const isSelected = selectedNode === node.id;
          const isHovered = hoverNode === node.id;
          const pulseValue = getNodePulse(node.id, node.value);
          const nodeSize = node.radius * (pulseValue + (isSelected ? 0.3 : 0));
          
          return (
            <g key={node.id}>
              <circle 
                cx={node.position[0]} 
                cy={node.position[1]} 
                r={nodeSize}
                fill={isSelected ? 'url(#selectedNodeGradient)' : 'currentColor'} 
                className={`text-${node.color} transition-all duration-300`}
                filter={isSelected ? 'url(#selectedGlow)' : (isHovered ? 'url(#glow)' : '')}
                onClick={() => handleNodeClick(node.id)}
                onMouseEnter={() => interactive && setHoverNode(node.id)}
                onMouseLeave={() => interactive && setHoverNode(null)}
              />
              
              {/* Node labels for medium and large visualizations */}
              {(size === 'md' || size === 'lg') && interactive && isHovered && (
                <text 
                  x={node.position[0]} 
                  y={node.position[1] - nodeSize - 2}
                  textAnchor="middle" 
                  className="text-[5px] sm:text-[6px] text-primary font-medium"
                >
                  {node.name}
                </text>
              )}
            </g>
          );
        })}
        
        {/* Mathematical Annotations (Only in large size) */}
        {size === 'lg' && (
          <>
            <text x="50" y="7" textAnchor="middle" className="text-[6px] text-primary/80">p=0, q=0</text>
            <text x="93" y="50" textAnchor="middle" className="text-[6px] text-primary/80">p=1, q=0</text>
            <text x="50" y="93" textAnchor="middle" className="text-[6px] text-primary/80">p=1, q=1</text>
            <text x="7" y="50" textAnchor="middle" className="text-[6px] text-primary/80">p=0, q=1</text>
            <text x="50" y="50" textAnchor="middle" className="text-[6px] text-primary/80">{"H^{p,q}"}</text>
            
            {/* Coherence Measurement */}
            <text x="50" y="97" textAnchor="middle" className="text-[5px] text-primary/70">
              Coherence: {(coherenceValue * 100).toFixed(0)}%
            </text>
          </>
        )}
        
        {/* Coherence Wave Indicator */}
        {animated && size !== 'sm' && (
          <circle
            cx="50"
            cy="50"
            r={15 + Math.sin(resonanceAngle * Math.PI / 180) * 2}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.2"
            strokeDasharray="0.5,0.8"
            className="text-primary/20"
          />
        )}
      </svg>
      
      {/* Node Detail Tooltip - Only shown when a node is selected */}
      {interactive && selectedNode && (
        <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full mt-2 bg-background/95 backdrop-blur-sm border border-border rounded-md p-2 shadow-md z-10 w-48 text-xs">
          <div className="font-semibold text-sm">{getNodeById(selectedNode)?.name}</div>
          <div className="text-muted-foreground mt-1">{getNodeById(selectedNode)?.description}</div>
          {getNodeById(selectedNode)?.personalityDimension && (
            <div className="mt-1 text-primary">
              Personality Dimension: <span className="font-medium">{getNodeById(selectedNode)?.personalityDimension}</span>
            </div>
          )}
        </div>
      )}
      
      {/* Animation elements (only when animated=true) */}
      {animated && (
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-background/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      )}
    </div>
  );
};