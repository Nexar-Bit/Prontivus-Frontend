"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  source: string;
  userId?: string;
  details?: string;
}

const LOG_LEVELS = [
  { value: 'all', label: 'All Levels' },
  { value: 'error', label: 'Errors' },
  { value: 'warning', label: 'Warnings' },
  { value: 'info', label: 'Info' },
  { value: 'debug', label: 'Debug' },
];

const LOG_SOURCES = [
  { value: 'all', label: 'All Sources' },
  { value: 'auth', label: 'Authentication' },
  { value: 'api', label: 'API' },
  { value: 'database', label: 'Database' },
  { value: 'system', label: 'System' },
  { value: 'security', label: 'Security' },
];

export default function AdminLogsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    
    if (isAuthenticated && user?.role !== "admin") {
      router.push("/unauthorized");
      return;
    }
    
    if (isAuthenticated) {
      loadLogs();
    }
  }, [isAuthenticated, isLoading, user, router]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await adminApi.getLogs();
      // setLogs(response);
      
      // Mock data for now
      const mockLogs: LogEntry[] = [
        {
          id: "1",
          timestamp: new Date().toISOString(),
          level: "info",
          message: "User admin logged in successfully",
          source: "auth",
          userId: "1",
          details: "Login from IP: 192.168.1.100"
        },
        {
          id: "2",
          timestamp: new Date(Date.now() - 300000).toISOString(),
          level: "warning",
          message: "High memory usage detected",
          source: "system",
          details: "Memory usage: 85%"
        },
        {
          id: "3",
          timestamp: new Date(Date.now() - 600000).toISOString(),
          level: "error",
          message: "Database connection failed",
          source: "database",
          details: "Connection timeout after 30 seconds"
        },
        {
          id: "4",
          timestamp: new Date(Date.now() - 900000).toISOString(),
          level: "info",
          message: "Backup completed successfully",
          source: "system",
          details: "Backup size: 2.5GB"
        },
        {
          id: "5",
          timestamp: new Date(Date.now() - 1200000).toISOString(),
          level: "debug",
          message: "API request processed",
          source: "api",
          details: "GET /api/patients - 200ms"
        }
      ];
      
      setLogs(mockLogs);
    } catch (error) {
      console.error("Failed to load logs:", error);
      toast.error("Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'debug':
        return <Clock className="h-4 w-4 text-gray-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
        return 'default';
      case 'debug':
        return 'outline';
      default:
        return 'default';
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.source.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    const matchesSource = sourceFilter === 'all' || log.source === sourceFilter;
    
    return matchesSearch && matchesLevel && matchesSource;
  });

  const exportLogs = () => {
    const csvContent = [
      'Timestamp,Level,Source,Message,Details',
      ...filteredLogs.map(log => 
        `"${log.timestamp}","${log.level}","${log.source}","${log.message}","${log.details || ''}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            System Logs
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor system activity and troubleshoot issues
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadLogs}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={exportLogs}
            disabled={filteredLogs.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                {LOG_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                {LOG_SOURCES.map((source) => (
                  <SelectItem key={source.value} value={source.value}>
                    {source.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Log Entries ({filteredLogs.length})</CardTitle>
          <CardDescription>
            Recent system activity and events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setSelectedLog(log)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getLevelIcon(log.level)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant={getLevelColor(log.level) as any}>
                          {log.level.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {log.source}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{log.message}</p>
                      {log.userId && (
                        <p className="text-xs text-muted-foreground">
                          User ID: {log.userId}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filteredLogs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No logs found matching your criteria
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Log Detail Dialog */}
      {selectedLog && (
        <Card>
          <CardHeader>
            <CardTitle>Log Details</CardTitle>
            <CardDescription>
              Detailed information for log entry {selectedLog.id}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Timestamp</Label>
                <p className="text-sm">{new Date(selectedLog.timestamp).toLocaleString()}</p>
              </div>
              <div>
                <Label>Level</Label>
                <div className="flex items-center space-x-2">
                  {getLevelIcon(selectedLog.level)}
                  <Badge variant={getLevelColor(selectedLog.level) as any}>
                    {selectedLog.level.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div>
                <Label>Source</Label>
                <p className="text-sm">{selectedLog.source}</p>
              </div>
              {selectedLog.userId && (
                <div>
                  <Label>User ID</Label>
                  <p className="text-sm">{selectedLog.userId}</p>
                </div>
              )}
            </div>
            <div>
              <Label>Message</Label>
              <p className="text-sm">{selectedLog.message}</p>
            </div>
            {selectedLog.details && (
              <div>
                <Label>Details</Label>
                <Textarea
                  value={selectedLog.details}
                  readOnly
                  rows={4}
                  className="mt-1"
                />
              </div>
            )}
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
