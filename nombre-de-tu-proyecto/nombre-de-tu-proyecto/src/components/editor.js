import React, { useState, useEffect, useRef } from 'react';
import './editor.css';
import EditorYashe from './yashe';
import shumlex from 'shumlex';
import PlantUMLParser from '../parserShapes';
import Diagram from './Diagram';
import Alerta from './Alerta'; // Importa el componente de alerta

function Editor() {
  const editorRef = useRef(null);
  const [shexCleared, setShexCleared] = useState('');
  const [plantUMLCode, setPlantUMLCode] = useState('');
  const [parseError, setParseError] = useState(null); // Nuevo estado para manejar el error

  useEffect(() => {
    // WORKAROUND: Solución temporal a bug en librería Yashe (actualmente genera dos editores)
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
      // Expresión regular para capturar las shapes lógicas
      const shapeRegex = /:\w+\s+(NOT\s+)?(:\w+\s*(?:AND|OR|NOT|AND\s+NOT|OR\s+NOT)\s*)*:\w+/gi;

      // Buscamos las Shape Lógicas y las almacenamos. Además se borran del shex
      const matches = shex.match(shapeRegex);
      const cleanedShex = shex.replace(shapeRegex, '').trim();
      setShexCleared(cleanedShex);

      // No es un error si no se encuentran shapes lógicas
      if (!matches) {
        setPlantUMLCode('');
        return [];
      }

      let xmi = shumlex.shExToXMI(cleanedShex);
      let classUML_F = shumlex.crearMUML(xmi);

      const parser = new PlantUMLParser(matches, classUML_F);
      const plantUMLCodeGenerated = parser.parse();

      setPlantUMLCode(plantUMLCodeGenerated);
      setParseError(null); // Limpiar cualquier error previo
      return matches || [];
    } catch (error) {
      console.error("Error al parsear ShEx:", error);
      setParseError(error.message); // Establecer el error en el estado
      return null;
    }
  };

  useEffect(() => {
    const parseShexInput = () => {
      try {
        const yasheValue = editorRef.current.getYasheValue();

        // Validar ShEx con shumlex.shExToXMI(yasheValue)
        shumlex.shExToXMI(yasheValue); 

        // Generar XMI con shapes lógicas quitadas
        const xmi = shumlex.shExToXMI(shexCleared);

        // Crear UML con Mermeid a través de Shumlex
        shumlex.crearDiagramaUML('svgid', xmi);
        shumlex.asignarEventos('svgid');

      } catch (error) {  
        console.error("Error al parsear ShEx:", error);
        setParseError(error.message); // Establecer el error en el estado
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
      <button className='button-20' onClick={() => {
        const yasheValue = editorRef.current.getYasheValue();
        try {
          shumlex.shExToXMI(yasheValue); // Validar primero
          const result = extractLogicShapes(yasheValue);
          if (result !== null) {
            console.log("Shapes extraídas y procesadas correctamente.");
          }
        } catch (error) {
          console.error("Error al parsear ShEx:", error);
          setParseError(error.message);
        }
      }}>
        Ver Diagrama
      </button>
      {plantUMLCode && <Diagram diagramSource={plantUMLCode} />}
      {parseError && (
        <Alerta mensaje={`Error al parsear ShEx: ${parseError}`} onClose={() => setParseError(null)} />
      )}
    </>
  );
}

export default Editor;
