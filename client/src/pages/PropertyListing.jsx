import { useState, useMemo } from 'react';
import { Check, Search, SlidersHorizontal, X } from 'lucide-react';
import Button from '../components/Button';
import PropertyCard from '../components/PropertyCard';
import { useProperties } from '../context/PropertyContext';
import './PropertyListing.css';

// Budget slider: value in Lacs (10 = ₹100, 500 = ₹5Cr)
const formatBudget = (val) => {
  if (val >= 100) return `${(val / 100).toFixed(1)} Cr`;
  return `${val}`;
};

const PROPERTY_TYPES = [
  { label: 'Apartments', value: 'apartment' },
  { label: 'Villas', value: 'villa' },
  { label: 'Plots', value: 'plot' },
  { label: 'Commercial', value: 'commercial' },
];

const LOCALITIES = [
  'Arera Colony',
  'Bawadiya Kalan',
  'Kolar Road',
  'Shamla Hills',
  'Hoshangabad Road',
  'Ayodhya Bypass',
  'Awadhpuri',

];

const DEFAULT_BUDGET_MIN = 10;
const DEFAULT_BUDGET_MAX = 500;

const PropertyListing = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [budgetMax, setBudgetMax] = useState(DEFAULT_BUDGET_MAX);
  const [budgetMin, setBudgetMin] = useState(DEFAULT_BUDGET_MIN);
  const [selectedBhk, setSelectedBhk] = useState(null);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedListingTypes, setSelectedListingTypes] = useState([]);
  const [selectedLocalities, setSelectedLocalities] = useState([]);
  
  const { properties } = useProperties();

  const toggleType = (type) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleListingType = (type) => {
    setSelectedListingTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleLocality = (loc) => {
    setSelectedLocalities(prev =>
      prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedBhk(null);
    setSelectedTypes([]);
    setSelectedLocalities([]);
    setSelectedListingTypes([]);
    setBudgetMin(DEFAULT_BUDGET_MIN);
    setBudgetMax(DEFAULT_BUDGET_MAX);
  };

  const closeFilters = () => {
    setShowFilters(false);
  };

  const activeFilterCount = (selectedTypes.length > 0 ? 1 : 0) +
    (selectedBhk !== null ? 1 : 0) +
    (selectedLocalities.length > 0 ? 1 : 0) +
    (selectedListingTypes.length > 0 ? 1 : 0) +
    (budgetMax < DEFAULT_BUDGET_MAX ? 1 : 0) + (budgetMin > DEFAULT_BUDGET_MIN ? 1 : 0) +
    (searchQuery.trim() !== '' ? 1 : 0);

  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      // Hide sold and unapproved properties from viewers
      if (property.isSold || !property.isApproved) return false;

      // Search filter
      const matchesSearch = !searchQuery.trim() ||
        property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.location.toLowerCase().includes(searchQuery.toLowerCase());

      // BHK filter
      const matchesBhk = selectedBhk === null ||
        property.beds === selectedBhk ||
        (selectedBhk === 4 && property.beds >= 4);

      // Property type filter
      const matchesType = selectedTypes.length === 0 ||
        selectedTypes.includes(property.type);

      // Budget filter (priceNumeric is in Lacs)
      const matchesBudget = (!property.priceNumeric) || (property.priceNumeric >= budgetMin && property.priceNumeric <= budgetMax);

      // Locality filter
      const matchesLocality = selectedLocalities.length === 0 ||
        selectedLocalities.some(loc =>
          property.location.toLowerCase().includes(loc.toLowerCase())
        );

      return matchesSearch && matchesBhk && matchesType && matchesBudget && matchesLocality && (selectedListingTypes.length === 0 || selectedListingTypes.includes(property.listingType));
    });
  }, [properties, searchQuery, selectedBhk, selectedTypes, selectedLocalities, selectedListingTypes, budgetMin, budgetMax]);

  return (
    <div className="listing-page container">
      <div className="listing-header">
        <div>
          <h1>Properties in <span className="gradient-text">Bhopal</span></h1>
          <p className="text-secondary">Showing {filteredProperties.length} of {properties.length} results</p>
        </div>
        <div className="listing-actions">
          <div className="search-bar glass-panel">
            <Search size={20} className="text-secondary" />
            <input
              type="text"
              placeholder="Search by name or area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
                <X size={16} />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            className="mobile-filter-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal size={20} />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </Button>
        </div>
      </div>

      <div className="listing-layout">
        {/* Sidebar Filters */}
        <aside className={`filters-sidebar glass-panel ${showFilters ? 'show' : ''}`}>
          {/* Property Type */}
          <div className="filter-group">
            <h3>Property Type</h3>
            <div className="checkbox-group">
              {PROPERTY_TYPES.map(pt => (
                <label key={pt.value} className={selectedTypes.includes(pt.value) ? 'active' : ''}>
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(pt.value)}
                    onChange={() => toggleType(pt.value)}
                  />
                  {pt.label}
                </label>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <h3>Listing Type</h3>
            <div className="checkbox-group">
              <label className={selectedListingTypes.includes('Sell') ? 'active' : ''}>
                <input
                  type="checkbox"
                  checked={selectedListingTypes.includes('Sell')}
                  onChange={() => toggleListingType('Sell')}
                />
                Sell
              </label>
              <label className={selectedListingTypes.includes('Rent') ? 'active' : ''}>
                <input
                  type="checkbox"
                  checked={selectedListingTypes.includes('Rent')}
                  onChange={() => toggleListingType('Rent')}
                />
                Rent
              </label>
            </div>
          </div>

          {/* Budget Range */}
          <div className="filter-group">
            <h3>Budget Range</h3>
            <div className="budget-sliders">
              <input
                type="range"
                className="budget-slider"
                min="10"
                max="500"
                step="5"
                value={budgetMin}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  // Ensure min does not exceed max
                  setBudgetMin(val > budgetMax ? budgetMax : val);
                }}
              />
              <input
                type="range"
                className="budget-slider"
                min="10"
                max="500"
                step="5"
                value={budgetMax}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  // Ensure max is not less than min
                  setBudgetMax(val < budgetMin ? budgetMin : val);
                }}
              />
            </div>
            <div className="budget-values">
              <span>From ₹ {formatBudget(budgetMin)}</span>
              <span className="budget-current">Up to ₹ {formatBudget(budgetMax)}</span>
            </div>
          </div>

          {/* BHK Configuration */}
          <div className="filter-group">
            <h3>BHK Configuration</h3>
            <div className="bhk-buttons">
              <button className={`bhk-btn ${selectedBhk === 1 ? 'active' : ''}`} onClick={() => setSelectedBhk(selectedBhk === 1 ? null : 1)}>1</button>
              <button className={`bhk-btn ${selectedBhk === 2 ? 'active' : ''}`} onClick={() => setSelectedBhk(selectedBhk === 2 ? null : 2)}>2</button>
              <button className={`bhk-btn ${selectedBhk === 3 ? 'active' : ''}`} onClick={() => setSelectedBhk(selectedBhk === 3 ? null : 3)}>3</button>
              <button className={`bhk-btn ${selectedBhk === 4 ? 'active' : ''}`} onClick={() => setSelectedBhk(selectedBhk === 4 ? null : 4)}>4+</button>
            </div>
          </div>

          {/* Localities */}
          <div className="filter-group">
            <h3>Localities</h3>
            <div className="checkbox-group">
              {LOCALITIES.map(loc => (
                <label key={loc} className={selectedLocalities.includes(loc) ? 'active' : ''}>
                  <input
                    type="checkbox"
                    checked={selectedLocalities.includes(loc)}
                    onChange={() => toggleLocality(loc)}
                  />
                  {loc}
                </label>
              ))}
            </div>
          </div>

          <div className="filter-actions">
            <Button variant="outline" onClick={clearAllFilters} icon={<X size={16} />}>
              Clear All Filters
            </Button>
            <Button variant="primary" onClick={closeFilters} icon={<Check size={16} />}>
              Done
            </Button>
          </div>
        </aside>

        {/* Property Grid */}
        <main className="listing-main">
          {/* Active filter pills */}
          {activeFilterCount > 0 && (
            <div className="active-filters-bar">
              {searchQuery && (
                <span className="filter-pill">
                  Search: "{searchQuery}" <button onClick={() => setSearchQuery('')}><X size={14} /></button>
                </span>
              )}
                {selectedListingTypes.map(t => (
                  <span key={t} className="filter-pill">
                    {t} 
                    <button onClick={() => {
                      const newArray = selectedListingTypes.filter(val => val !== t);
                      setSelectedListingTypes(newArray);
                    }}><X size={14} /></button>
                  </span>
                ))}
              {selectedBhk && (
                <span className="filter-pill">
                  {selectedBhk === 4 ? '4+' : selectedBhk} BHK <button onClick={() => setSelectedBhk(null)}><X size={14} /></button>
                </span>
              )}
                {budgetMin > DEFAULT_BUDGET_MIN && (
                  <span className="filter-pill">
                    From ₹{formatBudget(budgetMin)}
                    <button onClick={() => setBudgetMin(DEFAULT_BUDGET_MIN)}><X size={14} /></button>
                  </span>
                )}
              {budgetMax < DEFAULT_BUDGET_MAX && (
                <span className="filter-pill">
                  Up to ₹{formatBudget(budgetMax)} <button onClick={() => setBudgetMax(DEFAULT_BUDGET_MAX)}><X size={14} /></button>
                </span>
              )}
              {selectedLocalities.map(loc => (
                <span key={loc} className="filter-pill">
                  {loc} <button onClick={() => toggleLocality(loc)}><X size={14} /></button>
                </span>
              ))}
              <button className="clear-all-link" onClick={clearAllFilters}>Clear all</button>
            </div>
          )}

          {filteredProperties.length > 0 ? (
            <div className="properties-grid">
              {filteredProperties.map(property => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="no-results glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
              <h3>No properties found</h3>
              <p className="text-secondary" style={{ marginTop: '0.5rem' }}>Try adjusting your search or filters.</p>
              <Button variant="outline" style={{ marginTop: '1rem' }} onClick={clearAllFilters}>Clear All Filters</Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default PropertyListing;
