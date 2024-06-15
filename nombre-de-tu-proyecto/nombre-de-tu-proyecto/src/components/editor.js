import React, { useState, useEffect, useRef } from 'react';
import "./editor.css";
import EditorYashe from './yashe';
import shumlex from 'shumlex';
import InteractiveDiagram from './InteractiveDiagram';
import YASHE from 'yashe';
import Diagram from './Diagram';


// import {shExToXMI} from '../shumlex/main';

function Editor() {
  const editorRef = useRef(null);

  useEffect(() => {
    // WORKAROUND: Solución temporal a bug en librería Yashe (actualmente genera dos editores)
    const yashes = document.querySelectorAll('.yashe');

    if (yashes.length > 1) {
      yashes[0].remove();
    }
  }, []); 

  const [shexInput, setShexInput] = useState('');
  const [parseResult, setParseResult] = useState('');

  const handleShexInputChange = (e) => {
    setShexInput(e.target.value);
  };

  const parseShexInput = () => {
    try {
      console.log(shumlex.checkLink("probando! por favor funciona!!!"));
      const yasheValue = editorRef.current.getYasheValue();
      const xmi = shumlex.shExToXMI(yasheValue);
      const plantuml = shumlex.crearMUML(xmi);
      setParseResult(plantuml);
      let filteredPlantuml = plantuml.replace(/classDiagram\n/, '');
      filteredPlantuml = filteredPlantuml.replace(/class Prefixes \{[^}]+\}\n?/, '');

      setParseResult(filteredPlantuml);
      // console.log(yashe.getValue()) ???
    } catch (error) {
      console.error("Error al parsear ShEx:", error);
      setParseResult("Error al parsear el código ShEx. Ver console para detalles.");
    }
  };

  return (
    <div className='editor-container'>
      <h1>ShEx Parser</h1>
      <div className='editor'>
      <EditorYashe ref={editorRef} />
      </div>
      <button className='button-20' onClick={parseShexInput}>Ver Diagrama</button>

      <div className="parse-result-container">
        
      </div>
      {parseResult && <InteractiveDiagram diagramSource={parseResult} />}
      
    </div>
  );
}

export default Editor;
