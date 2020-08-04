import {configureStore, getDefaultMiddleware} from "@reduxjs/toolkit"
import {install} from "redux-loop"

import rootReducer from "./reducers"

const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware(),
  enhancers: [install()],
})

export default store
