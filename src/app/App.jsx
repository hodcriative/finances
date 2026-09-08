import { useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import AppRoutes from "./routes";

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="app-shell">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="page"><AppRoutes /></div>
    </div>
  );
}
