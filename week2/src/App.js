import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getToken, setToken, clearToken } from './lib';
import { Login } from './pages/Login';
import { Policies } from './pages/Policies';
import { PolicyDetail } from './pages/PolicyDetail';
function Protected({ children }) {
    const tok = getToken();
    if (!tok)
        return _jsx(Navigate, { to: "/login", replace: true });
    return children;
}
export default function App() {
    const [token, setTok] = useState(getToken());
    const navigate = useNavigate();
    useEffect(() => { if (token)
        setToken(token); }, [token]);
    function onSignOut() {
        clearToken();
        setTok('');
        navigate('/login', { replace: true });
    }
    return (_jsxs("div", { style: { maxWidth: 960, margin: '0 auto', padding: 16 }, children: [_jsxs("header", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }, children: [_jsx("h1", { style: { margin: 0, fontSize: 18 }, children: "Compliance & Policy \u2014 Week 2" }), token && _jsx("button", { onClick: onSignOut, children: "Sign out" })] }), _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(Login, { onAuth: (t) => { setTok(t); navigate('/policies', { replace: true }); } }) }), _jsx(Route, { path: "/policies", element: _jsx(Protected, { children: _jsx(Policies, { token: token }) }) }), _jsx(Route, { path: "/policies/:id", element: _jsx(Protected, { children: _jsx(PolicyDetail, { token: token }) }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: token ? '/policies' : '/login', replace: true }) })] })] }));
}
