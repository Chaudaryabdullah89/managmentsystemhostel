"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtVerify } from "jose";
import Cookies from "js-cookie";
import prisma from "@/lib/prisma"; // make sure prisma client can be used in server-side only

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loggedIn, setLoggedIn] = useState(false);

    async function verifyToken(token) {
        try {
            const secret = new TextEncoder().encode(
                process.env.NEXT_PUBLIC_JWT_SECRET || "your-secret-key-change-in-production"
            );

            const { payload } = await jwtVerify(token, secret);

            const res = await fetch(`/api/auth/user/${payload.userId}`);
            const userData = await res.json();
            setUser(userData);
            setPermissions([]);
            setLoggedIn(true);
        } catch (err) {
            setUser(null);
            setPermissions([]);
            setLoggedIn(false);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        const token = Cookies.get("token"); // read cookie on mount

        if (token) {
            verifyToken(token);
        } else {
            setUser(null);
            setPermissions([]);
            setLoggedIn(false);
            setIsLoading(false);
        }
    }, []);

    return (
        <AuthContext.Provider value={{ user, permissions, loggedIn, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook to consume the context
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
}