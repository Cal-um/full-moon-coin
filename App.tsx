import React from "react"
import { Provider } from "react-redux"
import { store } from "./src/store/store"
import Issue from "./src/screens/issue"
import FrontPage from "./src/screens/FrontPage"

const App = () => {
  return (
    <Provider store={store}>
      <FrontPage />
    </Provider>
  )
}

export default App
