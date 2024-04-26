import { useState, useEffect } from 'react';
import {NavLink} from 'react-router-dom'
import { useRef } from 'react';

import { Squash as Hamburger } from "hamburger-react";
import { AnimatePresence, motion } from "framer-motion";


const checkIfActive = ({isActive}) => {
    
  return isActive ?'underline bg-slate-600 rounded-lg px-2 py-2':'hover:bg-slate-600 rounded-lg px-2 py-2'
}

const CustomMotionLi = ({ idx, children }) => {
  return (
    <motion.li
      className="motion-item"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.1 + idx / 10,
      }}
    >
      {children}
    </motion.li>
  );
};



const StyledNavbar = () => {
  const hamburger_nav = useRef()
  const [isOpen, setOpen] = useState(false);
  
  
  useEffect(() => {
    
    const handleClickOutside = (event) => {
      if (!hamburger_nav.current.contains(event.target)) {
        setOpen(false);
      }
  };
    if (isOpen) {
      document.addEventListener("touchend", handleClickOutside, true);
    }
    return () => {
      document.removeEventListener("touchend", handleClickOutside, true);
    };
  },[isOpen]);


  return (
    
    <nav className='top-navbar h-14 box-border'>
      
      <div className='div-navbar-desktop h-full align-middle '>
          
          <ul className='top-navbar-desktop h-full items-center'>
            {/* <li><img src={reactIcon} className='h-11' alt="Logo"/></li> */}
            
            <li><NavLink to='/portfolio' className={checkIfActive}>Home</NavLink></li>
            <li><NavLink to='/portfolio_2' className={checkIfActive}>Portfolio_2</NavLink></li>
            <li><NavLink to='/todoapp' className={checkIfActive}>todo</NavLink></li>
            <li><NavLink to='/login' className={checkIfActive}>Login</NavLink></li>
            
          </ul>
          
        
        <hr className='border-t-2 w-full'/>
      </div>
      
      <div className="hamburger-nav" ref={hamburger_nav}>
      <AnimatePresence>
        {isOpen && (
        <motion.div className='hamburger-nav-list' initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        >
          <ul className='hamburger-nav-ul' >
            
            
          <CustomMotionLi idx={0}><NavLink to='/portfolio' className={checkIfActive} onClick={() => setOpen(false)}>Home</NavLink></CustomMotionLi>
          <CustomMotionLi idx={1}><NavLink to='/portfolio_2' className={checkIfActive} onClick={() => setOpen(false)}>Portfolio_2</NavLink></CustomMotionLi>
          <CustomMotionLi idx={2}><NavLink to='/todoapp' className={checkIfActive} onClick={() => setOpen(false)}>todo</NavLink></CustomMotionLi>
          <CustomMotionLi idx={3}><NavLink to='/login' className={checkIfActive} onClick={() => setOpen(false)}>Login</NavLink></CustomMotionLi>
          
          </ul>
          
        </motion.div>)}
        </AnimatePresence>
        <div className=''>
          <Hamburger toggled={isOpen} size={20} toggle={setOpen}  />
        </div>
      
      </div>
    </nav>
    
  );
};

export default StyledNavbar

