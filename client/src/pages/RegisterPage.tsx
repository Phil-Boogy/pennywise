import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";
import { useAppDispatch } from "../hooks/redux";
import { setCredentials } from "../features/auth/authSlice";
import { registerUser } from "../api/auth";
import {
    Box,
    Button,
    Card,
    CardContent,
    TextField,
    Typography,
    Alert,
} from "@mui/material";

const registerSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const RegisterPage = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormData) => {
        try {
            const response = await registerUser(data.email, data.password);
            dispatch(setCredentials({
                accessToken: response.accessToken,
                user: response.user,
            }));
            navigate("/");
        } catch (error) {
            setError("root", { message: "Something went wrong. Please try again." });
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
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Create your account
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
                        <TextField
                            label="Confirm Password"
                            type="password"
                            fullWidth
                            {...register("confirmPassword")}
                            error={!!errors.confirmPassword}
                            helperText={errors.confirmPassword?.message}
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
                            {isSubmitting ? "Creating account..." : "Create account"}
                        </Button>
                    </Box>

                    <Typography variant="body2" sx={{ textAlign: "center", mt: 2 }} color="text.secondary">
                        Already have an account?{" "}
                        <Link to="/login" style={{ color: "inherit" }}>
                            Sign in
                        </Link>
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
};

export default RegisterPage;