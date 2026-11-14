import React, { useMemo } from 'react';
import FlowRenderer from '../../../components/ProcessMapping/FlowRenderer';

interface SOPFlowchartProps {
  sopId: number;
  steps: any[];
  flowchartData?: string | null;
}

export const SOPFlowchart: React.FC<SOPFlowchartProps> = ({ sopId, steps, flowchartData }) => {
  const parsedData = useMemo(() => {
    if (flowchartData) {
      try {
        const parsed = JSON.parse(flowchartData);
        if (parsed.nodes && parsed.nodes.length > 0) {
          return parsed;
        }
      } catch (e) {
        // Fallback to generated
      }
    }
    return null;
  }, [flowchartData]);

  const nodes = useMemo(() => {
    if (parsedData?.nodes) {
      return parsedData.nodes;
    }
    const list: any[] = [
      { id: 'start', type: 'input', data: { label: 'Start Process' }, position: { x: 250, y: 0 }, style: { background: '#10b981', color: '#fff', borderRadius: '8px', fontWeight: 'bold' } }
    ];
    let y = 100;
    steps?.forEach((step, idx) => {
      list.push({
        id: `step-${step.id || idx}`,
        data: { label: `Step ${step.step_number}: ${(step.step_description || '').slice(0, 30)}...` },
        position: { x: 250, y },
        style: { background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', width: 220, fontSize: '12px' }
      });
      y += 100;
    });
    list.push({
      id: 'end',
      type: 'output',
      data: { label: 'Process Completed' },
      position: { x: 250, y },
      style: { background: '#64748b', color: '#fff', borderRadius: '8px', fontWeight: 'bold' }
    });
    return list;
  }, [steps, parsedData]);

  const edges = useMemo(() => {
    if (parsedData?.edges) {
      return parsedData.edges;
    }
    const list: any[] = [];
    if (!steps || steps.length === 0) {
      list.push({ id: 'e-start-end', source: 'start', target: 'end', animated: true });
      return list;
    }
    list.push({ id: 'e-start-0', source: 'start', target: `step-${steps[0].id || 0}`, animated: true });
    for (let i = 0; i < steps.length - 1; i++) {
      list.push({
        id: `e-${i}-${i+1}`,
        source: `step-${steps[i].id || i}`,
        target: `step-${steps[i+1].id || (i+1)}`,
        animated: true
      });
    }
    list.push({
      id: `e-${steps.length-1}-end`,
      source: `step-${steps[steps.length-1].id || (steps.length-1)}`,
      target: 'end',
      animated: true
    });
    return list;
  }, [steps, parsedData]);

  return (
    <div className="h-64 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
      <FlowRenderer nodes={nodes} edges={edges} interactive={false} fitView={true} />
    </div>
  );
};

export default SOPFlowchart;
