import { useDispatch, useSelector } from 'react-redux'
import { useEffect } from 'react'
import { getSingleMatterData } from '../getSingleMatterData/getSingleMattersDataActions'
import {
  selectDataSingleMatterAssetsData,
  selectDataSingleMatterAssetsError,
  selectDataSingleMatterAssetsLoading
} from '../getSingleMatterData/getSingleMattersDataSelectors'
import { RelationshipData } from './DocumentViewDataUpdate'
import { DebtData } from './DebtData'

export function AssetsData(matterId) {
  const dispatch = useDispatch()

  useEffect(() => {
    const fetchData = async () => {
      dispatch(getSingleMatterData(matterId, 'assets'))
    }
    fetchData()
  }, [dispatch, matterId])

  const selectAssetsData = useSelector(selectDataSingleMatterAssetsData)
  const selectAssetsDataLoading = useSelector(
    selectDataSingleMatterAssetsLoading
  )
  const selectAssetsDataError = useSelector(selectDataSingleMatterAssetsError)

  return {
    selectAssetsData,
    selectAssetsDataLoading,
    selectAssetsDataError
  }
}

export function AssetsDetails(data, matterId) {
  const { selectDebt } = DebtData(matterId)
  const { selectRelationship } = RelationshipData(matterId)

  const details = data
  const AssetData = details?.body

  const landSum = AssetData?.lands?.reduce(
    (acc, item) => acc + parseInt(item.market_value.client.today || 0),
    0
  )
  const householdSum = AssetData?.general_household_items_and_vehicles?.reduce(
    (acc, item) => acc + parseInt(item.market_value.client.today || 0),
    0
  )
  const lifeSum = AssetData?.life_and_disability_insurance?.reduce(
    (acc, item) => acc + parseInt(item.market_value.client.today || 0),
    0
  )
  const bankSum = AssetData?.bank_accounts_savings_securities_pension?.reduce(
    (acc, item) => acc + parseInt(item.market_value.client.today || 0),
    0
  )
  const otherPropertySum = AssetData?.other_property?.reduce(
    (acc, item) => acc + parseInt(item.market_value.client.today || 0),
    0
  )
  const moneyOwedSum = AssetData?.money_owed_to_you?.reduce(
    (acc, item) => acc + parseInt(item.market_value.client.today || 0),
    0
  )
  const interests = AssetData?.business_interest?.reduce(
    (acc, item) => acc + parseInt(item.market_value.client.today || 0),
    0
  )


  const assetDetailsArray = {
    assets: {
      dateOfMarriage: (selectRelationship?.body[0]?.dateOfMarriage !== undefined) ? selectRelationship.body[0].dateOfMarriage : '',
      dateOfValuation: '',
      dateOfCommencement: '',
      land: {
        ownership: '',
        address: '',
        onDateOfMarriage: '',
        onValuationDate: '',
        today: '',
        total1: '',
        total2: ''
      },
      household: [],
      bank: [],
      life: [],
      interests: [],
      moneyOwed: [],
      otherProperty: [],
      debts: [],
      property: {
        land: {
          assets: landSum || 0,
          liabilities: ''
        },
        household: {
          assets: householdSum || 0,
          liabilities: ''
        },
        bank: {
          assets: bankSum || 0,
          liabilities: ''
        },
        life: {
          assets: lifeSum || 0,
          liabilities: ''
        },
        interests: {
          assets: interests || 0,
          liabilities: ''
        },
        moneyOwed: {
          assets: moneyOwedSum || 0,
          liabilities: ''
        },
        otherProperty: {
          assets: otherPropertySum || 0,
          liabilities: ''
        },
        debts: {
          assets: '',
          liabilities: ''
        },
        total1:
          parseInt(landSum || 0) +
          parseInt(householdSum || 0) +
          parseInt(bankSum || 0) +
          parseInt(lifeSum || 0) +
          parseInt(interests || 0) +
          parseInt(moneyOwedSum || 0) +
          parseInt(otherPropertySum || 0),
        total2: '',
        netValue1: '',
        netValue2: '',
        valueOfDeductions1: '',
        valueOfDeductions2: ''
      },
      excluded: {
        category: '',
        details: '',
        onValuationDate: '',
        total: ''
      },
      disposed: {
        category: '',
        details: '',
        onValuationDate: '',
        total: ''
      },
      calculations: {
        allProperty: '',
        subtractDeductions: {
          deductions: '',
          balance: ''
        },
        subtractExcluded: {
          deductions: '',
          balance: ''
        },
        netFamilyProperty: ''
      }
    },
    debts: []
  }
  
  assetDetailsArray.debts = selectDebt?.body.map(item => ({
    category: item.category,
    details: item.details,
    on_date_of_marriage: item.on_date_of_marriage || 0,
    on_valuation_date: item.on_valuation_date || 0, // Add the relevant data if available
    today: item.today || 0
  })) || [];
  // Assuming `assetsArray` is the object where you want to add the data
  assetDetailsArray.assets.land = AssetData?.lands?.map(item => ({
    ownership: item.nature_and_type_of_ownership,
    address: item.address_of_property,
    onDateOfMarriage: item.market_value.client.on_date_of_marriage,
    onValuationDate: item.market_value.client.on_valuation_date,
    today: item.market_value.client.today,
    total1: item.market_value.opposing_party.on_valuation_date,
    total2: item.market_value.opposing_party.today
  })) || [];

  // Assuming `assetsArray` is the object where you want to add the data
  assetDetailsArray.assets.household = AssetData?.general_household_items_and_vehicles?.map(item => ({
    item: item.item,
    description: item.description_ghiav,
    isInPossession: item.isInPossession,
    onDateOfMarriage: item.market_value.client.on_date_of_marriage,
    onValuationDate: item.market_value.client.on_valuation_date,
    today: item.market_value.client.today,
    total1: item.market_value.opposing_party.on_valuation_date,
    total2: item.market_value.opposing_party.today
  })) || [];

  // Assuming `assetsArray` is the object where you want to add the data
  assetDetailsArray.assets.life = AssetData?.life_and_disability_insurance?.map(
    item => ({
      policy_no: item.policy_no,
      owner: item.owner,
      beneficiary: item.beneficiary,
      face_amount: item.face_amount,
      property_status_ladi: item.property_status_ladi,
      onDateOfMarriage: item.market_value.client.on_date_of_marriage,
      onValuationDate: item.market_value.client.on_valuation_date,
      today: item.market_value.client.today,
      total1: item.market_value.opposing_party.on_valuation_date,
      total2: item.market_value.opposing_party.today
    })
  ) || [];

  // Assuming `assetsArray` is the object where you want to add the data
  assetDetailsArray.assets.bank =
    AssetData?.bank_accounts_savings_securities_pension?.map(item => ({
      category: item.category_bassp,
      institution: item.institution,
      description_bassp: item.description_bassp,
      account_number: item.account_number,
      property_status_bassp: item.property_status_bassp,
      onDateOfMarriage: item.market_value.client.on_date_of_marriage,
      onValuationDate: item.market_value.client.on_valuation_date,
      today: item.market_value.client.today,
      total1: item.market_value.opposing_party.on_valuation_date,
      total2: item.market_value.opposing_party.today
    })) || [];

  // Assuming `assetsArray` is the object where you want to add the data
  assetDetailsArray.assets.interests = AssetData?.business_interest?.map(
    item => ({
      firm_name: item.firm_name,
      interest: item.interest,
      status: item.property_status_op,
      onDateOfMarriage: item.market_value.client.on_date_of_marriage,
      onValuationDate: item.market_value.client.on_valuation_date,
      today: item.market_value.client.today,
      total1: item.market_value.opposing_party.on_valuation_date,
      total2: item.market_value.opposing_party.today
    })
  ) || [];

  // Assuming `assetsArray` is the object where you want to add the data
  assetDetailsArray.assets.moneyOwed = AssetData?.money_owed_to_you?.map(
    item => ({
      details: item.details_moty,
      interest: item.institution,
      status: item.property_status_moty,
      onDateOfMarriage: item.market_value.client.on_date_of_marriage,
      onValuationDate: item.market_value.client.on_valuation_date,
      today: item.market_value.client.today,
      total1: item.market_value.opposing_party.on_valuation_date,
      total2: item.market_value.opposing_party.today
    })
  ) || [];

  // Assuming `assetsArray` is the object where you want to add the data
  assetDetailsArray.assets.otherProperty = AssetData?.other_property?.map(
    item => ({
      category: item.category_op,
      details: item.details_op,
      status: item.property_status_op,
      onDateOfMarriage: item.market_value.client.on_date_of_marriage,
      onValuationDate: item.market_value.client.on_valuation_date,
      today: item.market_value.client.today,
      total1: item.market_value.opposing_party.on_valuation_date,
      total2: item.market_value.opposing_party.today
    })
  ) || [];

  assetDetailsArray.assets.totalValue =
    parseInt(landSum || 0) +
    parseInt(householdSum || 0) +
    parseInt(bankSum || 0) +
    parseInt(lifeSum || 0) +
    parseInt(interests || 0) +
    parseInt(moneyOwedSum || 0) +
    parseInt(otherPropertySum || 0)

  const assetsSum = {
    client: {
      landSum: landSum,
      householdSum: householdSum,
      lifeSum: lifeSum,
      bankSum: bankSum,
      otherPropertySum: otherPropertySum,
      moneyOwedSum: moneyOwedSum,
      interests: interests
    }
  }

  const combinedAssets = Object.entries(AssetData || {}).reduce(
    (acc, [key, arr]) => {
      const modifiedArray = arr.map(item => {
        let itemName = ''
        let additionalFields = {}

        if (key === 'bank_accounts_savings_securities_pension') {
          itemName = 'Bank Accounts, Savings, Securities, Pension'
          additionalFields = {
            category: item.category_bassp,
            institution: item.institution,
            description: item.description_bassp,
            account_number: item.account_number,
            property_status: item.property_status_bassp
          }
        } else if (key === 'lands') {
          itemName = 'Lands'
          additionalFields = {
            ownership: item.nature_and_type_of_ownership,
            address: item.address_of_property,
            property_status: item.property_status
          }
        } else if (key === 'money_owed_to_you') {
          itemName = 'Money Owed To You'
          additionalFields = {
            details: item.details_moty,
            property_status: item.property_status_moty
          }
        } else if (key === 'business_interest') {
          itemName = 'Business Interest'
          additionalFields = {
            firm_name: item.firm_name,
            interest: item.interest,
            property_status: item.property_status_bi
          }
        } else if (key === 'life_and_disability_insurance') {
          itemName = 'Life and Disability Insurance'
          additionalFields = {
            insurance_type: item.insurance_type,
            policy_no: item.policy_no,
            owner: item.owner,
            beneficiary: item.beneficiary,
            face_amount: item.face_amount,
            property_status: item.property_status_ladi
          }
        } else if (key === 'other_property') {
          itemName = 'Other Property'
          additionalFields = {
            category: item.category_op,
            details: item.details_op,
            property_status: item.property_status_op
          }
        } else if (key === 'general_household_items_and_vehicles') {
          itemName = item.item || ''
          additionalFields = {
            description: item.description_ghiav,
            isInPossession: item.isInPossession,
            property_status: item.property_status_ghiav
          }
        }

        return {
          key: key,
          item: itemName,
          id: item.id,
          ...additionalFields,
          market_value: item.market_value || {
            client: {
              id: '',
              asset_id: '',
              on_date_of_marriage: '',
              on_valuation_date: '',
              today: ''
            },
            opposing_party: {
              id: '',
              asset_id: '',
              on_date_of_marriage: '',
              on_valuation_date: '',
              today: ''
            }
          }
        }
      })

      acc.items = acc.items.concat(modifiedArray)
      return acc
    },
    { items: [], totals: { client: 0, opposing_party: 0 } }
  )

  // Calculate total market value for client and opposing party
  combinedAssets.totals.client = combinedAssets.items.reduce((total, item) => {
    return total + parseInt(item.market_value.client.today || 0)
  }, 0)
  combinedAssets.totals.opposing_party = combinedAssets.items.reduce(
    (total, item) => {
      return total + parseInt(item.market_value.opposing_party.today || 0)
    },
    0
  )

  // Filter items with "Lands", "Real Estate", and "Other Property" as the "item" value
  const filteredItems = combinedAssets.items.filter(item => {
    return item.item === "Lands" || item.item === "Real Estate" || item.item === "Other Property";
  });

  // Calculate totals for client and opposing party
  let totalClient = 0;
  let totalOpposingParty = 0;

  // Helper function to convert empty values to 0
  const convertToNumber = value => {
    return value.trim() === "" ? 0 : parseInt(value);
  };

  filteredItems.forEach(item => {
    totalClient += convertToNumber(item.market_value.client.today);
    totalOpposingParty += convertToNumber(item.market_value.opposing_party.today);
  });

  const propertiesAssets = {
    items: filteredItems,
    totals: {
      client: totalClient,
      opposing_party: totalOpposingParty
    }
  };



  // Calculate total value separately
  const totalValue = selectDebt?.body.reduce((acc, item) => acc + parseInt(item.today), 0);

  const debtsArray = {
    items: selectDebt?.body,
    totalValue: totalValue,
  };

  return {
    assetDetailsArray,
    assetsSum,
    combinedAssets,
    debtsArray,
    propertiesAssets
  }
}

export function AssetsInfo(data, matterId, selectSingleMatter) {
  const { selectDebt } = DebtData(matterId)
  const { selectRelationship } = RelationshipData(matterId)

  const details = data
  const AssetData = details

  const landSum = AssetData?.lands?.reduce(
    (acc, item) => acc + parseInt(item.market_value.client.on_date_of_marriage || 0),
    0
  )
  const householdSum = AssetData?.general_household_items_and_vehicles?.reduce(
    (acc, item) => acc + parseInt(item.market_value.client.on_date_of_marriage || 0),
    0
  )
  const lifeSum = AssetData?.life_and_disability_insurance?.reduce(
    (acc, item) => acc + parseInt(item.market_value.client.on_date_of_marriage || 0),
    0
  )
  const bankSum = AssetData?.bank_accounts_savings_securities_pension?.reduce(
    (acc, item) => acc + parseInt(item.market_value.client.on_date_of_marriage || 0),
    0
  )
  const otherPropertySum = AssetData?.other_property?.reduce(
    (acc, item) => acc + parseInt(item.market_value.client.on_date_of_marriage || 0),
    0
  )
  const moneyOwedSum = AssetData?.money_owed_to_you?.reduce(
    (acc, item) => acc + parseInt(item.market_value.client.on_date_of_marriage || 0),
    0
  )
  const interests = AssetData?.business_interest?.reduce(
    (acc, item) => acc + parseInt(item.market_value.client.on_date_of_marriage || 0),
    0
  )

  const assetDetailsArray = {
    assets: {
      dateOfMarriage: (selectRelationship?.body[0]?.dateOfMarriage !== undefined) ? selectRelationship.body[0].dateOfMarriage : '',
      dateOfValuation: (selectSingleMatter?.body[0]?.valuation_date !== undefined) ? selectSingleMatter?.body[0]?.valuation_date : '',
      dateOfCommencement: '',
      land: {
        ownership: '',
        address: '',
        onDateOfMarriage: '',
        onValuationDate: '',
        today: '',
        total1: '',
        total2: ''
      },
      household: [],
      bank: [],
      life: [],
      interests: [],
      moneyOwed: [],
      otherProperty: [],
      debts: [],
      property: {
        land: {
          assets: landSum || 0,
          liabilities: ''
        },
        household: {
          assets: householdSum || 0,
          liabilities: ''
        },
        bank: {
          assets: bankSum || 0,
          liabilities: ''
        },
        life: {
          assets: lifeSum || 0,
          liabilities: ''
        },
        interests: {
          assets: interests || 0,
          liabilities: ''
        },
        moneyOwed: {
          assets: moneyOwedSum || 0,
          liabilities: ''
        },
        otherProperty: {
          assets: otherPropertySum || 0,
          liabilities: ''
        },
        debts: {
          assets: '',
          liabilities: ''
        },
        total1:
          parseInt(landSum || 0) +
          parseInt(householdSum || 0) +
          parseInt(bankSum || 0) +
          parseInt(lifeSum || 0) +
          parseInt(interests || 0) +
          parseInt(moneyOwedSum || 0) +
          parseInt(otherPropertySum || 0),
        total2: '',
        netValue1: '',
        netValue2: '',
        valueOfDeductions1: '',
        valueOfDeductions2: ''
      },
      excluded: {
        category: '',
        details: '',
        onValuationDate: '',
        total: ''
      },
      disposed: {
        category: '',
        details: '',
        onValuationDate: '',
        total: ''
      },
      calculations: {
        allProperty: '',
        subtractDeductions: {
          deductions: '',
          balance: ''
        },
        subtractExcluded: {
          deductions: '',
          balance: ''
        },
        netFamilyProperty: ''
      }
    },
    debts: []
  }
  assetDetailsArray.debts = selectDebt?.body.map(item => ({
    category: item.category,
    details: item.details,
    on_date_of_marriage: item.on_date_of_marriage || 0,
    on_valuation_date: item.on_valuation_date || 0, // Add the relevant data if available
    today: item.today || 0
  })) || [];
  // Assuming `assetsArray` is the object where you want to add the data
  assetDetailsArray.assets.land = AssetData?.lands?.map(item => ({
    ownership: item.nature_and_type_of_ownership,
    address: item.address_of_property,
    property_status: item.property_status,
    market_value: item.market_value,
    onDateOfMarriage: item.market_value.client.on_date_of_marriage,
    onValuationDate: item.market_value.client.on_valuation_date,
    today: item.market_value.client.today,
    total1: item.market_value.opposing_party.on_valuation_date,
    total2: item.market_value.opposing_party.today
  })) || [];

  // Assuming `assetsArray` is the object where you want to add the data
  assetDetailsArray.assets.household = AssetData?.general_household_items_and_vehicles?.map(item => ({
    item: item.item,
    description: item.description_ghiav,
    isInPossession: item.isInPossession,
    property_status: item.property_status_ghiav,
    market_value: item.market_value,
    onDateOfMarriage: item.market_value.client.on_date_of_marriage,
    onValuationDate: item.market_value.client.on_valuation_date,
    today: item.market_value.client.today,
    total1: item.market_value.opposing_party.on_valuation_date,
    total2: item.market_value.opposing_party.today
  })) || [];

  // Assuming `assetsArray` is the object where you want to add the data
  assetDetailsArray.assets.life = AssetData?.life_and_disability_insurance?.map(
    item => ({
      policy_no: item.policy_no,
      owner: item.owner,
      beneficiary: item.beneficiary,
      face_amount: item.face_amount,
      property_status: item.property_status_ladi,
      market_value: item.market_value,
      onDateOfMarriage: item.market_value.client.on_date_of_marriage,
      onValuationDate: item.market_value.client.on_valuation_date,
      today: item.market_value.client.today,
      total1: item.market_value.opposing_party.on_valuation_date,
      total2: item.market_value.opposing_party.today
    })
  ) || [];

  // Assuming `assetsArray` is the object where you want to add the data
  assetDetailsArray.assets.bank =
    AssetData?.bank_accounts_savings_securities_pension?.map(item => ({
      category: item.category_bassp,
      institution: item.institution,
      description_bassp: item.description_bassp,
      account_number: item.account_number,
      property_status: item.property_status_bassp,
      market_value: item.market_value,
      onDateOfMarriage: item.market_value.client.on_date_of_marriage,
      onValuationDate: item.market_value.client.on_valuation_date,
      today: item.market_value.client.today,
      total1: item.market_value.opposing_party.on_valuation_date,
      total2: item.market_value.opposing_party.today
    })) || [];

  // Assuming `assetsArray` is the object where you want to add the data
  assetDetailsArray.assets.interests = AssetData?.business_interest?.map(
    item => ({
      firm_name: item.firm_name,
      interest: item.interest,
      property_status: item.property_status_bi,
      market_value: item.market_value,
      onDateOfMarriage: item.market_value.client.on_date_of_marriage,
      onValuationDate: item.market_value.client.on_valuation_date,
      today: item.market_value.client.today,
      total1: item.market_value.opposing_party.on_valuation_date,
      total2: item.market_value.opposing_party.today
    })
  ) || [];

  // Assuming `assetsArray` is the object where you want to add the data
  assetDetailsArray.assets.moneyOwed = AssetData?.money_owed_to_you?.map(
    item => ({
      details: item.details_moty,
      interest: item.institution,
      property_status: item.property_status_moty,
      market_value: item.market_value,
      onDateOfMarriage: item.market_value.client.on_date_of_marriage,
      onValuationDate: item.market_value.client.on_valuation_date,
      today: item.market_value.client.today,
      total1: item.market_value.opposing_party.on_valuation_date,
      total2: item.market_value.opposing_party.today
    })
  ) || [];

  // Assuming `assetsArray` is the object where you want to add the data
  assetDetailsArray.assets.otherProperty = AssetData?.other_property?.map(
    item => ({
      category: item.category_op,
      details: item.details_op,
      property_status: item.property_status_op,
      market_value: item.market_value,
      onDateOfMarriage: item.market_value.client.on_date_of_marriage,
      onValuationDate: item.market_value.client.on_valuation_date,
      today: item.market_value.client.today,
      total1: item.market_value.opposing_party.on_valuation_date,
      total2: item.market_value.opposing_party.today
    })
  ) || [];

  assetDetailsArray.assets.totalValue =
    parseInt(landSum || 0) +
    parseInt(householdSum || 0) +
    parseInt(bankSum || 0) +
    parseInt(lifeSum || 0) +
    parseInt(interests || 0) +
    parseInt(moneyOwedSum || 0) +
    parseInt(otherPropertySum || 0)

  const assetsSum = {
    client: {
      landSum: landSum,
      householdSum: householdSum,
      lifeSum: lifeSum,
      bankSum: bankSum,
      otherPropertySum: otherPropertySum,
      moneyOwedSum: moneyOwedSum,
      interests: interests
    }
  }


  const combinedAssets = Object.entries(AssetData || {}).reduce(
    (acc, [key, arr]) => {
      const modifiedArray = arr.map(item => {
        let itemName = ''
        let additionalFields = {}

        if (key === 'bank_accounts_savings_securities_pension') {
          itemName = 'Bank Accounts, Savings, Securities, Pension'
          additionalFields = {
            category: item.category_bassp,
            institution: item.institution,
            description: item.description_bassp,
            account_number: item.account_number,
            property_status: item.property_status_bassp
          }
        } else if (key === 'lands') {
          itemName = 'Lands'
          additionalFields = {
            ownership: item.nature_and_type_of_ownership,
            address: item.address_of_property,
            property_status: item.property_status
          }
        } else if (key === 'money_owed_to_you') {
          itemName = 'Money Owed To You'
          additionalFields = {
            details: item.details_moty,
            property_status: item.property_status_moty
          }
        } else if (key === 'business_interest') {
          itemName = 'Business Interest'
          additionalFields = {
            firm_name: item.firm_name,
            interest: item.interest,
            property_status: item.property_status_bi
          }
        } else if (key === 'life_and_disability_insurance') {
          itemName = 'Life and Disability Insurance'
          additionalFields = {
            insurance_type: item.insurance_type,
            policy_no: item.policy_no,
            owner: item.owner,
            beneficiary: item.beneficiary,
            face_amount: item.face_amount,
            property_status: item.property_status_ladi
          }
        } else if (key === 'other_property') {
          itemName = 'Other Property'
          additionalFields = {
            category: item.category_op,
            details: item.details_op,
            property_status: item.property_status_op
          }
        } else if (key === 'general_household_items_and_vehicles') {
          itemName = item.item || ''
          additionalFields = {
            description: item.description_ghiav,
            isInPossession: item.isInPossession,
            property_status: item.property_status_ghiav
          }
        }

        return {
          item: itemName,
          id: item.id,
          ...additionalFields,
          market_value: item.market_value || {
            client: {
              id: '',
              asset_id: '',
              on_date_of_marriage: '',
              on_valuation_date: '',
              today: ''
            },
            opposing_party: {
              id: '',
              asset_id: '',
              on_date_of_marriage: '',
              on_valuation_date: '',
              today: ''
            }
          }
        }
      })

      acc.items = acc.items.concat(modifiedArray)
      return acc
    },
    { items: [], totals: { client: 0, opposing_party: 0 } }
  )
  

  // Calculate total market value for client and opposing party
  combinedAssets.totals.client = combinedAssets.items.reduce((total, item) => {
    return total + parseInt(item.market_value.client.today || 0)
  }, 0)
  combinedAssets.totals.opposing_party = combinedAssets.items.reduce(
    (total, item) => {
      return total + parseInt(item.market_value.opposing_party.today || 0)
    },
    0
  )

  // Filter items with "Lands", "Real Estate", and "Other Property" as the "item" value
  const filteredItems = combinedAssets.items.filter(item => {
    return item.item === "Lands" || item.item === "Real Estate" || item.item === "Other Property";
  });

  // Calculate totals for client and opposing party
  let totalClient = 0;
  let totalOpposingParty = 0;

  // Helper function to convert empty values to 0
  const convertToNumber = value => {
    return value.trim() === "" ? 0 : parseInt(value);
  };

  filteredItems.forEach(item => {
    totalClient += convertToNumber(item.market_value.client.today);
    totalOpposingParty += convertToNumber(item.market_value.opposing_party.today);
  });

  const propertiesAssets = {
    items: filteredItems,
    totals: {
      client: totalClient,
      opposing_party: totalOpposingParty
    }
  };


  // Calculate total value separately
  const totalValue = selectDebt?.body.reduce((acc, item) => acc + parseInt(item.today), 0);

  const debtsArray = {
    items: selectDebt?.body,
    totalValue: totalValue,
  };


  return {
    assetDetailsArray,
    assetsSum,
    combinedAssets,
    debtsArray,
    propertiesAssets
  }
}
