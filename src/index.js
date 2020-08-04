import process from "process"
import store from "./store"
import {init} from "./reducers"

store.dispatch(init({path: process.cwd()}))
