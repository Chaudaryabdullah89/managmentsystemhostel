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
            case 'URGENT': return 'bg-rose-500 text-white'
            case 'HIGH': return 'bg-amber-500 text-white'
            case 'MEDIUM': return 'bg-blue-500 text-white'
            case 'LOW': return 'bg-emerald-500 text-white'
            default: return 'bg-gray-500 text-white'
        }
    }

    const filteredNotices = notices?.filter(notice =>
        notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notice.content.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] py-20">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mb-4" />
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Loading notices...</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight">
            {/* Standard Dashboard Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-1 bg-indigo-600 rounded-full" />
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2 uppercase">
                                Notice Board
                            </h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Internal Communications</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button className="h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20">
                                    <Plus className="h-4 w-4" />
                                    New Notice
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
                                <form onSubmit={handleCreate}>
                                    <div className="bg-indigo-600 p-8 text-white">
                                        <h2 className="text-2xl font-black tracking-tighter uppercase italic">Create Announcement</h2>
                                        <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-[0.2em] mt-1">Blast communication to all residents</p>
                                    </div>
                                    <div className="p-8 space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Title</Label>
                                            <Input
                                                required
                                                placeholder="Urgent: Water Supply Maintenance..."
                                                className="h-12 rounded-2xl border-gray-100 bg-gray-50 focus:bg-white transition-all font-bold uppercase text-xs tracking-wider"
                                                value={formData.title}
                                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Message Content</Label>
                                            <Textarea
                                                required
                                                placeholder="Detailed notice information goes here..."
                                                className="min-h-[120px] rounded-2xl border-gray-100 bg-gray-50 focus:bg-white transition-all font-medium text-sm resize-none"
                                                value={formData.content}
                                                onChange={e => setFormData({ ...formData, content: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Priority</Label>
                                                <Select value={formData.priority} onValueChange={val => setFormData({ ...formData, priority: val })}>
                                                    <SelectTrigger className="h-12 rounded-2xl border-gray-100 bg-gray-50">
                                                        <SelectValue placeholder="Priority" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                                                        <SelectItem value="LOW">Low</SelectItem>
                                                        <SelectItem value="MEDIUM">Medium</SelectItem>
                                                        <SelectItem value="HIGH">High</SelectItem>
                                                        <SelectItem value="URGENT">Urgent</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Expiry Date</Label>
                                                <Input
                                                    type="date"
                                                    className="h-12 rounded-2xl border-gray-100 bg-gray-50"
                                                    value={formData.expiresAt}
                                                    onChange={e => setFormData({ ...formData, expiresAt: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter className="p-8 bg-gray-50/50">
                                        <Button type="submit" disabled={createMutation.isPending} className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest">
                                            {createMutation.isPending ? <Loader2 className="animate-spin" /> : 'Publish Notice'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div >

            <main className="max-w-[1600px] mx-auto px-6 py-10">
                {/* Search & Stats Bar */}
                <div className="flex flex-col md:flex-row items-center gap-6 mb-10">
                    <div className="relative flex-1 group w-full">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                        <Input
                            placeholder="Filter notices by content..."
                            className="h-14 pl-12 bg-white border-gray-100 rounded-3xl shadow-sm border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-indigo-600 text-sm font-bold placeholder:text-gray-300 uppercase tracking-tight"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-3xl ring-1 ring-gray-100 shadow-sm whitespace-nowrap">
                        <div className="flex flex-col items-center px-4 border-r border-gray-100">
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Active</span>
                            <span className="text-xl font-black text-emerald-600">{filteredNotices?.length || 0}</span>
                        </div>
                        <div className="flex flex-col items-center px-4">
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Global</span>
                            <span className="text-xl font-black text-indigo-600">{notices?.filter(n => !n.hostelId).length || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Grid of Notices */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredNotices?.length > 0 ? (
                        filteredNotices.map((notice) => (
                            <div key={notice.id} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col relative overflow-hidden">
                                <div className={`absolute top-0 right-0 w-2 h-full ${getPriorityColor(notice.priority)}`} />

                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-10 w-10 text-white rounded-xl ${getPriorityColor(notice.priority)} flex items-center justify-center shadow-inner`}>
                                            <Megaphone className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${notice.priority === 'URGENT' ? 'text-rose-600' : 'text-indigo-600'}`}>
                                                {notice.priority}
                                            </span>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                                {notice.category}
                                            </p>
                                        </div>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-gray-50 text-gray-400">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-40 rounded-xl border-gray-100 shadow-xl">
                                            <DropdownMenuItem onClick={() => startEditing(notice)} className="text-[10px] font-bold uppercase tracking-wider text-gray-600 cursor-pointer py-2">
                                                <Edit3 className="h-3 w-3 mr-2 text-indigo-500" /> Edit Notice
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => deleteMutation.mutate(notice.id)} className="text-[10px] font-bold uppercase tracking-wider text-rose-600 cursor-pointer hover:bg-rose-50 py-2">
                                                <Trash2 className="h-3 w-3 mr-2" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="space-y-4 flex-1">
                                    <div>
                                        <h3 className="text-[15px] font-black tracking-tight text-gray-900 group-hover:text-indigo-600 transition-colors uppercase">
                                            {notice.title}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1 -ml-0.5">
                                            <Badge variant="secondary" className="bg-gray-50 hover:bg-gray-100 text-[10px] font-bold text-gray-500 uppercase rounded-md tracking-wider">
                                                <Clock className="h-3 w-3 mr-1" />
                                                {format(new Date(notice.createdAt), 'MMM dd, HH:mm')}
                                            </Badge>
                                        </div>
                                    </div>
                                    <p className="text-[12px] text-gray-500 leading-relaxed font-medium">
                                        {notice.content}
                                    </p>
                                </div>

                                {notice.expiresAt && (
                                    <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                Expires: {format(new Date(notice.expiresAt), 'MMM dd, yyyy')}
                                            </span>
                                        </div>
                                        {new Date(notice.expiresAt) < new Date() && (
                                            <Badge className="bg-rose-50 text-rose-600 border-none font-bold text-[9px] uppercase tracking-widest px-2">Expired</Badge>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-24 text-center">
                            <div className="h-20 w-20 rounded-3xl bg-gray-50 flex items-center justify-center mx-auto mb-6 text-gray-200">
                                <Search className="h-10 w-10" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter italic">Bulletin is Clear</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">No active communications found in current filter</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Edit Dialog */}
            <Dialog open={!!editingNotice} onOpenChange={() => setEditingNotice(null)}>
                <DialogContent className="max-w-lg rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
                    <form onSubmit={handleUpdate}>
                        <div className="bg-amber-500 p-8 text-white">
                            <h2 className="text-2xl font-black tracking-tighter uppercase italic">Modify Announcement</h2>
                            <p className="text-[10px] font-bold text-amber-100 uppercase tracking-[0.2em] mt-1">Refining published protocol metadata</p>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Title</Label>
                                <Input
                                    required
                                    className="h-12 rounded-2xl border-gray-100 bg-gray-50 font-bold uppercase text-xs"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Message Content</Label>
                                <Textarea
                                    required
                                    className="min-h-[120px] rounded-2xl border-gray-100 bg-gray-50 font-medium text-sm resize-none"
                                    value={formData.content}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Priority</Label>
                                    <Select value={formData.priority} onValueChange={val => setFormData({ ...formData, priority: val })}>
                                        <SelectTrigger className="h-12 rounded-2xl border-gray-100">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="LOW">Low</SelectItem>
                                            <SelectItem value="MEDIUM">Medium</SelectItem>
                                            <SelectItem value="HIGH">High</SelectItem>
                                            <SelectItem value="URGENT">Urgent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Expiry</Label>
                                    <Input
                                        type="date"
                                        className="h-12 rounded-2xl border-gray-100 bg-gray-50"
                                        value={formData.expiresAt}
                                        onChange={e => setFormData({ ...formData, expiresAt: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="p-8 bg-gray-50/50">
                            <Button type="submit" disabled={updateMutation.isPending} className="w-full h-12 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest">
                                {updateMutation.isPending ? <Loader2 className="animate-spin" /> : 'Update Protocol'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div >
    )
}

export default WardenNoticePage
