import { useEffect, useState } from "react";
import {
  createBooking,
  listMyBookings,
  cancelBooking,
  cancelSeries,
} from "../services/bookingService";
import { getResources } from "../services/resourceService";

const BookingPage = () => {
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    resourceId: "",
    startUtc: "",
    endUtc: "",
    recurring: false,
    recurrenceType: "DAILY",
    recurrenceCount: 1,
  });

  useEffect(() => {
    fetchResources();
    fetchBookings();
  }, []);

  const fetchResources = async () => {
    const res = await getResources();
    setResources(res.data);
  };

  const fetchBookings = async () => {
    const res = await listMyBookings();
    setBookings(res.data);
  };

  const handleCreate = async () => {
    try {
      setError("");

      await createBooking({
        ...form,
        startUtc: new Date(form.startUtc).toISOString(),
        endUtc: new Date(form.endUtc).toISOString(),
      });

      fetchBookings();
      alert("Booking created!");
    } catch (err) {
      setError(err.response?.data?.error || "Booking failed");
    }
  };

  const handleCancel = async (id) => {
    await cancelBooking(id);
    fetchBookings();
  };

  const handleCancelSeries = async (id) => {
    await cancelSeries(id);
    fetchBookings();
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">

      <h1 className="text-2xl font-bold mb-6">Book Resource</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {/* Booking Form */}
      <div className="border p-4 rounded mb-8 bg-gray-50">

        {/* Resource */}
        <select
          className="border p-2 w-full mb-3"
          value={form.resourceId}
          onChange={(e) =>
            setForm({ ...form, resourceId: e.target.value })
          }
        >
          <option value="">Select Resource</option>
          {resources.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} ({r.type})
            </option>
          ))}
        </select>

        {/* Start */}
        <input
          type="datetime-local"
          className="border p-2 w-full mb-3"
          onChange={(e) =>
            setForm({ ...form, startUtc: e.target.value })
          }
        />

        {/* End */}
        <input
          type="datetime-local"
          className="border p-2 w-full mb-3"
          onChange={(e) =>
            setForm({ ...form, endUtc: e.target.value })
          }
        />

        {/* Recurring Toggle */}
        <label className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={form.recurring}
            onChange={(e) =>
              setForm({ ...form, recurring: e.target.checked })
            }
          />
          Recurring Booking
        </label>

        {form.recurring && (
          <>
            <select
              className="border p-2 w-full mb-3"
              value={form.recurrenceType}
              onChange={(e) =>
                setForm({ ...form, recurrenceType: e.target.value })
              }
            >
              <option value="DAILY">DAILY</option>
              <option value="WEEKLY">WEEKLY</option>
            </select>

            <input
              type="number"
              min="1"
              className="border p-2 w-full mb-3"
              value={form.recurrenceCount}
              onChange={(e) =>
                setForm({
                  ...form,
                  recurrenceCount: Number(e.target.value),
                })
              }
            />
          </>
        )}

        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 w-full rounded"
        >
          Create Booking
        </button>
      </div>

      {/* My Bookings */}
      <h2 className="text-xl font-bold mb-4">My Bookings</h2>

      {bookings.map((b) => (
        <div
          key={b.id}
          className="border p-4 mb-3 flex justify-between items-center"
        >
          <div>
            <p><b>Resource:</b> {b.resourceId}</p>
            <p><b>Start:</b> {new Date(b.startUtc).toLocaleString()}</p>
            <p><b>End:</b> {new Date(b.endUtc).toLocaleString()}</p>
            <p><b>Status:</b> {b.status}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleCancel(b.id)}
              className="bg-red-500 text-white px-3 py-1"
            >
              Cancel
            </button>

            {b.recurring && (
              <button
                onClick={() => handleCancelSeries(b.id)}
                className="bg-orange-500 text-white px-3 py-1"
              >
                Cancel Series
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BookingPage;
