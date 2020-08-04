import {createAction} from "@reduxjs/toolkit"
import {loop, Cmd} from "redux-loop"
import fs from "fs"

function createReducer(initialState, handlers) {
  return function reducer(state = initialState, action) {
    // eslint-disable-next-line
    if (handlers.hasOwnProperty(action.type)) {
      return handlers[action.type](state, action)
    }

    return state
  }
}

const toPromise = f => a => (
  new Promise((res, rej) => f(a, (err, fa) => err ? rej(err) : res(fa))))

const readDir = toPromise(fs.readdir)
const readFile = toPromise((path, g) => fs.readFile(path, {encoding: "utf8"}, g))
const getStats = toPromise(fs.stat)

export async function getContents({path, key}) {
  const stats = await getStats(path)
  const content = stats.isDirectory() ? await readDir(path) : await readFile(path)

  return {[key]: content}
}

const getCurrentPath = path => path
const getParentPath = path => toPromise(fs.realpath)(path)
  .then(p => p.split("/").slice(0, -1).join("/"))
const getChildPath = path => dir => el => `${path}/${dir[el]}`

export async function getPath({path, dir, selected}) {
  const [currentPath, childPath, parentPath] = await Promise.all([
    getCurrentPath(path),
    getChildPath(path)(dir)(selected),
    getParentPath(path),
  ])

  return {
    currentPath,
    parentPath,
    childPath,
  }
}

export const init = createAction("INIT")
export const initSuccess = createAction("INIT_SUCCESS")
export const initFailure = createAction("INIT_FAILURE")
export const getContentsSuccess = createAction("GET_CONTENTS_SUCCESS")
export const getContentsFailure = createAction("GET_CONTENTS_FAILURE")
export const getPathSuccess = createAction("GET_PATH_SUCCESS")
export const getPathFailure = createAction("GET_PATH_FAILURE")

const runGetContents = args => Cmd.run(getContents, {
  successActionCreator: getContentsSuccess,
  failActionCreator: getContentsFailure,
  args,
})

const initialState = {currentSelected: 0}
const reducer = createReducer(initialState, {
  INIT: (s, {payload: {path}}) => loop(
    {...s, currentPath: path},
    Cmd.list([
      runGetContents([{path, key: "currentContent"}]),
      Cmd.action({type: "INIT_SUCCESS"})],
    {sequence: true}),
  ),
  INIT_SUCCESS: s => loop(
    s,
    Cmd.run(getPath, {
      successActionCreator: getPathSuccess,
      failActionCreator: getPathFailure,
      args: [{path: s.currentPath, dir: s.currentContent, selected: s.currentSelected}],
    }),
  ),
  GET_PATH_SUCCESS: (s, {payload}) => loop(
    {...s, ...payload},
    Cmd.list([
      runGetContents([{path: payload.parentPath, key: "parentContent"}]),
      runGetContents([{path: payload.childPath, key: "childContent"}]),
    ]),
  ),
  GET_CONTENTS_SUCCESS: (s, {payload}) => ({...s, ...payload}),
})

export default reducer
