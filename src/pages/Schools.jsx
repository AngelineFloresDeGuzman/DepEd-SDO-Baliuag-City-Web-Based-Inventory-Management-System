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
  Search,
  Filter,
  Building2,
  TrendingUp,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TablePagination } from '@/components/ui/table-pagination';

const PAGE_SIZE = 10;

const Schools = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');

  const filteredSchools = schools.filter((school) => {
    const matchesSearch = school.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === 'all' || school.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  const [schoolPage, setSchoolPage] = useState(1);
  const totalPages = Math.ceil(filteredSchools.length / PAGE_SIZE) || 1;
  const paginatedSchools = useMemo(() => {
    const start = (schoolPage - 1) * PAGE_SIZE;
    return filteredSchools.slice(start, start + PAGE_SIZE);
  }, [filteredSchools, schoolPage]);
  useEffect(() => setSchoolPage(1), [filteredSchools.length, searchQuery, levelFilter]);

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-success';
    if (score >= 75) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreBackground = (score) => {
    if (score >= 90) return 'bg-success/10';
    if (score >= 75) return 'bg-warning/10';
    return 'bg-destructive/10';
  };

  const getLevelBadge = (level) => {
    switch (level) {
      case 'Elementary':
        return <Badge variant="secondary">Elementary</Badge>;
      case 'Secondary':
        return <Badge className="bg-info text-info-foreground">Secondary</Badge>;
      case 'Senior High':
        return (
          <Badge className="bg-primary text-primary-foreground">Senior High</Badge>
        );
      case 'SDO':
        return <Badge className="bg-accent text-accent-foreground">SDO</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  // Stats
  const elementary = schools.filter((s) => s.level === 'Elementary').length;
  const secondary = schools.filter((s) => s.level === 'Secondary').length;
  const seniorHigh = schools.filter((s) => s.level === 'Senior High').length;
  const avgCompleteness = Math.round(
    schools.reduce((sum, s) => sum + s.completenessScore, 0) / schools.length
  );

  return (
    <div className="min-h-screen">
      <Header
        title="Schools Directory"
        subtitle="Manage and monitor all schools in the division"
      />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <Building2 className="w-5 h-5 text-primary mb-2" />
            <p className="text-2xl font-display font-bold">{schools.length}</p>
            <p className="text-sm text-muted-foreground">Total Schools</p>
          </div>
          <div className="stat-card">
            <Badge variant="secondary" className="mb-2">
              Elementary
            </Badge>
            <p className="text-2xl font-display font-bold">{elementary}</p>
            <p className="text-sm text-muted-foreground">Elementary Schools</p>
          </div>
          <div className="stat-card">
            <Badge className="bg-info text-info-foreground mb-2">Secondary</Badge>
            <p className="text-2xl font-display font-bold">
              {secondary + seniorHigh}
            </p>
            <p className="text-sm text-muted-foreground">Secondary & SHS</p>
          </div>
          <div className="stat-card">
            <TrendingUp className="w-5 h-5 text-success mb-2" />
            <p className="text-2xl font-display font-bold">{avgCompleteness}%</p>
            <p className="text-sm text-muted-foreground">Avg. Completeness</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search schools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="Elementary">Elementary</SelectItem>
              <SelectItem value="Secondary">Secondary</SelectItem>
              <SelectItem value="Senior High">Senior High</SelectItem>
              <SelectItem value="SDO">SDO</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Schools Table */}
        <div className="card-elevated overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="table-header">
                  <TableHead className="w-[40%]">School Name</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead className="whitespace-nowrap">Last Updated</TableHead>
                  <TableHead className="text-center">Completeness Score</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSchools.map((school) => (
                  <TableRow key={school.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-medium">{school.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getLevelBadge(school.level)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {new Date(school.lastUpdated).toLocaleDateString('en-PH', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <div
                          className={`px-3 py-1 rounded-full ${getScoreBackground(
                            school.completenessScore
                          )}`}
                        >
                          <span
                            className={`font-semibold ${getScoreColor(
                              school.completenessScore
                            )}`}
                          >
                            {school.completenessScore}%
                          </span>
                        </div>
                        {school.completenessScore >= 95 && (
                          <CheckCircle className="w-4 h-4 text-success" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/inventory?school=${school.id}`)}
                      >
                        View Inventory
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredSchools.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No schools found matching your criteria.
            </div>
          )}
          {filteredSchools.length > 0 && totalPages > 1 && (
            <TablePagination
              currentPage={schoolPage}
              totalPages={totalPages}
              totalItems={filteredSchools.length}
              onPageChange={setSchoolPage}
              itemLabel="schools"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Schools;
