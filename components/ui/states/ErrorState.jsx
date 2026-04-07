import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const ErrorState = ({
    title = "Something went wrong",
    description = "Please try again in a moment.",
    onRetry,
    retryLabel = "Retry",
}) => {
    return (
        <div className="bg-white border border-rose-100 rounded-3xl p-12 text-center shadow-sm">
            <div className="h-14 w-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="h-7 w-7 text-rose-500" />
            </div>
            <h3 className="text-base font-bold text-gray-900 uppercase tracking-tight">{title}</h3>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1 max-w-[340px] mx-auto leading-relaxed">
                {description}
            </p>
            {onRetry && (
                <div className="mt-6">
                    <Button
                        onClick={onRetry}
                        className="h-10 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] uppercase tracking-wider"
                    >
                        {retryLabel}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default ErrorState;
