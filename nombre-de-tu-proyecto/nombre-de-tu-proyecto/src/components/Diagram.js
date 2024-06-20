import React, { useEffect, useState } from 'react';

const Diagram = ({ diagramSource, onSvgGenerated }) => {
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
        .then(svg => {
          setDiagram(svg);
          if (onSvgGenerated) {
            onSvgGenerated(svg); // Call the callback with the SVG content
          }
        })
        .catch(error => console.error('Error generating diagram:', error));
    }
  }, [diagramSource, onSvgGenerated]);

  return (
    <div className="diagram-container">
      <div dangerouslySetInnerHTML={{ __html: diagram }} />
    </div>
  );
};

export default Diagram;
