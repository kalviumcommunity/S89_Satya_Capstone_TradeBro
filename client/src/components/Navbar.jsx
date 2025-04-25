import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";
import Logout from '../pages/Logout';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-links">
        <Link to="/login">Login</Link>
        <Link to="/signup">Sign Up</Link>
        <Logout /> {/* Logout button */}
      </div>
    </nav>
  );
};

export default Navbar;
