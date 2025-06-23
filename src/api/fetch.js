import { HTTP_ENDPOINT, API_KEY } from '../config.js';

export async function fetchGraphQL(query, variables = {}) {
  let response;
  try {
    response = await fetch(HTTP_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": API_KEY,
      },
      body: JSON.stringify({ query, variables }),
    });
  } catch (err) {
    throw new Error(`Network error: ${err.message}`);
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    throw new Error("Invalid JSON in response");
  }

  if (!response.ok) {
    const message = Array.isArray(data.errors)
      ? data.errors.map((e) => e.message).join(", ")
      : response.statusText;
    const error = new Error(`Request failed with status ${response.status}: ${message}`);
    error.response = data;
    error.status = response.status;
    throw error;
  }

  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const error = new Error(data.errors.map((e) => e.message).join(", "));
    error.response = data;
    error.status = response.status;
    throw error;
  }

  return data;
}

