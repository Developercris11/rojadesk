'use client';

import { useState } from 'react';
import { Copy, Download, Loader2, Check } from 'lucide-react';

interface ContactPerson {
    fullName: string | null;
    jobTitle: string | null;
    email: string | null;
    phoneNumber: string | null;
    confidence: 'high' | 'medium' | 'low' | 'none';
}

interface ExtractedAgency {
    agencyName: string;
    state: string;
    zipCode: string;
    streetAddress: string | null;
    mainPhoneNumber: string | null;
    officialWebsite: string | null;
    contacts: {
        townCityManager?: ContactPerson;
        publicWorksDirector?: ContactPerson;
        treasurerFinanceDirector?: ContactPerson;
        itManager?: ContactPerson;
        townCitySecretary?: ContactPerson;
        gatekeeper?: ContactPerson;
        additionalContacts: ContactPerson[];
    };
    trustworthyDataFound: boolean;
    extractedAt: string;
    sourceUrl?: string;
    successfulPages: string[];
    errors?: string[];
}

const US_STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const CONFIDENCE_COLORS: Record<string, string> = {
    'high': 'bg-green-500/20 text-green-300 border-green-500/50',
    'medium': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
    'low': 'bg-orange-500/20 text-orange-300 border-orange-500/50',
    'none': 'bg-red-500/20 text-red-300 border-red-500/50'
};

export default function AgencyInformationPage() {
    const [agencyName, setAgencyName] = useState('');
    const [state, setState] = useState('UT');
    const [zipCode, setZipCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [agencyData, setAgencyData] = useState<ExtractedAgency | null>(null);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        setAgencyData(null);

        if (!agencyName || !state || !zipCode) {
            setError('Please fill in all fields: Agency Name, State, and Zip Code');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/agency-information', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agencyName, state, zipCode }),
            });

            if (!response.ok) {
                const err = await response.json();
                setError(err.error || 'Failed to extract agency information');
                setLoading(false);
                return;
            }

            const data: ExtractedAgency = await response.json();
            setAgencyData(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopied(field);
        setTimeout(() => setCopied(null), 2000);
    };

    const downloadJSON = () => {
        if (!agencyData) return;
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(agencyData, null, 2)));
        element.setAttribute('download', `agency-${agencyName.replace(/\s+/g, '-')}-${Date.now()}.json`);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const renderConfidenceBadge = (confidence: string) => {
        const colors = CONFIDENCE_COLORS[confidence] || CONFIDENCE_COLORS['none'];
        return (
            <span className={`text-xs font-bold px-2 py-1 rounded border ${colors}`}>
                {confidence.toUpperCase()}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Official Agency Information Lookup</h1>
                    <p className="text-gray-300">Search for verified contact information from official government websites by city name and location</p>
                </div>

                {/* Form Section */}
                <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-6 mb-8">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label htmlFor="agency" className="block text-sm font-medium text-gray-200 mb-2">
                                Agency Name *
                            </label>
                            <input
                                id="agency"
                                type="text"
                                value={agencyName}
                                onChange={(e) => setAgencyName(e.target.value)}
                                placeholder="e.g., City of Salt Lake City"
                                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="state" className="block text-sm font-medium text-gray-200 mb-2">
                                State *
                            </label>
                            <select
                                id="state"
                                value={state}
                                onChange={(e) => setState(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                                required
                            >
                                {US_STATES.map(s => (
                                    <option key={s} value={s} className="bg-slate-900">{s}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="zip" className="block text-sm font-medium text-gray-200 mb-2">
                                Zip Code *
                            </label>
                            <input
                                id="zip"
                                type="text"
                                value={zipCode}
                                onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                                placeholder="e.g., 84101"
                                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                                maxLength={5}
                                required
                            />
                        </div>

                        <div className="flex items-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Searching...
                                    </>
                                ) : (
                                    'Search'
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-8">
                        <p className="text-red-200">{error}</p>
                    </div>
                )}

                {/* Results Section */}
                {agencyData && (
                    <div className="space-y-6">
                        {/* Trustworthiness Alert */}
                        <div className={`rounded-lg p-4 border ${
                            agencyData.trustworthyDataFound 
                                ? 'bg-green-500/10 border-green-500/20' 
                                : 'bg-red-500/10 border-red-500/20'
                        }`}>
                            <p className={agencyData.trustworthyDataFound ? 'text-green-200' : 'text-red-200'}>
                                {agencyData.trustworthyDataFound 
                                    ? '✅ Trustworthy data verified from official government website'
                                    : '⚠️ No trustworthy contact information found. Verify data independently.'}
                            </p>
                        </div>

                        {/* Header with Download Button */}
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-3xl font-bold text-white">{agencyData.agencyName}</h2>
                                <p className="text-gray-400 text-sm mt-1">{agencyData.state} {agencyData.zipCode}</p>
                            </div>
                            <button
                                onClick={downloadJSON}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Download JSON
                            </button>
                        </div>

                        {/* Organization Details Card */}
                        {(agencyData.mainPhoneNumber || agencyData.streetAddress || agencyData.officialWebsite) && (
                            <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-6">
                                <h3 className="text-xl font-bold text-white mb-4">Organization Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {agencyData.mainPhoneNumber && (
                                        <div>
                                            <p className="text-gray-400 text-sm mb-1">Main Phone</p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-white font-medium">{agencyData.mainPhoneNumber}</p>
                                                <button
                                                    onClick={() => copyToClipboard(agencyData.mainPhoneNumber!, 'phone')}
                                                    className="p-1 hover:bg-white/10 rounded transition-colors"
                                                >
                                                    {copied === 'phone' ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {agencyData.streetAddress && (
                                        <div>
                                            <p className="text-gray-400 text-sm mb-1">Address</p>
                                            <p className="text-white font-medium">{agencyData.streetAddress}</p>
                                        </div>
                                    )}
                                    {agencyData.officialWebsite && (
                                        <div>
                                            <p className="text-gray-400 text-sm mb-1">Official Website</p>
                                            <a 
                                                href={agencyData.officialWebsite} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-purple-300 hover:text-purple-200 font-medium truncate"
                                            >
                                                {agencyData.officialWebsite.replace('https://', '')}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Key Contacts */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {(['townCityManager', 'publicWorksDirector', 'treasurerFinanceDirector', 'itManager', 'townCitySecretary', 'gatekeeper'] as const).map(role => {
                                const contact = agencyData.contacts[role];
                                if (!contact || !contact.fullName) return null;

                                return (
                                    <div key={role} className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="text-gray-400 text-sm">{contact.jobTitle || role.replace(/([A-Z])/g, ' $1').trim()}</p>
                                                <p className="text-white font-bold text-lg">{contact.fullName}</p>
                                            </div>
                                            {contact.email && renderConfidenceBadge(contact.confidence)}
                                        </div>
                                        <div className="space-y-2">
                                            {contact.email && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-400 text-sm">Email:</span>
                                                    <button
                                                        onClick={() => copyToClipboard(contact.email!, `email-${role}`)}
                                                        className="text-purple-300 hover:text-purple-200 text-sm flex items-center gap-1"
                                                    >
                                                        {contact.email}
                                                        {copied === `email-${role}` && <Check size={14} className="text-green-400" />}
                                                    </button>
                                                </div>
                                            )}
                                            {contact.phoneNumber && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-400 text-sm">Phone:</span>
                                                    <button
                                                        onClick={() => copyToClipboard(contact.phoneNumber!, `phone-${role}`)}
                                                        className="text-gray-300 hover:text-white text-sm flex items-center gap-1"
                                                    >
                                                        {contact.phoneNumber}
                                                        {copied === `phone-${role}` && <Check size={14} className="text-green-400" />}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Additional Contacts */}
                        {agencyData.contacts.additionalContacts && agencyData.contacts.additionalContacts.length > 0 && (
                            <div>
                                <h3 className="text-xl font-bold text-white mb-4">Additional Contacts</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {agencyData.contacts.additionalContacts.map((contact, idx) => (
                                        <div key={idx} className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-4">
                                            <p className="text-white font-bold">{contact.fullName}</p>
                                            {contact.jobTitle && <p className="text-gray-400 text-sm">{contact.jobTitle}</p>}
                                            {contact.email && (
                                                <p className="text-purple-300 text-sm hover:text-purple-200 cursor-pointer"
                                                   onClick={() => copyToClipboard(contact.email!, `add-${idx}`)}>
                                                    {contact.email}
                                                </p>
                                            )}
                                            {contact.phoneNumber && <p className="text-gray-300 text-sm">{contact.phoneNumber}</p>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Errors/Messages */}
                        {agencyData.errors && agencyData.errors.length > 0 && (
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                                <p className="text-yellow-200 text-sm font-bold mb-2">Notes:</p>
                                {agencyData.errors.map((err, idx) => (
                                    <p key={idx} className="text-yellow-200 text-sm">• {err}</p>
                                ))}
                            </div>
                        )}

                        {/* Metadata */}
                        <div className="text-gray-400 text-xs">
                            <p>Extracted: {new Date(agencyData.extractedAt).toLocaleString()}</p>
                            <p>Source: {agencyData.officialWebsite}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

