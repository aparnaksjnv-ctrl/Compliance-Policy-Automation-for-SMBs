import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../api';
import { useState, useEffect } from 'react';
export function PolicyDetail({ token }) {
    const { id = '' } = useParams();
    const navigate = useNavigate();
    const { data, isFetching, error, refetch } = useQuery({
        queryKey: ['policy', id],
        queryFn: () => api.getPolicy(token, id),
        enabled: !!id,
    });
    const [form, setForm] = useState({});
    useEffect(() => { if (data)
        setForm({ name: data.name, owner: data.owner, status: data.status, content: data.content }); }, [data]);
    const update = useMutation({
        mutationFn: (payload) => api.updatePolicy(token, id, payload),
        onSuccess: () => refetch(),
    });
    const del = useMutation({
        mutationFn: () => api.deletePolicy(token, id),
        onSuccess: () => navigate('/policies', { replace: true }),
    });
    function onChange(key, value) {
        setForm(prev => ({ ...prev, [key]: value }));
    }
    function onSubmit(e) {
        e.preventDefault();
        update.mutate(form);
    }
    if (isFetching)
        return _jsx("div", { children: "Loading\u2026" });
    if (error)
        return _jsx("div", { style: { color: '#fca5a5' }, children: String(error?.message || 'Failed to load') });
    if (!data)
        return _jsx("div", { children: "Not found" });
    return (_jsxs("div", { children: [_jsx("div", { style: { marginBottom: 12 }, children: _jsx("button", { onClick: () => navigate('/policies'), children: '< Back' }) }), _jsxs("form", { onSubmit: onSubmit, style: { display: 'grid', gap: 10 }, children: [_jsxs("label", { children: [_jsx("div", { children: "Name" }), _jsx("input", { value: form.name || '', onChange: e => onChange('name', e.target.value), required: true })] }), _jsxs("label", { children: [_jsx("div", { children: "Owner" }), _jsx("input", { value: form.owner || '', onChange: e => onChange('owner', e.target.value), required: true })] }), _jsxs("label", { children: [_jsx("div", { children: "Status" }), _jsxs("select", { value: form.status || 'Draft', onChange: e => onChange('status', e.target.value), children: [_jsx("option", { children: "Draft" }), _jsx("option", { children: "In Review" }), _jsx("option", { children: "Approved" })] })] }), _jsxs("label", { children: [_jsx("div", { children: "Content" }), _jsx("textarea", { rows: 8, value: form.content || '', onChange: e => onChange('content', e.target.value) })] }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx("button", { type: "submit", disabled: update.isPending, children: "Save" }), _jsx("button", { type: "button", onClick: () => del.mutate(), disabled: del.isPending, children: "Delete" })] })] })] }));
}
