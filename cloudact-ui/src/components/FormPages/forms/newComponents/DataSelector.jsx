import React, { useState, useEffect } from 'react';

const DataSelector = ({ data }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [filteredData, setFilteredData] = useState(data);

    // Function to filter the data based on the search term
    const filterData = (search) => {
        const newData = {};
        Object.keys(data).forEach(key => {
            const subData = Object.entries(data[key]).filter(([subKey, value]) => {
                return typeof value === 'object' ? false : subKey.toLowerCase().includes(search.toLowerCase());
            });

            if (subData.length > 0) {
                newData[key] = Object.fromEntries(subData);
            }
        });
        return newData;
    };

    // Update filtered data when the search term changes
    useEffect(() => {
        setFilteredData(filterData(searchTerm));
    }, [searchTerm, data]);

    // Handle selection of options
    const handleSelect = (key) => {
        if (!selectedOptions.includes(key)) {
            setSelectedOptions(prev => [...prev, key]);
        }
    };

    // Handle removal of selected options
    const handleRemove = (key) => {
        setSelectedOptions(prev => prev.filter(option => option !== key));
    };

    // Clear search input
    const handleClear = () => {
        setSearchTerm('');
        setSelectedOptions([]);
    };

    return (
        <div>
            <input 
                type="text" 
                placeholder="Search..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
            />
            <button onClick={handleClear}>Clear</button>
            <div className="selected-badges">
                {selectedOptions.map((option, index) => (
                    <span key={index} className="badge">
                        {option} 
                        <button onClick={() => handleRemove(option)} style={{ marginLeft: '5px', color: 'red' }}>x</button>
                    </span>
                ))}
            </div>
            <div className="data-groups">
                {Object.entries(filteredData).map(([key, value]) => (
                    <div key={key}>
                        <h4>{key}</h4>
                        <ul>
                            {Object.entries(value).map(([subKey, subValue]) => (
                                <li key={subKey} onClick={() => handleSelect(subKey)} style={{ cursor: 'pointer' }}>
                                    {subKey}: {subValue}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DataSelector;
