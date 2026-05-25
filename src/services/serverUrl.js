export const getServerBaseUrl = () => {
  const domainUrl = import.meta.env.VITE_DOMAIN_URL;
  if (domainUrl) {
    return domainUrl.replace(/\/$/, "");
  }

  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    return apiUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
  }

  return "";
};
