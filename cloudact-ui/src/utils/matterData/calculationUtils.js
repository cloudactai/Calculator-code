// calculationsUtility.js

export const calculateCategoryTotal = (fields, category, bindType) => {
    return fields
        .filter((field) => field.bind?.startsWith(`assets.${category}`) && field.bind.includes(bindType))
        .reduce((acc, field) => acc + (parseFloat(field.value) || 0), 0);
};

export const calculateAllTotals = (fields) => {
    const landValuationTotal = calculateCategoryTotal(fields, 'land', 'onValuationDate');
    const householdValuationTotal = calculateCategoryTotal(fields, 'household', 'onValuationDate');
    const bankValuationTotal = calculateCategoryTotal(fields, 'bank', 'onValuationDate');
    const lifeValuationTotal = calculateCategoryTotal(fields, 'life', 'onValuationDate');
    const interestsValuationTotal = calculateCategoryTotal(fields, 'interests', 'onValuationDate');
    const moneyOwedValuationTotal = calculateCategoryTotal(fields, 'moneyOwed', 'onValuationDate');
    const otherPropertyValuationTotal = calculateCategoryTotal(fields, 'otherProperty', 'onValuationDate');

    const netWorth = landValuationTotal + householdValuationTotal + bankValuationTotal + lifeValuationTotal + 
                     interestsValuationTotal + moneyOwedValuationTotal + otherPropertyValuationTotal;

    return {
        landValuationTotal,
        householdValuationTotal,
        bankValuationTotal,
        lifeValuationTotal,
        interestsValuationTotal,
        moneyOwedValuationTotal,
        otherPropertyValuationTotal,
        netWorth
    };
};

export const calculateSpecificTotal = (fields, fieldId) => {
    const targetField = fields.find(field => field.id === fieldId);
    return parseFloat(targetField?.value || 0);
};
