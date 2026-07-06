import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Layout from "../components/Layout";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import DashboardPage from "../pages/DashboardPage";
import CategoriesPage from "../pages/CategoriesPage";
import ExpensesPage from "../pages/ExpensesPage";
import IncomePage from "../pages/IncomePage";
import BudgetPage from "../pages/BudgetPage";
import ProtectedRoute from "./ProtectedRoute";
import UploadPage from "../pages/UploadPage";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            { path: "login", element: <LoginPage /> },
            { path: "register", element: <RegisterPage /> },
            {
                path: "/",
                element: (
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                ),
                children: [
                    { index: true, element: <DashboardPage /> },
                    { path: "categories", element: <CategoriesPage /> },
                    { path: "expenses", element: <ExpensesPage /> },
                    { path: "income", element: <IncomePage /> },
                    { path: "budget", element: <BudgetPage /> },
                    { path: "upload", element: <UploadPage /> },
                ],
            },
        ],
    },
]);