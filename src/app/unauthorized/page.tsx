"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3">
              <ShieldAlert className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to access this page
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This page requires specific user roles that your account doesn't have.
            Please contact your administrator if you believe this is an error.
          </p>
        </CardContent>
        
        <CardFooter className="flex justify-center gap-4">
          <Button asChild variant="default">
            <Link href="/">Go to Dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">Sign Out</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

