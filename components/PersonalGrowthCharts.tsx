import React, { useState, useMemo } from 'react';
import type { SalaryStatisticsData, SalaryPeriodStats } from '../types';
import ArrowUpTrendingIcon from './icons/ArrowUpTrendingIcon';

// A generic chart component to reduce boilerplate
const ChartContainer: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-inner">
        <h4 className="text-lg font-semibold text-slate-700 mb-4">{title}</h4>
        <div className="w-full h-80">
            {children}
        </div>
    </div>
);

// Helper to format large numbers
const formatNumber = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
    return num;
};

const PerformanceTrendChart: React.FC<{ data: SalaryPeriodStats[] }> = ({ data }) => {
    const width = 500;
    const height = 320;
    const margin = { top: 20, right: 50, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const maxSessions = Math.max(...data.map(d => d.totalSessionsCount), 1);
    const maxSales = Math.max(...data.map(d => d.totalSalesAmount), 1);

    const xScale = (index: number) => margin.left + (index / (data.length - 1)) * innerWidth;
    const yScaleSessions = (value: number) => margin.top + innerHeight - (value / maxSessions) * innerHeight;
    const yScaleSales = (value: number) => margin.top + innerHeight - (value / maxSales) * innerHeight;

    const sessionLinePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScaleSessions(d.totalSessionsCount)}`).join(' ');
    const salesLinePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScaleSales(d.totalSalesAmount)}`).join(' ');

    const yAxisTicksSessions = useMemo(() => Array.from({ length: 6 }, (_, i) => ({ value: (maxSessions / 5) * i, y: yScaleSessions((maxSessions / 5) * i) })), [maxSessions]);
    const yAxisTicksSales = useMemo(() => Array.from({ length: 6 }, (_, i) => ({ value: (maxSales / 5) * i, y: yScaleSales((maxSales / 5) * i) })), [maxSales]);

    return (
        <div className="relative w-full h-full">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                <line x1={margin.left} y1={height - margin.bottom} x2={width - margin.right} y2={height - margin.bottom} stroke="#d1d5db" />
                <line x1={margin.left} y1={margin.top} x2={margin.left} y2={height - margin.bottom} stroke="#d1d5db" />
                <line x1={width - margin.right} y1={margin.top} x2={width - margin.right} y2={height - margin.bottom} stroke="#d1d5db" />
                
                {yAxisTicksSessions.map(tick => (
                    <g key={`session-tick-${tick.value}`} className="text-xs text-slate-500">
                        <line x1={margin.left} y1={tick.y} x2={margin.left - 5} y2={tick.y} stroke="#d1d5db" />
                        <text x={margin.left - 8} y={tick.y} dominantBaseline="middle" textAnchor="end">{Math.round(tick.value)}</text>
                    </g>
                ))}
                <text transform={`translate(${margin.left-40}, ${height/2}) rotate(-90)`} textAnchor="middle" className="text-sm fill-blue-600 font-semibold">수업 수 (회)</text>

                {yAxisTicksSales.map(tick => (
                    <g key={`sales-tick-${tick.value}`} className="text-xs text-slate-500">
                        <line x1={width - margin.right} y1={tick.y} x2={width - margin.right + 5} y2={tick.y} stroke="#d1d5db" />
                        <text x={width - margin.right + 8} y={tick.y} dominantBaseline="middle" textAnchor="start">{formatNumber(tick.value)}</text>
                    </g>
                ))}
                 <text transform={`translate(${width - margin.right + 40}, ${height/2}) rotate(-90)`} textAnchor="middle" className="text-sm fill-green-600 font-semibold">매출액 (원)</text>

                {data.map((d, i) => ( <text key={`x-tick-${i}`} x={xScale(i)} y={height - margin.bottom + 15} textAnchor="middle" className="text-xs text-slate-500">{d.period}</text> ))}

                <path d={sessionLinePath} fill="none" stroke="#3b82f6" strokeWidth="2" />
                <path d={salesLinePath} fill="none" stroke="#16a34a" strokeWidth="2" />
                
                {data.map((d, i) => (
                     <g key={`point-group-${i}`} className="group">
                        <circle cx={xScale(i)} cy={yScaleSessions(d.totalSessionsCount)} r="8" fill="transparent" />
                        <circle cx={xScale(i)} cy={yScaleSales(d.totalSalesAmount)} r="8" fill="transparent" />
                        <circle cx={xScale(i)} cy={yScaleSessions(d.totalSessionsCount)} r="4" fill="white" stroke="#3b82f6" strokeWidth="2" />
                        <circle cx={xScale(i)} cy={yScaleSales(d.totalSalesAmount)} r="4" fill="white" stroke="#16a34a" strokeWidth="2" />
                        
                        <foreignObject x={xScale(i) - 70} y={margin.top - 20} width="140" height="60" className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <div className="bg-slate-800 text-white text-xs rounded-md p-2 shadow-lg text-center">
                                <div className="font-bold border-b border-slate-600 pb-1 mb-1">{d.period}</div>
                                <div className="text-blue-300">수업: {d.totalSessionsCount}회</div>
                                <div className="text-green-300">매출: {d.totalSalesAmount.toLocaleString()}원</div>
                            </div>
                        </foreignObject>
                    </g>
                ))}
            </svg>
            <div className="flex justify-center items-center gap-4 text-sm mt-2">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-500 rounded-sm"></div><span>총 수업 수</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-green-500 rounded-sm"></div><span>총 매출액</span></div>
            </div>
        </div>
    );
};

const SalaryCompositionChart: React.FC<{ data: SalaryPeriodStats[] }> = ({ data }) => {
    const width = 500;
    const height = 320;
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const keys: (keyof SalaryPeriodStats)[] = ['baseSalary', 'sessionIncentive', 'salesIncentive'];
    const colors = ['#64748b', '#3b82f6', '#16a34a'];

    const maxTotal = Math.max(...data.map(d => d.totalSalary), 1);
    
    const xScale = (index: number) => margin.left + (index / (data.length - 1)) * innerWidth;
    const yScale = (value: number) => margin.top + innerHeight - (value / maxTotal) * innerHeight;

    const yAxisTicks = useMemo(() => Array.from({ length: 6 }, (_, i) => ({ value: (maxTotal / 5) * i, y: yScale((maxTotal / 5) * i) })), [maxTotal]);

    const areaPaths = useMemo(() => {
        const stackedPoints = data.map(d => {
            let y0 = 0;
            return keys.map(key => {
                const y1 = y0 + (d[key] as number);
                const point = { y0, y1 };
                y0 = y1;
                return point;
            });
        });

        return keys.map((_, keyIndex) => {
            const pathTop = data.map((d, i) => `${xScale(i)},${yScale(stackedPoints[i][keyIndex].y1)}`).join('L');
            const pathBottom = [...data].reverse().map((d, i) => `${xScale(data.length - 1 - i)},${yScale(stackedPoints[data.length - 1 - i][keyIndex].y0)}`).join('L');
            return `M${pathTop}L${pathBottom}Z`;
        });
    }, [data, keys]);

    return (
        <div className="relative w-full h-full">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                <line x1={margin.left} y1={height - margin.bottom} x2={width - margin.right} y2={height - margin.bottom} stroke="#d1d5db" />
                <line x1={margin.left} y1={margin.top} x2={margin.left} y2={height - margin.bottom} stroke="#d1d5db" />

                {yAxisTicks.map(tick => (
                    <g key={`comp-tick-${tick.value}`} className="text-xs text-slate-500">
                        <line x1={margin.left} y1={tick.y} x2={margin.left - 5} y2={tick.y} stroke="#d1d5db" />
                        <text x={margin.left - 8} y={tick.y} dominantBaseline="middle" textAnchor="end">{formatNumber(tick.value)}</text>
                    </g>
                ))}
                <text transform={`translate(${margin.left-40}, ${height/2}) rotate(-90)`} textAnchor="middle" className="text-sm fill-slate-700 font-semibold">급여액 (원)</text>
                
                {data.map((d, i) => ( <text key={`x-tick-${i}`} x={xScale(i)} y={height - margin.bottom + 15} textAnchor="middle" className="text-xs text-slate-500">{d.period}</text> ))}
                
                {areaPaths.map((path, i) => <path key={i} d={path} fill={colors[i]} fillOpacity="0.7" stroke={colors[i]} strokeWidth="1" />)}

                {data.map((d, i) => (
                     <g key={`comp-point-group-${i}`} className="group">
                        <rect x={xScale(i)-10} y={margin.top} width="20" height={innerHeight} fill="transparent" />
                        <foreignObject x={xScale(i) - 75} y={margin.top - 20} width="150" height="85" className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <div className="bg-slate-800 text-white text-xs rounded-md p-2 shadow-lg">
                                <div className="font-bold border-b border-slate-600 pb-1 mb-1">{d.period}</div>
                                <div className="flex justify-between"><span>기본급:</span> <span>{d.baseSalary.toLocaleString()}</span></div>
                                <div className="flex justify-between"><span>수업:</span> <span>{d.sessionIncentive.toLocaleString()}</span></div>
                                <div className="flex justify-between"><span>매출:</span> <span>{d.salesIncentive.toLocaleString()}</span></div>
                            </div>
                        </foreignObject>
                    </g>
                ))}
            </svg>
            <div className="flex justify-center items-center gap-4 text-sm mt-2">
                 <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-[#64748b] rounded-sm"></div><span>기본급</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-[#3b82f6] rounded-sm"></div><span>수업 인센티브</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-[#16a34a] rounded-sm"></div><span>매출 인센티브</span></div>
            </div>
        </div>
    );
};

const PersonalGrowthCharts: React.FC<{ salaryStats: SalaryStatisticsData }> = ({ salaryStats }) => {
    const [activeView, setActiveView] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

    const { monthly, quarterly, yearly } = salaryStats;
    const dataMap = useMemo(() => ({ monthly, quarterly, yearly }), [monthly, quarterly, yearly]);
    
    const currentData = useMemo(() => (dataMap[activeView] || []).filter(d => d.totalSalary > 0), [activeView, dataMap]);
    
    const getButtonClass = (view: typeof activeView) => {
        return activeView === view
          ? 'bg-indigo-600 text-white shadow-md'
          : 'bg-white text-slate-600 hover:bg-indigo-50 border border-slate-300';
    };

    if (!currentData || currentData.length < 2) {
        return null;
    }

    return (
        <div className="space-y-8 mb-12 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                    <ArrowUpTrendingIcon className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-slate-800">나의 성장 그래프</h3>
                    <p className="text-slate-600 mt-1">시간에 따른 성과와 급여 구성의 변화를 시각적으로 분석합니다.</p>
                </div>
            </div>
            
            <div className="flex items-center justify-center gap-2 mb-6">
                <button onClick={() => setActiveView('monthly')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${getButtonClass('monthly')}`}>월별</button>
                <button onClick={() => setActiveView('quarterly')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${getButtonClass('quarterly')}`}>분기별</button>
                <button onClick={() => setActiveView('yearly')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${getButtonClass('yearly')}`}>연간</button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ChartContainer title="성과 지표 추이">
                    <PerformanceTrendChart data={currentData} />
                </ChartContainer>
                <ChartContainer title="급여 구성비 추이">
                    <SalaryCompositionChart data={currentData} />
                </ChartContainer>
            </div>
        </div>
    );
};

export default PersonalGrowthCharts;