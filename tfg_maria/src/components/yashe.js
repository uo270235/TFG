import React, {useState,useEffect,useRef} from 'react';
import YASHE from 'yashe';


function EditorYashe() {

  const [yashe,setYashe] = useState(null);
  const divRef = useRef(null);

    useEffect(() => {
    
        if (!yashe) {
            const options = {
                persistent:false,
                lineNumbers: true,
            }
            
            const y = YASHE(divRef.current,options);
        
            y.refresh();
            setYashe(y);           
          }
      }, [yashe]
    );
    return  (<div ref={divRef}/>);
}

export default EditorYashe;

