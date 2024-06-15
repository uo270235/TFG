import React, { useEffect, useState } from 'react';

const Diagram = ({ diagramSource }) => {
  const [diagram, setDiagram] = useState('');

  useEffect(() => {
    if (diagramSource) {
      fetch('https://kroki.io/plantuml/svg', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: diagramSource
      })
        .then(response => response.text())
        .then(svg => setDiagram(svg))
        .catch(error => console.error('Error generating diagram:', error));
    }
  }, [diagramSource]);

  return (
    <div className="diagram-container">
      <div dangerouslySetInnerHTML={{ __html: diagram }} />
    </div>
  );
};

export default Diagram;
