"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Package, Plus, Minus, Trash2, AlertTriangle, Calendar,
    Layers, RefreshCw, AlertCircle, Sparkles, CheckCircle2, ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import useAuthStore from "@/hooks/Authstate";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const WardenMessStock = () => {
    const { user } = useAuthStore();
    const router = useRouter();
    const queryClient = useQueryClient();

    const { data: stockData, isLoading, refetch } = useQuery({
        queryKey: ["messStock", user?.hostelId],
        queryFn: async () => {
            const res = await fetch("/api/warden/mess/stock");
            if (!res.ok) throw new Error("Failed to load stock");
            const data = await res.json();
            return data.inventory || [];
        },
        enabled: !!user?.hostelId
    });

    // States for adding new item
    const [newItem, setNewItem] = useState({
        itemName: "",
        quantity: "",
        unit: "kg",
        minThreshold: "10",
        expiryDate: ""
    });
    const [isAddingItem, setIsAddingItem] = useState(false);

    // States for quick adjusting existing items
    const [adjustState, setAdjustState] = useState({
        itemId: null,
        amount: "",
        action: "ADD" // "ADD" or "CONSUME"
    });

    const addMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await fetch("/api/warden/mess/stock", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error("Failed to add stock item");
            return res.json();
        },
        onSuccess: () => {
            toast.success("New stock item added!");
            setNewItem({ itemName: "", quantity: "", unit: "kg", minThreshold: "10", expiryDate: "" });
            setIsAddingItem(false);
            queryClient.invalidateQueries({ queryKey: ["messStock"] });
        },
        onError: (err) => {
            toast.error(err.message || "Failed to add stock item");
        }
    });

    const adjustMutation = useMutation({
        mutationFn: async ({ itemId, quantity, action }) => {
            const res = await fetch("/api/warden/mess/stock", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itemId, quantity: parseFloat(quantity), action })
            });
            if (!res.ok) throw new Error("Failed to update stock");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Stock level updated!");
            setAdjustState({ itemId: null, amount: "", action: "ADD" });
            queryClient.invalidateQueries({ queryKey: ["messStock"] });
        },
        onError: (err) => {
            toast.error(err.message || "Failed to update stock");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (itemId) => {
            const res = await fetch(`/api/warden/mess/stock?itemId=${itemId}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Failed to delete item");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Item deleted from inventory.");
            queryClient.invalidateQueries({ queryKey: ["messStock"] });
        },
        onError: (err) => {
            toast.error(err.message || "Failed to delete item");
        }
    });

    const handleCreateItemSubmit = (e) => {
        e.preventDefault();
        if (!newItem.itemName.trim() || !newItem.quantity || !newItem.unit) {
            toast.error("Please fill in item name, quantity, and unit.");
            return;
        }
        addMutation.mutate({
            itemName: newItem.itemName,
            quantity: parseFloat(newItem.quantity),
            unit: newItem.unit,
            minThreshold: parseFloat(newItem.minThreshold || "0"),
            expiryDate: newItem.expiryDate || null
        });
    };

    const handleAdjustSubmit = (e) => {
        e.preventDefault();
        if (!adjustState.amount || parseFloat(adjustState.amount) <= 0) {
            toast.error("Enter a valid adjustment amount.");
            return;
        }
        adjustMutation.mutate({
            itemId: adjustState.itemId,
            quantity: parseFloat(adjustState.amount),
            action: adjustState.action
        });
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white dark:bg-card font-sans">
                <div className="flex flex-col items-center gap-6">
                    <div className="h-10 w-10 border-[3px] border-gray-100 dark:border-border border-t-black rounded-full animate-spin" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted-foreground italic">Loading Stock Ledger</p>
                </div>
            </div>
        );
    }

    const lowStockItems = stockData?.filter(item => item.quantity <= item.minThreshold) || [];

    const getExpiryBadge = (expiryStr) => {
        if (!expiryStr) return <Badge className="bg-gray-100 text-gray-400 border-none text-[8px] font-bold uppercase">No Expiry</Badge>;
        const exp = new Date(expiryStr);
        const today = new Date();
        const diff = exp - today;
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

        if (days <= 0) {
            return <Badge className="bg-rose-50 text-rose-600 border-none text-[8px] font-bold uppercase">Expired</Badge>;
        } else if (days <= 10) {
            return <Badge className="bg-amber-50 text-amber-600 border-none text-[8px] font-bold uppercase">Expires in {days}d</Badge>;
        } else {
            return <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] font-bold uppercase">Expires in {days}d</Badge>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-muted/10 pb-20 font-sans tracking-tight text-gray-900 dark:text-foreground">
            
            {/* Header */}
            <div className="bg-white dark:bg-card border-b sticky top-0 z-50 h-16 shadow-sm">
                <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl h-9 w-9">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="h-5 w-px bg-gray-100" />
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center">
                                <Package className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                                <h1 className="text-sm md:text-base font-bold text-gray-800 dark:text-foreground tracking-tight uppercase">Mess Inventory Ledger</h1>
                                <p className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">{user?.Hostel?.name}</p>
                            </div>
                        </div>
                    </div>
                    
                    <Button 
                        onClick={() => setIsAddingItem(!isAddingItem)}
                        className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider"
                    >
                        <Plus className="h-4 w-4 mr-1.5" /> Add New Item
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 space-y-6">

                {/* Low Stock Alerts */}
                {lowStockItems.length > 0 && (
                    <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
                        <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                            <h3 className="text-xs font-bold text-rose-800 uppercase tracking-wide">Critical Stock Warning ({lowStockItems.length})</h3>
                            <p className="text-[10px] text-rose-600 mt-0.5">The following rations have fallen below safety thresholds and need restocking:</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {lowStockItems.map(item => (
                                    <Badge key={item.id} className="bg-white border border-rose-200 text-rose-600 text-[8px] font-bold uppercase px-2 py-0.5">
                                        {item.itemName}: {item.quantity} {item.unit} (Threshold: {item.minThreshold})
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    
                    {/* Left & Center: Inventory ledger */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="rounded-[2rem] border-gray-100 dark:border-border shadow-sm overflow-hidden">
                            <CardHeader className="bg-gray-50 dark:bg-background border-b border-gray-50 py-4 px-6 flex flex-row items-center justify-between">
                                <CardTitle className="text-xs font-bold text-gray-900 dark:text-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Layers className="h-4 w-4 text-gray-500" /> Stock items ledger
                                </CardTitle>
                                <Button variant="ghost" size="icon" onClick={() => refetch()} className="h-8 w-8 rounded-lg">
                                    <RefreshCw className="h-3.5 w-3.5 text-gray-400" />
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                {stockData && stockData.length > 0 ? (
                                    <div className="divide-y divide-gray-50 dark:divide-border/20">
                                        {stockData.map((item) => {
                                            const isLow = item.quantity <= item.minThreshold;
                                            const isAdjustingThis = adjustState.itemId === item.id;
                                            
                                            // safety percentage for visual bar
                                            const percent = Math.min(100, (item.quantity / Math.max(item.minThreshold * 2, 1)) * 100);

                                            return (
                                                <div key={item.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-gray-50/50 transition-colors">
                                                    
                                                    {/* Primary details */}
                                                    <div className="flex-1 space-y-3">
                                                        <div className="flex items-center gap-3">
                                                            <h3 className="text-sm font-bold text-gray-900 dark:text-foreground">{item.itemName}</h3>
                                                            {isLow ? (
                                                                <Badge className="bg-rose-50 text-rose-500 border-none text-[8px] font-bold uppercase">Low Stock</Badge>
                                                            ) : (
                                                                <Badge className="bg-emerald-50 text-emerald-500 border-none text-[8px] font-bold uppercase">Optimal</Badge>
                                                            )}
                                                            {getExpiryBadge(item.expiryDate)}
                                                        </div>
                                                        
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                                                <span>Current stock: {item.quantity} {item.unit}</span>
                                                                <span>Min Threshold: {item.minThreshold} {item.unit}</span>
                                                            </div>
                                                            <div className="h-1.5 w-full bg-gray-100 dark:bg-muted/10 rounded-full overflow-hidden">
                                                                <div 
                                                                    className={`h-full rounded-full transition-all duration-500 ${isLow ? 'bg-rose-500' : 'bg-indigo-500'}`}
                                                                    style={{ width: `${percent}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Quick Adjust controls */}
                                                    <div className="flex items-center gap-3 self-end md:self-center">
                                                        {isAdjustingThis ? (
                                                            <form onSubmit={handleAdjustSubmit} className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border">
                                                                <span className="text-[10px] font-black text-gray-500 uppercase">{adjustState.action}</span>
                                                                <Input 
                                                                    type="number" 
                                                                    step="any"
                                                                    placeholder="Qty"
                                                                    value={adjustState.amount}
                                                                    onChange={(e) => setAdjustState({ ...adjustState, amount: e.target.value })}
                                                                    className="h-8 w-16 text-xs"
                                                                />
                                                                <Button type="submit" disabled={adjustMutation.isPending} className="h-8 px-3 text-[10px] bg-slate-900 text-white rounded-lg">
                                                                    Go
                                                                </Button>
                                                                <Button 
                                                                    type="button" 
                                                                    onClick={() => setAdjustState({ itemId: null, amount: "", action: "ADD" })}
                                                                    className="h-8 px-2 text-[10px] bg-white border text-gray-500 rounded-lg"
                                                                >
                                                                    X
                                                                </Button>
                                                            </form>
                                                        ) : (
                                                            <>
                                                                <Button 
                                                                    size="icon" 
                                                                    onClick={() => setAdjustState({ itemId: item.id, amount: "", action: "ADD" })}
                                                                    className="h-9 w-9 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100/50 rounded-xl"
                                                                >
                                                                    <Plus className="h-4 w-4" />
                                                                </Button>
                                                                <Button 
                                                                    size="icon" 
                                                                    onClick={() => setAdjustState({ itemId: item.id, amount: "", action: "CONSUME" })}
                                                                    className="h-9 w-9 bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-100/50 rounded-xl"
                                                                >
                                                                    <Minus className="h-4 w-4" />
                                                                </Button>
                                                                <Button 
                                                                    size="icon" 
                                                                    onClick={() => {
                                                                        if (confirm("Delete this stock item?")) {
                                                                            deleteMutation.mutate(item.id);
                                                                        }
                                                                    }}
                                                                    className="h-9 w-9 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100/50 rounded-xl"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>

                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-16 text-gray-300">
                                        <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest">No stock items in ledger</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right side: Add New Item card (if active) */}
                    <div className="lg:col-span-1 space-y-6">
                        
                        {isAddingItem && (
                            <Card className="rounded-[2rem] border-gray-100 dark:border-border shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                                <CardHeader className="bg-indigo-50 dark:bg-card/10 border-b py-4 px-6">
                                    <CardTitle className="text-xs font-bold text-gray-900 dark:text-foreground uppercase tracking-widest flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-indigo-500" /> Add New Ration Item
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <form onSubmit={handleCreateItemSubmit} className="space-y-4">
                                        <div className="space-y-1">
                                            <Label className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Item Name</Label>
                                            <Input 
                                                value={newItem.itemName}
                                                onChange={e => setNewItem({ ...newItem, itemName: e.target.value })}
                                                placeholder="e.g., Flour, Rice, Sugar..."
                                                className="h-10 rounded-xl"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <Label className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Quantity</Label>
                                                <Input 
                                                    type="number"
                                                    step="any"
                                                    value={newItem.quantity}
                                                    onChange={e => setNewItem({ ...newItem, quantity: e.target.value })}
                                                    placeholder="0"
                                                    className="h-10 rounded-xl"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Unit</Label>
                                                <select
                                                    value={newItem.unit}
                                                    onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                                                    className="w-full h-10 border border-gray-100 dark:border-border rounded-xl bg-gray-50 dark:bg-muted/10 px-3 text-xs font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                                                >
                                                    <option value="kg">kg</option>
                                                    <option value="liters">liters</option>
                                                    <option value="units">units</option>
                                                    <option value="bags">bags</option>
                                                    <option value="boxes">boxes</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Min Threshold Alert</Label>
                                            <Input 
                                                type="number"
                                                step="any"
                                                value={newItem.minThreshold}
                                                onChange={e => setNewItem({ ...newItem, minThreshold: e.target.value })}
                                                placeholder="10"
                                                className="h-10 rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Expiry Date (Optional)</Label>
                                            <Input 
                                                type="date"
                                                value={newItem.expiryDate}
                                                onChange={e => setNewItem({ ...newItem, expiryDate: e.target.value })}
                                                className="h-10 rounded-xl"
                                            />
                                        </div>
                                        
                                        <Button
                                            type="submit"
                                            disabled={addMutation.isPending}
                                            className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
                                        >
                                            {addMutation.isPending ? "Adding..." : "Add to stock"}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        )}
                        
                        {/* Summary Widget */}
                        <Card className="rounded-[2rem] border-gray-100 dark:border-border shadow-sm overflow-hidden bg-gray-900 text-white p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">Inventory Status</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400">Total Items:</span>
                                    <span className="font-bold">{stockData?.length || 0}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400">Low Stock Rations:</span>
                                    <span className="font-bold text-rose-400">{lowStockItems.length}</span>
                                </div>
                            </div>
                        </Card>

                    </div>

                </div>

            </main>
        </div>
    );
};

export default WardenMessStock;
