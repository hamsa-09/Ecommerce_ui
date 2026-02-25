import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import * as dashboardService from "../services/dashboardService";
import { getResources } from "../services/resourceService";

const formatDateToIstApi = (dateString) => {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}-${month}-${year}`;
};

const formatUtcToIst = (utcString) =>
  new Date(utcString).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

const extractList = (responsePayload) => {
  if (Array.isArray(responsePayload)) return responsePayload;
  if (Array.isArray(responsePayload?.data)) return responsePayload.data;
  return [];
};

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [resources, setResources] = useState([]);
  const [bestSlots, setBestSlots] = useState([]);
  const [error, setError] = useState("");
  const [bestSlotForm, setBestSlotForm] = useState({
    resourceId: "",
    istDate: "",
    duration: 30,
  });

  const selectedResource = useMemo(
    () => resources.find((resource) => String(resource.id) === bestSlotForm.resourceId),
    [resources, bestSlotForm.resourceId]
  );

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError("");

        const [recommendationRes, resourceRes] = await Promise.all([
          dashboardService.getDashboardRecommendations(),
          getResources(),
        ]);

        setRecommendations(extractList(recommendationRes));
        setResources(extractList(resourceRes));
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load dashboard data");
      }
    };

    fetchDashboardData();
  }, []);

  const handleFindBestSlots = async () => {
    if (!bestSlotForm.resourceId || !bestSlotForm.istDate || !bestSlotForm.duration) {
      setError("Please select resource, date and duration");
      return;
    }

    try {
      setError("");
      const formattedDate = formatDateToIstApi(bestSlotForm.istDate);
      const res = await dashboardService.getBestSlots(
        bestSlotForm.resourceId,
        formattedDate,
        bestSlotForm.duration
      );
      setBestSlots(extractList(res));
    } catch (err) {
      setBestSlots([]);
      setError(err.response?.data?.error || "Failed to fetch best slots");
    }
  };

  const formatForDateTimeLocal = (utcString) => {
    const date = new Date(utcString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleBookFromSlot = (slot) => {
    navigate("/bookings", {
      state: {
        prefillBooking: {
          resourceId: String(bestSlotForm.resourceId),
          startUtc: formatForDateTimeLocal(slot.startUtc),
          endUtc: formatForDateTimeLocal(slot.endUtc),
          recurring: false,
          recurrenceType: "DAILY",
          recurrenceCount: 1,
        },
      },
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">
        Welcome {user.username}
      </h1>
      <p>Your role: {user.roles[0]}</p>

      {error && <p className="text-red-600 mt-3">{error}</p>}

      <div className="mt-6 border rounded p-4 bg-gray-50">
        <h2 className="text-xl font-bold mb-3">Recommended Resources</h2>

        {recommendations.length === 0 ? (
          <p className="text-gray-600">No recommendations available.</p>
        ) : (
          <div className="grid gap-3">
            {recommendations.map((item) => (
              <div key={item.resourceId} className="border rounded p-3 bg-white">
                <p className="font-semibold">{item.resourceName}</p>
                <p className="text-sm text-gray-700">
                  Total bookings: {item.bookingCount}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 border rounded p-4 bg-gray-50">
        <h2 className="text-xl font-bold mb-3">Best Slot Finder (IST)</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <select
            className="border p-2 bg-white"
            value={bestSlotForm.resourceId}
            onChange={(e) =>
              setBestSlotForm({ ...bestSlotForm, resourceId: e.target.value })
            }
          >
            <option value="">Select Resource</option>
            {resources.map((resource) => (
              <option key={resource.id} value={resource.id}>
                {resource.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            className="border p-2"
            value={bestSlotForm.istDate}
            onChange={(e) =>
              setBestSlotForm({ ...bestSlotForm, istDate: e.target.value })
            }
          />

          <input
            type="number"
            min="1"
            className="border p-2"
            value={bestSlotForm.duration}
            onChange={(e) =>
              setBestSlotForm({
                ...bestSlotForm,
                duration: Number(e.target.value),
              })
            }
          />
        </div>

        <button
          onClick={handleFindBestSlots}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Find Best Slots
        </button>

        <div className="mt-4 grid gap-3">
          {bestSlots.length === 0 ? (
            <p className="text-gray-600">No slots yet. Search to view best slots.</p>
          ) : (
            bestSlots.map((slot) => (
              <div key={slot.startUtc} className="border rounded p-3 bg-white">
                <p>
                  <b>Resource:</b> {selectedResource?.name || "Selected Resource"}
                </p>
                <p>
                  <b>Start (IST):</b> {formatUtcToIst(slot.startUtc)}
                </p>
                <p>
                  <b>End (IST):</b> {formatUtcToIst(slot.endUtc)}
                </p>

                <button
                  onClick={() => handleBookFromSlot(slot)}
                  className="mt-3 bg-green-600 text-white px-4 py-2 rounded"
                >
                  Book This Slot
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
