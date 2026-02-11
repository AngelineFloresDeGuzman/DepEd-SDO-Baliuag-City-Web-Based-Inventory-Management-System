import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { RawInventoryProvider } from "@/context/RawInventoryContext";
import { SchoolInventoryProvider } from "@/context/SchoolInventoryContext";
import { SurplusProvider } from "@/context/SurplusContext";
import { TransfersProvider } from "@/context/TransfersContext";
import { NotificationsProvider } from "@/context/NotificationsContext";
import MainLayout from "@/components/layout/MainLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Inventory from "@/pages/Inventory";
import Transfers from "@/pages/Transfers";
import ResourceHub from "@/pages/ResourceHub";
import Reports from "@/pages/Reports";
import AuditLogs from "@/pages/AuditLogs";
import Schools from "@/pages/Schools";
import Transactions from "@/pages/Transactions";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <RawInventoryProvider>
        <SchoolInventoryProvider>
          <SurplusProvider>
            <TransfersProvider>
              <NotificationsProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <Routes>
                      <Route path="/" element={<Navigate to="/login" replace />} />
                      <Route path="/login" element={<Login />} />
                      {/* Protected Routes */}
                      <Route element={<MainLayout />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/inventory" element={<Inventory />} />
                        <Route path="/transfers" element={<Transfers />} />
                        <Route path="/resource-hub" element={<ResourceHub />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/audit-logs" element={<AuditLogs />} />
                        <Route path="/schools" element={<Schools />} />
                        <Route path="/transactions" element={<Transactions />} />
                      </Route>
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </BrowserRouter>
                </TooltipProvider>
              </NotificationsProvider>
            </TransfersProvider>
          </SurplusProvider>
        </SchoolInventoryProvider>
      </RawInventoryProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

