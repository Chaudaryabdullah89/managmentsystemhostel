"use client"
import React, { useState } from 'react'
import {
    Megaphone, Plus, Search, MoreVertical, Clock,
    Calendar, Trash2, Edit3, Loader2, CheckCircle2,
    Inbox, Bell
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

const WardenNoticePage = () => {
    const { user } = useAuthStore()
    const { data: notices, isLoading } = useNotices({ hostelId: user?.hostelId })
    const createMutation = useCreateNotice()
    const updateMutation = useUpdateNotice()
    const deleteMutation = useDeleteNotice()

    const [searchTerm, setSearchTerm] = useState('')
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingNotice, setEditingNotice] = useState(null)

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        priority: 'MEDIUM',
        category: 'GENERAL',
        expiresAt: ''
    })

    // Logic handlers (Keep your existing implementation)
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

    const getPriorityStyles = (priority) => {
        switch (priority) {
            case 'URGENT': return 'border-rose-100 bg-rose-50 text-rose-600'
            case 'HIGH': return 'border-orange-100 bg-orange-50 text-orange-600'
            case 'MEDIUM': return 'border-blue-100 bg-blue-50 text-blue-600'
            case 'LOW': return 'border-emerald-100 bg-emerald-50 text-emerald-600'
            default: return 'border-gray-100 bg-gray-50 text-gray-600'
        }
    }

    const filteredNotices = notices?.filter(notice =>
        notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notice.content.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (isLoading) return (
        <div className="flex h-screen items-center justify-center bg-white">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
    )

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-50">
            {/* Minimal Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-indigo-200 shadow-lg">
                            <Bell className="h-4 w-4 text-white" />
                        </div>
                        <h1 className="text-sm font-semibold tracking-tight uppercase text-slate-800">Notice Center</h1>
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="rounded-full bg-slate-900 hover:bg-slate-800 text-xs font-medium px-5">
                                <Plus className="h-4 w-4 mr-2" />
                                New Announcement
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] rounded-3xl border-slate-100">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-semibold tracking-tight">Create Notice</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreate} className="space-y-5 pt-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-slate-500 ml-1">Title</Label>
                                    <Input
                                        required
                                        className="rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all"
                                        placeholder="Headline of the notice..."
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-slate-500 ml-1">Content</Label>
                                    <Textarea
                                        required
                                        className="min-h-[120px] rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white resize-none"
                                        placeholder="Detailed message..."
                                        value={formData.content}
                                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-slate-500 ml-1">Priority</Label>
                                        <Select value={formData.priority} onValueChange={val => setFormData({ ...formData, priority: val })}>
                                            <SelectTrigger className="rounded-xl border-slate-100">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => (
                                                    <SelectItem key={p} value={p}>{p}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-slate-500 ml-1">Expiry Date</Label>
                                        <Input
                                            type="date"
                                            className="rounded-xl border-slate-100"
                                            value={formData.expiresAt}
                                            onChange={e => setFormData({ ...formData, expiresAt: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 py-6 font-semibold transition-all">
                                    {createMutation.isPending ? <Loader2 className="animate-spin" /> : "Publish Notice"}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-4 mb-10">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search notices..."
                            className="h-12 pl-11 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-50/50 transition-all border-none shadow-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-4 px-6 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-medium text-slate-500">
                        <span>Active: <b className="text-slate-900">{filteredNotices?.length || 0}</b></span>
                        <div className="w-[1px] h-4 bg-slate-200" />
                        <span>Hostel: <b className="text-slate-900">{user?.hostelId || 'N/A'}</b></span>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredNotices?.length > 0 ? (
                        filteredNotices.map((notice) => (
                            <div key={notice.id} className="group flex flex-col bg-white border border-slate-100 rounded-[24px] p-6 hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-300 relative overflow-hidden">
                                <div className="flex items-start justify-between mb-4">
                                    <Badge variant="outline" className={`rounded-lg px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase border-none ${getPriorityStyles(notice.priority)}`}>
                                        {notice.priority}
                                    </Badge>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreVertical className="h-4 w-4 text-slate-400" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-xl border-slate-100 shadow-xl p-1">
                                            <DropdownMenuItem onClick={() => startEditing(notice)} className="rounded-lg text-xs font-medium py-2">
                                                <Edit3 className="h-3.5 w-3.5 mr-2 text-indigo-500" /> Edit Notice
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => deleteMutation.mutate(notice.id)} className="rounded-lg text-xs font-medium py-2 text-rose-600 focus:bg-rose-50 focus:text-rose-600">
                                                <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors mb-2">
                                        {notice.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 mb-6">
                                        {notice.content}
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-[11px] font-medium text-slate-400">
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5" />
                                        {format(new Date(notice.createdAt), 'MMM dd, yyyy')}
                                    </div>
                                    {notice.expiresAt && (
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-md">
                                            <Calendar className="h-3.5 w-3.5" />
                                            Exp: {format(new Date(notice.expiresAt), 'dd/MM')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <Inbox className="h-6 w-6 text-slate-300" />
                            </div>
                            <h3 className="text-sm font-semibold text-slate-900">No notices found</h3>
                            <p className="text-xs text-slate-500 mt-1">Try adjusting your search or create a new post.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Reuse the Create Dialog logic for Edit (can be abstracted or kept as is) */}
            <Dialog open={!!editingNotice} onOpenChange={() => setEditingNotice(null)}>
                <DialogContent className="sm:max-w-[425px] rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold">Edit Notice</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-5 pt-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-slate-500">Title</Label>
                            <Input
                                required
                                className="rounded-xl"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-slate-500">Content</Label>
                            <Textarea
                                required
                                className="min-h-[120px] rounded-xl resize-none"
                                value={formData.content}
                                onChange={e => setFormData({ ...formData, content: e.target.value })}
                            />
                        </div>
                        <Button type="submit" className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700">
                            {updateMutation.isPending ? <Loader2 className="animate-spin" /> : "Save Changes"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default WardenNoticePage