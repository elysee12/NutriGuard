import { ReactNode } from "react";
import Footer from "./Footer";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1">
        {children}
      </div>
      <Footer />
    </div>
  );
}
