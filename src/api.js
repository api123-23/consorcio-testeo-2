const BASE = '/api';

function getToken() {
  try {
    return localStorage.getItem('concorcio_token');
  } catch {
    return null;
  }
}

function clearToken() {
  localStorage.removeItem('concorcio_token');
  localStorage.removeItem('concorcio_user');
}

async function request(method, path, body) {
  const token = getToken();
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    if (res.status === 401) {
      clearToken();
      window.location.reload();
    }
    const text = await res.text();
    let msg;
    try { msg = JSON.parse(text).error; } catch { msg = text; }
    throw new Error(msg || `Error ${res.status}`);
  }
  return res.json();
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  del: (path) => request('DELETE', path),
};
