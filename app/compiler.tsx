"use client";

import React, { useState } from 'react';
import { Button, FileInput, Container, Group, Title, Text } from '@mantine/core';
import JSZip, { JSZipObject } from 'jszip';
import { saveAs } from 'file-saver';

interface FlowData {
  flow: {
    nodes: any[];
    edges: any[];
  };
  agent_layer: any[];
}

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
              const json = JSON.parse(content);
              const relativePath = file.name;
              if (relativePath.startsWith("data/nodes")) {
                flowData.flow.nodes.push(json);
              } else if (relativePath.startsWith("data/edges")) {
                flowData.flow.edges.push(json);
              } else if (relativePath.startsWith("agents")) {
                flowData.agent_layer.push(json);
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
    <Container w="250px">
      <Title order={2} mb="xs">Compiler</Title>
      <FileInput
        placeholder="Upload .zip file"
        accept=".zip"
        value={zipFile}
        onChange={handleUpload}
      />
      <Button onClick={handleCompile} disabled={!zipFile} mt="md">
        Compile
      </Button>
    </Container>
  );
};

export default Compiler;
