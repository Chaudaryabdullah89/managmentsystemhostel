"use client"
import React from 'react'
import { Megaphone, Bell } from "lucide-react"
import { useNotices } from "@/hooks/useNotices"
import useAuthStore from "@/hooks/Authstate"
import { format } from "date-fns"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const HeaderNotices = () => {
    const { user } = useAuthStore()
    const { data: notices } = useNotices({ hostelId: user?.hostelId })

    const activeNotices = notices?.slice(0, 5) || []

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl hover:bg-gray-100">
                    <Bell className="h-5 w-5 text-gray-600" />
                    {activeNotices.length > 0 && (
                        <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-rose-500 border-2 border-white rounded-full animate-pulse" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[340px] rounded-2xl p-0 shadow-2xl overflow-hidden border-gray-100">
                <div className="bg-indigo-600 p-4 pb-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -translate-y-12 translate-x-12" />
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                            <Megaphone className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-[13px] font-black uppercase tracking-widest text-white leading-tight">Notice Board</h3>
                            <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Latest Announcements</p>
                        </div>
                    </div>
                </div>

                <div className="max-h-[300px] overflow-y-auto -mt-2 bg-white relative z-20 rounded-t-2xl divide-y divide-gray-50">
                    {activeNotices.length > 0 ? (
                        activeNotices.map((notice) => (
                            <DropdownMenuItem key={notice.id} className="p-4 focus:bg-gray-50 cursor-default flex-col items-start gap-2">
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-2">
                                        <div className={`h-2 w-2 rounded-full ${notice.priority === 'URGENT' ? 'bg-rose-500 animate-pulse' : notice.priority === 'HIGH' ? 'bg-amber-500' : 'bg-indigo-500'}`} />
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{notice.category}</span>
                                    </div>
                                    <span className="text-[8px] font-bold text-gray-400">{format(new Date(notice.createdAt), 'MMM dd')}</span>
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-black text-gray-900 tracking-tight uppercase leading-snug">{notice.title}</h4>
                                    <p className="text-[10px] text-gray-500 line-clamp-2 mt-1 leading-relaxed">{notice.content}</p>
                                </div>
                            </DropdownMenuItem>
                        ))
                    ) : (
                        <div className="p-8 text-center flex flex-col items-center">
                            <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center mb-2">
                                <Bell className="h-4 w-4 text-gray-400" />
                            </div>
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">No New Notices</p>
                            <p className="text-[9px] font-bold text-gray-400 mt-1">You're all caught up</p>
                        </div>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default HeaderNotices
