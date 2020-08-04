import test from "ava"
import {Cmd, loop} from "redux-loop"

import reducer, {
  getContents,
  getPath,

  init,
  initSuccess,
  initFailure,

  getContentsSuccess,
  getContentsFailure,

  getPathSuccess,
  getPathFailure,
} from "../src/reducers"

test("handle INIT", t => {
  const r = reducer({}, init({path: "."}))

  t.deepEqual(r, loop(
    {currentPath: "."},
    Cmd.run(getContents, {
      successActionCreator: initSuccess,
      failActionCreator: initFailure,
      args: ["."],
    }),
  ))
})

test("handle INIT_SUCCESS", t => {
  const r = reducer({currentPath: "/mock/path"}, initSuccess({content: ["file1", "dir2"]}))

  t.deepEqual(r, loop(
    {currentPath: "/mock/path", currentDir: ["file1", "dir2"]},
    Cmd.run(getPath, {
      successActionCreator: getPathSuccess,
      failActionCreator: getPathFailure,
      args: [{path: "/mock/path", dir: ["file1", "dir2"]}],
    }),
  ))
})

test("handle GET_PATH_SUCCESS", t => {
  const r = reducer(
    {currentPath: "/mock/path", currentDir: ["file1", "dir2"]},
    getPathSuccess({
      currentPath: "/mock/path",
      parentPath: "/mock",
      childPath: "/mock/path/file1"}),
  )

  t.deepEqual(r, loop(
    {
      currentPath: "/mock/path",
      parentPath: "/mock",
      childPath: "/mock/path/file1",
      currentDir: ["file1", "dir2"]},
    Cmd.list([
      Cmd.run(getContents, {
        successActionCreator: getContentsSuccess,
        failActionCreator: getContentsFailure,
        args: ["/mock"],
      }),
      Cmd.run(getContents, {
        successActionCreator: getContentsSuccess,
        failActionCreator: getContentsFailure,
        args: ["/mock/path/file1"],
      }),
    ]),
  ))
})
