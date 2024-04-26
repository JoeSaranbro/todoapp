import React, { useEffect } from 'react'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AiOutlineArrowLeft } from 'react-icons/ai'
import { useSelector } from 'react-redux'

const ChangePasswordForm = ({ setIsChangePasswordOpen}) => {
  const [inputProfile, setInputProfile] = useState({action:"password", old_password:"", new_password:"", confirm_password:""})

  const csrf = localStorage.getItem('csrfToken');
    const customHeaders = {
    'x-csrf-token': csrf,
    
  };
  const navigate = useNavigate();

    const config = {
      headers: customHeaders,
      withCredentials: true, // Set withCredentials to true
    };


  const regexTest = async () => {
    // Perform your regex test here
    
    
    const password_pattern = new RegExp(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9]{8,20}$/)
    
    
    if ((password_pattern.test(inputProfile.old_password)) && (password_pattern.test(inputProfile.new_password))) {
      return true;
    } else {
      return false;
    }
  };


  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault()
    const isRegexPass = await regexTest();
    if ((isRegexPass) &&  (inputProfile.new_password === inputProfile.confirm_password)) {

        if (inputProfile.old_password === inputProfile.new_password) {
          return alert("New password can't be the same as your old password.")
        }
        
      try {
        e.preventDefault()
        
        const res = await axios.post(`${process.env.REACT_APP_backend_URL}/todo_app/edit_profile`,
        inputProfile, config
        );
        
        //กรณี update password success จะredirectไปที่ login
        if (res.data.status === "success" && res.data.url) {
          alert(res.data.msg)
          return navigate(res.data.url)
        }
        //กรณี update password fail อาจจะ auth token หมดอายุพอดี จะredirectไปที่ todoapp เพื่อรับ auth token ใหม่
        else if (res.data.status === "fail" && res.data.url) {
          alert(res.data.msg)
          return navigate(res.data.url)
        }
        //กรณี old password ผิด, ไม่ต้อง redirect แค่แสดง alertแล้วให้กรอกpasswordใหม่
        else if(res.data.msg) {
          alert(res.data.msg)
        }
        
      } catch (error) {
        console.log("handleChangePasswordSubmit",error)
        alert("There is an error!")
      }

    } else {
      alert("Please match the requested format!")
    }
    
  }

  return(
        <>
          <form className='w-full max-w-[26rem]'>
            <div className='w-full border-2 border-black bg-zinc-900 px-4 py-4'>
            <div className='flex items-center'>
               <button onClick={()=> setIsChangePasswordOpen(false)}> <AiOutlineArrowLeft size="30px"/> </button> 
               <p className='font-bold text-4xl text-center flex-1'> Edit Profile</p> 
              
              
              
            </div>
            
                <div className='password-input mt-2'>
                    <div className='flex gap-3 h-10 '>
                        <label htmlFor='password' className='text-sm font-bold w-[150px] py-3'>
                        old password
                        </label>
                        <div className='flex gap-3 w-full '>
                          <input
                          type='password'
                          className="form-input grow"
                          
                          value={inputProfile.old_password}
                          onChange={(e) => setInputProfile((prev)=>({...prev, old_password:e.target.value}))}
                          required
                          maxLength={20}
                          />
                          
                          
                        </div>
                    </div>
                    <div className='flex gap-3 h-10 '>
                        <label htmlFor='password' className='text-sm font-bold w-[150px] py-3'>
                        new password
                        </label>
                        <div className='flex gap-3 w-full '>
                          <input
                          type='password'
                          className="form-input grow"
                          
                          value={inputProfile.new_password}
                          onChange={(e) => setInputProfile((prev)=>({...prev, new_password:e.target.value}))}
                          required
                          maxLength={20}
                          />
                          
                          
                        </div>
                    </div>
                    <div className='flex gap-3 h-10'>
                        <label htmlFor='password' className='text-sm font-bold w-[150px] py-1'>
                        confirm password
                        </label>
                        <div className='flex gap-3 w-full '>
                          <input
                          type='password'
                          className="form-input grow"
                          
                          value={inputProfile.confirm_password}
                          onChange={(e) => setInputProfile((prev)=>({...prev, confirm_password:e.target.value}))}
                          required
                          maxLength={20}
                          />
                          
                          
                        </div>
                    </div>

                </div>
                <div className='flex justify-center gap-3 pt-1'>
                  <button className='w-20 h-8 bg-red-600 hover:bg-red-400 mt-3  rounded font-bold' onClick={()=>setIsChangePasswordOpen(false)}> Cancel </button>
                  <button className='w-20 h-8 bg-sky-600 hover:bg-sky-400 mt-3  rounded font-bold' onClick={handleChangePasswordSubmit}> Submit </button>
                </div>
                
            </div>
          </form>
        </>
  )
}

const UnameEmailForm = ({ isChangePasswordOpen, setIsChangePasswordOpen}) => {

  const selector_todos_username = useSelector(state=> state.todo?.[0]?.user_name)
  
  
  const [inputProfile, setInputProfile] = useState({action:"username",username: selector_todos_username ? selector_todos_username: "" })
  
  const csrf = localStorage.getItem('csrfToken');
    const customHeaders = {
    'x-csrf-token': csrf,
    
  };
  const navigate = useNavigate();


    const config = {
      headers: customHeaders,
      withCredentials: true, // Set withCredentials to true
    };


  const regexTest = async () => {
    // Perform your regex test here
    

    const username_pattern = new RegExp("^[a-zA-Z0-9_]{8,20}$")
    
    
    if ((username_pattern.test(inputProfile.username))) {
      return true;
    } else {
      return false;
    }
  };

  const handleChangeUsernameSubmit = async (e) => {
    e.preventDefault()
    const isRegexPass = await regexTest();
    if (isRegexPass) {
      
            
      try {
        e.preventDefault()
        
        const res = await axios.post(`${process.env.REACT_APP_backend_URL}/todo_app/edit_profile`,
        inputProfile, config
        );
        

        

        if (res.data.status === "success" && res.data.url) {
          alert(res.data.msg)
          return navigate(res.data.url)
        } else {
          alert(res.data.msg)
        }
      
      } catch (error) {
        console.log("handleChangePasswordSubmit",error)
        alert("There is an error!")

      }

} else {
  alert("Please match the requested format!")
}
    
  }

  return (
    <>
      <div className='w-full max-w-[26rem] border-2 border-black bg-zinc-900 px-4 py-4'>
          
            <p className='font-bold text-4xl text-center'> Edit Profile</p>
                <div className='username-input pt-2'>

                    <div className='flex gap-3 '>
                        <label htmlFor='username' className='text-sm font-bold max-w-[4rem] pt-2'>
                        Username
                        </label>
                        <div className='flex gap-3 w-full'>
                          <input
                          type='text'
                          className="form-input grow w-full"
                          id='username'
                          value={inputProfile.username}
                          onChange={(e) => setInputProfile({...inputProfile, username:e.target.value})}
                          required
                          maxLength={20}
                          />
                          
                          <button className='w-14 h-8 bg-sky-600 hover:bg-sky-400 mt-2  rounded font-bold' onClick={handleChangeUsernameSubmit}>Save</button>
                        </div>
                        
                        
            
                    </div>

                </div>
                <div className='username-input pt-2'>

                    <div className='flex gap-3 '>
                        <label htmlFor='username' className='text-sm font-bold w-16 pt-3'>
                        Password
                        </label>
                        <div className='flex gap-3 w-full '>
                          <button className='h-8 bg-zinc-600 hover:bg-zinc-400 mt-2  rounded font-bold w-full' onClick={()=>setIsChangePasswordOpen(true)}>Change Password</button>
                        </div>
                        
                        
            
                    </div>

                </div>
      </div>
    </>
  )
}


const EditProfile = () => {
    
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)

    return (
      <div className='w-full m-0 flex flex-col items-center justify-center min-h-[80vh]'>
        {/* {(!isChangePasswordOpen) && (<UnameEmailForm isChangePasswordOpen={isChangePasswordOpen} setIsChangePasswordOpen={setIsChangePasswordOpen} />)} */}
        {(isChangePasswordOpen ? (<ChangePasswordForm setIsChangePasswordOpen={setIsChangePasswordOpen} />): (<UnameEmailForm isChangePasswordOpen={isChangePasswordOpen} setIsChangePasswordOpen={setIsChangePasswordOpen} />) )}
        

    </div>
    )
}

export default EditProfile