import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Signup from "./components/Signup";

function App() {
    const user = {
        name: "John Doe",
        email: "john@example.com",
        profilePicture: "https://via.placeholder.com/40",
    };

    return (
        <Router>
            <div className="flex h-screen bg-gray-100">
                {/* Sidebar */}
                <Sidebar user={user} />

                {/* Main Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Navbar */}
                    <Navbar />

                    {/* Routes for different pages */}
                    <div className="flex-1 overflow-auto p-6">
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/signup" element={<Signup />} />
                            <Route
                                path="/"
                                element={
                                    <div className="text-center">
                                        <h1 className="text-3xl font-bold mb-4">Welcome to Trade Bro</h1>
                                        <p className="text-gray-600">Your trading dashboard starts here.</p>
                                    </div>
                                }
                            />
                        </Routes>
                    </div>
                </div>
            </div>
        </Router>
    );
}

export default App;