import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";
import { useAppDispatch } from "../hooks/redux";
import { setCredentials } from "../features/auth/authSlice";
import { loginUser } from "../api/auth";
import {
    Box,
    Button,
    Card,
    CardContent,
    TextField,
    Typography,
    Alert,
} from "@mui/material";

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        try {
            const response = await loginUser(data.email, data.password);
            dispatch(setCredentials({
                accessToken: response.accessToken,
                user: response.user,
            }));
            navigate("/");
        } catch (error) {
            setError("root", { message: "Invalid email or password" });
        }
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "grey.50",
            }}
        >
            <Card sx={{ width: "100%", maxWidth: 400, p: 2 }}>
                <CardContent>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                        Pennywise
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={3}>
                        Sign in to your account
                    </Typography>

                    <Box
                        component="form"
                        onSubmit={handleSubmit(onSubmit)}
                        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                    >
                        <TextField
                            label="Email"
                            type="email"
                            fullWidth
                            {...register("email")}
                            error={!!errors.email}
                            helperText={errors.email?.message}
                        />
                        <TextField
                            label="Password"
                            type="password"
                            fullWidth
                            {...register("password")}
                            error={!!errors.password}
                            helperText={errors.password?.message}
                        />

                        {errors.root && (
                            <Alert severity="error">{errors.root.message}</Alert>
                        )}

                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={isSubmitting}
                            sx={{ mt: 1 }}
                        >
                            {isSubmitting ? "Signing in..." : "Sign in"}
                        </Button>
                    </Box>

                    <Typography variant="body2" sx={{ textAlign: "center", mt: 2 }} color="text.secondary">
                        Don't have an account?{" "}
                        <Link to="/register" style={{ color: "inherit" }}>
                            Register
                        </Link>
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
};

export default LoginPage;