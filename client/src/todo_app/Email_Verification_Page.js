import React from 'react'
import { Link } from 'react-router-dom'


const Email_Verification_Page = () => {

  return (
    <div>
        <div className='flex flex-col top-1/3 absolute w-full text-center'>
            <p className='text-6xl '>Please verify your email. 📧 </p>
            <p className='text-4xl pt-10'> Go to your email's box, we've sent you an email verification.</p>
            <p className='text-3xl '> The link in the email will expire in 24 hours.</p>
            <div className='flex justify-center'><button className='btnGray mt-20 text-3xl'><Link to="/login">Back to Login Page</Link></button></div>  
        </div>
        
        
    </div>
    
  )
}



export default Email_Verification_Page