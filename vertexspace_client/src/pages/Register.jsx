import { useEffect, useState } from "react";
import { getDepartments, register } from "../services/authService";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    departmentName: "",
    roleName: "USER",
  });

  const [error, setError] = useState("");
  const [departments, setDepartments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await getDepartments();
        setDepartments(Array.isArray(res?.data) ? res.data : []);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load departments");
      }
    };

    fetchDepartments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await register(form);
      if (res.success) {
        navigate("/login");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 shadow-md rounded w-80"
      >
        <h2 className="text-xl font-bold mb-4">Register</h2>

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        {/* Username */}
        <input
          type="text"
          placeholder="Username"
          className="w-full mb-3 p-2 border rounded"
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          className="w-full mb-3 p-2 border rounded"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        {/* Password */}
        <input
          type="password"
          placeholder="Password"
          className="w-full mb-3 p-2 border rounded"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        {/* Department Dropdown */}
        <select
          className="w-full mb-3 p-2 border rounded bg-white"
          value={form.departmentName}
          onChange={(e) =>
            setForm({ ...form, departmentName: e.target.value })
          }
        >
          <option value="" disabled>
            Select Department
          </option>
          {departments.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </select>

        {/* Role Dropdown */}
        <select
          className="w-full mb-4 p-2 border rounded bg-white"
          value={form.roleName}
          onChange={(e) =>
            setForm({ ...form, roleName: e.target.value })
          }
        >
          <option value="USER">USER</option>
          <option value="DEPARTMENT_ADMIN">DEPARTMENT_ADMIN</option>
          <option value="SYSTEM_ADMIN">SYSTEM_ADMIN</option>
        </select>

        <button className="bg-green-600 text-white w-full py-2 rounded hover:bg-green-700 transition">
          Register
        </button>
      </form>
    </div>
  );
};

export default Register;
