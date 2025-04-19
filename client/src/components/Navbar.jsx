import React from "react";

const Navbar = () => {
    const [searchQuery, setSearchQuery] = React.useState("");

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        // Implement filtering logic here
    };

    return (
        <header className="flex justify-between items-center bg-white shadow-md p-4">
            <h2 className="text-xl font-semibold text-gray-800">My Watchlist</h2>
            <div className="flex items-center space-x-4">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearch}
                    placeholder="Search stocks..."
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition duration-300">
                    Add Stock
                </button>
            </div>
        </header>
    );
};

export default Navbar;