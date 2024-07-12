"use client";

import React, { useState } from 'react';
import { Button, FileInput, Container, Group, Title, Text } from '@mantine/core';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface NodeData {
  data: {
    title: string;
  };
  id: string;
}

interface EdgeData {
  [key: string]: any;
}

interface AgentData {
  [key: string]: any;
}

interface FlowData {
  flow: {
    nodes: NodeData[];
    edges: EdgeData[];
  };
  agent_layer: AgentData[];
}

const Extractor: React.FC = () => {
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

  const handleDownload = () => {
    if (!flowData) return;

    const zip = new JSZip();
    const flow = flowData.flow;

    // Create folders
    const nodesFolder = zip.folder('data/nodes');
    const edgesFolder = zip.folder('data/edges');
    const agentsFolder = zip.folder('agents');

    // Add nodes
    if (flow && flow.nodes) {
      flow.nodes.forEach((node) => {
        const title = node.data.title || `node_${node.id}`;
        console.log('Adding node:', title); // Log each node
        nodesFolder?.file(`${title}.json`, JSON.stringify(node, null, 2));
      });
    } else {
      console.error('No nodes found in flowData');
    }

    // Add edges
    if (flow && flow.edges) {
      flow.edges.forEach((edge, index) => {
        console.log('Adding edge:', edge); // Log each edge
        edgesFolder?.file(`edge_${index + 1}.json`, JSON.stringify(edge, null, 2));
      });
    } else {
      console.error('No edges found in flowData');
    }

    // Add agents
    if (flowData.agent_layer) {
      flowData.agent_layer.forEach((agent, index) => {
        console.log('Adding agent:', agent); // Log each agent
        agentsFolder?.file(`agent_${index + 1}.json`, JSON.stringify(agent, null, 2));
      });
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
    <Container w="250px">
      <Title order={2} mb="xs">Extractor</Title>
      <FileInput
        placeholder="Upload .spk file"
        accept=".spk"
        value={null}
        onChange={handleUpload}
      />
      <Button onClick={handleDownload} disabled={!flowData} mt="md">
        Extract
      </Button>
    </Container>
  );
};

export default Extractor;
