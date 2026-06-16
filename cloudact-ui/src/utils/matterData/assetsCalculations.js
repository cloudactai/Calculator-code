// Helper function to calculate sum of values in an array based on a key
const sumValues = (arr, key) => {
    return arr.reduce((acc, item) => {
      const value = parseFloat(item[key]);
      return acc + (isNaN(value) ? 0 : value);
    }, 0);
  };
  
  // Helper function to calculate total assets
  const valueOfAllProperty = (assets) => {
    const totalLand = {
      onDateOfMarriage: sumValues(assets.land, "onDateOfMarriage"),
      onValuationDate: sumValues(assets.land, "onValuationDate"),
      today: sumValues(assets.land, "today"),
    };
  
    const totalOtherProperty = {
      onDateOfMarriage: sumValues(assets.otherProperty, "onDateOfMarriage"),
      onValuationDate: sumValues(assets.otherProperty, "onValuationDate"),
      today: sumValues(assets.otherProperty, "today"),
    };
  
    const totalAssets = {
      onDateOfMarriage: totalLand.onDateOfMarriage + totalOtherProperty.onDateOfMarriage,
      onValuationDate: totalLand.onValuationDate + totalOtherProperty.onValuationDate,
      today: totalLand.today + totalOtherProperty.today,
    };
  
    return totalAssets;
  };