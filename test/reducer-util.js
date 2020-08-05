import test from "ava"

import mocks from "../src/mocks"

import {
  getContents,
  getPath,
} from "../src/reducers"

test.beforeEach(_ => mocks.mockFs())
test.afterEach(async _ => {
  // this avoids some strange side-effects potentially in mock-fs that make tests fail
  await new Promise(r => setTimeout(r, 0))
  mocks.restore()
})

test("read directory contents", async t => {
  const dir = await getContents({path: "/mock/dir1", key: "testKey"})
  t.deepEqual(
    dir.testKey,
    ["dir", "empty-dir", "empty-file.txt", "file.jpg", "text-file.txt"],
  )
})

test("try to read non-existent directory", async t => {
  const e = await t.throwsAsync(getContents({path: "/mock/non-existent"}))
  t.truthy(e instanceof Error)
})

test("try to read not allowed directory", async t => {
  const dir = await getContents({path: "/mock/denied", key: "testKey"})
  t.deepEqual(dir.testKey, "(Not Accessible)")
})

test("read empty dir", async t => {
  const dir = await getContents({path: "/mock/dir1/empty-dir", key: "testKey"})
  t.deepEqual(dir.testKey, "(Empty)")
})

test("read text file", async t => {
  const file = await getContents({path: "/mock/dir1/text-file.txt", key: "testKey"})
  t.deepEqual(file.testKey, "text file content")
})

test("read empty file", async t => {
  const file = await getContents({path: "/mock/dir1/empty-file.txt", key: "testKey"})
  t.deepEqual(file.testKey, "(Empty)")
})

test("try to read not allowed file", async t => {
  const file = await getContents({path: "/mock/file-denied.txt", key: "testKey"})
  t.deepEqual(file.testKey, "(Not Accessible)")
})

test("try to read non-existent file", async t => {
  const error = await t.throwsAsync(getContents({path: "/mock/dir1/non-existent-file.txt"}))
  t.truthy(error instanceof Error)
})

test("try to read binary file", async t => {
  const file = await getContents({path: "/mock/dir1/file.jpg", key: "testKey"})
  t.deepEqual(file.testKey, "(Binary)")
})

test("get contents of a dir", async t => {
  const dir = await getContents({path: "/mock/dir1", key: "testKey"})
  t.deepEqual(
    dir,
    {testKey: ["dir", "empty-dir", "empty-file.txt", "file.jpg", "text-file.txt"]},
  )
})

test("get contents of a file", async t => {
  const file = await getContents({path: "/mock/dir1/text-file.txt", key: "testKey"})
  t.deepEqual(
    file,
    {testKey: "text file content"},
  )
})

test("get path", async t => {
  const dir = await getContents({path: "/mock/dir1/", key: "testKey"})
  const path = await getPath({path: "/mock/dir1/", dir: dir.testKey, selected: 0})

  t.deepEqual(path, {
    currentPath: "/mock/dir1",
    parentPath: "/mock",
    childPath: "/mock/dir1/dir",
  })
})