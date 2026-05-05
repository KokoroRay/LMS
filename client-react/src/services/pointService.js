import api from "./authService";

export const fetchAllPointAPI = (id) => {
  return api.get(`/grades/student/${id}`)
}
  