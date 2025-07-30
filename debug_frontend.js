const SERVER_BASE_URL = import.meta.env.VITE_SERVER_BASE_URL;
const BASE = `${SERVER_BASE_URL}/api/v1/projects`;

export async function getMyProductivity(projectId, filters = {}) {
  console.log("PROJECT ID IN FRONTEND", projectId);
  console.log("SERVER_BASE_URL", SERVER_BASE_URL);
  console.log("BASE", BASE);

  const queryParams = new URLSearchParams();

  if (filters.dateRange) {
    if (filters.dateRange.startDate) {
      queryParams.append("dateRange.startDate", filters.dateRange.startDate);
    }
    if (filters.dateRange.endDate) {
      queryParams.append("dateRange.endDate", filters.dateRange.endDate);
    }
  }

  if (filters.timeRange) {
    queryParams.append("timeRange", filters.timeRange);
  }

  const url = `${BASE}/${projectId}/my-productivity${
    queryParams.toString() ? `?${queryParams.toString()}` : ""
  }`;

  console.log("CONSTRUCTED URL:", url);
  console.log("FULL URL:", new URL(url).href);

  const res = await fetch(url, {
    credentials: "include",
  });

  console.log("RESPONSE STATUS:", res.status);
  console.log("RESPONSE URL:", res.url);

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to get productivity data");
  }

  return await res.json();
}
