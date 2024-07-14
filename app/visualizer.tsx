"use client";

import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';
import { FileInput, Container, Title, Button, Box, Text } from '@mantine/core';
import JSZip from 'jszip';

interface NodeData {
  id: string;
  position: { x: number; y: number };
  type: string;
}

interface EdgeData {
  id: string;
  source: string;
  target: string;
}

const NodeSphere: React.FC<{ position: [number, number, number]; color: string; label: string }> = ({ position, color, label }) => (
  <group>
    <Sphere args={[0.5, 32, 32]} position={position}>
      <meshStandardMaterial attach="material" color={color} />
      <Html position={[1, 2.5, 0]} style={{ pointerEvents: 'none', fontSize: '12px', color: 'white', textAlign: 'center' }}>
        {label}
      </Html>
    </Sphere>
  </group>
);

const EdgeLine: React.FC<{ start: [number, number, number]; end: [number, number, number] }> = ({ start, end }) => {
  const points = [new THREE.Vector3(...start), new THREE.Vector3(...end)];
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
  return (
    <line>
      <bufferGeometry attach="geometry" {...lineGeometry} />
      <lineBasicMaterial attach="material" color="white" />
    </line>
  );
};

const Visualizer: React.FC<{ nodes: NodeData[]; edges: EdgeData[] }> = ({ nodes, edges }) => {
  const nodePositions: { [key: string]: [number, number, number] } = {};
  const edgeMap: { [key: string]: string[] } = {};

  edges.forEach((edge) => {
    if (!edgeMap[edge.source]) edgeMap[edge.source] = [];
    if (!edgeMap[edge.target]) edgeMap[edge.target] = [];
    edgeMap[edge.source].push(edge.target);
    edgeMap[edge.target].push(edge.source);
  });

  const layoutNodes = (nodeId: string, posX: number, posY: number, depth: number) => {
    if (nodePositions[nodeId]) return;
    nodePositions[nodeId] = [posX, posY, depth * 2];
    const neighbors = edgeMap[nodeId] || [];
    neighbors.forEach((neighbor, index) => {
      const angle = (index / neighbors.length) * Math.PI * 2;
      const newX = posX + Math.cos(angle) * 3;
      const newY = posY + Math.sin(angle) * 3;
      layoutNodes(neighbor, newX, newY, depth + 1);
    });
  };

  const inputNode = nodes.find((node) => node.type === 'input');
  if (inputNode) {
    layoutNodes(inputNode.id, 0, 0, 0);
  }

  useEffect(() => {
    if (nodes.length > 0 && Object.keys(nodePositions).length === 0) {
      nodes.forEach((node, index) => {
        if (!nodePositions[node.id]) {
          layoutNodes(node.id, index * 3, index * 3, 0);
        }
      });
    }
  }, [nodes]);

  const outputNodes = nodes.filter(
    (node) => !edges.some((edge) => edge.source === node.id)
  );

  const center = new THREE.Vector3();
  nodes.forEach((node) => {
    const pos = nodePositions[node.id];
    center.add(new THREE.Vector3(...pos));
  });
  center.divideScalar(nodes.length);

  return (
    <Box p="sm" mt="sm">
      <Canvas style={{ width: '100%', height: '100%', border: '1px solid', borderRadius: '7px' }}>
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        {nodes.map((node) => {
          const color =
            node.type === 'input'
              ? 'orange'
              : outputNodes.some((outputNode) => outputNode.id === node.id)
              ? 'limegreen'
              : 'skyblue';
          const label = node.type === 'input' ? 'input' : outputNodes.some((outputNode) => outputNode.id === node.id) ? 'output' : '';
          return <NodeSphere key={node.id} position={nodePositions[node.id]} color={color} label={label} />;
        })}
        {edges.map((edge) => (
          <EdgeLine key={edge.id} start={nodePositions[edge.source]} end={nodePositions[edge.target]} />
        ))}
        <OrbitControls target={center} />
      </Canvas>
    </Box>
  );
};

const ModelViewer: React.FC = () => {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [edges, setEdges] = useState<EdgeData[]>([]);
  const [zipFile, setZipFile] = useState<File | null>(null);

  const handleUpload = async (file: File) => {
    if (file && file.name.endsWith('.spk')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const jsonData = JSON.parse(e.target.result as string);
          setNodes(jsonData.flow.nodes);
          setEdges(jsonData.flow.edges);
        }
      };
      reader.readAsText(file);
    } else if (file && file.name.endsWith('.zip')) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target?.result) {
          const zip = await JSZip.loadAsync(e.target.result as ArrayBuffer);
          const compiledFile = zip.file('compiled_flow.spk');
          if (compiledFile) {
            const flowData = JSON.parse(await compiledFile.async('string'));
            setNodes(flowData.flow.nodes);
            setEdges(flowData.flow.edges);
          } else {
            console.error('compiled_flow.spk not found in the zip file.');
          }
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      console.error('Invalid file type. Please upload a .spk or .zip file.');
    }
  };

  return (
    <Container>
      <Title order={2} mb="sm">Project Visualizer</Title>
      <Text size="sm" mb="sm" c="dimmed">.SPK files must have all nodes connected in it with an input and output node included.</Text>
      <FileInput
        placeholder="Only .spk supported"
        accept=".spk"
        value={zipFile}
        onChange={setZipFile}
      />
      <Button onClick={() => zipFile && handleUpload(zipFile)} disabled={!zipFile} mt="md">
        Upload
      </Button>
      {nodes.length > 0 && edges.length > 0 && <Visualizer nodes={nodes} edges={edges} />}
    </Container>
  );
};

export default ModelViewer;
