const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';

export async function api(path, { token, method = 'GET', body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.message ?? 'Request failed'), { status: res.status, code: data.code });
  return data;
}

export async function uploadCover(token, bookId, file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}/books/${bookId}/cover`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error('Cover upload failed');
  return res.json().catch(() => null);
}
