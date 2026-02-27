"use client"
import React, { useState } from 'react'
import {
    Megaphone, Plus, Search, MoreVertical, Clock,
    Calendar, Trash2, Edit3, Loader2, Inbox, Bell,
    AlertTriangle, Info, CheckCircle2, RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import Loader from "@/components/ui/Loader"

const WardenNoticePage = () => {
    const { user } = useAuthStore()
    const { data: notices, isLoading } = useNotices({ hostelId: user?.hostelId })
    const createMutation = useCreateNotice()
    const updateMutation = useUpdateNotice()
    const deleteMutation = useDeleteNotice()

    const [searchTerm, setSearchTerm] = useState('')
    const [filterPriority, setFilterPriority] = useState('all')
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingNotice, setEditingNotice] = useState(null)

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        priority: 'MEDIUM',
        category: 'GENERAL',
        expiresAt: ''
    })

    const handleCreate = async (e) => {
        e.preventDefault()
        await createMutation.mutateAsync({ ...formData, authorId: user.id, hostelId: user.hostelId })
        setIsCreateOpen(false)
        setFormData({ title: '', content: '', priority: 'MEDIUM', category: 'GENERAL', expiresAt: '' })
    }

    const handleUpdate = async (e) => {
        e.preventDefault()
        await updateMutation.mutateAsync({ id: editingNotice.id, ...formData })
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

    const getPriorityTheme = (priority) => {
        switch (priority) {
            case 'URGENT': return 'bg-rose-50 text-rose-700 border-rose-100'
            case 'HIGH': return 'bg-orange-50 text-orange-700 border-orange-100'
            case 'MEDIUM': return 'bg-blue-50 text-blue-700 border-blue-100'
            case 'LOW': return 'bg-emerald-50 text-emerald-700 border-emerald-100'
            default: return 'bg-gray-50 text-gray-600 border-gray-100'
        }
    }

    const getPriorityAccent = (priority) => {
        switch (priority) {
            case 'URGENT': return 'bg-rose-500'
            case 'HIGH': return 'bg-orange-500'
            case 'MEDIUM': return 'bg-blue-500'
            case 'LOW': return 'bg-emerald-500'
            default: return 'bg-gray-300'
        }
    }

    const filteredNotices = (notices || []).filter(notice => {
        const matchesSearch = notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            notice.content.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesPriority = filterPriority === 'all' || notice.priority === filterPriority
        return matchesSearch && matchesPriority
    })

    const stats = {
        total: notices?.length || 0,
        urgent: notices?.filter(n => n.priority === 'URGENT').length || 0,
        high: notices?.filter(n => n.priority === 'HIGH').length || 0,
        expiring: notices?.filter(n => n.expiresAt && new Date(n.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length || 0,
    }

    if (isLoading) return <Loader label="Loading" subLabel="Updates..." icon={Megaphone} fullScreen={false} />

    const NoticeForm = ({ onSubmit, isPending, submitLabel }) => (
        <form onSubmit={onSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Title</Label>
                <Input
                    required
                    className="rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white text-sm font-medium"
                    placeholder="Title"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
            </div>
            <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Content</Label>
                <Textarea
                    required
                    className="min-h-[100px] rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white resize-none text-sm font-medium"
                    placeholder="Message"
                    value={formData.content}
                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Priority</Label>
                    <Select value={formData.priority} onValueChange={val => setFormData({ ...formData, priority: val })}>
                        <SelectTrigger className="rounded-xl border-gray-100 font-bold text-[10px] uppercase tracking-wider">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                            {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => (
                                <SelectItem key={p} value={p} className="text-[10px] font-bold uppercase tracking-widest">{p}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">End</Label>
                    <Input
                        type="date"
                        className="rounded-xl border-gray-100 font-medium text-sm"
                        value={formData.expiresAt}
                        onChange={e => setFormData({ ...formData, expiresAt: e.target.value })}
                    />
                </div>
            </div>
            <Button
                type="submit"
                disabled={isPending}
                className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-widest transition-all"
            >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : submitLabel}
            </Button>
        </form>
    )

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight">

            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-full flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="h-8 w-1 bg-indigo-600 rounded-full shrink-0" />
                        <div className="flex flex-col">
                            <h1 className="text-sm md:text-lg font-bold text-gray-900 tracking-tight uppercase">Notices</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-gray-400">Total</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-emerald-600 hidden sm:block">Active</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3 shrink-0">
                        {/* Search — desktop */}
                        <div className="relative group hidden lg:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                            <Input
                                placeholder="Search..."
                                className="h-9 w-[240px] pl-9 rounded-xl border-gray-100 bg-gray-50/50 font-bold text-[10px] uppercase tracking-wider text-gray-600 shadow-sm focus:ring-0 focus:bg-white placeholder:text-gray-300"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button className="h-9 px-4 md:px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-widest shadow-sm transition-all flex items-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    <span className="hidden sm:inline">Add</span>
                                    <span className="sm:hidden">Post</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[440px] rounded-3xl border-gray-100 p-8">
                                <DialogHeader className="mb-2">
                                    <DialogTitle className="text-base font-black uppercase tracking-widest text-gray-900">Add</DialogTitle>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Post update.</p>
                                </DialogHeader>
                                <NoticeForm onSubmit={handleCreate} isPending={createMutation.isPending} submitLabel="Post" />
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8">

                {/* Mobile Search */}
                <div className="lg:hidden relative group w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search..."
                        className="h-12 w-full pl-11 rounded-2xl border-gray-100 bg-white font-bold text-[11px] uppercase tracking-wider text-gray-600 shadow-sm focus:ring-0"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {[
                        { label: 'Total', value: stats.total, sub: 'Records', icon: Megaphone, color: 'text-indigo-600', bg: 'bg-indigo-50/50' },
                        { label: 'Urgent', value: stats.urgent, sub: 'Urgent', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50/50' },
                        { label: 'High', value: stats.high, sub: 'High', icon: Bell, color: 'text-orange-600', bg: 'bg-orange-50/50' },
                        { label: 'Ending', value: stats.expiring, sub: 'Soon', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50/50' },
                    ].map((stat, i) => (
                        <div key={i} className={`border border-gray-100 rounded-2xl p-3 md:p-5 flex items-center gap-3 md:gap-4 shadow-sm hover:shadow-md transition-all group min-w-0 ${stat.bg}`}>
                            <div className={`h-10 w-10 md:h-12 md:w-12 rounded-xl bg-white flex items-center justify-center shrink-0 border border-gray-100 group-hover:scale-110 transition-transform ${stat.color}`}>
                                <stat.icon className="h-4 w-4 md:h-5 md:w-5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest truncate">{stat.label}</span>
                                <div className="flex items-baseline gap-1.5 min-w-0">
                                    <span className={`text-base md:text-xl font-bold tracking-tight truncate ${stat.color}`}>{stat.value}</span>
                                    <span className="text-[7px] md:text-[8px] font-black text-gray-400 uppercase tracking-wider truncate mb-0.5">{stat.sub}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2.5 bg-white border border-gray-100 rounded-2xl p-3 shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">Filter</span>
                    <div className="h-4 w-px bg-gray-100" />
                    <Select value={filterPriority} onValueChange={setFilterPriority}>
                        <SelectTrigger className="h-9 w-[150px] rounded-xl border-gray-100 bg-gray-50/50 font-bold text-[10px] uppercase tracking-wider text-gray-600 shadow-sm focus:ring-0">
                            <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                            <SelectItem value="all" className="text-[10px] font-bold uppercase tracking-widest">All</SelectItem>
                            <SelectItem value="URGENT" className="text-[10px] font-bold uppercase tracking-widest">Urgent</SelectItem>
                            <SelectItem value="HIGH" className="text-[10px] font-bold uppercase tracking-widest">High</SelectItem>
                            <SelectItem value="MEDIUM" className="text-[10px] font-bold uppercase tracking-widest">Medium</SelectItem>
                            <SelectItem value="LOW" className="text-[10px] font-bold uppercase tracking-widest">Low</SelectItem>
                        </SelectContent>
                    </Select>
                    {(filterPriority !== 'all' || searchTerm) && (
                        <Button
                            variant="ghost"
                            className="h-9 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest text-rose-500 hover:bg-rose-50"
                            onClick={() => { setFilterPriority('all'); setSearchTerm('') }}
                        >
                            Reset
                        </Button>
                    )}
                    <span className="ml-auto text-[10px] font-bold text-gray-400 uppercase tracking-widest pr-2">
                        {filteredNotices.length} Matches
                    </span>
                </div>

                {/* Notice List */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 px-2">
                        <div className="h-5 w-1 bg-indigo-600 rounded-full" />
                        <h3 className="text-xs md:text-sm font-bold uppercase tracking-widest text-gray-900">Recent</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:gap-4">
                        {filteredNotices.length > 0 ? filteredNotices.map((notice) => (
                            <div key={notice.id} className="bg-white border border-gray-100 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                {/* Priority accent bar */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${getPriorityAccent(notice.priority)} opacity-70`} />

                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pl-3">
                                    <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                                        <div className={`h-10 w-10 md:h-11 md:w-11 rounded-xl flex items-center justify-center shrink-0 border ${getPriorityTheme(notice.priority)}`}>
                                            <Megaphone className="h-4 w-4 md:h-5 md:w-5" />
                                        </div>
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <Badge variant="outline" className={`${getPriorityTheme(notice.priority)} text-[8px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest shrink-0`}>
                                                    {notice.priority}
                                                </Badge>
                                                {notice.category && (
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{notice.category}</span>
                                                )}
                                            </div>
                                            <h3 className="text-[13px] md:text-sm font-black text-gray-900 uppercase tracking-tight line-clamp-1 group-hover:text-indigo-600 transition-colors">{notice.title}</h3>
                                            <p className="text-[11px] md:text-xs text-gray-500 font-medium leading-relaxed mt-1 line-clamp-2">{notice.content}</p>

                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="h-3 w-3 text-gray-400" />
                                                    <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-tight">{format(new Date(notice.createdAt), 'MMM dd, yyyy')}</span>
                                                </div>
                                                {notice.expiresAt && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="h-3 w-3 text-amber-500" />
                                                        <span className="text-[9px] md:text-[10px] font-bold text-amber-600 uppercase tracking-tight">Ends {format(new Date(notice.expiresAt), 'dd/MM/yyyy')}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 shrink-0">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-xl border-gray-100 shadow-xl p-1">
                                            <DropdownMenuItem onClick={() => startEditing(notice)} className="rounded-lg text-[10px] font-bold uppercase tracking-widest py-2 gap-3">
                                                <Edit3 className="h-3.5 w-3.5 text-indigo-500" /> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => deleteMutation.mutate(notice.id)}
                                                className="rounded-lg text-[10px] font-bold uppercase tracking-widest py-2 gap-3 text-rose-600 focus:bg-rose-50 focus:text-rose-600"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        )) : (
                            <div className="py-24 flex flex-col items-center justify-center bg-white border border-dashed border-gray-200 rounded-[2rem] text-center px-6">
                                <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-6 border border-gray-100">
                                    <Inbox className="h-8 w-8 text-gray-200" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Empty</h3>
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2">No records match.</p>
                                <Button
                                    variant="outline"
                                    className="mt-8 rounded-xl border-gray-200 uppercase tracking-widest text-[10px] font-bold h-10 px-8 hover:bg-indigo-600 hover:text-white transition-all"
                                    onClick={() => { setFilterPriority('all'); setSearchTerm('') }}
                                >
                                    Reset
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Edit Modal */}
            <Dialog open={!!editingNotice} onOpenChange={() => setEditingNotice(null)}>
                <DialogContent className="sm:max-w-[440px] rounded-3xl border-gray-100 p-8">
                    <DialogHeader className="mb-2">
                        <DialogTitle className="text-base font-black uppercase tracking-widest text-gray-900">Edit</DialogTitle>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Update post.</p>
                    </DialogHeader>
                    <NoticeForm onSubmit={handleUpdate} isPending={updateMutation.isPending} submitLabel="Save" />
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default WardenNoticePage