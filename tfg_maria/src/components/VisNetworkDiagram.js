import React, { useEffect, useRef } from 'react';
import { DataSet, Network } from 'vis-network/standalone/esm/vis-network';

const VisNetworkDiagram = ({ data }) => {
  const networkContainer = useRef(null);
  
  useEffect(() => {
    if (networkContainer.current && data) {
      // Crea instancias de DataSet para nodos y aristas
      const nodes = new DataSet(data.nodes);
      const edges = new DataSet(data.edges);

      const diagramData = { nodes, edges };

      // Configura opciones si es necesario
      const options = {};

      // Inicializa o actualiza el diagrama
      new Network(networkContainer.current, diagramData, options);
    }
  }, [data]); // Dependencia de `data` para re-renderizar cuando cambie

  return <div ref={networkContainer} style={{ width: '100%', height: '400px' }} />;
};

export default VisNetworkDiagram;
