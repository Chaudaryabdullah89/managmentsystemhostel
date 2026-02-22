import React from "react";
import Link from "next/link";
import { Heart, Mail, Phone, MapPin } from "lucide-react";

export const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white  mt-auto">
            <div className="px-6 py-8">

                {/* Bottom Bar */}
                <div className="border-t mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-gray-600">
                        &copy; {currentYear} Hostel Managment System. All rights reserved.
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                        Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> by Abdullah
                    </p>
                </div>
            </div>
        </footer>
    );
};
