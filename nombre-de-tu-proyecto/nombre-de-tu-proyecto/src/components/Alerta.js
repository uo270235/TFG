// Alerta.js
import React from 'react';
import './Alerta.css';

const Alerta = ({ mensaje, onClose }) => {
  return (
    <div className="alerta">
      <span className="alerta-mensaje">{mensaje}</span>
      <button className="alerta-cerrar" onClick={onClose}>
        &times;
      </button>
    </div>
  );
};

export default Alerta;
