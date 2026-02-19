"use client"
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ChevronRight,
    ArrowLeft,
    Save,
    X,
    Upload,
    Calendar,
    DollarSign,
    FileText,
    Building2,
    User,
    CreditCard
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const AddSalaryPage = () => {
    const router = useRouter();

    const [formData, setFormData] = useState({
        employeeId: "",
        employeeName: "",
        designation: "",
        hostel: "",
        month: "",
        year: new Date().getFullYear().toString(),
        baseSalary: "",
        allowances: "",
        bonuses: "",
        deductions: "",
        netSalary: "",
        paymentDate: "",
        paymentMethod: "",
        transactionId: "",
        bankName: "",
        accountNumber: "",
        status: "Paid",
        description: "",
        notes: "",
        attachments: null
    });

    const [errors, setErrors] = useState({});

    // Calculate net salary automatically
    const calculateNetSalary = () => {
        const base = parseFloat(formData.baseSalary) || 0;
        const allowances = parseFloat(formData.allowances) || 0;
        const bonuses = parseFloat(formData.bonuses) || 0;
        const deductions = parseFloat(formData.deductions) || 0;

        const net = base + allowances + bonuses - deductions;
        setFormData(prev => ({ ...prev, netSalary: net.toString() }));
    };

    // Auto-calculate when relevant fields change
    React.useEffect(() => {
        calculateNetSalary();
    }, [formData.baseSalary, formData.allowances, formData.bonuses, formData.deductions]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.employeeId) newErrors.employeeId = "Employee is required";
        if (!formData.month) newErrors.month = "Month is required";
        if (!formData.year) newErrors.year = "Year is required";
        if (!formData.baseSalary || formData.baseSalary <= 0) newErrors.baseSalary = "Valid base salary is required";
        if (!formData.paymentDate) newErrors.paymentDate = "Payment date is required";
        if (!formData.paymentMethod) newErrors.paymentMethod = "Payment method is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (validateForm()) {
            console.log("Form submitted:", formData);
            alert("Salary record added successfully!");
            router.push("/admin/salaries");
        }
    };

    const handleCancel = () => {
        router.push("/admin/salaries");
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: "" }));
        }
    };

    // Mock employee data - replace with actual API call
    const employees = [
        { id: "EMP_001", name: "Ali Ahmed", designation: "Warden", hostel: "GreenView Hostel 1" },
        { id: "EMP_002", name: "Sara Khan", designation: "Assistant Warden", hostel: "GreenView Hostel 2" },
        { id: "EMP_003", name: "Hassan Ali", designation: "Security Guard", hostel: "GreenView Hostel 1" },
        { id: "EMP_004", name: "Fatima Noor", designation: "Cleaning Staff", hostel: "GreenView Hostel 3" },
        { id: "EMP_005", name: "Usman Tariq", designation: "Maintenance Staff", hostel: "GreenView Hostel 2" }
    ];

    const handleEmployeeSelect = (employeeId) => {
        const employee = employees.find(e => e.id === employeeId);
        if (employee) {
            setFormData(prev => ({
                ...prev,
                employeeId: employee.id,
                employeeName: employee.name,
                designation: employee.designation,
                hostel: employee.hostel
            }));
        }
    };

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

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
                        <h1 className="text-3xl font-bold">Add Salary Record</h1>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <Link href="/admin/dashboard" className="text-sm text-muted-foreground hover:text-primary">
                            Dashboard
                        </Link>
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                        <Link href="/admin/salaries" className="text-sm text-muted-foreground hover:text-primary">
                            Salaries
                        </Link>
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Add Salary</span>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="p-4 space-y-6">
                    {/* Employee Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Employee Information
                            </CardTitle>
                            <CardDescription>Select employee and period details</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="employeeId">
                                        Employee <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={formData.employeeId}
                                        onValueChange={(value) => handleEmployeeSelect(value)}
                                    >
                                        <SelectTrigger className={`mt-1 ${errors.employeeId ? "border-red-500" : ""}`}>
                                            <SelectValue placeholder="Select employee" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {employees.map(emp => (
                                                <SelectItem key={emp.id} value={emp.id}>
                                                    {emp.name} - {emp.designation}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.employeeId && <p className="text-xs text-red-500 mt-1">{errors.employeeId}</p>}
                                </div>

                                <div>
                                    <Label>Employee ID</Label>
                                    <Input
                                        value={formData.employeeId}
                                        disabled
                                        className="mt-1 bg-gray-50"
                                    />
                                </div>

                                <div>
                                    <Label>Designation</Label>
                                    <Input
                                        value={formData.designation}
                                        disabled
                                        className="mt-1 bg-gray-50"
                                    />
                                </div>

                                <div>
                                    <Label>Assigned Hostel</Label>
                                    <Input
                                        value={formData.hostel}
                                        disabled
                                        className="mt-1 bg-gray-50"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="month">
                                        Salary Month <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={formData.month} onValueChange={(value) => handleInputChange("month", value)}>
                                        <SelectTrigger className={`mt-1 ${errors.month ? "border-red-500" : ""}`}>
                                            <SelectValue placeholder="Select month" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {months.map(month => (
                                                <SelectItem key={month} value={month}>{month}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.month && <p className="text-xs text-red-500 mt-1">{errors.month}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="year">
                                        Year <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={formData.year} onValueChange={(value) => handleInputChange("year", value)}>
                                        <SelectTrigger className={`mt-1 ${errors.year ? "border-red-500" : ""}`}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {years.map(year => (
                                                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.year && <p className="text-xs text-red-500 mt-1">{errors.year}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Salary Breakdown */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="w-5 h-5" />
                                Salary Breakdown
                            </CardTitle>
                            <CardDescription>Enter salary components</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="baseSalary">
                                        Base Salary (PKR) <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="relative mt-1">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            id="baseSalary"
                                            type="number"
                                            placeholder="e.g., 50000"
                                            value={formData.baseSalary}
                                            onChange={(e) => handleInputChange("baseSalary", e.target.value)}
                                            className={`pl-10 ${errors.baseSalary ? "border-red-500" : ""}`}
                                            min="0"
                                        />
                                    </div>
                                    {errors.baseSalary && <p className="text-xs text-red-500 mt-1">{errors.baseSalary}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="allowances">
                                        Allowances (PKR)
                                    </Label>
                                    <div className="relative mt-1">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            id="allowances"
                                            type="number"
                                            placeholder="e.g., 5000"
                                            value={formData.allowances}
                                            onChange={(e) => handleInputChange("allowances", e.target.value)}
                                            className="pl-10"
                                            min="0"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Transport, Housing, etc.</p>
                                </div>

                                <div>
                                    <Label htmlFor="bonuses">
                                        Bonuses (PKR)
                                    </Label>
                                    <div className="relative mt-1">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            id="bonuses"
                                            type="number"
                                            placeholder="e.g., 3000"
                                            value={formData.bonuses}
                                            onChange={(e) => handleInputChange("bonuses", e.target.value)}
                                            className="pl-10"
                                            min="0"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Performance, Overtime, etc.</p>
                                </div>

                                <div>
                                    <Label htmlFor="deductions">
                                        Deductions (PKR)
                                    </Label>
                                    <div className="relative mt-1">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            id="deductions"
                                            type="number"
                                            placeholder="e.g., 2000"
                                            value={formData.deductions}
                                            onChange={(e) => handleInputChange("deductions", e.target.value)}
                                            className="pl-10"
                                            min="0"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Tax, Advance, etc.</p>
                                </div>

                                <div className="md:col-span-2 bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-green-900">Net Salary (Auto-calculated)</span>
                                        <span className="text-2xl font-bold text-green-600">
                                            PKR {parseFloat(formData.netSalary || 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-green-700 mt-1">
                                        Base + Allowances + Bonuses - Deductions
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="w-5 h-5" />
                                Payment Information
                            </CardTitle>
                            <CardDescription>Payment method and bank details</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="paymentDate">
                                        Payment Date <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="paymentDate"
                                        type="date"
                                        value={formData.paymentDate}
                                        onChange={(e) => handleInputChange("paymentDate", e.target.value)}
                                        className={`mt-1 ${errors.paymentDate ? "border-red-500" : ""}`}
                                    />
                                    {errors.paymentDate && <p className="text-xs text-red-500 mt-1">{errors.paymentDate}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="paymentMethod">
                                        Payment Method <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={formData.paymentMethod} onValueChange={(value) => handleInputChange("paymentMethod", value)}>
                                        <SelectTrigger className={`mt-1 ${errors.paymentMethod ? "border-red-500" : ""}`}>
                                            <SelectValue placeholder="Select payment method" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                            <SelectItem value="Cash">Cash</SelectItem>
                                            <SelectItem value="Cheque">Cheque</SelectItem>
                                            <SelectItem value="Mobile Banking">Mobile Banking</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.paymentMethod && <p className="text-xs text-red-500 mt-1">{errors.paymentMethod}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="transactionId">
                                        Transaction ID
                                    </Label>
                                    <Input
                                        id="transactionId"
                                        placeholder="e.g., TRX123456789"
                                        value={formData.transactionId}
                                        onChange={(e) => handleInputChange("transactionId", e.target.value)}
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="status">
                                        Payment Status
                                    </Label>
                                    <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Paid">Paid</SelectItem>
                                            <SelectItem value="Pending">Pending</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="bankName">
                                        Bank Name
                                    </Label>
                                    <Input
                                        id="bankName"
                                        placeholder="e.g., Allied Bank"
                                        value={formData.bankName}
                                        onChange={(e) => handleInputChange("bankName", e.target.value)}
                                        className="mt-1"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Optional: For bank transfer</p>
                                </div>

                                <div>
                                    <Label htmlFor="accountNumber">
                                        Account Number
                                    </Label>
                                    <Input
                                        id="accountNumber"
                                        placeholder="e.g., 1234567890"
                                        value={formData.accountNumber}
                                        onChange={(e) => handleInputChange("accountNumber", e.target.value)}
                                        className="mt-1"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Optional: Employee account</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Additional Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Additional Information
                            </CardTitle>
                            <CardDescription>Notes and attachments</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div>
                                    <Label htmlFor="description">
                                        Description
                                    </Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Enter salary payment description..."
                                        value={formData.description}
                                        onChange={(e) => handleInputChange("description", e.target.value)}
                                        rows={3}
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="notes">
                                        Notes & Remarks
                                    </Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Add any additional notes or remarks..."
                                        value={formData.notes}
                                        onChange={(e) => handleInputChange("notes", e.target.value)}
                                        rows={3}
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="attachments">
                                        Attachments
                                    </Label>
                                    <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
                                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                        <p className="text-sm text-gray-600 mb-1">
                                            Click to upload or drag and drop
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            PDF, PNG, JPG up to 10MB
                                        </p>
                                        <Input
                                            id="attachments"
                                            type="file"
                                            multiple
                                            accept=".pdf,.png,.jpg,.jpeg"
                                            onChange={(e) => handleInputChange("attachments", e.target.files)}
                                            className="hidden"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Upload salary slips or payment receipts
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex justify-end gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCancel}
                                    className="cursor-pointer"
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="cursor-pointer"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Salary Record
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </div>
    );
};

export default AddSalaryPage;
