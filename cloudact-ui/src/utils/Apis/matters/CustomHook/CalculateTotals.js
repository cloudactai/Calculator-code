export function CalcualteAnnualIncome (data, filler){
    
    const sources = [
        { id: 'employmentIncome', name: 'employmentIncome', value: data?.income?.[filler].employmentIncome || 0, label: 'Employment income (before deductions)', update: `income.${filler}.employmentIncome` },
        { id: 'commissionTipsBonuses', name: 'commissionTipsBonuses', value: data?.income?.[filler].commissionTipsBonuses  || 0, label: 'Commission, tips and bonuses', update: `income.${filler}.commissionTipsBonuses` },
        { id: 'selfEmploymentIncome', name: 'selfEmploymentIncome', value: data?.income?.[filler].selfEmploymentIncome  || 0, label: 'Self-employment income (Monthly amount before expenses: $)', update: `income.${filler}.selfEmploymentIncome`},
        { id: 'employmentInsuranceBenefits', name: 'employmentInsuranceBenefits', value: data?.income?.[filler].employmentInsuranceBenefits  || 0, label: 'Employment Insurance benefits', update: `income.${filler}.employmentInsuranceBenefits`},
        { id: 'workersCompensationBenefits', name: 'workersCompensationBenefits', value: data?.income?.[filler].workersCompensationBenefits  || 0, label: 'Workers compensation benefits', update: `income.${filler}.workersCompensationBenefits`},
        { id: 'socialAssistanceIncome', name: 'socialAssistanceIncome', value: data?.income?.[filler].socialAssistanceIncome  || 0, label: 'Social assistance income (including ODSP payments)', update: `income.${filler}.socialAssistanceIncome`},
        { id: 'interestInvestmentIncome', name: 'interestInvestmentIncome', value: data?.income?.[filler].interestInvestmentIncome  || 0, label: 'Interest and investment income', update: `income.${filler}.interestInvestmentIncome`},
        { id: 'pensionIncome', name: 'pensionIncome', value: data?.income?.[filler].pensionIncome  || 0, label: ' Pension income (including CPP and OAS)', update: `income.${filler}.pensionIncome`},
        { id: 'spousalSupport', name: 'spousalSupport', value: data?.income?.[filler].spousalSupport  || 0, label: 'Spousal support received from a former spouse/partner', update: `income.${filler}.spousalSupport`},
        { id: 'childTaxBenefits', name: 'childTaxBenefits', value: data?.income?.[filler].childTaxBenefits  || 0, label: 'Child Tax Benefits or Tax Rebates (e.g. GST)', update: `income.${filler}.childTaxBenefits`},
        { id: 'otherIncome', name: 'otherIncome', value: data?.income?.[filler].otherIncome  || 0, label: 'Other sources of income (e.g. RRSP withdrawals, capital gains) (*attach Schedule A and divide annual amount by 12)', update: `income.${filler}.otherIncome`},
    ];

    const total = sources.reduce((sum, item) => {
        if (item && item.value !== undefined && item.value !== null) {
            const cleanedValue = item.value.toString().replace(/,/g, ''); // Remove commas
            const numericValue = parseFloat(cleanedValue) || 0; // Convert to number
            return sum + numericValue;
        }
        return sum;
    }, 0);
    // console.log("🚀 ~ total ~ total:", total)

    // // const TotalAnnualIncome = total * 12;
    const TotalAnnualIncome =  total * 12;

    return {
        TotalAnnualIncome
    }

}