import {createReducer, createAction} from "@reduxjs/toolkit"
import {loop, Cmd} from "redux-loop"
import fs from "fs"

const toPromise = f => a => (
  new Promise((res, rej) => f(a, (err, fa) => err ? rej(err) : res(fa))))

const readDir = path => new Promise((res, rej) => {
  fs.readdir(path, (err, content) => {
    if (err) {
      rej(err)
    } else {
      res({content})
    }
  })
})

const readFile = path => new Promise((res, rej) => {
  fs.readFile(path, {encoding: "utf8"}, (err, content) => {
    if (err) {
      rej(err)
    } else {
      res({content})
    }
  })
})

const getStats = toPromise(fs.stat)

export async function getContents(path) {
  const stats = await getStats(path)
  const content = stats.isDirectory() ? await readDir(path) : await readFile(path)

  return content
}

export async function getPath({path, dir}) {
  const [childPath, parentPath] = await Promise.all([
    `${path}/${dir[0]}`,
    new Promise((res, rej) => fs.realpath(path, (err, resolvedPath) => (
      err ? rej(err) : res(resolvedPath.split("/").slice(0, -1).join("/"))))),
  ])

  return {
    currentPath: path,
    parentPath,
    childPath,
  }
}

export const init = createAction("INIT")
export const initSuccess = createAction("INIT_SUCCESS")
export const initFailure = createAction("INIT_FAILURE")
export const getPathSuccess = createAction("GET_PATH_SUCCESS")
export const getPathFailure = createAction("GET_PATH_FAILURE")

const initialState = {}
const reducer = createReducer(initialState, {
  INIT: (s, {payload: {path}}) => loop({...s, currentPath: path}, Cmd.run(getContents, {
    successActionCreator: initSuccess,
    failActionCreator: initFailure,
    args: [path],
  })),
  INIT_SUCCESS: (s, {payload: {content}}) => loop(
    {...s, currentDir: content},
    Cmd.run(getPath, {
      successActionCreator: getPathSuccess,
      failActionCreator: getPathFailure,
      args: [{path: s.currentPath, dir: content}],
    }),
  ),
  GET_PATH_SUCCESS: (s, {payload}) => ({...s, ...payload}),
})

export default reducer
