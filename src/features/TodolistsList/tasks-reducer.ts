import {
    AddTaskArgType,
    TaskPriorities,
    TaskStatuses,
    TaskType,
    todolistsAPI,
    UpdateTaskArgType,
    UpdateTaskModelType,
    RemoveTaskArgType
} from 'api/todolists-api'
import {Dispatch} from 'redux'
import {AppThunk} from 'app/store'
import {handleServerAppError, handleServerNetworkError} from 'utils/error-utils'
import {appActions} from 'app/app-reducer';
import {todolistsActions, todolistThunk} from 'features/TodolistsList/todolists-reducer';
import {createSlice, PayloadAction, createAsyncThunk} from '@reduxjs/toolkit';
import {createAppAsyncThunk} from "../../utils/create-app-async-thunk";
import {ResultCode} from 'common/commom.enums';

const fetchTasks = createAppAsyncThunk<{ tasks: TaskType[], todolistId: string }, string>
('tasks/fetchTasks', async (todolistId, thunkAPI) => {
    const {dispatch, rejectWithValue} = thunkAPI
    try {
        dispatch(appActions.setAppStatus({status: 'loading'}))
        const res = await todolistsAPI.getTasks(todolistId)
        const tasks = res.data.items
        dispatch(appActions.setAppStatus({status: 'succeeded'}))
        return {tasks, todolistId}
    } catch (e) {
        handleServerNetworkError(e, dispatch)
        return rejectWithValue(null)
    }
})
const addTaskTC = createAppAsyncThunk<{ task: TaskType }, AddTaskArgType>
('tasks/addTasks', async (arg, thunkAPI) => {
    const {dispatch, rejectWithValue} = thunkAPI
    try {

        dispatch(appActions.setAppStatus({status: 'loading'}))
        const res = await todolistsAPI.createTask(arg.todolistId, arg.title)

        if (res.data.resultCode === ResultCode.Success) {
            const task = res.data.data.item
            dispatch(appActions.setAppStatus({status: 'succeeded'}))
            return {task}
        } else {
            handleServerAppError(res.data, dispatch);
            return rejectWithValue(null)
        }
    } catch (e) {
        handleServerNetworkError(e, dispatch)
        return rejectWithValue(null)
    }
})
const updateTask = createAppAsyncThunk<UpdateTaskArgType, UpdateTaskArgType>
('tasks/updateTask', async (arg, thunkAPI) => {
    const {dispatch, rejectWithValue, getState} = thunkAPI
    try {
        dispatch(appActions.setAppStatus({status: 'loading'}))
        const state = getState()
        const task = state.tasks[arg.todolistId].find(t => t.id === arg.taskId)
        if (!task) {
            dispatch(appActions.setAppError({error: 'Task not found'}))
            return rejectWithValue(null)
        }

        const apiModel: UpdateTaskModelType = {
            deadline: task.deadline,
            description: task.description,
            priority: task.priority,
            startDate: task.startDate,
            title: task.title,
            status: task.status,
            ...arg.domainModel
        }

        const res = await todolistsAPI.updateTask(arg.todolistId, arg.taskId, apiModel)
        if (res.data.resultCode === 0) {
            dispatch(appActions.setAppStatus({status: 'succeeded'}))
            return arg
        } else {
            handleServerAppError(res.data, dispatch);
            return rejectWithValue(null)
        }
    } catch (e) {
        handleServerNetworkError(e, dispatch)
        return rejectWithValue(null)
    }
})

const removetaskTc = createAppAsyncThunk<{ taskId: string, todolistId: string }, RemoveTaskArgType>('tasks/removeTask', async (arg, thunkAPI) => {
    const {dispatch, rejectWithValue} = thunkAPI
    try {
        dispatch(appActions.setAppStatus({status: 'loading'}))
        const res = await todolistsAPI.deleteTask(arg.todolistId, arg.taskId)
        if (res.data.resultCode === ResultCode.Success) {
            dispatch(appActions.setAppStatus({status: 'succeeded'}))
            return {taskId: arg.taskId, todolistId: arg.todolistId}
        } else {
            handleServerAppError(res.data, dispatch);
            return rejectWithValue(null)
        }


    } catch (e) {
        handleServerNetworkError(e, dispatch)
        return rejectWithValue(null)
    }
})
const initialState: TasksStateType = {}

const slice = createSlice({
    name: 'tasks',
    initialState,
    reducers: {
        removeTask: (state, action: PayloadAction<{ taskId: string, todolistId: string }>) => {

        },


    },
    extraReducers: builder => {
        builder
            .addCase(todolistsActions.addTodolist, (state, action) => {
                state[action.payload.todolist.id] = []
            })
            .addCase(todolistsActions.removeTodolist, (state, action) => {
                delete state[action.payload.id]
            })
            .addCase(todolistsActions.setTodolists, (state, action) => {
                action.payload.todolists.forEach((tl) => {
                    state[tl.id] = []
                })
            }).addCase(fetchTasks.fulfilled, (state, action) => {
            state[action.payload.todolistId] = action.payload.tasks
        }).addCase(addTaskTC.fulfilled, (state, action) => {
            const tasks = state[action.payload.task.todoListId]
            tasks.unshift(action.payload.task)
            console.log(action)
        }).addCase(updateTask.fulfilled, (state, action) => {
            const tasks = state[action.payload.todolistId]
            const index = tasks.findIndex(t => t.id === action.payload.taskId)
            if (index !== -1) {
                tasks[index] = {...tasks[index], ...action.payload.domainModel}
            }
        }).addCase(removetaskTc.fulfilled, (state, action)=> {
            const tasks = state[action.payload.todolistId]
            const index = tasks.findIndex(t => t.id === action.payload.taskId)
            if (index !== -1) tasks.splice(index, 1)
        }).addCase(todolistThunk.fetchTodolist.fulfilled, (state, action) => {
            action.payload.todolist.forEach((tl) => {
                state[tl.id] = []
            })
        })
    }
})

export const tasksReducer = slice.reducer
export const tasksActions = slice.actions
export const tasksThunks = {fetchTasks, addTaskTC, updateTask, removetaskTc}


export const removeTaskTC = (taskId: string, todolistId: string): AppThunk => (dispatch) => {
    todolistsAPI.deleteTask(todolistId, taskId)
        .then(res => {
            const action = tasksActions.removeTask({taskId, todolistId})
            dispatch(action)
        })
}


// types
export type UpdateDomainTaskModelType = {
    title?: string
    description?: string
    status?: TaskStatuses
    priority?: TaskPriorities
    startDate?: string
    deadline?: string
}
export type TasksStateType = {
    [key: string]: Array<TaskType>
}
