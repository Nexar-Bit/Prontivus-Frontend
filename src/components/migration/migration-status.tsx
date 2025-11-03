"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ArrowRight,
} from "lucide-react";
import {
  componentMigrations,
  getMigrationSummary,
  getMigrationsByPriority,
  MigrationStatus,
} from "@/lib/migration-tracker";

export function MigrationStatusDashboard() {
  const summary = getMigrationSummary();
  const highPriority = getMigrationsByPriority("high");
  const mediumPriority = getMigrationsByPriority("medium");
  const lowPriority = getMigrationsByPriority("low");

  const getStatusIcon = (status: MigrationStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "in-progress":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "blocked":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: MigrationStatus) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-300";
      case "in-progress":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "blocked":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overall Progress</CardDescription>
            <CardTitle className="text-2xl">{summary.progress}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={summary.progress} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {summary.completed}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Progress</CardDescription>
            <CardTitle className="text-2xl text-blue-600">
              {summary.inProgress}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-2xl text-gray-600">
              {summary.pending}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Blocked</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">
              {summary.blocked}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* High Priority Migrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-red-600" />
            High Priority Migrations
          </CardTitle>
          <CardDescription>
            Core components and critical user flows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {highPriority.map((migration) => (
              <div
                key={migration.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  {getStatusIcon(migration.status)}
                  <div className="flex-1">
                    <div className="font-medium">{migration.name}</div>
                    <div className="text-sm text-gray-500">{migration.path}</div>
                    {migration.notes && (
                      <div className="text-xs text-gray-400 mt-1">
                        {migration.notes}
                      </div>
                    )}
                  </div>
                </div>
                <Badge className={getStatusColor(migration.status)}>
                  {migration.status.replace("-", " ")}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Medium Priority */}
      <Card>
        <CardHeader>
          <CardTitle>Medium Priority Migrations</CardTitle>
          <CardDescription>
            Frequently used features and modules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {mediumPriority.map((migration) => (
              <div
                key={migration.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  {getStatusIcon(migration.status)}
                  <div className="flex-1">
                    <div className="font-medium">{migration.name}</div>
                    <div className="text-sm text-gray-500">{migration.path}</div>
                  </div>
                </div>
                <Badge className={getStatusColor(migration.status)}>
                  {migration.status.replace("-", " ")}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Low Priority */}
      <Card>
        <CardHeader>
          <CardTitle>Low Priority Migrations</CardTitle>
          <CardDescription>
            Administrative and less frequently used features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {lowPriority.map((migration) => (
              <div
                key={migration.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  {getStatusIcon(migration.status)}
                  <div className="flex-1">
                    <div className="font-medium">{migration.name}</div>
                    <div className="text-sm text-gray-500">{migration.path}</div>
                  </div>
                </div>
                <Badge className={getStatusColor(migration.status)}>
                  {migration.status.replace("-", " ")}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

