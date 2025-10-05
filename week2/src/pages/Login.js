import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { api } from '../api';
export function Login({ onAuth }) {
    const [mode, setMode] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    async function submit(e) {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = mode === 'login' ? await api.login(email, password) : await api.register(email, password);
            onAuth(res.token);
        }
        catch (e) {
            setError(e?.message || 'Request failed');
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsxs("div", { style: { border: '1px solid #1f2937', borderRadius: 12, padding: 16, background: '#0b1220' }, children: [_jsx("div", { style: { color: '#9ca3af', textTransform: 'uppercase', fontSize: 12, marginBottom: 8 }, children: mode === 'login' ? 'Sign in' : 'Create account' }), _jsxs("form", { onSubmit: submit, style: { display: 'grid', gap: 10 }, children: [_jsxs("label", { children: [_jsx("div", { children: "Email" }), _jsx("input", { type: "email", value: email, onChange: e => setEmail(e.target.value), required: true })] }), _jsxs("label", { children: [_jsx("div", { children: "Password" }), _jsx("input", { type: "password", value: password, onChange: e => setPassword(e.target.value), required: true, minLength: 8 })] }), error && _jsx("div", { style: { color: '#fca5a5' }, children: error }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx("button", { type: "submit", disabled: loading, children: loading ? 'Please wait…' : (mode === 'login' ? 'Login' : 'Register') }), _jsx("button", { type: "button", onClick: () => setMode(mode === 'login' ? 'register' : 'login'), children: mode === 'login' ? 'New user? Create account' : 'Have an account? Sign in' })] })] })] }));
}
