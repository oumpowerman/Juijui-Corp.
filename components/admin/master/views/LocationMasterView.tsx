
import React, { useState, useMemo } from 'react';
import { MasterOption } from '../../../../types';
import { MapPin, Crosshair, Plus, Trash2, Edit2, Save, X, AlertTriangle } from 'lucide-react';
import { useGlobalDialog } from '../../../../context/GlobalDialogContext';

interface LocationMasterViewProps {
    masterOptions: MasterOption[];
    onAdd: (option: Omit<MasterOption, 'id'>) => Promise<boolean>;
    onUpdate: (option: MasterOption) => Promise<boolean>;
    onDelete: (id: string) => void;
}

const LocationMasterView: React.FC<LocationMasterViewProps> = ({ 
    masterOptions, onAdd, onUpdate, onDelete 
}) => {
    const { showAlert } = useGlobalDialog();
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [lat, setLat] = useState('');
    const [lng, setLng] = useState('');
    const [radius, setRadius] = useState('500');
    const [isLocating, setIsLocating] = useState(false);

    // Filter relevant options (Type = 'WORK_LOCATION' or 'SHOOT_LOCATION')
    const locations = masterOptions.filter(o => o.type === 'WORK_LOCATION' || o.type === 'SHOOT_LOCATION');

    // --- DUPLICATE DETECTION LOGIC ---
    const duplicateGroups = useMemo(() => {
        const groups: Record<string, string[]> = {};
        const duplicates: Set<string> = new Set();

        locations.forEach(loc => {
            const normalized = loc.label.trim().toLowerCase();
            if (!groups[normalized]) groups[normalized] = [];
            groups[normalized].push(loc.id);
        });

        Object.values(groups).forEach(ids => {
            if (ids.length > 1) {
                ids.forEach(id => duplicates.add(id));
            }
        });

        return duplicates;
    }, [locations]);

    const handleEdit = (opt: MasterOption) => {
        setEditingId(opt.id);
        setName(opt.label);
        
        // Parse key: "lat,lng,radius"
        const parts = opt.key.split(',');
        if (parts.length >= 2) {
            setLat(parts[0]);
            setLng(parts[1]);
            setRadius(parts[2] || '500');
        } else {
            // Fallback if key is not coordinate format
            setLat('');
            setLng('');
            setRadius('500');
        }
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditingId(null);
        setName('');
        setLat('');
        setLng('');
        setRadius('500');
    };

    const getCurrentLocation = () => {
        setIsLocating(true);
        if (!navigator.geolocation) {
            showAlert('Browser ไม่รองรับ Geolocation');
            setIsLocating(false);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLat(pos.coords.latitude.toFixed(6));
                setLng(pos.coords.longitude.toFixed(6));
                setIsLocating(false);
            },
            (err) => {
                showAlert('ไม่สามารถระบุตำแหน่งได้: ' + err.message);
                setIsLocating(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation
        if (!name.trim()) {
            showAlert('กรุณากรอกชื่อสถานที่');
            return;
        }

        // Check for duplicates (Client-side pre-check)
        const isDuplicateName = locations.some(l => 
            l.id !== editingId && 
            l.label.trim().toLowerCase() === name.trim().toLowerCase()
        );

        if (isDuplicateName) {
            showAlert(`ชื่อสถานที่ "${name}" มีอยู่แล้วในระบบ กรุณาใช้ชื่ออื่นหรือแก้ไขรายการเดิม`);
            return;
        }

        // Store coords in KEY field for simplicity: "lat,lng,radius"
        // If lat/lng empty, generate a unique random key to prevent constraint error
        const compositeKey = (lat && lng) 
            ? `${lat},${lng},${radius}` 
            : `LOC_${Date.now()}`;

        if (editingId) {
             const existing = locations.find(l => l.id === editingId);
             if (existing) {
                 await onUpdate({
                     ...existing,
                     label: name,
                     key: compositeKey
                 });
             }
        } else {
            await onAdd({
                type: 'SHOOT_LOCATION', // Default to SHOOT_LOCATION for new adds here
                label: name,
                key: compositeKey,
                color: 'bg-indigo-100 text-indigo-600', // Default color
                sortOrder: locations.length + 1,
                isActive: true
            });
        }
        handleCancel();
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2">
            
            {/* Form Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 h-fit">
                <h3 className="font-bold text-gray-800 flex items-center mb-4">
                    {isEditing ? <Edit2 className="w-5 h-5 mr-2 text-indigo-600"/> : <Plus className="w-5 h-5 mr-2 text-indigo-600"/>}
                    {isEditing ? 'แก้ไขพิกัด' : 'เพิ่มสถานที่ใหม่'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">ชื่อสถานที่ (Name)</label>
                        <input 
                            type="text" 
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-100"
                            placeholder="เช่น สตูดิโอ A, สยามพารากอน"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            autoFocus={!isEditing}
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Latitude</label>
                            <input 
                                type="number" 
                                step="any"
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono text-gray-600 outline-none"
                                value={lat}
                                onChange={e => setLat(e.target.value)}
                                placeholder="13.xxxx"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Longitude</label>
                            <input 
                                type="number" 
                                step="any"
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono text-gray-600 outline-none"
                                value={lng}
                                onChange={e => setLng(e.target.value)}
                                placeholder="100.xxxx"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">รัศมี (เมตร)</label>
                        <input 
                            type="number" 
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none"
                            value={radius}
                            onChange={e => setRadius(e.target.value)}
                        />
                    </div>

                    <div className="pt-2 flex flex-col gap-2">
                         <button 
                            type="button"
                            onClick={getCurrentLocation}
                            disabled={isLocating}
                            className="w-full py-2 bg-orange-50 text-orange-600 border border-orange-100 rounded-xl text-xs font-bold hover:bg-orange-100 transition-all flex items-center justify-center gap-2"
                        >
                            <Crosshair className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} /> ดึงพิกัดปัจจุบัน
                        </button>
                        
                        <div className="flex gap-2">
                             {isEditing && (
                                <button 
                                    type="button"
                                    onClick={handleCancel}
                                    className="flex-1 py-2.5 bg-gray-100 text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all"
                                >
                                    ยกเลิก
                                </button>
                             )}
                             <button 
                                type="submit"
                                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                            >
                                {isEditing ? 'บันทึกการแก้ไข' : 'เพิ่มสถานที่'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* List Section */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700 flex items-center">
                        <MapPin className="w-4 h-4 mr-2" /> รายชื่อสถานที่ ({locations.length})
                    </h3>
                    {duplicateGroups.size > 0 && (
                        <span className="text-xs font-bold text-red-500 flex items-center bg-red-50 px-2 py-1 rounded-lg">
                            <AlertTriangle className="w-3 h-3 mr-1" /> พบข้อมูลซ้ำ {duplicateGroups.size} รายการ
                        </span>
                    )}
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[600px]">
                    {locations.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            ยังไม่มีสถานที่ (ระบบจะใช้ออฟฟิศหลักเป็น Default)
                        </div>
                    ) : (
                        locations.map(loc => {
                            const [lLat, lLng, lRad] = loc.key.includes(',') ? loc.key.split(',') : ['-','-','-'];
                            const isDuplicate = duplicateGroups.has(loc.id);

                            return (
                                <div 
                                    key={loc.id} 
                                    className={`
                                        flex items-center justify-between p-4 rounded-xl border transition-all group bg-white
                                        ${isDuplicate ? 'border-red-300 ring-2 ring-red-100 bg-red-50/10' : 'border-gray-100 hover:border-indigo-200 hover:shadow-md'}
                                    `}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-full mt-1 ${isDuplicate ? 'bg-red-100 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-gray-800 text-base">{loc.label}</h4>
                                                {isDuplicate && <span className="text-[9px] font-bold text-white bg-red-500 px-1.5 rounded">DUPLICATE</span>}
                                                <span className="text-[9px] text-gray-400 border border-gray-200 px-1.5 rounded bg-gray-50">{loc.type}</span>
                                            </div>
                                            
                                            <div className="text-xs text-gray-500 mt-1 font-mono flex gap-2">
                                                <span className="bg-gray-100 px-1.5 rounded">Lat: {lLat}</span>
                                                <span className="bg-gray-100 px-1.5 rounded">Lng: {lLng}</span>
                                            </div>
                                            <span className="text-[10px] text-orange-500 font-bold mt-1 block">รัศมี: {lRad || 500} เมตร</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => handleEdit(loc)}
                                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => { if(confirm(`ลบสถานที่ "${loc.label}" นี้?`)) onDelete(loc.id); }}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default LocationMasterView;
