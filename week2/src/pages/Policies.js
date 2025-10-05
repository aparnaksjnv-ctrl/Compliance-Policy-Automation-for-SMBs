import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api';
export function Policies({ token }) {
    const [q, setQ] = useState('');
    const [status, setStatus] = useState('All');
    const { data, refetch, isFetching, error } = useQuery({
        queryKey: ['policies', q, status],
        queryFn: () => api.listPolicies(token, { q, status }),
    });
    const create = useMutation({
        mutationFn: (payload) => api.createPolicy(token, payload),
        onSuccess: () => refetch(),
    });
    const del = useMutation({
        mutationFn: (id) => api.deletePolicy(token, id),
        onSuccess: () => refetch(),
    });
    const items = data?.items || [];
    function onCreate(e) {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const name = String(fd.get('name') || '');
        const owner = String(fd.get('owner') || '');
        const s = String(fd.get('status') || 'Draft');
        if (!name || !owner)
            return;
        create.mutate({ name, owner, status: s });
        e.currentTarget.reset();
    }
    return (_jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', gap: 8, marginBottom: 12 }, children: [_jsx("input", { placeholder: "Search", value: q, onChange: e => setQ(e.target.value) }), _jsxs("select", { value: status, onChange: e => setStatus(e.target.value), children: [_jsx("option", { children: "All" }), _jsx("option", { children: "Draft" }), _jsx("option", { children: "In Review" }), _jsx("option", { children: "Approved" })] }), _jsx("button", { onClick: () => refetch(), disabled: isFetching, children: "Refresh" })] }), error && _jsx("div", { style: { color: '#fca5a5' }, children: String(error?.message || 'Failed to load') }), _jsxs("form", { onSubmit: onCreate, style: { display: 'grid', gap: 8, marginBottom: 12 }, children: [_jsx("div", { style: { fontWeight: 600 }, children: "New Policy" }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx("input", { name: "name", placeholder: "Name", required: true }), _jsx("input", { name: "owner", placeholder: "Owner", required: true }), _jsxs("select", { name: "status", defaultValue: "Draft", children: [_jsx("option", { children: "Draft" }), _jsx("option", { children: "In Review" }), _jsx("option", { children: "Approved" })] }), _jsx("button", { type: "submit", disabled: create.isPending, children: "Create" })] })] }), _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { textAlign: 'left' }, children: [_jsx("th", { style: { padding: '8px 6px', borderBottom: '1px solid #1f2937' }, children: "Name" }), _jsx("th", { style: { padding: '8px 6px', borderBottom: '1px solid #1f2937' }, children: "Owner" }), _jsx("th", { style: { padding: '8px 6px', borderBottom: '1px solid #1f2937' }, children: "Status" }), _jsx("th", { style: { padding: '8px 6px', borderBottom: '1px solid #1f2937' } })] }) }), _jsxs("tbody", { children: [items.map(p => (_jsxs("tr", { children: [_jsx("td", { style: { padding: '8px 6px', borderBottom: '1px solid #1f2937' }, children: _jsx(Link, { to: `/policies/${p.id || p._id}`, children: p.name }) }), _jsx("td", { style: { padding: '8px 6px', borderBottom: '1px solid #1f2937' }, children: p.owner }), _jsx("td", { style: { padding: '8px 6px', borderBottom: '1px solid #1f2937' }, children: p.status }), _jsx("td", { style: { padding: '8px 6px', borderBottom: '1px solid #1f2937' }, children: _jsx("button", { onClick: () => del.mutate(p.id || p._id), disabled: del.isPending, children: "Delete" }) })] }, p.id || p._id))), items.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 4, style: { padding: '12px 6px', color: '#94a3b8' }, children: "No policies yet" }) }))] })] })] }));
}
