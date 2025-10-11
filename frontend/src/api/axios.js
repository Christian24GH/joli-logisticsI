import axios from 'axios'

export const AUTH_API = axios.create({
  baseURL: import.meta.env.VITE_AUTH_BACKEND,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

export const FLEET_API = axios.create({
  baseURL: import.meta.env.VITE_FLEET_BACKEND,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});




/**
 * API HELPERS
 */
export async function login(credentials = {}) {
  await AUTH_API.post("/api/login", credentials, { withCredentials: true })
}

export async function logout() {
  const res = await AUTH_API.post("/api/logout", {}, { withCredentials: true })
  return res.data
}

export default AUTH_API
