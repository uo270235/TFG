import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import YASHE from 'yashe';

const EditorYashe = forwardRef((props, ref) => {
  const [yashe, setYashe] = useState(null);
  const divRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getYasheValue: () => {
      return yashe ? yashe.getValue() : '';
    },
    setYasheValue: (value) => {
       if(yashe) yashe.setValue(value);
    }
  }));

  useEffect(() => {
    if (!yashe) {
      const options = {
        persistent: false,
        lineNumbers: true,
      };

      const y = YASHE(divRef.current, options);
      y.refresh();
      setYashe(y);
    }
  }, [yashe]);

  return <div ref={divRef} />;
});

export default EditorYashe;
