import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import logo from '@/assets/deped-logo.png';
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  FileText,
  ClipboardList,
  Users,
  Share2,
  LogOut,
  Building2,
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout, getSchoolName } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'sdo_admin';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = isAdmin
    ? [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/schools', icon: Building2, label: 'Schools' },
        { to: '/inventory', icon: Package, label: 'Inventory' },
        { to: '/transfers', icon: ArrowLeftRight, label: 'Transfers' },
        { to: '/resource-hub', icon: Share2, label: 'Resource Hub' },
        { to: '/reports', icon: FileText, label: 'Reports' },
        { to: '/audit-logs', icon: ClipboardList, label: 'Audit Logs' },
      ]
    : [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/inventory', icon: Package, label: 'Inventory' },
        { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
        { to: '/transfers', icon: Users, label: 'Transfers' },
        { to: '/resource-hub', icon: Share2, label: 'Resource Hub' },
        { to: '/reports', icon: FileText, label: 'Reports' },
      ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-sidebar flex flex-col z-50">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src={logo} alt="DepEd Logo" className="w-12 h-12" />
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-display font-bold text-sidebar-foreground leading-tight">
              Schools Division
            </h1>
            <p className="text-xs text-sidebar-foreground/70 truncate">
              City of Baliuag
            </p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="sidebar-user-block px-4 py-3 border-b border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/60 uppercase tracking-wider">
          Logged in as
        </p>
        <p className="text-sm font-medium text-sidebar-foreground truncate">
          {user?.displayName}
        </p>
        <p className="text-xs text-sidebar-primary truncate">
          {getSchoolName()}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="sidebar-item w-full text-sidebar-foreground/80 hover:text-destructive"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

