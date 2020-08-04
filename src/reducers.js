import {createReducer, createAction} from "@reduxjs/toolkit"
import {loop, Cmd} from "redux-loop"

export const getDir = () => new Promise(r => r(1))

export const init = createAction("INIT")
export const initSuccess = createAction("INIT_SUCCESS")
export const initFailure = createAction("INIT_FAILURE")

const initialState = {}
const reducer = createReducer(initialState, {
  INIT: (s, path) => loop(s, Cmd.run(getDir, {
    successActionCreator: initSuccess,
    failActionCreator: initFailure,
  })),
})

export default reducer
