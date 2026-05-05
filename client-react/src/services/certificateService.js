import api from "./authService";

const CERTIFICATE_API = "/certificates";
const ADMIN_CERTIFICATE_API = "/admin/certificates";

export const fetchCertificatesByStudent = (studentId) => {
  return api.get(`${CERTIFICATE_API}/student/${studentId}`);
};

export const downloadCertificate = (certificateId) => {
  return api.get(`${CERTIFICATE_API}/download/${certificateId}`);
};

export const submitCertificateAppeal = (certificateId, formData) => {
  return api.post(`${CERTIFICATE_API}/appeal/${certificateId}`, formData);
};

export const revokeCertificate = (certificateId) => {
  return api.post(`${CERTIFICATE_API}/revoke/${certificateId}`);
};

export const fetchAllCertificatesAdmin = () => {
  return api.get(ADMIN_CERTIFICATE_API);
};

export const revokeCertificateAdmin = (certificateId, reason) => {
  return api.post(`${ADMIN_CERTIFICATE_API}/revoke/${certificateId}`, {
    reason,
  });
};

export const processCertificateAppeal = (
  certificateId,
  decision,
  adminFeedback
) => {
  return api.post(`${ADMIN_CERTIFICATE_API}/process-appeal/${certificateId}`, {
    decision,
    adminFeedback,
  });
};


