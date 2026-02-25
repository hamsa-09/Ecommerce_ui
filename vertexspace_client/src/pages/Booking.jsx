import { useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  acceptWaitlistOffer,
  getWaitlistStatus,
  joinWaitlist,
  leaveWaitlist,
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

const initialWaitlistForm = {
  resourceName: "",
  startUtc: "",
  endUtc: "",
};

const formatUtcToIst = (utcString) =>
  new Date(utcString).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

const unwrapData = (payload) => payload?.data ?? payload;

const getOfferSecondsLeft = (expiresAt) => {
  if (!expiresAt) return 0;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.floor(diff / 1000));
};

const formatOfferCountdown = (secondsLeft) => {
  if (secondsLeft <= 60) {
    return `${secondsLeft}s`;
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  return `${minutes}m ${seconds}s`;
};

const Booking = () => {
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const [resources, setResources] = useState([]);
  const [currentUserBookings, setCurrentUserBookings] = useState([]);
  const [otherUserBookings, setOtherUserBookings] = useState([]);
  const [error, setError] = useState("");
  const [rangeFilter, setRangeFilter] = useState({
    startUtc: "",
    endUtc: "",
  });
  const [waitlistStatus, setWaitlistStatus] = useState(null);
  const [waitlistContext, setWaitlistContext] = useState(null);
  const [waitlistMessage, setWaitlistMessage] = useState({ text: "", type: "" });
  const [offerSecondsLeft, setOfferSecondsLeft] = useState(0);
  const [waitlistForm, setWaitlistForm] = useState(initialWaitlistForm);

  const [form, setForm] = useState(initialBookingForm);

  useEffect(() => {
    fetchResources();
    fetchBookings();
  }, []);

  useEffect(() => {
    const prefillBooking = location.state?.prefillBooking;
    if (prefillBooking) {
      setForm({
        ...initialBookingForm,
        ...prefillBooking,
        resourceId: prefillBooking.resourceId ?? "",
        startUtc: prefillBooking.startUtc ?? "",
        endUtc: prefillBooking.endUtc ?? "",
        recurring: Boolean(prefillBooking.recurring),
        recurrenceType: prefillBooking.recurrenceType || "DAILY",
        recurrenceCount:
          prefillBooking.recurrenceCount == null
            ? 1
            : Number(prefillBooking.recurrenceCount),
      });
    }
  }, [location.state]);

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

  const buildWaitlistPayload = () => {
    if (!waitlistForm.resourceName || !waitlistForm.startUtc || !waitlistForm.endUtc) {
      return null;
    }

    return {
      resourceName: waitlistForm.resourceName,
      startUtc: new Date(waitlistForm.startUtc).toISOString(),
      endUtc: new Date(waitlistForm.endUtc).toISOString(),
    };
  };

  const fetchWaitlistStatus = async (contextPayload) => {
    try {
      const res = await getWaitlistStatus(
        contextPayload.resourceName,
        contextPayload.startUtc,
        contextPayload.endUtc
      );
      const statusData = unwrapData(res);
      setWaitlistStatus(statusData || null);
      return statusData;
    } catch {
      setWaitlistStatus(null);
      return null;
    }
  };

  const handleJoinWaitlist = async () => {
    const payload = buildWaitlistPayload();
    if (!payload) {
      setWaitlistMessage({
        text: "Select resource, start and end time to join waitlist",
        type: "error",
      });
      return;
    }

    try {
      setWaitlistMessage({ text: "", type: "" });
      await joinWaitlist(payload);
      setWaitlistContext(payload);
      await fetchWaitlistStatus(payload);
      setWaitlistMessage({ text: "Joined waitlist successfully", type: "success" });
    } catch (err) {
      setWaitlistMessage({
        text: err.response?.data?.error || "Failed to join waitlist",
        type: "error",
      });
    }
  };

  const handleCheckWaitlistStatus = async () => {
    const payload = buildWaitlistPayload();
    if (!payload) {
      setWaitlistMessage({
        text: "Select resource, start and end time to check waitlist status",
        type: "error",
      });
      return;
    }

    setWaitlistContext(payload);
    const statusData = await fetchWaitlistStatus(payload);

    if (!statusData) {
      setWaitlistMessage({ text: "No waitlist entry found", type: "error" });
      return;
    }

    setWaitlistMessage({ text: "Waitlist status updated", type: "success" });
  };

  const handleLeaveWaitlist = async () => {
    if (!waitlistStatus?.id) return;

    try {
      setWaitlistMessage({ text: "", type: "" });
      await leaveWaitlist(waitlistStatus.id);
      setWaitlistStatus(null);
      setWaitlistContext(null);
      setOfferSecondsLeft(0);
      setWaitlistMessage({ text: "Left waitlist successfully", type: "success" });
    } catch (err) {
      setWaitlistMessage({
        text: err.response?.data?.error || "Failed to leave waitlist",
        type: "error",
      });
    }
  };

  const handleAcceptOffer = async () => {
    if (!waitlistStatus?.id) return;

    try {
      setWaitlistMessage({ text: "", type: "" });
      const res = await acceptWaitlistOffer(waitlistStatus.id);
      const resultMessage = unwrapData(res);
      setWaitlistMessage({
        text:
          typeof resultMessage === "string"
            ? resultMessage
            : "Offer accepted. Booking confirmed.",
        type: "success",
      });
      setWaitlistStatus(null);
      setOfferSecondsLeft(0);
      fetchBookings();
    } catch (err) {
      setWaitlistMessage({
        text: err.response?.data?.error || "Failed to accept offer",
        type: "error",
      });
    }
  };

  useEffect(() => {
    if (!waitlistContext) return;

    const interval = setInterval(() => {
      fetchWaitlistStatus(waitlistContext);
    }, 10000);

    return () => clearInterval(interval);
  }, [waitlistContext]);

  useEffect(() => {
    if (waitlistStatus?.offerStatus !== "OFFERED" || !waitlistStatus.offerExpiresAt) {
      setOfferSecondsLeft(0);
      return;
    }

    setOfferSecondsLeft(getOfferSecondsLeft(waitlistStatus.offerExpiresAt));
    const timer = setInterval(() => {
      const seconds = getOfferSecondsLeft(waitlistStatus.offerExpiresAt);
      setOfferSecondsLeft(seconds);

      if (seconds <= 0) {
        setWaitlistStatus(null);
        setWaitlistMessage({ text: "Offer expired", type: "error" });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [waitlistStatus?.offerStatus, waitlistStatus?.offerExpiresAt]);

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
                <p><b>Start (IST):</b> {formatUtcToIst(b.startUtc)}</p>
                <p><b>End (IST):</b> {formatUtcToIst(b.endUtc)}</p>
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
          value={form.resourceId ?? ""}
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
          value={form.startUtc ?? ""}
          onChange={(e) =>
            setForm({ ...form, startUtc: e.target.value })
          }
        />

        {/* End */}
        <input
          type="datetime-local"
          className="border p-2 w-full mb-3"
          value={form.endUtc ?? ""}
          onChange={(e) =>
            setForm({ ...form, endUtc: e.target.value })
          }
        />

        {/* Recurring Toggle */}
        <label className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={Boolean(form.recurring)}
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
              value={form.recurrenceType ?? "DAILY"}
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
              value={form.recurrenceCount ?? 1}
              onChange={(e) => {
                const nextValue = e.target.value;
                setForm({
                  ...form,
                  recurrenceCount:
                    nextValue === "" ? 1 : Number(nextValue),
                });
              }}
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

      <div className="border p-4 rounded mb-8 bg-gray-50">
        <h2 className="text-lg font-bold mb-3">Waitlist</h2>

        {waitlistMessage.text && (
          <p
            className={`mb-3 font-medium ${
              waitlistMessage.type === "success" ? "text-green-600" : "text-red-600"
            }`}
          >
            {waitlistMessage.text}
          </p>
        )}

        <p className="text-sm text-gray-700 mb-3">
          Waitlist works for selected resource + selected start/end slot.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
          <select
            className="border p-2 bg-white"
            value={waitlistForm.resourceName}
            onChange={(e) =>
              setWaitlistForm({ ...waitlistForm, resourceName: e.target.value })
            }
          >
            <option value="">Select Resource</option>
            {resources.map((resource) => (
              <option key={resource.id} value={resource.name}>
                {resource.name}
              </option>
            ))}
          </select>

          <input
            type="datetime-local"
            className="border p-2"
            value={waitlistForm.startUtc}
            onChange={(e) =>
              setWaitlistForm({ ...waitlistForm, startUtc: e.target.value })
            }
          />

          <input
            type="datetime-local"
            className="border p-2"
            value={waitlistForm.endUtc}
            onChange={(e) =>
              setWaitlistForm({ ...waitlistForm, endUtc: e.target.value })
            }
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={handleJoinWaitlist}
            className="bg-purple-600 text-white px-4 py-2 rounded"
          >
            Join Waitlist
          </button>
          <button
            onClick={handleCheckWaitlistStatus}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Check Status
          </button>
          {waitlistStatus?.id && (
            <button
              onClick={handleLeaveWaitlist}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Leave Waitlist
            </button>
          )}
        </div>

        {waitlistStatus && (
          <div className="border rounded p-3 bg-white">
            <p><b>Offer Status:</b> {waitlistStatus.offerStatus ?? "WAITLIST"}</p>
            <p><b>Start (IST):</b> {formatUtcToIst(waitlistStatus.startUtc)}</p>
            <p><b>End (IST):</b> {formatUtcToIst(waitlistStatus.endUtc)}</p>

            {waitlistStatus.offerStatus === "OFFERED" && waitlistStatus.offerExpiresAt && (
              <>
                <p><b>Offer Expires (IST):</b> {formatUtcToIst(waitlistStatus.offerExpiresAt)}</p>
                <p className="font-semibold text-orange-600 mb-3">
                  Time Left: {formatOfferCountdown(offerSecondsLeft)}
                </p>

                <button
                  onClick={handleAcceptOffer}
                  className="bg-green-600 text-white px-4 py-2 rounded"
                >
                  Accept Offer
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* My Bookings */}
      <div className="border p-4 rounded mb-6 bg-gray-50">
        <h2 className="text-lg font-bold mb-3">Filter by Range</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <input
            type="datetime-local"
            className="border p-2"
            value={rangeFilter.startUtc ?? ""}
            onChange={(e) =>
              setRangeFilter({ ...rangeFilter, startUtc: e.target.value })
            }
          />

          <input
            type="datetime-local"
            className="border p-2"
            value={rangeFilter.endUtc ?? ""}
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

export default Booking;
