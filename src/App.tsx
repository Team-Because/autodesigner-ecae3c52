import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RedirectIfAuthed } from "@/components/RedirectIfAuthed";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import Dashboard from "@/pages/Dashboard";
import BrandHub from "@/pages/BrandHub";
import BrandForm from "@/pages/BrandForm";
import BrandGuide from "@/pages/BrandGuide";
import Studio from "@/pages/Studio";
import History from "@/pages/History";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/marketing/Home";
import Features from "@/pages/marketing/Features";
import Pricing from "@/pages/marketing/Pricing";
import About from "@/pages/marketing/About";
import FAQ from "@/pages/marketing/FAQ";
import Contact from "@/pages/marketing/Contact";
import Trust from "@/pages/marketing/Trust";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public marketing site — logged-in users get bounced into the studio. */}
              <Route element={<RedirectIfAuthed />}>
                <Route element={<MarketingLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/features" element={<Features />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/trust" element={<Trust />} />
                </Route>
              </Route>

              <Route path="/login" element={<Login />} />

              {/* Authed app */}
              <Route
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/studio" element={<Studio />} />
                <Route path="/brands" element={<BrandHub />} />
                <Route path="/brand-guide" element={<BrandGuide />} />
                <Route path="/brands/:id" element={<BrandForm />} />
                <Route path="/brands/:id/edit" element={<BrandForm />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/history" element={<History />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/brands" element={<AdminBrands />} />
                <Route path="/admin/logs" element={<AdminLogs />} />
                <Route path="/admin/history" element={<AdminHistory />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
