import {useState, useRef, useEffect} from 'react'

const useClickOutside = ({ ref, isModalOpen, handler, index }) => {
  
  useEffect(() => {
      const handleEsc = (event) => {
        if (event.key === "Escape") {
          handler();
        }
    };
    
      const handleClickOutside = (event) => {
        if (ref.current && ref.current[index]) {
          if (!ref.current[index].contains(event.target)) {
          handler();
          }
        } else if (ref.current && !ref.current.contains(event.target)) {
          handler();
        }
      };
      
      if(isModalOpen){
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener("keydown", handleEsc);
        document.addEventListener("touchend", handleClickOutside);
      }
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
          document.removeEventListener("keydown", handleEsc);
          document.removeEventListener("touchend", handleClickOutside);
    
        };
    
  }, [isModalOpen]);

 
}

export default useClickOutside;