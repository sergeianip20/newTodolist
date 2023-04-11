import React, {useCallback, useEffect} from 'react'
import {useSelector} from 'react-redux'
import {AppRootStateType} from 'app/store'
import {
    addTodolistTC,
    changeTodolistTitleTC,
    fetchTodolistsTC,
    FilterValuesType,
    removeTodolistTC,
    TodolistDomainType, todolistsActions
} from './todolists-reducer'
import {tasksThunks, removeTaskTC, TasksStateType, } from './tasks-reducer'
import {TaskStatuses} from 'api/todolists-api'
import {Grid, Paper} from '@mui/material'
import {AddItemForm} from 'components/AddItemForm/AddItemForm'
import {Todolist} from './Todolist/Todolist'
import {Navigate} from 'react-router-dom'
import {useAppDispatch} from 'hooks/useAppDispatch';
import {selectIsLoggedIn} from 'features/auth/auth.selectors';
import {selectTasks} from "./task.selectors";
import {selectTodolist} from "./todolist.selectors";

type PropsType = {
    demo?: boolean
}

export const TodolistsList: React.FC<PropsType> = ({demo = false}) => {
    const todolists = useSelector(selectTodolist)
    const tasks = useSelector(selectTasks)
    const isLoggedIn = useSelector(selectIsLoggedIn)

    const dispatch = useAppDispatch()

    useEffect(() => {
        if (demo || !isLoggedIn) {
            return;
        }
        const thunk = fetchTodolistsTC()
        dispatch(thunk)
    }, [])

    const removeTask = useCallback(function (taskId: string, todolistId: string) {
        dispatch(tasksThunks.removetaskTc({taskId, todolistId}))
    }, [])

    const addTask = useCallback(function (title: string, todolistId: string) {
        dispatch(tasksThunks.addTaskTC({title, todolistId}))
    }, [])

    const changeStatus = useCallback(function (taskId: string, status: TaskStatuses, todolistId: string) {
        dispatch(tasksThunks.updateTask({taskId, domainModel: {status}, todolistId}))
    }, [])

    const changeTaskTitle = useCallback(function (taskId: string, newTitle: string, todolistId: string) {
        dispatch(tasksThunks.updateTask({taskId, domainModel: {title:newTitle}, todolistId}))
    }, [dispatch])

    const changeFilter = useCallback(function (filter: FilterValuesType, id: string) {
        dispatch(todolistsActions.changeTodolistFilter({id, filter}))
    }, [])

    const removeTodolist = useCallback(function (id: string) {
        dispatch(removeTodolistTC(id))
    }, [])

    const changeTodolistTitle = useCallback(function (id: string, title: string) {
        dispatch(changeTodolistTitleTC(id, title))
    }, [])

    const addTodolist = useCallback((title: string) => {
        dispatch(addTodolistTC(title))
    }, [dispatch])

    if (!isLoggedIn) {
        return <Navigate to={"/login"}/>
    }

    return <>
        <Grid container style={{padding: '20px'}}>
            <AddItemForm addItem={addTodolist}/>
        </Grid>
        <Grid container spacing={3}>
            {
                todolists.map(tl => {
                    let allTodolistTasks = tasks[tl.id]

                    return <Grid item key={tl.id}>
                        <Paper style={{padding: '10px'}}>
                            <Todolist
                                todolist={tl}
                                tasks={allTodolistTasks}
                                removeTask={removeTask}
                                changeFilter={changeFilter}
                                addTask={addTask}
                                changeTaskStatus={changeStatus}
                                removeTodolist={removeTodolist}
                                changeTaskTitle={changeTaskTitle}
                                changeTodolistTitle={changeTodolistTitle}
                                demo={demo}
                            />
                        </Paper>
                    </Grid>
                })
            }
        </Grid>
    </>
}
