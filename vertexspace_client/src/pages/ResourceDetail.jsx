import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getResourceById, updateResource } from "../services/resourceService";
import RoleBased from "../components/RoleBased";
import { AuthContext } from "../context/AuthContext";

const ResourceDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [resource, setResource] = useState(null);
  const [featuresInput, setFeaturesInput] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const isSystemAdmin = user?.roles?.includes("SYSTEM_ADMIN");

  useEffect(() => {
    fetchResource();
  }, []);

  const fetchResource = async () => {
    const res = await getResourceById(id);
    setResource(res.data);
    setFeaturesInput(
      Array.isArray(res.data?.features) ? res.data.features.join(", ") : ""
    );
  };

  const handleChange = (field, value) => {
    setResource({ ...resource, [field]: value });
  };

  const handleUpdate = async () => {
    setMessage({ text: "", type: "" });
    try {
      await updateResource(id, {
        ...resource,
        capacity: Number(resource.capacity),
        features: featuresInput
          .split(",")
          .map((feature) => feature.trim())
          .filter(Boolean),
      });
      setMessage({ text: "Resource updated successfully!", type: "success" });
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || "Update failed",
        type: "error",
      });
    }
  };

  if (!resource) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        {isSystemAdmin ? "Edit Resource" : "Resource Detail"}
      </h1>

      {message.text && (
        <p
          className={`mb-4 font-medium ${
            message.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}

      <fieldset disabled={!isSystemAdmin}>
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
          type="text"
          className="border p-2 w-full mb-3"
          value={resource.departmentName}
          onChange={(e) => handleChange("departmentName", e.target.value)}
        />

        {/* Floor */}
        <input
          type="text"
          className="border p-2 w-full mb-3"
          value={resource.floorName}
          onChange={(e) => handleChange("floorName", e.target.value)}
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
          value={featuresInput}
          onChange={(e) => setFeaturesInput(e.target.value)}
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
      </fieldset>

      {/* Update Button (Role Protected) */}
      <RoleBased roles={["SYSTEM_ADMIN"]}>
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
