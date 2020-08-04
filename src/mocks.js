const mock = require("mock-fs")

export default {
  restore: mock.restore,
  mockFs: () => mock({
    "/mock/dir1": {
      "file.empty": "",
      "file.txt": "text file content",
      "file.bin": Buffer.from([8, 6, 7, 5, 3, 0, 9]),
      "empty-dir": {},
      dir: {
        file1: "text file 1",
        file2: Buffer.from([3, 0, 9, 8, 6, 7, 5]),
      },
    },
    "/mock/denied": mock.directory({
      mode: 0o000,
      items: [],
    }),
  }),
}
