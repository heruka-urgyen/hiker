import test from "ava"
import {Cmd, loop} from "redux-loop"

import reducer, {
  getContents,
  getPath,

  init,
  initSuccess,

  getContentsSuccess,
  getContentsFailure,

  getPathSuccess,
  getPathFailure,
} from "../src/reducers"

test("handle INIT", t => {
  const r = reducer({}, init({path: "."}))

  t.deepEqual(r, loop(
    {currentPath: "."},
    Cmd.list([
      Cmd.run(getContents, {
        successActionCreator: getContentsSuccess,
        failActionCreator: getContentsFailure,
        args: [{path: ".", key: "currentContent"}],
      }),
      Cmd.action({type: "INIT_SUCCESS"}),
    ], {sequence: true}),
  ))
})

test("handle INIT_SUCCESS", t => {
  const r = reducer(
    {currentPath: "/mock/path", currentContent: ["file1", "dir2"]},
    initSuccess(),
  )

  t.deepEqual(r, loop(
    {currentPath: "/mock/path", currentContent: ["file1", "dir2"]},
    Cmd.run(getPath, {
      successActionCreator: getPathSuccess,
      failActionCreator: getPathFailure,
      args: [{path: "/mock/path", dir: ["file1", "dir2"]}],
    }),
  ))
})

test("handle GET_PATH_SUCCESS", t => {
  const r = reducer(
    {currentPath: "/mock/path", currentContent: ["file1", "dir2"]},
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
      currentContent: ["file1", "dir2"]},
    Cmd.list([
      Cmd.run(getContents, {
        successActionCreator: getContentsSuccess,
        failActionCreator: getContentsFailure,
        args: [{path: "/mock", key: "parentContent"}],
      }),
      Cmd.run(getContents, {
        successActionCreator: getContentsSuccess,
        failActionCreator: getContentsFailure,
        args: [{path: "/mock/path/file1", key: "childContent"}],
      }),
    ]),
  ))
})
