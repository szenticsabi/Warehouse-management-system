import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from 'axios';

const Login = () => {

    // Form fields and UI state
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // Navigation and auth context
    const navigate = useNavigate();
    const { login } = useAuth();


    /** Submit login form, POST credentials to API
     * on success, normalize user and save to storage, route by roleű
     * on failure, show error
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);



        try {
            const response = await axios.post("http://localhost:3000/api/auth/login", {
                email, password
            });

            console.log(response.data);

            if (response.data.success) {

                // Normalize user shape to expected
                const userData = response.data.user;
                const normalizedUser = {
                    id: userData.id || userData._id || null,
                    name: userData.name || "",
                    email: (userData.email || "").toLowerCase(),
                    role: (userData.role || "").toLowerCase(),
                    shift: userData.shift || "",
                };

                // Persist user and token
                await login(normalizedUser, response.data.token);


                // Redirect based on role
                if (normalizedUser.role === "admin") {
                    navigate("/admin-dashboard");
                } else if (normalizedUser.role === "employee") {
                    navigate("/employee-dashboard");
                } else {
                    navigate("/unauthorized");
                }
            } else {
                // Non-success JSON from backend
                alert(response.data.error || "Login failed");
            }

        } catch (error) {
            // HTTP and network errors
            if (error.response) {
                setError(error.response.data.message);
            } else {
                setError("Server error. Please try again later.")
            }
        } finally {
            setLoading(false);
        }
    }

    return (

        // Centered auth card on dark background
        <div className="min-h-screen grid place-items-center bg-gray-900 px-4">
            <div className="w-full max-w-sm mx-auto">
                <h2 className="text-center text-2xl font-bold tracking-tight text-white">
                    Warehouse Login
                </h2>

                {/* Error banner */}
                {error && (
                    <div className="bg-red-200 text-red-700 p-2 mb-4 rounded">
                        {error}
                    </div>
                )}

                {/* Login form */}
                <form method="POST" className="mt-6 space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-100">
                            Email address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-2 block w-full rounded-md bg-white/5 px-3 py-2 text-white outline-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:outline-indigo-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-100">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-2 block w-full rounded-md bg-white/5 px-3 py-2 text-white outline-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:outline-indigo-500"
                        />
                    </div>

                    {/* Submit button shows loading state */}
                    <button
                        type="submit"
                        className="w-full rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-indigo-500"
                    >
                        {loading ? "Loading...." : "Login"}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default Login;
