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
    User
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

const AddExpensePage = () => {
    const router = useRouter();

    const [formData, setFormData] = useState({
        title: "",
        category: "",
        amount: "",
        vendor: "",
        hostel: "",
        date: "",
        dueDate: "",
        paymentMethod: "",
        status: "Pending",
        transactionId: "",
        receiptNumber: "",
        description: "",
        notes: "",
        attachments: null
    });

    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) newErrors.title = "Title is required";
        if (!formData.category) newErrors.category = "Category is required";
        if (!formData.amount || formData.amount <= 0) newErrors.amount = "Valid amount is required";
        if (!formData.vendor.trim()) newErrors.vendor = "Vendor/Payee is required";
        if (!formData.hostel) newErrors.hostel = "Hostel is required";
        if (!formData.date) newErrors.date = "Date is required";
        if (!formData.dueDate) newErrors.dueDate = "Due date is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (validateForm()) {
            console.log("Form submitted:", formData);
            alert("Expense added successfully!");
            router.push("/admin/expenses");
        }
    };

    const handleCancel = () => {
        router.push("/admin/expenses");
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: "" }));
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-4 pt-4 gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Link href="/admin/expenses">
                            <Button variant="outline" size="sm" className="cursor-pointer">
                                <ArrowLeft className="w-3 h-3 mr-1" />
                                Back
                            </Button>
                        </Link>
                        <h1 className="text-3xl font-bold">Add New Expense</h1>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <Link href="/admin/dashboard" className="text-sm text-muted-foreground hover:text-primary">
                            Dashboard
                        </Link>
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                        <Link href="/admin/expenses" className="text-sm text-muted-foreground hover:text-primary">
                            Expenses
                        </Link>
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Add Expense</span>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="p-4 space-y-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Basic Information
                            </CardTitle>
                            <CardDescription>Enter the main expense details</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="title">
                                        Expense Title <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="title"
                                        placeholder="e.g., Electricity Bill - December"
                                        value={formData.title}
                                        onChange={(e) => handleInputChange("title", e.target.value)}
                                        className={`mt-1 ${errors.title ? "border-red-500" : ""}`}
                                    />
                                    {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="category">
                                        Category <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                                        <SelectTrigger className={`mt-1 ${errors.category ? "border-red-500" : ""}`}>
                                            <SelectValue placeholder="Select expense category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Utilities">Utilities (Electricity, Water, Gas, Internet)</SelectItem>
                                            <SelectItem value="Maintenance">Maintenance & Repairs</SelectItem>
                                            <SelectItem value="Salaries">Salaries & Wages</SelectItem>
                                            <SelectItem value="Supplies">Supplies & Consumables</SelectItem>
                                            <SelectItem value="Services">Professional Services</SelectItem>
                                            <SelectItem value="Insurance">Insurance & Taxes</SelectItem>
                                            <SelectItem value="Marketing">Marketing & Advertising</SelectItem>
                                            <SelectItem value="Other">Other Expenses</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="amount">
                                        Amount (PKR) <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="relative mt-1">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            id="amount"
                                            type="number"
                                            placeholder="e.g., 50000"
                                            value={formData.amount}
                                            onChange={(e) => handleInputChange("amount", e.target.value)}
                                            className={`pl-10 ${errors.amount ? "border-red-500" : ""}`}
                                            min="0"
                                        />
                                    </div>
                                    {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="vendor">
                                        Vendor/Payee <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="relative mt-1">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            id="vendor"
                                            placeholder="e.g., K-Electric, ABC Services"
                                            value={formData.vendor}
                                            onChange={(e) => handleInputChange("vendor", e.target.value)}
                                            className={`pl-10 ${errors.vendor ? "border-red-500" : ""}`}
                                        />
                                    </div>
                                    {errors.vendor && <p className="text-xs text-red-500 mt-1">{errors.vendor}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="hostel">
                                        Hostel <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={formData.hostel} onValueChange={(value) => handleInputChange("hostel", value)}>
                                        <SelectTrigger className={`mt-1 ${errors.hostel ? "border-red-500" : ""}`}>
                                            <SelectValue placeholder="Select hostel" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="H001">GreenView Hostel 1</SelectItem>
                                            <SelectItem value="H002">GreenView Hostel 2</SelectItem>
                                            <SelectItem value="H003">GreenView Hostel 3</SelectItem>
                                            <SelectItem value="ALL">All Hostels (Shared Expense)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.hostel && <p className="text-xs text-red-500 mt-1">{errors.hostel}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="description">
                                        Description
                                    </Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Enter detailed description of the expense..."
                                        value={formData.description}
                                        onChange={(e) => handleInputChange("description", e.target.value)}
                                        rows={3}
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Date & Payment Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                Date & Payment Information
                            </CardTitle>
                            <CardDescription>Payment dates and method details</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="date">
                                        Expense Date <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => handleInputChange("date", e.target.value)}
                                        className={`mt-1 ${errors.date ? "border-red-500" : ""}`}
                                    />
                                    {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="dueDate">
                                        Due Date <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="dueDate"
                                        type="date"
                                        value={formData.dueDate}
                                        onChange={(e) => handleInputChange("dueDate", e.target.value)}
                                        className={`mt-1 ${errors.dueDate ? "border-red-500" : ""}`}
                                    />
                                    {errors.dueDate && <p className="text-xs text-red-500 mt-1">{errors.dueDate}</p>}
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
                                            <SelectItem value="Overdue">Overdue</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="paymentMethod">
                                        Payment Method
                                    </Label>
                                    <Select value={formData.paymentMethod} onValueChange={(value) => handleInputChange("paymentMethod", value)}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Select payment method" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Cash">Cash</SelectItem>
                                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                            <SelectItem value="Cheque">Cheque</SelectItem>
                                            <SelectItem value="Online">Online Payment</SelectItem>
                                            <SelectItem value="Card">Credit/Debit Card</SelectItem>
                                        </SelectContent>
                                    </Select>
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
                                    <p className="text-xs text-gray-500 mt-1">Optional: Enter if payment is made</p>
                                </div>

                                <div>
                                    <Label htmlFor="receiptNumber">
                                        Receipt Number
                                    </Label>
                                    <Input
                                        id="receiptNumber"
                                        placeholder="e.g., RCP-EXP-001"
                                        value={formData.receiptNumber}
                                        onChange={(e) => handleInputChange("receiptNumber", e.target.value)}
                                        className="mt-1"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">System generated or custom</p>
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
                                    <Label htmlFor="notes">
                                        Notes & Remarks
                                    </Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Add any additional notes, remarks, or special instructions..."
                                        value={formData.notes}
                                        onChange={(e) => handleInputChange("notes", e.target.value)}
                                        rows={4}
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
                                        Upload bills, invoices, or receipt images
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
                                    Save Expense
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </div>
    );
};

export default AddExpensePage;
