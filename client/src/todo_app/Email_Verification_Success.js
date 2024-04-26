import React from 'react'
import { Link } from 'react-router-dom'

const Email_Verification_Success = () => {

  
    return(
      <div>
        <div className='flex flex-col top-1/3 absolute w-full text-center'>
            <p className='text-6xl '>Your Email is verified. ✔️</p>
            <p className='text-4xl pt-10'> Please login again.</p>
            <div className='flex justify-center'><button className='btnGray mt-20 text-3xl'><Link to="/login">Back to Login Page</Link></button></div>  
        </div>
    </div>
  
   )
  }

export default Email_Verification_Success