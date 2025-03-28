import React from "react";
import ReactDOM from "react-dom/client"
import App from "./App.jsx"
import "./index.css"
import { BrowserRouter } from "react-router-dom";
import Notification from "./components/notification/Notification.jsx";
import store from "./app/store.js";
import { Provider } from "react-redux";


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
    <Notification />
    <BrowserRouter>

      <App />
    </BrowserRouter>
      </Provider>
  </React.StrictMode>

)