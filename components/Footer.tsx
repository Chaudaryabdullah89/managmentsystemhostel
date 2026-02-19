import React from "react";
import Link from "next/link";
import { Heart, Mail, Phone, MapPin } from "lucide-react";

export const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white border-t mt-auto">
            <div className="px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* About Section */}
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-3">GreenView Hostels</h3>
                        <p className="text-sm text-gray-600">
                            Professional hostel management system providing the best accommodation experience.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Quick Links</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/admin/dashboard" className="text-gray-600 hover:text-primary">
                                    Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link href="/admin/hostels" className="text-gray-600 hover:text-primary">
                                    Hostels
                                </Link>
                            </li>
                            <li>
                                <Link href="/admin/payments" className="text-gray-600 hover:text-primary">
                                    Payments
                                </Link>
                            </li>
                            <li>
                                <Link href="/admin/reports" className="text-gray-600 hover:text-primary">
                                    Reports
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Support</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/admin/profile" className="text-gray-600 hover:text-primary">
                                    My Profile
                                </Link>
                            </li>
                            <li>
                                <Link href="/admin/complaints" className="text-gray-600 hover:text-primary">
                                    Complaints
                                </Link>
                            </li>
                            <li>
                                <Link href="/admin/roles" className="text-gray-600 hover:text-primary">
                                    User Management
                                </Link>
                            </li>
                            <li>
                                <a href="#" className="text-gray-600 hover:text-primary">
                                    Help Center
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Contact Us</h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                <span>info@greenview.com</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                <span>+92 321 1234567</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>Lahore, Pakistan</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-gray-600">
                        &copy; {currentYear} GreenView Hostels. All rights reserved.
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                        Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> by GreenView Team
                    </p>
                </div>
            </div>
        </footer>
    );
};
