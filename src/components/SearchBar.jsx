import { useState } from "react";

function SearchBar({ onSearch, compact = false, placeholder = "Enter city name" }) {
  const [city, setCity] = useState("");
  const [emptyError, setEmptyError] = useState(false);

  const handleSearch = () => {
    if (city.trim() !== "") {
      onSearch(city.trim());
      setCity("");
    setEmptyError(false);
    } else {
      setEmptyError(true);
      setTimeout(() => setEmptyError(false), 3000);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  if (compact) {
    return (
      <div className="topbar-search-box">
        <input
          className="topbar-search-input"
          type="text"
          placeholder={placeholder}
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyDown={handleKey}
        />
        <button className="topbar-search-btn" onClick={handleSearch}>
          Go
        </button>
      </div>
    );
  }

  return (
    <div className="hero-search-box">
      <span className="hero-search-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="10.5" cy="10.5" r="6.5"/>
          <line x1="15.5" y1="15.5" x2="21" y2="21"/>
        </svg>
      </span>
      <input
        className="hero-search-input"
        type="text"
        placeholder={placeholder}
        value={city}
        onChange={(e) => setCity(e.target.value)}
        onKeyDown={handleKey}
        autoFocus
      />
      <button className="hero-search-btn" onClick={handleSearch}>
        Get Forecast
      </button>
      {emptyError && (
        <p style={{ color: "#ff6b6b", fontSize: 13, marginTop: 8, textAlign: "center" }}>
          ⚠️ Please enter a city name before searching.
        </p>
      )}
    </div>
  );
}

export default SearchBar;