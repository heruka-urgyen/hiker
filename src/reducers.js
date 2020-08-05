import {createAction} from "@reduxjs/toolkit"
import {loop, Cmd} from "redux-loop"
import fs from "fs"
import {basename, resolve, dirname} from "path"
import {isBinary} from "istextorbinary"

function createReducer(initialState, handlers) {
  return function reducer(state = initialState, action) {
    // eslint-disable-next-line
    if (handlers.hasOwnProperty(action.type)) {
      return handlers[action.type](state, action)
    }

    return state
  }
}

const readDir = async path => {
  try {
    const dir = await fs.promises.readdir(path)

    if (dir.length === 0) {
      return "(Empty)"
    }

    return dir
  } catch (e) {
    if (e.code === "EACCES") {
      return "(Not Accessible)"
    }

    throw e
  }
}

const readFile = async path => {
  try {
    if (isBinary(path)) {
      return "(Binary)"
    }

    const file = await fs.promises.readFile(path, {encoding: "utf8"})

    if (file.length === 0) {
      return "(Empty)"
    }

    return file
  } catch (e) {
    if (e.code === "EACCES") {
      return "(Not Accessible)"
    }

    throw e
  }
}

const getStats = fs.promises.stat

export const getContents = async ({path, key}) => {
  const stats = await getStats(path)
  const content = stats.isDirectory() ? await readDir(path) : await readFile(path)

  return {[key]: content}
}

const getCurrentPath = resolve
const getParentPath = path => dirname(resolve(path))
export const getChildPath = path => dir => el => resolve(path, dir[el])

export const getPath = ({path, dir, selected}) => {
  const [currentPath, childPath, parentPath] = [
    getCurrentPath(path),
    getChildPath(path)(dir)(selected),
    getParentPath(path),
  ]

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
export const selectItem = createAction("SELECT_ITEM")

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
  GET_CONTENTS_SUCCESS: (s, {payload}) => {
    const {parentContent} = payload
    if (parentContent) {
      return {
        ...s,
        ...payload,
        parentSelected: parentContent.indexOf(basename(s.currentPath)),
      }
    }

    return {
      ...s,
      ...payload,
    }
  },
  SELECT_ITEM: (s, {payload: {currentSelected}}) => loop(
    {...s, currentSelected},
    Cmd.run(getChildPath, {
      successActionCreator: getPathSuccess,
      failActionCreator: getPathFailure,
      args: [{path: s.currentPath, dir: s.currentContent, selected: currentSelected}],
    }),
  ),
})

export default reducer
