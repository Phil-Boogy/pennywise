import { Outlet, useNavigate, Link } from "react-router-dom";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { useAppDispatch } from "../hooks/redux";
import { clearCredentials } from "../features/auth/authSlice";
import { logoutUser } from "../api/auth";

const Layout = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logoutUser();
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            dispatch(clearCredentials());
            navigate("/login");
        }
    };

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "grey.50" }}>
            <AppBar position="static" color="default" elevation={1}>
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: "bold" }}>
                        Pennywise
                    </Typography>
                    <Button component={Link} to="/categories" color="inherit">
                        Categories
                    </Button>
                    <Button component={Link} to="/expenses" color="inherit">
                        Expenses
                    </Button>
                    <Button component={Link} to="/income" color="inherit">
                        Income
                    </Button>
                    <Button component={Link} to="/budget" color="inherit">
                        Budget
                    </Button>
                    <Button onClick={handleLogout}>Logout</Button>
                </Toolbar>
            </AppBar>
            <Box sx={{ p: 3 }}>
                <Outlet />
            </Box>
        </Box>
    );
};

export default Layout;