import { useDispatch, useSelector } from "react-redux"
import { useEffect } from "react"
import { getSingleMatterData } from "../getSingleMatterData/getSingleMattersDataActions"
import { selectDataSingleMatterIncomeBenefitsData, selectDataSingleMatterIncomeBenefitsError, selectDataSingleMatterIncomeBenefitsLoading } from "../getSingleMatterData/getSingleMattersDataSelectors"

export function IncomeBenefits (matterId) {
    const dispatch = useDispatch()
    useEffect(() => {
      const fetchData = async () => {
         dispatch(getSingleMatterData(matterId, 'incomeBenefits'))
      }
      fetchData()
    }, [dispatch,matterId])
  
    const selectIncomeData = useSelector(selectDataSingleMatterIncomeBenefitsData)
    const selectIncomeDataLoading = useSelector(
      selectDataSingleMatterIncomeBenefitsLoading
    )
    const selectIncomeDataError = useSelector(
      selectDataSingleMatterIncomeBenefitsError
    )
  
    return {
      selectIncomeData,
      selectIncomeDataLoading,
      selectIncomeDataError
    }
  }


  export function IncomeSource(data){
     // incomeBenefit

  const selectIncomeData = data;

  const incomeBenefit = {
    client: {
      income:
       selectIncomeData.filter(
          data => data.role === 'Client' && data.incomeBenefit === 'income'
        ) || [],
      benefit:
       selectIncomeData.filter(
          data => data.role === 'Client' && data.incomeBenefit === 'benefit'
        ) || []
    },
    opposingParty: {
      income:
       selectIncomeData.filter(
          data =>
            data.role === 'opposingParty' && data.incomeBenefit === 'income'
        ) || [],
      benefit:
       selectIncomeData.filter(
          data =>
            data.role === 'opposingParty' && data.incomeBenefit === 'benefit'
        ) || []
    }
  }

  const clientIncome = incomeBenefit.client.income
  // const opposingPartyIncome = incomeBenefit.opposingParty.income

  // const totalClientIncome =
  //   clientIncome.reduce(
  //     (total, income) => total + parseFloat(income.monthlyAmount),
  //     0
  //   ) * 12
    
  // const totalOpposingPartyIncome =
  //   opposingPartyIncome.reduce(
  //     (total, income) => total + parseFloat(income.monthlyAmount),
  //     0
  //   ) * 12

  const incomeSources = () => {
    // Initialize an object to store the totals
    const totals = {}

    // Calculate totals for each type of income
    clientIncome.forEach(item => {
      if (!totals[item.type]) {
        totals[item.type] = 0
      }
      totals[item.type] += parseInt(item.monthlyAmount)
    })

    // Log the totals

    const sources = {
      employmentIncome: totals['Employment income (before deductions)'] || '',
      commissionTipsBonuses: totals['Commissions, tips and bonuses'] || '',
      selfEmploymentIncome: totals['Self-employment income'] || '',
      employmentInsuranceBenefits: totals['Employment insurance benefits'] || '',
      workersCompensationBenefits: totals["Workers' compensation benefits"] || '',
      socialAssistanceIncome: totals['Social assistance income (including ODSP payments)'] || '',
      interestInvestmentIncome: totals['Interest and investment income'] || '',
      pensionIncome: totals['Pension income (including CPP and OAS)'] || '',
      spousalSupport: totals['Spousal support received from a former spouse/partner'] || '',
      childTaxBenefits: totals['Child tax benefits'] || '',
      otherIncome: totals['Other sources of income'] || '',
      totalMonthlyIncome: '', // Total monthly income (sum of all above incomes)
      totalAnnualIncome: '' // Total annual income (multiply total monthly income by 12)
    }

    // Calculate total monthly income
    sources.totalMonthlyIncome =
      Object.values(totals).reduce((total, amount) => total + amount, 0) || ''

    // Calculate total annual income
    sources.totalAnnualIncome = sources.totalMonthlyIncome
      ? sources.totalMonthlyIncome * 12
      : ''

    return sources
  }

  const income = incomeSources()

  return {
    income
  }
  }