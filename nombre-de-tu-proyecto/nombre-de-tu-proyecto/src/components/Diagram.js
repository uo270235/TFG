import React, { useEffect, useState } from 'react';
import shumlex from 'shumlex'; // Ensure correct import path

const Diagram = ({ diagramSource }) => {
  const [diagram, setDiagram] = useState('');

  useEffect(() => {
    if (diagramSource) {
      try {
        const diagramId = "mermaidDiagram";
        const options = {}; // Add any required options

        // Debug: Log the XMI source
        console.log("XMI Source:", diagramSource);

        // Generate the UML diagram using the provided XMI source
        shumlex.crearDiagramaUML(diagramId, diagramSource, options);

        // Debug: Check the generated UML code
        const umlCode = shumlex.crearMUML(diagramSource);
        console.log("Generated UML Code:", umlCode);

        // Set the diagram state to trigger rendering
        setDiagram(diagramSource);
      } catch (error) {
        console.error('Error generating diagram:', error);
      }
    }
  }, [diagramSource]);

  return (
    <div className="diagram-container">
      <svg id="mermaidDiagram" />
    </div>
  );
};

export default Diagram;
