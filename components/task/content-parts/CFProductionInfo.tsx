
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Clapperboard, Video, MapPin, ChevronDown, Check, Plus, Loader2, Sparkles, Search, Map } from 'lucide-react';
import { MasterOption } from '../../../types';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';

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
    const { showToast } = useToast();
    const { showConfirm } = useGlobalDialog();
    
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
                key: generatedKey.length > 2 ? generatedKey : `LOC_${Date.now()}`, // Fallback key if name is weird
                label: trimmedName,
                color: randomColor,
                sort_order: 99,
                is_active: true
            };

            const { data, error } = await supabase
                .from('master_options')
                .insert(newOption)
                .select()
                .single();

            if (error) throw error;

            // Update Local State to reflect immediately
            if (data) {
                const mappedOption: MasterOption = {
                    id: data.id,
                    type: data.type,
                    key: data.key,
                    label: data.label,
                    color: data.color,
                    sortOrder: data.sort_order,
                    isActive: data.is_active
                };
                setNewlyCreatedOptions(prev => [...prev, mappedOption]);
                setShootLocation(mappedOption.label); // Auto-select
                setIsDropdownOpen(false);
                showToast(`เพิ่มสถานที่ "${trimmedName}" เรียบร้อย ✅`, 'success');
            }

        } catch (err: any) {
            console.error(err);
            showToast('เพิ่มสถานที่ไม่ได้: ' + err.message, 'error');
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
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-5 rounded-[1.8rem] border border-orange-100 relative shadow-sm group hover:border-orange-200 transition-all z-20">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-40 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none"></div>
            
            <label className="block text-sm font-black text-orange-800 mb-4 uppercase tracking-tight flex items-center relative z-10">
                <Clapperboard className="w-5 h-5 mr-2 text-orange-600" /> 
                ข้อมูลการถ่ายทำ (Production Info)
            </label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
                {/* Shoot Date */}
                <div className="relative">
                    <label className="text-[10px] font-bold text-orange-700/70 mb-1.5 block uppercase tracking-wider ml-1">วันที่ถ่าย (Date)</label>
                    <div className="relative group/date">
                        <div className="absolute inset-0 bg-white rounded-xl shadow-sm border-2 border-orange-100 group-hover/date:border-orange-300 transition-colors"></div>
                        <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400 group-focus-within/date:text-orange-600 transition-colors z-10" />
                        <input 
                            type="date" 
                            value={shootDate} 
                            onChange={(e) => setShootDate(e.target.value)} 
                            className="w-full pl-10 pr-4 py-3 bg-transparent relative z-10 outline-none text-sm font-bold text-gray-700 cursor-pointer" 
                        />
                    </div>
                </div>

                {/* Location Autocomplete (Higher Z-Index to overlap bottom content) */}
                <div ref={dropdownRef} className="relative z-50">
                    <label className="text-[10px] font-bold text-orange-700/70 mb-1.5 block uppercase tracking-wider ml-1">สถานที่ (Location)</label>
                    <div className="relative group/loc">
                        <div className="absolute inset-0 bg-white rounded-xl shadow-sm border-2 border-orange-100 group-hover/loc:border-orange-300 transition-colors"></div>
                        <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors z-10 ${isDropdownOpen ? 'text-indigo-500' : 'text-orange-400'}`} />
                        <input 
                            type="text" 
                            value={shootLocation} 
                            onChange={(e) => {
                                setShootLocation(e.target.value);
                                setIsDropdownOpen(true);
                            }}
                            onFocus={() => setIsDropdownOpen(true)}
                            className="w-full pl-10 pr-10 py-3 bg-transparent relative z-10 outline-none text-sm font-bold text-gray-700 placeholder:text-gray-300 placeholder:font-normal" 
                            placeholder="พิมพ์เพื่อค้นหา..."
                            disabled={isCreating}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-orange-300 z-10">
                             {isCreating ? <Loader2 className="w-4 h-4 animate-spin text-indigo-500"/> : <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-indigo-500' : ''}`} />}
                        </div>

                        {/* Enhanced Dropdown Menu */}
                        {isDropdownOpen && (
                            <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white rounded-2xl shadow-xl border border-indigo-100 max-h-64 overflow-y-auto z-[100] animate-in fade-in slide-in-from-top-2 duration-200 scrollbar-thin scrollbar-thumb-orange-100 scrollbar-track-transparent">
                                
                                {filteredOptions.length > 0 ? (
                                    <>
                                        <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-4 py-2 border-b border-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center">
                                            <Search className="w-3 h-3 mr-1.5" /> พบ {filteredOptions.length} สถานที่
                                        </div>
                                        <div className="p-1.5">
                                            {filteredOptions.map(opt => (
                                                <button
                                                    key={opt.key}
                                                    type="button"
                                                    onClick={() => handleSelectLocation(opt.label)}
                                                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-between group/item mb-0.5 ${
                                                        shootLocation === opt.label 
                                                        ? 'bg-indigo-50 text-indigo-700' 
                                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                    }`}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <Map className="w-3.5 h-3.5 opacity-50 group-hover/item:opacity-100 group-hover/item:text-indigo-500 transition-opacity" />
                                                        {opt.label}
                                                    </span>
                                                    {shootLocation === opt.label && <Check className="w-4 h-4 text-indigo-600" />}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="p-8 text-center flex flex-col items-center text-gray-400">
                                        <MapPin className="w-10 h-10 mb-2 opacity-20" />
                                        <span className="text-xs">ไม่พบสถานที่ "{shootLocation}"</span>
                                    </div>
                                )}

                                {/* Create New Option Button */}
                                {shootLocation.trim() !== '' && !isExactMatch && (
                                    <div className="p-2 border-t border-gray-100 bg-gray-50/50 sticky bottom-0">
                                        <button
                                            type="button"
                                            onClick={handleCreateNewLocation}
                                            disabled={isCreating}
                                            className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2 shadow-md active:scale-95"
                                        >
                                            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                                            เพิ่มสถานที่ใหม่: "{shootLocation}"
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
