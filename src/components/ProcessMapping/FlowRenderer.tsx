import React, { useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Edge, 
  Node, 
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { StartNode, EndNode, TaskNode, DecisionNode, InputOutputNode } from './NodeTypes';

const nodeTypes = {
  start: StartNode,
  end: EndNode,
  task: TaskNode,
  process: TaskNode, // fallback
  default: TaskNode, // general
  decision: DecisionNode,
  io: InputOutputNode
};

interface FlowRendererProps {
  nodes: any[];
  edges: any[];
  onNodesChange?: any;
  onEdgesChange?: any;
  onConnect?: any;
  onNodeClick?: any;
  onPaneClick?: any;
  onDragOver?: any;
  onDrop?: any;
  fitView?: boolean;
  interactive?: boolean;
  children?: React.ReactNode;
}

const FlowRenderer: React.FC<FlowRendererProps> = ({ 
  nodes, 
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onPaneClick,
  onDragOver,
  onDrop,
  fitView = true,
  interactive = true,
  children
}) => {
  // Memoize nodeTypes to prevent unnecessary re-renders
  const memoizedNodeTypes = useMemo(() => nodeTypes, []);

  // Defensive mapping to ensure React Flow doesn't crash on invalid data
  const processedNodes = useMemo(() => {
    if (!Array.isArray(nodes)) return [];
    return nodes.map(n => {
      // Ensure node has a stable position object
      const safePosition = n.position && typeof n.position.x === 'number' && typeof n.position.y === 'number' 
        ? n.position 
        : { x: Number(n.position?.x || 0), y: Number(n.position?.y || 0) };

      return {
        ...n,
        id: String(n.id),
        position: safePosition,
        draggable: interactive,
        selectable: interactive,
        connectable: interactive,
      };
    });
  }, [nodes, interactive]);

  const processedEdges = useMemo(() => {
    if (!Array.isArray(edges)) return [];
    return edges.map(e => ({
      ...e,
      id: String(e.id || `edge_${e.source}_${e.target}`),
      source: String(e.source),
      target: String(e.target),
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
      style: { stroke: '#94a3b8', strokeWidth: 2, ...e.style }
    }));
  }, [edges]);

  return (
    <div 
      className="w-full h-full min-h-[600px] border border-slate-200 rounded-2xl overflow-hidden relative bg-slate-50"
      id="flow-renderer-container"
    >
      <ReactFlow
        nodes={processedNodes}
        edges={processedEdges}
        nodeTypes={memoizedNodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        fitView={fitView}
        nodesDraggable={interactive}
        nodesConnectable={interactive}
        elementsSelectable={interactive}
        snapToGrid
        snapGrid={[15, 15]}
      >
        <Background />
        <Controls />
        {children}
      </ReactFlow>
    </div>
  );
};

export default FlowRenderer;
