import { ReactNode } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex w-full bg-background relative">
      <Sidebar />

      <div className="flex-1 flex flex-col w-full">
        <Header />

        <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
};
