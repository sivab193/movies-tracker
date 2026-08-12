"use client"

import { useEffect, useState } from "react"
import { ShieldAlert, Check, X, Loader2, PlaySquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CollapsibleSection } from "@/components/collapsible-section"
import { getMovieRequests, resolveMovieRequest } from "@/services/requests-service"

interface AdminRequestsProps {
    onApprove: (imdbId: string, type: string) => void
}

export function AdminRequests({ onApprove }: AdminRequestsProps) {
    const [requests, setRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadRequests()
    }, [])

    const loadRequests = async () => {
        try {
            const data = await getMovieRequests()
            setRequests(data)
        } catch (err) {
            console.error("Failed to load requests", err)
        } finally {
            setLoading(false)
        }
    }

    const handleResolve = async (id: string, status: 'approved' | 'rejected') => {
        try {
            const req = requests.find(r => r._id === id)
            await resolveMovieRequest(id, status)
            setRequests(prev => prev.filter(r => r._id !== id))
            if (status === 'approved' && req) {
                onApprove(req.imdbId, req.type)
            }
        } catch (err) {
            console.error("Failed to resolve request", err)
        }
    }

    if (loading) {
        return (
            <CollapsibleSection title="Title Requests" description="Loading...">
                <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
            </CollapsibleSection>
        )
    }

    if (requests.length === 0) {
        return null // Don't show if there are no requests
    }

    return (
        <CollapsibleSection
            title={
                <div className="flex items-center gap-2">
                    <PlaySquare className="h-5 w-5 text-blue-500" />
                    <span>Title Requests ({requests.length})</span>
                </div>
            }
            description="Manage user requests for new movies or series"
        >
            <div className="space-y-4">
                {requests.map((request) => (
                    <div key={request._id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <p className="font-medium">
                                <a href={request.imdbLink} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                    {request.imdbId}
                                </a>
                                <span className="ml-2 text-sm text-muted-foreground capitalize">({request.type})</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Requested by: {request.requestedByName || request.requestedBy} • {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleResolve(request._id, 'rejected')}>
                                <X className="h-4 w-4 mr-1" /> Reject
                            </Button>
                            <Button size="sm" onClick={() => handleResolve(request._id, 'approved')}>
                                <Check className="h-4 w-4 mr-1" /> Approve
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </CollapsibleSection>
    )
}
