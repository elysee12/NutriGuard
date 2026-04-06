import { Heart } from "lucide-react";
import logo from "@/assets/logo.jpg";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <img src={logo} alt="NutriGuard logo" className="h-12 w-12 mx-auto mb-4 object-contain" />
        <h1 className="mb-4 text-4xl font-display font-bold">NutriGuard</h1>
        <p className="text-xl text-muted-foreground">ML-Based Stunting Detection for Rwanda</p>
      </div>
    </div>
  );
};

export default Index;
