import { useEffect, useState } from "react"
import axios from "axios"
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import duration from 'dayjs/plugin/duration'
import { useDispatch } from 'react-redux'
import { updateTodo } from '../features/todo/todoSlice'

dayjs.extend(duration)
dayjs.extend(relativeTime)

const Edit = ({ currentTodo , data, setData , setEditing}) => {




  const [updateInfo, setUpdateInfo] = useState(currentTodo)
  const dispatch = useDispatch()
  
  

  
  const RemainingTime = () => {
    const [timeNow, setTimeNow] = useState(new Date())

    useEffect(()=> {
      const interval = setInterval(() => setTimeNow(new Date()), 60000);
      return () => {
        clearInterval(interval);
      };
    },[])
    
    //const timeNow = new Date()

    const start = dayjs(updateInfo.date_start);
    const end = dayjs(updateInfo.date_end)

   
    const date_time_project_duration = dayjs.duration(end.diff(start));
    const date_time_remaining = dayjs.duration(end.diff(timeNow));
    
    const date_time_project_duration_formatted = date_time_project_duration.format('D')+ " Days " +  date_time_project_duration.format('H') + " Hours "+ date_time_project_duration.format('m') +" Minutes" ;
    const date_time_remaining_formatted = date_time_remaining.format('D')+ " Days " +  date_time_remaining.format('H') + " Hours "+ date_time_remaining.format('m') +" Minutes left";
    

    return(
      <div>
        <div><p className="text-xl font-bold">Todo Duration</p> { updateInfo.date_end ? date_time_project_duration_formatted: null }</div>
        <div className="mt-4"> <p className="text-xl font-bold">Remaining Time From Now  </p> {updateInfo.date_end ? date_time_remaining_formatted :null}  </div>

        
      </div>
    )
  }
  
    
 

  
  const csrf = localStorage.getItem('csrfToken');

  const customHeaders = {
    'x-csrf-token': csrf,
    
  };


  const config = {
    headers: customHeaders,
    withCredentials: true, // Set withCredentials to true
  };
 
  
  
  
  const handleUpdate = async (e) => {
    
    //convert 2023-11-24T23:05:00.000Z to 2023-11-25T06:05 << the correct timestamp pattern to sql
    const update_data = {...updateInfo,date_start: updateInfo.date_start ? dayjs(updateInfo.date_start).format('YYYY-MM-DDTHH:mm') : updateInfo.date_start  , 
        date_end:  updateInfo.date_end ? dayjs(updateInfo.date_end).format('YYYY-MM-DDTHH:mm') : updateInfo.date_end }

    
    e.preventDefault()
    if (!updateInfo.title) {
      alert("Title can't be empty!")
    } else {
      try {
        await axios.put(`${process.env.REACT_APP_backend_URL}/todo_app/update_todo/` + currentTodo.todo_id, update_data , config);
        
        setData(prev => prev.map(item => item.todo_id === currentTodo.todo_id ?  update_data : item )) 
        dispatch(updateTodo(update_data))
        alert("Updated Successfully!")
        
      } catch (error) {
        
        console.log("update err", error)
        
        alert("There is an error, please refresh the page!")
      }
      setEditing(false)
      
      
    }

  }
  
  
    
    if (currentTodo) {
        return(
          <div className="item w-full flex gap-4 " key={currentTodo.todo_id}>
            
                <form className="w-full">
                  <div className="edit-content flex w-full justify-center">
                    <div className="flex flex-col max-w-[540px] h-auto ">
                      <div className="item-title-body">
                          <input
                          value={updateInfo.title} 
                          onChange={(e)=> setUpdateInfo({...updateInfo,title: e.target.value})}
                          className="form-input w-full h-full" 
                          maxLength="30" />
                          
                          
                      </div>
                      <div className="item-details ">
                          
                          <textarea 
                          value={updateInfo.details} 
                          onChange={(e)=> setUpdateInfo({...updateInfo,details: e.target.value})}
                          className="form-input w-full h-[20rem]"
                          maxLength="500"
                          />
                      </div>
                      <div className="flex w-full">
                        <div className="my-auto w-1/2 text-xl font-bold">
                          <p className={updateInfo.details.length === 500 ? "text-red-700":""}>{updateInfo.details.length}/500</p>
                        </div>
                        <div className="edit-button-desktop">
                          <button type="button" onClick={()=> setEditing(false)} className="text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 w-26 font-medium rounded-lg text-l px-5 py-2.5 mr-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 focus:outline-none dark:focus:ring-red-800">Cancel</button>
                          <button onClick={handleUpdate} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 w-26 font-medium rounded-lg text-l px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">Update</button>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4 pt-2 ml-2 w-full flex-col min-w-[12rem] max-w-[24rem] date-font">
                      <div className="start_date font-bold w-full">
                        <p className="bg-green-700 rounded-md text-center"> Date Start</p>
                        <input 
                        type="datetime-local"
                        value={updateInfo.date_start ? dayjs(updateInfo.date_start).format('YYYY-MM-DDTHH:mm'): ""}
                       
                       
                        onChange={(e)=> setUpdateInfo({...updateInfo,date_start: e.target.value})} 
                        className="text-black mt-4 text-center w-full"
                         />
                      </div>
                      <div className="end_date font-bold w-full">
                        <p className="bg-red-700 rounded-md text-center"> Date End</p>
                        <input 
                        type="datetime-local" 
                       
                        value={updateInfo.date_end ? dayjs(updateInfo.date_end).format('YYYY-MM-DDTHH:mm'): ""}
                        onChange={(e)=> setUpdateInfo({...updateInfo,date_end: e.target.value})} 
                        className="text-black mt-4 text-center w-full"
                        
                        />
                      </div>
                      
                      <div>
                         <RemainingTime /> 
                      </div>
                      <div className="edit-button-mobile ">
                          <button onClick={handleUpdate} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 w-26 font-medium rounded-lg text-l px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">Update</button>
                          <button type="button" onClick={()=> setEditing(false)} className="text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 w-26 font-medium rounded-lg text-l px-5 py-2.5 mr-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 focus:outline-none dark:focus:ring-red-800">Cancel</button>
                        </div>
                
                    </div>
                  </div>
                  
                </form>
              
            
            
          </div>
      
          
        )
      } 
}

export default Edit