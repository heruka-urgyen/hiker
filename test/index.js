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
  const dir1 = [{content: "file1", type: "file"}, {content: "dir2", type: "directory"}]

  const r = reducer(
    {currentPath: "/mock/path"},
    getContentsSuccess({currentContent: {content: dir1, type: "directory"}}),
  )

  t.deepEqual(r, {
    currentContent: {content: dir1, type: "directory"},
    currentPath: "/mock/path",
  })
})

test("handle parent GET_CONTENTS_SUCCESS", t => {
  const dir1 = [{content: "file1", type: "file"}, {content: "dir2", type: "directory"}]
  const dir2 = [
    {content: "path0", type: "directory"},
    {content: "path", type: "directory"},
    {content: "path1", type: "directory"},
  ]

  const r = reducer(
    {currentPath: "/mock/path", currentContent: dir1, parentPath: "/mock"},
    getContentsSuccess({
      parentContent: {content: dir2, type: "directory"},
    }),
  )

  t.deepEqual(r, {
    currentContent: dir1,
    currentPath: "/mock/path",
    parentPath: "/mock",
    parentContent: {content: dir2, type: "directory"},
    parentSelected: 1,
  })
})

test("handle child GET_CONTENTS_SUCCESS", t => {
  const dir1 = [{content: "file1", type: "file"}, {content: "dir2", type: "directory"}]

  const r = reducer(
    {currentPath: "/mock/path", currentContent: dir1, parentPath: "/mock", history: {}},
    getContentsSuccess({childContent: {content: dir1, type: "directory"}}),
  )

  t.deepEqual(r, {
    history: {},
    childSelected: 0,
    currentContent: dir1,
    currentPath: "/mock/path",
    parentPath: "/mock",
    childContent: {content: dir1, type: "directory"},
  })
})

test("handle INIT_SUCCESS", t => {
  const dir1 = [{content: "file1", type: "file"}, {content: "dir2", type: "directory"}]

  const r = reducer({
    currentPath: "/mock/path",
    currentContent: {content: dir1, type: "directory"},
    currentSelected: 0},
  initSuccess())

  t.deepEqual(r, loop({
    childPath: "/mock/path/file1",
    parentPath: "/mock",
    currentPath: "/mock/path",
    currentContent: {content: dir1, type: "directory"},
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
  const dir1 = [{content: "file1", type: "file"}, {content: "dir2", type: "directory"}]

  const r = reducer({
    currentPath: "/mock/path",
    parentPath: "/mock",
    childPath: "/mock/path/file1",
    currentContent: {content: dir1, type: "directory"}},
  selectItem({currentSelected: 1}))

  t.deepEqual(r, loop(
    {
      currentPath: "/mock/path",
      parentPath: "/mock",
      childPath: "/mock/path/dir2",
      currentSelected: 1,
      currentContent: {content: dir1, type: "directory"}},
    Cmd.run(getContents, {
      successActionCreator: getContentsSuccess,
      failActionCreator: getContentsFailure,
      args: [{path: "/mock/path/dir2", key: "childContent"}],
    }),
  ))
})

test("handle GO_BACK", t => {
  const dir1 = [{content: "file1", type: "file"}, {content: "dir2", type: "directory"}]
  const dir2 = [{content: "path0", type: "directory"}, {content: "path", type: "directory"}]
  const dir3 = [{content: "dir1", type: "directory"}, {content: "dir2", type: "directory"}]

  const r = reducer({
    currentPath: "/mock/path",
    parentPath: "/mock",
    childPath: "/mock/path/file1",
    currentContent: {content: dir1, type: "directory"},
    parentContent: {content: dir2, type: "directory"},
    childContent: {content: dir3, type: "directory"},
    currentSelected: 0,
    parentSelected: 1,
    childSelected: 0,
    history: {},
  }, goBack())

  t.deepEqual(r, loop({
    childPath: "/mock/path",
    currentPath: "/mock",
    childContent: {content: dir1, type: "directory"},
    currentContent: {content: dir2, type: "directory"},
    currentSelected: 1,
    childSelected: 0,
    parentPath: "/",
    parentContent: {content: dir2, type: "directory"},
    parentSelected: 1,
    history: {
      "/mock": {selected: 1},
      "/mock/path": {selected: 0},
      "/mock/path/file1": {selected: 0},
    },
  }, Cmd.run(getContents, {
    successActionCreator: getContentsSuccess,
    failActionCreator: getContentsFailure,
    args: [{path: "/", key: "parentContent"}],
  })))
})

test("handle GO_FORWARD to dir", t => {
  const dir1 = [{content: "file1", type: "file"}, {content: "dir2", type: "directory"}]
  const dir2 = [{content: "path0", type: "directory"}, {content: "path", type: "directory"}]
  const dir3 = [{content: "dir1", type: "directory"}, {content: "dir2", type: "directory"}]

  const r = reducer({
    currentPath: "/mock/path",
    parentPath: "/mock",
    childPath: "/mock/path/dir1",
    currentContent: {content: dir1, type: "directory"},
    parentContent: {content: dir2, type: "directory"},
    childContent: {content: dir3, type: "directory"},
    currentSelected: 1,
    parentSelected: 1,
    childSelected: 0,
    history: {},
  }, goForward())

  t.deepEqual(r, loop({
    currentPath: "/mock/path/dir1",
    parentPath: "/mock/path",
    childPath: "/mock/path/dir1/dir1",
    currentContent: {content: dir3, type: "directory"},
    parentContent: {content: dir1, type: "directory"},
    childContent: {content: dir3, type: "directory"},
    currentSelected: 0,
    parentSelected: 1,
    childSelected: 0,
    history: {
      "/mock": {selected: 1},
      "/mock/path": {selected: 1},
      "/mock/path/dir1": {selected: 0},
    },
  }, Cmd.run(getContents, {
    successActionCreator: getContentsSuccess,
    failActionCreator: getContentsFailure,
    args: [{path: "/mock/path/dir1/dir1", key: "childContent"}],
  })))
})

test("handle GO_FORWARD to file", t => {
  const dir1 = [{content: "file1", type: "file"}, {content: "dir2", type: "directory"}]
  const dir2 = [{content: "path0", type: "directory"}, {content: "path", type: "directory"}]

  const r = reducer({
    currentPath: "/mock/path",
    parentPath: "/mock",
    childPath: "/mock/path/file1",
    currentContent: {content: dir1, type: "directory"},
    parentContent: {content: dir2, type: "directory"},
    childContent: {content: "file content", type: "file"},
    currentSelected: 0,
    parentSelected: 1,
    childSelected: 0,
  }, goForward())

  t.deepEqual(r, loop({
    currentPath: "/mock/path",
    parentPath: "/mock",
    childPath: "/mock/path/file1",
    currentContent: {content: dir1, type: "directory"},
    parentContent: {content: dir2, type: "directory"},
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
