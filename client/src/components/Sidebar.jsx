import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartLine, faWallet, faFileAlt, faHistory, faCog, faCommentDots } from "@fortawesome/free-solid-svg-icons";

const Sidebar = ({ user }) => {
    return (
        <div className="w-64 bg-white shadow-lg p-6">
            {/* User Profile */}
            <div className="flex items-center mb-8">
                <img
                    src={user.profilePicture || "https://via.placeholder.com/40"}
                    alt="Profile Picture"
                    className="w-10 h-10 rounded-full mr-4"
                />
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">{user.name}</h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                </div>
            </div>

            {/* Navigation Links */}
            <ul className="space-y-4">
                <li className="flex items-center text-gray-700 hover:text-blue-500 cursor-pointer">
                    <FontAwesomeIcon icon={faChartLine} className="mr-3 text-lg" />
                    Watchlist
                </li>
                <li className="flex items-center text-gray-700 hover:text-blue-500 cursor-pointer">
                    <FontAwesomeIcon icon={faWallet} className="mr-3 text-lg" />
                    Portfolio
                </li>
                <li className="flex items-center text-gray-700 hover:text-blue-500 cursor-pointer">
                    <FontAwesomeIcon icon={faFileAlt} className="mr-3 text-lg" />
                    Orders
                </li>
                <li className="flex items-center text-gray-700 hover:text-blue-500 cursor-pointer">
                    <FontAwesomeIcon icon={faHistory} className="mr-3 text-lg" />
                    History
                </li>
                <li className="flex items-center text-gray-700 hover:text-blue-500 cursor-pointer">
                    <FontAwesomeIcon icon={faCog} className="mr-3 text-lg" />
                    Settings
                </li>
                <li className="flex items-center text-gray-700 hover:text-blue-500 cursor-pointer">
                    <FontAwesomeIcon icon={faCommentDots} className="mr-3 text-lg" />
                    Trading Assistant
                </li>
            </ul>
        </div>
    );
};

export default Sidebar;