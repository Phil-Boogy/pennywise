import { Navigate } from "react-router-dom";
import { useAppSelector } from "../hooks/redux";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const accessToken = useAppSelector((state) => state.auth.accessToken);

    if (!accessToken) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;