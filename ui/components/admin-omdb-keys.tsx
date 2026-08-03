"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { CollapsibleSection } from "@/components/collapsible-section"
import { Key, Loader2, Plus, Trash2, BarChart3, AlertTriangle } from "lucide-react"
import {
    getOmdbKeys,
    addOmdbKey,
    updateOmdbKey,
    deleteOmdbKey,
    getOmdbKeyUsage,
} from "@/services/omdb-keys-service"

export function AdminOmdbKeys() {
    const [keys, setKeys] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    
    // Add Key state
    const [newKey, setNewKey] = useState("")
    const [newEmail, setNewEmail] = useState("")
    const [newLabel, setNewLabel] = useState("")
    const [adding, setAdding] = useState(false)
    
    // Actions state
    const [togglingId, setTogglingId] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    // Usage Dashboard
    const [usageData, setUsageData] = useState<any>(null)
    const [loadingUsage, setLoadingUsage] = useState(false)
    const [usageVisible, setUsageVisible] = useState(false)

    const loadKeys = async () => {
        try {
            const data = await getOmdbKeys()
            setKeys(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load OMDb keys")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadKeys()
    }, [])

    const handleAddKey = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newKey.trim() || !newEmail.trim()) return
        
        setAdding(true)
        setError(null)
        try {
            await addOmdbKey(newKey.trim(), newEmail.trim(), newLabel.trim())
            setNewKey("")
            setNewEmail("")
            setNewLabel("")
            await loadKeys()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to add key")
        } finally {
            setAdding(false)
        }
    }

    const handleToggleActive = async (id: string, currentActive: boolean) => {
        setTogglingId(id)
        try {
            await updateOmdbKey(id, { active: !currentActive })
            setKeys((prev) =>
                prev.map((k) => (k.id === id ? { ...k, active: !currentActive } : k))
            )
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to update key status")
        } finally {
            setTogglingId(null)
        }
    }

    const handleDeleteKey = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this key?")) return
        
        setDeletingId(id)
        try {
            await deleteOmdbKey(id)
            setKeys((prev) => prev.filter((k) => k.id !== id))
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to delete key")
        } finally {
            setDeletingId(null)
        }
    }

    const loadUsageHistory = async () => {
        if (usageVisible && usageData) {
            setUsageVisible(false)
            return
        }
        
        setLoadingUsage(true)
        try {
            const data = await getOmdbKeyUsage(7)
            setUsageData(data)
            setUsageVisible(true)
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to load usage history")
        } finally {
            setLoadingUsage(false)
        }
    }

    // Process flat usage array into grouped-by-date structure for rendering
    const processedHistory = usageData ? (() => {
        const keyMap: Record<string, any> = {}
        for (const k of (usageData.keys || [])) {
            keyMap[k.id] = k
        }
        const dateMap: Record<string, { date: string; keys: { label: string; email: string; usage: number }[]; total: number }> = {}
        for (const u of (usageData.usage || [])) {
            if (!dateMap[u.date]) {
                dateMap[u.date] = { date: u.date, keys: [], total: 0 }
            }
            const kInfo = keyMap[u.keyId] || {}
            dateMap[u.date].keys.push({
                label: kInfo.label || '',
                email: kInfo.email || u.keyId,
                usage: u.requestCount || 0,
            })
            dateMap[u.date].total += u.requestCount || 0
        }
        return Object.values(dateMap).sort((a, b) => b.date.localeCompare(a.date))
    })() : []

    const maskKey = (key: string) => {
        if (!key || key.length <= 4) return "****"
        return key.substring(0, 4) + "*".repeat(key.length - 4)
    }

    return (
        <CollapsibleSection
            title={
                <>
                    <Key className="h-5 w-5 text-primary" />
                    OMDb API Keys ({keys.length})
                </>
            }
            description="Manage OMDb API keys and monitor usage limits"
            contentClassName="space-y-6"
        >
            {error && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Add Key Form */}
            <form onSubmit={handleAddKey} className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/20 p-3">
                <Input
                    type="password"
                    placeholder="OMDb API Key"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    className="h-9 w-48 text-sm"
                    disabled={adding}
                    required
                />
                <Input
                    type="email"
                    placeholder="Email used to generate key"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="h-9 w-56 text-sm"
                    disabled={adding}
                    required
                />
                <Input
                    type="text"
                    placeholder="Label (optional)"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="h-9 w-40 text-sm"
                    disabled={adding}
                />
                <Button
                    type="submit"
                    disabled={adding || !newKey.trim() || !newEmail.trim()}
                    className="h-9 flex items-center gap-2 bg-primary text-primary-foreground shadow hover:bg-primary/90"
                >
                    {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Add Key
                </Button>
            </form>

            {/* Keys Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b">
                            <th className="text-left py-3 px-2 font-medium w-16">Priority</th>
                            <th className="text-left py-3 px-2 font-medium">Key</th>
                            <th className="text-left py-3 px-2 font-medium">Email</th>
                            <th className="text-left py-3 px-2 font-medium">Label</th>
                            <th className="text-center py-3 px-2 font-medium w-24">Status</th>
                            <th className="text-left py-3 px-2 font-medium w-48">Today's Usage</th>
                            <th className="text-center py-3 px-2 font-medium w-24">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {keys.map((keyItem, index) => {
                            const usage = keyItem.todayUsage || 0
                            const isExhausted = usage >= 1000
                            const progressColor = isExhausted ? "bg-destructive" : "bg-primary"
                            const progressWidth = `${Math.min(100, (usage / 1000) * 100)}%`

                            return (
                                <tr key={keyItem.id} className="border-b hover:bg-muted/50">
                                    <td className="py-3 px-2 text-muted-foreground">{index + 1}</td>
                                    <td className="py-3 px-2 font-mono text-xs">{maskKey(keyItem.key)}</td>
                                    <td className="py-3 px-2">{keyItem.email}</td>
                                    <td className="py-3 px-2">{keyItem.label || <span className="text-muted-foreground text-xs">None</span>}</td>
                                    <td className="py-3 px-2 text-center">
                                        <div className="flex justify-center">
                                            {togglingId === keyItem.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                            ) : (
                                                <Switch
                                                    checked={keyItem.active}
                                                    onCheckedChange={() => handleToggleActive(keyItem.id, keyItem.active)}
                                                    title={keyItem.active ? "Active" : "Inactive"}
                                                />
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-3 px-2">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                                                <div 
                                                    className={`h-full transition-all ${progressColor}`} 
                                                    style={{ width: progressWidth }} 
                                                />
                                            </div>
                                            <span className={`text-xs ${isExhausted ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                                                {usage}/1000
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-2 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDeleteKey(keyItem.id)}
                                                disabled={deletingId === keyItem.id}
                                                title="Delete Key"
                                            >
                                                {deletingId === keyItem.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                        {keys.length === 0 && (
                            <tr>
                                <td colSpan={7} className="text-center py-10 text-muted-foreground">
                                    {loading ? "Loading keys…" : "No OMDb API keys configured. Add one above."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Usage Dashboard Section */}
            <div className="pt-4 border-t">
                <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={loadUsageHistory}
                    disabled={loadingUsage}
                >
                    {loadingUsage ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
                    {usageVisible ? "Hide Usage History" : "View Usage History (Last 7 Days)"}
                </Button>

                {usageVisible && usageData && (
                    <div className="mt-4 space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-3 rounded-md border bg-muted/20">
                                <div className="text-xs text-muted-foreground">Total Today</div>
                                <div className="text-xl font-bold">{usageData.summary?.totalToday || 0}</div>
                            </div>
                            <div className="p-3 rounded-md border bg-muted/20">
                                <div className="text-xs text-muted-foreground">Active Keys</div>
                                <div className="text-xl font-bold">{usageData.summary?.activeKeys || 0}</div>
                            </div>
                            <div className="p-3 rounded-md border bg-muted/20">
                                <div className="text-xs text-muted-foreground">Exhausted Today</div>
                                <div className="text-xl font-bold text-destructive">{usageData.summary?.exhaustedToday || 0}</div>
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-md border">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/40">
                                        <th className="text-left py-2 px-3 font-medium">Date</th>
                                        <th className="text-left py-2 px-3 font-medium">Key Label / Email</th>
                                        <th className="text-right py-2 px-3 font-medium">Requests</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {processedHistory.length > 0 ? (
                                        processedHistory.map((day, i) => (
                                            <tr key={i} className="border-b hover:bg-muted/50 last:border-0">
                                                <td className="py-2 px-3 font-medium">{day.date}</td>
                                                <td className="py-2 px-3 text-muted-foreground">
                                                    {day.keys.map((k, j) => (
                                                        <div key={j} className="text-xs mb-1 last:mb-0">
                                                            {k.label || k.email}
                                                        </div>
                                                    ))}
                                                    <div className="font-semibold text-xs mt-1 pt-1 border-t">Daily Total</div>
                                                </td>
                                                <td className="py-2 px-3 text-right">
                                                    {day.keys.map((k, j) => (
                                                        <div key={j} className="text-xs mb-1 last:mb-0">
                                                            {k.usage}
                                                        </div>
                                                    ))}
                                                    <div className="font-semibold text-xs mt-1 pt-1 border-t">{day.total}</div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={3} className="text-center py-4 text-muted-foreground">
                                                No usage data available for the selected period.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </CollapsibleSection>
    )
}
