import axiosInstance from "../utils/axiosInstance";

export const getAssignableDesks = async () => {
  const response = await axiosInstance.get("/desk-assignments/desks");
  return response.data;
};

export const getAssignableUsers = async () => {
  const response = await axiosInstance.get("/desk-assignments/users");
  return response.data;
};

export const assignDesk = async (data) => {
  const response = await axiosInstance.post("/desk-assignments", data);
  return response.data;
};

export const getAssignedDesks = async () => {
  const response = await axiosInstance.get("/desk-assignments/assigned-desks");
  return response.data;
};

export const unassignDesk = async (assignmentId) => {
  const response = await axiosInstance.delete(`/desk-assignments/${assignmentId}`);
  return response.data;
};
