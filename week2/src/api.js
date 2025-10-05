const BASE = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5001';
async function request(path, opts = {}) {
    const res = await fetch(BASE + path, {
        ...opts,
        headers: {
            'Content-Type': 'application/json',
            ...(opts.headers || {}),
        },
    });
    if (!res.ok) {
        let msg = `${res.status} ${res.statusText}`;
        try {
            const data = await res.json();
            msg = data?.error || msg;
        }
        catch { }
        throw new Error(msg);
    }
    return res.json();
}
export const api = {
    async register(email, password) {
        return request(`/auth/register`, { method: 'POST', body: JSON.stringify({ email, password }) });
    },
    async login(email, password) {
        return request(`/auth/login`, { method: 'POST', body: JSON.stringify({ email, password }) });
    },
    async listPolicies(token, params) {
        const qs = new URLSearchParams();
        if (params?.q)
            qs.set('q', params.q);
        if (params?.status && params.status !== 'All')
            qs.set('status', params.status);
        return request(`/policies?${qs.toString()}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
    },
    async getPolicy(token, id) {
        return request(`/policies/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    },
    async createPolicy(token, payload) {
        return request(`/policies`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { Authorization: `Bearer ${token}` },
        });
    },
    async updatePolicy(token, id, payload) {
        return request(`/policies/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
            headers: { Authorization: `Bearer ${token}` },
        });
    },
    async deletePolicy(token, id) {
        return fetch(BASE + `/policies/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).then(res => {
            if (!res.ok)
                throw new Error('Failed to delete');
            return true;
        });
    },
};
