import {createReducer, createAction} from "@reduxjs/toolkit"
import {loop, Cmd} from "redux-loop"
import fs from "fs"

export const getDir = path => new Promise((res, rej) => {
  fs.readDir(path, (err, dir) => {
    if (err) {
      rej(err)
    } else {
      res({dir})
    }
  })
})

export const init = createAction("INIT")
export const initSuccess = createAction("INIT_SUCCESS")
export const initFailure = createAction("INIT_FAILURE")

const initialState = {}
const reducer = createReducer(initialState, {
  INIT: (s, {payload: {path}}) => loop(s, Cmd.run(getDir, {
    successActionCreator: initSuccess,
    failActionCreator: initFailure,
    args: [path],
  })),
})

export default reducer
