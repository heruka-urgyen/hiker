import {createAction} from "@reduxjs/toolkit"
import {loop, Cmd} from "redux-loop"
import fs from "fs"
import {spawn} from "child_process"
import {basename, resolve, dirname} from "path"
import {isBinary} from "istextorbinary"

const getType = stat => {
  if (stat.isDirectory()) {
    return "directory"
  }

  if (stat.isSymbolicLink()) {
    return "symlink"
  }

  return "file"
}

const getStats = (stat) => {
  const isDir = stat.isDirectory()

  return {
    type: getType(stat),
    size: isDir ? "" : stat.size,
  }
}

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
    const content = await fs.promises.readdir(path)
      .then(dir => Promise.all(dir.map(p => fs.promises.lstat(`${path}/${p}`).then(stat => ({
        content: p,
        ...getStats(stat),
      })).catch(_ => ({content: p, type: "file", size: 0})))))
      .then(dir => dir.sort((x, y) => x.type.localeCompare(y.type)))

    if (content.length === 0) {
      return {type: "directory", content: "(Empty)", size: ""}
    }

    return {type: "directory", content, size: ""}
  } catch (e) {
    if (e.code === "EACCES") {
      return {type: "directory", content: "(Not Accessible)", size: ""}
    }

    throw e
  }
}

const readFile = async (path, stat) => {
  try {
    const maybeBinary = isBinary(path)
    if (maybeBinary) {
      return {type: "file", content: "(Binary)", size: stat.size}
    }

    if (maybeBinary == null) {
      return {type: "file", content: "(Not Accessible)", size: 0}
    }

    const file = await fs.promises.readFile(path, {encoding: "utf8"})

    if (file.length === 0) {
      return {type: "file", content: "(Empty)", size: 0}
    }

    return {type: "file", content: file, size: stat.size}
  } catch (e) {
    if (e.code === "EACCES") {
      return {type: "file", content: "(Not Accessible)", size: 0}
    }

    throw e
  }
}

export const getContents = async ({path, key}) => {
  const stat = await fs.promises.lstat(path).catch(_ => ({isDirectory: () => false, size: 0}))
  const content = stat.isDirectory() ? await readDir(path) : await readFile(path, stat)

  return {[key]: content}
}

const getCurrentPath = path => ({currentPath: resolve(path)})
export const getParentPath = ({path}) => ({parentPath: dirname(resolve(path))})
export const getChildPath =
  ({path, dir, selected}) => ({childPath: resolve(path, dir[selected].content)})

export const getPath = ({path, dir, selected}) => {
  const [{currentPath}, {childPath}, {parentPath}] = [
    getCurrentPath(path),
    getChildPath({path, dir: dir.content, selected}),
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
  parentContent: {content: []},
  currentContent: {content: []},
  childContent: {content: []},
  parentSize: 0,
  currentSize: 0,
  childSize: 0,
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
    const {parentContent, currentContent, childContent} = payload

    if (parentContent) {
      return {
        ...s,
        parentContent,
        parentSelected: parentContent.content.findIndex(
          p => p.content === basename(s.currentPath),
        ),
      }
    }

    if (childContent) {
      return {
        ...s,
        childContent,
      }
    }

    return {...s, currentContent}
  },
  SELECT_ITEM: (s, {payload: {currentSelected}}) => {
    const {childPath} = getPath({
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
    const isDirectory = s.childContent.type === "directory"

    if (isDirectory) {
      const {childPath} = getPath({
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
