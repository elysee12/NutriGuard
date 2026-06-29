import { Heart, ArrowRight } from "lucide-react";
import { FaBaby, FaUserMd, FaChartLine } from "react-icons/fa";
import logo from "@/assets/logo.jpg";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

const Index = () => {
  const { isAuthenticated, user } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState<any>(null);
  
  const dashboardPath = user?.role === "ADMIN" ? "/admin" : user?.role === "NURSE" ? "/nurse" : "/chw";

  useEffect(() => {
    // Fetch public stats for homepage
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_URL}/stats/public`);
        if (response.ok) {
          setStats(await response.json());
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary via-primary/95 to-primary/90 p-4 relative overflow-hidden">
      {/* Premium Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 right-1/3 w-96 h-96 bg-white rounded-full blur-3xl"></div>
      </div>

      {/* Language Selector */}
      <div className="absolute top-6 right-6 z-10">
        <LanguageSelector />
      </div>
      
      <div className="text-center max-w-4xl mx-auto relative z-10 px-4">
        {/* Premium Logo */}
        <div className="flex justify-center mb-8">
          <div className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur-sm shadow-2xl flex items-center justify-center ring-4 ring-white/30">
            <img src={logo} alt="e-KuraNeza Kibondo logo" className="h-12 w-12 object-contain" />
          </div>
        </div>

        {/* Brand Name */}
        <div className="mb-4">
          <h1 className="text-5xl lg:text-6xl font-display font-bold tracking-tight text-white mb-2">
            {t('home.title')}
          </h1>
          <div className="flex items-center justify-center gap-2 text-white/80 text-sm font-semibold">
            <Heart className="h-4 w-4" />
            <span>Supporting Rwanda's Health Initiatives</span>
          </div>
        </div>
        
        {/* Hero Description */}
        <p className="mb-10 text-xl lg:text-2xl text-white/90 leading-relaxed max-w-3xl mx-auto font-medium">
          {t('home.subtitle')}
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          {isAuthenticated ? (
            <Button asChild size="lg" className="rounded-xl px-10 h-14 text-base shadow-2xl bg-white text-primary hover:bg-white/90 hover:shadow-xl">
              <Link to={dashboardPath}>
                {t('nav.dashboard')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg" className="rounded-xl px-10 h-14 text-base shadow-2xl bg-white text-primary hover:bg-white/90 hover:shadow-xl">
                <Link to="/login">
                  {t('home.get_started')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button 
                asChild 
                variant="outline" 
                size="lg" 
                className="rounded-xl px-10 h-14 text-base border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 hover:border-white/50"
              >
                <Link to="/register">{t('home.request_access')}</Link>
              </Button>
            </>
          )}
        </div>

        {/* Feature Highlights - Premium Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-white/50">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <FaBaby className="text-4xl text-primary" />
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Children Screened</p>
              <p className="text-3xl font-display font-bold text-foreground mb-2">{stats ? (stats.totalChildren >= 1000 ? `${(stats.totalChildren / 1000).toFixed(1)}k+` : `${stats.totalChildren}+`) : "0+"}</p>
            </div>
          </div>
          
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-white/50">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-info/20 to-info/10 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <FaUserMd className="text-4xl text-info" />
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Health Workers</p>
              <p className="text-3xl font-display font-bold text-foreground mb-2">{stats ? stats.totalHealthWorkers.toLocaleString() : "0"}</p>
            </div>
          </div>
          
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-white/50">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-success/20 to-success/10 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <FaChartLine className="text-4xl text-success" />
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Detection Rate</p>
              <p className="text-3xl font-display font-bold text-foreground mb-2">{stats ? stats.detectionRate : "95%"}</p>
            </div>
          </div>
        </div>

        {/* Additional Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-white/50">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Heart className="h-7 w-7 text-primary" />
            </div>
            <h3 className="font-bold text-lg mb-2">Early Detection</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">AI-powered screening for child malnutrition and stunting prevention</p>
          </div>
          
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-white/50">
            <div className="w-14 h-14 rounded-xl bg-success/10 flex items-center justify-center mx-auto mb-4">
              <svg className="h-7 w-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2">Smart Recommendations</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Personalized health guidance and nutrition plans for families</p>
          </div>
          
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-white/50">
            <div className="w-14 h-14 rounded-xl bg-info/10 flex items-center justify-center mx-auto mb-4">
              <svg className="h-7 w-7 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2">Real-time Monitoring</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Track growth metrics and health indicators continuously</p>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-16 text-center text-white/80 text-sm relative z-10">
        <p>© 2026 e-KuraNeza Kibondo. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Index;
