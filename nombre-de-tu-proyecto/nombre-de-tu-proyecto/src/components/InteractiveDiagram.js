import React, { useEffect, useState } from 'react';
import './InteractiveDiagram.css';

const InteractiveDiagram = ({ diagramSource }) => {
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

  const toggleElementVisibility = (elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.toggle('hidden');
    }
  };

  return (
    <div className="diagram-container">
      <button onClick={() => toggleElementVisibility('elementId')}>Toggle Element</button>
      <div dangerouslySetInnerHTML={{ __html: diagram }} />
    </div>
  );
};

export default InteractiveDiagram;
