import test from "ava"
import {Cmd, loop} from "redux-loop"

import reducer, {getDir, init, initSuccess, initFailure} from "../src/reducers"

test("handle INIT", t => {
  const r = reducer({}, init({path: "."}))

  t.deepEqual(r, loop(
    {},
    Cmd.run(getDir, {
      successActionCreator: initSuccess,
      failActionCreator: initFailure,
      args: ["."],
    }),
  ))
})
