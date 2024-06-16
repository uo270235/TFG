import React, { useState, useEffect, useRef } from 'react';
import './editor.css';
import EditorYashe from './yashe';
import shumlex from 'shumlex';
import PlantUMLParser from '../parserShapes';

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

:Hombre {
  :genero [ :Masculino ]
}

:Mujer {
  :genero [ :Femenino ]
}
`;
      editorRef.current.setYasheValue(example);
    }, 1);
  }, []);

  const [shexInput, setShexInput] = useState('');
  const [parseResult, setParseResult] = useState('');
  const [shexCleared, setShexCleared] = useState('');
  const [inlineSvg, setInlineSvg] = useState('');

  const handleShexInputChange = (e) => {
    setShexInput(e.target.value);
  };

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
        const plantUMLCode = parser.parse();
        console.log("-------------PLANTUM GENERADO--------------------------------->");
        console.log(plantUMLCode);

    return matches || [];
  };

  useEffect(() => {
    // Función para parsear el input de ShEx
    const parseShexInput = () => {
      try {
        const yasheValue = editorRef.current.getYasheValue();
        
        // extractLogicShapes(yasheValue);

        //Generar XMI con valor del yashe
        // const xmi = shumlex.shExToXMI(yasheValue);

        //Generar XMI con shapes lógicas quitadas
        const xmi = shumlex.shExToXMI(shexCleared);
        
        // Generar PlantUML a partir del XMI
        // const plantuml = shumlex.crearMUML(xmi);
        
        // shumlex.crearDiagramaUML("svgid",xmi);
        
        // Crear UML con Mermeid a través de Shumlex
        shumlex.crearDiagramaUML('svgid', xmi);

        //  Filtrar el resultado de PlantUML
         // let filteredPlantuml = plantuml.replace(/classDiagram\n/, '');
        //  filteredPlantuml = filteredPlantuml.replace(/class Prefixes \{[^}]+\}\n?/, '');
        //  filteredPlantuml = filteredPlantuml.replace(/class Enum\d+ \{[^}]+\}\n?/g, '');

        // console.log("PlantUML filteredPlantuml generado:", filteredPlantuml);
        
      
        // // Actualizar el estado con el resultado filtrado
        // setParseResult(filteredPlantuml);


        // console.log(svg64);

      } catch (error) {
        console.error("Error al parsear ShEx:", error);
        setParseResult("Error al parsear el código ShEx. Ver console para detalles.");
      }
    };

    // Llamar a parseShexInput cuando shexCleared cambie
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
    </>
  );
}

export default Editor;