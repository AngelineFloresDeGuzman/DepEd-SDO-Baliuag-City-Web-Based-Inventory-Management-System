import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/layout/Header';
import { auditLogs, schools } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
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
  Calendar as CalendarIcon,
  Download,
  Eye,
  FileText,
  Plus,
  Minus,
  ArrowLeftRight,
  Edit,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Users,
  RotateCcw,
  Activity,
  Link2,
  Clock,
} from 'lucide-react';
import { TablePagination } from '@/components/ui/table-pagination';

const PAGE_SIZE = 10;

// ─── FEATURE 1: Anomaly Detection ────────────────────────────────────────────
const detectAnomaly = (log, allLogs) => {
  const reasons = [];
  const hour = new Date(log.timestamp).getHours();
  if (hour < 7 || hour >= 18) reasons.push('After-hours activity');
  const sameUserRecent = allLogs.filter(
    (l) =>
      l.userName === log.userName &&
      l.id !== log.id &&
      Math.abs(new Date(l.timestamp) - new Date(log.timestamp)) < 30 * 60 * 1000
  );
  if (sameUserRecent.length >= 2) reasons.push('Rapid successive actions');
  return reasons;
};

// ─── FEATURE 2: Activity Heatmap ─────────────────────────────────────────────
const ActivityHeatmap = ({ logs, onDayClick, activeDateFilter }) => {
  const days = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (13 - i));
        return d;
      }),
    []
  );

  const countByDay = useMemo(() => {
    const map = {};
    logs.forEach((log) => {
      const key = new Date(log.timestamp).toDateString();
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [logs]);

  const max = Math.max(...Object.values(countByDay), 1);

  const getColor = (count, isActive) => {
    if (isActive) return 'bg-primary ring-2 ring-primary ring-offset-1';
    if (!count) return 'bg-muted hover:bg-muted/70';
    const intensity = count / max;
    if (intensity < 0.3) return 'bg-primary/25 hover:bg-primary/40';
    if (intensity < 0.6) return 'bg-primary/55 hover:bg-primary/70';
    return 'bg-primary/85 hover:bg-primary';
  };

  return (
    <div className="card-elevated p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Activity Heatmap</span>
          <span className="text-xs text-muted-foreground">— Last 14 days (click to filter)</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Less</span>
          {['bg-muted', 'bg-primary/25', 'bg-primary/55', 'bg-primary/85'].map((c, i) => (
            <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
          ))}
          <span>More</span>
        </div>
      </div>
      <div className="flex gap-1.5">
        {days.map((day) => {
          const key = day.toDateString();
          const count = countByDay[key] || 0;
          const isActive = activeDateFilter === key;
          return (
            <div key={key} className="flex flex-col items-center gap-1">
              <div
                title={`${key}: ${count} action${count !== 1 ? 's' : ''}`}
                onClick={() => onDayClick(day)}
                className={`w-7 h-7 rounded-sm cursor-pointer transition-all ${getColor(count, isActive)}`}
              />
              <span className="text-[9px] text-muted-foreground">{day.getDate()}</span>
            </div>
          );
        })}
      </div>
      {activeDateFilter && (
        <div className="mt-2 flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Filtered: {activeDateFilter}
          </Badge>
          <button
            onClick={() => onDayClick(null)}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};

// ─── FEATURE 5: User Activity Breakdown ──────────────────────────────────────
const UserBreakdown = ({ logs }) => {
  const breakdown = useMemo(() => {
    const map = {};
    logs.forEach((log) => {
      if (!map[log.userName])
        map[log.userName] = { total: 0, actions: {}, lastActive: null };
      map[log.userName].total++;
      map[log.userName].actions[log.action] =
        (map[log.userName].actions[log.action] || 0) + 1;
      const ts = new Date(log.timestamp);
      if (!map[log.userName].lastActive || ts > map[log.userName].lastActive)
        map[log.userName].lastActive = ts;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [logs]);

  return (
    <div className="space-y-2">
      {breakdown.slice(0, 5).map(([name, data]) => {
        const topAction = Object.entries(data.actions).sort((a, b) => b[1] - a[1])[0];
        return (
          <div key={name} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                {name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium">{name}</p>
                <p className="text-xs text-muted-foreground">
                  Top action: <span className="text-foreground">{topAction?.[0]}</span>
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {data.lastActive?.toLocaleDateString('en-PH', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-primary">{data.total}</span>
              <p className="text-xs text-muted-foreground">actions</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AuditLogs = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'sdo_admin';

  // ── Search / column filters ──────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);

  // ── Date filter state — mirrors Inventory.jsx exactly ─────────────────────
  const [dateFilterType, setDateFilterType] = useState('all');  // 'all'|'today'|'week'|'month'|'range'
  const [startDate, setStartDate] = useState('');               // ISO string 'YYYY-MM-DD'
  const [endDate, setEndDate] = useState('');                   // ISO string 'YYYY-MM-DD'
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
  const [activeDateField, setActiveDateField] = useState(null); // 'start'|'end'|null
  const [selectedDates, setSelectedDates] = useState(new Set());
  const dateRangeRef = useRef(null);

  // ── FEATURE 2: Heatmap filter ─────────────────────────────────────────────
  const [heatmapDayFilter, setHeatmapDayFilter] = useState(null);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [anomalyBannerOpen, setAnomalyBannerOpen] = useState(true);
  const [showUserBreakdown, setShowUserBreakdown] = useState(false);
  const [logPage, setLogPage] = useState(1);
  const [undoSent, setUndoSent] = useState({});

  // ── Date helper fns (same as Inventory.jsx) ───────────────────────────────
  const toISODateString = (date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const parseDateStringToLocalDate = (value) => {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const formatDateDisplay = (value) => {
    if (!value) return '';
    return parseDateStringToLocalDate(value).toLocaleDateString('en-PH', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  const formatDateRangeDisplay = (s, e) => {
    if (!s || !e) return '';
    const start = parseDateStringToLocalDate(s);
    const end   = parseDateStringToLocalDate(e);
    if (
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth()
    ) {
      const mo = start.toLocaleDateString('en-PH', { month: 'short' });
      return `${mo} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`;
    }
    return `${formatDateDisplay(s)} – ${formatDateDisplay(e)}`;
  };

  // ── Close date-range panel on outside click ───────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dateRangeRef.current && !dateRangeRef.current.contains(e.target)) {
        setIsDateRangeOpen(false);
        setActiveDateField(null);
      }
    };
    if (isDateRangeOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDateRangeOpen]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-display font-bold text-foreground mb-2">Access Restricted</h2>
          <p className="text-muted-foreground">Audit logs are only accessible to SDO Administrators.</p>
        </div>
      </div>
    );
  }

  // ── Anomalies ─────────────────────────────────────────────────────────────
  const logsWithAnomalies = useMemo(
    () => auditLogs.map((log) => ({ ...log, anomalies: detectAnomaly(log, auditLogs) })),
    []
  );
  const allAnomalousLogs = useMemo(
    () => logsWithAnomalies.filter((l) => l.anomalies.length > 0),
    [logsWithAnomalies]
  );

  // ── Filter logs ───────────────────────────────────────────────────────────
  const filteredLogs = useMemo(() => {
    return logsWithAnomalies.filter((log) => {
      const logDate = new Date(log.timestamp);
      const now = new Date();

      if (!log.details.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !log.userName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (schoolFilter !== 'all' && log.schoolId !== schoolFilter) return false;
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;

      // Date filter
      if (dateFilterType === 'today' && logDate.toDateString() !== now.toDateString()) return false;
      if (dateFilterType === 'week') {
        const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
        if (logDate < weekAgo) return false;
      }
      if (dateFilterType === 'month') {
        const monthAgo = new Date(now); monthAgo.setMonth(now.getMonth() - 1);
        if (logDate < monthAgo) return false;
      }
      if (dateFilterType === 'range' && startDate && endDate) {
        const s = parseDateStringToLocalDate(startDate);
        const e = parseDateStringToLocalDate(endDate);
        e.setHours(23, 59, 59, 999);
        if (logDate < s || logDate > e) return false;
      }

      // Heatmap filter
      if (heatmapDayFilter && logDate.toDateString() !== heatmapDayFilter) return false;

      return true;
    });
  }, [logsWithAnomalies, searchQuery, schoolFilter, actionFilter, dateFilterType, startDate, endDate, heatmapDayFilter]);

  const logTotalPages = Math.ceil(filteredLogs.length / PAGE_SIZE) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (logPage - 1) * PAGE_SIZE;
    return filteredLogs.slice(start, start + PAGE_SIZE);
  }, [filteredLogs, logPage]);

  useEffect(
    () => setLogPage(1),
    [filteredLogs.length, searchQuery, schoolFilter, actionFilter, dateFilterType, startDate, endDate, heatmapDayFilter]
  );

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getRelatedLogs = (log) => {
    const refMatch = log.details.match(/[A-Z]{2,}-\d{4}-\d{3}/)?.[0];
    return auditLogs
      .filter(
        (l) =>
          l.id !== log.id &&
          (refMatch
            ? l.details.includes(refMatch)
            : l.userName === log.userName &&
              l.schoolId === log.schoolId &&
              Math.abs(new Date(l.timestamp) - new Date(log.timestamp)) < 60 * 60 * 1000)
      )
      .slice(0, 3);
  };

  const isUndoEligible = (log) =>
    new Date() - new Date(log.timestamp) < 24 * 60 * 60 * 1000;

  const handleUndoRequest = (logId) =>
    setUndoSent((prev) => ({ ...prev, [logId]: true }));

  const getActionIcon = (action) => {
    if (action.includes('Delivery')) return <Plus className="w-4 h-4 text-success" />;
    if (action.includes('Issued')) return <Minus className="w-4 h-4 text-info" />;
    if (action.includes('Transfer')) return <ArrowLeftRight className="w-4 h-4 text-secondary" />;
    if (action.includes('Updated')) return <Edit className="w-4 h-4 text-warning" />;
    return <FileText className="w-4 h-4 text-muted-foreground" />;
  };

  const getActionBadge = (action) => {
    if (action.includes('Delivery'))
      return <Badge className="bg-success/20 text-success border-0">{action}</Badge>;
    if (action.includes('Issued'))
      return <Badge className="bg-info/20 text-info border-0">{action}</Badge>;
    if (action.includes('Transfer'))
      return <Badge className="bg-secondary/20 text-secondary border-0">{action}</Badge>;
    return <Badge variant="outline">{action}</Badge>;
  };

  const actionTypes = [
    'Delivery Added', 'Items Issued', 'Transfer Requested',
    'Transfer Received', 'Transfer Approved', 'Transfer Rejected', 'Inventory Updated',
  ];

  // ── Clear heatmap when date filter changes ────────────────────────────────
  const handleDateFilterChange = (value) => {
    setDateFilterType(value);
    setHeatmapDayFilter(null);
    if (value !== 'range') {
      setIsDateRangeOpen(false);
      setActiveDateField(null);
      setStartDate('');
      setEndDate('');
    } else {
      setIsDateRangeOpen(true);
      setActiveDateField('start');
    }
  };

  return (
    <div className="min-h-screen">
      <Header title="Audit Logs" subtitle="Complete history of all inventory actions" />

      <div className="p-6 space-y-4 animate-fade-in">

        {/* ── FEATURE 4: Anomaly Banner ─────────────────────────────────────── */}
        {allAnomalousLogs.length > 0 && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-destructive/10 transition-colors"
              onClick={() => setAnomalyBannerOpen((v) => !v)}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <span className="text-sm font-semibold text-destructive">
                  {allAnomalousLogs.length} Unusual {allAnomalousLogs.length === 1 ? 'Action' : 'Actions'} Detected
                </span>
                <span className="text-xs text-muted-foreground">
                  — After-hours activity or rapid successive actions
                </span>
              </div>
              {anomalyBannerOpen
                ? <ChevronUp className="w-4 h-4 text-destructive" />
                : <ChevronDown className="w-4 h-4 text-destructive" />}
            </button>
            {anomalyBannerOpen && (
              <div className="px-4 pb-3 space-y-1.5">
                {allAnomalousLogs.slice(0, 3).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between gap-4 py-1.5 border-t border-destructive/10 cursor-pointer hover:bg-destructive/5 rounded px-1"
                    onClick={() => setSelectedLog(log)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {getActionBadge(log.action)}
                      <span className="text-xs text-muted-foreground truncate">{log.details}</span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {log.anomalies.map((r, i) => (
                        <Badge key={i} className="bg-destructive/15 text-destructive border-0 text-[10px] whitespace-nowrap">
                          ⚠ {r}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
                {allAnomalousLogs.length > 3 && (
                  <p className="text-xs text-muted-foreground pt-1">
                    +{allAnomalousLogs.length - 3} more flagged entries
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── FEATURE 2: Activity Heatmap ───────────────────────────────────── */}
        <ActivityHeatmap
          logs={auditLogs}
          onDayClick={(day) => {
            setHeatmapDayFilter(day ? day.toDateString() : null);
            // Reset date filter when using heatmap
            if (day) {
              setDateFilterType('all');
              setStartDate('');
              setEndDate('');
              setIsDateRangeOpen(false);
            }
          }}
          activeDateFilter={heatmapDayFilter}
        />

        {/* ── Filters Row ───────────────────────────────────────────────────── */}
        <div className={`flex flex-row flex-nowrap items-center gap-3 ${isDateRangeOpen ? '' : 'overflow-x-auto'}`}>

          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full"
            />
          </div>

          {/* School */}
          <Select value={schoolFilter} onValueChange={setSchoolFilter}>
            <SelectTrigger className="w-56 shrink-0">
              <SelectValue placeholder="All Schools" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Schools</SelectItem>
              {schools.map((school) => (
                <SelectItem key={school.id} value={school.id}>{school.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Action */}
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-48 shrink-0">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {actionTypes.map((action) => (
                <SelectItem key={action} value={action}>{action}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* ── Date Filter — Inventory.jsx pattern ── */}
          <div
            className="relative inline-block shrink-0"
            style={{ zIndex: isDateRangeOpen ? 9999 : 'auto' }}
            ref={dateRangeRef}
          >
            <Select
              value={dateFilterType}
              onValueChange={handleDateFilterChange}
              onOpenChange={(open) => {
                if (!open && dateFilterType === 'range') {
                  setIsDateRangeOpen(true);
                  setActiveDateField((prev) => prev || 'start');
                }
              }}
            >
              <SelectTrigger
                className="w-44 md:w-52"
                onClick={() => {
                  if (dateFilterType === 'range') {
                    setIsDateRangeOpen(true);
                    setActiveDateField((prev) => prev || 'start');
                  }
                }}
              >
                {dateFilterType === 'range' && startDate && endDate ? (
                  <span className="text-sm truncate">{formatDateRangeDisplay(startDate, endDate)}</span>
                ) : (
                  <SelectValue placeholder="Date Filter" />
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="range">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {/* ── Custom Range Float Panel — exact Inventory.jsx markup ── */}
            {dateFilterType === 'range' && isDateRangeOpen && (
              <div
                className="absolute z-[9999] bg-white border border-blue-200 rounded-lg shadow-2xl p-4"
                style={{ top: '100%', left: 0, marginTop: '4px', width: '320px' }}
              >
                <div className="space-y-3">

                  {/* FROM */}
                  <div className="space-y-2">
                    <Label htmlFor="audit-start-date">From</Label>
                    <button
                      type="button"
                      className="input-field flex items-center justify-between text-sm w-full"
                      id="audit-start-date"
                      onClick={() =>
                        setActiveDateField((prev) => (prev === 'start' ? null : 'start'))
                      }
                    >
                      <span>{startDate ? formatDateDisplay(startDate) : 'Select date'}</span>
                      <CalendarIcon className="w-4 h-4 text-muted-foreground ml-2" />
                    </button>

                    {activeDateField === 'start' && (
                      <div className="mt-2 rounded-lg border border-border bg-card">
                        <Calendar
                          mode="single"
                          selected={startDate ? parseDateStringToLocalDate(startDate) : undefined}
                          disabled={endDate ? { after: parseDateStringToLocalDate(endDate) } : undefined}
                          onSelect={(date) => {
                            if (!date) return;
                            const iso = toISODateString(date);
                            setStartDate(iso);
                            const endLocal = endDate ? parseDateStringToLocalDate(endDate) : null;
                            if (!endLocal || endLocal < date) setEndDate(iso);
                            setActiveDateField('end');
                          }}
                          initialFocus
                          className="[&_*]:bg-white [&_*]:text-black [&_*]:border-gray-200 [&_rdp]:bg-yellow-100 [&_rdp]:border-yellow-400 [&_rdp]:text-black"
                          classNames={{
                            day: 'h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-yellow-200 hover:text-black',
                            day_selected: 'bg-yellow-400 text-black hover:bg-yellow-400 hover:text-black focus:bg-yellow-400 focus:text-black',
                            day_today: 'bg-white text-black border-blue-400 border',
                            day_outside: 'text-muted-foreground opacity-50 aria-selected:bg-yellow-200/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
                          }}
                          modifiers={{
                            selected: Array.from(selectedDates).map((s) => parseDateStringToLocalDate(s)),
                          }}
                          onDayClick={(date) => {
                            const str = toISODateString(date);
                            setSelectedDates((prev) => {
                              const next = new Set(prev);
                              next.has(str) ? next.delete(str) : next.add(str);
                              return next;
                            });
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* TO */}
                  <div className="space-y-2">
                    <Label htmlFor="audit-end-date">To</Label>
                    <button
                      type="button"
                      className="input-field flex items-center justify-between text-sm w-full"
                      id="audit-end-date"
                      onClick={() =>
                        setActiveDateField((prev) => (prev === 'end' ? null : 'end'))
                      }
                    >
                      <span>{endDate ? formatDateDisplay(endDate) : 'Select date'}</span>
                      <CalendarIcon className="w-4 h-4 text-muted-foreground ml-2" />
                    </button>

                    {activeDateField === 'end' && (
                      <div className="mt-2 rounded-lg border border-border bg-card">
                        <Calendar
                          mode="single"
                          selected={endDate ? parseDateStringToLocalDate(endDate) : undefined}
                          disabled={startDate ? { before: parseDateStringToLocalDate(startDate) } : undefined}
                          onSelect={(date) => {
                            if (!date) return;
                            setEndDate(toISODateString(date));
                            setActiveDateField(null);
                            setIsDateRangeOpen(false);
                          }}
                          initialFocus
                          className="[&_*]:bg-white [&_*]:text-black [&_*]:border-gray-200 [&_rdp]:bg-yellow-100 [&_rdp]:border-yellow-400 [&_rdp]:text-black"
                          classNames={{
                            day: 'h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-yellow-200 hover:text-black',
                            day_selected: 'bg-yellow-400 text-black hover:bg-yellow-400 hover:text-black focus:bg-yellow-400 focus:text-black',
                            day_today: 'bg-white text-black border-blue-400 border',
                            day_outside: 'text-muted-foreground opacity-50 aria-selected:bg-yellow-200/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
                          }}
                          modifiers={{
                            selected: Array.from(selectedDates).map((s) => parseDateStringToLocalDate(s)),
                          }}
                          onDayClick={(date) => {
                            const str = toISODateString(date);
                            setSelectedDates((prev) => {
                              const next = new Set(prev);
                              next.has(str) ? next.delete(str) : next.add(str);
                              return next;
                            });
                          }}
                        />
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}
          </div>

          {/* ── FEATURE 5: User Breakdown Toggle ── */}
          <Button
            variant={showUserBreakdown ? 'default' : 'outline'}
            onClick={() => setShowUserBreakdown((v) => !v)}
            className="shrink-0"
          >
            <Users className="w-4 h-4 mr-2" />
            Users
          </Button>

          <Button variant="outline" className="shrink-0">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {/* ── FEATURE 5: User Activity Breakdown Panel ── */}
        {showUserBreakdown && (
          <div className="card-elevated p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">User Activity Breakdown</span>
              <span className="text-xs text-muted-foreground">— Top 5 most active users</span>
            </div>
            <UserBreakdown logs={auditLogs} />
          </div>
        )}

        {/* ── Heatmap active filter pill ─────────────────────────────────────── */}
        {heatmapDayFilter && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs gap-1">
              <CalendarIcon className="w-3 h-3" />
              Heatmap: {heatmapDayFilter}
            </Badge>
            <button
              onClick={() => setHeatmapDayFilter(null)}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Clear
            </button>
          </div>
        )}

        {/* ── Logs Table ── */}
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
                  <TableHead className="w-[80px] text-center">Flags</TableHead>
                  <TableHead className="text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.map((log) => (
                  <TableRow key={log.id} className={log.anomalies?.length ? 'bg-destructive/5' : ''}>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                        {new Date(log.timestamp).toLocaleString('en-PH', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        {getActionBadge(log.action)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{log.schoolName}</TableCell>
                    <TableCell className="text-sm max-w-[300px] truncate">{log.details}</TableCell>
                    <TableCell className="text-sm">{log.userName}</TableCell>
                    <TableCell className="text-center">
                      {log.anomalies?.length > 0 ? (
                        <Badge
                          title={log.anomalies.join(', ')}
                          className="bg-destructive/15 text-destructive border-0 gap-1 text-xs px-2 cursor-help"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          {log.anomalies.length}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground/40 text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
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

      {/* ── Log Detail Dialog ── */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Audit Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Timestamp</p>
                  <p className="font-medium">{new Date(selectedLog.timestamp).toLocaleString('en-PH')}</p>
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

              {selectedLog.anomalies?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-destructive mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Anomaly Flags
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedLog.anomalies.map((r, i) => (
                      <Badge key={i} className="bg-destructive/15 text-destructive border-0">⚠ {r}</Badge>
                    ))}
                  </div>
                </div>
              )}

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

              {/* FEATURE 3: Related Logs Thread */}
              {(() => {
                const related = getRelatedLogs(selectedLog);
                if (!related.length) return null;
                return (
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                      <Link2 className="w-3.5 h-3.5" />
                      Related Log Thread ({related.length})
                    </p>
                    <div className="space-y-2 border-l-2 border-primary/30 pl-3">
                      {related.map((r) => (
                        <div
                          key={r.id}
                          className="cursor-pointer hover:bg-muted/50 rounded p-2 transition-colors"
                          onClick={() => setSelectedLog({ ...r, anomalies: detectAnomaly(r, auditLogs) })}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            {getActionBadge(r.action)}
                            <span className="text-xs text-muted-foreground">
                              {new Date(r.timestamp).toLocaleString('en-PH', {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{r.details}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* FEATURE 6: Undo Request */}
              {isUndoEligible(selectedLog) && (
                <div className="pt-2 border-t border-border">
                  {undoSent[selectedLog.id] ? (
                    <div className="flex items-center gap-2 text-sm text-success">
                      <RotateCcw className="w-4 h-4" />
                      Undo request sent to {selectedLog.userName}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        This action was performed within the last 24 hours.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 border-warning text-warning hover:bg-warning/10"
                        onClick={() => handleUndoRequest(selectedLog.id)}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Request Undo
                      </Button>
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