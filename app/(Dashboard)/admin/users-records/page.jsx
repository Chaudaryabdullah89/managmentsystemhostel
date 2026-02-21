"use client"
import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
    Shield,
    User,
    UserCog,
    UserCheck,
    ChevronRight,
    Search,
    Mail,
    Phone,
    Building2,
    Calendar,
    CheckCircle,
    History,
    FileText,
    CreditCard,
    Home,
    Wrench,
    AlertTriangle,
    DollarSign,
    Clock,
    XCircle,
    Plus,
    Filter,
    MoreVertical,
    Settings2,
    Trash2,
    Save,
    MapPin,
    Fingerprint,
    ShieldCheck,
    Loader2,
    Zap,
    Briefcase,
    ChevronLeft,
    UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useAllUsers, useCreateUser, useUpdateAnyUser, useDeleteUser, useResetPassword } from "@/hooks/useUsers";
import { useHostel } from "@/hooks/usehostel";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const UserRecordPage = () => {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [filterRole, setFilterRole] = useState("all");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    const { data: users, isLoading: usersLoading } = useAllUsers({ role: filterRole });
    const { data: hostelsData } = useHostel();
    const hostels = hostelsData?.data || [];
    const createUser = useCreateUser();
    const updateAnyUser = useUpdateAnyUser();
    const deleteUser = useDeleteUser();
    const resetPassword = useResetPassword();

    const [selectedUser, setSelectedUser] = useState(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
    const [isAccessDialogOpen, setIsAccessDialogOpen] = useState(false);
    const [newPassword, setNewPassword] = useState("hostel123");

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "password123",
        phone: "",
        cnic: "",
        role: "RESIDENT",
        hostelId: "",
        designation: "",
        basicSalary: 0
    });

    const filteredUsers = useMemo(() => {
        if (!users) return [];
        return users.filter(u =>
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.phone?.includes(searchQuery)
        );
    }, [users, searchQuery]);

    const handleCreateUser = async () => {
        try {
            await createUser.mutateAsync(formData);
            setIsCreateDialogOpen(false);
            setFormData({
                name: "",
                email: "",
                password: "password123",
                phone: "",
                cnic: "",
                role: "RESIDENT",
                hostelId: "",
                designation: "",
                basicSalary: 0
            });
        } catch (error) { }
    };

    const handleEditUser = async () => {
        if (!selectedUser) return;
        try {
            await updateAnyUser.mutateAsync({
                id: selectedUser.id,
                data: selectedUser
            });
            setIsEditDialogOpen(false);
        } catch (error) { }
    };

    const handleResetPassword = async () => {
        if (!selectedUser) return;
        try {
            await resetPassword.mutateAsync({
                id: selectedUser.id,
                newPassword: newPassword
            });
            setIsAccessDialogOpen(false);
            setNewPassword("hostel123");
        } catch (error) { }
    };

    const handleUpdateRole = async () => {
        if (!selectedUser) return;
        try {
            await updateAnyUser.mutateAsync({
                id: selectedUser.id,
                data: { role: selectedUser.role }
            });
            setIsRoleDialogOpen(false);
        } catch (error) { }
    };

    const handleDeleteUser = async (id) => {
        if (confirm("Are you sure you want to delete this user? This action is irreversible.")) {
            try {
                await deleteUser.mutateAsync(id);
            } catch (error) { }
        }
    };

    const getRoleStyles = (role) => {
        switch (role) {
            case "ADMIN":
                return { color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100", icon: Shield };
            case "WARDEN":
                return { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", icon: UserCog };
            case "STAFF":
                return { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", icon: Briefcase };
            case "RESIDENT":
                return { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", icon: User };
            default:
                return { color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-100", icon: User };
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/30 pb-20">
            {/* Premium Header */}
            <div className="bg-white border-b sticky top-0 z-50 py-2 md:h-16 shadow-black/5 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-4 md:px-8 h-full flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                    <div className="flex items-center gap-3 md:gap-5">
                        <div className="h-8 w-1 md:w-1.5 bg-blue-600 rounded-full shrink-0" />
                        <div className="flex flex-col">
                            <h1 className="text-sm md:text-base font-bold text-gray-900 tracking-tight uppercase">Staff & Residents</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-[0.2em] text-blue-600">Management</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                                <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-600 truncate">Active Records</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
                        <Button
                            variant="outline"
                            className="h-9 md:h-10 flex-1 md:flex-none px-3 md:px-5 rounded-xl md:rounded-2xl border-gray-200 bg-white font-bold text-[9px] md:text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                            onClick={() => setIsCreateDialogOpen(true)}
                        >
                            <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" /> Quick Add
                        </Button>
                        <Button
                            className="h-9 md:h-10 flex-1 md:flex-none px-3 md:px-6 rounded-xl md:rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[9px] md:text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                            onClick={() => router.push('/admin/users-records/register')}
                        >
                            <UserPlus className="h-3.5 w-3.5 md:h-4 md:w-4" /> <span className="hidden xs:inline">Register</span> User
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
                {/* Search */}
                <div className="bg-white border border-gray-100 rounded-[2rem] md:rounded-[2.5rem] p-2 flex flex-col md:flex-row items-center gap-2 md:gap-4 shadow-sm">
                    <div className="flex-1 relative w-full group">
                        <Search className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        <Input
                            placeholder="Search by Name or Email..."
                            className="w-full h-11 md:h-12 pl-10 md:pl-12 bg-transparent border-none shadow-none font-bold text-xs md:text-sm focus-visible:ring-0 placeholder:text-gray-300"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="h-8 w-px bg-gray-100 hidden md:block" />
                    <div className="flex items-center gap-1.5 md:gap-3 p-1.5 bg-gray-50/50 rounded-[1.5rem] w-full md:w-auto overflow-x-auto scrollbar-hide">
                        {["all", "ADMIN", "WARDEN", "STAFF", "RESIDENT"].map(role => (
                            <button
                                key={role}
                                onClick={() => setFilterRole(role)}
                                className={`h-9 md:h-10 px-3 md:px-6 rounded-xl font-bold text-[8px] md:text-[10px] uppercase tracking-widest transition-all shrink-0 ${filterRole === role
                                    ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5"
                                    : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
                                    }`}
                            >
                                {role}
                            </button>
                        ))}
                    </div>
                </div>

                {/* User List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {usersLoading ? (
                        Array(6).fill(0).map((_, i) => (
                            <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-3xl" />
                        ))
                    ) : filteredUsers.map(user => {
                        const styles = getRoleStyles(user.role);
                        return (
                            <div key={user.id} className="bg-white border border-gray-100 rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-7 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all group relative overflow-hidden flex flex-col h-full border-b-[3px] border-b-transparent hover:border-b-blue-500">
                                <div className={`absolute top-0 right-0 w-32 h-32 md:w-40 md:h-40 ${styles.bg} rounded-bl-full opacity-10 -mr-12 md:-mr-16 -mt-12 md:-mt-16 transition-transform group-hover:scale-110`} />

                                <div className="flex items-start justify-between relative mb-6 md:mb-8">
                                    <div className={`h-12 w-12 md:h-16 md:w-16 rounded-[1.2rem] md:rounded-[1.5rem] ${styles.bg} ${styles.color} flex items-center justify-center border ${styles.border} shadow-sm group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-500`}>
                                        <styles.icon className="h-5 w-5 md:h-7 md:w-7" />
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10 rounded-full hover:bg-gray-50 border border-gray-100">
                                                <MoreVertical className="h-4 w-4 text-gray-400" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-gray-100 bg-white">
                                            <div className="px-3 py-2">
                                                <p className="text-[8px] font-black uppercase text-gray-400 tracking-[0.2em]">Actions</p>
                                            </div>
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    setSelectedUser({ ...user });
                                                    setIsEditDialogOpen(true);
                                                }}
                                                className="h-11 rounded-xl font-bold text-[10px] uppercase tracking-widest cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-2"
                                            >
                                                <Settings2 className="h-4 w-4 text-gray-400" /> Modify Profile
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    setSelectedUser({ ...user });
                                                    setIsRoleDialogOpen(true);
                                                }}
                                                className="h-11 rounded-xl font-bold text-[10px] uppercase tracking-widest cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-2"
                                            >
                                                <Shield className="h-4 w-4 text-gray-400" /> Modify Role
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setIsAccessDialogOpen(true);
                                                }}
                                                className="h-11 rounded-xl font-bold text-[10px] uppercase tracking-widest cursor-pointer text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2"
                                            >
                                                <Zap className="h-4 w-4" /> Grant Access
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-gray-50 mx-2 my-2" />
                                            <DropdownMenuItem
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="h-11 rounded-xl font-bold text-[10px] uppercase tracking-widest cursor-pointer text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2"
                                            >
                                                <Trash2 className="h-4 w-4 text-gray-400" /> Delete User
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="space-y-4 flex-1 flex flex-col">
                                    <div>
                                        <h3 className="text-lg md:text-xl font-black text-gray-900 tracking-tight truncate">{user.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className={`px-2 md:px-3 py-0.5 rounded-full text-[8px] md:text-[9px] font-bold uppercase tracking-widest ${styles.bg} ${styles.color} ${styles.border}`}>
                                                {user.role}
                                            </Badge>
                                            {user.isActive ? (
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                    <div className="h-1 w-1 md:h-1.5 md:w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span className="text-[8px] md:text-[9px] font-black uppercase tracking-tighter">Active</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-50 text-gray-400 border border-gray-100">
                                                    <div className="h-1 w-1 md:h-1.5 md:w-1.5 rounded-full bg-gray-300" />
                                                    <span className="text-[8px] md:text-[9px] font-black uppercase tracking-tighter">Inactive</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-1.5 md:gap-2">
                                        <div className="flex items-center gap-2.5 md:gap-3 text-gray-500">
                                            <Mail className="h-3.5 w-3.5 shrink-0" />
                                            <span className="text-[10px] md:text-[11px] font-bold truncate tracking-tight">{user.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 md:gap-3 text-gray-500">
                                            <Phone className="h-3.5 w-3.5 shrink-0" />
                                            <span className="text-[10px] md:text-[11px] font-bold tracking-tight">{user.phone || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 md:gap-3 text-gray-500">
                                            <Building2 className="h-3.5 w-3.5 shrink-0" />
                                            <span className="text-[10px] md:text-[11px] font-bold tracking-tight truncate">{user.Hostel_User_hostelIdToHostel?.name || 'Global Access'}</span>
                                        </div>
                                    </div>

                                    <Separator className="bg-gray-50 my-4 md:my-6" />

                                    <div className="flex items-center justify-between pt-2 mt-auto">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest">User ID</span>
                                            {user.uid ? (
                                                <Badge className="bg-gray-100 text-gray-600 border-none text-[8px] font-mono font-bold px-2 py-0.5 w-fit">
                                                    {user.uid}
                                                </Badge>
                                            ) : (
                                                <span className="text-[9px] md:text-[10px] font-bold text-gray-900 tracking-tighter uppercase tabular-nums">#{user.id.slice(-8).toUpperCase()}</span>
                                            )}
                                        </div>
                                        <Link href={`/admin/users-records/${user.id}`}>
                                            <Button variant="outline" className="h-9 md:h-10 px-3 md:px-5 rounded-xl md:rounded-[1.2rem] font-bold text-[8px] md:text-[10px] uppercase tracking-widest text-blue-600 border-indigo-100 bg-blue-50/50 hover:bg-blue-600 hover:text-white transition-all group/btn flex items-center gap-2">
                                                Records <ChevronRight className="h-3 md:h-3.5 w-3 md:w-3.5 transition-transform group-hover/btn:translate-x-1" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {!usersLoading && filteredUsers.length === 0 && (
                        <div className="col-span-full py-24 text-center">
                            <Fingerprint className="h-16 w-16 text-gray-200 mx-auto mb-6" />
                            <h3 className="text-xl font-bold text-gray-900 uppercase">No users found</h3>
                            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">No personnel nodes found matching your filters.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-white">
                    <div className="bg-blue-600 p-10 text-white text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/10 skew-x-12 translate-x-20" />
                        <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/10 shadow-lg">
                            <Settings2 className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter italic">Edit User</h2>
                        <p className="text-[10px] text-white/70 font-bold tracking-widest mt-2 uppercase">Update details</p>
                    </div>

                    <div className="p-10 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Full Name</Label>
                                <Input
                                    className="h-12 rounded-2xl border-gray-100 bg-gray-50 focus:bg-white transition-all font-bold px-5 uppercase text-sm"
                                    value={selectedUser?.name || ""}
                                    onChange={e => setSelectedUser({ ...selectedUser, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Email</Label>
                                <Input
                                    className="h-12 rounded-2xl border-gray-100 bg-gray-50 focus:bg-white transition-all font-bold px-5 text-sm"
                                    value={selectedUser?.email || ""}
                                    onChange={e => setSelectedUser({ ...selectedUser, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Phone</Label>
                                <Input
                                    className="h-12 rounded-2xl border-gray-100 bg-gray-50 focus:bg-white transition-all font-bold px-5 text-sm"
                                    value={selectedUser?.phone || ""}
                                    onChange={e => setSelectedUser({ ...selectedUser, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">CNIC</Label>
                                <Input
                                    className="h-12 rounded-2xl border-gray-100 bg-gray-50 focus:bg-white transition-all font-bold px-5 text-sm"
                                    value={selectedUser?.cnic || ""}
                                    onChange={e => setSelectedUser({ ...selectedUser, cnic: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button variant="ghost" className="flex-1 h-12 rounded-xl font-bold text-[10px] uppercase tracking-widest" onClick={() => setIsEditDialogOpen(false)}>Discard</Button>
                            <Button className="flex-[2] h-12 bg-blue-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl shadow-lg" onClick={handleEditUser} disabled={updateAnyUser.isPending}>
                                {updateAnyUser.isPending ? "Syncing..." : "Update"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Grant Access Dialog */}
            <Dialog open={isAccessDialogOpen} onOpenChange={setIsAccessDialogOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-white">
                    <div className="bg-blue-600 p-10 text-white text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/10 skew-x-12 translate-x-20" />
                        <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/10 shadow-lg">
                            <ShieldCheck className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter italic">Password Reset</h2>
                        <p className="text-[10px] text-white/70 font-bold tracking-widest mt-2 uppercase">Reset user password</p>
                    </div>

                    <div className="p-10 space-y-6">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">New Password (Password)</Label>
                            <Input
                                type="text"
                                className="h-14 rounded-2xl border-gray-100 bg-gray-50 text-center font-black tracking-[0.3em] text-lg uppercase"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                            />
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight text-center italic">Provide this key to the member for system entry</p>
                        </div>

                        <Button className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-blue-500/20" onClick={handleResetPassword} disabled={resetPassword.isPending}>
                            {resetPassword.isPending ? "Authorizing..." : "Reset Password"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Role Update Dialog */}
            <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-white">
                    <div className="bg-amber-500 p-10 text-white text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/10 skew-x-12 translate-x-20" />
                        <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/10 shadow-lg">
                            <UserCog className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter italic">Change Role</h2>
                        <p className="text-[10px] text-white/70 font-bold tracking-widest mt-2 uppercase">Change user permissions</p>
                    </div>

                    <div className="p-10 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Select New Role</Label>
                            <select
                                className="w-full h-14 rounded-2xl border-gray-100 bg-gray-50 px-6 font-bold text-sm uppercase outline-none focus:ring-2 focus:ring-amber-500/20"
                                value={selectedUser?.role || ""}
                                onChange={e => setSelectedUser({ ...selectedUser, role: e.target.value })}
                            >
                                <option value="ADMIN">Administrator</option>
                                <option value="WARDEN">Hostel Warden</option>
                                <option value="STAFF">Facility Staff</option>
                                <option value="RESIDENT">Student Resident</option>
                            </select>
                        </div>

                        <Button className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-amber-500/20" onClick={handleUpdateRole} disabled={updateAnyUser.isPending}>
                            {updateAnyUser.isPending ? "Syncing..." : "Update Role"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Create Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-white">
                    <div className="bg-blue-600 p-12 text-white text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/10 skew-x-12 translate-x-20" />
                        <div className="h-20 w-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-8 backdrop-blur-md border border-white/10 shadow-lg">
                            <Plus className="h-10 w-10 text-white" />
                        </div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter italic">Add New User</h2>
                        <p className="text-[11px] text-white/70 font-bold tracking-[0.2em] mt-3 uppercase">Register a new user</p>
                    </div>

                    <div className="p-12 space-y-8">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Full Name</Label>
                                <Input
                                    placeholder="Enter full name"
                                    className="h-12 rounded-2xl border-gray-100 bg-gray-50 focus:bg-white transition-all font-bold px-5"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Email Address</Label>
                                <Input
                                    placeholder="email@hostel.com"
                                    className="h-12 rounded-2xl border-gray-100 bg-gray-50 focus:bg-white transition-all font-bold px-5"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Phone Number</Label>
                                <Input
                                    placeholder="03XX-XXXXXXX"
                                    className="h-12 rounded-2xl border-gray-100 bg-gray-50 focus:bg-white transition-all font-bold px-5"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">CNIC</Label>
                                <Input
                                    placeholder="XXXXX-XXXXXXX-X"
                                    className="h-12 rounded-2xl border-gray-100 bg-gray-50 focus:bg-white transition-all font-bold px-5"
                                    value={formData.cnic}
                                    onChange={e => setFormData({ ...formData, cnic: e.target.value })}
                                />
                            </div>
                        </div>

                        <Separator className="bg-gray-50" />

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Role Assignment</Label>
                                <select
                                    className="w-full h-12 rounded-2xl border-gray-100 bg-gray-50 px-5 font-bold text-[10px] uppercase outline-none focus:ring-2 focus:ring-black/5"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="ADMIN">Administrator</option>
                                    <option value="WARDEN">Hostel Warden</option>
                                    <option value="STAFF">Facility Staff</option>
                                    <option value="RESIDENT">Student Resident</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Assign Hostel</Label>
                                <select
                                    className="w-full h-12 rounded-2xl border-gray-100 bg-gray-50 px-5 font-bold text-[10px] uppercase outline-none focus:ring-2 focus:ring-black/5"
                                    value={formData.hostelId}
                                    onChange={e => setFormData({ ...formData, hostelId: e.target.value })}
                                >
                                    <option value="">Global Assignment</option>
                                    {hostels.map(h => (
                                        <option key={h.id} value={h.id}>{h.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {(formData.role === 'STAFF' || formData.role === 'WARDEN') && (
                            <div className="grid grid-cols-2 gap-6 p-6 bg-gray-50 rounded-3xl animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-blue-600 ml-1 italic">Professional Designation</Label>
                                    <Input
                                        placeholder="e.g. Senior Manager"
                                        className="h-12 rounded-2xl border-blue-100 bg-white font-bold px-5"
                                        value={formData.designation}
                                        onChange={e => setFormData({ ...formData, designation: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 ml-1 italic">Monthly Salary (PKR)</Label>
                                    <Input
                                        type="number"
                                        placeholder="45000"
                                        className="h-12 rounded-2xl border-emerald-100 bg-white font-bold px-5"
                                        value={formData.basicSalary}
                                        onChange={e => setFormData({ ...formData, basicSalary: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4 pt-6">
                            <Button
                                variant="ghost"
                                className="flex-1 rounded-2xl h-14 font-bold text-[10px] uppercase tracking-widest text-gray-400 hover:bg-gray-50"
                                onClick={() => setIsCreateDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-[2] h-14 bg-blue-600 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-black/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-3 disabled:opacity-50"
                                onClick={handleCreateUser}
                                disabled={createUser.isPending || !formData.name || !formData.email}
                            >
                                {createUser.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                                Add User
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default UserRecordPage;
