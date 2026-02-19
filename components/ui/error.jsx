import React from "react";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { RefreshCw, X } from "lucide-react";

const Error = function () {
    return (
        <div className="col-span-full">
            <Card className="border-red-200 bg-red-50">
                <CardHeader>
                    <CardTitle className="text-red-700 flex items-center gap-2">
                        <X className="h-5 w-5" />
                        Error Loading Hostels
                    </CardTitle>
                    <CardDescription className="text-red-600">
                        There was a problem fetching the hostel data. Please check your connection and try again.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        variant="outline"
                        className="border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800"
                        onClick={() => window.location.reload()}
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Retry
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
export default Error
