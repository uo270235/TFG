import React, { useState, useEffect, useRef } from 'react';
import './editor.css';
import EditorYashe from './yashe';
import shumlex from 'shumlex';
import PlantUMLParser from '../parserShapes';
import Diagram from './Diagram';
import Alerta from './Alerta';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { FaDownload } from 'react-icons/fa';

function Editor() {
  const editorRef = useRef(null);
  const [shexCleared, setShexCleared] = useState('');
  const [plantUMLCode, setPlantUMLCode] = useState('');
  const [parseError, setParseError] = useState(null);
  const [krokiSvg, setKrokiSvg] = useState(''); 
  const [isMermaidDiagramVisible, setIsMermaidDiagramVisible] = useState(false);
  const [isKrokiDiagramVisible, setIsKrokiDiagramVisible] = useState(false);

  useEffect(() => {
    const yashes = document.querySelectorAll('.yashe');
    if (yashes.length > 1) {
      yashes[0].remove();
    }
    setTimeout(() => {
      const example = `prefix : <http://example.org/>
prefix xsd: <http://www.w3.org/2001/XMLSchema#>

:Usuario :Hombre OR :Mujer AND NOT :Perro 

:Hombre {
  :genero [ :Masculino ];
  :mascota @:Perro *;
  :mujer @:Mujer;
}

:Mujer {
  :genero [ :Femenino ];
  :marido @:Hombre ; 
  :mascota @:Perro *
}

:Perro {
  :capacidad [ :ladrar ]
}
`;
      editorRef.current.setYasheValue(example);
    }, 1);
  }, []);

  const extractLogicShapes = (shex) => {
    try {
      const shapeRegex = /:\w+\s+(NOT\s+)?(:\w+\s*(?:AND|OR|NOT|AND\s+NOT|OR\s+NOT)\s*)*:\w+/gi;
      const matches = shex.match(shapeRegex);
      const cleanedShex = shex.replace(shapeRegex, '').trim();
      setShexCleared(cleanedShex);

      if (!matches) {
        setPlantUMLCode('');
        setIsKrokiDiagramVisible(false);
        return [];
      }

      let xmi = shumlex.shExToXMI(cleanedShex);
      let classUML_F = shumlex.crearMUML(xmi);

      const parser = new PlantUMLParser(matches, classUML_F);
      const plantUMLCodeGenerated = parser.parse();

      setPlantUMLCode(plantUMLCodeGenerated);
      setParseError(null);
      setIsKrokiDiagramVisible(true);
      return matches || [];
    } catch (error) {
      console.error("Error al parsear ShEx:", error);
      setParseError(error.message);
      setPlantUMLCode('');
      setShexCleared('');
      setIsKrokiDiagramVisible(false);
      return null;
    }
  };

  const clearMermaidDiagram = () => {
    const mermaidContainer = document.getElementById('mermaid-diagram');
    if (mermaidContainer) {
      mermaidContainer.innerHTML = '';
      setIsMermaidDiagramVisible(false);
    }
  };

  const downloadDiagram = (svgContent, filename) => {
    if (svgContent) {
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      console.error('No Relational UML diagram content available.');
    }
  };

  const downloadKrokiDiagram = () => {
    if (krokiSvg) {
      downloadDiagram(krokiSvg, 'diagramLogicUMLClass');
    } else {
      console.error('No Logic UML diagram content available.');
    }
  };

  useEffect(() => {
    const parseShexInput = () => {
      try {
        const yasheValue = editorRef.current.getYasheValue();
        shumlex.shExToXMI(yasheValue);
        const xmi = shumlex.shExToXMI(shexCleared);
        shumlex.crearDiagramaUML('mermaid-diagram', xmi);
        shumlex.asignarEventos('mermaid-diagram');
        setIsMermaidDiagramVisible(true);
      } catch (error) {  
        console.error("Error al parsear ShEx:", error);
        setParseError(error.message);
        setPlantUMLCode('');
        clearMermaidDiagram();
        setShexCleared('');
      }
    };

    if (shexCleared !== '') {
      parseShexInput();
    }
  }, [shexCleared]);

  return (
    <>
    <div class="container">
      <div className='editor'>
        <h1 className="page-title">Schema (ShEx)</h1>
        <EditorYashe ref={editorRef} />
        <div className='editor-buttons'>
          <button className='button-20' onClick={() => {
              const yasheValue = editorRef.current.getYasheValue();
              try {
                shumlex.shExToXMI(yasheValue);
                const result = extractLogicShapes(yasheValue);
                if (result !== null) {
                  console.log("Shapes extraídas y procesadas correctamente.");
                }
              } catch (error) {
                console.error("Error al parsear ShEx:", error);
                setParseError(error.message);
                setPlantUMLCode('');
                clearMermaidDiagram();
                setShexCleared('');
              }
            }}>
            Ver Diagrama
          </button>
        </div>
           </div>
           {parseError && (
        <Alerta mensaje={`Error al parsear ShEx: ${parseError}`} onClose={() => setParseError(null)} />
      )}
              <div className="result-container">
          {plantUMLCode && 
          <div className="diagram-container kroki-diagram" data-zoom-on-wheel="zoom-amount: 0.01; min-scale: 0.3; max-scale: 20;" data-pan-on-drag>
            <Diagram diagramSource={plantUMLCode} onSvgGenerated={setKrokiSvg} />
            <div className='icon-container'>
            {isKrokiDiagramVisible && (
              <button className='download-icon' onClick={downloadKrokiDiagram}>
                <FaDownload />
              </button>
            )}
            </div>
          </div>}
          <div className={isMermaidDiagramVisible ? (isKrokiDiagramVisible ? "diagram-container mermaid-diagram" : "diagram-container only-mermaid") : ""} data-zoom-on-wheel="zoom-amount: 0.01; min-scale: 0.3; max-scale: 20;" data-pan-on-drag>
          <div id="mermaid-diagram"></div>
            {isMermaidDiagramVisible && (
              <button className='download-icon' onClick={() => downloadDiagram(document.getElementById('mermaid-diagram').innerHTML, 'diagramUMLRelationalClass')}>
                <FaDownload />
              </button>
              
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Editor;
