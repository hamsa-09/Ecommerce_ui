import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Navbar = () => {
  const { user, logoutUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center">

      {/* Left Side */}
      <div className="flex gap-6 items-center">
        <h1 className="font-bold text-lg">VertexSpace</h1>

        {user && (
          <>
            <Link to="/dashboard" className="hover:text-gray-300">
              Dashboard
            </Link>

            <Link to="/resources" className="hover:text-gray-300">
              Resources
            </Link>
            <Link to="/bookings" className="hover:text-gray-300">
            Bookings
            </Link>
          </>
        )}
      </div>

      {/* Right Side */}
      <div className="flex gap-4 items-center">
        {!user && (
          <>
            <Link to="/login" className="hover:text-gray-300">
              Login
            </Link>
            <Link to="/register" className="hover:text-gray-300">
              Register
            </Link>
          </>
        )}

        {user && (
          <>
            <span className="text-sm">
              {user.username} ({user.roles[0]})
            </span>

            <button
              onClick={handleLogout}
              className="bg-red-500 px-3 py-1 rounded hover:bg-red-600 transition"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
