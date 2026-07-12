import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DetectTestApp } from "./DetectTestApp";
import "./detectTest.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DetectTestApp />
  </StrictMode>,
);
