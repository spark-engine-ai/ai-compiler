"use client";

import React, { useState, ChangeEvent } from 'react';
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

const spriteMapInverse: { [key: number]: string } = {
  0: "/tilemaps/Alex16x16.png",
  1: "/tilemaps/Bobby16x16.png",
  2: "/tilemaps/Julie16x16.png",
  3: "/tilemaps/Jordan16x16.png",
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

    reader.onload = (e) => {
      if (!e.target?.result) return;

      JSZip.loadAsync(e.target.result)
        .then((zipContent) => {
          const flowData: FlowData = { flow: { nodes: [], edges: [] }, agent_layer: [] };

          const filePromises = Object.values(zipContent.files).map((file: JSZipObject) =>
            file.async("string").then((content) => {
              if (content) {
                try {
                  const json = JSON.parse(content);
                  const relativePath = file.name;
                  if (relativePath === "data/node_data.spk") {
                    flowData.flow.nodes = json;
                  } else if (relativePath === "data/edge_data.spk") {
                    flowData.flow.edges = json;
                  } else if (relativePath === "data/agent_data.spk") {
                    flowData.agent_layer = json;
                  } else if (relativePath.startsWith("assets/nodes")) {
                    if (Array.isArray(json)) {
                      json.forEach((dumbedDownNode: NodeData) => {
                        const originalNode = flowData.flow.nodes.find(node => node.id === dumbedDownNode.id);
                        if (originalNode) {
                          originalNode.type = dumbedDownNode.type.endsWith('Node') ? dumbedDownNode.type : `${dumbedDownNode.type}Node`;
                          originalNode.data.title = dumbedDownNode.data.title;
                          if (originalNode.data.config.props) {
                            originalNode.data.config.props.forEach((prop: any, index: any) => {
                              prop.value = dumbedDownNode.data.props[index].value;
                            });
                          }
                          originalNode.position = dumbedDownNode.position;
                          if (dumbedDownNode.templateName) {
                            originalNode.data.fileName = `${dumbedDownNode.templateName}Node`;
                          }
                        }
                      });
                    } else {
                      const dumbedDownNode = json as NodeData;
                      const originalNode = flowData.flow.nodes.find(node => node.id === dumbedDownNode.id);
                      if (originalNode) {
                        originalNode.type = dumbedDownNode.type.endsWith('Node') ? dumbedDownNode.type : `${dumbedDownNode.type}Node`;
                        originalNode.data.title = dumbedDownNode.data.title;
                        if (originalNode.data.config.props) {
                          originalNode.data.config.props.forEach((prop: any, index: any) => {
                            prop.value = dumbedDownNode.data.props[index].value;
                          });
                        }
                        originalNode.position = dumbedDownNode.position;
                        if (dumbedDownNode.templateName) {
                          originalNode.data.fileName = `${dumbedDownNode.templateName}Node`;
                        }
                      }
                    }
                  } else if (relativePath.startsWith("assets/edges")) {
                    if (Array.isArray(json)) {
                      json.forEach((dumbedDownEdge: EdgeData) => {
                        const originalEdge = flowData.flow.edges.find(edge => edge.id === dumbedDownEdge.id);
                        if (originalEdge) {
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
                        }
                      });
                    } else {
                      const dumbedDownEdge = json;
                      const originalEdge = flowData.flow.edges.find(edge => edge.id === dumbedDownEdge.id);
                      if (originalEdge) {
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
                      }
                    }
                  } else if (relativePath.startsWith("assets/agents")) {
                    if (Array.isArray(json)) {
                      json.forEach((dumbedDownAgent: AgentData) => {
                        const originalAgent = flowData.agent_layer.find(agent => agent.id === dumbedDownAgent.id);
                        if (originalAgent) {
                          originalAgent.name = dumbedDownAgent.name;
                          originalAgent.role = dumbedDownAgent.role;
                          originalAgent.color = dumbedDownAgent.color;
                          originalAgent.spritesheet = spriteMapInverse[dumbedDownAgent.spritesheet];
                          originalAgent.instructions = dumbedDownAgent.instructions;
                        }
                      });
                    } else {
                      const dumbedDownAgent = json;
                      const originalAgent = flowData.agent_layer.find(agent => agent.id === dumbedDownAgent.id);
                      if (originalAgent) {
                        originalAgent.name = dumbedDownAgent.name;
                        originalAgent.role = dumbedDownAgent.role;
                        originalAgent.color = dumbedDownAgent.color;
                        originalAgent.spritesheet = spriteMapInverse[dumbedDownAgent.spritesheet];
                        originalAgent.instructions = dumbedDownAgent.instructions;
                      }
                    }
                  }
                } catch (error) {
                  console.error(`Error parsing JSON for file ${file.name}:`, error);
                }
              }
            })
          );

          Promise.all(filePromises).then(() => {
            const compiledContent = JSON.stringify(flowData, null, 2);
            const spkBlob = new Blob([compiledContent], { type: 'application/json' });
            saveAs(spkBlob, 'compiled_flow.spk');
          });
        })
        .catch((err) => {
          console.error('Error reading zip file', err);
        });
    };

    reader.readAsArrayBuffer(zipFile);
  };

  return (
    <Container>
      <Title order={2}>Compiler</Title>
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
