import React from 'react';
import { Paper, Flex, Title, Text, Divider, ActionIcon } from '@mantine/core';
import { IconBrandGithub } from '@tabler/icons-react';
import Extractor from './extractor';
import Compiler from './compiler';
import Visualizer from './visualizer';

const App: React.FC = () => {
  return (
    <>
          <Flex align="center" direction="column" justify="center" w="100%" h="90vh" gap="sm">
          <Title order={1}>Spark Engine</Title>
          <Text c="dimmed" mb="md">.SPK File Extractor and Compiler</Text>

      <Paper shadow="xs" withBorder p="sm" w="70%" style={{maxWidth:'750px'}}>
        <Flex>
        <Flex py={16} align="center" direction="column" justify="center" w="100%" h="100%" gap="sm">
         <Extractor />
         <Divider my={8}/>
         <Compiler />
        </Flex>
        <Flex py={16} align="center" direction="column" justify="center" w="100%" h="100%" gap="sm">
        <Visualizer />  
        </Flex> 
        </Flex>    
      </Paper>
      <Paper p="sm" w="70%" style={{maxWidth:'450px'}}>
        <Flex gap="xs" align="center" justify="center">
          <Text>Star us on Github!</Text>
         <ActionIcon size="md" p="3px" variant="default"><IconBrandGithub/></ActionIcon>    
        </Flex>
      </Paper>
      </Flex>
   </>
  );
};

export default App;
