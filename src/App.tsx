/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, ComposedChart, Cell, PieChart, Pie
} from 'recharts';
import { 
  Info, Printer, RotateCcw, Database, TrendingUp, Clock, DollarSign, 
  AlertCircle, CheckCircle2, AlertTriangle, XCircle, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind class merging
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface ProjectData {
  projectName: string;
  baseDate: string;
  bac: number; // Total Budget (억원)
  totalDuration: number; // Total Days
  elapsedDays: number; // Elapsed Days
  pv: number; // Planned Value (억원)
  ev: number; // Earned Value (억원)
  ac: number; // Actual Cost (억원)
}

const initialData: ProjectData = {
  projectName: '',
  baseDate: new Date().toISOString().split('T')[0],
  bac: 0,
  totalDuration: 0,
  elapsedDays: 0,
  pv: 0,
  ev: 0,
  ac: 0,
};

const exampleData: ProjectData = {
  projectName: '서울 도심 복합시설 신축공사',
  baseDate: new Date().toISOString().split('T')[0],
  bac: 100,
  totalDuration: 365,
  elapsedDays: 150,
  pv: 40,
  ev: 35,
  ac: 42,
};

// --- Components ---

const Card = ({ children, title, icon: Icon, className }: { children: React.ReactNode, title?: string, icon?: any, className?: string }) => (
  <div className={cn("bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden", className)}>
    {title && (
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-[#1a237e]" />}
          <h3 className="font-bold text-slate-800">{title}</h3>
        </div>
      </div>
    )}
    <div className="p-5">
      {children}
    </div>
  </div>
);

const MetricItem = ({ label, value, unit, tooltip, colorClass }: { label: string, value: string | number, unit?: string, tooltip?: string, colorClass?: string }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-1 text-sm text-slate-500">
      <span>{label}</span>
      {tooltip && (
        <div className="group relative inline-block">
          <Info className="w-3.5 h-3.5 cursor-help" />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg z-50">
            {tooltip}
          </div>
        </div>
      )}
    </div>
    <div className={cn("text-xl font-bold tracking-tight", colorClass)}>
      {value}<span className="text-sm font-normal ml-1 text-slate-400">{unit}</span>
    </div>
  </div>
);

const GaugeChart = ({ value, label, min = 0.5, max = 1.5 }: { value: number, label: string, min?: number, max?: number }) => {
  const normalizedValue = Math.min(Math.max(value, min), max);
  const percentage = ((normalizedValue - min) / (max - min)) * 100;
  
  let color = "#ef4444"; // red
  if (value >= 1.0) color = "#22c55e"; // green
  else if (value >= 0.8) color = "#eab308"; // yellow

  // Gauge data for Recharts Pie
  const data = [
    { value: percentage, fill: color },
    { value: 100 - percentage, fill: "#f1f5f9" }
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-20 overflow-hidden">
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              startAngle={180}
              endAngle={0}
              innerRadius={45}
              outerRadius={60}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute bottom-0 left-0 right-0 text-center">
          <span className="text-xl font-bold" style={{ color }}>{value.toFixed(2)}</span>
        </div>
      </div>
      <span className="text-xs font-medium text-slate-500 mt-1">{label}</span>
    </div>
  );
};

export default function App() {
  const [data, setData] = useState<ProjectData>(initialData);

  // --- Calculations ---
  const metrics = useMemo(() => {
    const { pv, ev, ac, bac } = data;
    
    const sv = ev - pv;
    const spi = pv === 0 ? 0 : ev / pv;
    
    const cv = ev - ac;
    const cpi = ac === 0 ? 0 : ev / ac;
    
    const eac = cpi === 0 ? 0 : bac / cpi;
    const etc = eac - ac;
    const vac = bac - eac;
    
    // TCPI = (BAC - EV) / (BAC - AC)
    const tcpi = (bac - ac) === 0 ? 0 : (bac - ev) / (bac - ac);

    return { sv, spi, cv, cpi, eac, etc, vac, tcpi };
  }, [data]);

  const diagnosis = useMemo(() => {
    const { spi, cpi } = metrics;
    if (spi >= 1 && cpi >= 1) return { status: '양호', message: '예산 및 일정 모두 양호', color: 'bg-green-500', text: 'text-green-600', icon: CheckCircle2 };
    if (spi >= 1 && cpi < 1) return { status: '주의', message: '일정 양호, 원가 초과 위험', color: 'bg-yellow-500', text: 'text-yellow-600', icon: AlertTriangle };
    if (spi < 1 && cpi >= 1) return { status: '주의', message: '일정 지연, 원가 양호', color: 'bg-orange-500', text: 'text-orange-600', icon: AlertCircle };
    return { status: '위험', message: '일정 지연 및 원가 초과', color: 'bg-red-500', text: 'text-red-600', icon: XCircle };
  }, [metrics]);

  // S-Curve Data Generation (Enhanced with SV/CV)
  const sCurveData = useMemo(() => {
    const steps = 10;
    const currentStep = Math.floor((data.elapsedDays / (data.totalDuration || 1)) * steps) || 0;
    
    return Array.from({ length: steps + 1 }, (_, i) => {
      const ratio = i / steps;
      const planned = data.bac * ratio;
      const actual = i <= currentStep ? (data.ac / (currentStep || 1)) * i : null;
      const earned = i <= currentStep ? (data.ev / (currentStep || 1)) * i : null;
      
      const sv = earned !== null ? earned - planned : null;
      const cv = (earned !== null && actual !== null) ? earned - actual : null;
      
      return {
        name: `${Math.round(ratio * 100)}%`,
        PV: planned,
        EV: earned,
        AC: actual,
        SV: sv,
        CV: cv,
      };
    });
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const pv = payload.find((p: any) => p.dataKey === 'PV')?.value;
      const ev = payload.find((p: any) => p.dataKey === 'EV')?.value;
      const ac = payload.find((p: any) => p.dataKey === 'AC')?.value;
      const sv = payload[0]?.payload?.SV;
      const cv = payload[0]?.payload?.CV;

      return (
        <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-lg text-xs">
          <p className="font-bold text-slate-800 mb-2 border-b pb-1">진행률: {label}</p>
          <div className="space-y-1.5">
            <div className="flex justify-between gap-4">
              <span className="text-blue-600 font-medium">PV (계획):</span>
              <span className="font-bold">{Number(pv).toFixed(1)}</span>
            </div>
            {ev !== undefined && (
              <div className="flex justify-between gap-4">
                <span className="text-green-600 font-medium">EV (획득):</span>
                <span className="font-bold">{Number(ev).toFixed(1)}</span>
              </div>
            )}
            {ac !== undefined && (
              <div className="flex justify-between gap-4">
                <span className="text-red-600 font-medium">AC (실제):</span>
                <span className="font-bold">{Number(ac).toFixed(1)}</span>
              </div>
            )}
            
            {(sv !== null || cv !== null) && <div className="border-t border-slate-100 my-1 pt-1"></div>}
            
            {sv !== null && (
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">SV (일정차이):</span>
                <span className={cn("font-bold", sv >= 0 ? "text-green-600" : "text-red-600")}>
                  {sv >= 0 ? '+' : ''}{sv.toFixed(1)}
                </span>
              </div>
            )}
            {cv !== null && (
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">CV (원가차이):</span>
                <span className={cn("font-bold", cv >= 0 ? "text-green-600" : "text-red-600")}>
                  {cv >= 0 ? '+' : ''}{cv.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const loadExample = () => setData(exampleData);
  const resetData = () => setData(initialData);
  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12 print:bg-white print:p-0">
      {/* Header */}
      <header className="bg-[#1a237e] text-white py-6 px-8 shadow-lg print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">건설 프로젝트 EVM 성과분석 대시보드</h1>
              <p className="text-blue-100 text-sm opacity-80">Earned Value Management Analysis System</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={loadExample}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
            >
              <Database className="w-4 h-4" /> 예시 데이터
            </button>
            <button 
              onClick={resetData}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> 초기화
            </button>
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-white text-[#1a237e] hover:bg-blue-50 rounded-lg text-sm font-bold transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" /> 인쇄
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-4 flex flex-col gap-6 print:hidden">
          <Card title="프로젝트 기본 정보" icon={Clock}>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">프로젝트명</label>
                <input 
                  type="text" 
                  name="projectName"
                  value={data.projectName}
                  onChange={handleInputChange}
                  placeholder="프로젝트 이름을 입력하세요"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1a237e] focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">기준일자</label>
                  <input 
                    type="date" 
                    name="baseDate"
                    value={data.baseDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1a237e] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">BAC (총 사업비)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      name="bac"
                      value={data.bac || ''}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1a237e] outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">억원</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">총 공기</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      name="totalDuration"
                      value={data.totalDuration || ''}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1a237e] outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">일</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">경과일수</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      name="elapsedDays"
                      value={data.elapsedDays || ''}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1a237e] outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">일</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card title="성과 데이터" icon={DollarSign}>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">PV (계획가치)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    name="pv"
                    value={data.pv || ''}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1a237e] outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">억원</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">EV (획득가치)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    name="ev"
                    value={data.ev || ''}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1a237e] outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">억원</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">AC (실제원가)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    name="ac"
                    value={data.ac || ''}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1a237e] outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">억원</span>
                </div>
              </div>
            </div>
          </Card>

          <Card title="프로젝트 진단" icon={diagnosis.icon}>
            <div className="flex flex-col items-center text-center gap-3">
              <div className={cn("w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg animate-pulse", diagnosis.color)}>
                <diagnosis.icon className="w-10 h-10" />
              </div>
              <div>
                <h4 className={cn("text-xl font-bold", diagnosis.text)}>{diagnosis.status}</h4>
                <p className="text-slate-600 text-sm mt-1">{diagnosis.message}</p>
              </div>
              <div className="w-full grid grid-cols-3 gap-2 mt-4">
                <div className={cn("h-2 rounded-full", metrics.spi >= 1 ? "bg-green-500" : "bg-red-500")}></div>
                <div className={cn("h-2 rounded-full", metrics.cpi >= 1 ? "bg-green-500" : "bg-red-500")}></div>
                <div className={cn("h-2 rounded-full", metrics.tcpi <= 1 ? "bg-green-500" : "bg-red-500")}></div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Results & Charts */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Print Header (Hidden on screen) */}
          <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-4">
            <h1 className="text-3xl font-bold">{data.projectName || '건설 프로젝트 성과 보고서'}</h1>
            <div className="grid grid-cols-3 mt-4 text-sm">
              <p>기준일자: {data.baseDate}</p>
              <p>총 사업비: {data.bac}억원</p>
              <p>공기: {data.elapsedDays}/{data.totalDuration}일</p>
            </div>
          </div>

          {/* Performance Metrics Grid */}
          <Card title="성과 지표 분석" icon={TrendingUp}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4">
              <MetricItem 
                label="SV (일정차이)" 
                value={metrics.sv.toFixed(2)} 
                unit="억원" 
                tooltip="EV - PV: 계획 대비 획득한 가치의 차이"
                colorClass={metrics.sv >= 0 ? "text-green-600" : "text-red-600"}
              />
              <MetricItem 
                label="SPI (일정성과지수)" 
                value={metrics.spi.toFixed(2)} 
                tooltip="EV / PV: 1.0 이상이면 일정 준수"
                colorClass={metrics.spi >= 1.0 ? "text-green-600" : metrics.spi >= 0.8 ? "text-yellow-600" : "text-red-600"}
              />
              <MetricItem 
                label="CV (원가차이)" 
                value={metrics.cv.toFixed(2)} 
                unit="억원" 
                tooltip="EV - AC: 투입 원가 대비 획득한 가치의 차이"
                colorClass={metrics.cv >= 0 ? "text-green-600" : "text-red-600"}
              />
              <MetricItem 
                label="CPI (원가성과지수)" 
                value={metrics.cpi.toFixed(2)} 
                tooltip="EV / AC: 1.0 이상이면 예산 절감"
                colorClass={metrics.cpi >= 1.0 ? "text-green-600" : metrics.cpi >= 0.8 ? "text-yellow-600" : "text-red-600"}
              />
              
              <div className="col-span-full border-t border-slate-100 my-2"></div>
              
              <MetricItem 
                label="EAC (완료시추정)" 
                value={metrics.eac.toFixed(1)} 
                unit="억원" 
                tooltip="BAC / CPI: 현재 추세 유지 시 최종 예상 원가"
                colorClass="text-slate-800"
              />
              <MetricItem 
                label="ETC (잔여추정)" 
                value={metrics.etc.toFixed(1)} 
                unit="억원" 
                tooltip="EAC - AC: 완료까지 필요한 추가 예산"
                colorClass="text-slate-800"
              />
              <MetricItem 
                label="VAC (완료시차이)" 
                value={metrics.vac.toFixed(1)} 
                unit="억원" 
                tooltip="BAC - EAC: 최종 예산 대비 차이"
                colorClass={metrics.vac >= 0 ? "text-green-600" : "text-red-600"}
              />
              <MetricItem 
                label="TCPI (달성필요지수)" 
                value={metrics.tcpi.toFixed(2)} 
                tooltip="(BAC - EV) / (BAC - AC): 목표 달성을 위해 필요한 효율"
                colorClass={metrics.tcpi <= 1.0 ? "text-green-600" : "text-red-600"}
              />
            </div>
          </Card>

          {/* Visualizations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="S-Curve (누적 성과 및 차이 분석)">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={sCurveData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="right" orientation="right" fontSize={10} tickLine={false} axisLine={false} hide />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                    
                    {/* Variance Indicators as small bars */}
                    <Bar yAxisId="right" dataKey="SV" fill="#22c55e" opacity={0.2} name="SV 지표" barSize={10} />
                    <Bar yAxisId="right" dataKey="CV" fill="#ef4444" opacity={0.2} name="CV 지표" barSize={10} />

                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="PV" 
                      stroke="#3b82f6" 
                      strokeDasharray="5 5" 
                      strokeWidth={2} 
                      dot={false} 
                      name="계획가치(PV)" 
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="EV" 
                      stroke="#22c55e" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#22c55e' }} 
                      name="획득가치(EV)" 
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="AC" 
                      stroke="#ef4444" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#ef4444' }} 
                      name="실제원가(AC)" 
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="성과 지수 게이지">
              <div className="flex justify-around items-center h-64">
                <GaugeChart value={metrics.spi} label="SPI (일정)" />
                <GaugeChart value={metrics.cpi} label="CPI (원가)" />
              </div>
            </Card>
          </div>

          {/* Detailed Analysis Table */}
          <Card title="상세 분석 요약">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">구분</th>
                    <th className="px-4 py-3">현재값</th>
                    <th className="px-4 py-3">목표대비</th>
                    <th className="px-4 py-3">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <tr>
                    <td className="px-4 py-3 font-medium">공정률</td>
                    <td className="px-4 py-3">{((data.ev / (data.bac || 1)) * 100).toFixed(1)}%</td>
                    <td className="px-4 py-3">{((data.pv / (data.bac || 1)) * 100).toFixed(1)}% (계획)</td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-1 rounded-full text-[10px] font-bold uppercase", metrics.spi >= 1 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                        {metrics.spi >= 1 ? "ON TRACK" : "DELAYED"}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">원가 효율</td>
                    <td className="px-4 py-3">{metrics.cpi.toFixed(2)}</td>
                    <td className="px-4 py-3">1.00 (기준)</td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-1 rounded-full text-[10px] font-bold uppercase", metrics.cpi >= 1 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                        {metrics.cpi >= 1 ? "UNDER BUDGET" : "OVER BUDGET"}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">완료 시점 예측</td>
                    <td className="px-4 py-3">{metrics.eac.toFixed(1)} 억원</td>
                    <td className="px-4 py-3">{data.bac} 억원 (예산)</td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-1 rounded-full text-[10px] font-bold uppercase", metrics.vac >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                        {metrics.vac >= 0 ? "SURPLUS" : "DEFICIT"}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-8 mt-12 text-center text-slate-400 text-xs print:hidden">
        <p>© 2026 Construction EVM Dashboard. All rights reserved.</p>
        <p className="mt-1">본 대시보드는 프로젝트 관리 전문가(PMP) 가이드라인에 따른 표준 EVM 공식을 사용합니다.</p>
      </footer>

      {/* Print-only CSS */}
      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          main { display: block !important; margin-top: 0 !important; }
          .lg\\:col-span-8 { width: 100% !important; }
          .card { border: 1px solid #eee !important; box-shadow: none !important; break-inside: avoid; }
          header { display: none !important; }
          .recharts-responsive-container { min-height: 300px !important; }
        }
      `}</style>
    </div>
  );
}
