import React, { useState, useMemo, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { schools } from '@/data/mockData';
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
  Filter,
  Building2,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Send,
  Eye,
  Download,
  Package,
  MapPin,
  Phone,
  User,
  AlertCircle,
  TrendingDown,
  Minus,
  Sparkles,
  ShieldAlert,
  Brain,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  Target,
  Zap,
  ScanSearch,
  ListFilter,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TablePagination } from '@/components/ui/table-pagination';

const PAGE_SIZE = 10;

const LEVEL_OPTIONS = [
  { value: 'all', label: 'All Levels', description: 'Scan all schools in the division', icon: '🏫' },
  { value: 'Elementary', label: 'Elementary', description: 'Elementary schools only', icon: '📚' },
  { value: 'Secondary', label: 'Secondary', description: 'Secondary schools only', icon: '🎓' },
  { value: 'Senior High', label: 'Senior High', description: 'Senior High schools only', icon: '🏛️' },
  { value: 'SDO', label: 'SDO', description: 'Schools Division Office only', icon: '🏢' },
];

// ─── Mock extended school profile data ───────────────────────────────────────
const schoolProfiles = schools.reduce((acc, s) => {
  const seed = (s.id?.charCodeAt(0) || 65) + s.completenessScore;
  acc[s.id] = {
    principal: 'Principal Name',
    address: 'Baliuag, Bulacan',
    contact: '(044) 000-0000',
    enrollment: 200 + ((seed * 37) % 800),
    prevScore: Math.max(0, Math.min(100,
      s.completenessScore + (seed % 2 === 0 ? -(seed % 8) : seed % 8)
    )),
    hasLowStock: s.completenessScore < 85,
    lowStockItems: s.completenessScore < 85 ? (seed % 5) + 1 : 0,
    isStale: (() => {
      const diff = (new Date() - new Date(s.lastUpdated)) / (1000 * 60 * 60 * 24);
      return diff > 30;
    })(),
  };
  return acc;
}, {});

// ─── Built-in AI Engine ───────────────────────────────────────────────────────
const BuiltInAI = {
  delay: (ms) => new Promise((res) => setTimeout(res, ms)),

  computeRiskScore(school) {
    const p = schoolProfiles[school.id] || {};
    let score = 0;
    if (school.completenessScore < 90) score += (90 - school.completenessScore) * 1.2;
    if (school.completenessScore < 75) score += 20;
    if (p.hasLowStock) score += 15 + (p.lowStockItems || 0) * 3;
    if (p.isStale) score += 18;
    const trend = school.completenessScore - (p.prevScore || school.completenessScore);
    if (trend < -5) score += 12;
    if (trend < -10) score += 10;
    return Math.min(100, Math.round(score));
  },

  getRiskLevel(score) {
    if (score >= 60) return 'Poor';
    if (score >= 35) return 'High';
    return 'Medium';
  },

  getPrimaryRisk(school) {
    const p = schoolProfiles[school.id] || {};
    const trend = school.completenessScore - (p.prevScore || school.completenessScore);
    if (school.completenessScore < 75) return 'Critically low inventory completeness requires urgent intervention.';
    if (p.isStale && p.hasLowStock) return 'Stale records combined with low stock indicate possible data neglect.';
    if (p.isStale) return 'Inventory data has not been updated in over 30 days.';
    if (p.hasLowStock) return `${p.lowStockItems} item(s) are below the minimum required stock level.`;
    if (trend < -5) return `Completeness score dropped ${Math.abs(Math.round(trend))}% since last period.`;
    return 'Moderate risk — completeness score below division average.';
  },

  getFlags(school) {
    const p = schoolProfiles[school.id] || {};
    const flags = [];
    const trend = school.completenessScore - (p.prevScore || school.completenessScore);
    if (school.completenessScore < 75) flags.push('Score below 75% threshold');
    if (school.completenessScore < 90) flags.push('Score below 90% target');
    if (p.hasLowStock) flags.push(`${p.lowStockItems} low-stock item(s)`);
    if (p.isStale) flags.push('No update in 30+ days');
    if (trend < -5) flags.push(`Score dropped ${Math.abs(Math.round(trend))}% recently`);
    if (trend < -10) flags.push('Significant score decline detected');
    if (!flags.length) flags.push('Borderline completeness score');
    return flags;
  },

  getRecommendation(school) {
    const p = schoolProfiles[school.id] || {};
    const trend = school.completenessScore - (p.prevScore || school.completenessScore);
    if (school.completenessScore < 75)
      return `Immediately follow up with ${school.name} to complete missing inventory entries. Consider a site visit to verify physical stock.`;
    if (p.isStale && p.hasLowStock)
      return `Contact ${school.name} to update their inventory records and initiate a transfer to replenish ${p.lowStockItems} low-stock item(s).`;
    if (p.isStale)
      return `Send a reminder to ${school.name} to update inventory records. Set a 7-day deadline for compliance.`;
    if (p.hasLowStock)
      return `Initiate a transfer request for ${school.name} to address ${p.lowStockItems} item(s) below minimum stock.`;
    if (trend < -5)
      return `Investigate why ${school.name}'s completeness score dropped recently. Check for deleted or unsubmitted entries.`;
    return `Monitor ${school.name} closely and encourage regular inventory updates to maintain compliance.`;
  },

  async analyzeHealth(schoolList) {
    await this.delay(1800);
    const avg = schoolList.reduce((s, x) => s + x.completenessScore, 0) / schoolList.length;
    const lowCount = schoolList.filter((s) => s.completenessScore < 75).length;
    const highCount = schoolList.filter((s) => s.completenessScore >= 90).length;
    const staleCount = schoolList.filter((s) => schoolProfiles[s.id]?.isStale).length;
    const lowStockCount = schoolList.filter((s) => schoolProfiles[s.id]?.hasLowStock).length;
    const improving = schoolList.filter((s) => {
      const p = schoolProfiles[s.id] || {};
      return s.completenessScore > (p.prevScore || s.completenessScore);
    }).length;

    // ── Thresholds driven purely by the average score ──
    // Good  ≥ 90%  |  Fair  75–89%  |  Poor  < 75%
    let overallHealth = 'Good';
    if (avg < 75) overallHealth = 'Poor';
    else if (avg < 90) overallHealth = 'Fair';

    const headlines = {
      Good: `Inventory is in good shape with ${Math.round(avg)}% average completeness across ${schoolList.length} school(s).`,
      Fair: `Average is ${Math.round(avg)}% — ${lowCount} school(s) need attention to reach the 90% target.`,
      Poor: `Poor standing: average completeness is only ${Math.round(avg)}% with ${lowCount} school(s) below the 75% threshold.`,
    };

    const topPriorities = [];
    if (lowCount > 0) topPriorities.push(`Bring ${lowCount} school(s) with score below 75% up to minimum standard`);
    if (staleCount > 0) topPriorities.push(`Follow up with ${staleCount} school(s) that have not updated data in 30+ days`);
    if (lowStockCount > 0) topPriorities.push(`Process transfer requests for ${lowStockCount} school(s) with low stock`);
    if (topPriorities.length < 3) topPriorities.push('Push all schools to reach the 90% completeness target');
    if (topPriorities.length < 3) topPriorities.push('Establish a monthly inventory update deadline for all schools');

    const strengths = [];
    if (highCount > schoolList.length * 0.5) strengths.push(`Majority of schools (${highCount}) are above the 90% completeness target`);
    if (improving > schoolList.length * 0.4) strengths.push(`${improving} school(s) showed improvement vs. previous period`);
    if (avg >= 85) strengths.push(`Average of ${Math.round(avg)}% is above the 85% benchmark`);
    if (!strengths.length) strengths.push('Some schools are maintaining consistent update schedules');
    if (strengths.length < 2) strengths.push('SDO oversight processes are helping identify issues early');

    const sorted = [...schoolList].sort((a, b) => a.completenessScore - b.completenessScore);
    const immediateActions = sorted.slice(0, 3).map((s) => {
      const p = schoolProfiles[s.id] || {};
      if (s.completenessScore < 75) return `Visit ${s.name} (${s.completenessScore}%) to complete missing inventory data`;
      if (p.isStale) return `Send urgent reminder to ${s.name} to update stale inventory records`;
      if (p.hasLowStock) return `Initiate transfer to ${s.name} to replenish ${p.lowStockItems} low-stock item(s)`;
      return `Follow up with ${s.name} to improve completeness from ${s.completenessScore}%`;
    });

    const insights = {
      Good: `The selected group is performing well overall. Focus resources on the ${lowCount > 0 ? lowCount + ' underperforming school(s)' : 'few remaining gaps'} to bring everyone above 90%. Regular monitoring and a standardized update schedule will sustain this performance.`,
      Fair: `With ${Math.round(avg)}% average completeness, the group is progressing but needs targeted follow-ups. Prioritize the ${lowCount} school(s) below 75% as they carry the most risk. A structured reporting cycle will prevent further score drops.`,
      Poor: `Immediate intervention is required across multiple schools. The ${Math.round(avg)}% average suggests systemic data submission issues. Coordinate a group-wide inventory update drive with direct assistance to the lowest-scoring schools.`,
    };

    return {
      overallHealth,
      headline: headlines[overallHealth],
      topPriorities: topPriorities.slice(0, 3),
      strengths: strengths.slice(0, 2),
      immediateActions,
      insight: insights[overallHealth],
    };
  },

  async scanRisks(schoolList) {
    await this.delay(1600);
    return [...schoolList]
      .map((school) => ({
        schoolId: school.id,
        schoolName: school.name,
        riskScore: this.computeRiskScore(school),
        riskLevel: this.getRiskLevel(this.computeRiskScore(school)),
        primaryRisk: this.getPrimaryRisk(school),
        flags: this.getFlags(school),
        recommendation: this.getRecommendation(school),
      }))
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 5);
  },
};

// ─── Utilities ────────────────────────────────────────────────────────────────
// Good ≥ 90% → green | Fair 75–89% → yellow | Poor < 75% → red
const getScoreColor = (s) => s >= 90 ? 'text-success' : s >= 75 ? 'text-warning' : 'text-destructive';
const getScoreBackground = (s) => s >= 90 ? 'bg-success/10' : s >= 75 ? 'bg-warning/10' : 'bg-destructive/10';

// Returns a label string matching the threshold spec
const getScoreLabel = (s) => s >= 90 ? 'Good' : s >= 75 ? 'Fair' : 'Poor';

function getLevelBadge(level) {
  switch (level) {
    case 'Elementary': return <Badge variant="secondary">Elementary</Badge>;
    case 'Secondary': return <Badge className="bg-info text-info-foreground">Secondary</Badge>;
    case 'Senior High': return <Badge className="bg-primary text-primary-foreground">Senior High</Badge>;
    case 'SDO': return <Badge className="bg-accent text-accent-foreground">SDO</Badge>;
    default: return <Badge variant="outline">{level}</Badge>;
  }
}

const exportToCSV = (data) => {
  const headers = ['School Name', 'Level', 'Last Updated', 'Completeness Score (%)', 'Status'];
  const rows = data.map((s) => [
    `"${s.name}"`,
    s.level,
    new Date(s.lastUpdated).toLocaleDateString('en-PH'),
    s.completenessScore,
    getScoreLabel(s.completenessScore),
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'schools-directory.csv'; a.click();
  URL.revokeObjectURL(url);
};

// ─── Score Trend ──────────────────────────────────────────────────────────────
const ScoreTrend = ({ current, previous }) => {
  const diff = current - (previous ?? current);
  if (Math.abs(diff) < 1) return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
  if (diff > 0)
    return <span className="flex items-center gap-0.5 text-success text-[11px] font-semibold"><TrendingUp className="w-3 h-3" />+{Math.round(diff)}%</span>;
  return <span className="flex items-center gap-0.5 text-destructive text-[11px] font-semibold"><TrendingDown className="w-3 h-3" />{Math.round(diff)}%</span>;
};

// ─── Sortable Head ────────────────────────────────────────────────────────────
const SortableHead = ({ label, field, sortField, sortDir, onSort, className }) => {
  const active = sortField === field;
  return (
    <TableHead className={`cursor-pointer select-none whitespace-nowrap ${className || ''}`} onClick={() => onSort(field)}>
      <div className="flex items-center gap-1">
        {label}
        {active
          ? sortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-primary" /> : <ArrowDown className="w-3.5 h-3.5 text-primary" />
          : <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground opacity-50" />}
      </div>
    </TableHead>
  );
};

// ─── Typewriter ───────────────────────────────────────────────────────────────
const useTypewriter = (text, speed = 14) => {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!text) { setDisplayed(''); setDone(false); return; }
    setDisplayed(''); setDone(false);
    let i = 0;
    const t = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(t); setDone(true); }
    }, speed);
    return () => clearInterval(t);
  }, [text]);
  return { displayed, done };
};

// ─── Loading dots ─────────────────────────────────────────────────────────────
const LoadingDots = ({ color = 'bg-primary' }) => (
  <div className="flex gap-1.5">
    {[0, 1, 2].map((i) => (
      <div key={i} className={`w-2 h-2 rounded-full ${color} animate-bounce`} style={{ animationDelay: `${i * 0.15}s` }} />
    ))}
  </div>
);

// ─── Level Scope Selector — shared by both modals ────────────────────────────
const LevelScopeSelector = ({ selectedLevel, onSelect, accentColor = 'primary' }) => {
  const counts = useMemo(() => {
    const map = { all: schools.length };
    schools.forEach((s) => { map[s.level] = (map[s.level] || 0) + 1; });
    return map;
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <ListFilter className={`w-3.5 h-3.5 text-${accentColor}`} />
        <p className={`text-[10px] font-bold uppercase tracking-widest text-${accentColor}`}>
          Select Scope to Analyze
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        {LEVEL_OPTIONS.map((opt) => {
          const isActive = selectedLevel === opt.value;
          const count = counts[opt.value] || 0;
          return (
            <button
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              className={`
                relative rounded-lg border p-2.5 text-left transition-all
                ${isActive
                  ? accentColor === 'primary'
                    ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                    : 'border-destructive bg-destructive/10 ring-1 ring-destructive/30'
                  : 'border-border bg-muted/30 hover:bg-muted/60'}
              `}
            >
              <div className="flex flex-col items-center text-center gap-1">
                <span className="text-lg leading-none">{opt.icon}</span>
                <p className={`text-[11px] font-semibold leading-tight ${isActive ? (accentColor === 'primary' ? 'text-primary' : 'text-destructive') : 'text-foreground'}`}>
                  {opt.label}
                </p>
                <p className="text-[10px] text-muted-foreground">{count} school{count !== 1 ? 's' : ''}</p>
              </div>
              {isActive && (
                <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${accentColor === 'primary' ? 'bg-primary' : 'bg-destructive'}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// AI Smart Insights Modal (Health Advisor)
// ─────────────────────────────────────────────────────────────────────────────
const AIHealthAdvisorModal = ({ onClose }) => {
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const { displayed, done } = useTypewriter(result?.insight || '', 12);

  const scopedSchools = useMemo(() =>
    selectedLevel === 'all' ? schools : schools.filter((s) => s.level === selectedLevel),
    [selectedLevel]
  );

  const selectedOpt = LEVEL_OPTIONS.find((o) => o.value === selectedLevel);

  const run = async () => {
    if (scopedSchools.length === 0) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const data = await BuiltInAI.analyzeHealth(scopedSchools);
      setResult(data);
    } catch {
      setError('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Good → green | Fair → yellow | Poor → red
  const healthStyle =
    result?.overallHealth === 'Good'
      ? 'border-success/30 bg-success/5 text-success'
      : result?.overallHealth === 'Fair'
      ? 'border-warning/30 bg-warning/5 text-warning'
      : 'border-destructive/30 bg-destructive/5 text-destructive';

  const healthIcon =
    result?.overallHealth === 'Good' ? '✓'
    : result?.overallHealth === 'Fair' ? '!'
    : '⚠';

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-3 border-b border-border">
          <DialogTitle className="font-display flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary" />
            </div>
            AI Smart Insights
            <Badge className="bg-primary/10 text-primary border-0 text-[10px] ml-1">Built-in AI</Badge>
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Automated health analysis — choose a scope then run the analysis
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 space-y-4 pt-3">
          {/* Scope selector */}
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <LevelScopeSelector
              selectedLevel={selectedLevel}
              onSelect={(v) => { setSelectedLevel(v); setResult(null); setError(''); }}
              accentColor="primary"
            />
          </div>

          {/* Run button — shown before results */}
          {!loading && !result && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold">
                  Ready to analyze {selectedOpt?.icon} {selectedOpt?.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {scopedSchools.length} school{scopedSchools.length !== 1 ? 's' : ''} in scope
                </p>
              </div>
              <Button onClick={run} className="gap-2" disabled={scopedSchools.length === 0}>
                <ScanSearch className="w-4 h-4" />
                Run Analysis
              </Button>
              {scopedSchools.length === 0 && (
                <p className="text-xs text-destructive">No schools found for this level.</p>
              )}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Brain className="w-8 h-8 text-primary" />
                </div>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold">
                  Analyzing {scopedSchools.length} {selectedOpt?.label} school{scopedSchools.length !== 1 ? 's' : ''}…
                </p>
                <p className="text-xs text-muted-foreground mt-1">Computing health scores and generating insights</p>
              </div>
              <LoadingDots color="bg-primary" />
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-5 text-center space-y-3">
              <AlertTriangle className="w-6 h-6 text-destructive mx-auto" />
              <p className="text-sm text-destructive">{error}</p>
              <Button size="sm" onClick={run}>Try Again</Button>
            </div>
          )}

          {/* Results */}
          {!loading && result && (
            <>
              {/* Scope label */}
              <div className="flex items-center gap-2">
                <span className="text-sm">{selectedOpt?.icon}</span>
                <p className="text-xs text-muted-foreground">
                  Results for <span className="font-semibold text-foreground">{selectedOpt?.label}</span> — {scopedSchools.length} school{scopedSchools.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Overall health */}
              <div className={`rounded-xl border p-4 flex items-center gap-4 ${healthStyle}`}>
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-0.5">Overall Health</p>
                  <p className="text-2xl font-display font-bold">{result.overallHealth}</p>
                  <p className="text-sm mt-1 opacity-85">{result.headline}</p>
                </div>
                <p className="text-5xl font-display font-black opacity-10 flex-shrink-0 select-none">
                  {healthIcon}
                </p>
              </div>

              {/* Legend pill */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Score Key:</span>
                <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-[11px] font-semibold">Good ≥ 90%</span>
                <span className="px-2 py-0.5 rounded-full bg-warning/10 text-warning text-[11px] font-semibold">Fair 75–89%</span>
                <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[11px] font-semibold">Poor &lt; 75%</span>
              </div>

              {/* Three columns */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border border-border p-3 space-y-2.5">
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-primary" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Top Priorities</p>
                  </div>
                  <ul className="space-y-2">
                    {(result.topPriorities || []).map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-border p-3 space-y-2.5">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-success" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Strengths</p>
                  </div>
                  <ul className="space-y-2">
                    {(result.strengths || []).map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-border p-3 space-y-2.5">
                  <div className="flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-warning" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Act Now</p>
                  </div>
                  <ul className="space-y-2">
                    {(result.immediateActions || []).map((a, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <AlertCircle className="w-3.5 h-3.5 text-warning flex-shrink-0 mt-0.5" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Typewriter insight */}
              <div className="rounded-lg bg-primary/5 border border-primary/15 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Strategic Insight</p>
                </div>
                <p className="text-sm leading-relaxed">
                  {displayed}
                  {!done && <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse align-middle" />}
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => { setResult(null); setError(''); }} className="text-xs h-8">
                  Change Scope
                </Button>
                <Button size="sm" variant="outline" onClick={run} className="gap-1.5 text-xs h-8">
                  <Sparkles className="w-3.5 h-3.5" />Re-analyze
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// AI Risk Radar Modal
// ─────────────────────────────────────────────────────────────────────────────
const AIRiskScannerModal = ({ onClose, onViewSchool }) => {
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [loading, setLoading] = useState(false);
  const [risks, setRisks] = useState(null);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);

  const scopedSchools = useMemo(() =>
    selectedLevel === 'all' ? schools : schools.filter((s) => s.level === selectedLevel),
    [selectedLevel]
  );

  const selectedOpt = LEVEL_OPTIONS.find((o) => o.value === selectedLevel);

  const run = async () => {
    if (scopedSchools.length === 0) return;
    setLoading(true); setError(''); setRisks(null); setExpanded(null);
    try {
      const data = await BuiltInAI.scanRisks(scopedSchools);
      setRisks(data);
    } catch {
      setError('Risk scan failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Poor → red | High → yellow | Medium → info/blue
  const riskColor = (l) => l === 'Poor' ? 'text-destructive' : l === 'High' ? 'text-warning' : 'text-info';
  const riskBg   = (l) => l === 'Poor' ? 'bg-destructive/10 border-destructive/20' : l === 'High' ? 'bg-warning/10 border-warning/20' : 'bg-info/10 border-info/20';
  const riskBar  = (l) => l === 'Poor' ? 'bg-destructive' : l === 'High' ? 'bg-warning' : 'bg-info';
  const rankBg   = (l) => l === 'Poor' ? 'bg-destructive text-white' : l === 'High' ? 'bg-warning text-white' : 'bg-info text-white';
  const badgeCls = (l) => l === 'Poor' ? 'bg-destructive/15 text-destructive' : l === 'High' ? 'bg-warning/15 text-warning' : 'bg-info/15 text-info';

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-3 border-b border-border">
          <DialogTitle className="font-display flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-destructive" />
            </div>
            AI Risk Radar
            <Badge className="bg-primary/10 text-primary border-0 text-[10px] ml-1">Built-in AI</Badge>
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Detects top 5 highest-risk schools — choose a scope then run the scan
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 space-y-3 pt-3">
          {/* Scope selector */}
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <LevelScopeSelector
              selectedLevel={selectedLevel}
              onSelect={(v) => { setSelectedLevel(v); setRisks(null); setError(''); }}
              accentColor="destructive"
            />
          </div>

          {/* Ready state */}
          {!loading && !risks && !error && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
                <ShieldAlert className="w-8 h-8 text-destructive" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold">
                  Ready to scan {selectedOpt?.icon} {selectedOpt?.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {scopedSchools.length} school{scopedSchools.length !== 1 ? 's' : ''} in scope
                </p>
              </div>
              <Button onClick={run} variant="destructive" className="gap-2" disabled={scopedSchools.length === 0}>
                <ScanSearch className="w-4 h-4" />
                Run Risk Scan
              </Button>
              {scopedSchools.length === 0 && (
                <p className="text-xs text-destructive">No schools found for this level.</p>
              )}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
                  <ShieldAlert className="w-8 h-8 text-destructive" />
                </div>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold">
                  Scanning {scopedSchools.length} {selectedOpt?.label} school{scopedSchools.length !== 1 ? 's' : ''}…
                </p>
                <p className="text-xs text-muted-foreground mt-1">Evaluating completeness, stock levels, and data freshness</p>
              </div>
              <LoadingDots color="bg-destructive" />
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-5 text-center space-y-3">
              <AlertTriangle className="w-6 h-6 text-destructive mx-auto" />
              <p className="text-sm text-destructive">{error}</p>
              <Button size="sm" onClick={run}>Retry Scan</Button>
            </div>
          )}

          {/* Results */}
          {!loading && risks && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{selectedOpt?.icon}</span>
                  <p className="text-xs text-muted-foreground">
                    Top {risks.length} risks in <span className="font-semibold text-foreground">{selectedOpt?.label}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1"
                    onClick={() => { setRisks(null); setError(''); }}>
                    Change Scope
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={run}>
                    <Sparkles className="w-3 h-3" />Re-scan
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {risks.map((risk, i) => {
                  const isOpen = expanded === i;
                  return (
                    <div key={i} className={`rounded-lg border transition-all ${riskBg(risk.riskLevel)}`}>
                      <button className="w-full p-3 flex items-center gap-3 text-left" onClick={() => setExpanded(isOpen ? null : i)}>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${rankBg(risk.riskLevel)}`}>{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold truncate">{risk.schoolName}</p>
                            <Badge className={`border-0 text-[10px] ${badgeCls(risk.riskLevel)}`}>{risk.riskLevel}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{risk.primaryRisk}</p>
                        </div>
                        <div className="flex-shrink-0 w-14 text-right">
                          <p className={`text-sm font-bold ${riskColor(risk.riskLevel)}`}>{risk.riskScore}</p>
                          <div className="h-1.5 rounded-full bg-muted mt-1 overflow-hidden">
                            <div className={`h-full rounded-full ${riskBar(risk.riskLevel)}`} style={{ width: `${risk.riskScore}%` }} />
                          </div>
                        </div>
                        {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                      </button>

                      {isOpen && (
                        <div className="px-3 pb-3 border-t border-border/40 pt-3 space-y-3">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Risk Flags</p>
                            <div className="flex flex-wrap gap-1.5">
                              {(risk.flags || []).map((flag, fi) => (
                                <span key={fi} className="text-[11px] px-2.5 py-1 rounded-full bg-background border border-border">⚠ {flag}</span>
                              ))}
                            </div>
                          </div>
                          <div className="rounded-lg bg-background/70 border border-border p-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Recommendation</p>
                            <p className="text-xs leading-relaxed">{risk.recommendation}</p>
                          </div>
                          <div className="flex justify-end">
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5"
                              onClick={() => {
                                const school = schools.find((s) => s.id === risk.schoolId || s.name === risk.schoolName);
                                if (school) { onViewSchool(school); onClose(); }
                              }}>
                              <Eye className="w-3.5 h-3.5" />View School Profile
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// School Profile Modal
// ─────────────────────────────────────────────────────────────────────────────
const SchoolProfileModal = ({ school, onClose, onViewInventory, onQuickTransfer }) => {
  if (!school) return null;
  const profile = schoolProfiles[school.id] || {};
  const label = getScoreLabel(school.completenessScore);
  const labelColor =
    label === 'Good' ? 'text-success bg-success/10 border-success/20'
    : label === 'Fair' ? 'text-warning bg-warning/10 border-warning/20'
    : 'text-destructive bg-destructive/10 border-destructive/20';

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="font-display flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />School Profile
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-1 space-y-5">
          <div className="rounded-lg bg-primary/5 border border-primary/10 p-4 flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-bold text-base leading-tight">{school.name}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {getLevelBadge(school.level)}
                {profile.hasLowStock && (
                  <Badge className="bg-destructive/10 text-destructive border-0 text-[10px]">
                    <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />Low Stock
                  </Badge>
                )}
                {profile.isStale && (
                  <Badge className="bg-warning/10 text-warning border-0 text-[10px]">
                    <Clock className="w-2.5 h-2.5 mr-0.5" />Stale Data
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: User, label: 'Principal', value: profile.principal },
              { icon: MapPin, label: 'Address', value: profile.address },
              { icon: Phone, label: 'Contact', value: profile.contact },
              { icon: Package, label: 'Enrollment', value: `${(profile.enrollment || 0).toLocaleString()} students` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-lg bg-muted/40 border border-border p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                </div>
                <p className="text-sm font-medium">{value}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">Inventory Completeness</p>
            <div className="flex items-center gap-3 flex-wrap">
              <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${labelColor}`}>
                <span className="text-2xl font-display font-bold">{school.completenessScore}%</span>
                <span className="text-xs font-semibold">{label}</span>
                {school.completenessScore >= 90 && <CheckCircle className="w-4 h-4" />}
              </div>
              <ScoreTrend current={school.completenessScore} previous={profile.prevScore} />
              <span className="text-xs text-muted-foreground">vs. last period</span>
            </div>
            {/* Score key */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-[10px] text-muted-foreground">Key:</span>
              <span className="text-[10px] text-success font-semibold">Good ≥ 90%</span>
              <span className="text-[10px] text-muted-foreground">·</span>
              <span className="text-[10px] text-warning font-semibold">Fair 75–89%</span>
              <span className="text-[10px] text-muted-foreground">·</span>
              <span className="text-[10px] text-destructive font-semibold">Poor &lt; 75%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  school.completenessScore >= 90 ? 'bg-success'
                  : school.completenessScore >= 75 ? 'bg-warning'
                  : 'bg-destructive'
                }`}
                style={{ width: `${school.completenessScore}%` }}
              />
            </div>
          </div>
          {profile.hasLowStock && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-destructive">{profile.lowStockItems} item(s) below minimum stock</p>
                <p className="text-xs text-muted-foreground mt-0.5">Consider initiating a transfer to restock this school.</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            Last updated: {new Date(school.lastUpdated).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="flex gap-2 pt-1 border-t border-border">
            <Button className="flex-1" onClick={() => { onViewInventory(school); onClose(); }}>
              <Eye className="w-4 h-4 mr-1.5" />View Inventory
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => { onQuickTransfer(school); onClose(); }}>
              <Send className="w-4 h-4 mr-1.5" />Send Items
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Score Status Badge — used in the table
// ─────────────────────────────────────────────────────────────────────────────
const ScoreStatusBadge = ({ score }) => {
  const label = getScoreLabel(score);
  const cls =
    label === 'Good' ? 'bg-success/10 text-success'
    : label === 'Fair' ? 'bg-warning/10 text-warning'
    : 'bg-destructive/10 text-destructive';
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const Schools = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [scoreFilter, setScoreFilter] = useState('all');
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [profileSchool, setProfileSchool] = useState(null);
  const [showHealthAdvisor, setShowHealthAdvisor] = useState(false);
  const [showRiskScanner, setShowRiskScanner] = useState(false);

  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  const filteredSchools = useMemo(() => {
    let list = schools.filter((school) => {
      const matchesSearch = school.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLevel = levelFilter === 'all' || school.level === levelFilter;
      const matchesScore =
        scoreFilter === 'all' ||
        (scoreFilter === 'high'   && school.completenessScore >= 90) ||
        (scoreFilter === 'medium' && school.completenessScore >= 75 && school.completenessScore < 90) ||
        (scoreFilter === 'low'    && school.completenessScore < 75);
      return matchesSearch && matchesLevel && matchesScore;
    });
    if (sortField) {
      list = [...list].sort((a, b) => {
        let va, vb;
        if (sortField === 'name') { va = a.name; vb = b.name; }
        else if (sortField === 'lastUpdated') { va = new Date(a.lastUpdated); vb = new Date(b.lastUpdated); }
        else if (sortField === 'completenessScore') { va = a.completenessScore; vb = b.completenessScore; }
        if (va < vb) return sortDir === 'asc' ? -1 : 1;
        if (va > vb) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [searchQuery, levelFilter, scoreFilter, sortField, sortDir]);

  const [schoolPage, setSchoolPage] = useState(1);
  const totalPages = Math.ceil(filteredSchools.length / PAGE_SIZE) || 1;
  const paginatedSchools = useMemo(() => {
    const start = (schoolPage - 1) * PAGE_SIZE;
    return filteredSchools.slice(start, start + PAGE_SIZE);
  }, [filteredSchools, schoolPage]);
  useEffect(() => setSchoolPage(1), [filteredSchools.length, searchQuery, levelFilter, scoreFilter]);

  const elementary  = schools.filter((s) => s.level === 'Elementary').length;
  const secondary   = schools.filter((s) => s.level === 'Secondary').length;
  const seniorHigh  = schools.filter((s) => s.level === 'Senior High').length;
  const avgCompleteness = Math.round(schools.reduce((sum, s) => sum + s.completenessScore, 0) / schools.length);
  const lowStockCount = schools.filter((s) => schoolProfiles[s.id]?.hasLowStock).length;
  const staleCount    = schools.filter((s) => schoolProfiles[s.id]?.isStale).length;

  const handleViewInventory = (school) => navigate(`/inventory?school=${school.id}`);
  const handleQuickTransfer = (school) => navigate('/transfers', { state: { prefillDestination: school.id } });

  const renderRow = (school) => {
    const profile = schoolProfiles[school.id] || {};
    return (
      <TableRow key={school.id} className={`${profile.hasLowStock ? 'bg-destructive/5' : ''} ${profile.isStale ? 'opacity-80' : ''}`}>
        <TableCell>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              {(profile.hasLowStock || profile.isStale) && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-background bg-destructive" />
              )}
            </div>
            <div>
              <button className="font-medium text-left hover:text-primary transition-colors text-sm leading-tight" onClick={() => setProfileSchool(school)}>
                {school.name}
              </button>
              {profile.isStale && (
                <p className="text-[10px] text-warning mt-0.5 flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" /> Stale data — no recent update
                </p>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell>{getLevelBadge(school.level)}</TableCell>
        <TableCell>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            {new Date(school.lastUpdated).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center justify-center gap-2">
            <div className={`px-3 py-1 rounded-full ${getScoreBackground(school.completenessScore)}`}>
              <span className={`font-semibold ${getScoreColor(school.completenessScore)}`}>{school.completenessScore}%</span>
            </div>
            <ScoreStatusBadge score={school.completenessScore} />
            {school.completenessScore >= 95 && <CheckCircle className="w-4 h-4 text-success" />}
            <ScoreTrend current={school.completenessScore} previous={profile.prevScore || school.completenessScore} />
          </div>
        </TableCell>
        <TableCell>
          <div className="flex justify-end gap-2">
            {profile.hasLowStock && (
              <span title={`${profile.lowStockItems} low-stock items`}>
                <AlertTriangle className="w-4 h-4 text-destructive mt-1" />
              </span>
            )}
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View Profile" onClick={() => setProfileSchool(school)}>
              <Eye className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Quick Transfer" onClick={() => handleQuickTransfer(school)}>
              <Send className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleViewInventory(school)}>View Inventory</Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="min-h-screen">
      <Header title="Schools Directory" subtitle="Manage and monitor all schools in the division" />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <Building2 className="w-5 h-5 text-primary mb-2" />
            <p className="text-2xl font-display font-bold">{schools.length}</p>
            <p className="text-sm text-muted-foreground">Total Schools</p>
          </div>
          <div className="stat-card">
            <Badge variant="secondary" className="mb-2">Elementary</Badge>
            <p className="text-2xl font-display font-bold">{elementary}</p>
            <p className="text-sm text-muted-foreground">Elementary Schools</p>
          </div>
          <div className="stat-card">
            <Badge className="bg-info text-info-foreground mb-2">Secondary</Badge>
            <p className="text-2xl font-display font-bold">{secondary + seniorHigh}</p>
            <p className="text-sm text-muted-foreground">Secondary & SHS</p>
          </div>
          <div className="stat-card">
            <TrendingUp className="w-5 h-5 text-success mb-2" />
            <p className="text-2xl font-display font-bold">{avgCompleteness}%</p>
            <p className="text-sm text-muted-foreground">Avg. Completeness</p>
          </div>
        </div>

        {/* Score legend */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium">Completeness Key:</span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-success">
            <span className="w-2.5 h-2.5 rounded-full bg-success inline-block" />Good — 90–100% (filled in almost everything)
          </span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-warning">
            <span className="w-2.5 h-2.5 rounded-full bg-warning inline-block" />Fair — 75–89% (mostly done, some things missing)
          </span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
            <span className="w-2.5 h-2.5 rounded-full bg-destructive inline-block" />Poor — Below 75% (a lot of information is missing)
          </span>
        </div>

        {/* AI Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button onClick={() => setShowHealthAdvisor(true)}
            className="text-left rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all p-4 flex items-start gap-4 group">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-sm">AI Smart Insights</p>
                <Badge className="bg-primary/10 text-primary border-0 text-[10px]">Built-in AI</Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Automated health report for any level — All, Elementary, Secondary, Senior High, or SDO.
              </p>
            </div>
            <Sparkles className="w-4 h-4 text-primary/30 flex-shrink-0 group-hover:text-primary transition-colors mt-0.5" />
          </button>

          <button onClick={() => setShowRiskScanner(true)}
            className="text-left rounded-xl border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-all p-4 flex items-start gap-4 group">
            <div className="w-11 h-11 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-5 h-5 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-sm">AI Risk Radar</p>
                <Badge className="bg-primary/10 text-primary border-0 text-[10px]">Built-in AI</Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Detects top 5 risks per level — scan All, Elementary, Secondary, Senior High, or SDO.
              </p>
            </div>
            <Zap className="w-4 h-4 text-destructive/30 flex-shrink-0 group-hover:text-destructive transition-colors mt-0.5" />
          </button>
        </div>

        {/* Alert banners */}
        {(lowStockCount > 0 || staleCount > 0) && (
          <div className="flex flex-col sm:flex-row gap-3">
            {lowStockCount > 0 && (
              <div className="flex-1 flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive font-medium">
                  {lowStockCount} school{lowStockCount > 1 ? 's have' : ' has'} items below minimum stock level.
                </p>
              </div>
            )}
            {staleCount > 0 && (
              <div className="flex-1 flex items-center gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
                <AlertCircle className="w-4 h-4 text-warning flex-shrink-0" />
                <p className="text-sm text-warning font-medium">
                  {staleCount} school{staleCount > 1 ? 's have' : ' has'} not updated inventory in 30+ days.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search schools..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="Elementary">Elementary</SelectItem>
                <SelectItem value="Secondary">Secondary</SelectItem>
                <SelectItem value="Senior High">Senior High</SelectItem>
                <SelectItem value="SDO">SDO</SelectItem>
              </SelectContent>
            </Select>
            <Select value={scoreFilter} onValueChange={setScoreFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <TrendingUp className="w-4 h-4 mr-2" /><SelectValue placeholder="All Scores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scores</SelectItem>
                <SelectItem value="high">Good (≥ 90%)</SelectItem>
                <SelectItem value="medium">Fair (75–89%)</SelectItem>
                <SelectItem value="low">Poor (&lt; 75%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" className="h-10 gap-1.5" onClick={() => exportToCSV(filteredSchools)}>
            <Download className="w-4 h-4" />Export
          </Button>
        </div>

        {/* Table */}
        <div className="card-elevated overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="table-header">
                  <SortableHead label="School Name" field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="w-[38%]" />
                  <TableHead>Level</TableHead>
                  <SortableHead label="Last Updated" field="lastUpdated" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <SortableHead label="Completeness Score" field="completenessScore" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="text-center" />
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSchools.map((school) => renderRow(school))}
              </TableBody>
            </Table>
          </div>
          {filteredSchools.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">No schools found matching your criteria.</div>
          )}
          {filteredSchools.length > 0 && totalPages > 1 && (
            <TablePagination currentPage={schoolPage} totalPages={totalPages} totalItems={filteredSchools.length} onPageChange={setSchoolPage} itemLabel="schools" />
          )}
        </div>
      </div>

      {profileSchool && (
        <SchoolProfileModal school={profileSchool} onClose={() => setProfileSchool(null)}
          onViewInventory={handleViewInventory} onQuickTransfer={handleQuickTransfer} />
      )}
      {showHealthAdvisor && (
        <AIHealthAdvisorModal onClose={() => setShowHealthAdvisor(false)} />
      )}
      {showRiskScanner && (
        <AIRiskScannerModal onClose={() => setShowRiskScanner(false)}
          onViewSchool={(school) => setProfileSchool(school)} />
      )}
    </div>
  );
};

export default Schools;