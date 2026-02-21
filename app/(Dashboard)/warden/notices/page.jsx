"use client"
import React, { useState } from 'react'
import {
    Megaphone,
    Plus,
    Search,
    Filter,
    MoreVertical,
    Clock,
    AlertTriangle,
    CheckCircle2,
    Calendar,
    Pin,
    Trash2,
    Edit3,
    MoreHorizontal,
    LayoutGrid,
    Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useNotices, useCreateNotice, useUpdateNotice, useDeleteNotice } from "@/hooks/useNotices"
import useAuthStore from "@/hooks/Authstate"
import { format } from "date-fns"

const WardenNoticePage = () => {
    const { user } = useAuthStore()
    const { data: notices, isLoading } = useNotices({ hostelId: user?.hostelId })
    const createMutation = useCreateNotice()
    const updateMutation = useUpdateNotice()
    const deleteMutation = useDeleteNotice()

    const [searchTerm, setSearchTerm] = useState('')
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingNotice, setEditingNotice] = useState(null)

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        priority: 'MEDIUM',
        category: 'GENERAL',
        expiresAt: ''
    })

    const handleCreate = async (e) => {
        e.preventDefault()
        await createMutation.mutateAsync({
            ...formData,
            authorId: user.id,
            hostelId: user.hostelId
        })
        setIsCreateOpen(false)
        setFormData({ title: '', content: '', priority: 'MEDIUM', category: 'GENERAL', expiresAt: '' })
    }

    const handleUpdate = async (e) => {
        e.preventDefault()
        await updateMutation.mutateAsync({
            id: editingNotice.id,
            ...formData
        })
        setEditingNotice(null)
    }

    const startEditing = (notice) => {
        setEditingNotice(notice)
        setFormData({
            title: notice.title,
            content: notice.content,
            priority: notice.priority,
            category: notice.category,
            expiresAt: notice.expiresAt ? format(new Date(notice.expiresAt), 'yyyy-MM-dd') : ''
        })
    }

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'URGENT': return 'bg-rose-600'
            case 'HIGH': return 'bg-amber-600'
            case 'MEDIUM': return 'bg-blue-600'
            case 'LOW': return 'bg-emerald-600'
            default: return 'bg-gray-600'
        }
    }

    const filteredNotices = notices?.filter(notice =>
        notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notice.content.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (isLoading) return (
        <div className="flex h-screen items-center justify-center bg-white font-sans">
            <div className="flex flex-col items-center gap-6">
                <div className="h-10 w-10 border-[3px] border-gray-100 border-t-black rounded-full animate-spin" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 italic">Synchronizing Bulletin...</p>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight leading-relaxed text-gray-900">
            {/* Minimal Premium Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-full flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                        <div className="h-9 w-9 md:h-11 md:w-11 bg-black rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-black/5">
                            <Megaphone className="h-4 w-4 md:h-5 md:w-5 text-white" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-sm md:text-lg font-black text-gray-900 tracking-tight uppercase truncate">Notice Board</h1>
                            <div className="flex items-center gap-1.5 md:gap-2">
                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-gray-400 truncate italic">Live Bulletin Broadcast</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button className="h-10 md:h-11 px-4 md:px-6 rounded-xl md:rounded-2xl bg-black hover:bg-gray-800 text-white font-black flex items-center gap-2 text-[10px] md:text-xs uppercase tracking-widest shadow-xl shadow-black/10 transition-all active:scale-95">
                                    <Plus className="h-4 w-4" />
                                    <span className="hidden sm:inline">Initialize Announcement</span>
                                    <span className="sm:hidden">Broadcast</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="w-[95%] max-w-lg rounded-[2rem] md:rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden mx-auto bg-white">
                                <form onSubmit={handleCreate}>
                                    <div className="bg-black p-8 md:p-10 text-white">
                                        <h2 className="text-xl md:text-2xl font-black tracking-tighter uppercase italic">Dispatch Protocol</h2>
                                        <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-2">Broadcast communication to active node residents.</p>
                                    </div>
                                    <div className="p-8 md:p-10 space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Title Assignment</Label>
                                            <Input
                                                required
                                                placeholder="e.g. MAINTENANCE_WINDOW_ALERT"
                                                className="h-12 md:h-14 rounded-xl md:rounded-2xl border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black transition-all font-black uppercase text-xs tracking-wider"
                                                value={formData.title}
                                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Protocol Content</Label>
                                            <Textarea
                                                required
                                                placeholder="Enter full announcement details..."
                                                className="min-h-[140px] rounded-xl md:rounded-2xl border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black transition-all font-semibold text-sm resize-none p-4"
                                                value={formData.content}
                                                onChange={e => setFormData({ ...formData, content: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Priority Node</Label>
                                                <Select value={formData.priority} onValueChange={val => setFormData({ ...formData, priority: val })}>
                                                    <SelectTrigger className="h-12 md:h-14 rounded-xl md:rounded-2xl border-gray-100 bg-gray-50 font-bold uppercase text-[10px] tracking-widest">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl border-gray-100 shadow-2xl font-sans">
                                                        {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => (
                                                            <SelectItem key={p} value={p} className="text-[10px] font-black uppercase tracking-widest py-3">{p}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Lifecycle Expiry</Label>
                                                <Input
                                                    type="date"
                                                    className="h-12 md:h-14 rounded-xl md:rounded-2xl border-gray-100 bg-gray-50 font-bold px-4"
                                                    value={formData.expiresAt}
                                                    onChange={e => setFormData({ ...formData, expiresAt: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-8 md:p-10 bg-gray-50/50 border-t border-gray-100">
                                        <Button type="submit" disabled={createMutation.isPending} className="w-full h-12 md:h-14 rounded-xl md:rounded-2xl bg-black hover:bg-gray-800 text-white font-black uppercase tracking-widest text-xs transition-all active:scale-[0.98]">
                                            {createMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <Megaphone className="h-4 w-4 mr-2" />}
                                            Commit Broadcast
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-8 md:py-12 min-w-0">
                {/* Operations Bar */}
                <div className="flex flex-col lg:flex-row items-center gap-4 md:gap-6 mb-10 md:mb-16 w-full min-w-0">
                    <div className="relative flex-1 group w-full min-w-0">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-black transition-colors" />
                        <Input
                            placeholder="OPERATIONAL_IDENTIFICATION_SCAN..."
                            className="h-12 md:h-16 pl-14 bg-white border border-gray-100 rounded-2xl md:rounded-[2rem] shadow-sm focus:ring-4 focus:ring-black/5 focus:border-black text-[10px] md:text-sm font-black placeholder:text-gray-200 uppercase tracking-widest w-full min-w-0"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-6 bg-white px-8 md:px-10 py-3 md:py-4 rounded-2xl md:rounded-[2rem] border border-gray-50 shadow-sm w-full lg:w-auto overflow-x-auto justify-around sm:justify-start shrink-0">
                        <div className="flex flex-col items-center px-4 md:px-6 border-r border-gray-100 min-w-[80px]">
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Active</span>
                            <span className="text-base md:text-2xl font-black text-gray-900 tracking-tighter">{filteredNotices?.length || 0}</span>
                        </div>
                        <div className="flex flex-col items-center px-4 md:px-6 min-w-[80px]">
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Global</span>
                            <span className="text-base md:text-2xl font-black text-indigo-600 tracking-tighter">{notices?.filter(n => !n.hostelId).length || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Grid Deck */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                    {filteredNotices?.length > 0 ? (
                        filteredNotices.map((notice) => (
                            <div key={notice.id} className="bg-white border border-gray-50 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group flex flex-col relative overflow-hidden min-w-0">
                                <div className={`absolute top-0 right-0 w-1.5 md:w-2.5 h-full ${getPriorityColor(notice.priority)} opacity-40 group-hover:opacity-100 transition-opacity`} />

                                <div className="flex items-start justify-between mb-6 md:mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-11 w-11 md:h-14 md:w-14 text-white rounded-2xl md:rounded-3xl ${getPriorityColor(notice.priority)} flex items-center justify-center shadow-xl shadow-black/5 shrink-0 group-hover:scale-110 transition-transform`}>
                                            <Megaphone className="h-4 w-4 md:h-6 md:w-6" />
                                        </div>
                                        <div className="min-w-0">
                                            <Badge variant="outline" className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest border-2 py-0.5 rounded-full px-3 mb-1.5 ${notice.priority === 'URGENT' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                                                {notice.priority} Protocol
                                            </Badge>
                                            <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] truncate italic italic px-1">
                                                {notice.category} Registry
                                            </p>
                                        </div>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="secondary" size="icon" className="h-9 w-9 md:h-11 md:w-11 rounded-xl md:rounded-2xl bg-gray-50 hover:bg-black hover:text-white transition-all shrink-0 active:scale-90 shadow-sm">
                                                <MoreVertical className="h-4 w-4 md:h-5 md:w-5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-52 p-2 rounded-[1.5rem] border-gray-100 shadow-2xl font-sans">
                                            <DropdownMenuItem onClick={() => startEditing(notice)} className="text-[10px] font-black uppercase tracking-widest text-gray-600 cursor-pointer p-4 rounded-xl gap-3 hover:bg-gray-50 transition-colors">
                                                <Edit3 className="h-4 w-4 text-indigo-500" /> Modify Metadata
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => deleteMutation.mutate(notice.id)} className="text-[10px] font-black uppercase tracking-widest text-rose-600 cursor-pointer hover:bg-rose-50 p-4 rounded-xl gap-3 transition-colors">
                                                <Trash2 className="h-4 w-4" /> Purge Record
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="space-y-4 md:space-y-6 flex-1 min-w-0 overflow-hidden">
                                    <div className="min-w-0">
                                        <h3 className="text-base md:text-xl font-black tracking-tight text-gray-900 group-hover:text-black transition-colors uppercase leading-tight italic">
                                            {notice.title}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-3 mt-3 min-w-0">
                                            <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100/50">
                                                <Clock className="h-3 w-3 text-gray-400" />
                                                <span className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                                    {format(new Date(notice.createdAt), 'MMM dd • HH:mm')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[13px] md:text-[15px] text-gray-500 leading-relaxed font-semibold italic line-clamp-4 md:line-clamp-none">
                                        "{notice.content}"
                                    </p>
                                </div>

                                {notice.expiresAt && (
                                    <div className="mt-8 md:mt-10 pt-6 md:pt-8 border-t border-gray-50 flex items-center justify-between min-w-0">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <Calendar className="h-4 w-4 text-gray-300 shrink-0" />
                                            <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] truncate">
                                                EXP_{format(new Date(notice.expiresAt), 'yyyy_MM_dd')}
                                            </span>
                                        </div>
                                        {new Date(notice.expiresAt) < new Date() && (
                                            <Badge className="bg-rose-100 text-rose-700 border-none font-black text-[8px] md:text-[9px] uppercase tracking-[0.3em] px-3 py-1 rounded-full shadow-none shrink-0 italic">DEAD_NODE</Badge>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-24 md:py-40 text-center bg-white border border-dashed border-gray-200 rounded-[3rem] md:rounded-[4rem] px-10 shadow-inner">
                            <div className="h-20 w-20 md:h-32 md:w-32 rounded-[2.5rem] md:rounded-[3.5rem] bg-gray-50 flex items-center justify-center mx-auto mb-8 text-gray-100 group">
                                <Megaphone className="h-10 w-10 md:h-16 md:w-16 grayscale opacity-20 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-700" />
                            </div>
                            <h3 className="text-xl md:text-3xl font-black text-gray-900 uppercase tracking-widest italic leading-none">Bulletin Vacuum</h3>
                            <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-[0.3em] mt-4 max-w-sm mx-auto leading-relaxed italic">No operational communication tokens detected within the specified identification criteria.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Edit Protocol Dialog */}
            <Dialog open={!!editingNotice} onOpenChange={() => setEditingNotice(null)}>
                <DialogContent className="w-[95%] max-w-lg rounded-[2rem] md:rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden mx-auto bg-white">
                    <form onSubmit={handleUpdate}>
                        <div className="bg-black p-8 md:p-10 text-white">
                            <h2 className="text-xl md:text-2xl font-black tracking-tighter uppercase italic">Refine Protocol</h2>
                            <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-2">Adjusting operational broadcast metadata.</p>
                        </div>
                        <div className="p-8 md:p-10 space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Update Title</Label>
                                <Input
                                    required
                                    className="h-12 md:h-14 rounded-xl md:rounded-2xl border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black transition-all font-black uppercase text-xs tracking-wider"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Protocol Payload</Label>
                                <Textarea
                                    required
                                    className="min-h-[140px] rounded-xl md:rounded-2xl border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black transition-all font-semibold text-sm resize-none p-4"
                                    value={formData.content}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Priority Token</Label>
                                    <Select value={formData.priority} onValueChange={val => setFormData({ ...formData, priority: val })}>
                                        <SelectTrigger className="h-12 md:h-14 rounded-xl md:rounded-2xl border-gray-100 bg-gray-50 font-bold uppercase text-[10px] tracking-widest">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-gray-100 shadow-2xl font-sans">
                                            {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => (
                                                <SelectItem key={p} value={p} className="text-[10px] font-black uppercase tracking-widest py-3">{p}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Lifecycle Killswitch</Label>
                                    <Input
                                        type="date"
                                        className="h-12 md:h-14 rounded-xl md:rounded-2xl border-gray-100 bg-gray-50 font-bold px-4"
                                        value={formData.expiresAt}
                                        onChange={e => setFormData({ ...formData, expiresAt: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-8 md:p-10 bg-gray-50/50 border-t border-gray-100">
                            <Button type="submit" disabled={updateMutation.isPending} className="w-full h-12 md:h-14 rounded-xl md:rounded-2xl bg-black hover:bg-gray-800 text-white font-black uppercase tracking-widest text-xs transition-all active:scale-[0.98]">
                                {updateMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                Commit Mutations
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div >
    )
}

export default WardenNoticePage
