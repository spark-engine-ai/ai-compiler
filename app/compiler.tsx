"use client";

import React, { useState } from 'react';
import { Button, FileInput, Container, Title } from '@mantine/core';
import JSZip, { JSZipObject } from 'jszip';
import { saveAs } from 'file-saver';

interface FlowData {
  flow: {
    nodes: any[];
    edges: any[];
  };
  agent_layer: any[];
}

interface NodeData {
  id: string;
  type: string;
  templateName?: string;
  data: {
    title: string;
    fileName?: string;
    props: Array<{
      label: string;
      value: any;
    }>;
  };
  position: {
    x: number;
    y: number;
  };
}

const spriteMapInverse: { [key: number]: string } = {
  1: "/tilemaps/Alex16x16.png",
  2: "/tilemaps/Bobby16x16.png",
  3: "/tilemaps/Julie16x16.png",
  4: "/tilemaps/Jordan16x16.png",
};

const Compiler: React.FC = () => {
  const [zipFile, setZipFile] = useState<File | null>(null);

  const handleUpload = (file: File | null) => {
    if (file && file.name.endsWith('.zip')) {
      setZipFile(file);
    } else {
      console.error('Invalid file type. Please upload a .zip file.');
    }
  };

  const handleCompile = () => {
    if (!zipFile) return;

    const reader = new FileReader();

    reader.onload = async (e) => {
      if (!e.target?.result) return;

      const zipContent = await JSZip.loadAsync(e.target.result);
      const flowData: FlowData = { flow: { nodes: [], edges: [] }, agent_layer: [] };

      const dataPromises = Promise.all([
        zipContent.file('resources/node_data.json')?.async('string').then(JSON.parse) || [],
        zipContent.file('resources/edge_data.json')?.async('string').then(JSON.parse) || [],
        zipContent.file('resources/agent_data.json')?.async('string').then(JSON.parse) || [],
      ]);

      const [nodeTemplate, edgeTemplate, agentTemplate] = await dataPromises;

      const filePromises = Object.values(zipContent.files).map((file: JSZipObject) =>
        file.async("string").then((content) => {
          if (content) {
            try {
              const json = JSON.parse(content);
              const relativePath = file.name;
              if (relativePath.startsWith("assets/nodes")) {
                const processNode = (dumbedDownNode: NodeData) => {
                  let originalNode;
                  if (dumbedDownNode.type === 'template') {
                    originalNode = nodeTemplate.find((node: NodeData) => node.data?.fileName === `${dumbedDownNode.templateName}Node`);
                  } else if (dumbedDownNode.type === 'input') {
                    originalNode = nodeTemplate.find((node: NodeData) => node.type === `${dumbedDownNode.type}`);
                  } else {
                    originalNode = nodeTemplate.find((node: NodeData) => node.type === `${dumbedDownNode.type}Node`);
                  }
                  
                  if (originalNode) {
                    originalNode = JSON.parse(JSON.stringify(originalNode)); // Clone the node template
                    originalNode.id = dumbedDownNode.id;
                    originalNode.data.title = dumbedDownNode.data.title;
                    if (originalNode.data.config.props) {
                      originalNode.data.config.props.forEach((prop: any, index: any) => {
                        prop.value = dumbedDownNode.data.props[index]?.value ?? prop.value;
                      });
                    }
                    originalNode.position = dumbedDownNode.position;
                    flowData.flow.nodes.push(originalNode);
                  } else {
                    console.error(`Node template not found for type ${dumbedDownNode.type} or templateName ${dumbedDownNode.templateName}`);
                  }
                };
                if (Array.isArray(json)) {
                  json.forEach(processNode);
                } else {
                  processNode(json);
                }
              } else if (relativePath.startsWith("assets/edges")) {
                const processEdge = (dumbedDownEdge: any) => {
                  let originalEdge = edgeTemplate.find((edge: any) => edge.id === dumbedDownEdge.id);
                  if (originalEdge) {
                    originalEdge = JSON.parse(JSON.stringify(originalEdge)); // Clone the edge template
                    originalEdge.id = dumbedDownEdge.id;
                    originalEdge.source = dumbedDownEdge.from;
                    originalEdge.target = dumbedDownEdge.to;
                    if (dumbedDownEdge.fromHandle === 1) {
                      originalEdge.sourceHandle = "second-one-source";
                    } else if (dumbedDownEdge.fromHandle === 2) {
                      originalEdge.sourceHandle = "second-two-source";
                    }
                    if (dumbedDownEdge.toHandle === 1) {
                      originalEdge.targetHandle = "second-one-target";
                    } else if (dumbedDownEdge.toHandle === 2) {
                      originalEdge.targetHandle = "second-two-target";
                    }
                    flowData.flow.edges.push(originalEdge);
                  } else {
                    console.error(`Edge template not found for id ${dumbedDownEdge.id}`);
                  }
                };
                if (Array.isArray(json)) {
                  json.forEach(processEdge);
                } else {
                  processEdge(json);
                }
              } else if (relativePath.startsWith("assets/agents")) {
                const processAgent = (dumbedDownAgent: any) => {
                  let originalAgent = agentTemplate.find((agent: any) => agent.id === dumbedDownAgent.id);
                  if (originalAgent) {
                    originalAgent = JSON.parse(JSON.stringify(originalAgent)); // Clone the agent template
                    originalAgent.id = dumbedDownAgent.id;
                    originalAgent.name = dumbedDownAgent.name;
                    originalAgent.role = dumbedDownAgent.role;
                    originalAgent.color = dumbedDownAgent.color;
                    originalAgent.spritesheet = spriteMapInverse[dumbedDownAgent.spritesheet];
                    originalAgent.instructions = dumbedDownAgent.instructions;
                    flowData.agent_layer.push(originalAgent);
                  } else {
                    console.error(`Agent template not found for id ${dumbedDownAgent.id}`);
                  }
                };
                if (Array.isArray(json)) {
                  json.forEach(processAgent);
                } else {
                  processAgent(json);
                }
              }
            } catch (error) {
              console.error(`Error parsing JSON for file ${file.name}:`, error);
            }
          }
        })
      );

      await Promise.all(filePromises);

      const compiledContent = JSON.stringify(flowData, null, 2);
      const spkBlob = new Blob([compiledContent], { type: 'application/json' });
      saveAs(spkBlob, 'spark_project.spk');
    };

    reader.readAsArrayBuffer(zipFile);
  };

  return (
    <Container w="100%">
      <Title order={2} mb="sm">Compiler</Title>
      <FileInput
        placeholder="Upload .zip file"
        accept=".zip"
        value={zipFile}
        onChange={handleUpload}
      />
      <Button onClick={handleCompile} disabled={!zipFile} mt="md">
        Compile Flow Data
      </Button>
    </Container>
  );
};

export default Compiler;
