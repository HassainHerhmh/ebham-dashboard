import React from "react";

import Dashboard from "../pages/Dashboard";
import Agents from "../pages/Agents";
import Users from "../pages/Users";

export const appRoutes = [
  {
    path: "/",
    key: "dashboard",
    element: <Dashboard />,
  },
  {
    path: "/agents",
    key: "agents",
    element: <Agents />,
  },
  {
    path: "/users",
    key: "users",
    element: <Users />,
  },
];
