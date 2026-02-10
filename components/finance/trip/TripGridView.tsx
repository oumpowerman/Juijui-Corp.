
import React from 'react';
import { ShootTrip } from '../../../types';
import TripCard from './TripCard';
import { Film } from 'lucide-react';

interface TripGridViewProps {
    trips: ShootTrip[];
    selectedTripId: string | null;
    onSelectTrip: (id: string) => void;
}

const TripGridView: React.FC<TripGridViewProps> = ({ trips, selectedTripId, onSelectTrip }) => {
    if (trips.length === 0) {
        return (
            <div className="py-20 bg-white rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
                <Film className="w-12 h-12 opacity-20 mb-2"/>
                <p>ไม่พบกองถ่าย</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trips.map(trip => (
                <TripCard 
                    key={trip.id} 
                    trip={trip} 
                    isSelected={selectedTripId === trip.id}
                    onSelect={() => onSelectTrip(trip.id)} 
                />
            ))}
        </div>
    );
};

export default TripGridView;
