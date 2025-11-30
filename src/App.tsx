import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import Cart from "./pages/Cart";
import OrderStatus from "./pages/OrderStatus";
import Kitchen from "./pages/Kitchen";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import RestaurantSettings from "./pages/admin/RestaurantSettings";
import MenuManagement from "./pages/admin/MenuManagement";
import SecuritySettings from "./pages/admin/SecuritySettings";
import Caisse from "./pages/admin/Caisse";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/order-status/:orderId" element={<OrderStatus />} />
          <Route path="/kitchen" element={<Kitchen />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/restaurant" element={<RestaurantSettings />} />
          <Route path="/admin/menu" element={<MenuManagement />} />
          <Route path="/admin/security" element={<SecuritySettings />} />
          <Route path="/admin/caisse" element={<Caisse />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
