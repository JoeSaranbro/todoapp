import React from 'react'
import { useState } from 'react'
import axios from 'axios'
import { useDispatch } from 'react-redux'
import { addTodo } from '../features/todo/todoSlice'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import duration from 'dayjs/plugin/duration'


dayjs.extend(duration)
dayjs.extend(relativeTime)


const Add = ({  setData, isAddModalOpen, setAddModal, addModalRef, setError}) => {
  
  const [userInput , setUserInput] = useState({title: "", details: "", date_start: null, date_end: null})
  const dispatch = useDispatch()

  
  const handleInputOnchange = (e) => {
    setUserInput((prev)=> ({...prev , [e.target.name]: e.target.value}))
    
    
  }

  const closeAddModal = () => {
    setAddModal(false);
}

const csrf = localStorage.getItem('csrfToken');


const customHeaders = {
  'x-csrf-token': csrf,
  
};


const config = {
  headers: customHeaders,
  withCredentials: true, // Set withCredentials to true
};

  const handleClickAdd = async (e) => {
    //console.log("userInput",userInput)
    
    if (!userInput.title) {
      alert("Todo title must be filled.")
      e.preventDefault();
    } else {
        try {
          e.preventDefault();
          const data = {...userInput,date_start: userInput.date_start ? dayjs(userInput.date_start).format('YYYY-MM-DDTHH:mm') : userInput.date_start, 
          date_end:  userInput.date_end ? dayjs(userInput.date_end).format('YYYY-MM-DDTHH:mm') : userInput.date_end }

          const res = await axios.post(`${process.env.REACT_APP_backend_URL}/todo_app/add_todo`, data, config);
          
          const newSortedData = {todo_id: res.data, ...data}
          
          if(res.data){
            
            dispatch(addTodo(newSortedData))
            setData((prev) => [...prev, newSortedData])
            alert("Added Successfully!")
          } //Catch there is no todo item.
          else{
            setError("Error!")
            alert("Failed to add item!")
          }
          setAddModal(false);
        } catch (err) {
          console.log("add err", err);
          alert("Failed to add item!")
          setAddModal(false);
          //setUserInput(initialTodoInput)
          e.preventDefault();
        }
        
    }
        
  }

    
  return (
  <div id="" className="modal" >
    <div ref={addModalRef} className="add-modal max-w-[34rem] bg-zinc-900 rounded-lg m-auto p-3">
      <div id="header" className='text-center'>
      <span className='text-2xl font-bold'>New Todo<span className="close rounded-lg" onClick={closeAddModal} >&times;</span></span>
      
      <hr className='mt-4 border-2'/>
      </div>
      
      <div className=' '>
      <form className='form'>
        <div className=' '>
        <div className='form-col border-2 border-white focus-within:border-blue-600 rounded-lg mt-2 px-2 py-1.5 h-full'>
          <label htmlFor='todoname' className='form-label'>
            Todo Name
          </label>
          <input
            type='text'
            id='todoname'
            className='form-input'
            name="title"
            maxLength="30"
           // value={userInput.title}
            onChange={handleInputOnchange}
            
          />
        </div>
        <div className="h-[20rem]">
          <div className="flex flex-col border-2 border-white focus-within:border-blue-600 rounded-lg mt-2 px-2 py-1.5 h-full">
            <label htmlFor="firstName" className="text-white text-md font-bold">Details</label>
            <textarea  
            id="TodoDetails"
            type="text"
            name="details"
           // value={userInput.details}
            onChange={handleInputOnchange}
            maxLength="500"
            className="form-input h-full"
            ></textarea>
          </div>
        </div>
        <div className="date-time-mobile flex gap-2 pt-4  w-full ">
            <div className="start_date font-bold w-full">
              <p className="bg-green-700 rounded-md text-center w-full"> Date Start</p>
              <input 
              type="datetime-local"
              value={userInput.date_start ? dayjs(userInput.date_start).format('YYYY-MM-DDTHH:mm'): ""}
              
              
              onChange={(e)=> setUserInput({...userInput,date_start: e.target.value})} 
              className="text-black mt-4 text-center w-full "
                />
            </div>
            <div className="end_date font-bold w-full">
              <p className="bg-red-700 rounded-md text-center w-full"> Date End</p>
              <input 
              type="datetime-local" 
              
              value={userInput.date_end ? dayjs(userInput.date_end).format('YYYY-MM-DDTHH:mm'): ""}
              onChange={(e)=> setUserInput({...userInput,date_end: e.target.value})} 
              className="text-black mt-4 text-center w-full"
              
              />
            </div>
                      
                      
                
        </div>

        <div className="flex pt-1">
           <div className="w-1/2 my-auto text-xl font-bold"><p className={Object.keys(userInput.details).length === 500 ? "text-red-700":""}>{Object.keys(userInput.details).length}/500</p>
           </div> 
            <div className="flex justify-end pt-2 w-1/2">
                <button type='button' className="text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-blue-300 w-26 font-medium rounded-lg text-l px-5 py-2.5 mr-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 focus:outline-none dark:focus:ring-red-800" onClick={closeAddModal}><p>Cancle</p></button>
                <button onClick={handleClickAdd}  className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 w-26 font-medium rounded-lg text-l px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"><p>Add</p></button>
            </div>
        </div>
        
      </div>
    </form>
      </div>
    </div>
</div>
)}

export default Add


