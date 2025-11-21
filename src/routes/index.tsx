import Layout from "@/components/layout/Layout";
import ProtectedRoute from "@/components/protected-route";
import { AppMaintenancePage, Dashboard, Login, ManongReportsPage, ServicesPage, Settings, UsersPage } from "@/pages";
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
      { path: "app-maintenance", element: <AppMaintenancePage /> },
      { path: "urgency-levels", element: <UrgencyLevelsPage /> },
      { path: "refund-requests", element: <RefundRequestsPage /> },
      { path: "manong-reports", element: <ManongReportsPage /> },
    ],
  },
  { path: "/login", element: <Login /> }
];

export default routes;