import React from "react";
import { useState, useEffect, useRef } from "react";
import axios from "axios";

import { IoMdAddCircleOutline } from "react-icons/io";
import { GiNotebook } from "react-icons/gi";
import { BsThreeDots } from "react-icons/bs";
import { CgProfile } from "react-icons/cg";

import { useNavigate } from "react-router-dom";
import Add from "./Add";
import Edit from "./Edit";
import { Link } from "react-router-dom";

import { useDispatch } from "react-redux";

import { fetchTodo } from "../features/todo/todoSlice";
import { removeTodo } from "../features/todo/todoSlice";
import useClickOutside from "./useClickOutside";
import { AnimatePresence, motion } from "framer-motion";
import { Squash as Hamburger } from "hamburger-react";

const CustomMotionLi = ({ idx, children }) => {
  return (
    <motion.li
      className="flex flex-row pt-3"
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


const TodoApp = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  
  const [username, setUsername] = useState("");
  const [data, setData] = useState([]);

  const [isEditing, setEditing] = useState(false);
  const [currentTodo, setCurrentTodo] = useState(null);

  
  const currentThreeDots2 = useRef();
  const [isThreeDotsModalOpen, setThreeDotsModal] = useState(false);
  const threeDotsRef = useRef([]);

  const [isProfileButtonModalOpen, setProfileButtonModal] = useState(false);
  const profileBtnRef = useRef();

  const [isTodoSidebarOpen, setTodoSidebar] = useState(false);
  const todoSidebarRef = useRef();

 

 

  const [isAddModalOpen, setAddModal] = useState(false);
  const addModalRef = useRef();
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const csrf = localStorage.getItem("csrfToken");
  const customHeaders = {
    "x-csrf-token": csrf,
  };

  const config = {
    headers: customHeaders,
    withCredentials: true, // Set withCredentials to true
  };

  useEffect(() => {
    const authentication = async () => {
      try {
        
        const res = await axios.get(
          `${process.env.REACT_APP_backend_URL}/authentication`,
          config
        );
        if (res.data.csrf) {
          localStorage.setItem("csrfToken", res.data.csrf);
        }
        const data = { user_name: res.data.user_name, todos: res.data.data };
        //console.log("res.data", res.data)
        dispatch(fetchTodo(data));

        if (res.data.user_name) {
          setUsername(res.data.user_name);
        }
        //if there is no todo item.

        if (Array.isArray(res.data.data) && res.data.data.length === 0) {
          setError("There is no todo item.");
        }
        //if there are items
        else {
          setData(res.data.data);
        }
      } catch (err) {
        if (err.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          if (err.response.status === 401) {
            // handle unauthorized error
            alert("You're not authenticated!");
            navigate("/login");
          } else {
            //console.log("bad request")
            setError(err.code);
          }
        } else if (err.request) {
          // The request was made but no response was received
          // handle network error
          console.log("Network Error", err.message);
          setError(err.message);
        } else {
          // Something happened in setting up the request that triggered an Error
          setError(err.code);
          console.log("Error", err);
        }
      }
    };
    authentication();
  }, []);

  

  const handleThreedots = (index) => {
    currentThreeDots2.current = index;
    
    if (isThreeDotsModalOpen && index === currentThreeDots2.current) {
      setThreeDotsModal(false);
    } else {
      setThreeDotsModal((prev) => !prev);
    }
  };

  
  useClickOutside({
    ref: profileBtnRef,
    isModalOpen: isProfileButtonModalOpen,
    handler: () => setTimeout(() => {
      setProfileButtonModal(false)
    }, 100)
  });
  useClickOutside({
    ref: addModalRef,
    isModalOpen: isAddModalOpen,
    handler: () => setAddModal(false),
  });
  useClickOutside({
    ref: threeDotsRef,
    isModalOpen: isThreeDotsModalOpen,
    handler: () => setThreeDotsModal(false),
    index: currentThreeDots2.current,
  });

  
  useClickOutside({
    ref: todoSidebarRef,
    isModalOpen: isTodoSidebarOpen,
    handler: () => setTimeout(() => {
        setTodoSidebar(false)
      }, 100),
  });

  // handler: () => setTimeout(() => {
  //   setTodoSidebar(false)
  // }, 0),
  

  // Delete section
  const handleClickDelete = async (todo_id) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_backend_URL}/todo_app/delete_todo/` + todo_id,
        config
      );

      dispatch(removeTodo(todo_id));
      const updatedData = data.filter((item) => item.todo_id !== todo_id);
      setData(updatedData);
      alert("Deleted Successfully!");

      setTodoSidebar(false)
      setThreeDotsModal(false);
      setEditing(false);
    } catch (err) {
      console.log("try catch delete error", err);
      alert(err.response.data.msg);
      setEditing(false);
      setThreeDotsModal(false);
      setTodoSidebar(false)
    }
  };

 

  const logout = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_backend_URL}/todo_app/logout`,
        config
      );
      alert(res.data);
      navigate("/login");
    } catch (error) {
      alert("error");
      console.log("logout error", error);
    }
  };

  

  return (
    <div className="content pt-2">
      <div className="flex leading-relaxed font-bold relative [font-size:_clamp(1.25rem,5vw,2.25rem)] justify-between items-center">
        <div className="text-center">Welcome to ToDoApp, {username}</div>
        
        <div
          className="relative px-2 py-2 ml-2 "
          onClick={() => setProfileButtonModal(true)}
        >
          <CgProfile
            size={48}
            className="h-full hover:bg-zinc-800 cursor-pointer"
          />
          {isProfileButtonModalOpen && (
            <div
              className="profile-btn absolute -left-36 text-xl rounded-lg z-20"
              ref={profileBtnRef}
            >
              <ul className="flex flex-col gap-2 min-w-[11rem] w-full bg-black rounded-xl">
                <Link to="/editprofile">
                  {" "}
                  <li className="pl-2 hover:bg-slate-700 cursor-pointer rounded-lg">
                    Edit Profile
                  </li>
                </Link>
                <li
                  className="pl-2 hover:bg-slate-700 cursor-pointer rounded-lg"
                  onClick={() => logout()}
                >
                  {" "}
                  Logout
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
      <div className="flex mt-1 ">
        <div className="todolist-sidebar-desktop">
          <div className="addTodo flex justify-center">
            <button
              className=" bg-sky-500 hover:bg-sky-700 rounded mt-2"
              onClick={() => setAddModal(true)}
            >
              <p className="font-bold text-xl py-2 px-4 flex">
                New Todo{" "}
                <span className="pl-2">
                  <IoMdAddCircleOutline className="" size={30} />
                </span>
              </p>
            </button>
          </div>
          <div className="mt-3">
            {isLoading && (
              <div className="loading-spinner flex justify-center">
                <div
                  className="spinner-border animate-spin inline-block w-8 h-8 border-4 border-black border-t-blue-600 rounded-full"
                  role="status"
                ></div>
              </div>
              )}

            {data.length > 0 ? (
              <div className="items ">
                {data.map((todo, index) => (
                  <div
                    className="flex flex-row bg-neutral-700 bg-opacity-50 mt-4 group hover:bg-neutral-600 items-center"
                    style={{ cursor: "pointer" }}
                    key={todo.todo_id}
                  >
                    <div
                      className="basis-1/12 pt-1"
                      onClick={() => {setCurrentTodo(todo); setEditing(true);}}
                    >
                      <GiNotebook size={30} />{" "}
                    </div>
                    <div
                      className="item-title-sidebar basis-10/12 "
                      onClick={() => {setCurrentTodo(todo); setEditing(true);}}
                    >
                      <p className="pl-2 break-all">{todo.title}</p>
                    </div>

                    <div
                      className="relative invisible group-hover:visible hover:hover:bg-neutral-400 rounded-md"
                      style={
                        isThreeDotsModalOpen &&
                        index === currentThreeDots2.current
                          ? { visibility: "visible" }
                          : {}
                      }
                      ref={(el) => (threeDotsRef.current[index] = el)}
                    >
                      <BsThreeDots
                        size={20}
                        onClick={() => [handleThreedots(index)]}
                      />

                      {isThreeDotsModalOpen && index === currentThreeDots2.current && (
                      <div className="threedotsmodal absolute w-32 -left-28 bg-stone-900">
                        <ul className="ThreeDotsDropdown">
                          <li
                            className=""
                            onClick={() => [handleClickDelete(todo.todo_id)]}
                          >
                            Delete
                          </li>
                        </ul>
                      </div>)}
                      
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="break-all">{error}</div>
            )}
          </div>
        </div>
        <div className="todolist-sidebar-mobile z-10 mt-2 w-full min-w-[6rem] [@media(width<330px)]:min-w-[5rem]">
          <div className=" bg-blue-900 font-bold py-1 rounded-xl flex w-full h-12 px-1" 
          
          onClick={() => setTodoSidebar(true)}
          
          >
            <p className="[font-size:_clamp(1rem,5vw,1.25rem)]">Todo</p>
            <div
            >
              <Hamburger
                toggled={isTodoSidebarOpen}
                size={18}
              />
            </div>
          </div>
          <AnimatePresence>
          {isTodoSidebarOpen && (
            <motion.div className='hamburger-nav-list' initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            >
            <div className="min-w-[16rem] bg-[#0F0F0F] rounded-xl" ref={todoSidebarRef} >
              <div className="addTodo flex justify-center">
                <button
                  className=" bg-sky-500 hover:bg-sky-700 rounded mt-2"
                  onClick={() => {setAddModal(true);setTodoSidebar(false)}}
                >
                  <p className="font-bold text-xl py-2 px-4 flex">
                    New Todo{" "}
                    <span className="pl-2">
                      <IoMdAddCircleOutline className="" size={30} />
                    </span>
                  </p>
                </button>
              </div>
              <div className="mt-3">
                {isLoading && (
                  <div className="loading-spinner flex justify-center">
                    <div
                      className="spinner-border animate-spin inline-block w-8 h-8 border-4 border-black border-t-blue-600 rounded-full"
                      role="status"
                    ></div>
                  </div>
                )}

                {data.length > 0 ? (
                  <div className="items ">
                    <ul className="">
                    {data.map((todo, index) => (
                      <CustomMotionLi
                        className=""
                        style={{ cursor: "pointer" }}
                        key={todo.todo_id}
                        idx={index}
                      >
                        <div
                          className="basis-1/12 pt-1 pl-2"
                          onClick={() => {
                            setCurrentTodo(todo);
                            setEditing(true);
                            setTodoSidebar(false);}
                          }
                        >
                          <GiNotebook size={30} />{" "}
                        </div>
                        <div
                          className="item-title-sidebar basis-10/12 "
                          onClick={() => {
                            setCurrentTodo(todo);
                            setEditing(true);
                            setTodoSidebar(false);
                          }
                          }
                        >
                          <p className="pl-2 break-all">{todo.title}</p>
                        </div>

                        <div
                          className="relative basis-1/12 my-2 px-2 rounded-md items-center "
                          ref={(el) => (threeDotsRef.current[index] = el)}
                        >
                          <BsThreeDots
                            size={20}
                            onClick={() => [handleThreedots(index)]}
                            
                          />
                          {(isThreeDotsModalOpen && index === currentThreeDots2.current) && (
                          <div className="threedotsmodal absolute w-32 -left-28 bg-stone-900">
                            <ul className="ThreeDotsDropdown">
                              <li
                                className=""
                                onClick={() => 
                                  handleClickDelete(todo.todo_id)
                                }
                              >
                                Delete
                              </li>
                            </ul>
                          </div>
                        )}
                          
                        </div>
                      </CustomMotionLi>
                    ))}
                    </ul>
                  </div>
                ) : (
                  <div className="break-all">{error}</div>
                )}
              </div>
            </div>
            </motion.div>
          )}
          </AnimatePresence>

          {/* <div className="addTodo flex justify-center">
          <button className=' bg-sky-500 hover:bg-sky-700 rounded mt-2' onClick={()=> setAddModal(true)}>
            <p className='font-bold text-xl py-2 px-4 flex'>New Todo <span className='pl-2'><IoMdAddCircleOutline className='' size={30} /></span></p> 
            </button> 
        </div>
        <div className="mt-3">
          {isLoading ? 
            <div className='loading-spinner flex justify-center'>
              <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 border-black border-t-blue-600 rounded-full" role="status">
              </div>
            </div>
          : null } 
          {data.length > 0 ? 
          <div className="items " >
            {data.map((todo , index)=> (
              
              <div  className="flex flex-row bg-neutral-700 bg-opacity-50 mt-4 group hover:bg-neutral-600"   style={{cursor: "pointer"}} key={todo.todo_id}>
                <div className='basis-1/12 pt-1' onClick={()=> [setCurrentTodo(todo),setEditing(true)]} ><GiNotebook size={30} /> </div>
                <div className="item-title-sidebar basis-10/12 " onClick={()=>  [setCurrentTodo(todo),setEditing(true)]} >
                <p className='pl-2 break-all'>{todo.title}</p>
                </div>
                
                <div className="relative basis-1/12 my-2 pl-0.5 invisible group-hover:visible hover:hover:bg-neutral-400 rounded-md" 
                 
                style={(isThreeDotsModalOpen) && (index === currentThreeDots2.current) ? {visibility:"visible"}:{} }
                
                
                ref={(el)=>threeDotsRef.current[index] = el}  
                >
                <BsThreeDots size={20} onClick={()=>[handleThreedots(index)]}/>
                <div className ="threedotsmodal hidden absolute w-32 -left-28 bg-stone-900" style={(isThreeDotsModalOpen) && (index === currentThreeDots2.current) ?  {display:"block"}:{}} >
                  <ul className="ThreeDotsDropdown">
                  <li className="" onClick={()=> [handleClickDelete(todo.todo_id)]}>Delete</li>
                  </ul>
                </div>
                  
                </div>

                
                

              </div>
              
            ))}
          </div> 
          : <div className='break-all'>{error}</div>}
          
        </div> */}
        </div>
        <div className="todolist-content flex w-full">
          {isEditing && (
            <Edit
              key={currentTodo.todo_id}
              currentTodo={currentTodo}
              data={data}
              setData={setData}
              setEditing={setEditing}
            />
          )}
        </div>

        {isAddModalOpen ? (
          <Add
            setData={setData}
            isAddModalOpen={isAddModalOpen}
            setAddModal={setAddModal}
            addModalRef={addModalRef}
            setError={setError}
          />
        ) : null}
      </div>

      
    </div>
  );
};

export default TodoApp;
