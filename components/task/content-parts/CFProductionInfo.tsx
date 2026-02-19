
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Clapperboard, Video, MapPin, ChevronDown, Check, Loader2, Sparkles, Search, Map, AlertCircle } from 'lucide-react';
import { MasterOption } from '../../../types';
import { useToast } from '../../../context/ToastContext';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';
import { useMasterData } from '../../../hooks/useMasterData';

interface CFProductionInfoProps {
    shootDate: string;
    setShootDate: (val: string) => void;
    shootLocation: string;
    setShootLocation: (val: string) => void;
    masterOptions?: MasterOption[];
}

const CFProductionInfo: React.FC<CFProductionInfoProps> = ({ 
    shootDate, setShootDate, shootLocation, setShootLocation, masterOptions = []
}) => {
    const { showToast } = useToast(); // Still kept for 'create success' toast if needed
    const { showConfirm, showAlert } = useGlobalDialog();
    const { addMasterOption } = useMasterData();
    
    // Local state to store newly created options instantly without page reload
    const [newlyCreatedOptions, setNewlyCreatedOptions] = useState<MasterOption[]>([]);
    const [isCreating, setIsCreating] = useState(false);

    // Combine props options with locally created ones
    const locationOptions = useMemo(() => {
        const propOptions = masterOptions.filter(o => o.type === 'SHOOT_LOCATION' && o.isActive);
        // Merge and remove duplicates based on label
        const all = [...propOptions, ...newlyCreatedOptions];
        const unique = all.filter((obj, index, self) => 
            index === self.findIndex((t) => (t.label === obj.label))
        );
        return unique.sort((a, b) => a.label.localeCompare(b.label));
    }, [masterOptions, newlyCreatedOptions]);
    
    // Autocomplete State
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelectLocation = (loc: string) => {
        setShootLocation(loc);
        setIsDropdownOpen(false);
    };

    // --- STRICT VALIDATION ON BLUR (UPDATED) ---
    const handleInputBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        // If the focus moved to something INSIDE the dropdown (like "Create New" button), don't clear it yet.
        if (dropdownRef.current && dropdownRef.current.contains(e.relatedTarget as Node)) {
            return;
        }

        const trimmed = shootLocation.trim();
        
        // If empty, just close
        if (!trimmed) {
            setIsDropdownOpen(false);
            return;
        }

        // Check if matches any existing option (Case Insensitive)
        const match = locationOptions.find(opt => 
            opt.label.toLowerCase() === trimmed.toLowerCase()
        );

        if (match) {
            // Perfect! Snap to the official label (e.g. user typed "siam" -> becomes "Siam Paragon")
            if (shootLocation !== match.label) {
                setShootLocation(match.label);
            }
            setIsDropdownOpen(false);
        } else {
            // Invalid: User typed something that doesn't exist and clicked away
            // 1. Clear Immediately
            setShootLocation(''); 
            setIsDropdownOpen(false);

            // 2. Show Alert Dialog (Instead of Toast)
            await showAlert(
                `ไม่พบสถานที่ "${trimmed}" ในระบบฐานข้อมูล\nระบบได้ลบค่าที่กรอกออกแล้ว กรุณาเลือกจากรายการที่มี หรือกดปุ่ม "เพิ่มสถานที่ใหม่"`,
                '⚠️ ข้อมูลสถานที่ผิดพลาด'
            );
        }
    };

    const handleCreateNewLocation = async () => {
        const trimmedName = shootLocation.trim();
        if (!trimmedName) return;

        // Global Dialog Confirmation
        const confirmed = await showConfirm(
            `ต้องการเพิ่มสถานที่ใหม่ "${trimmedName}" เข้าสู่ระบบหรือไม่? \nทีมงานคนอื่นจะสามารถเลือกสถานที่นี้ได้ในอนาคต`,
            '✨ สร้าง Location ใหม่'
        );

        if (!confirmed) return;

        setIsCreating(true);
        try {
            // Generate Key (e.g. "SIAM_PARAGON")
            const generatedKey = trimmedName.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
            
            // Random color for new tag
            const colors = ['bg-indigo-100 text-indigo-700', 'bg-pink-100 text-pink-700', 'bg-orange-100 text-orange-700', 'bg-emerald-100 text-emerald-700'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];

            const newOption = {
                type: 'SHOOT_LOCATION',
                key: generatedKey.length > 2 ? generatedKey : `LOC_${Date.now()}`,
                label: trimmedName,
                color: randomColor,
                sortOrder: 99,
                isActive: true
            };

            // Use Hook instead of raw insert to ensure consistency
            const success = await addMasterOption(newOption);

            if (success) {
                // Add to local state immediately for UI update
                 const tempOption: MasterOption = {
                    id: `temp-${Date.now()}`,
                    ...newOption,
                    sortOrder: 99,
                    isActive: true
                };
                setNewlyCreatedOptions(prev => [...prev, tempOption]);
                setShootLocation(trimmedName); // Auto-select
                setIsDropdownOpen(false);
            }

        } catch (err: any) {
            console.error(err);
        } finally {
            setIsCreating(false);
        }
    };

    // Filter options based on input
    const filteredOptions = locationOptions.filter(opt => 
        opt.label.toLowerCase().includes(shootLocation.toLowerCase())
    );

    // Check if current input matches exactly any existing option
    const isExactMatch = locationOptions.some(opt => 
        opt.label.toLowerCase() === shootLocation.trim().toLowerCase()
    );

    return (
        <div className="group/container relative bg-gradient-to-br from-orange-50/80 via-white to-amber-50/80 p-6 rounded-[2rem] border border-orange-100/50 shadow-[0_8px_30px_rgba(251,146,60,0.06)] hover:shadow-[0_8px_40px_rgba(251,146,60,0.12)] transition-all duration-500 ease-out z-20 hover:border-orange-200/80">
            
            {/* Animated Background Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-100/40 to-transparent rounded-bl-full opacity-0 group-hover/container:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-100/30 rounded-tr-full opacity-0 group-hover/container:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            
            <label className="text-sm font-black text-slate-700 mb-5 uppercase tracking-tight flex items-center relative z-10">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl mr-3 shadow-lg shadow-orange-200 text-white group-hover/container:scale-110 group-hover/container:rotate-3 transition-transform duration-500">
                    <Clapperboard className="w-5 h-5" />
                </div>
                ข้อมูลการถ่ายทำ (Production Info)
            </label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                
                {/* Shoot Date Input */}
                <div className="relative group/date">
                    <label className="text-[10px] font-bold text-slate-400 mb-1.5 block uppercase tracking-wider ml-1 group-focus-within/date:text-orange-500 transition-colors">
                        วันที่ถ่าย (Date)
                    </label>
                    <div className="relative overflow-hidden rounded-2xl bg-white border-2 border-gray-100 group-focus-within/date:border-orange-300 group-focus-within/date:ring-4 group-focus-within/date:ring-orange-50 group-hover/date:border-orange-200 transition-all duration-300 shadow-sm">
                        <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center bg-gray-50 border-r border-gray-100 group-focus-within/date:bg-orange-50 group-focus-within/date:border-orange-100 transition-colors">
                            <Video className="w-5 h-5 text-gray-400 group-focus-within/date:text-orange-500 transition-colors" />
                        </div>
                        <input 
                            type="date" 
                            value={shootDate} 
                            onChange={(e) => setShootDate(e.target.value)} 
                            className="w-full pl-14 pr-4 py-3.5 bg-transparent outline-none text-sm font-bold text-slate-700 cursor-pointer" 
                        />
                    </div>
                </div>

                {/* Location Autocomplete */}
                <div ref={dropdownRef} className="relative group/loc z-50">
                    <label className="text-[10px] font-bold text-slate-400 mb-1.5 block uppercase tracking-wider ml-1 group-focus-within/loc:text-indigo-500 transition-colors">
                        สถานที่ (Location)
                    </label>
                    
                    <div className="relative overflow-visible">
                        <div className="relative z-10 rounded-2xl bg-white border-2 border-gray-100 group-focus-within/loc:border-indigo-300 group-focus-within/loc:ring-4 group-focus-within/loc:ring-indigo-50 group-hover/loc:border-indigo-200 transition-all duration-300 shadow-sm flex items-center">
                             <div className="shrink-0 w-12 h-[50px] flex items-center justify-center bg-gray-50 border-r border-gray-100 group-focus-within/loc:bg-indigo-50 group-focus-within/loc:border-indigo-100 transition-colors rounded-l-[14px]">
                                <MapPin className={`w-5 h-5 transition-colors ${isDropdownOpen ? 'text-indigo-600' : 'text-gray-400 group-focus-within/loc:text-indigo-500'}`} />
                            </div>
                            <input 
                                type="text" 
                                value={shootLocation} 
                                onChange={(e) => {
                                    setShootLocation(e.target.value);
                                    setIsDropdownOpen(true);
                                }}
                                onFocus={() => setIsDropdownOpen(true)}
                                onBlur={handleInputBlur} // Strict Check Logic Here
                                className="flex-1 pl-3 pr-10 py-3.5 bg-transparent outline-none text-sm font-bold text-slate-700 placeholder:text-gray-300 placeholder:font-medium" 
                                placeholder="พิมพ์เพื่อค้นหา..."
                                disabled={isCreating}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 transition-transform duration-300">
                                {isCreating ? <Loader2 className="w-4 h-4 animate-spin text-indigo-500"/> : <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-indigo-500' : ''}`} />}
                            </div>
                        </div>

                        {/* Enhanced Dropdown Menu */}
                        {isDropdownOpen && (
                            <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white rounded-2xl shadow-xl shadow-indigo-900/10 border border-gray-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-300 origin-top">
                                
                                {filteredOptions.length > 0 ? (
                                    <>
                                        <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-4 py-2.5 border-b border-gray-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                                            <Search className="w-3 h-3 mr-1.5" /> พบ {filteredOptions.length} สถานที่
                                        </div>
                                        <div className="p-1.5 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                                            {filteredOptions.map(opt => (
                                                <button
                                                    key={opt.key}
                                                    type="button"
                                                    onMouseDown={() => handleSelectLocation(opt.label)} 
                                                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-between group/item mb-0.5 ${
                                                        shootLocation === opt.label 
                                                        ? 'bg-indigo-50 text-indigo-700' 
                                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:pl-4'
                                                    }`}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <Map className="w-3.5 h-3.5 opacity-40 group-hover/item:opacity-100 group-hover/item:text-indigo-500 transition-all" />
                                                        {opt.label}
                                                    </span>
                                                    {shootLocation === opt.label && <Check className="w-4 h-4 text-indigo-600" />}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="p-6 text-center flex flex-col items-center text-gray-400">
                                        <div className="p-3 bg-gray-50 rounded-full mb-2">
                                            <MapPin className="w-6 h-6 opacity-30" />
                                        </div>
                                        <span className="text-xs font-medium">ไม่พบ "{shootLocation}"</span>
                                    </div>
                                )}

                                {/* Create New Option Button */}
                                {shootLocation.trim() !== '' && !isExactMatch && (
                                    <div className="p-2 border-t border-gray-100 bg-gray-50/50 sticky bottom-0 backdrop-blur-sm">
                                        <button
                                            type="button"
                                            onMouseDown={(e) => {
                                                e.preventDefault(); 
                                                handleCreateNewLocation();
                                            }}
                                            disabled={isCreating}
                                            className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-200 active:scale-95 group/btn"
                                        >
                                            <Sparkles className="w-3.5 h-3.5 text-yellow-300 group-hover/btn:animate-spin" />
                                            เพิ่มสถานที่ใหม่: <span className="underline decoration-white/30 decoration-2 underline-offset-2">"{shootLocation}"</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CFProductionInfo;
