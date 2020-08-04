import {configureStore, getDefaultMiddleware} from "@reduxjs/toolkit"
import rootReducer from "./reducers"
import {install} from "redux-loop"

const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware(),
  enhancers: [install()],
})

export default store
