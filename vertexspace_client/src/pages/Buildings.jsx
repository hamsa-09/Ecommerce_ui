import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { createBuilding, getBuildings } from "../services/resourceService";

const extractList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const Buildings = () => {
  const { user } = useContext(AuthContext);
  const [buildings, setBuildings] = useState([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });

  const isSystemAdmin = user?.roles?.includes("SYSTEM_ADMIN");

  const fetchBuildings = async () => {
    try {
      const res = await getBuildings();
      setBuildings(extractList(res));
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || "Failed to load buildings",
        type: "error",
      });
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  const handleCreateBuilding = async () => {
    if (!name.trim()) {
      setMessage({ text: "Building name is required", type: "error" });
      return;
    }

    try {
      setMessage({ text: "", type: "" });
      await createBuilding({ name: name.trim() });
      setName("");
      setMessage({ text: "Building created successfully!", type: "success" });
      fetchBuildings();
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || "Building creation failed",
        type: "error",
      });
    }
  };

  if (!isSystemAdmin) {
    return <div className="p-6 text-red-600">Access denied</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Buildings</h1>

      {message.text && (
        <p
          className={`mb-4 font-medium ${
            message.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="border p-4 rounded bg-gray-50 mb-6">
        <h2 className="font-bold mb-3">Create Building</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Building Name"
            className="border p-2 flex-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            onClick={handleCreateBuilding}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Create
          </button>
        </div>
      </div>

      <div className="border p-4 rounded">
        <h2 className="font-bold mb-3">Building List</h2>
        {buildings.length === 0 ? (
          <p className="text-gray-600">No buildings found.</p>
        ) : (
          <div className="grid gap-2">
            {buildings.map((building) => (
              <div key={building.id} className="border rounded p-3">
                <p><b>Name:</b> {building.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Buildings;
