import { useContext, useEffect, useMemo, useState } from "react";
import {
  createBooking,
  listMyBookings,
  listBookingsByRange,
  cancelBooking,
  cancelSeries,
} from "../services/bookingService";
import { getResources } from "../services/resourceService";
import { AuthContext } from "../context/AuthContext";

const initialBookingForm = {
  resourceId: "",
  startUtc: "",
  endUtc: "",
  recurring: false,
  recurrenceType: "DAILY",
  recurrenceCount: 1,
};

const BookingPage = () => {
  const { user } = useContext(AuthContext);
  const [resources, setResources] = useState([]);
  const [currentUserBookings, setCurrentUserBookings] = useState([]);
  const [otherUserBookings, setOtherUserBookings] = useState([]);
  const [error, setError] = useState("");
  const [rangeFilter, setRangeFilter] = useState({
    startUtc: "",
    endUtc: "",
  });

  const [form, setForm] = useState(initialBookingForm);

  useEffect(() => {
    fetchResources();
    fetchBookings();
  }, []);

  const isAdminRole =
    user?.roles?.includes("SYSTEM_ADMIN") ||
    user?.roles?.includes("DEPARTMENT_ADMIN");

  const sanitizeBookings = (bookingList) =>
    (Array.isArray(bookingList) ? bookingList : []).filter(
      (booking) => booking?.status !== "CANCELLED"
    );

  const fetchResources = async () => {
    const res = await getResources();
    setResources(res.data);
  };

  const applyBookingResponse = (responseData) => {
    setCurrentUserBookings(sanitizeBookings(responseData?.currentUserBookings));
    setOtherUserBookings(sanitizeBookings(responseData?.otherUserBookings));
  };

  const fetchBookings = async () => {
    try {
      const res = await listMyBookings();
      applyBookingResponse(res?.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load bookings");
      setCurrentUserBookings([]);
      setOtherUserBookings([]);
    }
  };

  const handleApplyRangeFilter = async () => {
    if (!rangeFilter.startUtc || !rangeFilter.endUtc) {
      setError("Please select both range start and end");
      return;
    }

    try {
      setError("");
      const res = await listBookingsByRange(
        new Date(rangeFilter.startUtc).toISOString(),
        new Date(rangeFilter.endUtc).toISOString()
      );
      applyBookingResponse(res?.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to filter bookings by range");
    }
  };

  const handleClearRangeFilter = async () => {
    setRangeFilter({ startUtc: "", endUtc: "" });
    setError("");
    fetchBookings();
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
      setForm(initialBookingForm);
      alert("Booking created!");
    } catch (err) {
      setError(err.response?.data?.error || "Booking failed");
    }
  };

  const handleCancel = async (id) => {
    try {
      setError("");
      await cancelBooking(id);
      setCurrentUserBookings((prev) => prev.filter((booking) => booking.id !== id));
      setOtherUserBookings((prev) => prev.filter((booking) => booking.id !== id));
    } catch (err) {
      setError(err.response?.data?.error || "Failed to cancel booking");
    }
  };

  const handleCancelSeries = async (id) => {
    try {
      setError("");
      const matchedBooking =
        currentUserBookings.find((booking) => booking.id === id) ||
        otherUserBookings.find((booking) => booking.id === id);

      await cancelSeries(id);

      if (matchedBooking?.recurrenceGroupId) {
        setCurrentUserBookings((prev) =>
          prev.filter(
            (booking) =>
              booking.recurrenceGroupId !== matchedBooking.recurrenceGroupId
          )
        );
        setOtherUserBookings((prev) =>
          prev.filter(
            (booking) =>
              booking.recurrenceGroupId !== matchedBooking.recurrenceGroupId
          )
        );
      } else {
        setCurrentUserBookings((prev) => prev.filter((booking) => booking.id !== id));
        setOtherUserBookings((prev) => prev.filter((booking) => booking.id !== id));
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to cancel booking series");
    }
  };

  const groupBookings = (bookingList) => {
    const groups = new Map();

    bookingList.forEach((booking) => {
      const hasSeriesGroup = Boolean(booking.recurrenceGroupId);
      const groupKey = hasSeriesGroup
        ? `series-${booking.recurrenceGroupId}`
        : `single-${booking.id}`;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          key: groupKey,
          recurrenceGroupId: booking.recurrenceGroupId || null,
          recurring: hasSeriesGroup,
          items: [],
        });
      }

      groups.get(groupKey).items.push(booking);
    });

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        items: group.items.sort(
          (a, b) => new Date(a.startUtc).getTime() - new Date(b.startUtc).getTime()
        ),
      }))
      .sort(
        (a, b) =>
          new Date(a.items[0]?.startUtc).getTime() -
          new Date(b.items[0]?.startUtc).getTime()
      );
  };

  const groupedCurrentUserBookings = useMemo(
    () => groupBookings(currentUserBookings),
    [currentUserBookings]
  );

  const groupedOtherUserBookings = useMemo(
    () => groupBookings(otherUserBookings),
    [otherUserBookings]
  );

  const renderBookingGroups = (groups, canCancel = true) => {
    if (!groups.length) {
      return <p className="text-gray-600 mb-6">No bookings found.</p>;
    }

    return groups.map((group) => (
      <div key={group.key} className="border p-4 mb-3">
        {group.recurring && (
          <div className="mb-3 pb-2 border-b flex justify-between items-center">
            <div>
              <p className="font-semibold">Recurring Booking Series</p>
              <p className="text-sm text-gray-600">
                ({group.items.length} bookings)
              </p>
            </div>
            {canCancel && (
              <button
                onClick={() => handleCancelSeries(group.items[0].id)}
                className="bg-orange-500 text-white px-3 py-1"
              >
                Cancel Series
              </button>
            )}
          </div>
        )}

        <div className="grid gap-3">
          {group.items.map((b) => (
            <div
              key={b.id}
              className="flex justify-between items-center border rounded p-3"
            >
              <div>
                <p><b>Resource:</b> {b.resourceName}</p>
                <p><b>Start:</b> {new Date(b.startUtc).toLocaleString()}</p>
                <p><b>End:</b> {new Date(b.endUtc).toLocaleString()}</p>
                <p><b>Status:</b> {b.status}</p>
              </div>

              {canCancel && (
                <button
                  onClick={() => handleCancel(b.id)}
                  className="bg-red-500 text-white px-3 py-1"
                >
                  Cancel
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    ));
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
      <div className="border p-4 rounded mb-6 bg-gray-50">
        <h2 className="text-lg font-bold mb-3">Filter by Range</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <input
            type="datetime-local"
            className="border p-2"
            value={rangeFilter.startUtc}
            onChange={(e) =>
              setRangeFilter({ ...rangeFilter, startUtc: e.target.value })
            }
          />

          <input
            type="datetime-local"
            className="border p-2"
            value={rangeFilter.endUtc}
            onChange={(e) =>
              setRangeFilter({ ...rangeFilter, endUtc: e.target.value })
            }
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleApplyRangeFilter}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Apply Range
          </button>
          <button
            onClick={handleClearRangeFilter}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Clear Filter
          </button>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">My Bookings</h2>
      {renderBookingGroups(groupedCurrentUserBookings, true)}

      {isAdminRole && (
        <>
          <h2 className="text-xl font-bold mt-8 mb-4">Other Users Bookings</h2>
          {renderBookingGroups(groupedOtherUserBookings, true)}
        </>
      )}
    </div>
  );
};

export default BookingPage;
