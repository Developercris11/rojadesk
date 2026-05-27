'use client';

import { useState, useEffect } from 'react';

interface Municipality {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    website: string | null;
}

interface PaginationData {
    total: number;
    limit: number;
    offset: number;
    pages: number;
}

export default function AlabamaMunicipalitiesPage() {
    const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState<PaginationData>({
        total: 0,
        limit: 20,
        offset: 0,
        pages: 0,
    });

    useEffect(() => {
        fetchMunicipalities();
    }, [search, pagination.offset]);

    const fetchMunicipalities = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                ...(search && { search }),
                limit: '20',
                offset: pagination.offset.toString(),
            });

            const response = await fetch(`/api/alabama-municipalities?${params}`);
            const result = await response.json();

            if (result.success) {
                setMunicipalities(result.data);
                setPagination(result.pagination);
            }
        } catch (error) {
            console.error('Failed to fetch municipalities:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Alabama Municipalities</h1>
                <p className="text-gray-600 mt-2">
                    Complete directory of {pagination.total} Alabama cities with official government contacts
                </p>
            </div>

            {/* Search Bar */}
            <div>
                <input
                    type="text"
                    placeholder="Search by city name, email, or phone..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPagination((prev) => ({ ...prev, offset: 0 }));
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Results Table */}
            <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Municipality</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Phone</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Website</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                    Loading...
                                </td>
                            </tr>
                        ) : municipalities.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                    No municipalities found
                                </td>
                            </tr>
                        ) : (
                            municipalities.map((muni) => (
                                <tr key={muni.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium">{muni.name}</td>
                                    <td className="px-6 py-4 text-sm">
                                        {muni.email ? (
                                            <a href={`mailto:${muni.email}`} className="text-blue-600 hover:underline">
                                                {muni.email}
                                            </a>
                                        ) : (
                                            <span className="text-gray-400">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {muni.phone ? (
                                            <a href={`tel:${muni.phone}`} className="text-blue-600 hover:underline">
                                                {muni.phone}
                                            </a>
                                        ) : (
                                            <span className="text-gray-400">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {muni.website ? (
                                            <a
                                                href={muni.website.startsWith('http') ? muni.website : `https://${muni.website}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline"
                                            >
                                                Visit
                                            </a>
                                        ) : (
                                            <span className="text-gray-400">—</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                    Showing {Math.min(pagination.offset + 1, pagination.total)} to{' '}
                    {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() =>
                            setPagination((prev) => ({
                                ...prev,
                                offset: Math.max(0, prev.offset - prev.limit),
                            }))
                        }
                        disabled={pagination.offset === 0 || loading}
                        className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                        Previous
                    </button>

                    <div className="flex items-center gap-2">
                        {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                            .filter((page) => {
                                const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
                                return Math.abs(page - currentPage) <= 2 || page === 1 || page === pagination.pages;
                            })
                            .map((page, idx, arr) => (
                                <div key={page}>
                                    {idx > 0 && arr[idx - 1] !== page - 1 && <span className="text-gray-400">...</span>}
                                    <button
                                        onClick={() =>
                                            setPagination((prev) => ({
                                                ...prev,
                                                offset: (page - 1) * prev.limit,
                                            }))
                                        }
                                        className={`px-3 py-2 rounded ${
                                            Math.floor(pagination.offset / pagination.limit) + 1 === page
                                                ? 'bg-blue-600 text-white'
                                                : 'border hover:bg-gray-50'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                </div>
                            ))}
                    </div>

                    <button
                        onClick={() =>
                            setPagination((prev) => ({
                                ...prev,
                                offset: Math.min(
                                    prev.offset + prev.limit,
                                    (prev.pages - 1) * prev.limit
                                ),
                            }))
                        }
                        disabled={pagination.offset + pagination.limit >= pagination.total || loading}
                        className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                    <strong>Data Source:</strong> Alabama League of Municipalities (ALM)
                    <br />
                    <strong>Total Records:</strong> {pagination.total} municipalities
                    <br />
                    <strong>Last Updated:</strong> April 15, 2026
                </p>
            </div>
        </div>
    );
}
