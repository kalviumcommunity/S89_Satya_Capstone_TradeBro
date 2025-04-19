import React, { useState } from "react";
import axios from "axios";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("http://localhost:5000/api/auth/login", {
                email,
                password,
            });
            alert("Login successful!");
            console.log("Login response:", res.data);

            // Store the token in localStorage or context
            const token = res.data.token;
            localStorage.setItem("token", token);

            // Redirect or update the UI as needed
        } catch (err) {
            console.error("Login error:", err.response?.data || err.message);
            alert("Login failed. Please check your credentials.");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <h2 className="text-2xl font-bold mb-6">Login</h2>
            <form onSubmit={handleSubmit} className="flex flex-col space-y-4 w-80">
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
                <button
                    type="submit"
                    className="bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition duration-300"
                >
                    Login
                </button>
            </form>
        </div>
    );
};

export default Login;