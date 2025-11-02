import { useEffect } from "react";
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom";

const Root = () => {

    const { user } = useAuth();
    const navigate = useNavigate();


    // On mount and when user changes, redirect based on auth/role
    useEffect(() => {
        if (!user){
            // Not logged in -> login
            navigate("/login");
        } else if(user.role === "admin") {
            // Admin -> admin dashboard
            navigate("/admin-dashboard");
        } else if(user.role === "employee") {
            // Employee -> employee dashboard
            navigate("/employee-dashboard");
        } else {
            // Fallback -> login
            navigate("/login");
        }

    }, [user, navigate]);

    return null;
}

export default Root;