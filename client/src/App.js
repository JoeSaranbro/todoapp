
import { BrowserRouter, Routes, Route, Navigate   } from 'react-router-dom';
import SharedLayout from './SharedLayout';
import Login from './todo_app/Login';
import Portfolio from './Portfolio';
import  Portfolio2  from "./Portfolio_2";
import TodoApp from "./todo_app/TodoApp";


import NotFound from './NotFound';
import EmailVerificationPage from './todo_app/Email_Verification_Page';
import EmailVerificationSuccess from './todo_app/Email_Verification_Success';
import ErrorPage from './Error_Page';
import ResetPassword from './todo_app/ResetPassword';
import EditProfile from './todo_app/EditProfile';


function App() {
  
   
  
  return (
    <div className="w-full h-full flex flex-col box-border">
       <BrowserRouter>
      <Routes>
      <Route path='/'  element={<SharedLayout />} >
        
         
        
          <Route index path="portfolio"   element={<Portfolio />} />
            <Route path='portfolio_2'    element={<Portfolio2 />} />
            <Route path="/" element={<Navigate replace to="/portfolio" />}  /> 

            
            <Route path='todoapp' element={<TodoApp />} /> 
            <Route path='login' element={<Login />} />
            
            
            
            
            <Route path='Error_Page' element={<ErrorPage />} />  

            <Route path='Email_Verification_Page' element={<EmailVerificationPage />} />  
            <Route path='Email_Verification_Success' element={<EmailVerificationSuccess />} />

            <Route path='resetpassword' element={<ResetPassword />} />
            <Route path='editprofile' element={<EditProfile />} />    
            

            
            
            
         </Route>
         <Route path='*'         element={<NotFound />} />
         
      </Routes>
      </BrowserRouter> 
      
      

      

    </div>
      
    
  );
}



export default App;
