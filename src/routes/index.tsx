import Layout from "@/components/layout/Layout";
import ProtectedRoute from "@/components/protected-route";
import { AppMaintenancePage, Dashboard, Login, ServicesPage, Settings, UsersPage } from "@/pages";
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
    ],
  },
  { path: "/login", element: <Login /> }
];

export default routes;