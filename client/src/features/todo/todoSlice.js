import { createSlice } from "@reduxjs/toolkit"

const initialState = {
    todos: [],
}
//ทำต่อ หาทางแยก fetchTodo ( data from fetch => {username: "test", data:[{todo_id: 1, title: 'test', details: 'test message', date_start: null, date_end: null, user_id: 1 }]} )
// กับ addTodo 
//fetch todo ได้แล้ว
export const todoSlice = createSlice({
    name: 'todo',
    initialState,
    reducers: {
        fetchTodo: (state, action) => {
            
            return {
                 todo: [action.payload]
            }
        },
        addTodo: (state, action) => {
            return {
                
                todo: state.todo.map(obj => ({
                    ...obj,
                    todos: [...obj.todos, action.payload]
                }))
            }
            
        },
        updateTodo: (state, action) => {
            //code to see whole console.log object in state redux
            //console.log('state.todo:', JSON.stringify(state.todo, null, 2));
            return {
                    todo: state.todo.map(obj => ({
                    ...obj,
                    todos:obj.todos.map((todo_item) => { if (todo_item.todo_id === action.payload.todo_id) {
                        return action.payload;
                    } else {
                        return todo_item;
                    }})
                }))
            }

        
            
        },
        removeTodo: (state, action) => {
            
            //console.log("todo ", JSON.stringify(state, null, 2))
            return {
                
                todo: state.todo.map(obj => ({
                  ...obj,
                  todos: obj.todos.filter(todo => todo.todo_id !== action.payload),
                })),
              };
            
            
            
            
        }
    }
})

export const { fetchTodo, addTodo, updateTodo, removeTodo  } = todoSlice.actions
export default todoSlice.reducer

