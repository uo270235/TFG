import React, { useState, useEffect, useRef } from 'react';
import './editor.css';
import EditorYashe from './yashe';
import shumlex from 'shumlex';
import PlantUMLParser from '../parserShapes';
import Diagram from './Diagram';

function Editor() {
  const editorRef = useRef(null);

  useEffect(() => {
    // WORKAROUND: Solución temporal a bug en librería Yashe (actualmente genera dos editores)
    const yashes = document.querySelectorAll('.yashe');
    if (yashes.length > 1) {
      yashes[0].remove();
    }    
    setTimeout(() => {
      const example = `prefix : <http://example.org/>
prefix xsd: <http://www.w3.org/2001/XMLSchema#>

:Usuario :Hombre and :Mujer or :kokin

:Usuaria not :kokin

:Hombre {
  :genero [ :Masculino ]
}

:Mujer {
  :genero [ :Femenino ]
}

:Kokin{
  :genero [ :Neutro ]
}
`;
      editorRef.current.setYasheValue(example);
    }, 1);
  }, []);

  const [shexCleared, setShexCleared] = useState('');
  const [plantUMLCode, setPlantUMLCode] = useState('');

  const extractLogicShapes = (shex) => {
    // Expresión regular para capturar las shapes lógicas
    const shapeRegex = /:\w+\s+(NOT\s+)?(:\w+\s*(?:AND|OR|NOT|AND\s+NOT|OR\s+NOT)\s*)*:\w+/gi;

    // Buscar todas las coincidencias en el string shex
    const matches = shex.match(shapeRegex);

    const cleanedShex = shex.replace(shapeRegex, '').trim();
    setShexCleared(cleanedShex);

    // Devolver el array con las shapes encontradas
    console.log("shapes sacadas--------------------------------->");
    console.log(matches);

    const parser = new PlantUMLParser(matches);
    const plantUMLCodeGenerated = parser.parse();
    console.log("-------------PLANTUM GENERADO--------------------------------->");
    console.log(plantUMLCodeGenerated);

    setPlantUMLCode(plantUMLCodeGenerated);
    return matches || [];
  };

  useEffect(() => {
    const parseShexInput = () => {
      try {
        const yasheValue = editorRef.current.getYasheValue();
        
        //Generar XMI con shapes lógicas quitadas
        const xmi = shumlex.shExToXMI(shexCleared);
        
        // Crear UML con Mermeid a través de Shumlex
        shumlex.crearDiagramaUML('svgid', xmi);
      } catch (error) {
        console.error("Error al parsear ShEx:", error);
      }
    };

    if (shexCleared !== '') {
      parseShexInput();
    }
  }, [shexCleared]);

  return (
    <>
      <div className='editor'>
        <EditorYashe ref={editorRef} />
      </div>
      <button className='button-20' onClick={() => extractLogicShapes(editorRef.current.getYasheValue())}>
        Ver Diagrama
      </button>
      {plantUMLCode && <Diagram diagramSource={plantUMLCode} />}
    </>
  );
}

export default Editor;
