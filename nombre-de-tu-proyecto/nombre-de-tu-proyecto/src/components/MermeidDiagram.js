import React, { useEffect, useState } from 'react';
import shumlex from 'shumlex'; 

const MermeidDiagram = ({ diagramSource }) => {

  useEffect(() => {
    if (diagramSource) {
      try {
        shumlex.crearDiagramaUML("svgid",diagramSource);
      } catch (error) {
        console.error('Error generating diagram:', error);
      }
    }
  }, [diagramSource]);

  return (
    <svg id="svgid"></svg>
  );
};

export default MermeidDiagram;
