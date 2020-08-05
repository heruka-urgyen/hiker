const mock = require("mock-fs")

export default {
  restore: mock.restore,
  mockFs: () => mock({
    "/mock/dir1": {
      "empty-file.txt": "",
      "text-file.txt": "text file content",
      "file.jpg": Buffer.from([8, 6, 7, 5, 3, 0, 9]),
      "empty-dir": {},
      dir: {
        file1: "text file 1",
        file2: "",
      },
    },
    "/mock/denied": mock.directory({
      mode: 0o000,
      items: [],
    }),
    "/mock/file-denied.txt": mock.file({
      mode: 0o000,
    }),
  }),
}
