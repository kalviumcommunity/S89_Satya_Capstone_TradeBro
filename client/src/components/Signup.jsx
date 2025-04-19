import React, { useState } from "react";
import axios from "axios";

const Signup = () => {
    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("http://localhost:5000/api/auth/signup", form);
            alert("Signup successful!");
            console.log("Signup response:", res.data);
        } catch (err) {
            console.error("Signup error:", err.response?.data || err.message);
            alert("Signup failed. Please try again.");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <h2 className="text-2xl font-bold mb-6">Sign Up</h2>
            <form onSubmit={handleSubmit} className="flex flex-col space-y-4 w-80">
                <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={form.username}
                    onChange={handleChange}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
                <button
                    type="submit"
                    className="bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition duration-300"
                >
                    Create Account
                </button>
            </form>
        </div>
    );
};

export default Signup;