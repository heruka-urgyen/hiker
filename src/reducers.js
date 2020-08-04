import {createReducer, createAction} from "@reduxjs/toolkit"
import {loop, Cmd} from "redux-loop"
import fs from "fs"

const toPromise = f => a => (
  new Promise((res, rej) => f(a, (err, fa) => err ? rej(err) : res(fa))))

const readDir = toPromise(fs.readdir)
const readFile = toPromise((path, g) => fs.readFile(path, {encoding: "utf8"}, g))
const getStats = toPromise(fs.stat)

export async function getContents(path) {
  const stats = await getStats(path)
  const content = stats.isDirectory() ? await readDir(path) : await readFile(path)

  return {content}
}

export async function getPath({path, dir}) {
  const [childPath, parentPath] = await Promise.all([
    `${path}/${dir[0]}`,
    toPromise(fs.realpath)(path).then(p => p.split("/").slice(0, -1).join("/")),
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
  INIT: (s, {payload: {path}}) => loop(
    {...s, currentPath: path},
    Cmd.run(getContents, {
      successActionCreator: initSuccess,
      failActionCreator: initFailure,
      args: [path],
    }),
  ),
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
