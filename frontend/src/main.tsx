import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/routes";
import "./index.css";

// 開発モードでMSWを有効化
// if (import.meta.env.DEV) {
//   const { worker } = await import("./mocks/browser");
//   await worker.start({ serviceWorker: { url: "/mockServiceWorker.js" } });
// }

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);