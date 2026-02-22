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
  Target,
  Zap,
  ScanSearch,
  RefreshCw,
  Info,
  Printer,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TablePagination } from '@/components/ui/table-pagination';

const PAGE_SIZE = 10;

const LEVEL_OPTIONS = [
  { value: 'all',        label: 'All',        icon: '🏫' },
  { value: 'Elementary', label: 'Elementary',  icon: '📚' },
  { value: 'Secondary',  label: 'Secondary',   icon: '🎓' },
  { value: 'Senior High',label: 'Senior High', icon: '🏛️' },
  { value: 'SDO',        label: 'SDO',         icon: '🏢' },
];


// ─── Print Utilities ──────────────────────────────────────────────────────────
const PRINT_BASE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; font-size: 11px; color: #111; background: #fff; padding: 32px 40px; }
  @media print {
    @page { margin: 20mm 18mm; size: A4; }
    body { padding: 0; }
    .no-print { display: none !important; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  }
  h1 { font-size: 18px; font-weight: 700; color: #111; }
  p  { color: #374151; line-height: 1.55; }
  .meta { font-size: 10px; color: #6b7280; }
  .header-bar { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #111; }
  .header-left h1 { line-height: 1.2; }
  .header-left .subtitle { font-size: 11px; color: #6b7280; margin-top: 3px; }
  .header-right { text-align: right; }
  .pill { display: inline-block; font-size: 10px; font-weight: 600; padding: 2px 10px; border-radius: 999px; }
  .pill-good   { background: #dcfce7; color: #15803d; }
  .pill-fair   { background: #fef9c3; color: #a16207; }
  .pill-poor   { background: #fee2e2; color: #b91c1c; }
  .pill-medium { background: #e0f2fe; color: #0369a1; }
  .pill-high   { background: #fef9c3; color: #a16207; }
  .section { margin-bottom: 20px; }
  .section-title { font-size: 9px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #9ca3af; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #f3f4f6; }
  .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px; }
  .health-card { border-radius: 8px; padding: 14px 16px; margin-bottom: 12px; }
  .health-good { background: #f0fdf4; border: 1px solid #86efac; }
  .health-fair { background: #fefce8; border: 1px solid #fde047; }
  .health-poor { background: #fef2f2; border: 1px solid #fca5a5; }
  .health-label { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 2px; }
  .health-value { font-size: 22px; font-weight: 800; line-height: 1.1; }
  .health-headline { font-size: 11px; margin-top: 4px; }
  .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 16px; }
  .col-title { font-size: 9px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #6b7280; margin-bottom: 6px; }
  .list-item { display: flex; align-items: flex-start; gap: 6px; margin-bottom: 5px; font-size: 10.5px; color: #374151; line-height: 1.45; }
  .num-dot { flex-shrink: 0; width: 16px; height: 16px; border-radius: 50%; background: #e0e7ff; color: #4338ca; font-size: 9px; font-weight: 700; display: flex; align-items: center; justify-content: center; margin-top: 1px; }
  .bullet { flex-shrink: 0; width: 6px; height: 6px; border-radius: 50%; margin-top: 4px; }
  .bullet-green  { background: #22c55e; }
  .bullet-yellow { background: #eab308; }
  .insight-box { background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 12px 14px; margin-bottom: 16px; }
  .insight-label { font-size: 9px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #4338ca; margin-bottom: 4px; }
  .risk-block { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px; margin-bottom: 10px; }
  .risk-header { display: grid; grid-template-columns: 28px 1fr auto; gap: 10px; align-items: start; }
  .risk-rank { width: 24px; height: 24px; border-radius: 5px; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
  .rank-poor   { background: #ef4444; }
  .rank-high   { background: #eab308; }
  .rank-medium { background: #0ea5e9; }
  .risk-name { font-size: 11.5px; font-weight: 600; color: #111; }
  .risk-primary { font-size: 10px; color: #6b7280; margin-top: 2px; line-height: 1.4; }
  .risk-score-col { text-align: right; }
  .score-num-poor   { color: #ef4444; font-size: 15px; font-weight: 800; }
  .score-num-high   { color: #ca8a04; font-size: 15px; font-weight: 800; }
  .score-num-medium { color: #0284c7; font-size: 15px; font-weight: 800; }
  .score-bar-wrap { height: 4px; background: #e5e7eb; border-radius: 999px; overflow: hidden; margin-top: 4px; width: 52px; }
  .score-bar { height: 100%; border-radius: 999px; }
  .bar-poor   { background: #ef4444; }
  .bar-high   { background: #eab308; }
  .bar-medium { background: #0ea5e9; }
  .flags-row { display: flex; flex-wrap: wrap; gap: 4px; margin: 8px 0 4px; }
  .flag-pill { background: #fff; border: 1px solid #e5e7eb; border-radius: 999px; padding: 2px 8px; font-size: 9.5px; color: #6b7280; }
  .rec-box { background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 7px 10px; margin-top: 6px; }
  .rec-label { font-size: 8.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #9ca3af; margin-bottom: 3px; }
  .footer { margin-top: 28px; padding-top: 10px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 9px; color: #9ca3af; }
  .print-actions { display: flex; gap: 8px; margin-bottom: 24px; }
  .btn-print { cursor: pointer; border: 1px solid #d1d5db; background: #fff; padding: 7px 18px; border-radius: 6px; font-size: 11px; font-family: inherit; font-weight: 500; color: #374151; }
  .btn-print:hover { background: #f3f4f6; }
  .btn-close { cursor: pointer; border: 1px solid transparent; background: #111; padding: 7px 18px; border-radius: 6px; font-size: 11px; font-family: inherit; font-weight: 500; color: #fff; }
`;

const openPrintWindow = (htmlBody, title) => {
  const win = window.open('', '_blank', 'width=960,height=720');
  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${title}</title>
  <style>${PRINT_BASE_STYLES}</style>
</head>
<body>
  <div class="no-print print-actions">
    <button class="btn-print" onclick="window.print()">🖨&nbsp; Print / Save as PDF</button>
    <button class="btn-close" onclick="window.close()">Close</button>
  </div>
  ${htmlBody}
</body>
</html>`);
  win.document.close();
};

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });

const printHealthReport = (result, scopedSchools, selectedLevel) => {
  const opt = LEVEL_OPTIONS.find((o) => o.value === selectedLevel);
  const now = formatDate(new Date());
  const avgScore = Math.round(scopedSchools.reduce((s, x) => s + x.completenessScore, 0) / scopedSchools.length);
  const healthClass = { Good: 'health-good', Fair: 'health-fair', Poor: 'health-poor' }[result.overallHealth];
  const healthColor = { Good: '#15803d', Fair: '#a16207', Poor: '#b91c1c' }[result.overallHealth];
  const badgeCls   = { Good: 'pill-good', Fair: 'pill-fair', Poor: 'pill-poor' }[result.overallHealth];

  const priorities = (result.topPriorities || []).map((p, i) =>
    `<li class="list-item"><span class="num-dot">${i + 1}</span><span>${p}</span></li>`).join('');
  const strengths = (result.strengths || []).map((s) =>
    `<li class="list-item"><span class="bullet bullet-green"></span><span>${s}</span></li>`).join('');
  const actions = (result.immediateActions || []).map((a) =>
    `<li class="list-item"><span class="bullet bullet-yellow"></span><span>${a}</span></li>`).join('');

  const rows = [...scopedSchools]
    .sort((a, b) => a.completenessScore - b.completenessScore)
    .map((s, idx) => {
      const lbl = s.completenessScore >= 90 ? 'Good' : s.completenessScore >= 75 ? 'Fair' : 'Poor';
      const pc  = s.completenessScore >= 90 ? 'pill-good' : s.completenessScore >= 75 ? 'pill-fair' : 'pill-poor';
      return `<tr style="border-bottom:1px solid #f3f4f6;background:${idx % 2 === 0 ? '#fff' : '#fafafa'}">
        <td style="padding:5px 8px;font-weight:500">${s.name}</td>
        <td style="padding:5px 8px;color:#6b7280">${s.level}</td>
        <td style="padding:5px 8px;text-align:center;font-weight:700">${s.completenessScore}</td>
        <td style="padding:5px 8px;text-align:center"><span class="pill ${pc}">${lbl}</span></td>
        <td style="padding:5px 8px;color:#6b7280">${formatDate(s.lastUpdated)}</td>
      </tr>`;
    }).join('');

  openPrintWindow(`
    <div class="header-bar">
      <div class="header-left">
        <h1>AI Smart Insights Report</h1>
        <p class="subtitle">Schools Division &mdash; Inventory Insights Analysis</p>
      </div>
      <div class="header-right">
        <p class="meta">Scope: <strong>${opt?.label}</strong> &middot; ${scopedSchools.length} school${scopedSchools.length !== 1 ? 's' : ''}</p>
        <p class="meta">Generated: ${now}</p>
        <p class="meta">Division Avg: <strong>${avgScore}</strong></p>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Overall Insights</div>
      <div class="health-card ${healthClass}">
        <div class="health-label" style="color:${healthColor}">Overall Insights Status</div>
        <div class="health-value" style="color:${healthColor}">${result.overallHealth}&nbsp;<span class="pill ${badgeCls}">${avgScore} avg</span></div>
        <p class="health-headline">${result.headline}</p>
      </div>
      <p class="meta">Score Key: <strong style="color:#15803d">Good — 90 and above</strong> &nbsp;&middot;&nbsp; <strong style="color:#a16207">Fair — 75 to 89</strong> &nbsp;&middot;&nbsp; <strong style="color:#b91c1c">Poor — below 75</strong></p>
    </div>

    <div class="three-col">
      <div><div class="col-title">Top Priorities</div><ul style="list-style:none">${priorities}</ul></div>
      <div><div class="col-title">Strengths</div><ul style="list-style:none">${strengths}</ul></div>
      <div><div class="col-title">Immediate Actions</div><ul style="list-style:none">${actions}</ul></div>
    </div>

    <div class="insight-box">
      <div class="insight-label">Strategic Insight</div>
      <p style="font-size:11px;line-height:1.6;color:#1e1b4b">${result.insight}</p>
    </div>

    <div class="section">
      <div class="section-title">Schools in Scope (${scopedSchools.length})</div>
      <table style="width:100%;border-collapse:collapse;font-size:10px">
        <thead>
          <tr style="background:#f3f4f6">
            <th style="text-align:left;padding:5px 8px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb">School Name</th>
            <th style="text-align:left;padding:5px 8px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb">Level</th>
            <th style="text-align:center;padding:5px 8px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb">Score</th>
            <th style="text-align:center;padding:5px 8px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb">Status</th>
            <th style="text-align:left;padding:5px 8px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb">Last Updated</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div class="footer">
      <span>Schools Division Office &mdash; For Official Use Only</span>
      <span>AI Smart Insights &middot; ${now}</span>
    </div>
  `, 'AI Smart Insights Report');
};

const printRiskReport = (risks, scopedSchools, selectedLevel) => {
  const opt = LEVEL_OPTIONS.find((o) => o.value === selectedLevel);
  const now = formatDate(new Date());

  const criteriaRows = [
    ['Low Completeness Score', 'Schools scoring below 90; critically flagged if below 75'],
    ['Below Minimum Stock',    'One or more items have fallen below the required stock level'],
    ['Stale Data',             'Inventory records not updated within the last 30 days'],
    ['Score Decline',          'Completeness score dropped significantly since the last period'],
  ].map(([t, d]) =>
    `<tr>
      <td style="padding:5px 8px;font-weight:600;border-bottom:1px solid #f3f4f6">${t}</td>
      <td style="padding:5px 8px;color:#6b7280;border-bottom:1px solid #f3f4f6">${d}</td>
    </tr>`
  ).join('');

  const riskBlocks = risks.map((r, i) => {
    const rankCls  = { Poor: 'rank-poor',         High: 'rank-high',         Medium: 'rank-medium'  }[r.riskLevel] || 'rank-medium';
    const scoreCls = { Poor: 'score-num-poor',     High: 'score-num-high',    Medium: 'score-num-medium' }[r.riskLevel] || 'score-num-medium';
    const barCls   = { Poor: 'bar-poor',           High: 'bar-high',          Medium: 'bar-medium'   }[r.riskLevel] || 'bar-medium';
    const pillCls  = { Poor: 'pill-poor',          High: 'pill-fair',         Medium: 'pill-medium'  }[r.riskLevel] || 'pill-medium';
    const flags    = (r.flags || []).map((f) => `<span class="flag-pill">&#9888; ${f}</span>`).join('');
    return `
      <div class="risk-block">
        <div class="risk-header">
          <span class="risk-rank ${rankCls}">${i + 1}</span>
          <div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <span class="risk-name">${r.schoolName}</span>
              <span class="pill ${pillCls}">${r.riskLevel} Risk</span>
            </div>
            <p class="risk-primary">${r.primaryRisk}</p>
          </div>
          <div class="risk-score-col">
            <div class="${scoreCls}">${r.riskScore}</div>
            <div class="score-bar-wrap" style="margin-left:auto">
              <div class="score-bar ${barCls}" style="width:${r.riskScore}%"></div>
            </div>
          </div>
        </div>
        ${flags ? `<div class="flags-row">${flags}</div>` : ''}
        <div class="rec-box">
          <div class="rec-label">Recommendation</div>
          <p style="font-size:10.5px;color:#374151;line-height:1.55">${r.recommendation}</p>
        </div>
      </div>`;
  }).join('');

  openPrintWindow(`
    <div class="header-bar">
      <div class="header-left">
        <h1>AI Risk Radar Report</h1>
        <p class="subtitle">Schools Division &mdash; Top Risk School Identification</p>
      </div>
      <div class="header-right">
        <p class="meta">Scope: <strong>${opt?.label}</strong> &middot; ${scopedSchools.length} school${scopedSchools.length !== 1 ? 's' : ''} scanned</p>
        <p class="meta">Generated: ${now}</p>
        <p class="meta">Schools flagged: <strong>${risks.length}</strong></p>
      </div>
    </div>

    <div class="section">
      <div class="section-title">What Risk Radar Detected</div>
      <div class="card" style="margin-bottom:12px">
        <p style="font-size:10.5px;color:#374151;margin-bottom:8px;line-height:1.6">
          Risk Radar assigned a composite risk score to each school based on four signals. The five schools with the highest risk scores are listed below, ordered by priority for intervention.
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:10px">
          <thead>
            <tr style="background:#f3f4f6">
              <th style="text-align:left;padding:5px 8px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;width:36%">Signal</th>
              <th style="text-align:left;padding:5px 8px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb">Description</th>
            </tr>
          </thead>
          <tbody>${criteriaRows}</tbody>
        </table>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Top ${risks.length} Highest-Risk Schools</div>
      ${riskBlocks}
    </div>

    <div class="footer">
      <span>Schools Division Office &mdash; For Official Use Only</span>
      <span>AI Risk Radar &middot; ${now}</span>
    </div>
  `, 'AI Risk Radar Report');
};


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
    if (trend < -5) return `Completeness score dropped ${Math.abs(Math.round(trend))} points since last period.`;
    return 'Moderate risk — completeness score below division average.';
  },

  getFlags(school) {
    const p = schoolProfiles[school.id] || {};
    const flags = [];
    const trend = school.completenessScore - (p.prevScore || school.completenessScore);
    if (school.completenessScore < 75) flags.push('Score below 75 threshold');
    if (school.completenessScore < 90) flags.push('Score below 90 target');
    if (p.hasLowStock) flags.push(`${p.lowStockItems} low-stock item(s)`);
    if (p.isStale) flags.push('No update in 30+ days');
    if (trend < -5) flags.push(`Score dropped ${Math.abs(Math.round(trend))} points recently`);
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

    let overallHealth = 'Good';
    if (avg < 75) overallHealth = 'Poor';
    else if (avg < 90) overallHealth = 'Fair';

    const headlines = {
      Good: `Inventory is in good shape with ${Math.round(avg)} average completeness across ${schoolList.length} school(s).`,
      Fair: `Average is ${Math.round(avg)} — ${lowCount} school(s) need attention to reach the target of 90.`,
      Poor: `Poor standing: average completeness is only ${Math.round(avg)} with ${lowCount} school(s) below the threshold of 75.`,
    };

    const topPriorities = [];
    if (lowCount > 0) topPriorities.push(`Bring ${lowCount} school(s) with score below 75 up to minimum standard`);
    if (staleCount > 0) topPriorities.push(`Follow up with ${staleCount} school(s) that have not updated data in 30+ days`);
    if (lowStockCount > 0) topPriorities.push(`Process transfer requests for ${lowStockCount} school(s) with low stock`);
    if (topPriorities.length < 3) topPriorities.push('Push all schools to reach the completeness target of 90');
    if (topPriorities.length < 3) topPriorities.push('Establish a monthly inventory update deadline for all schools');

    const strengths = [];
    if (highCount > schoolList.length * 0.5) strengths.push(`Majority of schools (${highCount}) are above the completeness target of 90`);
    if (improving > schoolList.length * 0.4) strengths.push(`${improving} school(s) showed improvement vs. previous period`);
    if (avg >= 85) strengths.push(`Average of ${Math.round(avg)} is above the benchmark of 85`);
    if (!strengths.length) strengths.push('Some schools are maintaining consistent update schedules');
    if (strengths.length < 2) strengths.push('SDO oversight processes are helping identify issues early');

    const sorted = [...schoolList].sort((a, b) => a.completenessScore - b.completenessScore);
    const immediateActions = sorted.slice(0, 3).map((s) => {
      const p = schoolProfiles[s.id] || {};
      if (s.completenessScore < 75) return `Visit ${s.name} (${s.completenessScore}) to complete missing inventory data`;
      if (p.isStale) return `Send urgent reminder to ${s.name} to update stale inventory records`;
      if (p.hasLowStock) return `Initiate transfer to ${s.name} to replenish ${p.lowStockItems} low-stock item(s)`;
      return `Follow up with ${s.name} to improve completeness from ${s.completenessScore}`;
    });

    const insights = {
      Good: `The selected group is performing well overall. Focus resources on the ${lowCount > 0 ? lowCount + ' underperforming school(s)' : 'few remaining gaps'} to bring everyone above 90. Regular monitoring and a standardized update schedule will sustain this performance.`,
      Fair: `With ${Math.round(avg)} average completeness, the group is progressing but needs targeted follow-ups. Prioritize the ${lowCount} school(s) below 75 as they carry the most risk. A structured reporting cycle will prevent further score drops.`,
      Poor: `Immediate intervention is required across multiple schools. The ${Math.round(avg)} average suggests systemic data submission issues. Coordinate a group-wide inventory update drive with direct assistance to the lowest-scoring schools.`,
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
const getScoreColor = (s) => s >= 90 ? 'text-success' : s >= 75 ? 'text-warning' : 'text-destructive';
const getScoreBackground = (s) => s >= 90 ? 'bg-success/10' : s >= 75 ? 'bg-warning/10' : 'bg-destructive/10';
const getScoreLabel = (s) => s >= 90 ? 'Good' : s >= 75 ? 'Fair' : 'Poor';

function getLevelBadge(level) {
  switch (level) {
    case 'Elementary': return <Badge variant="secondary">Elementary</Badge>;
    case 'Secondary':  return <Badge className="bg-info text-info-foreground">Secondary</Badge>;
    case 'Senior High':return <Badge className="bg-primary text-primary-foreground">Senior High</Badge>;
    case 'SDO':        return <Badge className="bg-accent text-accent-foreground">SDO</Badge>;
    default:           return <Badge variant="outline">{level}</Badge>;
  }
}

const printSchoolsReport = (data, { levelFilter, scoreFilter, searchQuery } = {}) => {
  const now = new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
  const avgScore = data.length
    ? Math.round(data.reduce((s, x) => s + x.completenessScore, 0) / data.length)
    : 0;
  const goodCount   = data.filter((s) => s.completenessScore >= 90).length;
  const fairCount   = data.filter((s) => s.completenessScore >= 75 && s.completenessScore < 90).length;
  const poorCount   = data.filter((s) => s.completenessScore < 75).length;

  const scopeLabel = [
    levelFilter && levelFilter !== 'all' ? `Level: ${levelFilter}` : 'All Levels',
    scoreFilter && scoreFilter !== 'all'
      ? scoreFilter === 'high' ? 'Score: Good (90 and above)' : scoreFilter === 'medium' ? 'Score: Fair (75 to 89)' : 'Score: Poor (below 75)'
      : null,
    searchQuery ? `Search: "${searchQuery}"` : null,
  ].filter(Boolean).join(' · ');

  const tableRows = data.map((s, idx) => {
    const lbl = getScoreLabel(s.completenessScore);
    const scoreColor = s.completenessScore >= 90 ? '#15803d' : s.completenessScore >= 75 ? '#a16207' : '#b91c1c';
    const pillBg     = s.completenessScore >= 90 ? '#dcfce7' : s.completenessScore >= 75 ? '#fef9c3' : '#fee2e2';
    const profile    = schoolProfiles[s.id] || {};
    const alerts = [
      profile.hasLowStock ? `⚠ ${profile.lowStockItems} low stock` : null,
      profile.isStale     ? '⏱ Stale data' : null,
    ].filter(Boolean).join('  ');
    return `
      <tr style="background:${idx % 2 === 0 ? '#fff' : '#fafafa'};border-bottom:1px solid #f3f4f6">
        <td style="padding:7px 10px;font-weight:500;color:#111">${s.name}</td>
        <td style="padding:7px 10px;color:#6b7280">${s.level}</td>
        <td style="padding:7px 10px;color:#6b7280">${new Date(s.lastUpdated).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
        <td style="padding:7px 10px;text-align:center">
          <span style="font-weight:700;font-size:12px;color:${scoreColor}">${s.completenessScore}</span>
        </td>
        <td style="padding:7px 10px;text-align:center">
          <span style="display:inline-block;background:${pillBg};color:${scoreColor};font-size:10px;font-weight:600;padding:2px 10px;border-radius:999px">${lbl}</span>
        </td>
        <td style="padding:7px 10px;font-size:10px;color:#9ca3af">${alerts}</td>
      </tr>`;
  }).join('');

  const win = window.open('', '_blank', 'width=1020,height=760');
  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Schools Directory Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; font-size: 11px; color: #111; background: #fff; padding: 36px 44px; }
    @media print {
      @page { margin: 18mm 16mm; size: A4 landscape; }
      body { padding: 0; }
      .no-print { display: none !important; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
    .action-bar { display: flex; gap: 8px; margin-bottom: 28px; align-items: center; }
    .btn { cursor: pointer; font-family: inherit; font-size: 11px; font-weight: 500; border-radius: 7px; padding: 7px 18px; transition: background 0.15s; }
    .btn-primary { background: #111; color: #fff; border: 1px solid #111; }
    .btn-primary:hover { background: #333; }
    .btn-secondary { background: #fff; color: #374151; border: 1px solid #d1d5db; }
    .btn-secondary:hover { background: #f9fafb; }
    .header { display: flex; align-items: flex-start; justify-content: space-between; padding-bottom: 16px; border-bottom: 2px solid #111; margin-bottom: 20px; }
    .header-title { font-size: 20px; font-weight: 800; line-height: 1.15; }
    .header-sub { font-size: 11px; color: #6b7280; margin-top: 3px; }
    .header-meta { text-align: right; }
    .header-meta p { font-size: 10px; color: #6b7280; margin-bottom: 2px; }
    .header-meta strong { color: #111; }
    .summary { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 20px; }
    .sum-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; }
    .sum-label { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; margin-bottom: 3px; }
    .sum-value { font-size: 20px; font-weight: 800; line-height: 1; }
    .scope-row { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
    .scope-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; }
    .scope-pill { background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 5px; padding: 3px 10px; font-size: 10px; font-weight: 500; color: #374151; }
    .table-wrap { border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
    thead tr { background: #f3f4f6; }
    thead th { padding: 8px 10px; text-align: left; font-weight: 600; color: #374151; font-size: 10px; border-bottom: 1px solid #e5e7eb; white-space: nowrap; }
    tbody tr:last-child td { border-bottom: none; }
    tfoot tr { background: #f9fafb; border-top: 1px solid #e5e7eb; }
    tfoot td { padding: 7px 10px; font-size: 10px; color: #9ca3af; }
    .key-row { display: flex; align-items: center; gap: 14px; margin-top: 12px; }
    .key-item { display: flex; align-items: center; gap: 5px; font-size: 10px; font-weight: 500; }
    .key-dot { width: 8px; height: 8px; border-radius: 50%; }
    .footer { margin-top: 24px; display: flex; justify-content: space-between; font-size: 9px; color: #9ca3af; padding-top: 10px; border-top: 1px solid #f3f4f6; }
  </style>
</head>
<body>
  <div class="action-bar no-print">
    <button class="btn btn-primary" onclick="window.print()">🖨&nbsp; Print / Save as PDF</button>
    <button class="btn btn-secondary" onclick="window.close()">Close</button>
    <span style="font-size:10px;color:#9ca3af;margin-left:4px">Tip: Set paper to <strong>A4 Landscape</strong> for best fit</span>
  </div>
  <div class="header">
    <div>
      <div class="header-title">Schools Directory Report</div>
      <div class="header-sub">Schools Division — Inventory Completeness Overview</div>
    </div>
    <div class="header-meta">
      <p>Generated: <strong>${now}</strong></p>
      <p>Total schools shown: <strong>${data.length}</strong></p>
      <p>Division Avg: <strong>${avgScore}</strong></p>
    </div>
  </div>
  <div class="summary">
    <div class="sum-card"><div class="sum-label">Total Shown</div><div class="sum-value">${data.length}</div></div>
    <div class="sum-card"><div class="sum-label">Good — 90 and above</div><div class="sum-value" style="color:#15803d">${goodCount}</div></div>
    <div class="sum-card"><div class="sum-label">Fair — 75 to 89</div><div class="sum-value" style="color:#a16207">${fairCount}</div></div>
    <div class="sum-card"><div class="sum-label">Poor — below 75</div><div class="sum-value" style="color:#b91c1c">${poorCount}</div></div>
    <div class="sum-card"><div class="sum-label">Avg. Score</div><div class="sum-value" style="color:${avgScore >= 90 ? '#15803d' : avgScore >= 75 ? '#a16207' : '#b91c1c'}">${avgScore}</div></div>
  </div>
  <div class="scope-row">
    <span class="scope-label">Active Filters</span>
    <span class="scope-pill">${scopeLabel}</span>
  </div>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th style="width:34%">School Name</th>
          <th>Level</th>
          <th>Last Updated</th>
          <th style="text-align:center">Score</th>
          <th style="text-align:center">Status</th>
          <th>Alerts</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
      <tfoot>
        <tr>
          <td colspan="6">${data.length} school${data.length !== 1 ? 's' : ''} · Avg completeness: ${avgScore} · Generated ${now}</td>
        </tr>
      </tfoot>
    </table>
  </div>
  <div class="key-row">
    <span style="font-size:10px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.08em">Score Key:</span>
    <span class="key-item"><span class="key-dot" style="background:#22c55e"></span><span style="color:#15803d">Good — 90 to 100</span></span>
    <span class="key-item"><span class="key-dot" style="background:#eab308"></span><span style="color:#a16207">Fair — 75 to 89</span></span>
    <span class="key-item"><span class="key-dot" style="background:#ef4444"></span><span style="color:#b91c1c">Poor — Below 75</span></span>
  </div>
  <div class="footer">
    <span>Schools Division Office &mdash; For Official Use Only</span>
    <span>Schools Directory &middot; ${now}</span>
  </div>
</body>
</html>`);
  win.document.close();
};

// ─── Score Trend ──────────────────────────────────────────────────────────────
const ScoreTrend = ({ current, previous }) => {
  const diff = current - (previous ?? current);
  if (Math.abs(diff) < 1) return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
  if (diff > 0)
    return <span className="flex items-center gap-0.5 text-success text-[11px] font-semibold"><TrendingUp className="w-3 h-3" />+{Math.round(diff)}</span>;
  return <span className="flex items-center gap-0.5 text-destructive text-[11px] font-semibold"><TrendingDown className="w-3 h-3" />{Math.round(diff)}</span>;
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

// ─── Slim loading bar ─────────────────────────────────────────────────────────
const LoadingBar = ({ color = 'bg-primary' }) => (
  <div className="w-full h-0.5 bg-muted overflow-hidden rounded-full">
    <div className={`h-full ${color} animate-pulse rounded-full`} style={{ width: '60%', animation: 'shimmer 1.5s infinite' }} />
  </div>
);

// ─── Level Pill Tabs ──────────────────────────────────────────────────────────
const LevelTabs = ({ selectedLevel, onSelect, accentClass = 'bg-primary text-primary-foreground' }) => {
  const counts = useMemo(() => {
    const map = { all: schools.length };
    schools.forEach((s) => { map[s.level] = (map[s.level] || 0) + 1; });
    return map;
  }, []);

  return (
    <div className="flex flex-wrap gap-1.5">
      {LEVEL_OPTIONS.map((opt) => {
        const isActive = selectedLevel === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border
              ${isActive
                ? `${accentClass} border-transparent shadow-sm`
                : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground'}
            `}
          >
            <span>{opt.icon}</span>
            {opt.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-muted-foreground/10'}`}>
              {counts[opt.value] || 0}
            </span>
          </button>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// AI Smart Insights Modal
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

  const run = async () => {
    if (scopedSchools.length === 0) return;
    setLoading(true); setError(''); setResult(null);
    try { setResult(await BuiltInAI.analyzeHealth(scopedSchools)); }
    catch { setError('Analysis failed. Please try again.'); }
    finally { setLoading(false); }
  };

  const healthConfig = {
    Good: { bar: 'bg-success', pill: 'bg-success/10 text-success border-success/20', dot: 'bg-success' },
    Fair: { bar: 'bg-warning', pill: 'bg-warning/10 text-warning border-warning/20', dot: 'bg-warning' },
    Poor: { bar: 'bg-destructive', pill: 'bg-destructive/10 text-destructive border-destructive/20', dot: 'bg-destructive' },
  };
  const hc = result ? healthConfig[result.overallHealth] : null;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center gap-3">
          <Brain className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Smart Insights</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Scope row */}
          <div className="px-6 py-4 border-b border-border/60 space-y-2">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Select Scope</p>
            <LevelTabs
              selectedLevel={selectedLevel}
              onSelect={(v) => { setSelectedLevel(v); setResult(null); setError(''); }}
              accentClass="bg-primary text-primary-foreground"
            />
          </div>

          <div className="px-6 py-5 space-y-5">
            {/* Ready state */}
            {!loading && !result && !error && (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <p className="text-xs text-muted-foreground">
                  {scopedSchools.length} school{scopedSchools.length !== 1 ? 's' : ''} in scope
                </p>
                <Button onClick={run} size="sm" className="gap-2 h-8 px-4" disabled={scopedSchools.length === 0}>
                  <ScanSearch className="w-3.5 h-3.5" />Run Analysis
                </Button>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="py-10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-4 h-4 text-primary animate-pulse" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Analyzing {scopedSchools.length} school{scopedSchools.length !== 1 ? 's' : ''}…</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Computing scores and generating insights</p>
                  </div>
                </div>
                <LoadingBar color="bg-primary" />
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="rounded-lg bg-destructive/8 border border-destructive/15 p-4 flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive flex-1">{error}</p>
                <Button size="sm" variant="outline" onClick={run} className="h-7 text-xs">Retry</Button>
              </div>
            )}

            {/* Results */}
            {!loading && result && hc && (
              <div className="space-y-5">
                {/* Overall health */}
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${hc.dot}`} />
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Overall Status</span>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${hc.pill}`}>
                      {result.overallHealth}
                    </span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{result.headline}</p>
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/50">
                    <span className="text-[10px] text-muted-foreground">Key:</span>
                    <span className="text-[10px] text-success font-semibold">Good — 90 and above</span>
                    <span className="text-[10px] text-warning font-semibold">Fair — 75 to 89</span>
                    <span className="text-[10px] text-destructive font-semibold">Poor — below 75</span>
                  </div>
                </div>

                {/* Three columns */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5" />Priorities
                    </p>
                    <ul className="space-y-2.5">
                      {(result.topPriorities || []).map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-foreground leading-relaxed">
                          <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-success" />Strengths
                    </p>
                    <ul className="space-y-2.5">
                      {(result.strengths || []).map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-foreground leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0 mt-1.5" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-warning" />Act Now
                    </p>
                    <ul className="space-y-2.5">
                      {(result.immediateActions || []).map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-foreground leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-warning flex-shrink-0 mt-1.5" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Strategic Insight */}
                <div className="rounded-lg bg-primary/5 border border-primary/10 p-4">
                  <p className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-2">Strategic Insight</p>
                  <p className="text-sm text-foreground leading-relaxed">
                    {displayed}
                    {!done && <span className="inline-block w-0.5 h-3.5 bg-primary ml-0.5 animate-pulse align-middle" />}
                  </p>
                </div>

                {/* Footer actions */}
                <div className="flex justify-between items-center pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => printHealthReport(result, scopedSchools, selectedLevel)}
                    className="gap-1.5 text-xs h-7 px-3"
                  >
                    <Printer className="w-3 h-3" />View Report
                  </Button>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => { setResult(null); setError(''); }} className="text-xs h-7 px-3">
                      Change Scope
                    </Button>
                    <Button size="sm" variant="outline" onClick={run} className="gap-1.5 text-xs h-7 px-3">
                      <RefreshCw className="w-3 h-3" />Re-analyze
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
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

  const run = async () => {
    if (scopedSchools.length === 0) return;
    setLoading(true); setError(''); setRisks(null); setExpanded(null);
    try { setRisks(await BuiltInAI.scanRisks(scopedSchools)); }
    catch { setError('Risk scan failed. Please try again.'); }
    finally { setLoading(false); }
  };

  const levelConfig = {
    Poor:   { pill: 'bg-destructive/10 text-destructive border-destructive/20', bar: 'bg-destructive', rank: 'bg-destructive text-white' },
    High:   { pill: 'bg-warning/10 text-warning border-warning/20',             bar: 'bg-warning',     rank: 'bg-warning text-white' },
    Medium: { pill: 'bg-info/10 text-info border-info/20',                      bar: 'bg-info',        rank: 'bg-info text-white' },
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center gap-3">
          <ShieldAlert className="w-4 h-4 text-destructive" />
          <h2 className="text-sm font-semibold">Risk Radar</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Scope row */}
          <div className="px-6 py-4 border-b border-border/60 space-y-2">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Select Scope</p>
            <LevelTabs
              selectedLevel={selectedLevel}
              onSelect={(v) => { setSelectedLevel(v); setRisks(null); setError(''); }}
              accentClass="bg-destructive text-destructive-foreground"
            />
          </div>

          <div className="px-6 py-5 space-y-4">
            {/* Ready state */}
            {!loading && !risks && !error && (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <p className="text-xs text-muted-foreground">
                  {scopedSchools.length} school{scopedSchools.length !== 1 ? 's' : ''} in scope
                </p>
                <Button onClick={run} variant="destructive" size="sm" className="gap-2 h-8 px-4" disabled={scopedSchools.length === 0}>
                  <ScanSearch className="w-3.5 h-3.5" />Run Risk Scan
                </Button>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="py-10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-destructive/8 flex items-center justify-center flex-shrink-0">
                    <ShieldAlert className="w-4 h-4 text-destructive animate-pulse" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Scanning {scopedSchools.length} school{scopedSchools.length !== 1 ? 's' : ''}…</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Evaluating completeness, stock levels, and data freshness</p>
                  </div>
                </div>
                <LoadingBar color="bg-destructive" />
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="rounded-lg bg-destructive/8 border border-destructive/15 p-4 flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive flex-1">{error}</p>
                <Button size="sm" variant="outline" onClick={run} className="h-7 text-xs">Retry</Button>
              </div>
            )}

            {/* Results */}
            {!loading && risks && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-medium text-muted-foreground">
                    Top {risks.length} risks — {LEVEL_OPTIONS.find(o => o.value === selectedLevel)?.label}
                  </p>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" className="h-7 text-xs px-2.5 gap-1.5"
                      onClick={() => printRiskReport(risks, scopedSchools, selectedLevel)}>
                      <Printer className="w-3 h-3" />View Report
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs px-2.5"
                      onClick={() => { setRisks(null); setError(''); }}>Change Scope</Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs px-2.5 gap-1" onClick={run}>
                      <RefreshCw className="w-3 h-3" />Re-scan
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {risks.map((risk, i) => {
                    const isOpen = expanded === i;
                    const lc = levelConfig[risk.riskLevel] || levelConfig.Medium;
                    return (
                      <div key={i} className="rounded-lg border border-border bg-muted/10 overflow-hidden">
                        <button
                          className="w-full p-3.5 flex items-center gap-3 text-left hover:bg-muted/20 transition-colors"
                          onClick={() => setExpanded(isOpen ? null : i)}
                        >
                          <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${lc.rank}`}>
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium truncate">{risk.schoolName}</p>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${lc.pill}`}>
                                {risk.riskLevel}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{risk.primaryRisk}</p>
                          </div>
                          <div className="w-12 flex-shrink-0 text-right space-y-1">
                            <p className="text-sm font-bold">{risk.riskScore}</p>
                            <div className="h-1 rounded-full bg-muted overflow-hidden">
                              <div className={`h-full rounded-full ${lc.bar}`} style={{ width: `${risk.riskScore}%` }} />
                            </div>
                          </div>
                          {isOpen
                            ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                        </button>

                        {isOpen && (
                          <div className="px-4 pb-4 pt-3 border-t border-border/60 space-y-3">
                            <div className="flex flex-wrap gap-1.5">
                              {(risk.flags || []).map((flag, fi) => (
                                <span key={fi} className="text-[11px] px-2.5 py-1 rounded-full bg-background border border-border text-muted-foreground">
                                  {flag}
                                </span>
                              ))}
                            </div>
                            <div className="rounded-lg bg-muted/30 border border-border p-3">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Recommendation</p>
                              <p className="text-xs text-foreground leading-relaxed">{risk.recommendation}</p>
                            </div>
                            <div className="flex justify-end">
                              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5"
                                onClick={() => {
                                  const school = schools.find((s) => s.id === risk.schoolId || s.name === risk.schoolName);
                                  if (school) { onViewSchool(school); onClose(); }
                                }}>
                                <Eye className="w-3.5 h-3.5" />View Profile
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
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
                <span className="text-2xl font-display font-bold">{school.completenessScore}</span>
                <span className="text-xs font-semibold">{label}</span>
                {school.completenessScore >= 90 && <CheckCircle className="w-4 h-4" />}
              </div>
              <ScoreTrend current={school.completenessScore} previous={profile.prevScore} />
              <span className="text-xs text-muted-foreground">vs. last period</span>
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-[10px] text-muted-foreground">Key:</span>
              <span className="text-[10px] text-success font-semibold">Good — 90 and above</span>
              <span className="text-[10px] text-muted-foreground">·</span>
              <span className="text-[10px] text-warning font-semibold">Fair — 75 to 89</span>
              <span className="text-[10px] text-muted-foreground">·</span>
              <span className="text-[10px] text-destructive font-semibold">Poor — below 75</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
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

// ─── Score Status Badge ───────────────────────────────────────────────────────
const ScoreStatusBadge = ({ score }) => {
  const label = getScoreLabel(score);
  const cls =
    label === 'Good' ? 'bg-success/10 text-success'
    : label === 'Fair' ? 'bg-warning/10 text-warning'
    : 'bg-destructive/10 text-destructive';
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
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
      const matchesLevel  = levelFilter === 'all' || school.level === levelFilter;
      const matchesScore  =
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
            <ScoreStatusBadge score={school.completenessScore} />
            {school.completenessScore >= 95 && <CheckCircle className="w-4 h-4 text-success" />}
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
            <p className="text-2xl font-display font-bold">{avgCompleteness}</p>
            <p className="text-sm text-muted-foreground">Avg. Completeness</p>
          </div>
        </div>

        {/* Score legend */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium">Completeness Key:</span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-success">
            <span className="w-2 h-2 rounded-full bg-success inline-block" />Good — 90 to 100
          </span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-warning">
            <span className="w-2 h-2 rounded-full bg-warning inline-block" />Fair — 75 to 89
          </span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
            <span className="w-2 h-2 rounded-full bg-destructive inline-block" />Poor — below 75
          </span>
        </div>

        {/* ── AI Tools ── */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowHealthAdvisor(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-all text-sm font-medium"
          >
            <Brain className="w-4 h-4 text-primary" />
            Smart Insights
          </button>
          <button
            onClick={() => setShowRiskScanner(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-all text-sm font-medium"
          >
            <ShieldAlert className="w-4 h-4 text-destructive" />
            Risk Radar
          </button>
        </div>

        {/* Alert banners */}
        {(lowStockCount > 0 || staleCount > 0) && (
          <div className="flex flex-col sm:flex-row gap-3">
            {lowStockCount > 0 && (
              <div className="flex-1 flex items-center gap-3 p-3 rounded-lg bg-destructive/8 border border-destructive/15">
                <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive font-medium">
                  {lowStockCount} school{lowStockCount > 1 ? 's have' : ' has'} items below minimum stock level.
                </p>
              </div>
            )}
            {staleCount > 0 && (
              <div className="flex-1 flex items-center gap-3 p-3 rounded-lg bg-warning/8 border border-warning/15">
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
              <SelectTrigger className="w-full sm:w-44">
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
              <SelectTrigger className="w-full sm:w-44">
                <TrendingUp className="w-4 h-4 mr-2" /><SelectValue placeholder="All Scores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scores</SelectItem>
                <SelectItem value="high">Good (90 and above)</SelectItem>
                <SelectItem value="medium">Fair (75 to 89)</SelectItem>
                <SelectItem value="low">Poor (below 75)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" className="h-10 gap-1.5" onClick={() => printSchoolsReport(filteredSchools, { levelFilter, scoreFilter, searchQuery })}>
            <Printer className="w-4 h-4" />View Report
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