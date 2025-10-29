

import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { TrackedMemberWithStats, ForecastEntry } from '../types';
import SparklesIcon from '../components/icons/SparklesIcon';

interface DashboardProps {
    membersWithUsage: TrackedMemberWithStats[];
    forecastEntries: ForecastEntry[];
}

const examplePrompts = [
    '재등록 가능성이 높은 회원은 누구인가요?',
    '가장 수익성이 높은 VIP 고객은 누구고, 어떻게 더 관리하면 좋을까요?',
    '다음 달 매출을 늘리기 위한 구체적인 전략 3가지를 제안해주세요.',
];


const Dashboard: React.FC<DashboardProps> = ({ membersWithUsage, forecastEntries }) => {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState('');

    const runAnalysis = async (userQuestion: string) => {
        if (!userQuestion.trim()) {
            setError('질문 내용을 입력해주세요.');
            return;
        }

        setLoading(true);
        setResult('');
        setError('');

        if (!process.env.API_KEY) {
            setError('API 키가 설정되지 않았습니다. 환경 변수를 확인해주세요.');
            setLoading(false);
            return;
        }
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const membersData = JSON.stringify(membersWithUsage.map(m => ({
                name: m.name,
                ltv: m.ltv,
                cumulativeTotalSessions: m.cumulativeTotalSessions,
                usedSessions: m.usedSessions,
                remainingSessions: m.cumulativeTotalSessions - m.usedSessions,
                progress: m.cumulativeTotalSessions > 0 ? `${Math.round((m.usedSessions / m.cumulativeTotalSessions) * 100)}%` : 'N/A',
                lastSessionDate: m.lastSessionDate,
            })), null, 2);

            const totalForecastRevenue = forecastEntries.reduce((acc, entry) => acc + entry.amount, 0);

            const forecastData = JSON.stringify(forecastEntries.map(f => ({
                item: f.memberName,
                revenue: f.amount,
            })), null, 2);

            const systemInstruction = `
                당신은 피트니스 센터 데이터 분석 전문가입니다. 다음 데이터를 바탕으로 사용자의 질문에 대해 한국어로 마크다운 형식의 보고서를 작성해주세요.
                답변은 항상 친절하고 전문적인 어조를 유지해야 합니다. 데이터를 기반으로 구체적이고 실행 가능한 인사이트를 제공하는 데 집중해주세요.

                **[분석에 사용할 데이터]**

                1. 회원 현황 (총 ${membersWithUsage.length}명):
                \`\`\`json
                ${membersData}
                \`\`\`

                2. 익월 예상 매출 항목 (총 예상 매출: ${totalForecastRevenue.toLocaleString()}원):
                \`\`\`json
                ${forecastData}
                \`\`\`
            `;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: userQuestion,
                config: {
                    systemInstruction: systemInstruction,
                }
            });

            setResult(response.text);

        } catch (e: unknown) {
            console.error(e);
            const errorMessage = e instanceof Error ? e.message : String(e);
            setError(`분석 중 오류가 발생했습니다: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200 space-y-6">
            <div>
                <div className="flex items-center space-x-3">
                    <SparklesIcon className="w-8 h-8 text-blue-600" />
                    <h2 className="text-2xl font-bold text-slate-800">AI 애널리틱스 대시보드</h2>
                </div>
                <p className="mt-2 text-slate-600">
                    현재 회원 데이터와 예상 매출을 바탕으로 Gemini AI가 비즈니스 개선을 위한 실행 가능한 인사이트를 제공합니다.
                </p>
            </div>
            
            <div className="space-y-4">
                 <div>
                    <h3 className="text-sm font-semibold text-slate-600 mb-2">💡 예시 질문</h3>
                    <div className="flex flex-wrap gap-2">
                        {examplePrompts.map((p, i) => (
                            <button
                                key={i}
                                onClick={() => setPrompt(p)}
                                className="bg-slate-100 text-slate-700 rounded-full px-4 py-2 text-sm hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="relative">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="AI에게 질문할 내용을 입력하세요..."
                        className="w-full p-2 text-sm border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-100 text-slate-800"
                        rows={3}
                    />
                </div>
            </div>

            <div className="text-center">
                <button
                    onClick={() => runAnalysis(prompt)}
                    disabled={loading || !prompt.trim()}
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            분석 중...
                        </>
                    ) : (
                       <>
                         <SparklesIcon className="-ml-1 mr-2 h-5 w-5" />
                         AI에게 질문하기
                       </>
                    )}
                </button>
            </div>

            {error && (
                <div className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">오류</h3>
                            <div className="mt-2 text-sm text-red-700">
                                <p>{error}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {result && !loading && (
                <div className="mt-6 prose prose-slate max-w-none p-6 bg-slate-50 rounded-lg border border-slate-200">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
                </div>
            )}
            
            {!result && !loading && !error && (
                <div className="min-h-[200px] bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 p-4 flex items-center justify-center">
                    <div className="text-center text-slate-500">
                        <SparklesIcon className="w-12 h-12 mx-auto text-slate-400 mb-2" />
                        <p className="font-semibold">AI에게 궁금한 점을 질문해보세요.</p>
                        <p className="text-sm mt-1">예시 질문을 클릭하거나, 직접 질문을 입력한 후 버튼을 눌러 분석을 시작하세요.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;