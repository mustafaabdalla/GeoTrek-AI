import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, unit, icon, highlight = false }) => {
  return (
    <div className={`p-4 rounded-xl border flex flex-col items-start justify-center transition-all duration-300 ${
      highlight 
        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
        : 'bg-slate-800 border-slate-700 text-slate-100'
    }`}>
      <div className="flex items-center gap-2 mb-1 opacity-80 text-sm font-medium uppercase tracking-wider">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold tracking-tight">{value}</span>
        {unit && <span className={`text-sm font-medium ${highlight ? 'text-blue-200' : 'text-slate-400'}`}>{unit}</span>}
      </div>
    </div>
  );
};

export default StatCard;