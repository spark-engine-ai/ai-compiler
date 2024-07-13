"use client";

import React, { useState } from 'react';
import { Button, FileInput, Container, Title } from '@mantine/core';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface NodeData {
  id: string;
  type: string;
  data: {
    title: string;
    config: {
      props: Array<{
        name: string;
        type: string;
        label: string;
        value: any;
      }> | undefined;
      [key: string]: any;
    };
    fileName?: string;
  };
  position: {
    x: number;
    y: number;
  };
  [key: string]: any;
}

interface EdgeData {
  id: string;
  from: string;
  to: string;
  fromHandle?: number;
  toHandle?: number;
  [key: string]: any;
}

interface AgentData {
  id: string;
  name: string;
  role: string;
  color: string;
  spritesheet: number;
  instructions: string;
}

interface FlowData {
  flow: {
    nodes: NodeData[];
    edges: EdgeData[];
  };
  agent_layer: AgentData[];
}

const spriteMap: { [key: string]: number } = {
  "/tilemaps/Alex16x16.png": 0,
  "/tilemaps/Bobby16x16.png": 1,
  "/tilemaps/Julie16x16.png": 2,
  "/tilemaps/Jordan16x16.png": 3,
};

const Decompiler: React.FC = () => {
  const [flowData, setFlowData] = useState<FlowData | null>(null);

  const handleUpload = (file: File | null) => {
    if (file && file.name.endsWith('.spk')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (!e.target?.result) return;
        try {
          const json: FlowData = JSON.parse(e.target.result as string);
          console.log('Parsed JSON:', json); // Log the parsed JSON to check its structure
          setFlowData(json);
        } catch (error) {
          console.error('Error parsing .spk file:', error);
        }
      };
      reader.readAsText(file);
    } else {
      console.error('Invalid file type. Please upload a .spk file.');
    }
  };

  const createDumbedDownNode = (node: NodeData) => {
    const dumbedDownNode: any = {
      id: node.id,
      type: node.type.replace(/Node$/, ''), // Remove "Node" suffix from type
      data: {
        title: node.data.title,
        props: node.data.config.props?.map(prop => ({
          label: prop.label,
          value: prop.value,
        })) || [],
      },
      position: node.position,
    };

    if (node.type === 'template') {
      dumbedDownNode.templateName = node.data.fileName?.replace(/Node$/, ''); // Remove "Node" suffix from fileName
    }

    return dumbedDownNode;
  };

  const createDumbedDownEdge = (edge: EdgeData) => {
    const dumbedDownEdge: any = {
      id: edge.id,
      from: edge.source,
      to: edge.target,
    };

    if (edge.sourceHandle === "second-one-source") {
      dumbedDownEdge.fromHandle = 1;
    } else if (edge.sourceHandle === "second-two-source") {
      dumbedDownEdge.fromHandle = 2;
    }

    if (edge.targetHandle === "second-one-target") {
      dumbedDownEdge.toHandle = 1;
    } else if (edge.targetHandle === "second-two-target") {
      dumbedDownEdge.toHandle = 2;
    }

    return dumbedDownEdge;
  };

  const createDumbedDownAgent = (agent: any) => {
    return {
      id: agent.id,
      name: agent.name,
      role: agent.role,
      color: agent.color,
      spritesheet: spriteMap[agent.spritesheet],
      instructions: agent.instructions
    };
  };

  const handleDownload = () => {
    if (!flowData) return;

    const zip = new JSZip();
    const flow = flowData.flow;

    // Create folders
    const nodesFolder = zip.folder('assets/nodes');
    const edgesFolder = zip.folder('assets/edges');
    const agentsFolder = zip.folder('assets/agents');

    const usedNames: { [key: string]: number } = {};

    const getUniqueFileName = (baseName: string, usedNames: { [key: string]: number }) => {
      if (!usedNames[baseName]) {
        usedNames[baseName] = 1;
        return baseName;
      } else {
        const newIndex = ++usedNames[baseName];
        return `${baseName}_${newIndex}`;
      }
    };

    // Add nodes
    if (flow && flow.nodes) {
      flow.nodes.forEach((node) => {
        const baseName = node.data.title || `node_${node.id}`;
        const uniqueName = getUniqueFileName(baseName, usedNames);
        console.log('Adding node:', uniqueName); // Log each node
        nodesFolder?.file(`${uniqueName}.json`, JSON.stringify(createDumbedDownNode(node), null, 2));
      });
      zip.file('data/node_data.spk', JSON.stringify(flow.nodes, null, 2));
    } else {
      console.error('No nodes found in flowData');
    }

    // Add edges
    if (flow && flow.edges) {
      flow.edges.forEach((edge, index) => {
        const uniqueName = `edge_${index + 1}`;
        console.log('Adding edge:', uniqueName); // Log each edge
        edgesFolder?.file(`${uniqueName}.json`, JSON.stringify(createDumbedDownEdge(edge), null, 2));
      });
      zip.file('data/edge_data.spk', JSON.stringify(flow.edges, null, 2));
    } else {
      console.error('No edges found in flowData');
    }

    // Add agents
    if (flowData.agent_layer) {
      flowData.agent_layer.forEach((agent) => {
        const baseName = agent.name || `agent_${agent.id}`;
        const uniqueName = getUniqueFileName(baseName, usedNames);
        console.log('Adding agent:', uniqueName); // Log each agent
        agentsFolder?.file(`${uniqueName}.json`, JSON.stringify(createDumbedDownAgent(agent), null, 2));
      });
      zip.file('data/agent_data.spk', JSON.stringify(flowData.agent_layer, null, 2));
    } else {
      console.error('No agents found in flowData');
    }

    // Generate zip file
    zip.generateAsync({ type: 'blob' })
      .then((content) => {
        // Save the zip file
        saveAs(content, 'flow_data.zip');
      })
      .catch((err) => {
        console.error('Error generating zip file', err);
      });
  };

  return (
    <Container>
      <Title order={2}>Decompiler</Title>
      <FileInput
        placeholder="Upload .spk file"
        accept=".spk"
        value={null}
        onChange={handleUpload}
      />
      <Button onClick={handleDownload} disabled={!flowData} mt="md">
        Download Flow Data
      </Button>
    </Container>
  );
};

export default Decompiler;
