import React, { useState, useMemo } from 'react';
import { MasterOption } from '../../../../types';
import { useGlobalDialog } from '../../../../context/GlobalDialogContext';

// Modular Sub-components & Utils
import { GeoLocationItem, parseLocationKey, getOverlappingPairs } from './location/locationUtils';
import { LocationForm } from './location/LocationForm';
import { LocationDirectoryList } from './location/LocationDirectoryList';

interface LocationMasterViewProps {
    masterOptions: MasterOption[];
    onAdd: (option: Omit<MasterOption, 'id'>) => Promise<boolean>;
    onUpdate: (option: MasterOption) => Promise<boolean>;
    onDelete: (id: string) => void;
    type: 'WORK_LOCATION' | 'SHOOT_LOCATION';
}

const LocationMasterView: React.FC<LocationMasterViewProps> = ({ 
    masterOptions, onAdd, onUpdate, onDelete, type
}) => {
    const { showAlert, showConfirm } = useGlobalDialog();
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [lat, setLat] = useState('13.7563');
    const [lng, setLng] = useState('100.5018');
    const [radius, setRadius] = useState('100');
    const [isLocating, setIsLocating] = useState(false);
    const [smartInput, setSmartInput] = useState('');
    const [parseSuccess, setParseSuccess] = useState(false);

    // Advanced Filter & Search States
    const [searchQuery, setSearchQuery] = useState('');
    const [radiusFilter, setRadiusFilter] = useState<'ALL' | 'NARROW' | 'MEDIUM' | 'WIDE'>('ALL');
    const [alertFilter, setAlertFilter] = useState<'ALL' | 'ONLY_OVERLAPS'>('ALL');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    // Filter relevant options by type (WORK_LOCATION or SHOOT_LOCATION)
    const locations = useMemo(() => {
        return masterOptions.filter(o => o.type === type);
    }, [masterOptions, type]);

    // Parse locations for math & overlap check
    const parsedGeoLocations = useMemo<GeoLocationItem[]>(() => {
        return locations.map(loc => {
            const { lat: lLat, lng: lLng, radius: lRad } = parseLocationKey(loc.key);
            return {
                id: loc.id,
                label: loc.label,
                lat: lLat,
                lng: lLng,
                radius: lRad,
                type: loc.type
            };
        });
    }, [locations]);

    // Duplicates and Overlap Lists
    const duplicateAndOverlapsInfo = useMemo(() => {
        const dupNames = new Set<string>();
        const nameCount: Record<string, number> = {};

        // Find duplicate names
        locations.forEach(loc => {
            const norm = loc.label.trim().toLowerCase();
            nameCount[norm] = (nameCount[norm] || 0) + 1;
        });
        locations.forEach(loc => {
            if (nameCount[loc.label.trim().toLowerCase()] > 1) {
                dupNames.add(loc.id);
            }
        });

        // Find overlapping pairs
        const overlaps = getOverlappingPairs(parsedGeoLocations);
        const overlapIds = new Set<string>();
        overlaps.forEach(pair => {
            overlapIds.add(pair.item1.id);
            overlapIds.add(pair.item2.id);
        });

        return {
            duplicateNamesIds: dupNames,
            overlappingIds: overlapIds,
            allWarningsIds: new Set([...dupNames, ...overlapIds])
        };
    }, [locations, parsedGeoLocations]);

    // Filtered list matching search + smart filters
    const filteredLocations = useMemo(() => {
        return locations.filter(loc => {
            // 1. Text Search
            const matchesSearch = loc.label.toLowerCase().includes(searchQuery.toLowerCase());
            if (!matchesSearch) return false;

            const { radius: lRad } = parseLocationKey(loc.key);

            // 2. Radius Filter
            if (radiusFilter === 'NARROW' && lRad > 150) return false;
            if (radiusFilter === 'MEDIUM' && (lRad <= 150 || lRad > 300)) return false;
            if (radiusFilter === 'WIDE' && lRad <= 300) return false;

            // 3. Warning / Overlap Filter
            if (alertFilter === 'ONLY_OVERLAPS') {
                return duplicateAndOverlapsInfo.allWarningsIds.has(loc.id);
            }

            return true;
        });
    }, [locations, searchQuery, radiusFilter, alertFilter, duplicateAndOverlapsInfo]);

    // Map other items layer (excluding currently editing element to avoid overlaps visual)
    const mapOtherLocations = useMemo(() => {
        return parsedGeoLocations.filter(loc => loc.id !== editingId);
    }, [parsedGeoLocations, editingId]);

    // Handler to focus map on a saved coordinate point
    const handleFocusOnMap = (loc: MasterOption) => {
        const { lat: lLat, lng: lLng, radius: lRad } = parseLocationKey(loc.key);
        setLat(lLat.toFixed(6));
        setLng(lLng.toFixed(6));
        setRadius(lRad.toString());
        
        // If not in editing, open preset values to let them see easily
        setName(loc.label);
    };

    const handleEdit = (opt: MasterOption) => {
        setEditingId(opt.id);
        setName(opt.label);
        
        const { lat: lLat, lng: lLng, radius: lRad } = parseLocationKey(opt.key);
        setLat(lLat ? lLat.toFixed(6) : '13.7563');
        setLng(lLng ? lLng.toFixed(6) : '100.5018');
        setRadius(lRad ? lRad.toString() : '100');
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditingId(null);
        setName('');
        setLat('13.7563');
        setLng('100.5018');
        setRadius('100');
        setSmartInput('');
        setParseSuccess(false);
    };

    const handleSmartParse = (val: string) => {
        setSmartInput(val);
        if (!val.trim()) return;

        // Matches coordinates like: 13.736717,100.560544 or 13.736717, 100.560544
        const coordsRegex = /(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/;
        const match = val.match(coordsRegex);
        if (match) {
            const parsedLat = parseFloat(match[1]);
            const parsedLng = parseFloat(match[2]);
            if (parsedLat >= -90 && parsedLat <= 90 && parsedLng >= -180 && parsedLng <= 180) {
                setLat(parsedLat.toFixed(6));
                setLng(parsedLng.toFixed(6));
                setParseSuccess(true);
                setTimeout(() => setParseSuccess(false), 2000);
                return;
            }
        }
    };

    const getCurrentLocation = () => {
        setIsLocating(true);
        if (!navigator.geolocation) {
            showAlert('เบราว์เซอร์นี้ไม่รองรับระบบดึงพิกัด Geolocation');
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
                showAlert('ไม่สามารถระบุพิกัดได้: ' + err.message);
                setIsLocating(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name.trim()) {
            showAlert('กรุณากรอกระบุชื่อสถานที่ก่อนบันทึกครับ');
            return;
        }

        const numLat = parseFloat(lat);
        const numLng = parseFloat(lng);
        if (isNaN(numLat) || isNaN(numLng)) {
            showAlert('กรุณาระบุละติจูด (Latitude) และลองจิจูด (Longitude) เป็นตัวเลขที่ถูกต้อง');
            return;
        }

        const isDuplicateName = locations.some(l => 
            l.id !== editingId && 
            l.label.trim().toLowerCase() === name.trim().toLowerCase()
        );

        if (isDuplicateName) {
            showAlert(`ชื่อสถานที่ "${name}" มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่นหรือเข้าไปแก้ไขรายการที่มีอยู่ครับ`);
            return;
        }

        const compositeKey = `${numLat.toFixed(6)},${numLng.toFixed(6)},${radius}`;

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
                type: type,
                label: name,
                key: compositeKey,
                color: type === 'WORK_LOCATION' ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-600',
                sortOrder: locations.length + 1,
                isActive: true
            });
        }
        handleCancel();
    };

    const isOffice = type === 'WORK_LOCATION';

    return (
        <div className="space-y-6 font-sans">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* 1. Left Form and Maps Panel (Span 5) */}
                <div className="lg:col-span-5 space-y-6">
                    <LocationForm
                        isEditing={isEditing}
                        isOffice={isOffice}
                        type={type}
                        name={name}
                        setName={setName}
                        lat={lat}
                        setLat={setLat}
                        lng={lng}
                        setLng={setLng}
                        radius={radius}
                        setRadius={setRadius}
                        isLocating={isLocating}
                        smartInput={smartInput}
                        parseSuccess={parseSuccess}
                        handleSmartParse={handleSmartParse}
                        getCurrentLocation={getCurrentLocation}
                        onSubmit={handleSubmit}
                        onCancel={handleCancel}
                        mapOtherLocations={mapOtherLocations}
                    />
                </div>

                {/* 2. Right Directory List Section (Span 7) */}
                <LocationDirectoryList
                    isOffice={isOffice}
                    locations={locations}
                    filteredLocations={filteredLocations}
                    duplicateAndOverlapsInfo={duplicateAndOverlapsInfo}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    radiusFilter={radiusFilter}
                    setRadiusFilter={setRadiusFilter}
                    alertFilter={alertFilter}
                    setAlertFilter={setAlertFilter}
                    showAdvancedFilters={showAdvancedFilters}
                    setShowAdvancedFilters={setShowAdvancedFilters}
                    editingId={editingId}
                    handleFocusOnMap={handleFocusOnMap}
                    handleEdit={handleEdit}
                    onDelete={onDelete}
                />
            </div>
        </div>
    );
};

export default LocationMasterView;
