import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { getSingleMatterData } from "../getSingleMatterData/getSingleMattersDataActions";

import {
  selectDataSingleMatterExpenseData,
  selectDataSingleMatterExpenseError,
  selectDataSingleMatterExpenseLoading,
} from "../getSingleMatterData/getSingleMattersDataSelectors";

export function ExpenseData(matterId) {
  const dispatch = useDispatch();
  useEffect(() => {
    const fetchData = async () => {
      dispatch(getSingleMatterData(matterId, "expenses"));
    };
    fetchData();
  }, [dispatch, matterId]);

  const selectExpenseData = useSelector(selectDataSingleMatterExpenseData);
  const selectExpenseDataLoading = useSelector(
    selectDataSingleMatterExpenseLoading
  );
  const selectExpenseDataError = useSelector(
    selectDataSingleMatterExpenseError
  );

  return {
    selectExpenseData,
    selectExpenseDataLoading,
    selectExpenseDataError,
  };
}

export function Expenses(data) {
  const exepenseData = data || {};

  const exepenseDetails = exepenseData?.body;

  const clientExpenses = exepenseDetails?.client?.expenses || "";
  const clientSpecialExpenses =
    exepenseDetails?.client?.specialChildExpenses || "";

  const opposingPartyExpenses = exepenseDetails?.opposingParty?.expenses || "";
  const opposingPartySpecialExpenses =
    exepenseDetails?.opposingParty?.specialChildExpenses || "";

  // CLIENTS
  const totalClientExpensesMonthlyTotal = Array.isArray(clientExpenses)
    ? clientExpenses?.reduce(
        (total, income) => total + parseFloat(income.monthlyAmount),
        0
      )
    : "";

  const totalClientExpensesYearly = Array.isArray(clientExpenses)
    ? clientExpenses?.reduce(
        (total, income) => total + parseFloat(income.yearlyAmount),
        0
      )
    : "";

  // OPPOSING PARTY
  // const totalopposingPartyExpensesMonthlyTotal = Array.isArray(opposingPartyExpenses) ?
  //   opposingPartyExpenses?.reduce((total, income) => total + parseFloat(income.monthlyAmount), 0) : '';

  // const totalopposingPartyExpensesYearly = Array.isArray(opposingPartyExpenses) ?
  //   opposingPartyExpenses?.reduce((total, income) => total + parseFloat(income.yearlyAmount), 0) : '';

  const ClientExpensesDetails = () => {
    // Initialize an object to store the totals
    const totals = {};
    // Calculate totals for each type of income
    if (Array.isArray(clientExpenses)) {
      clientExpenses?.forEach((item) => {
        if (!totals[item.type]) {
          totals[item.type] = 0;
        }
        totals[item.type] += parseInt(item.monthlyAmount);
      });
    } else {
    }
    // totals['CPP contributions']
    const expenses = {
      expenses: {
        automaticDeductions: {
          cppContributions: totals["CPP contributions"] || 0,
          eiPremiums: totals["EI premiums"] || 0,
          incomeTaxes: totals["Income taxes"] || 0,
          employeePensionContributions:
            totals["Employee pension contributions"] || 0,
          unionDues: totals["Union dues"] || 0,
          subtotal:
            (parseInt(totals["CPP contributions"]) || 0) +
            (parseInt(totals["EI premiums"]) || 0) +
            (parseInt(totals["Income taxes"]) || 0) +
            (parseInt(totals["Employee pension contributions"]) || 0) +
            (parseInt(totals["Union dues"]) || 0),
        },
        housing: {
          rentOrMortgage: totals["Rent or mortgage"] || 0,
          propertyTaxes: totals["Property taxes"] || 0,
          propertyInsurance: totals["Property insurance"] || 0,
          condominiumFees: totals["Condominium fees"] || 0,
          repairsAndMaintenance: totals["Repairs and maintenance"] || 0,
          otherHousing: totals["Other Housing expense"] || 0,
          subtotal:
            (parseInt(totals["Rent or mortgage"]) || 0) +
            (parseInt(totals["Property taxes"]) || 0) +
            (parseInt(totals["Property insurance"]) || 0) +
            (parseInt(totals["Condominium fees"]) || 0) +
            (parseInt(totals["Repairs and maintenance"]) || 0) +
            (parseInt(totals["Other Housing expense"]) || 0),
        },
        utilities: {
          water: totals["Water"] || 0,
          heat: totals["Heat"] || 0,
          electricity: totals["Electricity"] || 0,
          telephone: totals["Telephone"] || 0,
          cellPhone: totals["Cell Phone"] || 0,
          cable: totals["Cable"] || 0,
          internet: totals["Internet"] || 0,
          utilities: totals["Utilities"] || 0,
          subtotal:
            (parseInt(totals["Water"]) || 0) +
            (parseInt(totals["Heat"]) || 0) +
            (parseInt(totals["Electricity"]) || 0) +
            (parseInt(totals["Telephone"]) || 0) +
            (parseInt(totals["Cell Phone"]) || 0) +
            (parseInt(totals["Cable"]) || 0) +
            (parseInt(totals["Internet"]) || 0) +
            (parseInt(totals["Utilities"]) || 0),
        },
        householdExpenses: {
          groceries: totals["Groceries"] || 0,
          foodAndHousingSupplies: totals["Food and Household supplies"] || 0,
          householdSupplies: totals["Household supplies"] || 0,
          mealsOutsideTheHome: totals["Meals outside the home"] || 0,
          petCare: totals["Pet care"] || 0,
          laundryAndDryCleaning: totals["Laundry and Dry Cleaning"] || 0,
          eatingOut: totals["Eating out"] || 0,
          telephoneCableTvInternet:
            totals["Telephone, Cable TV and Internet fees"] || 0,
          otherHousehold: totals["Other Household expenses"] || 0,
          subtotal:
            (parseInt(totals["Groceries"]) || 0) +
            (parseInt(totals["Food and Household supplies"]) || 0) +
            (parseInt(totals["Household supplies"]) || 0) +
            (parseInt(totals["Meals outside the home"]) || 0) +
            (parseInt(totals["Pet care"]) || 0) +
            (parseInt(totals["Laundry and Dry Cleaning"]) || 0) +
            (parseInt(totals["Eating out"]) || 0) +
            (parseInt(totals["Telephone, Cable TV and Internet fees"]) || 0) +
            (parseInt(totals["Other Household expenses"]) || 0),
        },
        childcare: {
          daycare: totals["Daycare expenses"] || 0,
          babysitting: totals["Babysitting costs"] || 0,
          subtotal:
            (parseInt(totals["Daycare expenses"]) || 0) +
            (parseInt(totals["Babysitting costs"]) || 0),
        },
        transportation: {
          publicTransit:
            totals["Public transit, taxis"] ||
            totals["Public transit, taxis and parking"] ||
            totals["Public transit and taxis"] ||
            0,
          carPayments: totals["Car Loan or Lease Payments"] || 0,
          gasAndOil: totals["Gas and oil"] || totals["Fuel"] || 0,
          insurance:
            totals["Car insurance and licence"] ||
            totals["Car insurance and car loan payment"] ||
            totals["Auto insurance"] ||
            0,
          repairsAndMaintenance: totals["Repairs and maintenance"] || 0,
          parking: totals["Parking"] || 0,
          licenseAndRegistration: totals["License and registration"] || 0,
          otherTransportation: totals["Other Transportation"] || 0,
          subtotal:
            (parseInt(totals["Public transit, taxis"]) ||
              parseInt(totals["Public transit, taxis and parking"]) ||
              parseInt(totals["Public transit and taxis"]) ||
              0) +
            (parseInt(totals["Car Loan or Lease Payments"]) || 0) +
            (parseInt(totals["Gas and oil"]) || parseInt(totals["Fuel"]) || 0) +
            (parseInt(totals["Car insurance and licence"]) ||
              parseInt(totals["Car insurance and car loan payment"]) ||
              parseInt(totals["Auto insurance"]) ||
              0) +
            (parseInt(totals["Repairs and maintenance"]) || 0) +
            (parseInt(totals["Parking"]) || 0) +
            (parseInt(totals["License and registration"]) || 0) +
            (parseInt(totals["Other Transportation"]) || 0),
        },
        health: {
          insurance: totals["Health insurance premiums"] || 0,
          dental: totals["Dental expenses"] || 0,
          medicine:
            totals["Medicine and drugs"] ||
            totals["Prescriptions and medicines"] ||
            0,
          eyecare: totals["Eye care"] || 0,
          subtotal:
            (parseInt(totals["Health insurance premiums"]) || 0) +
            (parseInt(totals["Dental expenses"]) || 0) +
            (parseInt(totals["Medicine and drugs"]) ||
              totals["Prescriptions and medicines"] ||
              0) +
            (parseInt(totals["Eye care"]) || 0),
        },
        personal: {
          clothing: totals["Clothing"] || 0,
          haircare: totals["Hair care and beauty"] || 0,
          alcohol: totals["Alcohol and tobacco"] || 0,
          education: totals["Education (specify)"] || 0,
          personalHygiene: totals["Personal hygiene"] || 0,
          entertainment:
            totals["Entertainment/recreation (including children)"] || 0,
          gifts: totals["Gifts"] || 0,
          subtotal:
            (parseInt(totals["Clothing"]) || 0) +
            (parseInt(totals["Hair care and beauty"]) || 0) +
            (parseInt(totals["Alcohol and tobacco"]) || 0) +
            (parseInt(totals["Education (specify)"]) || 0) +
            (parseInt(totals["Personal hygiene"]) || 0) +
            (parseInt(
              totals["Entertainment/recreation (including children)"]
            ) || 0) +
            (parseInt(totals["Gifts"]) || 0),
        },
        other: {
          lifeInsurance:
            totals["Life Insurance premiums"] || totals["Life insurance"] || 0,
          medicalAndDentalInsurance:
            totals["Medical and Dental Insurance"] || 0,
          birthdayAndChristmasGifts:
            totals["Birthday and Christmas Gifts"] || 0,
          rrsp: totals["RRSP/RESP withdrawals"] || 0,
          vacations: totals["Vacations"] || 0,
          school: totals["School fees and supplies"] || 0,
          clothingForChildren: totals["Clothing for children"] || 0,
          childrenActivities: totals["Children's activities"] || 0,
          summerCamp: totals["Summer camp expenses"] || 0,
          debtPayments:
            totals["Debt payments"] || totals["Other debt payment"] || 0,
          bankLoanPayments: totals["Bank loan payments"] || 0,
          supportPaidForOtherChildren:
            totals["Support paid for other children"] || 0,
          other: totals["Other expenses not shown above (specify)"] || 0,
          creditCardPauyments: totals["Credit card payments"] || 0,
          premiumsContributionsDebt:
            totals["Premiums, Contributions and Debt Repayment"] || 0,
          educationalExpenses: totals["Educational expenses"] || 0,
          miscellaneous: totals["Miscelleneous/Other"] || 0,
          supportForOthers: totals["Support for others"] || 0,
          subtotal:
            (parseInt(totals["Life Insurance premiums"]) ||
              totals["Life insurance"] ||
              0) +
            (parseInt(totals["RRSP/RESP withdrawals"]) || 0) +
            (parseInt(totals["Vacations"]) || 0) +
            (parseInt(totals["Birthday and Christmas Gifts"]) || 0) +
            (parseInt(totals["Medical and Dental Insurance"]) || 0) +
            (parseInt(totals["School fees and supplies"]) || 0) +
            (parseInt(totals["Clothing for children"]) || 0) +
            (parseInt(totals["Children's activities"]) || 0) +
            (parseInt(totals["Summer camp expenses"]) || 0) +
            (parseInt(totals["Debt payments"]) ||
              parseInt(totals["Other debt payment"]) ||
              0) +
            (parseInt(totals["Bank loan payments"]) || 0) +
            (parseInt(totals["Support paid for other children"]) || 0) +
            (parseInt(totals["Other expenses not shown above (specify)"]) ||
              0) +
            (parseInt(totals["Premiums, Contributions and Debt Repayment"]) ||
              0) +
            (parseInt(totals["Credit card payments"]) || 0) +
            (parseInt(totals["Educational expenses"]) || 0) +
            (parseInt(totals["Support for others"]) || 0) +
            (parseInt(totals["Miscelleneous/Other"]) || 0),
        },
        totalMonthlyExpenses: totalClientExpensesMonthlyTotal || 0,
        totalYearlyExpenses: totalClientExpensesYearly || 0,
      },
    };

    return expenses;
  };
  // formatNumberInThousands
  const opposingPartyExpensesDetails = () => {
    // Initialize an object to store the totals
    const totals = {};

    // Calculate totals for each type of income
    if (Array.isArray(opposingPartyExpenses)) {
      opposingPartyExpenses?.forEach((item) => {
        if (!totals[item.type]) {
          totals[item.type] = 0;
        }
        totals[item.type] += parseInt(item.monthlyAmount);
      });
    } else {
    }

    // Log the totals

    const expenses = {
      expenses: {
        automaticDeductions: {
          cppContributions:
            (totals["CPP contributions"] !== undefined
              ? totals["CPP contributions"].toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                })
              : "") || 0,
          eiPremiums: totals["EI premiums"] || 0,
          incomeTaxes: totals["Income taxes"] || 0,
          employeePensionContributions:
            totals["Employee pension contributions"] || 0,
          unionDues: totals["Union dues"] || 0,
          subtotal:
            (parseInt(totals["CPP contributions"]) || 0) +
            (parseInt(totals["EI premiums"]) || 0) +
            (parseInt(totals["Income taxes"]) || 0) +
            (parseInt(totals["Employee pension contributions"]) || 0) +
            (parseInt(totals["Union dues"]) || 0),
        },
        housing: {
          rentOrMortgage: totals["Rent or mortgage"] || 0,
          propertyTaxes: totals["Property taxes"] || 0,
          propertyInsurance: totals["Property insurance"] || 0,
          condominiumFees: totals["Condominium fees"] || 0,
          repairsAndMaintenance: totals["Repairs and maintenance"] || 0,
          otherHousing: totals["Other Housing expense"] || 0,
          subtotal:
            (parseInt(totals["Rent or mortgage"]) || 0) +
            (parseInt(totals["Property taxes"]) || 0) +
            (parseInt(totals["Property insurance"]) || 0) +
            (parseInt(totals["Condominium fees"]) || 0) +
            (parseInt(totals["Repairs and maintenance"]) || 0) +
            (parseInt(totals["Other Housing expense"]) || 0),
        },
        utilities: {
          water: totals["Water"] || 0,
          heat: totals["Heat"] || 0,
          electricity: totals["Electricity"] || 0,
          telephone: totals["Telephone"] || 0,
          cellPhone: totals["Cell Phone"] || 0,
          cable: totals["Cable"] || 0,
          internet: totals["Internet"] || 0,
          utilities: totals["Utilities"] || 0,
          subtotal:
            (parseInt(totals["Water"]) || 0) +
            (parseInt(totals["Heat"]) || 0) +
            (parseInt(totals["Electricity"]) || 0) +
            (parseInt(totals["Telephone"]) || 0) +
            (parseInt(totals["Cell Phone"]) || 0) +
            (parseInt(totals["Cable"]) || 0) +
            (parseInt(totals["Internet"]) || 0) +
            (parseInt(totals["Utilities"]) || 0),
        },
        householdExpenses: {
          groceries: totals["Groceries"] || 0,
          householdSupplies: totals["Household supplies"] || 0,
          foodAndHousingSupplies: totals["Food and Household supplies"] || 0,
          mealsOutsideTheHome: totals["Meals outside the home"] || 0,
          petCare: totals["Pet care"] || 0,
          laundryAndDryCleaning: totals["Laundry and Dry Cleaning"] || 0,
          eatingOut: totals["Eating out"] || 0,
          subtotal:
            (parseInt(totals["Groceries"]) || 0) +
            (parseInt(totals["Household supplies"]) || 0) +
            (parseInt(totals["Food and Household supplies"]) || 0) +
            (parseInt(totals["Meals outside the home"]) || 0) +
            (parseInt(totals["Pet care"]) || 0) +
            (parseInt(totals["Laundry and Dry Cleaning"]) || 0) +
            (parseInt(totals["Eating out"]) || 0) +
            (parseInt(totals["Other Household expenses"]) || 0),
        },
        childcare: {
          daycare: totals["Daycare expenses"] || 0,
          babysitting: totals["Babysitting costs"] || 0,
          subtotal:
            (parseInt(totals["Daycare expenses"]) || 0) +
            (parseInt(totals["Babysitting costs"]) || 0),
        },
        transportation: {
          publicTransit:
            totals["Public transit, taxis"] ||
            totals["Public transit, taxis and parking"] ||
            0,
          carPayments: totals["Car Loan or Lease Payments"] || 0,
          gasAndOil: totals["Gas and oil"] || totals["Fuel"] || 0,
          insurance:
            totals["Car insurance and licence"] ||
            totals["Car insurance and car loan payment"] ||
            0,
          repairsAndMaintenance: totals["Repairs and maintenance"] || 0,
          parking: totals["Parking"] || 0,
          otherTransportation: totals["Other Transportation"] || 0,
          subtotal:
            (parseInt(totals["Public transit, taxis"]) ||
              parseInt(totals["Public transit, taxis and parking"]) ||
              0) +
            (parseInt(totals["Car Loan or Lease Payments"]) || 0) +
            (parseInt(totals["Gas and oil"]) || parseInt(totals["Fuel"]) || 0) +
            (parseInt(totals["Car insurance and licence"]) || 0) +
            (parseInt(totals["Repairs and maintenance"]) || 0) +
            (parseInt(totals["Parking"]) || 0) +
            (parseInt(totals["Other Transportation"]) || 0),
        },
        health: {
          insurance: totals["Health insurance premiums"] || 0,
          dental: totals["Dental expenses"] || 0,
          medicine: totals["Medicine and drugs"] || 0,
          eyecare: totals["Eye care"] || 0,
          subtotal:
            (parseInt(totals["Health insurance premiums"]) || 0) +
            (parseInt(totals["Dental expenses"]) || 0) +
            (parseInt(totals["Medicine and drugs"]) || 0) +
            (parseInt(totals["Eye care"]) || 0),
        },
        personal: {
          clothing: totals["Clothing"] || 0,
          haircare: totals["Hair care and beauty"] || 0,
          alcohol: totals["Alcohol and tobacco"] || 0,
          education: totals["Education (specify)"] || 0,
          entertainment:
            totals["Entertainment/recreation (including children)"] || 0,
          gifts: totals["Gifts"] || 0,
          subtotal:
            (parseInt(totals["Clothing"]) || 0) +
            (parseInt(totals["Hair care and beauty"]) || 0) +
            (parseInt(totals["Alcohol and tobacco"]) || 0) +
            (parseInt(totals["Education (specify)"]) || 0) +
            (parseInt(
              totals["Entertainment/recreation (including children)"]
            ) || 0) +
            (parseInt(totals["Gifts"]) || 0),
        },
        other: {
          lifeInsurance: totals["Life Insurance premiums"] || 0,
          rrsp: totals["RRSP/RESP withdrawals"] || 0,
          vacations: totals["Vacations"] || 0,
          school: totals["School fees and supplies"] || 0,
          clothingForChildren: totals["Clothing for children"] || 0,
          childrenActivities: totals["Children's activities"] || 0,
          summerCamp: totals["Summer camp expenses"] || 0,
          debtPayments: totals["Debt payments"] || 0,
          supportPaidForOtherChildren:
            totals["Support paid for other children"] || 0,
          other: totals["Other expenses not shown above (specify)"] || 0,
          premiumsContributionsDebt:
            totals["Premiums, Contributions and Debt Repayment"] || 0,
          miscellaneous: totals["Miscellaneous/Other"] || 0,
          subtotal:
            (parseInt(totals["Life Insurance premiums"]) || 0) +
            (parseInt(totals["RRSP/RESP withdrawals"]) || 0) +
            (parseInt(totals["Vacations"]) || 0) +
            (parseInt(totals["School fees and supplies"]) || 0) +
            (parseInt(totals["Clothing for children"]) || 0) +
            (parseInt(totals["Children's activities"]) || 0) +
            (parseInt(totals["Summer camp expenses"]) || 0) +
            (parseInt(totals["Debt payments"]) || 0) +
            (parseInt(totals["Support paid for other children"]) || 0) +
            (parseInt(totals["Other expenses not shown above (specify)"]) ||
              0) +
            (parseInt(totals["Premiums, Contributions and Debt Repayment"]) ||
              0) +
            (parseInt(totals["Miscellaneous/Other"]) || 0),
        },
        totalMonthlyExpenses: totalClientExpensesMonthlyTotal || 0,
        totalYearlyExpenses: totalClientExpensesYearly || 0,
      },
    };

    // // Calculate total monthly income
    // sources.totalMonthlyIncome =
    //   Object.values(totals).reduce((total, amount) => total + amount, 0) || 0

    // // Calculate total annual income
    // sources.totalAnnualIncome = sources.totalMonthlyIncome
    //   ? sources.totalMonthlyIncome * 12
    //   : ''

    return expenses;
  };

  const ExpenseDetailsClient = ClientExpensesDetails();
  const ExpenseDetailsOpposingParty = opposingPartyExpensesDetails();

  return {
    ExpenseDetailsClient,
    ExpenseDetailsOpposingParty,
    clientSpecialExpenses,
    opposingPartySpecialExpenses,
  };
}

export function ExpenseInfo(data) {
  const exepenseData = data || {};

  const exepenseDetails = exepenseData;

  const clientExpenses = exepenseDetails?.client?.expenses || "";
  const clientSpecialExpenses =
    exepenseDetails?.client?.specialChildExpenses || "";

  const opposingPartyExpenses = exepenseDetails?.opposingParty?.expenses || "";
  const opposingPartySpecialExpenses =
    exepenseDetails?.opposingParty?.specialChildExpenses || "";

  // CLIENTS
  const totalClientExpensesMonthlyTotal = Array.isArray(clientExpenses)
    ? clientExpenses?.reduce(
        (total, income) => total + parseFloat(income.monthlyAmount),
        0
      )
    : "";

  const totalClientExpensesYearly = Array.isArray(clientExpenses)
    ? clientExpenses?.reduce(
        (total, income) => total + parseFloat(income.yearlyAmount),
        0
      )
    : "";

  // OPPOSING PARTY
  // const totalopposingPartyExpensesMonthlyTotal = Array.isArray(opposingPartyExpenses) ?
  //   opposingPartyExpenses?.reduce((total, income) => total + parseFloat(income.monthlyAmount), 0) : '';

  // const totalopposingPartyExpensesYearly = Array.isArray(opposingPartyExpenses) ?
  //   opposingPartyExpenses?.reduce((total, income) => total + parseFloat(income.yearlyAmount), 0) : '';

  const ClientExpensesDetails = () => {
    // Initialize an object to store the totals
    const totals = {};
    // Calculate totals for each type of income
    if (Array.isArray(clientExpenses)) {
      clientExpenses?.forEach((item) => {
        if (!totals[item.type]) {
          totals[item.type] = 0;
        }
        totals[item.type] += parseInt(item.monthlyAmount);
      });
    } else {
    }

    // Log the totals

    // totals['CPP contributions']
    const expenses = {
      expenses: {
        automaticDeductions: {
          cppContributions: totals["CPP contributions"] || 0,
          eiPremiums: totals["EI premiums"] || 0,
          incomeTaxes: totals["Income taxes"] || 0,
          employeePensionContributions:
            totals["Employee pension contributions"] || 0,
          unionDues: totals["Union dues"] || 0,
          subtotal:
            (parseInt(totals["CPP contributions"]) || 0) +
            (parseInt(totals["EI premiums"]) || 0) +
            (parseInt(totals["Income taxes"]) || 0) +
            (parseInt(totals["Employee pension contributions"]) || 0) +
            (parseInt(totals["Union dues"]) || 0),
        },
        housing: {
          rentOrMortgage: totals["Rent or mortgage"] || 0,
          propertyTaxes: totals["Property taxes"] || 0,
          propertyInsurance: totals["Property insurance"] || 0,
          condominiumFees: totals["Condominium fees"] || 0,
          repairsAndMaintenance: totals["Repairs and maintenance"] || 0,
          otherHousing: totals["Other Housing expense"] || 0,
          subtotal:
            (parseInt(totals["Rent or mortgage"]) || 0) +
            (parseInt(totals["Property taxes"]) || 0) +
            (parseInt(totals["Property insurance"]) || 0) +
            (parseInt(totals["Condominium fees"]) || 0) +
            (parseInt(totals["Repairs and maintenance"]) || 0) +
            (parseInt(totals["Other Housing expense"]) || 0),
        },
        utilities: {
          water: totals["Water"] || 0,
          heat: totals["Heat"] || 0,
          electricity: totals["Electricity"] || 0,
          telephone: totals["Telephone"] || 0,
          cellPhone: totals["Cell Phone"] || 0,
          cable: totals["Cable"] || 0,
          internet: totals["Internet"] || 0,
          utilities: totals["Utilities"] || 0,
          subtotal:
            (parseInt(totals["Water"]) || 0) +
            (parseInt(totals["Heat"]) || 0) +
            (parseInt(totals["Electricity"]) || 0) +
            (parseInt(totals["Telephone"]) || 0) +
            (parseInt(totals["Cell Phone"]) || 0) +
            (parseInt(totals["Cable"]) || 0) +
            (parseInt(totals["Internet"]) || 0) +
            (parseInt(totals["Utilities"]) || 0),
        },
        householdExpenses: {
          groceries: totals["Groceries"] || 0,
          foodAndHousingSupplies: totals["Food and Household supplies"] || 0,
          householdSupplies: totals["Household supplies"] || 0,
          mealsOutsideTheHome: totals["Meals outside the home"] || 0,
          petCare: totals["Pet care"] || 0,
          laundryAndDryCleaning: totals["Laundry and Dry Cleaning"] || 0,
          eatingOut: totals["Eating out"] || 0,
          telephoneCableTvInternet:
            totals["Telephone, Cable TV and Internet fees"] || 0,
          otherHousehold: totals["Other Household expenses"] || 0,
          subtotal:
            (parseInt(totals["Groceries"]) || 0) +
            (parseInt(totals["Food and Household supplies"]) || 0) +
            (parseInt(totals["Household supplies"]) || 0) +
            (parseInt(totals["Meals outside the home"]) || 0) +
            (parseInt(totals["Pet care"]) || 0) +
            (parseInt(totals["Laundry and Dry Cleaning"]) || 0) +
            (parseInt(totals["Eating out"]) || 0) +
            (parseInt(totals["Telephone, Cable TV and Internet fees"]) || 0) +
            (parseInt(totals["Other Household expenses"]) || 0),
        },
        childcare: {
          daycare: totals["Daycare expenses"] || 0,
          babysitting: totals["Babysitting costs"] || 0,
          subtotal:
            (parseInt(totals["Daycare expenses"]) || 0) +
            (parseInt(totals["Babysitting costs"]) || 0),
        },
        transportation: {
          publicTransit:
            totals["Public transit, taxis"] ||
            totals["Public transit, taxis and parking"] ||
            totals["Public transit and taxis"] ||
            0,
          carPayments: totals["Car Loan or Lease Payments"] || 0,
          gasAndOil: totals["Gas and oil"] || totals["Fuel"] || 0,
          insurance:
            totals["Car insurance and licence"] ||
            totals["Car insurance and car loan payment"] ||
            totals["Auto insurance"] ||
            0,
          repairsAndMaintenance: totals["Repairs and maintenance"] || 0,
          parking: totals["Parking"] || 0,
          licenseAndRegistration: totals["License and registration"] || 0,
          otherTransportation: totals["Other Transportation"] || 0,
          subtotal:
            (parseInt(totals["Public transit, taxis"]) ||
              parseInt(totals["Public transit, taxis and parking"]) ||
              parseInt(totals["Public transit and taxis"]) ||
              0) +
            (parseInt(totals["Car Loan or Lease Payments"]) || 0) +
            (parseInt(totals["Gas and oil"]) || parseInt(totals["Fuel"]) || 0) +
            (parseInt(totals["Car insurance and licence"]) ||
              parseInt(totals["Car insurance and car loan payment"]) ||
              parseInt(totals["Auto insurance"]) ||
              0) +
            (parseInt(totals["Repairs and maintenance"]) || 0) +
            (parseInt(totals["Parking"]) || 0) +
            (parseInt(totals["License and registration"]) || 0) +
            (parseInt(totals["Other Transportation"]) || 0),
        },
        health: {
          insurance: totals["Health insurance premiums"] || 0,
          dental: totals["Dental expenses"] || 0,
          medicine:
            totals["Medicine and drugs"] ||
            totals["Prescriptions and medicines"] ||
            0,
          eyecare: totals["Eye care"] || 0,
          subtotal:
            (parseInt(totals["Health insurance premiums"]) || 0) +
            (parseInt(totals["Dental expenses"]) || 0) +
            (parseInt(totals["Medicine and drugs"]) ||
              totals["Prescriptions and medicines"] ||
              0) +
            (parseInt(totals["Eye care"]) || 0),
        },
        personal: {
          clothing: totals["Clothing"] || 0,
          haircare: totals["Hair care and beauty"] || 0,
          alcohol: totals["Alcohol and tobacco"] || 0,
          education: totals["Education (specify)"] || 0,
          personalHygiene: totals["Personal hygiene"] || 0,
          entertainment:
            totals["Entertainment/recreation (including children)"] || 0,
          gifts: totals["Gifts"] || 0,
          subtotal:
            (parseInt(totals["Clothing"]) || 0) +
            (parseInt(totals["Hair care and beauty"]) || 0) +
            (parseInt(totals["Alcohol and tobacco"]) || 0) +
            (parseInt(totals["Education (specify)"]) || 0) +
            (parseInt(totals["Personal hygiene"]) || 0) +
            (parseInt(
              totals["Entertainment/recreation (including children)"]
            ) || 0) +
            (parseInt(totals["Gifts"]) || 0),
        },
        other: {
          lifeInsurance:
            totals["Life Insurance premiums"] || totals["Life insurance"] || 0,
          medicalAndDentalInsurance:
            totals["Medical and Dental Insurance"] || 0,
          birthdayAndChristmasGifts:
            totals["Birthday and Christmas Gifts"] || 0,
          rrsp: totals["RRSP/RESP withdrawals"] || 0,
          vacations: totals["Vacations"] || 0,
          school: totals["School fees and supplies"] || 0,
          clothingForChildren: totals["Clothing for children"] || 0,
          childrenActivities: totals["Children's activities"] || 0,
          summerCamp: totals["Summer camp expenses"] || 0,
          debtPayments:
            totals["Debt payments"] || totals["Other debt payment"] || 0,
          bankLoanPayments: totals["Bank loan payments"] || 0,
          supportPaidForOtherChildren:
            totals["Support paid for other children"] || 0,
          other: totals["Other expenses not shown above (specify)"] || 0,
          creditCardPauyments: totals["Credit card payments"] || 0,
          premiumsContributionsDebt:
            totals["Premiums, Contributions and Debt Repayment"] || 0,
          educationalExpenses: totals["Educational expenses"] || 0,
          miscellaneous: totals["Miscelleneous/Other"] || 0,
          supportForOthers: totals["Support for others"] || 0,
          subtotal:
            (parseInt(totals["Life Insurance premiums"]) ||
              totals["Life insurance"] ||
              0) +
            (parseInt(totals["RRSP/RESP withdrawals"]) || 0) +
            (parseInt(totals["Vacations"]) || 0) +
            (parseInt(totals["Birthday and Christmas Gifts"]) || 0) +
            (parseInt(totals["Medical and Dental Insurance"]) || 0) +
            (parseInt(totals["School fees and supplies"]) || 0) +
            (parseInt(totals["Clothing for children"]) || 0) +
            (parseInt(totals["Children's activities"]) || 0) +
            (parseInt(totals["Summer camp expenses"]) || 0) +
            (parseInt(totals["Debt payments"]) ||
              parseInt(totals["Other debt payment"]) ||
              0) +
            (parseInt(totals["Bank loan payments"]) || 0) +
            (parseInt(totals["Support paid for other children"]) || 0) +
            (parseInt(totals["Other expenses not shown above (specify)"]) ||
              0) +
            (parseInt(totals["Premiums, Contributions and Debt Repayment"]) ||
              0) +
            (parseInt(totals["Credit card payments"]) || 0) +
            (parseInt(totals["Educational expenses"]) || 0) +
            (parseInt(totals["Support for others"]) || 0) +
            (parseInt(totals["Miscelleneous/Other"]) || 0),
        },
        totalMonthlyExpenses: totalClientExpensesMonthlyTotal || 0,
        totalYearlyExpenses: totalClientExpensesYearly || 0,
      },
    };

    return expenses;
  };
  // formatNumberInThousands
  const opposingPartyExpensesDetails = () => {
    // Initialize an object to store the totals
    const totals = {};

    // Calculate totals for each type of income
    if (Array.isArray(opposingPartyExpenses)) {
      opposingPartyExpenses?.forEach((item) => {
        if (!totals[item.type]) {
          totals[item.type] = 0;
        }
        totals[item.type] += parseInt(item.monthlyAmount);
      });
    } else {
    }

    // Log the totals

    const expenses = {
      expenses: {
        automaticDeductions: {
          cppContributions: totals["CPP contributions"] || 0,
          eiPremiums: totals["EI premiums"] || 0,
          incomeTaxes: totals["Income taxes"] || 0,
          employeePensionContributions:
            totals["Employee pension contributions"] || 0,
          unionDues: totals["Union dues"] || 0,
          subtotal:
            (parseInt(totals["CPP contributions"]) || 0) +
            (parseInt(totals["EI premiums"]) || 0) +
            (parseInt(totals["Income taxes"]) || 0) +
            (parseInt(totals["Employee pension contributions"]) || 0) +
            (parseInt(totals["Union dues"]) || 0),
        },
        housing: {
          rentOrMortgage: totals["Rent or mortgage"] || 0,
          propertyTaxes: totals["Property taxes"] || 0,
          propertyInsurance: totals["Property insurance"] || 0,
          condominiumFees: totals["Condominium fees"] || 0,
          repairsAndMaintenance: totals["Repairs and maintenance"] || 0,
          otherHousing: totals["Other Housing expense"] || 0,
          subtotal:
            (parseInt(totals["Rent or mortgage"]) || 0) +
            (parseInt(totals["Property taxes"]) || 0) +
            (parseInt(totals["Property insurance"]) || 0) +
            (parseInt(totals["Condominium fees"]) || 0) +
            (parseInt(totals["Repairs and maintenance"]) || 0) +
            (parseInt(totals["Other Housing expense"]) || 0),
        },
        utilities: {
          water: totals["Water"] || 0,
          heat: totals["Heat"] || 0,
          electricity: totals["Electricity"] || 0,
          telephone: totals["Telephone"] || 0,
          cellPhone: totals["Cell Phone"] || 0,
          cable: totals["Cable"] || 0,
          internet: totals["Internet"] || 0,
          utilities: totals["Utilities"] || 0,
          subtotal:
            (parseInt(totals["Water"]) || 0) +
            (parseInt(totals["Heat"]) || 0) +
            (parseInt(totals["Electricity"]) || 0) +
            (parseInt(totals["Telephone"]) || 0) +
            (parseInt(totals["Cell Phone"]) || 0) +
            (parseInt(totals["Cable"]) || 0) +
            (parseInt(totals["Internet"]) || 0) +
            (parseInt(totals["Utilities"]) || 0),
        },
        householdExpenses: {
          groceries: totals["Groceries"] || 0,
          foodAndHousingSupplies: totals["Food and Household supplies"] || 0,
          householdSupplies: totals["Household supplies"] || 0,
          mealsOutsideTheHome: totals["Meals outside the home"] || 0,
          petCare: totals["Pet care"] || 0,
          laundryAndDryCleaning: totals["Laundry and Dry Cleaning"] || 0,
          eatingOut: totals["Eating out"] || 0,
          telephoneCableTvInternet:
            totals["Telephone, Cable TV and Internet fees"] || 0,
          otherHousehold: totals["Other Household expenses"] || 0,
          subtotal:
            (parseInt(totals["Groceries"]) || 0) +
            (parseInt(totals["Food and Household supplies"]) || 0) +
            (parseInt(totals["Household supplies"]) || 0) +
            (parseInt(totals["Meals outside the home"]) || 0) +
            (parseInt(totals["Pet care"]) || 0) +
            (parseInt(totals["Laundry and Dry Cleaning"]) || 0) +
            (parseInt(totals["Eating out"]) || 0) +
            (parseInt(totals["Telephone, Cable TV and Internet fees"]) || 0) +
            (parseInt(totals["Other Household expenses"]) || 0),
        },
        childcare: {
          daycare: totals["Daycare expenses"] || 0,
          babysitting: totals["Babysitting costs"] || 0,
          subtotal:
            (parseInt(totals["Daycare expenses"]) || 0) +
            (parseInt(totals["Babysitting costs"]) || 0),
        },
        transportation: {
          publicTransit:
            totals["Public transit, taxis"] ||
            totals["Public transit, taxis and parking"] ||
            totals["Public transit and taxis"] ||
            0,
          carPayments: totals["Car Loan or Lease Payments"] || 0,
          gasAndOil: totals["Gas and oil"] || totals["Fuel"] || 0,
          insurance:
            totals["Car insurance and licence"] ||
            totals["Car insurance and car loan payment"] ||
            totals["Auto insurance"] ||
            0,
          repairsAndMaintenance: totals["Repairs and maintenance"] || 0,
          parking: totals["Parking"] || 0,
          licenseAndRegistration: totals["License and registration"] || 0,
          otherTransportation: totals["Other Transportation"] || 0,
          subtotal:
            (parseInt(totals["Public transit, taxis"]) ||
              parseInt(totals["Public transit, taxis and parking"]) ||
              parseInt(totals["Public transit and taxis"]) ||
              0) +
            (parseInt(totals["Car Loan or Lease Payments"]) || 0) +
            (parseInt(totals["Gas and oil"]) || parseInt(totals["Fuel"]) || 0) +
            (parseInt(totals["Car insurance and licence"]) ||
              parseInt(totals["Car insurance and car loan payment"]) ||
              parseInt(totals["Auto insurance"]) ||
              0) +
            (parseInt(totals["Repairs and maintenance"]) || 0) +
            (parseInt(totals["Parking"]) || 0) +
            (parseInt(totals["License and registration"]) || 0) +
            (parseInt(totals["Other Transportation"]) || 0),
        },
        health: {
          insurance: totals["Health insurance premiums"] || 0,
          dental: totals["Dental expenses"] || 0,
          medicine:
            totals["Medicine and drugs"] ||
            totals["Prescriptions and medicines"] ||
            0,
          eyecare: totals["Eye care"] || 0,
          subtotal:
            (parseInt(totals["Health insurance premiums"]) || 0) +
            (parseInt(totals["Dental expenses"]) || 0) +
            (parseInt(totals["Medicine and drugs"]) ||
              totals["Prescriptions and medicines"] ||
              0) +
            (parseInt(totals["Eye care"]) || 0),
        },
        personal: {
          clothing: totals["Clothing"] || 0,
          haircare: totals["Hair care and beauty"] || 0,
          alcohol: totals["Alcohol and tobacco"] || 0,
          education: totals["Education (specify)"] || 0,
          personalHygiene: totals["Personal hygiene"] || 0,
          entertainment:
            totals["Entertainment/recreation (including children)"] || 0,
          gifts: totals["Gifts"] || 0,
          subtotal:
            (parseInt(totals["Clothing"]) || 0) +
            (parseInt(totals["Hair care and beauty"]) || 0) +
            (parseInt(totals["Alcohol and tobacco"]) || 0) +
            (parseInt(totals["Education (specify)"]) || 0) +
            (parseInt(totals["Personal hygiene"]) || 0) +
            (parseInt(
              totals["Entertainment/recreation (including children)"]
            ) || 0) +
            (parseInt(totals["Gifts"]) || 0),
        },
        other: {
          lifeInsurance:
            totals["Life Insurance premiums"] || totals["Life insurance"] || 0,
          medicalAndDentalInsurance:
            totals["Medical and Dental Insurance"] || 0,
          birthdayAndChristmasGifts:
            totals["Birthday and Christmas Gifts"] || 0,
          rrsp: totals["RRSP/RESP withdrawals"] || 0,
          vacations: totals["Vacations"] || 0,
          school: totals["School fees and supplies"] || 0,
          clothingForChildren: totals["Clothing for children"] || 0,
          childrenActivities: totals["Children's activities"] || 0,
          summerCamp: totals["Summer camp expenses"] || 0,
          debtPayments:
            totals["Debt payments"] || totals["Other debt payment"] || 0,
          bankLoanPayments: totals["Bank loan payments"] || 0,
          supportPaidForOtherChildren:
            totals["Support paid for other children"] || 0,
          other: totals["Other expenses not shown above (specify)"] || 0,
          creditCardPayments: totals["Credit card payments"] || 0,
          premiumsContributionsDebt:
            totals["Premiums, Contributions and Debt Repayment"] || 0,
          educationalExpenses: totals["Educational expenses"] || 0,
          miscellaneous: totals["Miscelleneous/Other"] || 0,
          supportForOthers: totals["Support for others"] || 0,
          subtotal:
            (parseInt(totals["Life Insurance premiums"]) ||
              totals["Life insurance"] ||
              0) +
            (parseInt(totals["RRSP/RESP withdrawals"]) || 0) +
            (parseInt(totals["Vacations"]) || 0) +
            (parseInt(totals["Birthday and Christmas Gifts"]) || 0) +
            (parseInt(totals["Medical and Dental Insurance"]) || 0) +
            (parseInt(totals["School fees and supplies"]) || 0) +
            (parseInt(totals["Clothing for children"]) || 0) +
            (parseInt(totals["Children's activities"]) || 0) +
            (parseInt(totals["Summer camp expenses"]) || 0) +
            (parseInt(totals["Debt payments"]) ||
              parseInt(totals["Other debt payment"]) ||
              0) +
            (parseInt(totals["Bank loan payments"]) || 0) +
            (parseInt(totals["Support paid for other children"]) || 0) +
            (parseInt(totals["Other expenses not shown above (specify)"]) ||
              0) +
            (parseInt(totals["Premiums, Contributions and Debt Repayment"]) ||
              0) +
            (parseInt(totals["Credit card payments"]) || 0) +
            (parseInt(totals["Educational expenses"]) || 0) +
            (parseInt(totals["Support for others"]) || 0) +
            (parseInt(totals["Miscelleneous/Other"]) || 0),
        },
        totalMonthlyExpenses: totalClientExpensesMonthlyTotal || 0,
        totalYearlyExpenses: totalClientExpensesYearly || 0,
      },
    };

    // // Calculate total monthly income
    // sources.totalMonthlyIncome =
    //   Object.values(totals).reduce((total, amount) => total + amount, 0) || 0

    // // Calculate total annual income
    // sources.totalAnnualIncome = sources.totalMonthlyIncome
    //   ? sources.totalMonthlyIncome * 12
    //   : ''

    return expenses;
  };

  const ExpenseDetailsClient = ClientExpensesDetails();
  const ExpenseDetailsOpposingParty = opposingPartyExpensesDetails();

  return {
    ExpenseDetailsClient,
    ExpenseDetailsOpposingParty,
    clientSpecialExpenses,
    opposingPartySpecialExpenses,
  };
}
