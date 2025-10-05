const KEY = 'w2_token';
export function getToken() { try {
    return localStorage.getItem(KEY) || '';
}
catch {
    return '';
} }
export function setToken(t) { try {
    localStorage.setItem(KEY, t);
}
catch { } }
export function clearToken() { try {
    localStorage.removeItem(KEY);
}
catch { } }
