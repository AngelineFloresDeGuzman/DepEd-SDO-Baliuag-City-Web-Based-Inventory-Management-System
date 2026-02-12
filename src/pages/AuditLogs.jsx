import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/layout/Header';
import { auditLogs, schools } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Calendar,
  Download,
  Eye,
  FileText,
  Plus,
  Minus,
  ArrowLeftRight,
  Trash2,
  Edit,
} from 'lucide-react';
import { TablePagination } from '@/components/ui/table-pagination';

const PAGE_SIZE = 10;

const AuditLogs = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'sdo_admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);

  // Redirect if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-display font-bold text-foreground mb-2">
            Access Restricted
          </h2>
          <p className="text-muted-foreground">
            Audit logs are only accessible to SDO Administrators.
          </p>
        </div>
      </div>
    );
  }

  const [logPage, setLogPage] = useState(1);

  // Filter logs
  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSchool = schoolFilter === 'all' || log.schoolId === schoolFilter;
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    return matchesSearch && matchesSchool && matchesAction;
  });

  const logTotalPages = Math.ceil(filteredLogs.length / PAGE_SIZE) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (logPage - 1) * PAGE_SIZE;
    return filteredLogs.slice(start, start + PAGE_SIZE);
  }, [filteredLogs, logPage]);
  useEffect(() => setLogPage(1), [filteredLogs.length, searchQuery, schoolFilter, actionFilter]);

  const getActionIcon = (action) => {
    if (action.includes('Delivery')) return <Plus className="w-4 h-4 text-success" />;
    if (action.includes('Issued')) return <Minus className="w-4 h-4 text-info" />;
    if (action.includes('Disposed')) return (
      <Trash2 className="w-4 h-4 text-destructive" />
    );
    if (action.includes('Transfer')) return (
      <ArrowLeftRight className="w-4 h-4 text-secondary" />
    );
    if (action.includes('Updated')) return <Edit className="w-4 h-4 text-warning" />;
    return <FileText className="w-4 h-4 text-muted-foreground" />;
  };

  const getActionBadge = (action) => {
    if (action.includes('Delivery'))
      return <Badge className="bg-success/20 text-success border-0">{action}</Badge>;
    if (action.includes('Issued'))
      return <Badge className="bg-info/20 text-info border-0">{action}</Badge>;
    if (action.includes('Disposed'))
      return (
        <Badge className="bg-destructive/20 text-destructive border-0">
          {action}
        </Badge>
      );
    if (action.includes('Transfer'))
      return (
        <Badge className="bg-secondary/20 text-secondary border-0">{action}</Badge>
      );
    return <Badge variant="outline">{action}</Badge>;
  };

  const actionTypes = [
    'Delivery Added',
    'Items Issued',
    'Items Disposed',
    'Transfer Requested',
    'Transfer Received',
    'Transfer Approved',
    'Transfer Rejected',
    'Inventory Updated',
  ];

  return (
    <div className="min-h-screen">
      <Header title="Audit Logs" subtitle="Complete history of all inventory actions" />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={schoolFilter} onValueChange={setSchoolFilter}>
            <SelectTrigger className="w-full md:w-56">
              <SelectValue placeholder="All Schools" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Schools</SelectItem>
              {schools.map((school) => (
                <SelectItem key={school.id} value={school.id}>
                  {school.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {actionTypes.map((action) => (
                <SelectItem key={action} value={action}>
                  {action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Logs Table */}
        <div className="card-elevated overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="table-header">
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {new Date(log.timestamp).toLocaleString('en-PH', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        {getActionBadge(log.action)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">
                      {log.schoolName}
                    </TableCell>
                    <TableCell className="text-sm max-w-[300px] truncate">
                      {log.details}
                    </TableCell>
                    <TableCell className="text-sm">{log.userName}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No audit logs found matching your criteria.
            </div>
          )}
          {filteredLogs.length > 0 && logTotalPages > 1 && (
            <TablePagination
              currentPage={logPage}
              totalPages={logTotalPages}
              totalItems={filteredLogs.length}
              onPageChange={setLogPage}
              itemLabel="logs"
            />
          )}
        </div>
      </div>

      {/* Log Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Audit Log Details</DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Timestamp</p>
                  <p className="font-medium">
                    {new Date(selectedLog.timestamp).toLocaleString('en-PH')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Action</p>
                  {getActionBadge(selectedLog.action)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">School</p>
                  <p className="font-medium">{selectedLog.schoolName}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">User</p>
                  <p className="font-medium">{selectedLog.userName}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">Details</p>
                <p className="p-3 rounded bg-muted text-sm">{selectedLog.details}</p>
              </div>

              {(selectedLog.before || selectedLog.after) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedLog.before && (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-1">Before</p>
                      <pre className="p-3 rounded bg-destructive/10 text-xs overflow-auto">
                        {JSON.stringify(selectedLog.before, null, 2)}
                      </pre>
                    </div>
                  )}
                  {selectedLog.after && (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-1">After</p>
                      <pre className="p-3 rounded bg-success/10 text-xs overflow-auto">
                        {JSON.stringify(selectedLog.after, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditLogs;
