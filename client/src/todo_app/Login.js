import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import useClickOutside from './useClickOutside'
import { useNavigate } from 'react-router-dom';






//<-------------------------Start Signup Section ----------------------------------->
const SignUpForm = ( { refModal, isModalOpen,setModal ,setIsSignup, isSignup} ) => {
  

  const [inputValidation, setinputValidation] = useState({username: null, email: null, password: null, confirm_password: null})
  const signUpInitialValue = {username:"", email:"", password:"", confirm_password:""}
  const [inputSignup, setInputSignup] = useState(signUpInitialValue)
  const [isEmailAvailable, setEmailAvailable] = useState(null)
  const [isLoading, setIsLoading] = useState({isEmailAvailable:false})

  
  
  // Check Email available with debounce
  useEffect(() => {
    setIsLoading((prev)=> ({...prev, isEmailAvailable: true}))
    const debounceTimer = setTimeout(async () => {
      
      if (inputSignup.email.length > 0) {
        
        try {
          const res = await axios.post(
            `${process.env.REACT_APP_backend_URL}/is-email-available`,
            [inputSignup.email]
          );
          
          if (res.data.emailValidation) {
            setinputValidation((prev) => ({...prev, email: true}))
            setIsLoading((prev) => ({...prev, isEmailAvailable: false}))
          } else {
            setinputValidation((prev) => ({...prev, email: false}))
            setIsLoading((prev) => ({...prev, isEmailAvailable: false}))
          }
          setEmailAvailable(res.data.isEmailAvailable)
        } catch (error) {
          console.log("check email available error", error)
        } 
      }
    }, 1000);
  
    return () => clearTimeout(debounceTimer);
  }, [inputSignup.email]);
  /////////

  

//<-------------------------Regex Section ----------------------------------->

const regexTest = async () => {
  // Perform your regex test here
  const passTest = []
  const username_pattern = new RegExp("^[a-zA-Z0-9_]{8,20}$")
  const password_pattern = new RegExp(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9]{8,20}$/)
  const email_pattern = new RegExp(/^[a-zA-Z0-9.!#$%&'*+=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/)
  
  if ((!username_pattern.test(inputSignup.username))) {

    setinputValidation((prev)=>({...prev,username: false}))
    passTest.push(false)
  }
  
  if ((!password_pattern.test(inputSignup.password))) {
    setinputValidation((prev)=>({...prev,password: false}))
    passTest.push(false)
  } 

  if ((inputSignup.password !== inputSignup.confirm_password)) {
    setinputValidation((prev)=>({...prev,confirm_password: false}));
    passTest.push(false)
  }

  if ((!email_pattern.test(inputSignup.email))) {
    setinputValidation((prev)=>({...prev,email: false}))
    passTest.push(false)
  } 
  
  if (passTest.length === 0 && isEmailAvailable) {
    return true;
  } else {
    return false;
  }
};



//<-------------------------Regex Section ----------------------------------->  


  const handleSignupSubmit = async (e) => {
    e.preventDefault()

    const regex_result = await regexTest()
    

    if (regex_result) {
      
      try {
        e.preventDefault()
        const res = await axios.post(`${process.env.REACT_APP_backend_URL}/todo_app/signup`,
          inputSignup
        );

        if (res.data.msg) {
          alert(res.data.msg)
        } 
        handleCloseSignUpForm()
      } catch (error) {
        alert("Something went wrong!")
        console.log("sign up submit error", error)
      }
    } else {
      alert("Please match the requested format!")
      e.preventDefault()
    }
    
  }
  
  
    const handleCloseSignUpForm = () => {
      setModal(false);
      setIsSignup(false);
      setInputSignup(signUpInitialValue);
      setinputValidation({username: null, email: null, password: null, confirm_password: null})
      setEmailAvailable(null)
    }


    return (
    <div id="signupModal" className="modal" style={isModalOpen && isSignup ? {display: "block"}:{display: "none"}}>
      <div ref={refModal} className="modal-content-signup ">
        <div id="header" className='text-center'>
        <span className='text-2xl font-bold'>Sign up<span className="close rounded-lg" onClick={handleCloseSignUpForm}>&times;</span></span>
        
        <hr className='mt-4 border-2'/>
        </div>
        
        <div className=''>
        <form onSubmit={handleSignupSubmit} className='form w-full'>
          <div className='form-col'>
            <label htmlFor='username' className='form-label'>
              Username
            </label>
            <input
              type='text'
              id='username'
              className={`form-input ${inputValidation.username === false ? "border-2 border-rose-500 outline-none" : ""}` }
              value={inputSignup.username}
              onChange={(e) => setInputSignup({...inputSignup, username:e.target.value})}
              required
              maxLength={20}
              
            />
            <p className='text-rose-500' style={inputValidation.username === false? {display: "block"}:{display: "none"}} >Username must be between 8 and 20 characters long!</p>
          </div>
          <div className='form-col'>
            <label htmlFor='email' className='form-label'>
              Email
            </label>
            <input
              type='email'
              id='email'
              className=
              {`form-input ${inputValidation.email === false || isEmailAvailable === false ? "border-2 border-rose-500 outline-none" : ""} ${isEmailAvailable === true ? "border-2 border-green-500 outline-none": ""} 
              `}
              maxLength={50}
              value={inputSignup.email}
              onChange={(e) => setInputSignup({...inputSignup, email:e.target.value})}
              required
            />
            <p className='text-rose-500' style={!inputValidation.email && inputValidation.email !== null ? {display: "block"}:{display: "none"}} >Please match the requested format! Example: a@gmail.com </p>
            <p className='text-green-500' style={isEmailAvailable ?  {display: "block"}:{display: "none"}} > You can use this Email. </p>
            <p className='text-rose-500' style={!isEmailAvailable && isEmailAvailable !== null ? {display: "block"}:{display: "none"}} > Email is not available! Please choose a different Email. </p>
            
          </div>
          <div className='form-col'>
            <label htmlFor='password' className='form-label'>
              Password
            </label>
            <input
              type='password'
              className={`form-input ${inputValidation.password === false ? "border-2 border-rose-500 outline-none" : ""}` }
              id='password'
              value={inputSignup.password}
              onChange={(e) => setInputSignup({...inputSignup, password:e.target.value})}
              required
              maxLength={20}
              
              // title="Password must contain 8 or more characters that are of at least one number, and one uppercase and lowercase letter"
            />
            <p className='text-rose-500' style={inputValidation.password === false ? {display: "block"}:{display: "none"}} >Password must contain 8 or more characters that are of at least one number, and one uppercase and lowercase letter</p>
         
          </div>
          <div className='form-col'>
            <label htmlFor='confirm_password' className='form-label'>
              Confirm Password
            </label>
            <input
              type='password'
              className={`form-input ${inputValidation.confirm_password === false ? "border-2 border-rose-500 outline-none" : ""}` }
              id='confirm_password'
              value={inputSignup.confirm_password}
              onChange={(e) => setInputSignup({...inputSignup,confirm_password:e.target.value})}
              required
              maxLength={30}
            />

            <p className='text-rose-500 form-input-validation' style={inputValidation.confirm_password === false ? {display: "block"}:{display: "none"}} >Password and Confirm Password does not match!</p>
          
          </div>
          <div className='mt-2 flex gap-2 flex-wrap'>
          <button onClick={()=> {setIsSignup(false);setEmailAvailable(null)}} type="reset" className='form-button-login'>
            <p>Back to Login</p>
          </button>
          <button type='submit' className='form-button-signup' >
          <p>Sign up</p>
          </button>
          </div>
          
      </form>
        </div>
      </div>
  </div>
  )}

//<-------------------------End Signup Section ----------------------------------->

//<-------------------------Start Login Section ----------------------------------->
  const LoginForm = ({ refModal, isModalOpen, setModal, setIsSignup, setIsForgotPassword }) => {

    const navigate = useNavigate();
    const loginInitialValue = {email:"", password:""}
    const [inputLogin, setInputLogin] = useState(loginInitialValue)
    const [isLoading, setLoading] = useState(false)
    
    
    //<-------------------------Start Login Section ----------------------------------->

      // <-------------------------Start Sign in with google ----------------------------------->
        const handleCallbackGoogleResponse = async (response) => { 
          try {
            setLoading(true)
            const res = await axios.post(
              `${process.env.REACT_APP_backend_URL}/todo_app/login_google`,
              [response.credential], {withCredentials: true}
            );

            localStorage.setItem("csrfToken", res.data.csrf)
            setLoading(false)
            alert(res.data.msg)
            if (res.data.url) {
              return navigate(res.data.url)
            } 
            
          } catch (error) {
            alert("Sign in with google Error")
            setLoading(false)
            console.log("Sign in with google Error ",error)
          } 
        }

        useEffect(() => {
          /* global google */
            google.accounts.id.initialize({
              client_id: process.env.REACT_APP_GoogleOauthClientID,
              callback: handleCallbackGoogleResponse
            })
      
            google.accounts.id.renderButton(
              document.getElementById("g_id_onload"),
              { theme: "outline", size: "large"}
            );
          
        }, [])

        
      // <-------------------------End Sign in with google ----------------------------------->  
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true)
      e.preventDefault()
      const res = await axios.post(`${process.env.REACT_APP_backend_URL}/todo_app/login`,inputLogin, {withCredentials: true}
      );
      localStorage.setItem("csrfToken", res.data.csrf)
      setLoading(false)
      alert(res.data.msg)
      if (res.data.url) {
        return navigate(res.data.url)
      }
    } catch (error) {
      alert("Login Error")
      setLoading(false)
      console.log("handleLoginSubmit ",error)
    }

  }

    

  const handleCloseLoginForm = () => {
    setModal(false);
    setIsSignup(false);
    
  }

  const test_id = () => {
    setInputLogin({email:"a@b.com", password:"Testid1234"})
  }

  
  
//<-------------------------End Login Section ----------------------------------->


    return (
    <div id="loginModal" className="modal" style={isModalOpen === true ? {display: "block"}:{display: "none"}}>
      <div ref={refModal} className={`modal-content-login ${isLoading?"opacity-50":""}`}>
        <div id="header" className='text-center'>
        <span className='text-2xl font-bold'>Login<span className="close rounded-lg" onClick={handleCloseLoginForm}>&times;</span></span>
        
        <hr className='mt-4 border-2'/>
        </div>
        
        <div className=''>
        <form onSubmit={handleLoginSubmit} className='form'>
          <div className='form-col'>
            <label htmlFor='email' className='form-label'>
              Email
            </label>
            <input
              type='email'
              id='email'
              className="form-input"
              maxLength={50}
              value={inputLogin.email}
              onChange={(e) => setInputLogin((prev)=>({...prev,email:e.target.value}))}
              required
            />
          </div>
          <div className='form-col'>
            <label htmlFor='password' className='form-label'>
              Password
            </label>
            <input
              type='password'
              className="form-input"
              id='password'
              value={inputLogin.password}
              onChange={(e) => setInputLogin((prev)=>({...prev,password:e.target.value}))}
              required
              maxLength={20}
            />
            
          </div>
            <p onClick={()=> {setIsForgotPassword(true)}} className='mt-2 font-bold text-blue-500 underline underline-offset-4'>Forgot Password?</p>
          
          {/* start sign in with google button */}
          

          
          {/* ต้องแก้ ขึ้น production แก้ data-login_uri*/}

          
          <div id="g_id_onload"
            data-client_id="1076594326626-psi2cngubehu4pklo1jdqbho9ocgvcs1.apps.googleusercontent.com"
            data-context="signin"
            data-ux_mode="popup"
            data-callback="handleCallbackGoogleResponse"
            data-login_uri="http://localhost:3000"
            data-auto_prompt="false"
            className='pt-2'
            >
          </div>

          <div className="g_id_signin"
            data-type="standard"
            data-shape="rectangular"
            data-theme="outline"
            data-text="signin_with"
            data-size="large"
            data-logo_alignment="left">
          </div>
          
          

          {/* end sign in with google button */}

          
          
          <div className='mt-4 flex relative flex-wrap justify-between gap-2'>
            <div className='flex gap-2 flex-wrap'>
              <button type='submit' className='form-button-login'>
                <p>Login</p>
              </button>
              <button type="reset" onClick={()=> {setIsSignup(true)}} className=' form-button-signup'>
              <p>Sign up</p>
              </button>
            </div>
          
          
            <div className='right-0'>
              <button type="button" onClick={()=> test_id()} className=' form-button-signup'>
                <p>Test ID</p>
              </button>
            </div>
          </div>
      </form>
        </div>
        {isLoading && (
            <div className='loading-spinner-position'>
              <div className="spinner-border animate-spin border-black border-t-blue-600 " role="status">
              </div>
            </div>
            )}
      </div>
  </div> 
  )}

  
  
  // <-------------------------Start forgot password ----------------------------------->      

  const ForgotPasswordForm = ({ refModal, isModalOpen, setModal, setIsSignup, setIsForgotPassword, isForgotPassword }) => {

    const [inputForgotPassword, setInputForgotPassword] = useState({username: "", email:""})
    const [step, setStep] = useState("1")
    const [otp, setOTP] = useState(["","","","","",""])
    const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
    const [isLoading, setLoading] = useState(false)

    const navigate = useNavigate();
    
    
    //const [ForgotPasswordStep, setForgotPasswordStep] = useState("1")
    const regexTest = async () => {
      // Perform your regex test here
      

      const username_pattern = new RegExp("^[a-zA-Z0-9_]{8,20}$");
      const email_pattern = new RegExp(/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/)
      
      if ((username_pattern.test(inputForgotPassword.username)) && (email_pattern.test(inputForgotPassword.email))) {
        return true;
      } else {
        return false;
      }
    };

    const handleForgotPasswordSubmit_Step1 = async (e) => {
      e.preventDefault()

      setLoading(true);

      const isRegexPass = await regexTest();
      
      if (isRegexPass) {
            
            try {
              e.preventDefault()
              const res = await axios.post(`${process.env.REACT_APP_backend_URL}/todo_app/forgot_password`,
              inputForgotPassword, {withCredentials: true}
              );
              

              setLoading(false);

              if (res.data.status === "success") {
                alert(res.data.msg)
                setStep("2")
              } else {
                alert(res.data.msg)
              }
            
            } catch (error) {
              console.log("ForgotPasswordSubmit",error)
              alert("There is an error!")

            }

      } else {
        alert("Please match the requested format, check your username and email again!")
        setLoading(false);
    }

    }

    const handleForgotPasswordSubmit_Step2 = async (e) => {
      e.preventDefault()
      const otp_pattern = new RegExp('^[0-9]+$')
      const string_otp = otp.toString().replaceAll(",","")
      
      if ((otp_pattern.test(string_otp))) {
            try {
              e.preventDefault()
              
              const res = await axios.post(`${process.env.REACT_APP_backend_URL}/todo_app/verify_otp`,
              {otp: string_otp}, {withCredentials: true}
              );
              
              localStorage.setItem("csrfToken_rst_pwd", res.data.csrf)

              alert(res.data.msg)

              if (res.data.url) {
                return navigate(res.data.url)
              }

              
            
            } catch (error) {
              console.log("ForgotPasswordSubmit error",error)
              alert("There is an error!")

            }

        

      } else {
        alert("Please match the requested format, check your username and email again!")
    }

    }
    


    const handleInputChange = (e, index) => {
      const value = e.target.value;
      const newOtp = [...otp];
      newOtp[index] = value;
  
      setOTP(newOtp);
  
      if (value && index < otp.length - 1) {
        // If a value is entered (not Backspace) and not in the last input, move focus to the next input
        inputRefs[index + 1].current.focus();
      } else if (value === '' && index > 0) {
        // If Backspace is pressed and not in the first input, move focus to the previous input
        inputRefs[index - 1].current.focus();
      }
    };
  

    

    const handleCloseForgotPasswordForm = () => {
      setModal(false);
      setIsForgotPassword(false);
      
      
    }


    return ( <>
              {/* step 1 username and email form */}

              

            {step == 1 ?  <div id="signupModal" className="modal" style={isModalOpen && isForgotPassword ? {display: "block"}:{display: "none"}}>
              <div ref={refModal} className="modal-content-signup ">
                <div id="header" className='text-center'>
                  <span className='text-2xl [@media(max-width:330px)]:text-lg font-bold'>Forgot Password
                  <span className="close rounded-lg [@media(max-width:330px)]:text-lg" onClick={handleCloseForgotPasswordForm}>&times;</span></span>
                
                  <hr className='mt-4 border-2'/>
                </div>
                
                <div className=''>
                <form onSubmit={handleForgotPasswordSubmit_Step1} className='form w-full'>

                  <div className='form-col'>
                    <label htmlFor='email' className='form-label'>
                      Username
                    </label>
                    <input
                      type='name'
                      id='name'
                      className="form-input"
                      maxLength={20}
                      value={inputForgotPassword.username}
                      onChange={(e) => setInputForgotPassword({...inputForgotPassword, username:e.target.value})}
                      required
                    />
                  
                    
                  </div>
                  
                  <div className='form-col'>
                    <label htmlFor='email' className='form-label'>
                      Email
                    </label>
                    <input
                      type='email'
                      id='email'
                      className="form-input"
                      maxLength={50}
                      value={inputForgotPassword.email}
                      onChange={(e) => setInputForgotPassword({...inputForgotPassword, email:e.target.value})}
                      required
                    />
                    
                  </div>

                  
                  
                  
                  <div className='mt-6 flex gap-2 flex-wrap'>
                  <button onClick={()=> {setIsForgotPassword(false)}} type="reset" className='form-button-login'>
                    <p>Back to Login</p>
                  </button>
                  <button type='submit' className='form-button-signup' >
                  <p>Next</p>
                  </button>
                  </div>
                  
              </form>
                </div>
                    

              </div>
              {isLoading && (
                  <div className='loading-spinner-position z-10'>
                    <div className="spinner-border animate-spin border-black border-t-blue-600" role="status">
                    </div>
                  </div>
                    )}
            </div> : 
            
            <div id="signupModal" className="modal" style={isModalOpen && isForgotPassword && step == 2 ? {display: "block"}:{display: "none"}}>
              {/* step 2 otp form */}
              
              <div ref={refModal} className="modal-content-signup ">
                <div id="header" className='text-center'>
                  <span className='text-2xl font-bold'>Enter OTP<span className="close rounded-lg" onClick={handleCloseForgotPasswordForm}>&times;</span></span>
                
                  <hr className='mt-4 border-2'/>
                </div>
                
                <div className='mt-3'>
                <form onSubmit={handleForgotPasswordSubmit_Step2} className='form w-full'>
                  <p htmlFor='email' className='form-label text-justify'>
                            To complete reset your password, please enter the OTP numbers that we've sent to your Email.
                  </p>

                  
                  <div className='flex gap-2 justify-center mt-4 w-full'>
                      
                      {otp.map((currentValue, index) => (
                      <input
                        key={index}
                        type="text"
                        value={currentValue}
                        maxLength="1"
                        className="bg-zinc-700 focus:bg-neutral-900 mt-2 rounded h-14 w-full max-w-[3rem] min-w-[1.35rem] text-center font-bold text-3xl"
                        onChange={(e) => handleInputChange(e, index)}
                        ref={inputRefs[index]}
                      />
                    ))}

                      
                  </div>
                  <div className='flex justify-center mt-6 '>
                      
                      
                      <div className='flex gap-2 flex-wrap'>
                        <button onClick={()=> {setIsForgotPassword(false)}} type="reset" className='form-button-login'>
                          <p>Back to Login</p>
                        </button>
                        <button type='submit' className=' form-button-signup' >
                        <p>Next</p>
                        </button>
                      </div>
                  </div>
                  
              </form>
                </div>
              </div>
            </div>}
    </>
      
    )
  }


// <-------------------------End forgot password -----------------------------------> 
 
// <-------------------------Start Login Main -----------------------------------> 
const Login = () => {

  const refModal = useRef();
  const [isSignup, setIsSignup] = useState(false);
  const [isModalOpen, setModal] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  
//<------------------------- Start Handle Click Outside Section -----------------------------------> 

    
useClickOutside({ ref: refModal, isModalOpen: isModalOpen, handler: () => {setModal(false);setIsSignup(false);setIsForgotPassword(false); }});
  
    

//<------------------------- End Handle Click Outside Section  -----------------------------------> 



  return (
    <div className='h-screen content'>
      <div className='welcome-TodoApp text-welcome flex justify-center'>
        Hi, Welcome to ToDoApp
      </div>
      <div>
      <div className='text-2xl w-full'> 👉 Click the button to login Todo App 👉
      <button id="openmodal" onClick={()=> setModal(true)} className="btnGray">Login</button>
      
      </div>
      
      
      
      {(isModalOpen && !isSignup && !isForgotPassword) && ( <LoginForm refModal={refModal} isModalOpen={isModalOpen} setModal={setModal}  
      setIsSignup={setIsSignup} setIsForgotPassword={setIsForgotPassword} /> )}
      
      {(isModalOpen && isSignup) && ( <SignUpForm refModal={refModal} isModalOpen={isModalOpen} 
      setIsSignup={setIsSignup} setModal={setModal} isSignup={isSignup} /> )
      }

      {isModalOpen && isForgotPassword && ( <ForgotPasswordForm refModal={refModal} isModalOpen={isModalOpen} 
      setIsForgotPassword={setIsForgotPassword} setModal={setModal} isForgotPassword={isForgotPassword} /> )
      }

        </div>
        
    </div>
  );
};

// <-------------------------End Login Main -----------------------------------> 
export default Login;
