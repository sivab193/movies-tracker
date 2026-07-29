"use client"

import { useState, useEffect, useMemo } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    CreditCard,
    Plus,
    Minus,
    Trash2,
    Flag,
    Calendar,
    Ticket,
    Loader2,
    AlertCircle,
    Check,
    Clock,
    Star,
    Banknote,
    TrendingUp
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

// Types that are supposed to be in @/lib/types
import { CardInfo, UserCard, CardOffer, CardUsageEntry } from "@/lib/types"

// Services that are supposed to be in @/services/card-service
import {
    getAllCards,
    getUserCards,
    addUserCard,
    removeUserCard,
    logCardUsage,
    removeCardUsage,
    reportCard
} from "@/services/card-service"

export default function CardsPage() {
    const { user } = useAuth()
    
    // State
    const [allCards, setAllCards] = useState<CardInfo[]>([])
    const [userCards, setUserCards] = useState<UserCard[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [processingId, setProcessingId] = useState<string | null>(null)
    
    // Dialog state
    const [selectedCard, setSelectedCard] = useState<UserCard | null>(null)
    const [reportModalOpen, setReportModalOpen] = useState(false)
    const [reportReason, setReportReason] = useState("")
    
    // Log Usage Form state
    const [usageDate, setUsageDate] = useState(() => new Date().toISOString().split('T')[0])
    const [usagePlatform, setUsagePlatform] = useState("")
    const [usageOffer, setUsageOffer] = useState("")
    const [usageMovie, setUsageMovie] = useState("")
    const [usageTickets, setUsageTickets] = useState("1")
    const [usageNotes, setUsageNotes] = useState("")
    
    // Fetch data
    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true)
                setError(null)
                
                const cards = await getAllCards()
                setAllCards(cards)
                
                if (user) {
                    const uCards = await getUserCards()
                    setUserCards(uCards)
                } else {
                    setUserCards([])
                }
            } catch (err: any) {
                console.error("Failed to load cards", err)
                setError(err.message || "Failed to load cards")
            } finally {
                setLoading(false)
            }
        }
        
        loadData()
    }, [user])
    
    // Derived state
    const availableCards = useMemo(() => {
        if (!userCards) return allCards
        const userCardIds = new Set(userCards.map(c => c.cardInfo.id))
        return allCards.filter(c => !userCardIds.has(c.id))
    }, [allCards, userCards])
    
    const stats = useMemo(() => {
        let usedThisMonth = 0
        let totalSaved = 0
        
        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()
        
        userCards.forEach(uc => {
            uc.usageLog.forEach(usage => {
                const d = new Date(usage.date)
                if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                    usedThisMonth++
                }
                
                // Estimate savings (very simplified)
                // Assuming we can find the offer and its max discount
                const offer = uc.cardInfo.offers.find(o => o.id === usage.offerId)
                if (offer && offer.maxDiscount) {
                    // This is just a rough estimate, in reality we'd need actual saved amount logged
                    totalSaved += offer.maxDiscount
                }
            })
        })
        
        return {
            totalCards: userCards.length,
            usedThisMonth,
            totalSaved
        }
    }, [userCards])
    
    // Actions
    const handleAddCard = async (cardId: string) => {
        if (!user) return
        
        try {
            setProcessingId(cardId)
            setError(null)
            await addUserCard(cardId)
            
            // Refresh user cards
            const uCards = await getUserCards()
            setUserCards(uCards)
        } catch (err: any) {
            setError(err.message || "Failed to add card")
        } finally {
            setProcessingId(null)
        }
    }
    
    const handleRemoveCard = async (cardId: string) => {
        if (!user) return
        
        if (!confirm("Are you sure you want to remove this card?")) return
        
        try {
            setProcessingId(cardId)
            setError(null)
            await removeUserCard(cardId)
            
            // Refresh user cards
            const uCards = await getUserCards()
            setUserCards(uCards)
            
            if (selectedCard?.cardId === cardId) {
                setSelectedCard(null)
            }
        } catch (err: any) {
            setError(err.message || "Failed to remove card")
        } finally {
            setProcessingId(null)
        }
    }
    
    const handleLogUsage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !selectedCard) return
        
        try {
            setProcessingId('log-usage')
            setError(null)
            
            await logCardUsage(selectedCard.cardId, {
                date: usageDate,
                platform: usagePlatform,
                offerId: usageOffer,
                movieTitle: usageMovie,
                ticketsSaved: parseInt(usageTickets, 10),
                notes: usageNotes
            })
            
            // Refresh user cards
            const uCards = await getUserCards()
            setUserCards(uCards)
            
            // Update selected card with new data
            const updatedCard = uCards.find(c => c.cardId === selectedCard.cardId)
            if (updatedCard) {
                setSelectedCard(updatedCard)
            }
            
            // Reset form
            setUsageMovie("")
            setUsageTickets("1")
            setUsageNotes("")
        } catch (err: any) {
            setError(err.message || "Failed to log usage")
        } finally {
            setProcessingId(null)
        }
    }
    
    const handleRemoveUsage = async (usageId: string) => {
        if (!user || !selectedCard) return
        
        if (!confirm("Remove this usage log?")) return
        
        try {
            setProcessingId(`remove-${usageId}`)
            setError(null)
            await removeCardUsage(selectedCard.cardId, usageId)
            
            // Refresh user cards
            const uCards = await getUserCards()
            setUserCards(uCards)
            
            // Update selected card
            const updatedCard = uCards.find(c => c.cardId === selectedCard.cardId)
            if (updatedCard) {
                setSelectedCard(updatedCard)
            }
        } catch (err: any) {
            setError(err.message || "Failed to remove usage")
        } finally {
            setProcessingId(null)
        }
    }
    
    const handleReportCard = async () => {
        if (!user || !selectedCard || !reportReason) return
        
        try {
            setProcessingId('report')
            setError(null)
            await reportCard(selectedCard.cardInfo.id, reportReason)
            setReportModalOpen(false)
            setReportReason("")
            alert("Report submitted successfully. Thank you!")
        } catch (err: any) {
            setError(err.message || "Failed to submit report")
        } finally {
            setProcessingId(null)
        }
    }
    
    // Helpers
    const getBankGradient = (bankName: string) => {
        const lower = bankName.toLowerCase()
        if (lower.includes('axis')) return 'from-rose-900 to-rose-800'
        if (lower.includes('sbi') || lower.includes('state bank')) return 'from-blue-900 to-blue-800'
        if (lower.includes('hdfc')) return 'from-indigo-900 to-blue-900'
        if (lower.includes('icici')) return 'from-orange-900 to-red-900'
        return 'from-slate-800 to-slate-700'
    }
    
    const getUsageStats = (card: UserCard) => {
        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()
        
        const usedThisMonth = card.usageLog.filter(u => {
            const d = new Date(u.date)
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear
        }).length
        
        // Find max usage allowed across offers (simplified)
        let totalAllowed = 0
        card.cardInfo.offers.forEach(o => {
            if (o.usesPerMonth) totalAllowed += o.usesPerMonth
        })
        
        if (totalAllowed === 0) totalAllowed = 4 // Fallback if no limits defined
        
        return { used: usedThisMonth, total: totalAllowed }
    }
    
    const UsageRing = ({ used, total }: { used: number, total: number }) => {
        const radius = 16
        const circumference = 2 * Math.PI * radius
        const percentage = Math.min(used / total, 1)
        const strokeDashoffset = circumference - percentage * circumference
        
        const isExhausted = used >= total
        
        return (
            <div className="relative flex items-center justify-center w-12 h-12">
                <svg className="w-12 h-12 transform -rotate-90">
                    <circle
                        cx="24"
                        cy="24"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="transparent"
                        className="text-white/20"
                    />
                    <circle
                        cx="24"
                        cy="24"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className={isExhausted ? "text-red-400" : "text-green-400"}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-xs font-bold leading-none text-white">{used}</span>
                    <span className="text-[8px] text-white/70 leading-none border-t border-white/30 pt-[1px] mt-[1px] w-4 text-center">{total}</span>
                </div>
            </div>
        )
    }

    if (loading && allCards.length === 0) {
        return (
            <div className="min-h-screen bg-background pb-12">
                <Header />
                <div className="flex items-center justify-center h-[60vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background pb-12">
            <Header />
            
            <main className="container py-8 max-w-5xl mx-auto px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <CreditCard className="h-8 w-8 text-primary" />
                        Movie Cards
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage your credit and debit cards for movie ticket offers.</p>
                </div>
                
                {error && (
                    <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-6 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                    </div>
                )}
                
                {user && userCards.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <Card className="bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="p-3 bg-primary/20 rounded-full text-primary">
                                    <CreditCard className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400">Total Cards</p>
                                    <p className="text-2xl font-bold text-white">{stats.totalCards}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="p-3 bg-green-500/20 rounded-full text-green-500">
                                    <Check className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400">Offers Used (Month)</p>
                                    <p className="text-2xl font-bold text-white">{stats.usedThisMonth}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="p-3 bg-amber-500/20 rounded-full text-amber-500">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400">Est. Savings</p>
                                    <p className="text-2xl font-bold text-white">₹{stats.totalSaved}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
                
                {user ? (
                    <div className="mb-12">
                        <h2 className="text-xl font-semibold mb-4 border-b pb-2">My Cards</h2>
                        
                        {userCards.length === 0 ? (
                            <div className="text-center py-12 border border-dashed rounded-xl bg-muted/20">
                                <CreditCard className="w-12 h-12 mx-auto text-muted-foreground opacity-30 mb-3" />
                                <h3 className="text-lg font-medium">No cards added yet</h3>
                                <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1 mb-4">
                                    Add your credit or debit cards below to track their movie offers and usage.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {userCards.map((userCard) => {
                                    const cInfo = userCard.cardInfo
                                    const { used, total } = getUsageStats(userCard)
                                    const bgGradient = getBankGradient(cInfo.bankName)
                                    
                                    // Extract unique platforms
                                    const platforms = Array.from(new Set(cInfo.offers.map(o => o.platform)))
                                    
                                    return (
                                        <div 
                                            key={userCard.cardId} 
                                            className={`relative overflow-hidden rounded-xl aspect-[1.586/1] bg-gradient-to-br ${bgGradient} text-white shadow-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl border border-white/10 group`}
                                            onClick={() => setSelectedCard(userCard)}
                                        >
                                            {/* Decorative element */}
                                            <div className="absolute -right-16 -top-16 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                                            
                                            <div className="p-6 flex flex-col h-full justify-between relative z-10">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="font-bold text-xl tracking-tight leading-tight">{cInfo.name}</h3>
                                                        <p className="text-white/70 text-sm font-medium mt-0.5">{cInfo.bankName}</p>
                                                    </div>
                                                    <span className="text-[10px] font-bold tracking-wider px-2 py-1 rounded-full bg-black/30 border border-white/10 backdrop-blur-md">
                                                        {cInfo.type.toUpperCase()}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex items-end justify-between mt-auto pt-8">
                                                    <div className="flex flex-col gap-3">
                                                        <div className="flex gap-2">
                                                            {platforms.map(p => {
                                                                const isBms = p.toLowerCase().includes('bookmy')
                                                                return (
                                                                    <span key={p} className={`text-[10px] font-bold px-2 py-1 rounded-sm ${isBms ? 'bg-red-500/80' : 'bg-green-600/80'}`}>
                                                                        {p}
                                                                    </span>
                                                                )
                                                            })}
                                                        </div>
                                                        <div className="text-sm font-medium opacity-90 tracking-widest uppercase">
                                                            {cInfo.network}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="bg-black/20 rounded-xl p-2 backdrop-blur-sm border border-white/5" title={`${used} offers used out of ${total} this month`}>
                                                        <UsageRing used={used} total={total} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="mb-12">
                        <Card className="border-dashed border-2 bg-muted/30">
                            <CardContent className="flex flex-col items-center justify-center py-10">
                                <CreditCard className="w-12 h-12 text-muted-foreground opacity-50 mb-4" />
                                <h3 className="text-lg font-semibold mb-2">Sign in to manage cards</h3>
                                <p className="text-muted-foreground text-sm text-center max-w-md mb-6">
                                    Create an account or sign in to track your credit card movie offers, log usage, and maximize your savings.
                                </p>
                                <Button asChild>
                                    <a href="/auth">Sign In / Register</a>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}
                
                <div>
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">Browse Cards</h2>
                    
                    {availableCards.length === 0 ? (
                        <p className="text-muted-foreground py-4">No more cards available in the catalog.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {availableCards.map(card => {
                                const platforms = Array.from(new Set(card.offers.map(o => o.platform)))
                                
                                return (
                                    <Card key={card.id} className="flex flex-col h-full bg-card/50 hover:bg-card transition-colors">
                                        <CardContent className="p-4 flex flex-col h-full">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="font-semibold text-base line-clamp-2">{card.name}</div>
                                                <span className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded uppercase ml-2 shrink-0">
                                                    {card.type}
                                                </span>
                                            </div>
                                            <div className="text-sm text-muted-foreground mb-4">{card.bankName} • {card.network}</div>
                                            
                                            <div className="flex flex-wrap gap-1 mb-6 mt-auto">
                                                {platforms.map(p => {
                                                    const isBms = p.toLowerCase().includes('bookmy')
                                                    return (
                                                        <span key={p} className={`text-[10px] px-1.5 py-0.5 rounded-sm ${isBms ? 'bg-red-500/15 text-red-500' : 'bg-green-500/15 text-green-500'}`}>
                                                            {p}
                                                        </span>
                                                    )
                                                })}
                                            </div>
                                            
                                            <Button 
                                                variant="outline" 
                                                className="w-full mt-auto text-xs" 
                                                disabled={!user || processingId === card.id}
                                                onClick={() => handleAddCard(card.id)}
                                            >
                                                {processingId === card.id ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Plus className="w-3 h-3 mr-2" />}
                                                Add to My Cards
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </div>
            </main>
            
            {/* Card Detail Dialog */}
            <Dialog open={!!selectedCard} onOpenChange={(open) => !open && setSelectedCard(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-background/95 backdrop-blur-xl">
                    {selectedCard && (
                        <>
                            <div className={`p-6 pb-8 bg-gradient-to-br ${getBankGradient(selectedCard.cardInfo.bankName)} text-white`}>
                                <div className="flex justify-between items-start mb-2">
                                    <DialogTitle className="text-2xl font-bold">{selectedCard.cardInfo.name}</DialogTitle>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/20 h-8 w-8" onClick={() => setReportModalOpen(true)}>
                                            <Flag className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-white/70 hover:text-red-400 hover:bg-white/20 h-8 w-8" onClick={() => handleRemoveCard(selectedCard.cardId)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="text-white/80">{selectedCard.cardInfo.bankName} • {selectedCard.cardInfo.type} • {selectedCard.cardInfo.network}</div>
                            </div>
                            
                            <div className="p-6 space-y-8">
                                {/* Offers Section */}
                                <section>
                                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                                        <Ticket className="w-5 h-5 text-primary" />
                                        Available Offers
                                    </h3>
                                    <div className="grid gap-3">
                                        {selectedCard.cardInfo.offers.map((offer, idx) => (
                                            <div key={offer.id || idx} className="bg-secondary/40 rounded-lg p-4 border border-border/50">
                                                <div className="flex justify-between items-start gap-4 mb-2">
                                                    <div className="font-semibold">{offer.platform}</div>
                                                    {offer.offerType && <div className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-md">{offer.offerType}</div>}
                                                </div>
                                                <div className="text-sm space-y-1.5 text-muted-foreground">
                                                    {offer.maxDiscount && <div><strong className="text-foreground">Discount:</strong> Up to ₹{offer.maxDiscount}</div>}
                                                    {offer.usesPerMonth && <div><strong className="text-foreground">Usage Limit:</strong> {offer.usesPerMonth} times/month</div>}
                                                    {offer.couponCode && <div><strong className="text-foreground">Code:</strong> <code className="bg-muted px-1.5 py-0.5 rounded">{offer.couponCode}</code></div>}
                                                    {offer.notes && <div className="text-xs italic mt-2">{offer.notes}</div>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                                
                                {/* Usage Log Section */}
                                <section>
                                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 border-t pt-6">
                                        <Clock className="w-5 h-5 text-primary" />
                                        Usage History
                                    </h3>
                                    
                                    {selectedCard.usageLog.length === 0 ? (
                                        <p className="text-sm text-muted-foreground py-2 italic">No usage recorded yet.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {selectedCard.usageLog.map(usage => (
                                                <div key={usage.id} className="flex justify-between items-center bg-card p-3 rounded-md border text-sm">
                                                    <div>
                                                        <div className="font-medium flex items-center gap-2">
                                                            {usage.movieTitle || 'Unknown Movie'}
                                                            <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{usage.platform}</span>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground flex gap-3 mt-1">
                                                            <span>{new Date(usage.date).toLocaleDateString()}</span>
                                                            <span>{usage.ticketsSaved} ticket(s)</span>
                                                        </div>
                                                    </div>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        disabled={processingId === `remove-${usage.id}`}
                                                        onClick={() => handleRemoveUsage(usage.id)}
                                                    >
                                                        {processingId === `remove-${usage.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                                
                                {/* Log Usage Form */}
                                <section className="bg-secondary/20 p-5 rounded-xl border border-secondary">
                                    <h3 className="text-base font-semibold mb-4">Log New Usage</h3>
                                    <form onSubmit={handleLogUsage} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="date">Date</Label>
                                                <Input 
                                                    id="date" 
                                                    type="date" 
                                                    value={usageDate} 
                                                    onChange={e => setUsageDate(e.target.value)} 
                                                    required 
                                                    className="bg-background"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="platform">Platform</Label>
                                                <Select value={usagePlatform} onValueChange={setUsagePlatform} required>
                                                    <SelectTrigger className="bg-background">
                                                        <SelectValue placeholder="Select platform" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Array.from(new Set(selectedCard.cardInfo.offers.map(o => o.platform))).map(p => (
                                                            <SelectItem key={p} value={p}>{p}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        
                                        {usagePlatform && (
                                            <div className="space-y-1.5">
                                                <Label htmlFor="offer">Offer</Label>
                                                <Select value={usageOffer} onValueChange={setUsageOffer} required>
                                                    <SelectTrigger className="bg-background">
                                                        <SelectValue placeholder="Select offer" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {selectedCard.cardInfo.offers.filter(o => o.platform === usagePlatform).map(o => (
                                                            <SelectItem key={o.id} value={o.id}>
                                                                {o.offerType || 'Standard Offer'} {o.maxDiscount ? `(Upto ₹${o.maxDiscount})` : ''}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                        
                                        <div className="space-y-1.5">
                                            <Label htmlFor="movie">Movie Title</Label>
                                            <Input 
                                                id="movie" 
                                                placeholder="e.g. Dune: Part Two" 
                                                value={usageMovie} 
                                                onChange={e => setUsageMovie(e.target.value)} 
                                                required 
                                                className="bg-background"
                                            />
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="tickets">Tickets Saved</Label>
                                                <Input 
                                                    id="tickets" 
                                                    type="number" 
                                                    min="1" 
                                                    value={usageTickets} 
                                                    onChange={e => setUsageTickets(e.target.value)} 
                                                    required 
                                                    className="bg-background"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="notes">Notes (Optional)</Label>
                                                <Input 
                                                    id="notes" 
                                                    placeholder="e.g. ₹250 off" 
                                                    value={usageNotes} 
                                                    onChange={e => setUsageNotes(e.target.value)} 
                                                    className="bg-background"
                                                />
                                            </div>
                                        </div>
                                        
                                        <Button type="submit" className="w-full mt-2" disabled={processingId === 'log-usage'}>
                                            {processingId === 'log-usage' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                            Log Usage
                                        </Button>
                                    </form>
                                </section>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
            
            {/* Report Modal */}
            <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Report Outdated Information</DialogTitle>
                        <DialogDescription>
                            Is the information for {selectedCard?.cardInfo.name} incorrect or outdated? Let us know.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="reason">What's wrong?</Label>
                            <Input 
                                id="reason" 
                                placeholder="e.g. Offer is now only on weekends" 
                                value={reportReason} 
                                onChange={e => setReportReason(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setReportModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleReportCard} disabled={!reportReason || processingId === 'report'}>
                                {processingId === 'report' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Submit Report
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
