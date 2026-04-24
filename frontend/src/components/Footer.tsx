import logo from "@/assets/logo.jpg";
import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Linkedin, Mail } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-6 px-6 md:px-12 mt-auto border-t border-border bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center gap-4 text-sm text-muted-foreground">
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span>© {currentYear} NutriGuard Ltd. All Rights Reserved.</span>
            <span className="hidden md:inline opacity-20">|</span>
            <Link to="#" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <span className="hidden md:inline opacity-20">|</span>
            <Link to="#" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
