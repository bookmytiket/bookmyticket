"use client";

import React, { useState } from 'react';
import { Check, ChevronRight, MapPin, Building2, Ticket, Settings, PenTool, CheckCircle2 } from 'lucide-react';
import TheatreSeatBuilder from './TheatreSeatBuilder';

const WIZARD_STEPS = [
    { id: 'identity', label: 'Identity', icon: PenTool },
    { id: 'venue', label: 'Venue', icon: Building2 },
    { id: 'logistics', label: 'Logistics', icon: MapPin },
    { id: 'seating', label: 'Seating', icon: Settings },
    { id: 'tickets', label: 'Tickets', icon: Ticket },
    { id: 'finalize', label: 'Finalize', icon: CheckCircle2 }
];

export default function EventSetupWizard() {
    const [currentStepIndex, setCurrentStepIndex] = useState(3); // Start on Seating to showcase the feature

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
            
            {/* Top Navigation / Progress Stepper */}
            <div className="w-full bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-[1400px] mx-auto px-8 py-4">
                    <div className="flex items-center justify-between">
                        
                        {/* Title */}
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Event Creation</h2>
                            <p className="text-sm font-medium text-slate-500">Drafting: Summer Music Festival 2026</p>
                        </div>

                        {/* Stepper */}
                        <div className="flex items-center gap-2">
                            {WIZARD_STEPS.map((step, index) => {
                                const isCompleted = index < currentStepIndex;
                                const isCurrent = index === currentStepIndex;
                                const isUpcoming = index > currentStepIndex;
                                
                                const Icon = step.icon;

                                return (
                                    <React.Fragment key={step.id}>
                                        <div 
                                            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all cursor-pointer ${
                                                isCurrent ? 'bg-slate-900 text-white shadow-md hover:scale-105' : 
                                                isCompleted ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100' : 
                                                'text-slate-400 hover:bg-slate-50'
                                            }`}
                                            onClick={() => setCurrentStepIndex(index)}
                                        >
                                            {isCompleted ? <Check size={16} strokeWidth={3} /> : <Icon size={16} />}
                                            <span className="text-xs font-bold tracking-wider uppercase">{step.label}</span>
                                        </div>
                                        
                                        {index < WIZARD_STEPS.length - 1 && (
                                            <div className="w-4 flex justify-center">
                                                <ChevronRight size={16} className={isCompleted ? 'text-emerald-300' : 'text-slate-300'} />
                                            </div>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <button className="text-xs font-bold text-slate-500 hover:text-slate-900 uppercase tracking-widest transition-colors">
                                Save Draft
                            </button>
                            <button 
                                className="bg-emerald-500 text-white px-6 py-2.5 rounded-full text-xs font-bold tracking-widest uppercase shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition-all hover:-translate-y-0.5"
                                onClick={() => setCurrentStepIndex(Math.min(currentStepIndex + 1, WIZARD_STEPS.length - 1))}
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dynamic Step Content Area */}
            <div className="flex-1 w-full max-w-[1400px] mx-auto pt-8">
                {currentStepIndex === 3 ? (
                    // Step 4: Seating Management (Theatre Seat Builder)
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                        <TheatreSeatBuilder />
                    </div>
                ) : (
                    // Placeholder for other steps
                    <div className="w-full flex items-center justify-center p-24 animate-in fade-in duration-300">
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                {React.createElement(WIZARD_STEPS[currentStepIndex].icon, { size: 32, className: "text-slate-400" })}
                            </div>
                            <h3 className="text-2xl font-black text-slate-800">{WIZARD_STEPS[currentStepIndex].label} Settings</h3>
                            <p className="text-slate-500 max-w-md mx-auto">
                                Configure the {WIZARD_STEPS[currentStepIndex].label.toLowerCase()} details for your event here. This section is currently a placeholder for the full product implementation.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
