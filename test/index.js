import test from "ava"
import {Cmd, loop} from "redux-loop"

import reducer, {
  getContents,
  openFile,

  init,
  initSuccess,

  getContentsSuccess,
  getContentsFailure,

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
    getContentsSuccess({currentContent: {content: ["file1", "dir2"], type: "directory"}}),
  )

  t.deepEqual(r, {
    currentContent: {content: ["file1", "dir2"], type: "directory"},
    currentPath: "/mock/path",
  })
})

test("handle parent GET_CONTENTS_SUCCESS", t => {
  const r = reducer(
    {currentPath: "/mock/path", currentContent: ["file1", "dir2"], parentPath: "/mock"},
    getContentsSuccess({
      parentContent: {content: ["path0", "path", "path1"], type: "directory"},
    }),
  )

  t.deepEqual(r, {
    currentContent: ["file1", "dir2"],
    currentPath: "/mock/path",
    parentPath: "/mock",
    parentContent: {content: ["path0", "path", "path1"], type: "directory"},
    parentSelected: 1,
  })
})

test("handle child GET_CONTENTS_SUCCESS", t => {
  const r = reducer(
    {currentPath: "/mock/path", currentContent: ["file1", "dir2"], parentPath: "/mock"},
    getContentsSuccess({childContent: {content: ["file1", "file2"], type: "directory"}}),
  )

  t.deepEqual(r, {
    currentContent: ["file1", "dir2"],
    currentPath: "/mock/path",
    parentPath: "/mock",
    childContent: {content: ["file1", "file2"], type: "directory"},
  })
})

test("handle INIT_SUCCESS", t => {
  const r = reducer({
    currentPath: "/mock/path",
    currentContent: {content: ["file1", "dir2"], type: "directory"},
    currentSelected: 0},
  initSuccess())

  t.deepEqual(r, loop({
    childPath: "/mock/path/file1",
    parentPath: "/mock",
    currentPath: "/mock/path",
    currentContent: {content: ["file1", "dir2"], type: "directory"},
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

test("handle SELECT_ITEM", t => {
  const r = reducer({
    currentPath: "/mock/path",
    parentPath: "/mock",
    childPath: "/mock/path/file1",
    currentContent: {content: ["file1", "dir2"], type: "directory"}},
  selectItem({currentSelected: 1}))

  t.deepEqual(r, loop(
    {
      currentPath: "/mock/path",
      parentPath: "/mock",
      childPath: "/mock/path/dir2",
      currentSelected: 1,
      currentContent: {content: ["file1", "dir2"], type: "directory"}},
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
    currentContent: {content: ["file1", "dir2"], type: "directory"},
    parentContent: {content: ["path0", "path"], type: "directory"},
    childContent: {content: ["dir1", "dir2"], type: "directory"},
    currentSelected: 0,
    parentSelected: 1,
    childSelected: 0,
  }, goBack())

  t.deepEqual(r, loop({
    childPath: "/mock/path",
    currentPath: "/mock",
    childContent: {content: ["file1", "dir2"], type: "directory"},
    currentContent: {content: ["path0", "path"], type: "directory"},
    currentSelected: 1,
    childSelected: 0,
    parentPath: "/",
    parentContent: {content: ["path0", "path"], type: "directory"},
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
    currentContent: {content: ["file1", "dir2"], type: "directory"},
    parentContent: {content: ["path0", "path"], type: "directory"},
    childContent: {content: ["dir1", "dir2"], type: "directory"},
    currentSelected: 1,
    parentSelected: 1,
    childSelected: 0,
    childContentType: "directory",
  }, goForward())

  t.deepEqual(r, loop({
    currentPath: "/mock/path/dir1",
    parentPath: "/mock/path",
    childPath: "/mock/path/dir1/dir1",
    currentContent: {content: ["dir1", "dir2"], type: "directory"},
    parentContent: {content: ["file1", "dir2"], type: "directory"},
    childContent: {content: ["dir1", "dir2"], type: "directory"},
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
    currentContent: {content: ["file1", "dir2"], type: "directory"},
    parentContent: {content: ["path0", "path"], type: "directory"},
    childContent: {content: "file content", type: "file"},
    currentSelected: 0,
    parentSelected: 1,
    childSelected: 0,
  }, goForward())

  t.deepEqual(r, loop({
    currentPath: "/mock/path",
    parentPath: "/mock",
    childPath: "/mock/path/file1",
    currentContent: {content: ["file1", "dir2"], type: "directory"},
    parentContent: {content: ["path0", "path"], type: "directory"},
    childContent: {content: "file content", type: "file"},
    currentSelected: 0,
    parentSelected: 1,
    childSelected: 0,
  }, Cmd.run(openFile, {
    successActionCreator: openFileSuccess,
    failActionCreator: openFileFailure,
    args: [{filePath: "/mock/path/file1"}],
  })))
})
