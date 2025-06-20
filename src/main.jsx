import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HqmedApp } from "./hqmedApp";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <HqmedApp />
    </BrowserRouter>
  </StrictMode>
);
