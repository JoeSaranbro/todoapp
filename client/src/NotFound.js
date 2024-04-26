import React from 'react'
import { Link } from 'react-router-dom'
const NotFound = () => {
  return (
    <div>
        <div className='flex flex-col top-1/3 absolute w-full'>
            <p className='flex text-9xl justify-center '>Error! Page Not Found</p>

            <div className='flex justify-center'><button className='btnGray mt-20 text-3xl'><Link to="/portfolio">Back to Homepage</Link></button></div>  
        </div>
    </div>
  )
}

export default NotFound