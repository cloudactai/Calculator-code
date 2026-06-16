import React, { useState, useCallback } from "react";
import {ReactFlow,
  addEdge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Card,
  CardContent,
  IconButton,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

const initialNodes = [
  { id: "1", data: { label: "Step 1", expanded: false }, position: { x: 0, y: 0 }, type: "customNode" },
  { id: "2", data: { label: "Step 2", expanded: false }, position: { x: 0, y: 100 }, type: "customNode" },
  { id: "3", data: { label: "Step 3", expanded: false }, position: { x: 0, y: 200 }, type: "customNode" },
];

const initialEdges = [
  { id: "e1-2", source: "1", target: "2", animated: true },
  { id: "e2-3", source: "2", target: "3", animated: true },
];

const FlowChart = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Function to shift nodes below the expanded one
  const shiftNodesBelow = useCallback((nodeId, shiftAmount) => {
    setNodes((nds) =>
      nds.map((node) =>
        parseInt(node.id) > parseInt(nodeId)
          ? { ...node, position: { x: node.position.x, y: node.position.y + shiftAmount } }
          : node
      )
    );
  }, [setNodes]);

  // Custom Node Component
  const CustomNode = ({ id, data }) => {
    const [expanded, setExpanded] = useState(data.expanded);

    const handleExpand = () => {
      setExpanded(!expanded);
      shiftNodesBelow(id, expanded ? -200 : 200);
    };

    return (
      <Card sx={{ width: 200, textAlign: "center" }}>
        <CardContent>
          <Accordion expanded={expanded} onChange={handleExpand}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>{data.label}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>Confirm details</Typography>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>
    );
  };

  // Define the custom node type
  const nodeTypes = { customNode: CustomNode };

  // Connect edges between nodes
  const onConnect = (connection) => setEdges((eds) => addEdge(connection, eds));

  // Add a new node between two existing nodes
  const addIntermediateNode = (source, target) => {
    const newId = `${nodes.length + 1}`;
    const sourceNode = nodes.find((node) => node.id === source);
    const targetNode = nodes.find((node) => node.id === target);

    if (sourceNode && targetNode) {
      const newNode = {
        id: newId,
        data: { label: `Step ${newId}`, expanded: false },
        position: { x: sourceNode.position.x, y: (sourceNode.position.y + targetNode.position.y) / 2 },
        type: "customNode",
      };

      setNodes((nds) => [...nds, newNode]);
      setEdges((eds) => [
        ...eds.filter((edge) => !(edge.source === source && edge.target === target)),
        { id: `e${source}-${newId}`, source, target: newId, animated: true },
        { id: `e${newId}-${target}`, source: newId, target, animated: true },
      ]);
    }
  };

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
      {edges.map((edge) => (
        <IconButton
          key={edge.id}
          onClick={() => addIntermediateNode(edge.source, edge.target)}
          sx={{
            position: "absolute",
            left: `${(nodes.find((n) => n.id === edge.source)?.position.x ?? 0) + 100}px`,
            top: `${(nodes.find((n) => n.id === edge.target)?.position.y ?? 0) - 50}px`,
            zIndex: 10,
          }}
        >
          <AddCircleOutlineIcon />
        </IconButton>
      ))}
    </div>
  );
};

export default FlowChart;
