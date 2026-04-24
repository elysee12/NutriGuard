import { Heart, ArrowRight } from "lucide-react";
import logo from "@/assets/logo.jpg";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { isAuthenticated, user } = useAuth();
  
  const dashboardPath = user?.role === "ADMIN" ? "/admin" : user?.role === "NURSE" ? "/nurse" : "/chw";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="text-center max-w-2xl mx-auto">
        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <img src={logo} alt="NutriGuard logo" className="h-12 w-12 object-contain" />
          </div>
        </div>
        <h1 className="mb-4 text-5xl font-display font-bold tracking-tight">NutriGuard</h1>
        <p className="mb-8 text-xl text-muted-foreground leading-relaxed">
          Advanced ML-Based Stunting Detection and Nutritional Monitoring System for Rwanda's Health Care.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {isAuthenticated ? (
            <Button asChild size="lg" className="rounded-full px-8">
              <Link to={dashboardPath}>
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg" className="rounded-full px-8">
                <Link to="/login">
                  Login to Portal
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-8">
                <Link to="/register">Create Account</Link>
              </Button>
            </>
          )}
        </div>
      </div>
      
      <div className="mt-16 text-center text-sm text-muted-foreground">
        <p>© 2026 NutriGuard. Supporting Rwanda's Health Initiatives.</p>
      </div>
    </div>
  );
};

export default Index;
