import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  createFloor,
  getBuildings,
  getFloors,
} from "../services/resourceService";

const extractList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const Floors = () => {
  const { user } = useContext(AuthContext);
  const [floors, setFloors] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [form, setForm] = useState({
    name: "",
    buildingId: "",
  });

  const isSystemAdmin = user?.roles?.includes("SYSTEM_ADMIN");

  const fetchFloors = async () => {
    try {
      const res = await getFloors();
      setFloors(extractList(res));
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || "Failed to load floors",
        type: "error",
      });
    }
  };

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
    fetchFloors();
  }, []);

  const handleCreateFloor = async () => {
    if (!form.name.trim() || !form.buildingId) {
      setMessage({ text: "Floor name and building are required", type: "error" });
      return;
    }

    const selectedBuilding = buildings.find(
      (building) => String(building.id) === String(form.buildingId)
    );

    if (!selectedBuilding?.name) {
      setMessage({ text: "Selected building is invalid", type: "error" });
      return;
    }

    try {
      setMessage({ text: "", type: "" });
      await createFloor({
        name: form.name.trim(),
        buildingName: selectedBuilding.name,
      });
      setForm({ name: "", buildingId: "" });
      setMessage({ text: "Floor created successfully!", type: "success" });
      fetchFloors();
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || "Floor creation failed",
        type: "error",
      });
    }
  };

  if (!isSystemAdmin) {
    return <div className="p-6 text-red-600">Access denied</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Floors</h1>

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
        <h2 className="font-bold mb-3">Create Floor</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Floor Name"
            className="border p-2"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <select
            className="border p-2 bg-white"
            value={form.buildingId}
            onChange={(e) => setForm({ ...form, buildingId: e.target.value })}
          >
            <option value="">Select Building</option>
            {buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleCreateFloor}
          className="bg-blue-600 text-white px-4 py-2 rounded mt-3"
        >
          Create
        </button>
      </div>

      <div className="border p-4 rounded">
        <h2 className="font-bold mb-3">Floor List</h2>
        {floors.length === 0 ? (
          <p className="text-gray-600">No floors found.</p>
        ) : (
          <div className="grid gap-2">
            {floors.map((floor) => (
              <div key={floor.id} className="border rounded p-3">
                <p><b>Name:</b> {floor.name}</p>
                <p><b>Building:</b> {floor.buildingName}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Floors;
