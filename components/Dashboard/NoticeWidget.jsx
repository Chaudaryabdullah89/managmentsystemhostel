"use client"
import React from 'react'
import {
    Megaphone,
    Clock,
    ArrowRight,
    ChevronRight,
    Info,
    AlertTriangle,
    Pin
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useNotices } from "@/hooks/useNotices"
import { format } from "date-fns"
import Link from "next/link"

const NoticeWidget = ({ hostelId }) => {
    const { data: notices, isLoading } = useNotices({ hostelId })

    if (isLoading) return (
        <Card className="rounded-[2.5rem] border-gray-100 shadow-sm overflow-hidden animate-pulse">
            <div className="h-48 bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <Megaphone className="h-6 w-6 text-gray-200" />
                    <div className="h-2 w-24 bg-gray-200 rounded-full" />
                </div>
            </div>
        </Card>
    )

    const activeNotices = notices?.slice(0, 3) || []

    return (
        <Card className="rounded-[2.5rem] border-gray-100 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 bg-white">
            <CardHeader className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-[3000ms]" />
                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                            <Megaphone className="h-5 w-5 text-indigo-100" />
                        </div>
                        <div>
                            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-100">Notice Board</CardTitle>
                            <p className="text-[9px] font-bold text-indigo-200/80 uppercase tracking-widest mt-0.5">Stay Updated</p>
                        </div>
                    </div>
                    {activeNotices.length > 0 && (
                        <Badge className="bg-white/20 hover:bg-white/30 text-white border-none text-[8px] font-black rounded-full px-2.5 py-1 backdrop-blur-md">
                            {activeNotices.length} NEW
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-gray-50">
                    {activeNotices.length > 0 ? (
                        activeNotices.map((notice) => (
                            <div key={notice.id} className="p-6 hover:bg-gray-50/50 transition-all cursor-pointer group/item">
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {notice.priority === 'URGENT' ? (
                                                <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                                            ) : notice.priority === 'HIGH' ? (
                                                <div className="h-2 w-2 rounded-full bg-amber-500" />
                                            ) : (
                                                <div className="h-2 w-2 rounded-full bg-indigo-500" />
                                            )}
                                            <span className={`text-[9px] font-black uppercase tracking-[0.2em] 
                                                ${notice.priority === 'URGENT' ? 'text-rose-600' : 'text-indigo-600'}`}>
                                                {notice.category}
                                            </span>
                                        </div>
                                        <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest flex items-center gap-1">
                                            <Clock className="h-2.5 w-2.5" /> {format(new Date(notice.createdAt), 'MMM dd')}
                                        </span>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-gray-900 tracking-tight uppercase line-clamp-1 group-hover/item:text-indigo-600 transition-colors">
                                            {notice.title}
                                        </h4>
                                        <p className="text-xs font-medium text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                                            {notice.content}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-12 px-6 text-center">
                            <div className="h-14 w-14 rounded-2xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center mx-auto mb-4">
                                <Pin className="h-6 w-6 text-gray-300 rotate-45" />
                            </div>
                            <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest leading-none">Bulletin is Empty</h4>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-2 px-6">No active announcements currently posted</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

export default NoticeWidget
