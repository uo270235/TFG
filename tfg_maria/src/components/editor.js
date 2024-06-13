import React, { useState } from 'react';
import "./editor.css";
import parseShex from '../parser/ShexParser'; 
import {crearMUML} from '../../node_modules/shumlex/main';

function Editor() {
  const [shexInput, setShexInput] = useState('');
  const [parseResult, setParseResult] = useState('');

  const handleShexInputChange = (e) => {
    setShexInput(e.target.value);
  };

  const parseShexInput = () => {
    try {
      // const parsedShEx = shExToXMI(shexInput);
      const parsedShEx = parseShex(shexInput);
      setParseResult(parsedShEx);
    } catch (error) {
      console.error("Error al parsear ShEx:", error);
      setParseResult("Error al parsear el código ShEx. Ver console para detalles.");
    }
  };

  return (
    <div className='editor-container'>
      <h1>ShEx Parser</h1>
      <textarea
        className='editor'
        value={shexInput}
        onChange={handleShexInputChange}
        placeholder="Ingresa aquí el código ShEx."
      ></textarea>
      <button className='button-20' onClick={parseShexInput}>Parsear</button>

      <div className="parse-result-container">
        <h2>Resultado del Parseo:</h2>
        <pre>{parseResult}</pre>
      </div>
    </div>
  );
}

export default Editor;
