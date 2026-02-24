import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getResourceById, updateResource } from "../services/resourceService";
import RoleBased from "../components/RoleBased";

const ResourceDetail = () => {
  const { id } = useParams();
  const [resource, setResource] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchResource();
  }, []);

  const fetchResource = async () => {
    const res = await getResourceById(id);
    setResource(res.data);
  };

  const handleChange = (field, value) => {
    setResource({ ...resource, [field]: value });
  };

  const handleUpdate = async () => {
    try {
      await updateResource(id, {
        ...resource,
        features: resource.features.map((f) => f.trim()),
      });
      setMessage("Resource updated successfully!");
    } catch (err) {
      setMessage("Update failed");
    }
  };

  if (!resource) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Resource</h1>

      {message && (
        <p className="mb-4 text-green-600 font-medium">{message}</p>
      )}

      {/* Name */}
      <input
        className="border p-2 w-full mb-3"
        value={resource.name}
        onChange={(e) => handleChange("name", e.target.value)}
      />

      {/* Type */}
      <select
        className="border p-2 w-full mb-3"
        value={resource.type}
        onChange={(e) => handleChange("type", e.target.value)}
      >
        <option value="ROOM">ROOM</option>
        <option value="DESK">DESK</option>
        <option value="PARKING">PARKING</option>
      </select>

      {/* Department */}
      <input
        type="number"
        className="border p-2 w-full mb-3"
        value={resource.departmentId}
        onChange={(e) => handleChange("departmentId", e.target.value)}
      />

      {/* Floor */}
      <input
        type="number"
        className="border p-2 w-full mb-3"
        value={resource.floorId}
        onChange={(e) => handleChange("floorId", e.target.value)}
      />

      {/* Capacity */}
      <input
        type="number"
        className="border p-2 w-full mb-3"
        value={resource.capacity}
        onChange={(e) => handleChange("capacity", e.target.value)}
      />

      {/* Features */}
      <input
        className="border p-2 w-full mb-3"
        value={resource.features.join(", ")}
        onChange={(e) =>
          handleChange(
            "features",
            e.target.value.split(",")
          )
        }
      />

      {/* Desk Mode */}
      <select
        className="border p-2 w-full mb-4"
        value={resource.deskMode}
        onChange={(e) => handleChange("deskMode", e.target.value)}
      >
        <option value="HOT_DESK">HOT_DESK</option>
        <option value="ASSIGNED">ASSIGNED</option>
      </select>

      {/* Update Button (Role Protected) */}
      <RoleBased roles={["SYSTEM_ADMIN", "DEPARTMENT_ADMIN"]}>
        <button
          onClick={handleUpdate}
          className="bg-yellow-500 text-white px-4 py-2 rounded w-full"
        >
          Update Resource
        </button>
      </RoleBased>
    </div>
  );
};

export default ResourceDetail;
