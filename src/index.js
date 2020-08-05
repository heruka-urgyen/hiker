import React from "react"
import {Provider} from "react-redux"
import {render} from "ink"
import process from "process"
import store from "./store"
import {init} from "./reducers"
import Main from "./components/Main"

store.dispatch(init({path: process.cwd()}))

render(<Provider store={store}><Main /></Provider>)
