import { Heart, ArrowRight, CheckCircle, Users, Activity, Shield, Sparkles } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-teal-300/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-r from-blue-200/10 to-purple-200/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/20 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-teal-600 shadow-lg flex items-center justify-center ring-4 ring-primary/10">
                <img src={logo} alt="e-KuraNeza Kibondo" className="h-7 w-7 object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent">
                  e-KuraNeza Kibondo
                </h1>
                <p className="text-xs text-muted-foreground">Rwanda Health Platform</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <LanguageSelector />
              {isAuthenticated ? (
                <Button asChild className="rounded-full shadow-lg hover:shadow-xl transition-all">
                  <Link to={dashboardPath}>
                    {t('nav.dashboard')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="ghost" className="rounded-full">
                    <Link to="/login">{t('home.get_started')}</Link>
                  </Button>
                  <Button asChild className="rounded-full shadow-lg hover:shadow-xl transition-all">
                    <Link to="/register">
                      {t('home.request_access')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-teal-500/10 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">AI-Powered Health Monitoring</span>
            </div>

            {/* Heading */}
            <div className="space-y-4">
              <h2 className="text-5xl lg:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-slate-900 via-primary to-teal-600 bg-clip-text text-transparent">
                  Transforming Child Nutrition
                </span>
                <br />
                <span className="text-slate-700">Monitoring in Rwanda</span>
              </h2>
              <p className="text-xl text-slate-600 leading-relaxed max-w-xl">
                Advanced AI-powered system empowering health workers to detect and prevent child malnutrition with real-time insights and personalized recommendations.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              {isAuthenticated ? (
                <Button asChild size="lg" className="rounded-full px-8 h-14 text-lg shadow-2xl hover:shadow-3xl transition-all bg-gradient-to-r from-primary to-teal-600">
                  <Link to={dashboardPath}>
                    <Activity className="mr-2 h-5 w-5" />
                    {t('nav.dashboard')}
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="rounded-full px-8 h-14 text-lg shadow-2xl hover:shadow-3xl transition-all bg-gradient-to-r from-primary to-teal-600">
                    <Link to="/login">
                      {t('home.get_started')}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="rounded-full px-8 h-14 text-lg border-2 hover:bg-slate-50">
                    <Link to="/register">{t('home.request_access')}</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-400 to-primary border-2 border-white shadow-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                ))}
              </div>
              <div>
                <p className="font-bold text-slate-900">Trusted by 340+ Health Workers</p>
                <p className="text-sm text-slate-600">Across all provinces of Rwanda</p>
              </div>
            </div>
          </div>

          {/* Right Column - Stats Cards */}
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2 bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 hover:shadow-3xl transition-all hover:-translate-y-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <FaBaby className="text-3xl text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Children Screened</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent">
                    {stats ? `${stats.totalChildren.toLocaleString()}+` : "12,450+"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-success">
                <CheckCircle className="h-4 w-4" />
                <span className="font-semibold">Active monitoring across Rwanda</span>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all hover:-translate-y-1">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-teal-500/10 to-teal-500/5 flex items-center justify-center mb-4">
                <FaUserMd className="text-2xl text-teal-600" />
              </div>
              <p className="text-sm font-semibold text-slate-600 mb-1">Health Workers</p>
              <p className="text-3xl font-bold text-slate-900">{stats ? stats.totalHealthWorkers.toLocaleString() : "340"}</p>
            </div>

            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all hover:-translate-y-1">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-success/10 to-success/5 flex items-center justify-center mb-4">
                <FaChartLine className="text-2xl text-success" />
              </div>
              <p className="text-sm font-semibold text-slate-600 mb-1">Detection Rate</p>
              <p className="text-3xl font-bold text-slate-900">{stats ? stats.detectionRate : "95%"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 bg-white/60 backdrop-blur-xl border-y border-white/20 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-slate-900 mb-4">Powerful Features for Better Outcomes</h3>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Everything you need to monitor, assess, and improve child nutrition in one intelligent platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Activity className="h-8 w-8" />,
                title: "AI-Powered Early Detection",
                description: "Machine learning algorithms analyze growth metrics to identify malnutrition and stunting risks before they become critical.",
                gradient: "from-blue-500 to-primary"
              },
              {
                icon: <Heart className="h-8 w-8" />,
                title: "Personalized Care Plans",
                description: "Generate tailored nutrition recommendations and health guidance based on each child's unique assessment and circumstances.",
                gradient: "from-pink-500 to-rose-500"
              },
              {
                icon: <Shield className="h-8 w-8" />,
                title: "Real-Time Monitoring",
                description: "Track growth indicators continuously with instant alerts for high-risk cases, ensuring timely interventions.",
                gradient: "from-teal-500 to-emerald-500"
              },
            ].map((feature, index) => (
              <div key={index} className="group bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20 hover:shadow-2xl transition-all hover:-translate-y-2">
                <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h4>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center py-12 text-slate-600">
        <p className="text-sm">© 2026 e-KuraNeza Kibondo. All rights reserved. • Supporting Rwanda's Health Initiatives</p>
      </div>
    </div>
  );
};

export default Index;
