"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  BarChart3, 
  Download, 
  Calendar as CalendarIcon, 
  Filter, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  FileText,
  PieChart,
  LineChart,
  Eye,
  Printer,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReportData {
  id: string;
  title: string;
  type: 'revenue' | 'expenses' | 'profit' | 'patients' | 'appointments' | 'procedures';
  period: string;
  generatedAt: string;
  status: 'ready' | 'generating' | 'error';
  fileUrl?: string;
  summary: {
    total: number;
    change: number;
    changeType: 'increase' | 'decrease';
    period: string;
  };
}

interface ReportFilters {
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  reportType: string;
  clinicId?: string;
  doctorId?: string;
  status: string;
}

const REPORT_TYPES = [
  { value: 'all', label: 'All Reports' },
  { value: 'revenue', label: 'Revenue Reports' },
  { value: 'expenses', label: 'Expense Reports' },
  { value: 'profit', label: 'Profit & Loss' },
  { value: 'patients', label: 'Patient Reports' },
  { value: 'appointments', label: 'Appointment Reports' },
  { value: 'procedures', label: 'Procedure Reports' },
];

const QUICK_PERIODS = [
  { label: 'Today', days: 0 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'This year', days: 365 },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'ready', label: 'Ready' },
  { value: 'generating', label: 'Generating' },
  { value: 'error', label: 'Error' },
];

export default function FinancialReportsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: {
      from: new Date(new Date().setDate(new Date().getDate() - 30)),
      to: new Date(),
    },
    reportType: 'all',
    status: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    
    if (isAuthenticated && !['admin', 'secretary'].includes(user?.role || '')) {
      router.push("/unauthorized");
      return;
    }
    
    if (isAuthenticated) {
      loadReports();
    }
  }, [isAuthenticated, isLoading, user, router]);

  const loadReports = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await financialApi.getReports(filters);
      // setReports(response);
      
      // Mock data for now
      const mockReports: ReportData[] = [
        {
          id: "1",
          title: "Monthly Revenue Report",
          type: "revenue",
          period: "December 2024",
          generatedAt: new Date().toISOString(),
          status: "ready",
          fileUrl: "/reports/revenue-dec-2024.pdf",
          summary: {
            total: 125000,
            change: 8.5,
            changeType: "increase",
            period: "vs November 2024"
          }
        },
        {
          id: "2",
          title: "Patient Demographics Report",
          type: "patients",
          period: "Q4 2024",
          generatedAt: new Date(Date.now() - 3600000).toISOString(),
          status: "ready",
          fileUrl: "/reports/patients-q4-2024.pdf",
          summary: {
            total: 1250,
            change: 12.3,
            changeType: "increase",
            period: "vs Q3 2024"
          }
        },
        {
          id: "3",
          title: "Appointment Analysis",
          type: "appointments",
          period: "December 2024",
          generatedAt: new Date(Date.now() - 7200000).toISOString(),
          status: "ready",
          fileUrl: "/reports/appointments-dec-2024.pdf",
          summary: {
            total: 450,
            change: -2.1,
            changeType: "decrease",
            period: "vs November 2024"
          }
        },
        {
          id: "4",
          title: "Expense Breakdown",
          type: "expenses",
          period: "December 2024",
          generatedAt: new Date(Date.now() - 10800000).toISOString(),
          status: "generating",
          summary: {
            total: 85000,
            change: 5.2,
            changeType: "increase",
            period: "vs November 2024"
          }
        },
        {
          id: "5",
          title: "Profit & Loss Statement",
          type: "profit",
          period: "December 2024",
          generatedAt: new Date(Date.now() - 14400000).toISOString(),
          status: "ready",
          fileUrl: "/reports/pnl-dec-2024.pdf",
          summary: {
            total: 40000,
            change: 15.8,
            changeType: "increase",
            period: "vs November 2024"
          }
        },
        {
          id: "6",
          title: "Procedure Performance",
          type: "procedures",
          period: "December 2024",
          generatedAt: new Date(Date.now() - 18000000).toISOString(),
          status: "error",
          summary: {
            total: 0,
            change: 0,
            changeType: "increase",
            period: "vs November 2024"
          }
        }
      ];
      
      setReports(mockReports);
    } catch (error) {
      console.error("Failed to load reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (type: string) => {
    try {
      setGenerating(true);
      // TODO: Replace with actual API call
      // const response = await financialApi.generateReport(type, filters);
      
      // Mock generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Report generated successfully");
      loadReports();
    } catch (error) {
      console.error("Failed to generate report:", error);
      toast.error("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = async (reportId: string) => {
    try {
      // TODO: Replace with actual API call
      // await financialApi.downloadReport(reportId);
      
      // Mock download
      toast.success("Report download started");
    } catch (error) {
      console.error("Failed to download report:", error);
      toast.error("Failed to download report");
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'revenue':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'expenses':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'profit':
        return <DollarSign className="h-4 w-4 text-blue-500" />;
      case 'patients':
        return <Users className="h-4 w-4 text-purple-500" />;
      case 'appointments':
        return <CalendarIcon className="h-4 w-4 text-orange-500" />;
      case 'procedures':
        return <FileText className="h-4 w-4 text-indigo-500" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'default';
      case 'generating':
        return 'secondary';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'generating':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatNumber = (number: number) => {
    return new Intl.NumberFormat('pt-BR').format(number);
  };

  const filteredReports = reports.filter(report => {
    const matchesType = filters.reportType === 'all' || report.type === filters.reportType;
    const matchesStatus = filters.status === 'all' || report.status === filters.status;
    return matchesType && matchesStatus;
  });

  const quickPeriodSelect = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    setFilters(prev => ({
      ...prev,
      dateRange: { from, to }
    }));
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
            <BarChart3 className="h-8 w-8" />
            Financial Reports
          </h1>
          <p className="text-muted-foreground mt-2">
            Generate and manage financial reports and analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button
            variant="outline"
            onClick={loadReports}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Generate common reports quickly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={() => generateReport('revenue')}
              disabled={generating}
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              <TrendingUp className="h-6 w-6" />
              <span className="text-sm">Revenue Report</span>
            </Button>
            <Button
              onClick={() => generateReport('profit')}
              disabled={generating}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              <DollarSign className="h-6 w-6" />
              <span className="text-sm">Profit & Loss</span>
            </Button>
            <Button
              onClick={() => generateReport('patients')}
              disabled={generating}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              <Users className="h-6 w-6" />
              <span className="text-sm">Patient Report</span>
            </Button>
            <Button
              onClick={() => generateReport('appointments')}
              disabled={generating}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              <CalendarIcon className="h-6 w-6" />
              <span className="text-sm">Appointments</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Report Filters</CardTitle>
            <CardDescription>
              Filter reports by date range, type, and status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Date Range</Label>
                <div className="flex space-x-2 mt-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex-1">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {filters.dateRange.from ? format(filters.dateRange.from, "dd/MM/yyyy") : "From"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange.from}
                        onSelect={(date) => setFilters(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, from: date }
                        }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex-1">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {filters.dateRange.to ? format(filters.dateRange.to, "dd/MM/yyyy") : "To"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange.to}
                        onSelect={(date) => setFilters(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, to: date }
                        }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {QUICK_PERIODS.map((period) => (
                    <Button
                      key={period.label}
                      variant="outline"
                      size="sm"
                      onClick={() => quickPeriodSelect(period.days)}
                    >
                      {period.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Report Type</Label>
                <Select
                  value={filters.reportType}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, reportType: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Reports ({filteredReports.length})</CardTitle>
          <CardDescription>
            View and download your generated reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getTypeIcon(report.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-sm font-medium">{report.title}</h3>
                        <Badge variant={getStatusColor(report.status) as any}>
                          {getStatusIcon(report.status)}
                          <span className="ml-1">{report.status}</span>
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Period: {report.period}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>Generated: {format(new Date(report.generatedAt), "dd/MM/yyyy HH:mm")}</span>
                        {report.summary.total > 0 && (
                          <span>
                            Total: {report.type === 'revenue' || report.type === 'expenses' || report.type === 'profit' 
                              ? formatCurrency(report.summary.total)
                              : formatNumber(report.summary.total)
                            }
                          </span>
                        )}
                        {report.summary.change !== 0 && (
                          <span className={`flex items-center ${
                            report.summary.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {report.summary.changeType === 'increase' ? '+' : ''}{report.summary.change}% {report.summary.period}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {report.status === 'ready' && report.fileUrl && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(report.fileUrl, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadReport(report.id)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </>
                    )}
                    {report.status === 'generating' && (
                      <Button variant="outline" size="sm" disabled>
                        <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                        Generating...
                      </Button>
                    )}
                    {report.status === 'error' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateReport(report.type)}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filteredReports.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No reports found matching your criteria</p>
                <p className="text-sm">Generate a new report using the quick actions above</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
