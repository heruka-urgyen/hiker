import {createAction} from "@reduxjs/toolkit"
import {loop, Cmd} from "redux-loop"
import fs from "fs"
import {spawn} from "child_process"
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

const isDir = async path => {
  const stats = await fs.promises.stat(path)
  return stats.isDirectory()
}

export const getContents = async ({path, key}) => {
  const isDirectory = await isDir(path)
  const content = isDirectory ? await readDir(path) : await readFile(path)

  return {[key]: content, isDirectory}
}

const getCurrentPath = path => ({currentPath: resolve(path)})
export const getParentPath = ({path}) => ({parentPath: dirname(resolve(path))})
export const getChildPath =
  ({path, dir, selected}) => ({childPath: resolve(path, dir[selected])})

export const getPath = ({path, dir, selected}) => {
  const [{currentPath}, {childPath}, {parentPath}] = [
    getCurrentPath(path),
    getChildPath({path, dir, selected}),
    getParentPath({path}),
  ]

  return {
    currentPath,
    parentPath,
    childPath,
  }
}

const open = (app, path) => new Promise((res, rej) => {
  const c = spawn(app, [path], {stdio: "inherit", env: process.env})
  c.on("exit", res)
  c.on("error", rej)
})

export const openFile = async ({filePath}) => {
  process.stdin.pause()

  if (isBinary(filePath)) {
    await open("xdg-open", filePath)
  } else {
    await open("vim", filePath)
  }

  process.stdin.resume()
}

export const init = createAction("INIT")
export const initSuccess = createAction("INIT_SUCCESS")
export const initFailure = createAction("INIT_FAILURE")
export const getContentsSuccess = createAction("GET_CONTENTS_SUCCESS")
export const getContentsFailure = createAction("GET_CONTENTS_FAILURE")
export const selectItem = createAction("SELECT_ITEM")
export const goBack = createAction("GO_BACK")
export const goForward = createAction("GO_FORWARD")
export const openFileSuccess = createAction("OPEN_FILE_SUCCESS")
export const openFileFailure = createAction("OPEN_FILE_FAILURE")

const runGetContents = args => Cmd.run(getContents, {
  successActionCreator: getContentsSuccess,
  failActionCreator: getContentsFailure,
  args,
})

const initialState = {
  currentSelected: 0,
  childSelected: 0,
  parentContent: [],
  currentContent: [],
  childContent: [],
}

const reducer = createReducer(initialState, {
  INIT: (s, {payload: {path}}) => loop(
    {...s, currentPath: path},
    Cmd.list([
      runGetContents([{path, key: "currentContent"}]),
      Cmd.action({type: "INIT_SUCCESS"})],
    {sequence: true}),
  ),
  INIT_SUCCESS: s => {
    const {
      currentPath,
      parentPath,
      childPath,
    } = getPath({path: s.currentPath, dir: s.currentContent, selected: s.currentSelected})

    return loop({
      ...s,
      currentPath,
      parentPath,
      childPath,
    }, Cmd.list([
      runGetContents([{path: parentPath, key: "parentContent"}]),
      runGetContents([{path: childPath, key: "childContent"}]),
    ]))
  },
  GET_CONTENTS_SUCCESS: (s, {payload}) => {
    const {parentContent, currentContent, childContent, isDirectory} = payload

    if (parentContent) {
      return {
        ...s,
        parentContent,
        parentSelected: parentContent.indexOf(basename(s.currentPath)),
      }
    }

    if (childContent) {
      return {
        ...s,
        childContent,
        childContentType: isDirectory ? "directory" : "file",
      }
    }

    return {...s, currentContent}
  },
  SELECT_ITEM: (s, {payload: {currentSelected}}) => {
    const {childPath} = getChildPath({
      path: s.currentPath,
      dir: s.currentContent,
      selected: currentSelected,
    })

    return loop({
      ...s,
      childPath,
      currentSelected,
    }, runGetContents([{path: childPath, key: "childContent"}]))
  },
  GO_BACK: s => loop({
    ...s,
    currentPath: s.parentPath,
    currentContent: s.parentContent,
    currentSelected: s.parentSelected,
    childPath: s.currentPath,
    childContent: s.currentContent,
    childSelected: s.currentSelected,
    ...getParentPath({path: s.parentPath}),
  }, runGetContents([{
    path: getParentPath({path: s.parentPath}).parentPath,
    key: "parentContent"}])),
  GO_FORWARD: s => {
    const isDirectory = s.childContentType === "directory"

    if (isDirectory) {
      const {childPath} = getChildPath({
        path: s.childPath,
        dir: s.childContent,
        selected: s.childSelected,
      })

      return loop({
        ...s,
        currentPath: s.childPath,
        currentContent: s.childContent,
        currentSelected: s.childSelected,
        parentPath: s.currentPath,
        parentContent: s.currentContent,
        parentSelected: s.currentSelected,
        childPath,
      }, runGetContents([{path: childPath, key: "childContent"}]))
    }

    return loop(s, Cmd.run(openFile, {
      successActionCreator: openFileSuccess,
      failActionCreator: openFileFailure,
      args: [{filePath: s.childPath}],
    }))
  },
})

export default reducer
