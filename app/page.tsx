import React from 'react';
import { Paper, Flex, Title, Text, Divider } from '@mantine/core';
import Extractor from './extractor';
import Compiler from './compiler';

const App: React.FC = () => {
  return (
    <>
          <Flex align="center" direction="column" justify="center" w="100%" h="80vh" gap="sm">
          <Title order={1}>Spark Engine</Title>
          <Text c="dimmed" mb="md">.SPK File Extractor and Compiler</Text>

      <Paper shadow="xs" withBorder p="sm">
       <Flex align="center" direction="column" justify="center" w="100%" h="100%" gap="sm">
         <Extractor />
         <Divider my={8}/>
         <Compiler />
        </Flex>       
      </Paper>
      </Flex>
   </>
  );
};

export default App;
