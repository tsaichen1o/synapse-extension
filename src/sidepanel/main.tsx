import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // 我們之後會在這裡引入 TailwindCSS

const rootElement = document.getElementById("root");
if (!rootElement) {
    throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);