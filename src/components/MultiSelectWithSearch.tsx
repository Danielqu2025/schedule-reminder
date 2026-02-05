import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronDown } from 'lucide-react';
import './MultiSelectWithSearch.css';

export interface MultiSelectOption {
  id: string | number;
  label: string;
  avatar?: string;
  [key: string]: unknown;
}

export interface MultiSelectWithSearchProps {
  options: MultiSelectOption[];
  selected: MultiSelectOption[];
  onChange: (selected: MultiSelectOption[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  noResultsText?: string;
  displayValue?: (option: MultiSelectOption) => string;
  searchable?: boolean;
  maxSelections?: number;
  disabled?: boolean;
  isLoading?: boolean;
  debounceMs?: number;
  renderOption?: (option: MultiSelectOption, isSelected: boolean) => React.ReactNode;
}

export function MultiSelectWithSearch({
  options = [],
  selected = [],
  onChange,
  placeholder = 'Select options',
  searchPlaceholder = 'Search...',
  noResultsText = 'No results found',
  displayValue = (option) => option.label,
  searchable = true,
  maxSelections,
  disabled = false,
  isLoading = false,
  debounceMs = 300,
  renderOption,
}: MultiSelectWithSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchQuery, debounceMs]);

  // Filter options based on search query
  const filteredOptions = options.filter((option) => {
    // Don't show already selected options
    if (selected.some((s) => s.id === option.id)) {
      return false;
    }

    // Apply search filter if search is enabled
    if (searchable && debouncedQuery) {
      const query = debouncedQuery.toLowerCase();
      return (
        displayValue(option).toLowerCase().includes(query) ||
        option.label.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Reset search when dropdown closes
  const handleToggle = useCallback(() => {
    if (disabled) return;

    setIsOpen(!isOpen);
    if (!isOpen) {
      // Opening - prepare for search
      setSearchQuery('');
      setDebouncedQuery('');
      setHighlightedIndex(-1);
    }
  }, [isOpen, disabled]);

  // Add option to selection
  const handleSelect = useCallback(
    (option: MultiSelectOption) => {
      if (maxSelections && selected.length >= maxSelections) {
        return;
      }

      onChange([...selected, option]);
      setSearchQuery('');
      setDebouncedQuery('');
      setHighlightedIndex(-1);

      // Keep dropdown open if max not reached
      if (!maxSelections || selected.length + 1 < maxSelections) {
        if (searchable && searchInputRef.current) {
          searchInputRef.current.focus();
        }
      } else {
        setIsOpen(false);
      }
    },
    [selected, onChange, maxSelections, searchable]
  );

  // Remove option from selection
  const handleRemove = useCallback(
    (option: MultiSelectOption, event?: React.MouseEvent) => {
      event?.stopPropagation();
      onChange(selected.filter((s) => s.id !== option.id));
    },
    [selected, onChange]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!isOpen) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleToggle();
        }
        return;
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case 'Enter':
          event.preventDefault();
          if (
            highlightedIndex >= 0 &&
            highlightedIndex < filteredOptions.length
          ) {
            handleSelect(filteredOptions[highlightedIndex]);
          }
          break;
        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          break;
        case 'Tab':
          event.preventDefault();
          setIsOpen(false);
          break;
      }
    },
    [isOpen, filteredOptions, highlightedIndex, handleSelect, handleToggle]
  );

  // Get display label for selected items
  const selectedItems = selected.map((option) => ({
    option,
    label: displayValue(option),
  }));

  const isMaxReached = !!maxSelections && selected.length >= maxSelections;

  return (
    <div
      ref={containerRef}
      className={`multi-select-container ${disabled ? 'disabled' : ''}`}
    >
      {/* Selected items display */}
      <div
        className="multi-select-trigger"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-disabled={disabled}
      >
        {/* Selected items chips */}
        <div className="multi-select-selected-items">
          {selectedItems.map((item) => (
            <div key={item.option.id} className="multi-select-chip">
              {renderOption ? (
                renderOption(item.option, true)
              ) : (
                <>
                  {item.option.avatar && (
                    <img
                      src={item.option.avatar}
                      alt={item.label}
                      className="multi-select-chip-avatar"
                    />
                  )}
                  <span className="multi-select-chip-label">{item.label}</span>
                </>
              )}
              <button
                type="button"
                className="multi-select-chip-remove"
                onClick={(e) => handleRemove(item.option, e)}
                aria-label={`Remove ${item.label}`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Search input or placeholder */}
        <div className="multi-select-input-wrapper">
          {searchable ? (
            <input
              ref={searchInputRef}
              type="text"
              className="multi-select-input"
              placeholder={
                selected.length === 0
                  ? placeholder
                  : searchPlaceholder
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => {
                e.stopPropagation();
                if (!isOpen) {
                  setIsOpen(true);
                }
              }}
              disabled={disabled || isMaxReached}
              aria-label="Search options"
            />
          ) : (
            <span className="multi-select-placeholder">
              {selected.length === 0 ? placeholder : ''}
            </span>
          )}

          {/* Chevron icon */}
          <ChevronDown
            size={16}
            className={`multi-select-chevron ${isOpen ? 'open' : ''}`}
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="multi-select-dropdown"
          role="listbox"
          aria-activedescendant={
            highlightedIndex >= 0 && filteredOptions[highlightedIndex]
              ? `option-${filteredOptions[highlightedIndex]?.id}`
              : undefined
          }
        >
          {/* Loading state */}
          {isLoading && (
            <div className="multi-select-loading">Loading...</div>
          )}

          {/* No results */}
          {!isLoading && filteredOptions.length === 0 && (
            <div className="multi-select-no-results">
              {debouncedQuery ? noResultsText : 'No options available'}
            </div>
          )}

          {/* Options list */}
          {!isLoading && filteredOptions.length > 0 && (
            <div className="multi-select-options">
              {filteredOptions.map((option, index) => {
                const isHighlighted = index === highlightedIndex;

                return (
                  <div
                    key={option.id}
                    id={`option-${option.id}`}
                    className={`multi-select-option ${isHighlighted ? 'highlighted' : ''}`}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    role="option"
                    aria-selected={false}
                  >
                    {renderOption ? (
                      renderOption(option, false)
                    ) : (
                      <>
                        {option.avatar && (
                          <img
                            src={option.avatar}
                            alt={displayValue(option)}
                            className="multi-select-option-avatar"
                          />
                        )}
                        <span className="multi-select-option-label">
                          {displayValue(option)}
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Max selection warning */}
          {isMaxReached && (
            <div className="multi-select-max-warning">
              Maximum {maxSelections} item{maxSelections > 1 ? 's' : ''}{' '}
              selected
            </div>
          )}
        </div>
      )}
    </div>
  );
}
