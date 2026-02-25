import axiosInstance from "../utils/axiosInstance";

export const createBooking = async (data) => {
  const response = await axiosInstance.post("/bookings", data);
  return response.data;
};

export const listMyBookings = async () => {
  const response = await axiosInstance.get("/bookings/user");
  return response.data;
};

export const cancelBooking = async (id) => {
  const response = await axiosInstance.patch(`/bookings/${id}/cancel`);
  return response.data;
};

export const cancelSeries = async (id) => {
  const response = await axiosInstance.patch(`/bookings/${id}/cancel-series`);
  return response.data;
};

export const listBookingsByResource = async (resourceId, startUtc, endUtc) => {
  const response = await axiosInstance.get(
    `/bookings/resource/${resourceId}`,
    {
      params: { startUtc, endUtc },
    }
  );
  return response.data;
};

export const listBookingsByRange = async (startUtc, endUtc) => {
  const response = await axiosInstance.get("/bookings/range", {
    params: { startUtc, endUtc },
  });
  return response.data;
};

export const joinWaitlist = async (data) => {
  const response = await axiosInstance.post("/waitlist/join", data);
  return response.data;
};

export const leaveWaitlist = async (waitlistId) => {
  const response = await axiosInstance.delete(`/waitlist/leave/${waitlistId}`);
  return response.data;
};

export const getWaitlistStatus = async (resourceName, startUtc, endUtc) => {
  const encodedResourceName = encodeURIComponent(resourceName);
  const encodedStart = encodeURIComponent(startUtc);
  const encodedEnd = encodeURIComponent(endUtc);
  const response = await axiosInstance.get(
    `/waitlist/status/${encodedResourceName}/start/${encodedStart}/end/${encodedEnd}`
  );
  return response.data;
};

export const acceptWaitlistOffer = async (waitlistId) => {
  const response = await axiosInstance.patch(`/waitlist/offer/accept/${waitlistId}`);
  return response.data;
};
