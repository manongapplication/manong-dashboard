import Layout from "@/components/layout/Layout";
import ProtectedRoute from "@/components/protected-route";
import { AppMaintenancePage, Dashboard, ReferralCodesPage, Login, ManongReportsPage, ServicesPage, Settings, UsersPage, ServiceRequestsPage, AppVersionsPage } from "@/pages";
import RefundRequestsPage from "@/pages/RefundRequestsPage";
import UrgencyLevelsPage from "@/pages/UrgencyLevelsPage";
import type { RouteObject } from "react-router-dom";

const routes: RouteObject[] = [
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { path: "", element: <Dashboard /> },
      { path: "users", element: <UsersPage /> },
      { path: "settings", element: <Settings /> },
      { path: "services", element: <ServicesPage /> },
      { path: "service-requests", element: <ServiceRequestsPage /> },
      { path: "app-maintenance", element: <AppMaintenancePage /> },
      { path: "app-versions", element: <AppVersionsPage /> },
      { path: "urgency-levels", element: <UrgencyLevelsPage /> },
      { path: "refund-requests", element: <RefundRequestsPage /> },
      { path: "manong-reports", element: <ManongReportsPage /> },
      { path: "referral-codes", element: <ReferralCodesPage /> },
    ],
  },
  { path: "/login", element: <Login /> }
];

export default routes;