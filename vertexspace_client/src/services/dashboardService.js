import axiosInstance from "../utils/axiosInstance";

export const getDashboardRecommendations = async () => {
  const response = await axiosInstance.get("/dashboard/recommendations");
  return response.data;
};

export const getBestSlots = async (resourceId, istDate, duration) => {
  const response = await axiosInstance.get(
    `/best-slot/${resourceId}/istdate/${istDate}/duration/${duration}`
  );
  return response.data;
};
