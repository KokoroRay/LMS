import { createRoot } from "react-dom/client";
import "antd/dist/reset.css";
import App from "./App.jsx";
import "./styles/Login.css";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./redux/api/store.js";
import React from "react";

if (typeof global === 'undefined') {
  window.global = globalThis;
}

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>
);
