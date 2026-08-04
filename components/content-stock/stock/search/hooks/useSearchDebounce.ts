import { useState, useEffect } from 'react';

export function useSearchDebounce(searchQuery: string, setSearchQuery: (val: string) => void) {
    const [localSearch, setLocalSearch] = useState(searchQuery);

    // Sync local state if parent prop changes externally (e.g. clear filters)
    useEffect(() => {
        setLocalSearch(searchQuery);
    }, [searchQuery]);

    // Debounce effect
    useEffect(() => {
        const handler = setTimeout(() => {
            if (localSearch !== searchQuery) {
                setSearchQuery(localSearch);
            }
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [localSearch, setSearchQuery, searchQuery]);

    return {
        localSearch,
        setLocalSearch
    };
}
