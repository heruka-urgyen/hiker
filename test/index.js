import test from "ava"
import {Cmd, loop} from "redux-loop"

import reducer, {
  getContents,
  getChildPath,
  getParentPath,
  openFile,

  init,
  initSuccess,

  getContentsSuccess,
  getContentsFailure,

  getPathSuccess,

  getPathFailure,
  selectItem,
  goBack,
  goForward,

  openFileSuccess,
  openFileFailure,
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

test("handle current GET_CONTENTS_SUCCESS", t => {
  const r = reducer(
    {currentPath: "/mock/path"},
    getContentsSuccess({currentContent: ["file1", "dir2"], isDirectory: true}),
  )

  t.deepEqual(r, {
    currentContent: ["file1", "dir2"],
    currentPath: "/mock/path",
  })
})

test("handle parent GET_CONTENTS_SUCCESS", t => {
  const r = reducer(
    {currentPath: "/mock/path", currentContent: ["file1", "dir2"], parentPath: "/mock"},
    getContentsSuccess({parentContent: ["path0", "path", "path1"], isDirectory: true}),
  )

  t.deepEqual(r, {
    currentContent: ["file1", "dir2"],
    currentPath: "/mock/path",
    parentPath: "/mock",
    parentContent: ["path0", "path", "path1"],
    parentSelected: 1,
  })
})

test("handle child GET_CONTENTS_SUCCESS", t => {
  const r = reducer(
    {currentPath: "/mock/path", currentContent: ["file1", "dir2"], parentPath: "/mock"},
    getContentsSuccess({childContent: ["file1", "file2"], isDirectory: true}),
  )

  t.deepEqual(r, {
    currentContent: ["file1", "dir2"],
    currentPath: "/mock/path",
    parentPath: "/mock",
    childContent: ["file1", "file2"],
    childContentType: "directory",
  })
})

test("handle INIT_SUCCESS", t => {
  const r = reducer({
    currentPath: "/mock/path",
    currentContent: ["file1", "dir2"],
    currentSelected: 0},
  initSuccess())

  t.deepEqual(r, loop({
    childPath: "/mock/path/file1",
    parentPath: "/mock",
    currentPath: "/mock/path",
    currentContent: ["file1", "dir2"],
    currentSelected: 0,
  }, Cmd.list([
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
  ])))
})

// test("handle GET_PATH_SUCCESS", t => {
//   const r = reducer(
//     {currentPath: "/mock/path", currentContent: ["file1", "dir2"]},
//     getPathSuccess({
//       currentPath: "/mock/path",
//       parentPath: "/mock",
//       childPath: "/mock/path/file1"}),
//   )
//
//   t.deepEqual(r, loop(
//     {
//       currentPath: "/mock/path",
//       parentPath: "/mock",
//       childPath: "/mock/path/file1",
//       currentContent: ["file1", "dir2"]},
//     Cmd.list([
//       Cmd.run(getContents, {
//         successActionCreator: getContentsSuccess,
//         failActionCreator: getContentsFailure,
//         args: [{path: "/mock", key: "parentContent"}],
//       }),
//       Cmd.run(getContents, {
//         successActionCreator: getContentsSuccess,
//         failActionCreator: getContentsFailure,
//         args: [{path: "/mock/path/file1", key: "childContent"}],
//       }),
//     ]),
//   ))
// })

test("handle SELECT_ITEM", t => {
  const r = reducer({
    currentPath: "/mock/path",
    parentPath: "/mock",
    childPath: "/mock/path/file1",
    currentContent: ["file1", "dir2"]},
  selectItem({currentSelected: 1}))

  t.deepEqual(r, loop(
    {
      currentPath: "/mock/path",
      parentPath: "/mock",
      childPath: "/mock/path/dir2",
      currentSelected: 1,
      currentContent: ["file1", "dir2"]},
    Cmd.run(getContents, {
      successActionCreator: getContentsSuccess,
      failActionCreator: getContentsFailure,
      args: [{path: "/mock/path/dir2", key: "childContent"}],
    }),
  ))
})

test("handle GO_BACK", t => {
  const r = reducer({
    currentPath: "/mock/path",
    parentPath: "/mock",
    childPath: "/mock/path/file1",
    currentContent: ["file1", "dir2"],
    parentContent: ["path0", "path"],
    childContent: ["dir1", "dir2"],
    currentSelected: 0,
    parentSelected: 1,
    childSelected: 0,
  }, goBack())

  t.deepEqual(r, loop({
    childPath: "/mock/path",
    currentPath: "/mock",
    childContent: ["file1", "dir2"],
    currentContent: ["path0", "path"],
    currentSelected: 1,
    childSelected: 0,
    parentPath: "/",
    parentContent: ["path0", "path"],
    parentSelected: 1,
  }, Cmd.run(getContents, {
    successActionCreator: getContentsSuccess,
    failActionCreator: getContentsFailure,
    args: [{path: "/", key: "parentContent"}],
  })))
})

test("handle GO_FORWARD to dir", t => {
  const r = reducer({
    currentPath: "/mock/path",
    parentPath: "/mock",
    childPath: "/mock/path/dir1",
    currentContent: ["file1", "dir2"],
    parentContent: ["path0", "path"],
    childContent: ["dir1", "dir2"],
    currentSelected: 1,
    parentSelected: 1,
    childSelected: 0,
    childContentType: "directory",
  }, goForward())

  t.deepEqual(r, loop({
    currentPath: "/mock/path/dir1",
    parentPath: "/mock/path",
    childPath: "/mock/path/dir1/dir1",
    currentContent: ["dir1", "dir2"],
    parentContent: ["file1", "dir2"],
    childContent: ["dir1", "dir2"],
    currentSelected: 0,
    parentSelected: 1,
    childSelected: 0,
    childContentType: "directory",
  }, Cmd.run(getContents, {
    successActionCreator: getContentsSuccess,
    failActionCreator: getContentsFailure,
    args: [{path: "/mock/path/dir1/dir1", key: "childContent"}],
  })))
})

test("handle GO_FORWARD to file", t => {
  const r = reducer({
    currentPath: "/mock/path",
    parentPath: "/mock",
    childPath: "/mock/path/file1",
    currentContent: ["file1", "dir2"],
    parentContent: ["path0", "path"],
    childContent: ["dir1", "dir2"],
    currentSelected: 0,
    parentSelected: 1,
    childSelected: 0,
    currentContentType: "file",
  }, goForward())

  t.deepEqual(r, loop({
    currentPath: "/mock/path",
    parentPath: "/mock",
    childPath: "/mock/path/file1",
    currentContent: ["file1", "dir2"],
    parentContent: ["path0", "path"],
    childContent: ["dir1", "dir2"],
    currentSelected: 0,
    parentSelected: 1,
    childSelected: 0,
    currentContentType: "file",
  }, Cmd.run(openFile, {
    successActionCreator: openFileSuccess,
    failActionCreator: openFileFailure,
    args: [{filePath: "/mock/path/file1"}],
  })))
})
