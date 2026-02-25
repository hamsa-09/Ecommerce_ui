import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  assignDesk,
  getAssignedDesks,
  getAssignableDesks,
  getAssignableUsers,
  unassignDesk,
} from "../services/DeskAssignmentService";

const extractList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const extractMessage = (payload, fallback) => {
  if (typeof payload === "string") return payload;
  if (typeof payload?.data === "string") return payload.data;
  return fallback;
};

const DeskAssignments = () => {
  const { user } = useContext(AuthContext);
  const [desks, setDesks] = useState([]);
  const [users, setUsers] = useState([]);
  const [assignedDesks, setAssignedDesks] = useState([]);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [form, setForm] = useState({
    userId: "",
    resourceId: "",
    startUtc: "",
    endUtc: "",
  });

  const canManageAssignments =
    user?.roles?.includes("SYSTEM_ADMIN") ||
    user?.roles?.includes("DEPARTMENT_ADMIN");

  const deskMap = useMemo(
    () => new Map(desks.map((desk) => [String(desk.id), desk])),
    [desks]
  );

  const userMap = useMemo(
    () => new Map(users.map((currentUser) => [String(currentUser.id), currentUser])),
    [users]
  );

  const pushHistory = (entry) => {
    setAssignmentHistory((prev) => [entry, ...prev].slice(0, 25));
  };

  const fetchBaseData = async () => {
    try {
      const [deskRes, userRes, assignedRes] = await Promise.all([
        getAssignableDesks(),
        getAssignableUsers(),
        getAssignedDesks(),
      ]);
      setDesks(extractList(deskRes));
      setUsers(extractList(userRes));
      setAssignedDesks(extractList(assignedRes));
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || "Failed to load desk assignment data",
        type: "error",
      });
    }
  };

  useEffect(() => {
    if (canManageAssignments) {
      fetchBaseData();
    }
  }, [canManageAssignments]);

  const handleAssign = async () => {
    if (!form.userId || !form.resourceId || !form.startUtc) {
      setMessage({
        text: "User, desk and start time are required",
        type: "error",
      });
      return;
    }

    try {
      setMessage({ text: "", type: "" });

      const payload = {
        userId: Number(form.userId),
        resourceId: Number(form.resourceId),
        startUtc: new Date(form.startUtc).toISOString(),
        endUtc: form.endUtc ? new Date(form.endUtc).toISOString() : null,
      };

      const res = await assignDesk(payload);
      const successText = extractMessage(res, "Desk assigned successfully");

      setMessage({ text: successText, type: "success" });
      pushHistory({
        action: "ASSIGNED",
        deskName: deskMap.get(String(form.resourceId))?.name || "Desk",
        userName: userMap.get(String(form.userId))?.username || "User",
        at: new Date().toISOString(),
      });

      setForm({ userId: "", resourceId: "", startUtc: "", endUtc: "" });
      const assignedRes = await getAssignedDesks();
      setAssignedDesks(extractList(assignedRes));
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || "Desk assignment failed",
        type: "error",
      });
    }
  };

  const handleUnassign = async (assignmentId, deskName) => {
    try {
      setMessage({ text: "", type: "" });
      const res = await unassignDesk(assignmentId);
      const successText = extractMessage(res, "Desk unassigned successfully");
      setMessage({ text: successText, type: "success" });

      pushHistory({
        action: "UNASSIGNED",
        deskName: deskName || "Desk",
        userName: "",
        at: new Date().toISOString(),
      });

      setAssignedDesks((prev) =>
        prev.filter((desk) => String(desk.id) !== String(assignmentId))
      );
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || "Desk unassign failed",
        type: "error",
      });
    }
  };

  if (!canManageAssignments) {
    return <div className="p-6 text-red-600">Access denied</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Desk Assignments</h1>

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
        <h2 className="font-bold mb-3">Assign Desk</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <select
            className="border p-2 bg-white"
            value={form.userId}
            onChange={(e) => setForm({ ...form, userId: e.target.value })}
          >
            <option value="">Select User</option>
            {users.map((assignableUser) => (
              <option key={assignableUser.id} value={assignableUser.id}>
                {assignableUser.username} ({assignableUser.departmentName})
              </option>
            ))}
          </select>

          <select
            className="border p-2 bg-white"
            value={form.resourceId}
            onChange={(e) => setForm({ ...form, resourceId: e.target.value })}
          >
            <option value="">Select Desk with ASSIGNED mode</option>
            {desks.map((desk) => (
              <option key={desk.id} value={desk.id}>
                {desk.name} - {desk.departmentName} ({desk.deskMode})
              </option>
            ))}
          </select>

          <input
            type="datetime-local"
            className="border p-2"
            value={form.startUtc}
            onChange={(e) => setForm({ ...form, startUtc: e.target.value })}
          />

          <input
            type="datetime-local"
            className="border p-2"
            value={form.endUtc}
            onChange={(e) => setForm({ ...form, endUtc: e.target.value })}
            placeholder="Optional end"
          />
        </div>

        <button
          onClick={handleAssign}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Assign Desk
        </button>
      </div>

      <div className="border p-4 rounded mb-6">
        <h2 className="font-bold mb-3">Assignable ASSIGNED Desks</h2>
        {desks.length === 0 ? (
          <p className="text-gray-600">No assignable desks found.</p>
        ) : (
          <div className="grid gap-2">
            {desks.map((desk) => (
              <div key={desk.id} className="border rounded p-3">
                <p><b>Name:</b> {desk.name}</p>
                <p><b>Department:</b> {desk.departmentName}</p>
                <p><b>Floor:</b> {desk.floorName}</p>
                <p><b>Desk Mode:</b> {desk.deskMode}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border p-4 rounded mb-6">
        <h2 className="font-bold mb-3">Assignment History / Active Assignments</h2>
        {assignedDesks.length === 0 ? (
          <p className="text-gray-600">No assigned desks found.</p>
        ) : (
          <div className="grid gap-2">
            {assignedDesks.map((desk) => (
              <div key={desk.id} className="border rounded p-3 flex justify-between items-center">
                <div>
                  <p><b>Name:</b> {desk.name}</p>
                  {desk.userName ? <p><b>User:</b> {desk.userName}</p> : null}
                  <p><b>Department:</b> {desk.departmentName}</p>
                  <p><b>Floor:</b> {desk.floorName}</p>
                  <p><b>Desk Mode:</b> {desk.deskMode}</p>
                </div>
                <button
                  onClick={() => handleUnassign(desk.id, desk.name)}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  Unassign
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border p-4 rounded">
        <h2 className="font-bold mb-3">Recent Actions</h2>
        {assignmentHistory.length === 0 ? (
          <p className="text-gray-600">No actions yet.</p>
        ) : (
          <div className="grid gap-2">
            {assignmentHistory.map((entry, index) => (
              <div key={`${entry.at}-${index}`} className="border rounded p-3">
                <p><b>Action:</b> {entry.action}</p>
                <p><b>Desk:</b> {entry.deskName}</p>
                {entry.userName ? <p><b>User:</b> {entry.userName}</p> : null}
                <p><b>Time:</b> {new Date(entry.at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeskAssignments;
