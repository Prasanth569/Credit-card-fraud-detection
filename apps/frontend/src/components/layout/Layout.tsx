import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import StatusBar from "./StatusBar";

export default function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <TopBar />
      <main className="ml-64 mt-14 mb-8 p-6 min-h-[calc(100vh-5.5rem)]">
        <Outlet />
      </main>
      <StatusBar />
    </div>
  );
}
