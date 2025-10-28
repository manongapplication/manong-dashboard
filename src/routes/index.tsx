import Layout from "@/components/layout/Layout";
import ProtectedRoute from "@/components/protected-route";
import { Dashboard, Login, Settings, Users } from "@/pages";
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
      { path: "users", element: <Users /> },
      { path: "settings", element: <Settings /> },
    ],
  },
  { path: "/login", element: <Login /> }
];

export default routes;