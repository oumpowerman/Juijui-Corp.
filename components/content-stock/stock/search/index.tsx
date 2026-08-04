import React, { useRef, useState, useEffect } from 'react';
import { Task } from '../../../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchDebounce } from './hooks/useSearchDebounce';
import { useServerTags } from './hooks/useServerTags';
import { SearchInput } from './components/SearchInput';
import { TagSuggestionsDropdown } from './components/TagSuggestionsDropdown';
import { PopularTagsHoverTooltip } from './components/PopularTagsHoverTooltip';

interface SearchWithSuggestionsProps {
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    tasks: Task[];
    showPopularTagsInline?: boolean;
    activeFilters?: {
        status?: string[];
        channelId?: string[];
        format?: string[];
        pillar?: string[];
        category?: string[];
        contentSubTab?: 'ACTIVE' | 'ARCHIVE';
        showStockOnly?: boolean;
        onlyOverdue?: boolean;
        onlyMissingStorage?: boolean;
        hasShootDate?: boolean;
        shootDateStart?: string;
        shootDateEnd?: string;
    };
}

export const SearchWithSuggestions: React.FC<SearchWithSuggestionsProps> = React.memo(({
    searchQuery,
    setSearchQuery,
    tasks,
    showPopularTagsInline = true,
    activeFilters
}) => {
    const { localSearch, setLocalSearch } = useSearchDebounce(searchQuery, setSearchQuery);
    
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    const {
        top10Tags,
        filteredTags,
        isSearchingTags,
        searchSpeedMs,
        currentTagTypeMatch,
        filterKeyword,
        dataSource
    } = useServerTags(localSearch, tasks, activeFilters, showSuggestions);

    const handleTagSuggestionClick = (tagName: string) => {
        const tagTypeMatch = localSearch.match(/#(\S*)$/);
        if (tagTypeMatch) {
            const startIndex = localSearch.lastIndexOf('#');
            const cleanPrefix = localSearch.substring(0, startIndex);
            setLocalSearch(`${cleanPrefix}#${tagName} `);
        } else {
            const prefix = localSearch.trim() ? `${localSearch.trim()} ` : '';
            setLocalSearch(`${prefix}#${tagName} `);
        }
    };

    const handleHashClickInside = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!localSearch.startsWith('#')) {
            setLocalSearch('#' + localSearch);
        } else if (localSearch === '#') {
            setLocalSearch('');
        }
    };

    // Close suggestion box when clicking outside search area
    useEffect(() => {
        function handleSearchClickOutside(event: MouseEvent) {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleSearchClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleSearchClickOutside);
        };
    }, []);

    return (
        <div 
            className="flex-1 flex flex-col relative" 
            ref={searchContainerRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <motion.div layout className={`relative w-full group ${showSuggestions ? 'z-[101]' : 'z-10'}`}>
                <SearchInput 
                    value={localSearch}
                    onChange={setLocalSearch}
                    onFocus={() => setShowSuggestions(true)}
                    showSuggestions={showSuggestions}
                    onHashClick={handleHashClickInside}
                    onClear={() => setLocalSearch('')}
                />

                <AnimatePresence>
                    {showSuggestions && (
                        <TagSuggestionsDropdown 
                            filterKeyword={filterKeyword}
                            filteredTags={filteredTags}
                            isSearchingTags={isSearchingTags}
                            searchSpeedMs={searchSpeedMs}
                            onSelectTag={handleTagSuggestionClick}
                            onClose={() => setShowSuggestions(false)}
                            currentTagTypeMatch={currentTagTypeMatch}
                            dataSource={dataSource}
                        />
                    )}
                </AnimatePresence>
            </motion.div>

            <AnimatePresence>
                {isHovered && !showSuggestions && top10Tags.length > 0 && showPopularTagsInline && (
                    <PopularTagsHoverTooltip 
                        top10Tags={top10Tags}
                        localSearch={localSearch}
                        onSelectTag={handleTagSuggestionClick}
                        dataSource={dataSource}
                    />
                )}
            </AnimatePresence>
        </div>
    );
});

export default SearchWithSuggestions;
