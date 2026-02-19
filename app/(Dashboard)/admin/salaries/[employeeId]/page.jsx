"use client"
import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
    DollarSign,
    Calendar,
    CheckCircle,
    XCircle,
    Clock,
    Download,
    User,
    ChevronRight,
    Receipt,
    Check,
    Building2,
    Briefcase,
    Mail,
    Phone,
    CreditCard,
    ArrowLeft,
    TrendingUp,
    History
} from "lucide-react";
import { Card, CardHeader, CardAction, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import UnifiedReceipt from "@/components/receipt/UnifiedReceipt";

const EmployeeSalaryHistoryPage = () => {
    const params = useParams();
    const employeeId = params.employeeId;
    const [filterYear, setFilterYear] = useState("2025");
    const [filterStatus, setFilterStatus] = useState("all");
    const [paymentNotes, setPaymentNotes] = useState("");

    // Mock employee data - replace with actual API call
    const employee = {
        id: "EMP_001",
        name: "Ali Ahmed",
        role: "Manager",
        phone: "0321-1111111",
        email: "ali.ahmed@email.com",
        cnic: "12345-1234567-1",
        joinDate: "2023-01-15",
        status: "Active",
        hostel: {
            id: "H001",
            name: "GreenView Hostel 1"
        },
        currentSalary: {
            basic: 50000,
            allowances: 10000,
            total: 60000
        }
    };

    // Mock salary history - replace with actual API call
    const salaryHistory = [
        {
            id: "SAL_001",
            month: "December 2025",
            year: "2025",
            dueDate: "2025-12-31",
            paymentDate: null,
            status: "Pending",
            salary: {
                basic: 50000,
                allowances: 10000,
                bonuses: 5000,
                deductions: 2000,
                total: 63000
            },
            paymentMethod: null,
            transactionId: null,
            paidBy: null
        },
        {
            id: "SAL_002",
            month: "November 2025",
            year: "2025",
            dueDate: "2025-11-30",
            paymentDate: "2025-11-28",
            status: "Paid",
            salary: {
                basic: 50000,
                allowances: 10000,
                bonuses: 0,
                deductions: 2000,
                total: 58000
            },
            paymentMethod: "Bank Transfer",
            transactionId: "TRX-SAL-NOV-001",
            paidBy: "Admin User"
        },
        {
            id: "SAL_003",
            month: "October 2025",
            year: "2025",
            dueDate: "2025-10-31",
            paymentDate: "2025-10-30",
            status: "Paid",
            salary: {
                basic: 50000,
                allowances: 10000,
                bonuses: 0,
                deductions: 2000,
                total: 58000
            },
            paymentMethod: "Cash",
            transactionId: null,
            paidBy: "Admin User"
        },
        {
            id: "SAL_004",
            month: "September 2025",
            year: "2025",
            dueDate: "2025-09-30",
            paymentDate: "2025-09-29",
            status: "Paid",
            salary: {
                basic: 50000,
                allowances: 10000,
                bonuses: 3000,
                deductions: 2000,
                total: 61000
            },
            paymentMethod: "Bank Transfer",
            transactionId: "TRX-SAL-SEP-001",
            paidBy: "Admin User"
        },
        {
            id: "SAL_005",
            month: "August 2025",
            year: "2025",
            dueDate: "2025-08-31",
            paymentDate: "2025-08-30",
            status: "Paid",
            salary: {
                basic: 50000,
                allowances: 10000,
                bonuses: 0,
                deductions: 2000,
                total: 58000
            },
            paymentMethod: "Bank Transfer",
            transactionId: "TRX-SAL-AUG-001",
            paidBy: "Admin User"
        },
        {
            id: "SAL_006",
            month: "July 2025",
            year: "2025",
            dueDate: "2025-07-31",
            paymentDate: "2025-07-30",
            status: "Paid",
            salary: {
                basic: 50000,
                allowances: 10000,
                bonuses: 0,
                deductions: 2000,
                total: 58000
            },
            paymentMethod: "Cash",
            transactionId: null,
            paidBy: "Admin User"
        }
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case "Paid":
                return "bg-green-100 text-green-700 border-green-200";
            case "Pending":
                return "bg-gray-100 text-gray-700 border-gray-200";
            case "Overdue":
                return "bg-red-100 text-red-700 border-red-200";
            default:
                return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "Paid":
                return <CheckCircle className="w-4 h-4" />;
            case "Pending":
                return <Clock className="w-4 h-4" />;
            case "Overdue":
                return <XCircle className="w-4 h-4" />;
            default:
                return <Clock className="w-4 h-4" />;
        }
    };

    const filteredHistory = salaryHistory.filter(record => {
        const matchesYear = filterYear === "all" || record.year === filterYear;
        const matchesStatus = filterStatus === "all" || record.status === filterStatus;
        return matchesYear && matchesStatus;
    });

    const stats = {
        totalPaid: salaryHistory.filter(s => s.status === "Paid").length,
        totalPending: salaryHistory.filter(s => s.status === "Pending").length,
        totalEarned: salaryHistory.filter(s => s.status === "Paid").reduce((sum, s) => sum + s.salary.total, 0),
        pendingAmount: salaryHistory.filter(s => s.status === "Pending").reduce((sum, s) => sum + s.salary.total, 0),
        averageSalary: Math.round(salaryHistory.reduce((sum, s) => sum + s.salary.total, 0) / salaryHistory.length)
    };

    const uniqueYears = [...new Set(salaryHistory.map(s => s.year))];

    const handleMarkAsPaid = (salary) => {
        console.log("Marking salary as paid:", salary.id);
        alert(`Salary ${salary.id} marked as paid successfully!`);
        setPaymentNotes("");
    };

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-4 pt-4 gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Link href="/admin/salaries">
                            <Button variant="outline" size="sm" className="cursor-pointer">
                                <ArrowLeft className="w-3 h-3 mr-1" />
                                Back
                            </Button>
                        </Link>
                        <h1 className="text-3xl font-bold">{employee.name}</h1>
                        <Badge className="bg-gray-100 text-gray-700 border-gray-200 border">
                            {employee.status}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <Link href={`/admin/dashboard`} className="text-sm text-muted-foreground hover:text-primary">
                            Dashboard
                        </Link>
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                        <Link href={`/admin/salaries`} className="text-sm text-muted-foreground hover:text-primary">
                            Salaries
                        </Link>
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Salary History</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="cursor-pointer">
                        <Download className="h-3 w-3 mr-2" />
                        Download Report
                    </Button>
                </div>
            </div>

            {/* Employee Info Card */}
            <div className="p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Employee Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="flex items-start gap-3">
                                <Briefcase className="w-5 h-5 text-gray-400 mt-1" />
                                <div>
                                    <p className="text-xs text-gray-500">Role</p>
                                    <p className="text-sm font-semibold">{employee.role}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Building2 className="w-5 h-5 text-gray-400 mt-1" />
                                <div>
                                    <p className="text-xs text-gray-500">Hostel</p>
                                    <p className="text-sm font-semibold">{employee.hostel.name}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone className="w-5 h-5 text-gray-400 mt-1" />
                                <div>
                                    <p className="text-xs text-gray-500">Phone</p>
                                    <p className="text-sm font-semibold">{employee.phone}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Mail className="w-5 h-5 text-gray-400 mt-1" />
                                <div>
                                    <p className="text-xs text-gray-500">Email</p>
                                    <p className="text-sm font-semibold">{employee.email}</p>
                                </div>
                            </div>
                        </div>
                        <Separator className="my-4" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <p className="text-xs text-gray-500">CNIC</p>
                                <p className="text-sm font-semibold">{employee.cnic}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Join Date</p>
                                <p className="text-sm font-semibold">{employee.joinDate}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Current Monthly Salary</p>
                                <p className="text-lg font-bold text-green-600">PKR {employee.currentSalary.total.toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 px-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                        <CardAction>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        </CardAction>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-green-600">{stats.totalPaid}</p>
                        <p className="text-gray-600 text-sm">Months</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <CardAction>
                            <Clock className="h-4 w-4 text-gray-500" />
                        </CardAction>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{stats.totalPending}</p>
                        <p className="text-gray-600 text-sm">Months</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
                        <CardAction>
                            <DollarSign className="h-4 w-4 text-green-500" />
                        </CardAction>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-green-600">PKR {stats.totalEarned.toLocaleString()}</p>
                        <p className="text-gray-600 text-sm">All time</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
                        <CardAction>
                            <DollarSign className="h-4 w-4 text-gray-500" />
                        </CardAction>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">PKR {stats.pendingAmount.toLocaleString()}</p>
                        <p className="text-gray-600 text-sm">Unpaid</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Average Salary</CardTitle>
                        <CardAction>
                            <TrendingUp className="h-4 w-4 text-gray-500" />
                        </CardAction>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">PKR {stats.averageSalary.toLocaleString()}</p>
                        <p className="text-gray-600 text-sm">Per month</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="p-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label>Filter by Year</Label>
                                <Select value={filterYear} onValueChange={setFilterYear}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Years</SelectItem>
                                        {uniqueYears.map((year) => (
                                            <SelectItem key={year} value={year}>
                                                {year}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Filter by Status</Label>
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="Paid">Paid</SelectItem>
                                        <SelectItem value="Pending">Pending</SelectItem>
                                        <SelectItem value="Overdue">Overdue</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end">
                                <p className="text-sm text-gray-600">
                                    Showing <span className="font-semibold">{filteredHistory.length}</span> of <span className="font-semibold">{salaryHistory.length}</span> records
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Salary History Timeline */}
            <div className="p-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History className="w-5 h-5" />
                            Salary History
                        </CardTitle>
                        <CardDescription>
                            Complete payment history for {employee.name}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {filteredHistory.map((record) => (
                                <div key={record.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                    {/* Record Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {record.month}
                                                </h3>
                                                <Badge className={`${getStatusColor(record.status)} border flex items-center gap-1`}>
                                                    {getStatusIcon(record.status)}
                                                    {record.status}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                Salary ID: {record.id} • Due Date: {record.dueDate}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-gray-900">
                                                PKR {record.salary.total.toLocaleString()}
                                            </p>
                                            <p className="text-sm text-gray-500">Net Salary</p>
                                        </div>
                                    </div>

                                    {/* Salary Breakdown */}
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                                        <p className="text-sm font-semibold text-gray-700 mb-3">Salary Breakdown</p>
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-500">Basic Salary:</span>
                                                <p className="font-medium">PKR {record.salary.basic.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Allowances:</span>
                                                <p className="font-medium">PKR {record.salary.allowances.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Bonuses:</span>
                                                <p className="font-medium text-green-600">+ PKR {record.salary.bonuses.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Deductions:</span>
                                                <p className="font-medium text-red-600">- PKR {record.salary.deductions.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Net Total:</span>
                                                <p className="font-bold text-lg">PKR {record.salary.total.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment Details */}
                                    {record.status === "Paid" ? (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                                            <div className="flex items-start gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                                                <div className="flex-1">
                                                    <p className="text-sm text-green-700 font-medium">
                                                        Payment Completed
                                                    </p>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2 text-xs text-green-600">
                                                        <div>
                                                            <span className="font-medium">Date:</span> {record.paymentDate}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Method:</span> {record.paymentMethod}
                                                        </div>
                                                        {record.transactionId && (
                                                            <div>
                                                                <span className="font-medium">Transaction:</span> {record.transactionId}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <span className="font-medium">By:</span> {record.paidBy}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-gray-500" />
                                                <p className="text-sm text-gray-600">Payment pending</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center justify-between pt-3 border-t">
                                        <div className="flex gap-2">
                                            <UnifiedReceipt data={{ ...record, employee }} type="salary">
                                                <Button variant="outline" size="sm" className="cursor-pointer">
                                                    <Receipt className="w-3 h-3 mr-1" />
                                                    View Receipt
                                                </Button>
                                            </UnifiedReceipt>
                                        </div>

                                        {record.status === "Pending" && (
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button size="sm" className="cursor-pointer bg-green-600 hover:bg-green-700">
                                                        <Check className="w-3 h-3 mr-1" />
                                                        Mark as Paid
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Mark Salary as Paid</DialogTitle>
                                                        <DialogDescription>
                                                            Confirm salary payment for {record.month}
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                                                        <div className="space-y-2 text-sm">
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">Employee:</span>
                                                                <span className="font-medium">{employee.name}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">Month:</span>
                                                                <span className="font-medium">{record.month}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">Amount:</span>
                                                                <span className="font-bold text-green-600">PKR {record.salary.total.toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <Label>Payment Method</Label>
                                                            <Select>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select payment method" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="cash">Cash</SelectItem>
                                                                    <SelectItem value="bank">Bank Transfer</SelectItem>
                                                                    <SelectItem value="cheque">Cheque</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div>
                                                            <Label>Payment Date</Label>
                                                            <Input type="date" />
                                                        </div>
                                                        <div>
                                                            <Label>Transaction ID (Optional)</Label>
                                                            <Input placeholder="Enter transaction ID" />
                                                        </div>
                                                        <div>
                                                            <Label>Notes (Optional)</Label>
                                                            <Textarea
                                                                placeholder="Add payment notes..."
                                                                value={paymentNotes}
                                                                onChange={(e) => setPaymentNotes(e.target.value)}
                                                                rows={3}
                                                            />
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <Button
                                                            onClick={() => handleMarkAsPaid(record)}
                                                            className="cursor-pointer bg-green-600 hover:bg-green-700"
                                                        >
                                                            <CheckCircle className="w-4 h-4 mr-2" />
                                                            Confirm Payment
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {filteredHistory.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    <History className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                    <p className="text-lg font-medium">No salary records found</p>
                                    <p className="text-sm">Try adjusting your filters</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default EmployeeSalaryHistoryPage;
