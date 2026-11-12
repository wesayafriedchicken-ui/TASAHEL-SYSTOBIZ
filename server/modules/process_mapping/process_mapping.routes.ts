import { Router } from 'express';
import { pool } from '../../db/schema.js';
import { logAction } from '../../services/auditLogger.js';

const router = Router();

// Get all maps
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT pm.*, s.title as sop_title 
      FROM process_maps pm 
      LEFT JOIN sops s ON pm.sop_id = s.id 
      ORDER BY pm.created_at DESC
    `);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

const getMapWithReconciliation = async (mapId: number, client: any) => {
  const mapResult = await client.query(`
    SELECT pm.*, s.title as sop_title 
    FROM process_maps pm
    LEFT JOIN sops s ON pm.sop_id = s.id
    WHERE pm.id = $1
  `, [mapId]);
  if (mapResult.rows.length === 0) return null;
  const map = mapResult.rows[0];

  const existingNodesResult = await client.query('SELECT * FROM process_nodes WHERE map_id = $1', [mapId]);
  
  // Auto-reconciliation logic
  if (existingNodesResult.rows.length === 0 && map.sop_id) {
    // 1. Check if the SOP has existing flowchart_data (the original JSON field)
    const sopRes = await client.query('SELECT flowchart_data FROM sops WHERE id = $1', [map.sop_id]);
    const flowchartDataRaw = sopRes.rows[0]?.flowchart_data;
    
    if (flowchartDataRaw) {
      try {
        const { nodes: legacyNodes, edges: legacyEdges } = JSON.parse(flowchartDataRaw);
        
        if (Array.isArray(legacyNodes) && legacyNodes.length > 0) {
          const nodeMap: Record<string, number> = {};
          
          for (const node of legacyNodes) {
            const nodeRes = await client.query(
              'INSERT INTO process_nodes (map_id, type, label, position_x, position_y, data) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
              [
                mapId, 
                node.type || 'process', 
                node.data?.label || node.label || 'Node', 
                node.position?.x || 0, 
                node.position?.y || 0, 
                JSON.stringify(node.data || {})
              ]
            );
            nodeMap[node.id] = nodeRes.rows[0].id;
          }
          
          if (Array.isArray(legacyEdges)) {
            for (const edge of legacyEdges) {
              const sourceId = nodeMap[edge.source];
              const targetId = nodeMap[edge.target];
              if (sourceId && targetId) {
                await client.query(
                  'INSERT INTO process_edges (map_id, source_node, target_node, source_handle, target_handle, label) VALUES ($1, $2, $3, $4, $5, $6)',
                  [mapId, sourceId, targetId, edge.sourceHandle || null, edge.targetHandle || null, edge.label || null]
                );
              }
            }
          }
          
          // Re-fetch after seeding
          const nodesResult = await client.query('SELECT * FROM process_nodes WHERE map_id = $1', [mapId]);
          const edgesResult = await client.query('SELECT * FROM process_edges WHERE map_id = $1', [mapId]);
          return { ...map, nodes: nodesResult.rows, edges: edgesResult.rows };
        }
      } catch (e) {
        console.error("Failed to parse flowchart_data from SOP during reconciliation:", e);
        throw e; // Re-throw to handle in route (especially if in transaction)
      }
    }

    // 2. Fallback: Generate from sop_steps if flowchart_data was empty/invalid
    const stepsResult = await client.query('SELECT * FROM sop_steps WHERE sop_id = $1 ORDER BY step_number ASC', [map.sop_id]);
    const steps = stepsResult.rows;
    
    if (steps.length > 0) {
      let y = 100;
      const nodes = [];
      const startNode = await client.query(
        'INSERT INTO process_nodes (map_id, type, label, position_x, position_y, data) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [mapId, 'start', 'Start', 250, y, JSON.stringify({ label: 'Start' })]
      );
      nodes.push(startNode.rows[0].id);
      y += 100;
      for (const step of steps) {
        const stepNode = await client.query(
          'INSERT INTO process_nodes (map_id, type, label, position_x, position_y, data) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
          [mapId, 'sop_step', `Step ${step.step_number}: ${step.step_description.substring(0, 30)}...`, 250, y, JSON.stringify({ label: step.step_description, sop_step_id: step.id, step_number: step.step_number })]
        );
        nodes.push(stepNode.rows[0].id);
        y += 100;
      }
      const endNode = await client.query(
        'INSERT INTO process_nodes (map_id, type, label, position_x, position_y, data) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [mapId, 'end', 'End', 250, y, JSON.stringify({ label: 'End' })]
      );
      nodes.push(endNode.rows[0].id);
      for (let i = 0; i < nodes.length - 1; i++) {
        await client.query(
          'INSERT INTO process_edges (map_id, source_node, target_node) VALUES ($1, $2, $3)',
          [mapId, nodes[i], nodes[i+1]]
        );
      }
    }
  } else if (existingNodesResult.rows.length > 0 && map.sop_id) {
    // 3. Keep Existing check for newly added steps from SOP
    const stepsResult = await client.query('SELECT * FROM sop_steps WHERE sop_id = $1 ORDER BY step_number ASC', [map.sop_id]);
    const existingStepNodes = await client.query(
      "SELECT (data->>'sop_step_id')::int as step_id FROM process_nodes WHERE map_id = $1 AND data->>'sop_step_id' IS NOT NULL", 
      [mapId]
    );
    const existingStepIds = new Set(existingStepNodes.rows.map((r: any) => r.step_id));
    let maxYResult = await client.query('SELECT MAX(position_y) as max_y FROM process_nodes WHERE map_id = $1', [mapId]);
    let maxY = (maxYResult.rows[0].max_y || 0) + 100;
    for (const step of stepsResult.rows) {
      if (!existingStepIds.has(step.id)) {
        await client.query(
          'INSERT INTO process_nodes (map_id, type, label, position_x, position_y, data) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
          [mapId, 'sop_step', `Step ${step.step_number}: ${step.step_description.substring(0, 30)}...`, 250, maxY, JSON.stringify({ label: step.step_description, sop_step_id: step.id, step_number: step.step_number })]
        );
        maxY += 100;
      }
    }
  }

  const nodes = await client.query('SELECT * FROM process_nodes WHERE map_id = $1', [mapId]);
  const edges = await client.query('SELECT * FROM process_edges WHERE map_id = $1', [mapId]);
  
  return { ...map, nodes: nodes.rows, edges: edges.rows };
};

// Get map by SOP ID
router.get('/sop/:sopId', async (req, res) => {
  const { sopId } = req.params;
  const client = await pool.connect();
  try {
    const mapResult = await client.query('SELECT id FROM process_maps WHERE sop_id = $1 LIMIT 1', [sopId]);
    if (mapResult.rows.length === 0) {
      return res.status(404).json({ error: 'Map not found for this SOP' });
    }
    const map = await getMapWithReconciliation(mapResult.rows[0].id, client);
    res.json(map);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Get a single map with nodes and edges
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (!id || id === 'undefined' || isNaN(parseInt(id))) {
    return res.status(400).json({ error: 'Invalid Map ID' });
  }
  
  const mapId = parseInt(id);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const map = await getMapWithReconciliation(mapId, client);
    
    if (!map) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Map not found' });
    }
    
    await client.query('COMMIT');
    res.json(map);
  } catch (error: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Create a map
router.post('/', async (req, res) => {
  const { title, description, sop_id } = req.body;
  const sanitizedSopId = sop_id === '' || sop_id === undefined ? null : sop_id;
  try {
    const result = await pool.query(
      'INSERT INTO process_maps (title, description, sop_id) VALUES ($1, $2, $3) RETURNING *',
      [title, description, sanitizedSopId]
    );
    
    const authUserId = parseInt(req.headers['x-user-id'] as string) || 1;
    await logAction(authUserId, 'CREATE', 'Process Map', result.rows[0].id, { title });

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update map nodes and edges
router.post('/:id/save', async (req, res) => {
  const { id } = req.params;
  if (!id || id === 'undefined' || isNaN(parseInt(id))) {
    return res.status(400).json({ error: 'Invalid Map ID' });
  }
  const mapId = parseInt(id);
  const { nodes, edges, title, description } = req.body;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 0. Update Map Identity if provided
    if (title || description) {
      await client.query(
        'UPDATE process_maps SET title = COALESCE($1, title), description = COALESCE($2, description), updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        [title, description, mapId]
      );
    }
    
    // 1. Get existing map info to see if we have a linked SOP
    const mapResult = await client.query('SELECT sop_id FROM process_maps WHERE id = $1', [mapId]);
    const sopId = mapResult.rows[0]?.sop_id;

    // 2. Identify deleted SOP steps (if they were nodes before but missing in current nodes list)
    if (sopId) {
      const currentSopStepNodesCount = nodes.filter((n: any) => n.data?.sop_step_id).length;
      const currentSopStepNodes = nodes.filter((n: any) => n.data?.sop_step_id).map((n: any) => parseInt(n.data.sop_step_id));
      
      const dbSopStepNodesRes = await client.query(
        "SELECT (data->>'sop_step_id')::int as step_id FROM process_nodes WHERE map_id = $1 AND data->>'sop_step_id' IS NOT NULL",
        [mapId]
      );
      const dbSopStepIds = dbSopStepNodesRes.rows.map(r => r.step_id);
      
      const deletedStepIds = dbSopStepIds.filter(sid => !currentSopStepNodes.includes(sid));
      
      for (const sid of deletedStepIds) {
        // Only delete from SOP if there are still steps left (safety check)
        // or if the user explicitly intended to delete it.
        await client.query('DELETE FROM sop_steps WHERE id = $1', [sid]);
      }
    }

    // 3. Delete and recreate map layout
    await client.query('DELETE FROM process_nodes WHERE map_id = $1', [mapId]);
    await client.query('DELETE FROM process_edges WHERE map_id = $1', [mapId]);
    
    const nodeMap: Record<string, number | string> = {};
    const nodesToInsert = Array.isArray(nodes) ? nodes : [];

    for (const node of nodesToInsert) {
      const label = node.data?.label || node.label || 'Untitled Node';
      const type = node.type || 'task';
      const posX = typeof node.position?.x === 'number' ? node.position.x : 0;
      const posY = typeof node.position?.y === 'number' ? node.position.y : 0;
      const nodeData = JSON.stringify(node.data || {});

      const nodeResult = await client.query(
        'INSERT INTO process_nodes (map_id, type, label, position_x, position_y, data) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [mapId, type, label, posX, posY, nodeData]
      );
      const internalId = nodeResult.rows[0].id;
      nodeMap[node.id] = internalId;
    }
    
    const edgesToInsert = Array.isArray(edges) ? edges : [];
    for (const edge of edgesToInsert) {
      const sourceId = nodeMap[edge.source];
      const targetId = nodeMap[edge.target];
      if (sourceId && targetId) {
        await client.query(
          'INSERT INTO process_edges (map_id, source_node, target_node, source_handle, target_handle, label) VALUES ($1, $2, $3, $4, $5, $6)',
          [mapId, sourceId, targetId, edge.sourceHandle || null, edge.targetHandle || null, edge.label || null]
        );
      }
    }

    // 4. Trace flow and update SOP step order
    if (sopId && nodesToInsert.length > 0) {
      // Also update the original flowchart_data JSON in sops table
      await client.query(
        'UPDATE sops SET flowchart_data = $1 WHERE id = $2',
        [JSON.stringify({ nodes: nodesToInsert, edges: edgesToInsert }), sopId]
      );
      
      const startNode = nodesToInsert.find((n: any) => n.type === 'start');
      if (startNode) {
        const orderedSopStepIds: number[] = [];
        let currentNodeId = startNode.id;
        const visited = new Set();
        
        while (currentNodeId && !visited.has(currentNodeId)) {
          visited.add(currentNodeId);
          const node = nodesToInsert.find((n: any) => n.id === currentNodeId);
          if (node?.data?.sop_step_id) {
            const sid = parseInt(node.data.sop_step_id);
            orderedSopStepIds.push(sid);
            
            // Sync description back to SOP
            await client.query(
              'UPDATE sop_steps SET step_description = $1 WHERE id = $2',
              [node.data.label || 'Step', sid]
            );
          }
          const nextEdge = edgesToInsert.find((e: any) => e.source === currentNodeId);
          currentNodeId = nextEdge ? nextEdge.target : null;
        }

        // Update step numbers (order)
        for (let i = 0; i < orderedSopStepIds.length; i++) {
          await client.query(
            'UPDATE sop_steps SET step_number = $1 WHERE id = $2',
            [i + 1, orderedSopStepIds[i]]
          );
        }
      }
    }
    
    await client.query('COMMIT');
    
    const authUserId = parseInt(req.headers['x-user-id'] as string) || 1;
    await logAction(authUserId, 'SAVE_LAYOUT', 'Process Map', mapId, { nodeCount: nodes.length, edgeCount: edges.length });

    res.json({ success: true });
  } catch (error: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Auto-generate map from SOP
router.post('/generate-from-sop/:sopId', async (req, res) => {
  const { sopId } = req.params;
  if (!sopId || sopId === 'undefined' || isNaN(parseInt(sopId))) {
    return res.status(400).json({ error: 'Invalid SOP ID' });
  }
  const sId = parseInt(sopId);
  try {
    // 1. Get SOP and its steps
    const sopResult = await pool.query('SELECT * FROM sops WHERE id = $1', [sId]);
    const stepsResult = await pool.query('SELECT * FROM sop_steps WHERE sop_id = $1 ORDER BY step_number ASC', [sId]);
    
    if (sopResult.rows.length === 0) return res.status(404).json({ error: 'SOP not found' });
    
    const sop = sopResult.rows[0];
    const steps = stepsResult.rows;
    
    // 2. Create the map
    const mapResult = await pool.query(
      'INSERT INTO process_maps (title, description, sop_id) VALUES ($1, $2, $3) RETURNING *',
      [`Flow: ${sop.title}`, `Generated from SOP: ${sop.title}`, sopId]
    );
    const mapId = mapResult.rows[0].id;
    
    // 3. Create nodes (Start -> Steps -> End)
    let y = 50;
    const nodes = [];
    
    // Start Node
    const startNode = await pool.query(
      'INSERT INTO process_nodes (map_id, type, label, position_x, position_y, data) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [mapId, 'start', 'Start', 250, y, JSON.stringify({ label: 'Start' })]
    );
    nodes.push(startNode.rows[0].id);
    y += 100;
    
    // Step Nodes
    for (const step of steps) {
      const stepNode = await pool.query(
        'INSERT INTO process_nodes (map_id, type, label, position_x, position_y, data) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [mapId, 'sop_step', `Step ${step.step_number}: ${step.step_description.substring(0, 30)}...`, 250, y, JSON.stringify({ label: step.step_description, sop_step_id: step.id, step_number: step.step_number })]
      );
      nodes.push(stepNode.rows[0].id);
      y += 100;
    }
    
    // End Node
    const endNode = await pool.query(
      'INSERT INTO process_nodes (map_id, type, label, position_x, position_y, data) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [mapId, 'end', 'End', 250, y, JSON.stringify({ label: 'End' })]
    );
    nodes.push(endNode.rows[0].id);
    
    // 4. Create edges (linear flow)
    for (let i = 0; i < nodes.length - 1; i++) {
      await pool.query(
        'INSERT INTO process_edges (map_id, source_node, target_node) VALUES ($1, $2, $3)',
        [mapId, nodes[i], nodes[i+1]]
      );
    }
    
    res.json({ id: mapId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a map
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  if (!id || id === 'undefined' || isNaN(parseInt(id))) {
    return res.status(400).json({ error: 'Invalid Map ID' });
  }
  const mapId = parseInt(id);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Delete nodes and edges first (though there are foreign keys with CASCADE in some schemas, let's be explicit if not)
    await client.query('DELETE FROM process_edges WHERE map_id = $1', [mapId]);
    await client.query('DELETE FROM process_nodes WHERE map_id = $1', [mapId]);
    await client.query('DELETE FROM process_maps WHERE id = $1', [mapId]);
    
    await client.query('COMMIT');

    const authUserId = parseInt(req.headers['x-user-id'] as string) || 1;
    await logAction(authUserId, 'DELETE', 'Process Map', mapId, {});

    res.json({ success: true });
  } catch (error: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

export default router;
