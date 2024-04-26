import React from 'react'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = () => {

    const [ inputResetPassword, setInputResetPassword ] = useState({password:"", confirm_password: ""})
    const navigate = useNavigate();


    const regexTest = async () => {
        // Perform your regex test here
        
  
        const password_pattern = new RegExp(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9]{8,20}$/)
        
        
        if ((password_pattern.test(inputResetPassword.password)) && (inputResetPassword.password === inputResetPassword.confirm_password)) {
          return true;
        } else {
          return false;
        }
      };

      
      const csrf = localStorage.getItem('csrfToken_rst_pwd');

      const customHeaders = {
        'x-csrf-token-rst-pwd': csrf,
        
      };


      const config = {
        headers: customHeaders,
        withCredentials: true, // Set withCredentials to true
      };


    const handleResetPasswordSubmit = async (e) => {
        e.preventDefault()
    
    
        const isRegexPass = await regexTest();
        
       
    
        if ( isRegexPass ) {
          
          try {
            e.preventDefault()
            const res = await axios.post(`${process.env.REACT_APP_backend_URL}/todo_app/reset_password`,
            inputResetPassword, config
            );
            
            alert(res.data.msg)
            if (res.data.url) {
              return navigate(res.data.url)
            }

            
    
            
            
          } catch (error) {
            alert("Something went wrong!")
            console.log("handleResetPasswordSubmit error",error)
          }
        } else {
          alert("Please match the requested format!")
          e.preventDefault()
        }
        
      }



  return (
    <div className='m-0 flex flex-col items-center justify-center min-h-[80vh]'>


        <div className='w-[26rem] border-2 border-black bg-zinc-900 px-4 py-4'>
            <p className='font-bold text-4xl text-center'> Reset Password </p>
            
            <form className='mt-4'>
                <div className=''>

                    <div className='form-col'>
                        <label htmlFor='password' className='form-label'>
                        New Password
                        </label>
                        <input
                        type='password'
                        className="form-input"
                        id='password'
                        value={inputResetPassword.password}
                        onChange={(e) => setInputResetPassword((prev)=>({...prev, password:e.target.value}))}
                        required
                        maxLength={20}
                        />
            
                    </div>
                    <div className='form-col'>
                        <label htmlFor='password' className='form-label'>
                        Confirm Password
                        </label>
                        <input
                        type='password'
                        className="form-input"
                        id='confirmpassword'
                        value={inputResetPassword.confirm_password}
                        onChange={(e) => setInputResetPassword((prev)=>({...prev, confirm_password:e.target.value}))}
                        required
                        maxLength={20}
                        />
            
                    </div>
                    <div className='mt-6'>
                        <button className='bg-zinc-600 hover:bg-zinc-400 py-2 px-4 rounded font-bold' type='submit' onClick={handleResetPasswordSubmit}> Submit </button>
                    </div>

                </div>

            </form>
            
        </div>

    </div>
  )
}

export default ResetPassword