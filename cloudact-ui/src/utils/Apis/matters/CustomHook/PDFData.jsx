import { useEffect, useState } from 'react'
// import { BackgroundData, ChildrenData, CourtData, RelationshipData } from './DocumentViewDataUpdate'
import { calculateAge } from '../../../matterValidations/matterValidation'
import { CourtData } from './CourtData'
import { BackgroundData } from './BackgroundData'
import { RelationshipData } from './RelationshipData'
import { ChildrenData, TheChildren } from './ChildrenData'
import { EmploymentData } from './DocumentViewDataUpdate'
import { IncomeBenefits } from './IncomeBenefitsData'
import { AssetsData, AssetsDetails, AssetsInfo } from './AssetsData'
import { ExpenseData, ExpenseInfo, Expenses } from './ExpenseData'
import { DebtData } from './DebtData'
import { useDispatch, useSelector } from 'react-redux'
import { selectMatterData, selectMatterDataLoading } from '../getMatterData/getMatterDataSelectors'
import { getMatterData } from '../getMatterData/getMatterDataActions'
import { EmploymentStatus } from './EmploymentData'
import { selectSingleMatterData, selectSingleMatterLoading } from '../getSingleMatter/getSingleMattersSelectors'
import { getSingleMatter } from '../getSingleMatter/getSingleMattersActions'

export function Form8A(matterId) {
  const [loading, setLoading] = useState(true)
  const [pdfData, setPdfData] = useState()

  const { selectCourt, selectCourtLoading } = CourtData(matterId)

  const { selectBackground, selectBackgroundLoading } = BackgroundData(matterId)

  const { selectRelationship, selectRelationshipLoading } =
    RelationshipData(matterId)

  const { selectChildrenData, selectChildrenDataLoading } =
    ChildrenData(matterId)

  const backgroundData = {
    client: selectBackground?.body?.find(data => data.role === 'Client') || {},
    opposingParty:
      selectBackground?.body?.find(data => data.role === 'Opposing Party') || {}
  }

  const theChildrenData = () => {
    let childrenData = []

    if (selectChildrenData?.body?.length > 0) {
      childrenData = selectChildrenData.body.map(child => ({
        fullLegalName: child.childName,
        age: calculateAge(child.dateOfBirth),
        birthdate: child.dateOfBirth,
        muncipilityAndProvince: '', // Add the relevant data if available
        nowLivingWith: child.nowLivesWith
      }))
    } else {
      childrenData = [
        {
          fullLegalName: '',
          age: '',
          birthdate: '',
          muncipilityAndProvince: '', // Add the relevant data if available
          nowLivingWith: ''
        },
        {
          fullLegalName: '',
          age: '',
          birthdate: '',
          muncipilityAndProvince: '', // Add the relevant data if available
          nowLivingWith: ''
        },
        {
          fullLegalName: '',
          age: '',
          birthdate: '',
          muncipilityAndProvince: '', // Add the relevant data if available
          nowLivingWith: ''
        }
      ]
    }
    return childrenData
  }

  const documentData = {
    courtName: selectCourt?.body[0]?.court_name || '',
    courtFileNumber: selectCourt?.body[0]?.file_number || '',
    courtOfficeAddress: selectCourt?.body[0]?.address || '',
    applicationType: '',
    applicant: {
      fullLegalName: backgroundData.client.name || '',
      address: backgroundData.client.address || '',
      phoneAndFax: backgroundData.client.phone || '',
      email: backgroundData.client.email || ''
    },
    applicantsLawyer: {
      fullLegalName: backgroundData.client.lawyerName || '',
      address: backgroundData.client.lawyerAddress || '',
      phoneAndFax: backgroundData.client.lawyerPhone || '',
      email: backgroundData.client.lawyerEmail || ''
    },
    respondent: {
      fullLegalName: backgroundData.opposingParty.name || '',
      address: backgroundData.opposingParty.name || '',
      phoneAndFax: backgroundData.opposingParty.phone || '',
      email: backgroundData.opposingParty.email || '',
    },
    respondentsLawyer: {
      fullLegalName: backgroundData.opposingParty.lawyerName || '',
      address: backgroundData.opposingParty.lawyerAddress || '',
      phoneAndFax: backgroundData.opposingParty.lawyerPhone || '',
      email: backgroundData.opposingParty.lawyerEmail || ''
    },

    applicationClaim: '', // divorce-only, joint-divorce
    dateOfIssue: '',
    clerkOfTheCourt: '',

    // Family History
    familyHistory: {
      applicant: {
        age: calculateAge(backgroundData.client.dateOfBirth) || '',
        birthdate: backgroundData.client.dateOfBirth || '',
        muncipilityAndProvince: backgroundData.client.province || '',
        since: '',
        firstNameBeforeMarriage: '',
        lastNameBeforeMarriage: '',
        genderBeforeMarriage: '',
        isDivorcedBefore: false,
        divorcedBeforePlace: ''
      },
      respondent: {
        age: calculateAge(backgroundData.opposingParty.dateOfBirth) || '',
        birthdate: backgroundData.opposingParty.dateOfBirth || '',
        muncipilityAndProvince: backgroundData.opposingParty.province || '',
        since: '',
        firstNameBeforeMarriage: '',
        lastNameBeforeMarriage: '',
        genderBeforeMarriage: '',
        isDivorcedBefore: true,
        divorcedBeforePlace: ''
      },
      relationshipDates: {
        marriedOn: {
          checked: selectRelationship?.body[0]?.dateOfMarriage
            ? true
            : false || '',
          date: selectRelationship?.body[0]?.dateOfMarriage || ''
        },
        startedLivingTogetherOn: {
          checked: selectRelationship?.body[0]?.startedLivingTogether
            ? true
            : false || '',
          date: selectRelationship?.body[0]?.startedLivingTogether || ''
        },
        separatedOn: {
          checked: selectRelationship?.body[0]?.dateOfSeparation
            ? true
            : false || '',
          date: selectRelationship?.body[0]?.dateOfSeparation || ''
        },
        isNeverLivedTogether: {
          checked:
            selectRelationship?.body[0]?.neverLivedTogether === 'No'
              ? true
              : false || ''
        }
      },
      theChildren: theChildrenData(),
      prevCaseOrAgreements: {
        haveBeenInCourt: '',
        haveWrittenAgreement: '',
        writtenAgreement: '',
        haveNoticeOfCalculation: '',
        noticeOfCalculation: '',
        isAskingToMakeOrder: '',
        askingToMakeOrder: ''
      },
      claims: {
        divorceAct: {
          divorce: true,
          spousalSupport: false,
          supportForChildrenTableAmount: false,
          supportForChildrenOtherThanTableAmount: false,
          decisionMakingResponsibility: false,
          parentingTime: false
        },
        familyAct: {
          spousalSupport: false,
          supportForChildrenTableAmount: false,
          supportForChildrenOtherThanTableAmount: false,
          decisionMakingResponsibility: false,
          parentingTime: false,
          restraining: false,
          indexingSpousalSupport: false,
          declarationOfParentage: false,
          guardianship: false
        },
        property: {
          eqalizationOfNetFamilyProperties: false,
          exclusivePossessionOfMatrimonialHome: false,
          exclusivePossessionOfContentsOfMatrimonialHome: false,
          freezingAssets: false,
          saleOfFamilyProperty: false
        },
        other: {
          costs: false,
          annulment: false,
          prejudgement: false,
          other: false,
          otherSpecify: ''
        }
      },
      applicantsOnlyClaim: {
        divorce: false,
        costs: false,
        costsDescription: ''
      }
    },

    // Important Facts
    importantFacts: {
      separation: {
        checked: false,
        date: '',
        haveNotLivedTogether: false,
        haveLivedTogether: false,
        haveLivedTogetherDescription: ''
      },
      adultry: {
        checked: false,
        nameOfSpouse: '',
        details: ''
      },
      cruelty: {
        checked: false,
        nameOfSpouse: '',
        hasTreatedNameOfSpouse: '',
        details: ''
      },
      detailsOfOtherOrder: '',
      legalBasisFacts: ''
    },

    // Applicant's Certificate
    applicantsCertificate: {
      divorce: {
        details: '',
        date: '',
        signature: ''
      },
      jointDivorce: {
        sig1: {
          date: '',
          signature: ''
        },
        sig2: {
          date: '',
          signature: ''
        }
      }
    },

    // Lawyer's Certificate
    lawyersCertificate: {
      sig1: {
        name: backgroundData.client.lawyerName || '',
        date: '',
        signature: ''
      },
      sig2: {
        name: '',
        date: '',
        signature: ''
      }
    }
  }

  useEffect(() => {
    if (
      !selectBackgroundLoading &&
      !selectRelationshipLoading &&
      !selectChildrenDataLoading &&
      !selectCourtLoading
    ) {
      setLoading(false)
      setPdfData(documentData)
    }
    if (
      selectBackgroundLoading &&
      selectRelationshipLoading &&
      selectChildrenDataLoading &&
      selectCourtLoading
    ) {
      setLoading(true)
    }
  }, [
    selectBackgroundLoading,
    selectRelationshipLoading,
    selectChildrenDataLoading,
    selectCourtLoading
  ])

  return {
    pdfData,
    loading
  }
}

export function form13A(matterId) {
  const { selectCourt } = CourtData(matterId)
  const { selectBackground } = BackgroundData(matterId)

  const backgroundData = {
    client: selectBackground?.body?.find(data => data.role === 'Client') || {},
    opposingParty:
      selectBackground?.body?.find(data => data.role === 'Opposing Party') || {}
  }
  const pdfData = {
    courtName: selectCourt?.body[0]?.court_name || '',
    courtFileNumber: selectCourt?.body[0]?.file_number || '',
    courtOfficeAddress: selectCourt?.body[0]?.address || '',
    applicationType: '',
    applicant: {
      fullLegalName: backgroundData.client.name || '',
      address: backgroundData.client.address || '',
      phoneAndFax: backgroundData.client.phone || '',
      email: backgroundData.client.email || ''
    },
    applicantsLawyer: {
      fullLegalName: backgroundData.client.lawyerName || '',
      address: backgroundData.client.lawyerAddress || '',
      phoneAndFax: backgroundData.client.lawyerPhone || '',
      email: backgroundData.client.lawyerEmail || ''
    },
    respondent: {
      fullLegalName: backgroundData.opposingParty.name || '',
      address: backgroundData.opposingParty.name || '',
      phoneAndFax: backgroundData.opposingParty.phone || '',
      email: backgroundData.opposingParty.email || '',
    },
    respondentsLawyer: {
      fullLegalName: backgroundData.opposingParty.lawyerName || '',
      address: backgroundData.opposingParty.lawyerAddress || '',
      phoneAndFax: backgroundData.opposingParty.lawyerPhone || '',
      email: backgroundData.opposingParty.lawyerEmail || ''
    },

    filledBy: 'applicant',

    // part A
    sources: {
      taxReturns: {
        document1: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document2: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document3: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document4: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document5: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        }
      },
      assessment: {
        document1: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document2: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document3: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document4: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document5: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        }
      },
      employment: {
        document1: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document2: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document3: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document4: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document5: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        }
      },
      selfEmployment: {
        document1: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document2: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document3: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document4: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document5: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        }
      },
      partnership: {
        document1: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document2: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document3: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document4: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document5: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        }
      },
      corporation: {
        document1: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document2: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document3: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document4: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document5: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        }
      },
      trust: {
        document1: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document2: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document3: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document4: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document5: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        }
      },
      insurance: {
        document1: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document2: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document3: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document4: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document5: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        }
      },
      pensions: {
        document1: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document2: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document3: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document4: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document5: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        }
      },
      spousalSupport: {
        document1: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document2: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document3: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document4: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document5: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        }
      },
      rebates: {
        document1: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document2: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document3: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document4: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document5: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        }
      },
      investments: {
        document1: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document2: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document3: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document4: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document5: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        }
      },
      rental: {
        document1: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document2: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document3: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document4: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document5: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        }
      },
      other: {
        document1: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document2: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document3: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document4: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document5: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        }
      }
    },

    // part B
    specialExpenses: {
      document1: {
        number: '',
        description: '',
        date: '',
        dateProvided: ''
      },
      document2: {
        number: '',
        description: '',
        date: '',
        dateProvided: ''
      },
      document3: {
        number: '',
        description: '',
        date: '',
        dateProvided: ''
      },
      document4: {
        number: '',
        description: '',
        date: '',
        dateProvided: ''
      },
      document5: {
        number: '',
        description: '',
        date: '',
        dateProvided: ''
      }
    },

    // part C
    claim: {
      realEstate: {
        document1: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document2: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document3: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document4: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document5: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        }
      },
      savings: {
        document1: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document2: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document3: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document4: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document5: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        }
      },
      pensions: {
        document1: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document2: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document3: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document4: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document5: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        }
      },
      insurance: {
        document1: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document2: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document3: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document4: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document5: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        }
      },
      sole: {
        document1: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document2: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document3: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document4: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document5: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        }
      },
      partnership: {
        document1: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document2: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document3: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document4: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document5: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        }
      },
      corporation: {
        document1: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document2: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document3: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document4: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document5: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        }
      },
      trust: {
        document1: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document2: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document3: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document4: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document5: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        }
      },
      other: {
        document1: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document2: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document3: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document4: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document5: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        }
      },
      liabilities: {
        document1: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document2: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document3: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document4: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        },
        document5: {
          number: '',
          description: '',
          date: '',
          dateProvided: ''
        }
      }
    },
    assets: {
      document1: {
        number: '',
        description: '',
        date: '',
        dateProvided: ''
      },
      document2: {
        number: '',
        description: '',
        date: '',
        dateProvided: ''
      },
      document3: {
        number: '',
        description: '',
        date: '',
        dateProvided: ''
      },
      document4: {
        number: '',
        description: '',
        date: '',
        dateProvided: ''
      },
      document5: {
        number: '',
        description: '',
        date: '',
        dateProvided: ''
      }
    },
    liabilities: {
      document1: {
        number: '',
        description: '',
        date: '',
        dateProvided: ''
      },
      document2: {
        number: '',
        description: '',
        date: '',
        dateProvided: ''
      },
      document3: {
        number: '',
        description: '',
        date: '',
        dateProvided: ''
      },
      document4: {
        number: '',
        description: '',
        date: '',
        dateProvided: ''
      },
      document5: {
        number: '',
        description: '',
        date: '',
        dateProvided: ''
      }
    },
    excluded: {
      document1: {
        number: '',
        description: '',
        date: '',
        dateProvided: ''
      },
      document2: {
        number: '',
        description: '',
        date: '',
        dateProvided: ''
      },
      document3: {
        number: '',
        description: '',
        date: '',
        dateProvided: ''
      },
      document4: {
        number: '',
        description: '',
        date: '',
        dateProvided: ''
      },
      document5: {
        number: '',
        description: '',
        date: '',
        dateProvided: ''
      }
    },

    // Acknowledgement
    acknowledgement: {
      city: '',
      date: '',
      signature: ''
    }
  }

  return pdfData
}

export function Form131(matterId) {
  const [loading, setLoading] = useState(true)
  const [pdfData, setPdfData] = useState()

  const { selectCourt } = CourtData(matterId)
  const { selectBackground, selectBackgroundLoading } = BackgroundData(matterId)

  const { selectEmployment, selectEmploymentDataLoading } =
    EmploymentData(matterId)

  const { selectRelationship, selectRelationshipLoading } =
    RelationshipData(matterId)

  const { selectIncomeData, selectIncomeDataLoading } = IncomeBenefits(matterId)

  const { selectExpenseData, selectExpenseDataLoading } = ExpenseData(matterId)

  const { ExpenseDetailsClient } = Expenses(selectExpenseData)

  const { selectChildrenData, selectChildrenDataLoading } = ChildrenData(matterId)
  const children = selectChildrenData?.body
  const { selectAssetsData, selectAssetsDataLoading } = AssetsData(matterId)

  const { assetDetailsArray, assetsSum } = AssetsDetails(
    selectAssetsData,
    matterId
  )

  const backgroundData = {
    client: selectBackground?.body?.find(data => data.role === 'Client') || {},
    opposingParty:
      selectBackground?.body?.find(data => data.role === 'Opposing Party') || {}
  }

  // incomeBenefit
  const incomeBenefit = {
    client: {
      income:
        selectIncomeData?.body?.filter(
          data => data.role === 'Client' && data.incomeBenefit === 'income'
        ) || [],
      benefit:
        selectIncomeData?.body?.filter(
          data => data.role === 'Client' && data.incomeBenefit === 'benefit'
        ) || []
    },
    opposingParty: {
      income:
        selectIncomeData?.body?.filter(
          data =>
            data.role === 'opposingParty' && data.incomeBenefit === 'income'
        ) || [],
      benefit:
        selectIncomeData?.body?.filter(
          data =>
            data.role === 'opposingParty' && data.incomeBenefit === 'benefit'
        ) || []
    }
  }

  const clientIncome = incomeBenefit.client.income
  const opposingPartyIncome = incomeBenefit.opposingParty.income

  const totalClientIncome =
    clientIncome.reduce(
      (total, income) => total + parseFloat(income.monthlyAmount),
      0
    ) * 12

  const totalOpposingPartyIncome =
    opposingPartyIncome.reduce(
      (total, income) => total + parseFloat(income.monthlyAmount),
      0
    ) * 12

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
      employmentInsuranceBenefits:
        totals['Employment insurance benefits'] || '',
      workersCompensationBenefits:
        totals["Workers' compensation benefits"] || '',
      socialAssistanceIncome:
        totals['Social assistance income (including ODSP payments)'] || '',
      interestInvestmentIncome: totals['Interest and investment income'] || '',
      pensionIncome: totals['Pension income (including CPP and OAS)'] || '',
      spousalSupport:
        totals['Spousal support received from a former spouse/partner'] || '',
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

  const source = incomeSources()

  // incomeBenefit

  const filledBy = 'client'

  const documentData = {
    courtName: selectCourt?.body[0]?.court_name,
    courtFileNumber: selectCourt?.body[0]?.file_number,
    courtOfficeAddress: selectCourt?.body[0]?.address,
    applicationType: '',
    applicant: {
      fullLegalName: backgroundData.client.name || '',
      address: backgroundData.client.address || '',
      phoneAndFax: backgroundData.client.phone || '',
      email: backgroundData.client.email || ''
    },
    applicantsLawyer: {
      fullLegalName: backgroundData.client.lawyerName || '',
      address: backgroundData.client.lawyerAddress || '',
      phoneAndFax: backgroundData.client.lawyerPhone || '',
      email: backgroundData.client.lawyerEmail || ''
    },
    respondent: {
      fullLegalName: backgroundData.opposingParty.name || '',
      address: backgroundData.opposingParty.name || '',
      phoneAndFax: backgroundData.opposingParty.phone || '',
      email: backgroundData.opposingParty.email || '',
    },
    respondentsLawyer: {
      fullLegalName: backgroundData.opposingParty.lawyerName || '',
      address: backgroundData.opposingParty.lawyerAddress || '',
      phoneAndFax: backgroundData.opposingParty.lawyerPhone || '',
      email: backgroundData.opposingParty.lawyerEmail || ''
    },

    filledBy: filledBy,

    filler: {
      fullLegalName: backgroundData.client.name || '',
      province: backgroundData.client.province || ''
    },

    // Income
    income: {
      employmentStatus:
        filledBy === 'applicant'
          ? selectEmployment?.client?.employmentStatus || ''
          : selectEmployment?.opposingParty?.employmentStatus || '',
      employer: selectEmployment?.client?.employerName || '',
      business: selectEmployment?.client?.businessName || '',
      unemployedDate: selectEmployment?.client?.lastEmployed || '',

      attachments: {
        payChequeStub: false,
        socialAssistanceStub: false,
        pensionStub: false,
        workersCompensationStub: false,
        employmentInsuranceStub: false,
        statementOfIncome: false,
        other: false
      },

      lastYearGrossIncome: totalClientIncome,
      attachementsAcknowledgment: '',

      sources: {
        employmentIncome: source.employmentIncome || 0,
        commissionTipsBonuses: source.commissionTipsBonuses || 0,
        selfEmploymentIncome: source.selfEmploymentIncome || 0,
        employmentInsuranceBenefits: source.employmentInsuranceBenefits || 0,
        workersCompensationBenefits: source.workersCompensationBenefits || 0,
        socialAssistanceIncome: source.socialAssistanceIncome || 0,
        interestInvestmentIncome: source.interestInvestmentIncome || 0,
        pensionIncome: source.pensionIncome || 0,
        spousalSupport: source.spousalSupport || 0,
        childTaxBenefits: source.childTaxBenefits || 0,
        otherIncome: source.otherIncome || 0,
        totalMonthlyIncome: source.totalMonthlyIncome || 0,
        totalAnnualIncome: source.totalAnnualIncome || 0
      },

      otherBenefits: {
        b1: { item: '', details: '', yearlyMarketValues: '' },
        b2: { item: '', details: '', yearlyMarketValues: '' },
        b3: { item: '', details: '', yearlyMarketValues: '' },
        b4: { item: '', details: '', yearlyMarketValues: '' }
      }
    },

    // Expenses
    expenses: {
      automaticDeductions: {
        cppContributions: '',
        eiPremiums: '',
        incomeTaxes: '',
        employeePensionContributions: '',
        unionDues: '',
        subtotal: ''
      },
      housing: {
        rentOrMortgage: '',
        propertyTaxes: '',
        propertyInsurance: '',
        condominiumFees: '',
        repairsAndMaintenance: '',
        subtotal: ''
      },
      utilities: {
        water: '',
        heat: '',
        electricity: '',
        telephone: '',
        cellPhone: '',
        cable: '',
        internet: '',
        subtotal: ''
      },
      householdExpenses: {
        groceries: '',
        householdSupplies: '',
        mealsOutsideTheHome: '',
        petCare: '',
        laundryAndDryCleaning: '',
        subtotal: ''
      },
      childcare: {
        daycare: '',
        babysitting: '',
        subtotal: ''
      },

      transportation: {
        publicTransit: '',
        carPayments: '',
        gasAndOil: '',
        insurance: '',
        repairsAndMaintenance: '',
        parking: '',
        subtotal: ''
      },
      health: {
        insurance: '',
        dental: '',
        medicine: '',
        eyecare: '',
        subtotal: ''
      },
      personal: {
        clothing: '',
        haircare: '',
        alcohol: '',
        education: '',
        entertainment: '',
        gifts: '',
        subtotal: ''
      },
      other: {
        lifeInsurance: '',
        rrsp: '',
        vacations: '',
        school: '',
        clothingForChildren: '',
        childrenActivities: '',
        summerCamp: '',
        debtPayments: '',
        supportPaidForOtherChildren: '',
        other: '',
        subtotal: ''
      },
      totalMonthlyExpenses: '',
      totalYearlyExpenses: ''
    },

    // Other Income Earners
    otherIncomeEarners: {
      liveAlone: false,
      isLivingWith: false,
      livingWith: '',
      isAdults: false,
      adults: '',
      isChildren: children ? true : false,
      children: children?.length,
      partner: {
        isWorks: selectEmployment?.opposingParty?.employmentStatus || '',
        worksAt: selectEmployment?.opposingParty?.businessName || '',
        isEarns: totalOpposingPartyIncome ? 'yes' : 'no',
        earns: totalOpposingPartyIncome,
        earnsPer: 'year',
        contributions: '',
        contributionsPer: ''
      }
    },

    // Assets
    assets: {
      dateOfMarriage: selectRelationship?.body[0]?.dateOfMarriage,
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
      household: {
        furniture: {
          description: '',
          indication: '',
          onDateOfMarriage: '',
          onValuationDate: '',
          today: ''
        },
        vehicles: {
          description: '',
          indication: '',
          onDateOfMarriage: '',
          onValuationDate: '',
          today: ''
        },
        equipment: {
          description: '',
          indication: '',
          onDateOfMarriage: '',
          onValuationDate: '',
          today: ''
        },
        other: {
          description: '',
          indication: '',
          onDateOfMarriage: '',
          onValuationDate: '',
          today: ''
        },
        total1: '',
        total2: ''
      },
      bank: {
        category: '',
        description: '',
        accountNumber: '',
        onDateOfMarriage: '',
        onValuationDate: '',
        today: '',
        total1: '',
        total2: ''
      },
      life: {
        company: '',
        owner: '',
        beneficiary: '',
        faceAmount: '',
        onDateOfMarriage: '',
        onValuationDate: '',
        today: '',
        total1: '',
        total2: ''
      },
      interests: {
        company: '',
        interest: '',
        onDateOfMarriage: '',
        onValuationDate: '',
        today: '',
        total1: '',
        total2: ''
      },
      moneyOwed: {
        details: '',
        onDateOfMarriage: '',
        onValuationDate: '',
        today: '',
        total1: '',
        total2: ''
      },
      otherProperty: {
        category: '',
        details: '',
        onDateOfMarriage: '',
        onValuationDate: '',
        today: '',
        total1: '',
        total2: '',
        totalOwned: ''
      },
      debts: {
        category: '',
        details: '',
        onDateOfMarriage: '',
        onValuationDate: '',
        today: '',
        total1: '',
        total2: ''
      },
      property: {
        land: {
          assets: assetsSum.client.landSum || 0,
          liabilities: ''
        },
        household: {
          assets: assetsSum.client.householdSum || 0,
          liabilities: ''
        },
        bank: {
          assets: assetsSum.client.bankSum || 0,
          liabilities: ''
        },
        life: {
          assets: assetsSum.client.lifeSum || 0,
          liabilities: ''
        },
        interests: {
          assets: assetsSum.client.interests || 0,
          liabilities: ''
        },
        moneyOwed: {
          assets: assetsSum.client.moneyOwedSum || 0,
          liabilities: ''
        },
        otherProperty: {
          assets: assetsSum.client.otherPropertySum || 0,
          liabilities: ''
        },
        debts: {
          assets: '',
          liabilities: ''
        },
        total1: '',
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
        value: '',
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

    // Debts
    // debts: [],

    // Declaration
    declaration: {
      muncipility: '',
      state: '',
      date: '',
      signature: '',
      sigName: ''
    },

    // Schedule A
    scheduleA: {
      incomeSources: {
        partnership: '',
        rental: '',
        dividends: '',
        capital: '',
        retirement: '',
        annuity: '',
        other: ''
      },
      totalIncome: ''
    },

    // Schedule B
    scheduleB: {
      expenses: {
        child1: {
          name: '',
          expenses: '',
          amount: '',
          tax: ''
        },
        child2: {
          name: '',
          expenses: '',
          amount: '',
          tax: ''
        },
        child3: {
          name: '',
          expenses: '',
          amount: '',
          tax: ''
        },
        child4: {
          name: '',
          expenses: '',
          amount: '',
          tax: ''
        },
        child5: {
          name: '',
          expenses: '',
          amount: '',
          tax: ''
        },
        child6: {
          name: '',
          expenses: '',
          amount: '',
          tax: ''
        },
        child7: {
          name: '',
          expenses: '',
          amount: '',
          tax: ''
        },
        child8: {
          name: '',
          expenses: '',
          amount: '',
          tax: ''
        },
        child9: {
          name: '',
          expenses: '',
          amount: '',
          tax: ''
        },
        child10: {
          name: '',
          expenses: '',
          amount: '',
          tax: ''
        },
        totalYearlyAmount: '',
        totalMonthlyAmount: ''
      },
      amIEarn: false,
      iEarn: ''
    }
  }

  // Set the expenses data in pdfData
  documentData.expenses = ExpenseDetailsClient.expenses

  documentData.assets = assetDetailsArray?.assets

  documentData.debts = assetDetailsArray?.debts

  useEffect(() => {
    if (
      !selectBackgroundLoading &&
      !selectEmploymentDataLoading &&
      !selectIncomeDataLoading &&
      !selectExpenseDataLoading &&
      !selectAssetsDataLoading &&
      !selectRelationshipLoading &&
      !selectChildrenDataLoading
    ) {
      setLoading(false)
      setPdfData(documentData)
    }
    if (
      selectBackgroundLoading &&
      selectEmploymentDataLoading &&
      selectIncomeDataLoading &&
      selectExpenseDataLoading &&
      selectAssetsDataLoading &&
      !selectRelationshipLoading &&
      !selectChildrenDataLoading
    ) {
      setLoading(true)
    }
  }, [
    selectBackgroundLoading,
    selectEmploymentDataLoading,
    selectIncomeDataLoading,
    selectExpenseDataLoading,
    selectAssetsDataLoading,
    selectRelationshipLoading,
    selectChildrenDataLoading,
    loading
  ])

  return {
    pdfData,
    loading
  }
}

export function Form13(matterId) {
  const [loading, setLoading] = useState(true)
  const [pdfData, setPdfData] = useState(null)

  const { selectCourt, selectCourtLoading } = CourtData(matterId)
  const { selectDebt, selectDebtLoading } = DebtData(matterId)
  const { selectBackground, selectBackgroundLoading } = BackgroundData(matterId)
  const { selectEmployment, selectEmploymentDataLoading } = EmploymentData(matterId)
  const { selectIncomeData, selectIncomeDataLoading } = IncomeBenefits(matterId)
  const { selectExpenseData, selectExpenseDataLoading } = ExpenseData(matterId)
  const {
    ExpenseDetailsClient,
    clientSpecialExpenses
  } = Expenses(selectExpenseData)
  const { selectAssetsData, selectAssetsDataLoading } = AssetsData(matterId)
  const { assetDetailsArray } = AssetsDetails(
    selectAssetsData,
    matterId
  )

  const backgroundData = {
    client: selectBackground?.body?.find(data => data.role === 'Client') || {},
    opposingParty:
      selectBackground?.body?.find(data => data.role === 'Opposing Party') || {}
  }

  // incomeBenefit
  const incomeBenefit = {
    client: {
      income:
        selectIncomeData?.body?.filter(
          data => data.role === 'Client' && data.incomeBenefit === 'income'
        ) || [],
      benefit:
        selectIncomeData?.body?.filter(
          data => data.role === 'Client' && data.incomeBenefit === 'benefit'
        ) || []
    },
    opposingParty: {
      income:
        selectIncomeData?.body?.filter(
          data =>
            data.role === 'opposingParty' && data.incomeBenefit === 'income'
        ) || [],
      benefit:
        selectIncomeData?.body?.filter(
          data =>
            data.role === 'opposingParty' && data.incomeBenefit === 'benefit'
        ) || []
    }
  }

  const clientIncome = incomeBenefit.client.income
  // const opposingPartyIncome = incomeBenefit.opposingParty.income

  const totalClientIncome =
    clientIncome.reduce(
      (total, income) => total + parseFloat(income.monthlyAmount),
      0
    ) * 12

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

  const source = incomeSources()
  // incomeBenefit

  const filledBy = 'applicant'

  const documentData = {
    courtName: selectCourt?.body[0]?.court_name,
    courtFileNumber: selectCourt?.body[0]?.file_number,
    courtOfficeAddress: selectCourt?.body[0]?.address,
    applicationType: '',
    applicant: {
      fullLegalName: backgroundData.client.name || '',
      address: backgroundData.client.address || '',
      phoneAndFax: backgroundData.client.phone || '',
      email: backgroundData.client.email || ''
    },
    applicantsLawyer: {
      fullLegalName: backgroundData.client.lawyerName || '',
      address: backgroundData.client.lawyerAddress || '',
      phoneAndFax: backgroundData.client.lawyerPhone || '',
      email: backgroundData.client.lawyerEmail || ''
    },
    respondent: {
      fullLegalName: backgroundData.opposingParty.name || '',
      address: backgroundData.opposingParty.address || '',
      phoneAndFax: backgroundData.opposingParty.phone || '',
      email: backgroundData.opposingParty.email || '',
    },
    respondentsLawyer: {
      fullLegalName: backgroundData.opposingParty.lawyerName || '',
      address: backgroundData.opposingParty.lawyerAddress || '',
      phoneAndFax: backgroundData.opposingParty.lawyerPhone || '',
      email: backgroundData.opposingParty.lawyerEmail || ''
    },

    filledBy: filledBy,

    filler: {
      fullLegalName: backgroundData.client.name || '',
      province: backgroundData.client.province || ''
    },

    // Income
    income: {
      employmentStatus:
        filledBy === 'applicant'
          ? selectEmployment?.client?.employmentStatus || ''
          : selectEmployment?.opposingParty?.employmentStatus || '',
      employer: selectEmployment?.client?.employerName || '',
      business: selectEmployment?.client?.businessName || '',
      unemployedDate: selectEmployment?.client?.lastEmployed || '',

      attachments: {
        payChequeStub: false,
        socialAssistanceStub: false,
        pensionStub: false,
        workersCompensationStub: false,
        employmentInsuranceStub: false,
        statementOfIncome: false,
        other: false
      },

      lastYearGrossIncome: totalClientIncome,
      attachementsAcknowledgment: '',

      sources: {
        employmentIncome: source.employmentIncome || 0,
        commissionTipsBonuses: source.commissionTipsBonuses || 0,
        selfEmploymentIncome: source.selfEmploymentIncome || 0,
        employmentInsuranceBenefits: source.employmentInsuranceBenefits || 0,
        workersCompensationBenefits: source.workersCompensationBenefits || 0,
        socialAssistanceIncome: source.socialAssistanceIncome || 0,
        interestInvestmentIncome: source.interestInvestmentIncome || 0,
        pensionIncome: source.pensionIncome || 0,
        spousalSupport: source.spousalSupport || 0,
        childTaxBenefits: source.childTaxBenefits || 0,
        otherIncome: source.otherIncome || 0,
        totalMonthlyIncome: source.totalMonthlyIncome || 0,
        totalAnnualIncome: source.totalAnnualIncome || 0
      },

      otherBenefits: {
        b1: { item: '', details: '', yearlyMarketValues: '' },
        b2: { item: '', details: '', yearlyMarketValues: '' },
        b3: { item: '', details: '', yearlyMarketValues: '' },
        b4: { item: '', details: '', yearlyMarketValues: '' }
      }
    },

    // Expenses
    expenses: {
      automaticDeductions: {
        cppContributions: '',
        eiPremiums: '',
        incomeTaxes: '',
        employeePensionContributions: '',
        unionDues: '',
        subtotal: ''
      },
      housing: {
        rentOrMortgage: '',
        propertyTaxes: '',
        propertyInsurance: '',
        condominiumFees: '',
        repairsAndMaintenance: '',
        subtotal: ''
      },
      utilities: {
        water: '',
        heat: '',
        electricity: '',
        telephone: '',
        cellPhone: '',
        cable: '',
        internet: '',
        subtotal: ''
      },
      householdExpenses: {
        groceries: '',
        householdSupplies: '',
        mealsOutsideTheHome: '',
        petCare: '',
        laundryAndDryCleaning: '',
        subtotal: ''
      },
      childcare: {
        daycare: '',
        babysitting: '',
        subtotal: ''
      },

      transportation: {
        publicTransit: '',
        carPayments: '',
        gasAndOil: '',
        insurance: '',
        repairsAndMaintenance: '',
        parking: '',
        subtotal: ''
      },
      health: {
        insurance: '',
        dental: '',
        medicine: '',
        eyecare: '',
        subtotal: ''
      },
      personal: {
        clothing: '',
        haircare: '',
        alcohol: '',
        education: '',
        entertainment: '',
        gifts: '',
        subtotal: ''
      },
      other: {
        lifeInsurance: '',
        rrsp: '',
        vacations: '',
        school: '',
        clothingForChildren: '',
        childrenActivities: '',
        summerCamp: '',
        debtPayments: '',
        supportPaidForOtherChildren: '',
        other: '',
        subtotal: ''
      },
      totalMonthlyExpenses: '',
      totalYearlyExpenses: ''
    },

    // Assets
    assets: {
      realEstate: {
        property1: { details: '', value: '' },
        property2: { details: '', value: '' },
        property3: { details: '', value: '' }
      },
      vehicles: {
        vehicle1: { details: '', value: '' },
        vehicle2: { details: '', value: '' },
        vehicle3: { details: '', value: '' }
      },
      possessions: {
        possession1: { details: '', value: '' },
        possession2: { details: '', value: '' },
        possession3: { details: '', value: '' }
      },
      investments: {
        investment1: { details: '', value: '' },
        investment2: { details: '', value: '' },
        investment3: { details: '', value: '' }
      },
      bankAccounts: {
        bank1: { details: '', value: '' },
        bank2: { details: '', value: '' },
        bank3: { details: '', value: '' }
      },
      savings: {
        saving1: { details: '', value: '' },
        saving2: { details: '', value: '' },
        saving3: { details: '', value: '' }
      },
      lifeInsurence: {
        policy1: { details: '', value: '' },
        policy2: { details: '', value: '' },
        policy3: { details: '', value: '' }
      },
      interestsInBusiness: {
        business1: { details: '', value: '' },
        business2: { details: '', value: '' },
        business3: { details: '', value: '' }
      },
      moneyOwed: {
        owed1: { details: '', value: '' },
        owed2: { details: '', value: '' },
        owed3: { details: '', value: '' }
      },
      otherAssets: {
        other1: { details: '', value: '' },
        other2: { details: '', value: '' },
        other3: { details: '', value: '' }
      },
      totalAssets: ''
    },

    // Debts
    debts: {
      mortgage: {
        m1: {
          creditor: '',
          fullAmount: '',
          monthlyPayments: '',
          arePayementsMade: ''
        },
        m2: {
          creditor: '',
          fullAmount: '',
          monthlyPayments: '',
          arePayementsMade: ''
        },
        m3: {
          creditor: '',
          fullAmount: '',
          monthlyPayments: '',
          arePayementsMade: ''
        }
      },
      creditCard: {
        c1: {
          creditor: '',
          fullAmount: '',
          monthlyPayments: '',
          arePayementsMade: ''
        },
        c2: {
          creditor: '',
          fullAmount: '',
          monthlyPayments: '',
          arePayementsMade: ''
        },
        c3: {
          creditor: '',
          fullAmount: '',
          monthlyPayments: '',
          arePayementsMade: ''
        }
      },
      unpaidSupport: {
        u1: {
          creditor: '',
          fullAmount: '',
          monthlyPayments: '',
          arePayementsMade: ''
        },
        u2: {
          creditor: '',
          fullAmount: '',
          monthlyPayments: '',
          arePayementsMade: ''
        },
        u3: {
          creditor: '',
          fullAmount: '',
          monthlyPayments: '',
          arePayementsMade: ''
        }
      },
      other: {
        o1: {
          creditor: '',
          fullAmount: '',
          monthlyPayments: '',
          arePayementsMade: ''
        },
        o2: {
          creditor: '',
          fullAmount: '',
          monthlyPayments: '',
          arePayementsMade: ''
        },
        o3: {
          creditor: '',
          fullAmount: '',
          monthlyPayments: '',
          arePayementsMade: ''
        }
      },
      totalDebts: ''
    },

    // Summary
    summary: {
      totalAssets: '',
      subtractTotalDebts: '',
      netWorth: ''
    },

    // Declaration
    declaration: {
      muncipility: '',
      state: '',
      date: '',
      signature: '',
      sigName: ''
    },

    // Schedule A
    scheduleA: {
      incomeSources: {
        partnership: '',
        rental: '',
        dividends: '',
        capital: '',
        retirement: '',
        annuity: '',
        other: ''
      },
      totalIncome: ''
    },

    // Schedule B
    scheduleB: {
      liveAlone: false,
      isLivingWith: false,
      livingWith: '',
      isAdults: false,
      adults: '',
      isChildren: false,
      children: '',
      partner: {
        isWorks: '',
        worksAt: '',
        isEarns: '',
        earns: '',
        earnsPer: '',
        contributions: '',
        contributionsPer: ''
      }
    },

    // Schedule C
    scheduleC: {
      expenses: {
        child1: {
          name: '',
          expenses: '',
          amount: '',
          tax: ''
        },
        child2: {
          name: '',
          expenses: '',
          amount: '',
          tax: ''
        },
        child3: {
          name: '',
          expenses: '',
          amount: '',
          tax: ''
        },
        child4: {
          name: '',
          expenses: '',
          amount: '',
          tax: ''
        },
        child5: {
          name: '',
          expenses: '',
          amount: '',
          tax: ''
        },
        child6: {
          name: '',
          expenses: '',
          amount: '',
          tax: ''
        },
        child7: {
          name: '',
          expenses: '',
          amount: '',
          tax: ''
        },
        child8: {
          name: '',
          expenses: '',
          amount: '',
          tax: ''
        },
        child9: {
          name: '',
          expenses: '',
          amount: '',
          tax: ''
        },
        child10: {
          name: '',
          expenses: '',
          amount: '',
          tax: ''
        },
        totalYearlyAmount: '',
        totalMonthlyAmount: ''
      },
      amIEarn: false,
      iEarn: ''
    }
  }

  let groupedData = {}
  let totalValue = 0

  if (selectDebt?.body) {
    groupedData = selectDebt.body.reduce((acc, obj) => {
      const category = obj.category.toLowerCase().replace(/\s+/g, '')
      if (!acc[category]) {
        acc[category] = []
      }

      acc[category].push(obj)

      return acc
    }, {})

    totalValue = Object.values(groupedData).reduce((total, items) => {
      return (
        total +
        items.reduce((sum, item) => {
          return (
            sum +
            parseInt(item.on_date_of_marriage) +
            parseInt(item.on_valuation_date) +
            parseInt(item.today)
          )
        }, 0)
      )
    }, 0)
  }

  // Now you can set totalValue on groupedData
  groupedData.totalValue = totalValue

  // Set the expenses data in pdfData
  documentData.expenses = ExpenseDetailsClient.expenses

  documentData.assets = assetDetailsArray?.assets

  // documentData.debts = assetDetailsArray?.debts;
  documentData.debts = groupedData

  documentData.scheduleC.expenses = Array.isArray(clientSpecialExpenses)
    ? clientSpecialExpenses?.map(item => ({
      name: item.childName,
      expenses: item.type,
      amount: item.amount,
      tax: item.taxCredits
    }))
    : []

  const totalDebts = Array.isArray(assetDetailsArray)
    ? assetDetailsArray?.debts?.reduce(
      (acc, item) => {
        acc.on_date_of_marriage += parseFloat(
          item.on_date_of_marriage.replace(/\$/, '').replace(/,/g, '')
        )
        acc.on_valuation_date += parseFloat(
          item.on_valuation_date.replace(/\$/, '').replace(/,/g, '')
        )
        acc.today += parseFloat(
          item.today.replace(/\$/, '').replace(/,/g, '')
        )
        return acc
      },
      { on_date_of_marriage: 0, on_valuation_date: 0, today: 0 }
    )
    : []

  documentData.summary = {
    totalAssets: assetDetailsArray?.assets.totalValue,
    subtractTotalDebts: totalDebts?.today,
    netWorth: assetDetailsArray?.assets.totalValue - totalDebts?.today
  }

  useEffect(() => {
    if (
      !selectBackgroundLoading &&
      !selectEmploymentDataLoading &&
      !selectIncomeDataLoading &&
      !selectCourtLoading &&
      !selectExpenseDataLoading &&
      !selectDebtLoading &&
      !selectAssetsDataLoading &&
      selectBackground &&
      selectEmployment &&
      selectIncomeData &&
      selectCourt &&
      selectExpenseData &&
      selectDebt &&
      selectAssetsData
    ) {
      setLoading(false)
      setPdfData(documentData)
    }
    if (
      selectBackgroundLoading &&
      selectEmploymentDataLoading &&
      selectIncomeDataLoading &&
      selectCourtLoading &&
      selectExpenseDataLoading &&
      selectDebtLoading &&
      selectAssetsDataLoading
    ) {
      setLoading(true)
    }
  }, [
    selectBackgroundLoading,
    selectEmploymentDataLoading,
    selectIncomeDataLoading,
    selectCourtLoading,
    selectExpenseDataLoading,
    selectDebtLoading,
    selectAssetsDataLoading
  ])

  return {
    pdfData,
    loading
  }
}

export function Form13b(matterId) {
  const [loading, setLoading] = useState(true)
  const [pdfData, setPdfData] = useState()

  const { selectCourt, selectCourtLoading } = CourtData(matterId)
  const { selectBackground, backgroundData, selectBackgroundLoading } =
    BackgroundData(matterId)

  const { selectAssetsData, selectAssetsDataLoading } = AssetsData(matterId)
  const { debtsArray, combinedAssets, propertiesAssets } =
    AssetsDetails(selectAssetsData, matterId)

  const documentData = {
    courtName: selectCourt?.body[0]?.court_name,
    courtFileNumber: selectCourt?.body[0]?.file_number,
    courtOfficeAddress: selectCourt?.body[0]?.address,

    applicants: {
      applicant1:
        backgroundData.client.name +
        ' , ' +
        backgroundData.client.phone +
        ' , ' +
        backgroundData.client.email,
      applicant2: backgroundData.client.address
    },
    applicantsLawyer: {
      lawyer1:
        backgroundData.client.lawyerName +
        ' , ' +
        backgroundData.client.lawyerPhone +
        ' , ' +
        backgroundData.client.lawyerEmail,
      lawyer2: backgroundData.client.lawyerAddress
    },
    respondents: {
      respondent1:
        backgroundData.opposingParty.name +
        ' , ' +
        backgroundData.opposingParty.phone +
        ' , ' +
        backgroundData.opposingParty.email,
      respondent2: backgroundData.opposingParty.address
    },
    respondentsLawyer: {
      lawyer1:
        backgroundData.opposingParty.lawyerName +
        ' , ' +
        backgroundData.opposingParty.lawyerPhone +
        ' , ' +
        backgroundData.opposingParty.lawyerEmail,
      lawyer2: backgroundData.opposingParty.lawyerAddress
    },

    myName: backgroundData.client.name,
    valuationDate: '',

    table1: {
      item1: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item2: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item3: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item4: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item5: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item6: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item7: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item8: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item9: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item10: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item11: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item12: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item13: {
        name: '',
        applicant: '',
        respondent: ''
      },
      total1: '',
      total2: ''
    },
    table2: {
      item1: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item2: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item3: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item4: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item5: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item6: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item7: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item8: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item9: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item10: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item11: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item12: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item13: {
        name: '',
        applicant: '',
        respondent: ''
      },
      total1: '',
      total2: ''
    },
    table3a: {
      item1: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item2: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item3: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item4: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item5: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item6: {
        name: '',
        applicant: '',
        respondent: ''
      },
      client: '',
      opposing_party: ''
    },
    table3b: {
      item1: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item2: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item3: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item4: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item5: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item6: {
        name: '',
        applicant: '',
        respondent: ''
      },
      client: '',
      opposing_party: ''
    },
    table4: {
      item1: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item2: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item3: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item4: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item5: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item6: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item7: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item8: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item9: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item10: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item11: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item12: {
        name: '',
        applicant: '',
        respondent: ''
      },
      item13: {
        name: '',
        applicant: '',
        respondent: ''
      },
      client: '',
      opposing_party: ''
    },
    totals: {
      total2: {
        total1: '',
        total2: ''
      },
      total3: {
        total1: '',
        total2: ''
      },
      total4: {
        total1: '',
        total2: ''
      },
      total5: {
        total1: '',
        total2: ''
      }
    },
    netTotals: {
      total1: {
        total1: '',
        total2: ''
      },
      total5: {
        total1: '',
        total2: ''
      },
      total6: {
        total1: '',
        total2: ''
      }
    },

    dateOfSignature: '',
    signature: ''
  }

  // const pdfData = {}

  documentData.table2 = debtsArray
  documentData.table1 = combinedAssets
  documentData.table3a = propertiesAssets

  const totals = {
    total2: { client: documentData.table2.totalValue, opposing_party: 0 },
    total3a: {
      client: documentData.table3a.totals.client,
      opposing_party: documentData.table3a.totals.opposing_party
    },
    total3b: {
      client: documentData.table3b.client,
      opposing_party: documentData.table3b.opposing_party
    },
    total3: {
      client: documentData.table3a.totals.client + documentData.table3b.client,
      opposing_party:
        documentData.table3a.totals.opposing_party +
        documentData.table3b.opposing_party
    },
    total4: {
      client: documentData.table4.client,
      opposing_party: documentData.table4.opposing_party
    }
  }

  documentData.totals = totals

  // pdfData.totals = totals;

  const netTotals = {
    total1: {
      client: documentData.table1.totals.client,
      opposing_party: documentData.table1.totals.opposing_party
    },
    total5: {
      client:
        documentData.table2.totalValue +
        documentData.table3a.totals.client +
        documentData.table4.client,
      opposing_party:
        documentData.table3a.totals.opposing_party +
        documentData.table4.opposing_party
    },
    total6: {
      client:
        documentData.table1.totals.client -
        documentData.table2.totalValue +
        documentData.table3a.totals.client +
        documentData.table4.client,
      opposing_party:
        documentData.table1.totals.opposing_party -
        0 +
        documentData.table3a.totals.opposing_party +
        documentData.table4.opposing_party
    }
  }

  documentData.netTotals = netTotals

  useEffect(() => {
    if (
      !selectBackgroundLoading &&
      !selectCourtLoading &&
      !selectAssetsDataLoading &&
      selectBackground &&
      selectCourt &&
      selectAssetsData
    ) {
      setLoading(false)
      setPdfData(documentData)
    }
    if (
      selectBackgroundLoading &&
      selectCourtLoading &&
      selectAssetsDataLoading
    ) {
      setLoading(true)
    }
  }, [selectBackgroundLoading, selectCourtLoading, selectAssetsDataLoading])

  return {
    pdfData,
    loading
  }
}

export function Form6B(matterId) {
  const [loading, setLoading] = useState(true)
  const [pdfData, setPdfData] = useState()

  const { selectCourt, selectCourtLoading } = CourtData(matterId)

  const { selectBackground, selectBackgroundLoading } = BackgroundData(matterId)
  // const { selectChildrenData } = ChildrenData(matterId)
  // const children = selectChildrenData?.body

  const backgroundData = {
    client: selectBackground?.body?.find(data => data.role === 'Client') || {},
    opposingParty:
      selectBackground?.body?.find(data => data.role === 'Opposing Party') || {}
  }

  // const theChildrenData = () => {
  //   let childrenData = []

  //   if (selectChildrenData?.body?.length > 0) {
  //     childrenData = selectChildrenData.body.map(child => ({
  //       fullLegalName: child.childName,
  //       age: calculateAge(child.dateOfBirth),
  //       birthdate: child.dateOfBirth,
  //       muncipilityAndProvince: '', // Add the relevant data if available
  //       nowLivingWith: child.nowLivesWith
  //     }))
  //   } else {
  //     childrenData = [
  //       {
  //         fullLegalName: '',
  //         age: '',
  //         birthdate: '',
  //         muncipilityAndProvince: '', // Add the relevant data if available
  //         nowLivingWith: ''
  //       },
  //       {
  //         fullLegalName: '',
  //         age: '',
  //         birthdate: '',
  //         muncipilityAndProvince: '', // Add the relevant data if available
  //         nowLivingWith: ''
  //       },
  //       {
  //         fullLegalName: '',
  //         age: '',
  //         birthdate: '',
  //         muncipilityAndProvince: '', // Add the relevant data if available
  //         nowLivingWith: ''
  //       }
  //     ]
  //   }
  //   return childrenData
  // }

  const documentData = {
    courtName: selectCourt?.body[0]?.court_name,
    courtFileNumber: selectCourt?.body[0]?.file_number,
    courtOfficeAddress: selectCourt?.body[0]?.address,

    applicants: {
      applicant1:
        backgroundData.client.name +
        ' , ' +
        backgroundData.client.phone +
        ' , ' +
        backgroundData.client.email,
      applicant2: backgroundData.client.address
    },
    applicantsLawyer: {
      lawyer1:
        backgroundData.client.lawyerName +
        ' , ' +
        backgroundData.client.lawyerPhone +
        ' , ' +
        backgroundData.client.lawyerEmail,
      lawyer2: backgroundData.client.lawyerAddress
    },
    respondents: {
      respondent1:
        backgroundData.opposingParty.name +
        ' , ' +
        backgroundData.opposingParty.phone +
        ' , ' +
        backgroundData.opposingParty.email,
      respondent2: backgroundData.opposingParty.address
    },
    respondentsLawyer: {
      lawyer1:
        backgroundData.opposingParty.lawyerName +
        ' , ' +
        backgroundData.opposingParty.lawyerPhone +
        ' , ' +
        backgroundData.opposingParty.lawyerEmail,
      lawyer2: backgroundData.opposingParty.lawyerAddress
    },
    childrensLawyer: {
      lawyer1: '',
      lawyer2: ''
    },

    myName: backgroundData.client.name,
    valuationDate: '',

    dateOfSignature: '',
    signature: ''
  }

  const ApplicantData = [
    { label: 'Full legal name & address for service — street & number, municipality,postal code, telephone & fax numbers and e-mail address (if any).', value: documentData?.applicants.applicant1, type: 'textarea', update: 'applicants.applicant1' },
    { label: '', value: documentData?.applicants.applicant2, type: 'textarea', update: 'applicants.applicant2' },
  ];
  const ApplicantLawyerData = [
    { label: 'Lawyer’s name & address — street & number, municipality, postal code, telephone & fax numbers and e-mail address (if any).', value: documentData?.applicantsLawyer.lawyer1, type: 'textarea', update: 'applicantsLawyer.lawyer1' },
    { label: 'Applicant Lawyer 2:', value: documentData?.applicantsLawyer.lawyer2, type: 'textarea', update: 'applicantsLawyer.lawyer2' },
  ];

  const RespondentData = [
    { label: 'Full legal name & address for service — street & number, municipality,postal code, telephone & fax numbers and e-mail address (if any).', value: documentData?.respondents.respondent1, type: 'textarea', update: 'respondents.respondent1' },
    { label: '', value: documentData?.respondents.respondent2, type: 'textarea', update: 'respondents.respondent2' },
  ];

  const RespondentLawyerData = [
    { label: 'Lawyer’s name & address — street & number, municipality, postal code, telephone & fax numbers and e-mail address (if any).', value: documentData?.respondentsLawyer.lawyer1, type: 'textarea', update: 'respondentsLawyer.lawyer1' },
    { label: 'Address:', value: documentData?.respondentsLawyer.lawyer2, type: 'textarea', update: 'respondentsLawyer.lawyer2' },
  ];

  const ChildrensLawyer = [
    { label: 'Lawyer’s name & address — street & number, municipality, postal code, telephone & fax numbers and e-mail address (if any).', value: documentData?.childrensLawyer.lawyer1, type: 'textarea', update: 'childrensLawyer.lawyer1' },
    { label: 'Address:', value: documentData?.childrensLawyer.lawyer2, type: 'textarea', update: 'childrensLawyer.lawyer2' },
  ];

  useEffect(() => {
    if (!selectBackgroundLoading && !selectCourtLoading) {
      setLoading(false)
      setPdfData(documentData)
    }
    if (selectBackgroundLoading && selectCourtLoading) {
      setLoading(true)
    }
  }, [selectBackgroundLoading, selectCourtLoading])

  return {
    ApplicantData,
    ApplicantLawyerData,
    RespondentData,
    RespondentLawyerData,
    pdfData,
    ChildrensLawyer,
    loading
  }
}

export function Form10(matterId) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true)
  const [pdfData, setPdfData] = useState()
  const [matterInfo, setMatterInfo] = useState()

  const { selectCourt, selectCourtLoading } = CourtData(matterId)

  const { selectBackground, selectBackgroundLoading } = BackgroundData(matterId)

  const backgroundData = {
    client: selectBackground?.body?.find(data => data.role === 'Client') || {},
    opposingParty:
      selectBackground?.body?.find(data => data.role === 'Opposing Party') || {}
  }

  useEffect(() => {
    dispatch(getMatterData(matterId))
  }, [matterInfo])

  const selectAllData = useSelector(selectMatterData);
  // const selectAllDataLoading = useSelector(selectMatterDataLoading);

  // 

  const documentData = {
    courtName: selectCourt?.body[0]?.court_name || '',
    courtFileNumber: selectCourt?.body[0]?.file_number || '',
    courtOfficeAddress: selectCourt?.body[0]?.address || '',
    applicationType: '',
    applicant: {
      fullLegalName: backgroundData.client.name || '',
      address: backgroundData.client.address || '',
      phoneAndFax: backgroundData.client.phone || '',
      email: backgroundData.client.email || ''
    },
    applicantsLawyer: {
      fullLegalName: backgroundData.client.lawyerName || '',
      address: backgroundData.client.lawyerAddress || '',
      phoneAndFax: backgroundData.client.lawyerPhone || '',
      email: backgroundData.client.lawyerEmail || ''
    },
    respondent: {
      fullLegalName: backgroundData.opposingParty.name || '',
      address: backgroundData.opposingParty.name || '',
      phoneAndFax: backgroundData.opposingParty.phone || '',
      email: backgroundData.opposingParty.email || '',
    },
    respondentsLawyer: {
      fullLegalName: backgroundData.opposingParty.lawyerName || '',
      address: backgroundData.opposingParty.lawyerAddress || '',
      phoneAndFax: backgroundData.opposingParty.lawyerPhone || '',
      email: backgroundData.opposingParty.lawyerEmail || ''
    }
  }

  useEffect(() => {
    if (!selectBackgroundLoading && !selectCourtLoading) {
      setLoading(false)
      setPdfData(documentData)
      setMatterInfo(selectAllData?.body)

    }
    if (selectBackgroundLoading && selectCourtLoading) {
      setLoading(true)
    }
  }, [selectBackgroundLoading, selectCourtLoading])

  return {
    pdfData,
    matterInfo,
    loading
  }
}

export function Form10Alt(matterId) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [pdfData, setPdfData] = useState(null);
  const [matterInfo, setMatterInfo] = useState(null);

  useEffect(() => {
    dispatch(getMatterData(matterId));
  }, [dispatch, matterId]);

  const selectAllData = useSelector(selectMatterData);
  const selectAllDataLoading = useSelector(selectMatterDataLoading);

  useEffect(() => {
    if (selectAllData) {
      setMatterInfo(selectAllData.body);
    }
  }, [selectAllData]);

  const backgroundData = {
    client: matterInfo?.background?.find(data => data.role === 'Client') || {},
    opposingParty: matterInfo?.background?.find(data => data.role === 'Opposing Party') || {}
  };

  const courtInfo = {
    courtName: matterInfo?.court_info[0]?.court_name,
    courtFileNumber: matterInfo?.court_info[0]?.file_number,
    courtOfficeAddress: matterInfo?.court_info[0]?.address,
  }

  const { childrenData } = TheChildren(matterInfo?.children)
  const { ExpenseDetailsClient, ExpenseDetailsOpposingParty, clientSpecialExpenses, opposingPartySpecialExpenses } = ExpenseInfo(matterInfo?.expenses)



  const { assetDetailsArray} = AssetsInfo(
    matterInfo?.assets,
    matterId
  )

  // incomeBenefit
  const incomeBenefit = {
    client: {
      income:
        matterInfo?.income_benefits.filter(
          data => data.role === 'Client' && data.incomeBenefit === 'income'
        ) || [],
      benefit:
        matterInfo?.income_benefits.filter(
          data => data.role === 'Client' && data.incomeBenefit === 'benefit'
        ) || []
    },
    opposingParty: {
      income:
        matterInfo?.income_benefits.filter(
          data =>
            data.role === 'opposingParty' && data.incomeBenefit === 'income'
        ) || [],
      benefit:
        matterInfo?.income_benefits.filter(
          data =>
            data.role === 'opposingParty' && data.incomeBenefit === 'benefit'
        ) || []
    }
  }

  const clientIncome = incomeBenefit.client.income
  const opposingPartyIncome = incomeBenefit.opposingParty.income

  const clientBenefits = incomeBenefit.client.benefit
  const opposingPartyBenefits = incomeBenefit.opposingParty.benefit

  const incomeSources = () => {
    // Initialize an object to store the totals
    const clientTotals = {}

    const opposingPartyTotals = {}

    // Calculate totals for each type of income
    clientIncome.forEach(item => {
      if (!clientTotals[item.type]) {
        clientTotals[item.type] = 0
      }
      clientTotals[item.type] += parseInt(item.monthlyAmount)
    })

    // Calculate totals for each type of income
    opposingPartyIncome.forEach(item => {
      if (!opposingPartyTotals[item.type]) {
        opposingPartyTotals[item.type] = 0
      }
      opposingPartyTotals[item.type] += parseInt(item.monthlyAmount)
    })

    // Log the totals
    const clientSources = {
      employmentIncome: clientTotals['Employment income (before deductions)'] || '',
      commissionTipsBonuses: clientTotals['Commissions, tips and bonuses'] || '',
      selfEmploymentIncome: clientTotals['Self-employment income'] || '',
      employmentInsuranceBenefits: clientTotals['Employment insurance benefits'] || '',
      workersCompensationBenefits: clientTotals["Workers' compensation benefits"] || '',
      socialAssistanceIncome: clientTotals['Social assistance income (including ODSP payments)'] || '',
      interestInvestmentIncome: clientTotals['Interest and investment income'] || '',
      pensionIncome: clientTotals['Pension income (including CPP and OAS)'] || '',
      spousalSupport: clientTotals['Spousal support received from a former spouse/partner'] || '',
      childTaxBenefits: clientTotals['Child tax benefits'] || '',
      otherIncome: clientTotals['Other sources of income'] || '',
      // totalMonthlyIncome: '', // Total monthly income (sum of all above incomes)
      // totalAnnualIncome: '' // Total annual income (multiply total monthly income by 12)
    }

    const opposingPartySources = {
      employmentIncome: opposingPartyTotals['Employment income (before deductions)'] || '',
      commissionTipsBonuses: opposingPartyTotals['Commissions, tips and bonuses'] || '',
      selfEmploymentIncome: opposingPartyTotals['Self-employment income'] || '',
      employmentInsuranceBenefits: opposingPartyTotals['Employment insurance benefits'] || '',
      workersCompensationBenefits: opposingPartyTotals["Workers' compensation benefits"] || '',
      socialAssistanceIncome: opposingPartyTotals['Social assistance income (including ODSP payments)'] || '',
      interestInvestmentIncome: opposingPartyTotals['Interest and investment income'] || '',
      pensionIncome: opposingPartyTotals['Pension income (including CPP and OAS)'] || '',
      spousalSupport: opposingPartyTotals['Spousal support received from a former spouse/partner'] || '',
      childTaxBenefits: opposingPartyTotals['Child tax benefits'] || '',
      otherIncome: opposingPartyTotals['Other sources of income'] || '',
      // totalMonthlyIncome: '', // Total monthly income (sum of all above incomes)
      // totalAnnualIncome: '' // Total annual income (multiply total monthly income by 12)
    }

    return { client: clientSources, opposingParty: opposingPartySources }
  }

  const benefitsSources = () => {
    // Initialize an object to store the totals
    const clientTotals = {}

    const opposingPartyTotals = {}

    // Calculate totals for each type of income
    clientBenefits.forEach(item => {
      if (!clientTotals[item.type]) {
        clientTotals[item.type] = 0
      }
      clientTotals[item.type] += parseInt(item.monthlyAmount)
    })

    // Calculate totals for each type of income
    opposingPartyBenefits.forEach(item => {
      if (!opposingPartyTotals[item.type]) {
        opposingPartyTotals[item.type] = 0
      }
      opposingPartyTotals[item.type] += parseInt(item.monthlyAmount)
    })

    // Log the totals
    const clientBenefitSources = {
      medicalInsuranceCover: clientTotals['Medical Insurance Coverage'] || '',
      companyCar: clientTotals['Use of Company Car'] || '',
      useOfRoom: clientTotals['Use of Room'] || '',
      otherBenefit: clientTotals['Other'] || '',
    }

    const opposingPartyBenefitSources = {
      medicalInsuranceCover: opposingPartyTotals['Medical Insurance Coverage'] || '',
      companyCar: opposingPartyTotals['Use of Company Car'] || '',
      useOfRoom: opposingPartyTotals['Use of Room'] || '',
      otherBenefit: opposingPartyTotals['Other'] || '',

    }

    return { client: clientBenefitSources, opposingParty: opposingPartyBenefitSources }
  }

  const source = incomeSources()

  const benefitSource = benefitsSources()

  const documentData = {
    court_info: courtInfo,
    applicationType: '',
    applicant: {
      fullLegalName: backgroundData.client.name || '',
      address: backgroundData.client.address || '',
      phoneAndFax: backgroundData.client.phone || '',
      email: backgroundData.client.email || ''
    },
    applicantsLawyer: {
      fullLegalName: backgroundData.client.lawyerName || '',
      address: backgroundData.client.lawyerAddress || '',
      phoneAndFax: backgroundData.client.lawyerPhone || '',
      email: backgroundData.client.lawyerEmail || ''
    },
    respondent: {
      fullLegalName: backgroundData.opposingParty.name || '',
      address: backgroundData.opposingParty.name || '',
      phoneAndFax: backgroundData.opposingParty.phone || '',
      email: backgroundData.opposingParty.email || '',
    },
    respondentsLawyer: {
      fullLegalName: backgroundData.opposingParty.lawyerName || '',
      address: backgroundData.opposingParty.lawyerAddress || '',
      phoneAndFax: backgroundData.opposingParty.lawyerPhone || '',
      email: backgroundData.opposingParty.lawyerEmail || ''
    },
    childrenLawyer: {
      info: ''
    },
    theChildren: childrenData,
    expenses: {
      client: {},
      opposingParty: {}
    },
    specialExpenses: {
      client: {},
      opposingParty: {}
    },
    assets: {},
    debts: {},
    income: source,
    benefits: benefitSource,
    relationshipDates: {
      marriedOn: {
        checked: matterInfo?.relationship[0]?.dateOfMarriage
          ? true
          : false || '',
        date: matterInfo?.relationship[0]?.dateOfMarriage || ''
      },
      startedLivingTogetherOn: {
        checked: matterInfo?.relationship[0]?.startedLivingTogether
          ? true
          : false || '',
        date: matterInfo?.relationship[0]?.startedLivingTogether || ''
      },
      separatedOn: {
        checked: matterInfo?.relationship[0]?.dateOfSeparation
          ? true
          : false || '',
        date: matterInfo?.relationship[0]?.dateOfSeparation || ''
      },
      isNeverLivedTogether: {
        checked:
          matterInfo?.relationship[0]?.neverLivedTogether === 'No'
            ? true
            : false || ''
      }
    },
  };

  documentData.expenses.client = ExpenseDetailsClient.expenses
  documentData.expenses.opposingParty = ExpenseDetailsOpposingParty.expenses

  documentData.specialExpenses.client = Array.isArray(clientSpecialExpenses) ? clientSpecialExpenses?.map(item => ({
    name: item.childName,
    expenses: item.type,
    amount: item.amount,
    tax: item.taxCredits,
  })) : [];

  documentData.specialExpenses.opposingParty = Array.isArray(opposingPartySpecialExpenses) ? opposingPartySpecialExpenses?.map(item => ({
    name: item.childName,
    expenses: item.type,
    amount: item.amount,
    tax: item.taxCredits,
  })) : [];

  documentData.assets = assetDetailsArray?.assets

  documentData.debts = assetDetailsArray?.debts

  useEffect(() => {
    if (!selectAllDataLoading) {
      setLoading(false);
      setPdfData(documentData);
    } else {
      setLoading(true);
    }
  }, [selectAllDataLoading, matterInfo]); // Removed documentData from dependencies

  return {
    matterInfo,
    pdfData,
    loading
  };
}

export function Form10B(matterId) {
  const [loading, setLoading] = useState(true)
  const [pdfData, setPdfData] = useState()

  const { selectCourt, selectCourtLoading } = CourtData(matterId)

  const { selectBackground, selectBackgroundLoading } = BackgroundData(matterId)

  const backgroundData = {
    client: selectBackground?.body?.find(data => data.role === 'Client') || {},
    opposingParty:
      selectBackground?.body?.find(data => data.role === 'Opposing Party') || {}
  }

  const documentData = {
    courtName: selectCourt?.body[0]?.court_name || '',
    courtFileNumber: selectCourt?.body[0]?.file_number || '',
    courtOfficeAddress: selectCourt?.body[0]?.address || '',
    applicationType: '',
    applicant: {
      fullLegalName: backgroundData.client.name || '',
      address: backgroundData.client.address || '',
      phoneAndFax: backgroundData.client.phone || '',
      email: backgroundData.client.email || ''
    },
    applicantsLawyer: {
      fullLegalName: backgroundData.client.lawyerName || '',
      address: backgroundData.client.lawyerAddress || '',
      phoneAndFax: backgroundData.client.lawyerPhone || '',
      email: backgroundData.client.lawyerEmail || ''
    },
    respondent: {
      fullLegalName: backgroundData.opposingParty.name || '',
      address: backgroundData.opposingParty.name || '',
      phoneAndFax: backgroundData.opposingParty.phone || '',
      email: backgroundData.opposingParty.email || '',
    },
    respondentsLawyer: {
      fullLegalName: backgroundData.opposingParty.lawyerName || '',
      address: backgroundData.opposingParty.lawyerAddress || '',
      phoneAndFax: backgroundData.opposingParty.lawyerPhone || '',
      email: backgroundData.opposingParty.lawyerEmail || ''
    }
  }

  useEffect(() => {
    if (!selectBackgroundLoading && !selectCourtLoading) {
      setLoading(false)
      setPdfData(documentData)
    }
    if (selectBackgroundLoading && selectCourtLoading) {
      setLoading(true)
    }
  }, [selectBackgroundLoading, selectCourtLoading])

  return {
    pdfData,
    loading
  }
}

export function Form15(matterId) {
  const [loading, setLoading] = useState(true);
  const [pdfData, setPdfData] = useState()

  const { selectCourt, selectCourtLoading } = CourtData(matterId)
  const { selectRelationship, selectRelationshipLoading } = RelationshipData(matterId)
  const { selectBackground, selectBackgroundLoading } = BackgroundData(matterId)
  const { selectChildrenData } = ChildrenData(matterId)
  // const children = selectChildrenData?.body;

  const { selectExpenseData, selectExpenseDataLoading } = ExpenseData(matterId)
  const { clientSpecialExpenses } = Expenses(selectExpenseData)


  const backgroundData = {
    client: selectBackground?.body?.find(data => data.role === 'Client') || {},
    opposingParty: selectBackground?.body?.find(data => data.role === 'Opposing Party') || {}
  }


  const theChildrenData = () => {
    let childrenData = [];

    if (selectChildrenData?.body?.length > 0) {
      childrenData = selectChildrenData.body.map(child => ({
        fullLegalName: child.childName,
        age: calculateAge(child.dateOfBirth),
        birthdate: child.dateOfBirth,
        muncipilityAndProvince: '', // Add the relevant data if available
        nowLivingWith: child.nowLivesWith
      }));
    } else {
      childrenData = [
        {
          fullLegalName: '',
          age: '',
          birthdate: '',
          muncipilityAndProvince: '', // Add the relevant data if available
          nowLivingWith: ''
        },
        {
          fullLegalName: '',
          age: '',
          birthdate: '',
          muncipilityAndProvince: '', // Add the relevant data if available
          nowLivingWith: ''
        },
        {
          fullLegalName: '',
          age: '',
          birthdate: '',
          muncipilityAndProvince: '', // Add the relevant data if available
          nowLivingWith: ''
        }
      ]
    }
    return childrenData
  }

  const documentData = {
    courtName: selectCourt?.body[0]?.court_name || '',
    courtFileNumber: selectCourt?.body[0]?.file_number || '',
    courtOfficeAddress: selectCourt?.body[0]?.address || '',
    applicationType: '',
    applicant: {
      fullLegalName: backgroundData.client.name || '',
      address: backgroundData.client.address || '',
      phoneAndFax: backgroundData.client.phone || '',
      email: backgroundData.client.email || '',
      dateOfBirth: backgroundData.client.dateOfBirth || ''
    },
    applicantsLawyer: {
      fullLegalName: backgroundData.client.lawyerName || '',
      address: backgroundData.client.lawyerAddress || '',
      phoneAndFax: backgroundData.client.lawyerPhone || '',
      email: backgroundData.client.lawyerEmail || ''
    },
    respondent: {
      fullLegalName: backgroundData.opposingParty.name || '',
      address: backgroundData.opposingParty.name || '',
      phoneAndFax: backgroundData.opposingParty.phone || '',
      email: backgroundData.opposingParty.email || '',
      dateOfBirth: backgroundData.opposingParty.dateOfBirth || ''
    },
    respondentsLawyer: {
      fullLegalName: backgroundData.opposingParty.lawyerName || '',
      address: backgroundData.opposingParty.lawyerAddress || '',
      phoneAndFax: backgroundData.opposingParty.lawyerPhone || '',
      email: backgroundData.opposingParty.lawyerEmail || ''
    },
    assignee: {
      fullLegalName: '',
      address: '',
      phoneAndFax: '',
      email: ''
    },
    assigneeLawyer: {
      fullLegalName: '',
      address: '',
      phoneAndFax: '',
      email: ''
    },
    relationshipDates: {
      marriedOn: {
        checked: selectRelationship?.body[0]?.dateOfMarriage
          ? true
          : false || '',
        date: selectRelationship?.body[0]?.dateOfMarriage || ''
      },
      startedLivingTogetherOn: {
        checked: selectRelationship?.body[0]?.startedLivingTogether
          ? true
          : false || '',
        date: selectRelationship?.body[0]?.startedLivingTogether || ''
      },
      separatedOn: {
        checked: selectRelationship?.body[0]?.dateOfSeparation
          ? true
          : false || '',
        date: selectRelationship?.body[0]?.dateOfSeparation || ''
      },
      isNeverLivedTogether: {
        checked:
          selectRelationship?.body[0]?.neverLivedTogether === 'No'
            ? true
            : false || ''
      }
    },
    familyHistory: {
      theChildren: theChildrenData(),
    },
    expenses: {
      specialExpenses: []
    }
  }

  documentData.expenses.specialExpenses = Array.isArray(clientSpecialExpenses) ? clientSpecialExpenses?.map(item => ({
    name: item.childName,
    expenses: item.type,
    amount: item.amount,
    tax: item.taxCredits,
  })) : [];

  const ApplicantData = [
    { label: 'Full legal name:', value: documentData?.applicant.fullLegalName, type: 'text', update: 'applicant.fullLegalName' },
    { label: 'Address:', value: documentData?.applicant.address, type: 'text', update: 'applicant.address' },
    { label: 'Phone & fax:', value: documentData?.applicant?.phoneAndFax, type: 'text', update: 'applicant.phoneAndFax' },
    { label: 'Email:', value: documentData?.applicant?.email, type: 'email', update: 'applicant.email' },
  ];
  const ApplicantLawyerData = [
    { label: 'Full legal name:', value: documentData?.applicantsLawyer.fullLegalName, type: 'text', update: 'applicantsLawyer.fullLegalName' },
    { label: 'Address:', value: documentData?.applicantsLawyer.address, type: 'text', update: 'applicantsLawyer.address' },
    { label: 'Phone & fax:', value: documentData?.applicantsLawyer.phoneAndFax, type: 'text', update: 'applicantsLawyer.phoneAndFax' },
    { label: 'Email:', value: documentData?.applicantsLawyer.email, type: 'email', update: 'applicantsLawyer.email' },
  ];
  const RespondentData = [
    { label: 'Full legal name:', value: documentData?.respondent.fullLegalName, type: 'text', update: 'respondent.fullLegalName' },
    { label: 'Address:', value: documentData?.respondent.address, type: 'text', update: 'respondent.address' },
    { label: 'Phone & fax:', value: documentData?.respondent.phoneAndFax, type: 'text', update: 'respondent.phoneAndFax' },
    { label: 'Email:', value: documentData?.respondent.email, type: 'email', update: 'respondent.email' },
  ];
  const RespondentLawyerData = [
    { label: 'Full legal name:', value: documentData?.respondentsLawyer.fullLegalName, type: 'text', update: 'respondentsLawyer.fullLegalName' },
    { label: 'Address:', value: documentData?.respondentsLawyer.address, type: 'text', update: 'respondentsLawyer.address' },
    { label: 'Phone & fax:', value: documentData?.respondentsLawyer.phoneAndFax, type: 'text', update: 'respondentsLawyer.phoneAndFax' },
    { label: 'Email:', value: documentData?.respondentsLawyer.email, type: 'email', update: 'respondentsLawyer.email' },
  ];
  const AssigneeData = [
    { label: 'Full legal name:', value: documentData?.respondentsLawyer.fullLegalName, type: 'text', update: 'respondentsLawyer.fullLegalName' },
    { label: 'Address:', value: documentData?.respondentsLawyer.address, type: 'text', update: 'respondentsLawyer.address' },
    { label: 'Phone & fax:', value: documentData?.respondentsLawyer.phoneAndFax, type: 'text', update: 'respondentsLawyer.phoneAndFax' },
    { label: 'Email:', value: documentData?.respondentsLawyer.email, type: 'email', update: 'respondentsLawyer.email' },
  ];
  const AssigneeLawyerData = [
    { label: 'Full legal name:', value: documentData?.respondentsLawyer.fullLegalName, type: 'text', update: 'respondentsLawyer.fullLegalName' },
    { label: 'Address:', value: documentData?.respondentsLawyer.address, type: 'text', update: 'respondentsLawyer.address' },
    { label: 'Phone & fax:', value: documentData?.respondentsLawyer.phoneAndFax, type: 'text', update: 'respondentsLawyer.phoneAndFax' },
    { label: 'Email:', value: documentData?.respondentsLawyer.email, type: 'email', update: 'respondentsLawyer.email' },
  ];

  useEffect(() => {
    if (
      !selectBackgroundLoading &&
      !selectCourtLoading &&
      !selectExpenseDataLoading &&
      selectBackground &&
      selectCourt &&
      selectExpenseData &&
      selectRelationship
    ) {
      setLoading(false)
      setPdfData(documentData)
    }
    if (
      selectBackgroundLoading &&
      selectCourtLoading &&
      selectExpenseDataLoading &&
      selectRelationshipLoading

    ) {
      setLoading(true)
    }

  }, [
    selectBackgroundLoading,
    selectCourtLoading,
    selectExpenseDataLoading,
    selectRelationshipLoading
  ])


  return {
    pdfData,
    ApplicantData,
    ApplicantLawyerData,
    RespondentData,
    RespondentLawyerData,
    AssigneeData,
    AssigneeLawyerData,
    loading
  }
}

export function Form15B(matterId) {
  const [loading, setLoading] = useState(true);
  const [pdfData, setPdfData] = useState()

  const { selectCourt, selectCourtLoading } = CourtData(matterId)

  const { selectBackground, selectBackgroundLoading } = BackgroundData(matterId)
  const { selectChildrenData } = ChildrenData(matterId)
  // const children = selectChildrenData?.body;

  const { selectExpenseData, selectExpenseDataLoading } = ExpenseData(matterId)
  const { clientSpecialExpenses } = Expenses(selectExpenseData)

  const backgroundData = {
    client: selectBackground?.body?.find(data => data.role === 'Client') || {},
    opposingParty: selectBackground?.body?.find(data => data.role === 'Opposing Party') || {}
  }

  const theChildrenData = () => {
    let childrenData = [];

    if (selectChildrenData?.body?.length > 0) {
      childrenData = selectChildrenData.body.map(child => ({
        fullLegalName: child.childName,
        age: calculateAge(child.dateOfBirth),
        birthdate: child.dateOfBirth,
        muncipilityAndProvince: '', // Add the relevant data if available
        nowLivingWith: child.nowLivesWith
      }));
    } else {
      childrenData = [
        {
          fullLegalName: '',
          age: '',
          birthdate: '',
          muncipilityAndProvince: '', // Add the relevant data if available
          nowLivingWith: ''
        },
        {
          fullLegalName: '',
          age: '',
          birthdate: '',
          muncipilityAndProvince: '', // Add the relevant data if available
          nowLivingWith: ''
        },
        {
          fullLegalName: '',
          age: '',
          birthdate: '',
          muncipilityAndProvince: '', // Add the relevant data if available
          nowLivingWith: ''
        }
      ]
    }
    return childrenData
  }

  const documentData = {
    courtName: selectCourt?.body[0]?.court_name || '',
    courtFileNumber: selectCourt?.body[0]?.file_number || '',
    courtOfficeAddress: selectCourt?.body[0]?.address || '',
    applicationType: '',
    applicant: {
      fullLegalName: backgroundData.client.name || '',
      address: backgroundData.client.address || '',
      phoneAndFax: backgroundData.client.phone || '',
      email: backgroundData.client.email || ''
    },
    applicantsLawyer: {
      fullLegalName: backgroundData.client.lawyerName || '',
      address: backgroundData.client.lawyerAddress || '',
      phoneAndFax: backgroundData.client.lawyerPhone || '',
      email: backgroundData.client.lawyerEmail || ''
    },
    respondent: {
      fullLegalName: backgroundData.opposingParty.name || '',
      address: backgroundData.opposingParty.name || '',
      phoneAndFax: backgroundData.opposingParty.phone || '',
      email: backgroundData.opposingParty.email || '',
    },
    respondentsLawyer: {
      fullLegalName: backgroundData.opposingParty.lawyerName || '',
      address: backgroundData.opposingParty.lawyerAddress || '',
      phoneAndFax: backgroundData.opposingParty.lawyerPhone || '',
      email: backgroundData.opposingParty.lawyerEmail || ''
    },
    assignee: {
      fullLegalName: '',
      address: '',
      phoneAndFax: '',
      email: ''
    },
    assigneeLawyer: {
      fullLegalName: '',
      address: '',
      phoneAndFax: '',
      email: ''
    },
    familyHistory: {
      theChildren: theChildrenData(),
    },
    expenses: {
      specialExpenses: []
    },
  }

  documentData.expenses.specialExpenses = Array.isArray(clientSpecialExpenses) ? clientSpecialExpenses?.map(item => ({
    name: item.childName,
    expenses: item.type,
    amount: item.amount,
    tax: item.taxCredits,
  })) : [];

  const ApplicantData = [
    { label: 'Full legal name:', value: documentData?.applicant.fullLegalName, type: 'text', update: 'applicant.fullLegalName' },
    { label: 'Address:', value: documentData?.applicant.address, type: 'text', update: 'applicant.address' },
    { label: 'Phone & fax:', value: documentData?.applicant?.phoneAndFax, type: 'text', update: 'applicant.phoneAndFax' },
    { label: 'Email:', value: documentData?.applicant?.email, type: 'email', update: 'applicant.email' },
  ];
  const ApplicantLawyerData = [
    { label: 'Full legal name:', value: documentData?.applicantsLawyer.fullLegalName, type: 'text', update: 'applicantsLawyer.fullLegalName' },
    { label: 'Address:', value: documentData?.applicantsLawyer.address, type: 'text', update: 'applicantsLawyer.address' },
    { label: 'Phone & fax:', value: documentData?.applicantsLawyer.phoneAndFax, type: 'text', update: 'applicantsLawyer.phoneAndFax' },
    { label: 'Email:', value: documentData?.applicantsLawyer.email, type: 'email', update: 'applicantsLawyer.email' },
  ];
  const RespondentData = [
    { label: 'Full legal name:', value: documentData?.respondent.fullLegalName, type: 'text', update: 'respondent.fullLegalName' },
    { label: 'Address:', value: documentData?.respondent.address, type: 'text', update: 'respondent.address' },
    { label: 'Phone & fax:', value: documentData?.respondent.phoneAndFax, type: 'text', update: 'respondent.phoneAndFax' },
    { label: 'Email:', value: documentData?.respondent.email, type: 'email', update: 'respondent.email' },
  ];

  const RespondentLawyerData = [
    { label: 'Full legal name:', value: documentData?.respondentsLawyer.fullLegalName, type: 'text', update: 'respondentsLawyer.fullLegalName' },
    { label: 'Address:', value: documentData?.respondentsLawyer.address, type: 'text', update: 'respondentsLawyer.address' },
    { label: 'Phone & fax:', value: documentData?.respondentsLawyer.phoneAndFax, type: 'text', update: 'respondentsLawyer.phoneAndFax' },
    { label: 'Email:', value: documentData?.respondentsLawyer.email, type: 'email', update: 'respondentsLawyer.email' },
  ];
  useEffect(() => {
    if (
      !selectBackgroundLoading &&
      !selectCourtLoading &&
      !selectExpenseDataLoading &&
      selectBackground &&
      selectCourt &&
      selectExpenseData
    ) {
      setLoading(false)
      setPdfData(documentData)
    }
    if (
      selectBackgroundLoading &&
      selectCourtLoading &&
      selectExpenseDataLoading

    ) {
      setLoading(true)
    }

  }, [
    selectBackgroundLoading,
    selectCourtLoading,
    selectExpenseDataLoading,
  ])


  return {
    pdfData,
    ApplicantData,
    ApplicantLawyerData,
    RespondentData,
    RespondentLawyerData,
    loading
  }
}

export function Form15C(matterId) {
  const [loading, setLoading] = useState(true);
  const [pdfData, setPdfData] = useState()

  const { selectCourt, selectCourtLoading } = CourtData(matterId)

  const { selectBackground, selectBackgroundLoading } = BackgroundData(matterId)
  const { selectChildrenData } = ChildrenData(matterId)
  // const children = selectChildrenData?.body;

  const { selectExpenseData, selectExpenseDataLoading } = ExpenseData(matterId)
  const { clientSpecialExpenses } = Expenses(selectExpenseData)

  const backgroundData = {
    client: selectBackground?.body?.find(data => data.role === 'Client') || {},
    opposingParty: selectBackground?.body?.find(data => data.role === 'Opposing Party') || {}
  }

  const theChildrenData = () => {
    let childrenData = [];

    if (selectChildrenData?.body?.length > 0) {
      childrenData = selectChildrenData.body.map(child => ({
        fullLegalName: child.childName,
        age: calculateAge(child.dateOfBirth),
        birthdate: child.dateOfBirth,
        muncipilityAndProvince: '', // Add the relevant data if available
        nowLivingWith: child.nowLivesWith
      }));
    } else {
      childrenData = [
        {
          fullLegalName: '',
          age: '',
          birthdate: '',
          muncipilityAndProvince: '', // Add the relevant data if available
          nowLivingWith: ''
        },
        {
          fullLegalName: '',
          age: '',
          birthdate: '',
          muncipilityAndProvince: '', // Add the relevant data if available
          nowLivingWith: ''
        },
        {
          fullLegalName: '',
          age: '',
          birthdate: '',
          muncipilityAndProvince: '', // Add the relevant data if available
          nowLivingWith: ''
        }
      ]
    }
    return childrenData
  }

  const documentData = {
    courtName: selectCourt?.body[0]?.court_name || '',
    courtFileNumber: selectCourt?.body[0]?.file_number || '',
    courtOfficeAddress: selectCourt?.body[0]?.address || '',
    applicationType: '',
    applicant: {
      fullLegalName: backgroundData.client.name || '',
      address: backgroundData.client.address || '',
      phoneAndFax: backgroundData.client.phone || '',
      email: backgroundData.client.email || ''
    },
    applicantsLawyer: {
      fullLegalName: backgroundData.client.lawyerName || '',
      address: backgroundData.client.lawyerAddress || '',
      phoneAndFax: backgroundData.client.lawyerPhone || '',
      email: backgroundData.client.lawyerEmail || ''
    },
    respondent: {
      fullLegalName: backgroundData.opposingParty.name || '',
      address: backgroundData.opposingParty.name || '',
      phoneAndFax: backgroundData.opposingParty.phone || '',
      email: backgroundData.opposingParty.email || '',
    },
    respondentsLawyer: {
      fullLegalName: backgroundData.opposingParty.lawyerName || '',
      address: backgroundData.opposingParty.lawyerAddress || '',
      phoneAndFax: backgroundData.opposingParty.lawyerPhone || '',
      email: backgroundData.opposingParty.lawyerEmail || ''
    },
    assignee: {
      fullLegalName: '',
      address: '',
      phoneAndFax: '',
      email: ''
    },
    assigneeLawyer: {
      fullLegalName: '',
      address: '',
      phoneAndFax: '',
      email: ''
    },
    familyHistory: {
      theChildren: theChildrenData(),
    },
    expenses: {
      specialExpenses: []
    },
  }

  documentData.expenses.specialExpenses = Array.isArray(clientSpecialExpenses) ? clientSpecialExpenses?.map(item => ({
    name: item.childName,
    expenses: item.type,
    amount: item.amount,
    tax: item.taxCredits,
  })) : [];

  const ApplicantData = [
    { label: 'Full legal name:', value: documentData?.applicant.fullLegalName, type: 'text', update: 'applicant.fullLegalName' },
    { label: 'Address:', value: documentData?.applicant.address, type: 'text', update: 'applicant.address' },
    { label: 'Phone & fax:', value: documentData?.applicant?.phoneAndFax, type: 'text', update: 'applicant.phoneAndFax' },
    { label: 'Email:', value: documentData?.applicant?.email, type: 'email', update: 'applicant.email' },
  ];
  const ApplicantLawyerData = [
    { label: 'Full legal name:', value: documentData?.applicantsLawyer.fullLegalName, type: 'text', update: 'applicantsLawyer.fullLegalName' },
    { label: 'Address:', value: documentData?.applicantsLawyer.address, type: 'text', update: 'applicantsLawyer.address' },
    { label: 'Phone & fax:', value: documentData?.applicantsLawyer.phoneAndFax, type: 'text', update: 'applicantsLawyer.phoneAndFax' },
    { label: 'Email:', value: documentData?.applicantsLawyer.email, type: 'email', update: 'applicantsLawyer.email' },
  ];
  const RespondentData = [
    { label: 'Full legal name:', value: documentData?.respondent.fullLegalName, type: 'text', update: 'respondent.fullLegalName' },
    { label: 'Address:', value: documentData?.respondent.address, type: 'text', update: 'respondent.address' },
    { label: 'Phone & fax:', value: documentData?.respondent.phoneAndFax, type: 'text', update: 'respondent.phoneAndFax' },
    { label: 'Email:', value: documentData?.respondent.email, type: 'email', update: 'respondent.email' },
  ];

  const RespondentLawyerData = [
    { label: 'Full legal name:', value: documentData?.respondentsLawyer.fullLegalName, type: 'text', update: 'respondentsLawyer.fullLegalName' },
    { label: 'Address:', value: documentData?.respondentsLawyer.address, type: 'text', update: 'respondentsLawyer.address' },
    { label: 'Phone & fax:', value: documentData?.respondentsLawyer.phoneAndFax, type: 'text', update: 'respondentsLawyer.phoneAndFax' },
    { label: 'Email:', value: documentData?.respondentsLawyer.email, type: 'email', update: 'respondentsLawyer.email' },
  ];
  const AssigneeData = [
    { label: 'Full legal name:', value: documentData?.assignee.fullLegalName, type: 'text', update: 'assignee.fullLegalName' },
    { label: 'Address:', value: documentData?.assignee.address, type: 'text', update: 'assignee.address' },
    { label: 'Phone & fax:', value: documentData?.assignee.phoneAndFax, type: 'text', update: 'assignee.phoneAndFax' },
    { label: 'Email:', value: documentData?.assignee.email, type: 'email', update: 'assignee.email' },
  ];
  const AssigneeLawyerData = [
    { label: 'Full legal name:', value: documentData?.assigneeLawyer.fullLegalName, type: 'text', update: 'assigneeLawyer.fullLegalName' },
    { label: 'Address:', value: documentData?.assigneeLawyer.address, type: 'text', update: 'assigneeLawyer.address' },
    { label: 'Phone & fax:', value: documentData?.assigneeLawyer.phoneAndFax, type: 'text', update: 'assigneeLawyer.phoneAndFax' },
    { label: 'Email:', value: documentData?.assigneeLawyer.email, type: 'email', update: 'assigneeLawyer.email' },
  ];

  useEffect(() => {
    if (
      !selectBackgroundLoading &&
      !selectCourtLoading &&
      !selectExpenseDataLoading &&
      selectBackground &&
      selectCourt &&
      selectExpenseData
    ) {
      setLoading(false)
      setPdfData(documentData)
    }
    if (
      selectBackgroundLoading &&
      selectCourtLoading &&
      selectExpenseDataLoading

    ) {
      setLoading(true)
    }

  }, [
    selectBackgroundLoading,
    selectCourtLoading,
    selectExpenseDataLoading,
  ])


  return {
    pdfData,
    ApplicantData,
    ApplicantLawyerData,
    RespondentData,
    RespondentLawyerData,
    AssigneeData,
    AssigneeLawyerData,
    loading
  }
}

export function Form23(matterId) {
  const [loading, setLoading] = useState(true)
  const [pdfData, setPdfData] = useState()

  const { selectCourt, selectCourtLoading } = CourtData(matterId)

  const { selectBackground, selectBackgroundLoading } = BackgroundData(matterId)
  // const { selectChildrenData } =
  //   ChildrenData(matterId)

  const backgroundData = {
    client: selectBackground?.body?.find(data => data.role === 'Client') || {},
    opposingParty:
      selectBackground?.body?.find(data => data.role === 'Opposing Party') || {}
  }

  // const theChildrenData = () => {
  //   let childrenData = []

  //   if (selectChildrenData?.body?.length > 0) {
  //     childrenData = selectChildrenData.body.map(child => ({
  //       fullLegalName: child.childName,
  //       age: calculateAge(child.dateOfBirth),
  //       birthdate: child.dateOfBirth,
  //       muncipilityAndProvince: '', // Add the relevant data if available
  //       nowLivingWith: child.nowLivesWith
  //     }))
  //   } else {
  //     childrenData = [
  //       {
  //         fullLegalName: '',
  //         age: '',
  //         birthdate: '',
  //         muncipilityAndProvince: '', // Add the relevant data if available
  //         nowLivingWith: ''
  //       },
  //       {
  //         fullLegalName: '',
  //         age: '',
  //         birthdate: '',
  //         muncipilityAndProvince: '', // Add the relevant data if available
  //         nowLivingWith: ''
  //       },
  //       {
  //         fullLegalName: '',
  //         age: '',
  //         birthdate: '',
  //         muncipilityAndProvince: '', // Add the relevant data if available
  //         nowLivingWith: ''
  //       }
  //     ]
  //   }
  //   return childrenData
  // }

  const documentData = {
    courtName: selectCourt?.body[0]?.court_name,
    courtFileNumber: selectCourt?.body[0]?.file_number,
    courtOfficeAddress: selectCourt?.body[0]?.address,

    applicants: {
      applicant1:
        backgroundData.client.name +
        ' , ' +
        backgroundData.client.phone +
        ' , ' +
        backgroundData.client.email,
      applicant2: backgroundData.client.address
    },
    applicantsLawyer: {
      lawyer1:
        backgroundData.client.lawyerName +
        ' , ' +
        backgroundData.client.lawyerPhone +
        ' , ' +
        backgroundData.client.lawyerEmail,
      lawyer2: backgroundData.client.lawyerAddress
    },
    respondents: {
      respondent1:
        backgroundData.opposingParty.name +
        ' , ' +
        backgroundData.opposingParty.phone +
        ' , ' +
        backgroundData.opposingParty.email,
      respondent2: backgroundData.opposingParty.address
    },
    respondentsLawyer: {
      lawyer1:
        backgroundData.opposingParty.lawyerName +
        ' , ' +
        backgroundData.opposingParty.lawyerPhone +
        ' , ' +
        backgroundData.opposingParty.lawyerEmail,
      lawyer2: backgroundData.opposingParty.lawyerAddress
    },
    childrensLawyer: {
      lawyer1: '',
      lawyer2: ''
    },

    myName: backgroundData.client.name,
    valuationDate: '',

    dateOfSignature: '',
    signature: ''
  }

  const ApplicantData = [
    { label: 'Full legal name & address for service — street & number, municipality,postal code, telephone & fax numbers and e-mail address (if any).', value: documentData?.applicants.applicant1, type: 'textarea', update: 'applicants.applicant1' },
    { label: '', value: documentData?.applicants.applicant2, type: 'textarea', update: 'applicants.applicant2' },
  ];
  const ApplicantLawyerData = [
    { label: 'Lawyer’s name & address — street & number, municipality, postal code, telephone & fax numbers and e-mail address (if any).', value: documentData?.applicantsLawyer.lawyer1, type: 'textarea', update: 'applicantsLawyer.lawyer1' },
    { label: 'Applicant Lawyer 2:', value: documentData?.applicantsLawyer.lawyer2, type: 'textarea', update: 'applicantsLawyer.lawyer2' },
  ];

  const RespondentData = [
    { label: 'Full legal name & address for service — street & number, municipality,postal code, telephone & fax numbers and e-mail address (if any).', value: documentData?.respondents.respondent1, type: 'textarea', update: 'respondents.respondent1' },
    { label: '', value: documentData?.respondents.respondent2, type: 'textarea', update: 'respondents.respondent2' },
  ];

  const RespondentLawyerData = [
    { label: 'Lawyer’s name & address — street & number, municipality, postal code, telephone & fax numbers and e-mail address (if any).', value: documentData?.respondentsLawyer.lawyer1, type: 'textarea', update: 'respondentsLawyer.lawyer1' },
    { label: 'Address:', value: documentData?.respondentsLawyer.lawyer2, type: 'textarea', update: 'respondentsLawyer.lawyer2' },
  ];

  const ChildrensLawyer = [
    { label: 'Lawyer’s name & address — street & number, municipality, postal code, telephone & fax numbers and e-mail address (if any).', value: documentData?.childrensLawyer.lawyer1, type: 'textarea', update: 'childrensLawyer.lawyer1' },
    { label: 'Address:', value: documentData?.childrensLawyer.lawyer2, type: 'textarea', update: 'childrensLawyer.lawyer2' },
  ];

  useEffect(() => {
    if (!selectBackgroundLoading && !selectCourtLoading) {
      setLoading(false)
      setPdfData(documentData)
    }
    if (selectBackgroundLoading && selectCourtLoading) {
      setLoading(true)
    }
  }, [selectBackgroundLoading, selectCourtLoading])

  return {
    ApplicantData,
    ApplicantLawyerData,
    RespondentData,
    RespondentLawyerData,
    pdfData,
    ChildrensLawyer,
    loading
  }
}

export function Form10A(matterId) {
  const [loading, setLoading] = useState(true)
  const [pdfData, setPdfData] = useState()

  const { selectCourt, selectCourtLoading } = CourtData(matterId)

  const { selectBackground, selectBackgroundLoading } = BackgroundData(matterId)
  // const { selectChildrenData } =
  //   ChildrenData(matterId)


  const backgroundData = {
    client: selectBackground?.body?.find(data => data.role === 'Client') || {},
    opposingParty:
      selectBackground?.body?.find(data => data.role === 'Opposing Party') || {}
  }

  // const theChildrenData = () => {
  //   let childrenData = []

  //   if (selectChildrenData?.body?.length > 0) {
  //     childrenData = selectChildrenData.body.map(child => ({
  //       fullLegalName: child.childName,
  //       age: calculateAge(child.dateOfBirth),
  //       birthdate: child.dateOfBirth,
  //       muncipilityAndProvince: '', // Add the relevant data if available
  //       nowLivingWith: child.nowLivesWith
  //     }))
  //   } else {
  //     childrenData = [
  //       {
  //         fullLegalName: '',
  //         age: '',
  //         birthdate: '',
  //         muncipilityAndProvince: '', // Add the relevant data if available
  //         nowLivingWith: ''
  //       },
  //       {
  //         fullLegalName: '',
  //         age: '',
  //         birthdate: '',
  //         muncipilityAndProvince: '', // Add the relevant data if available
  //         nowLivingWith: ''
  //       },
  //       {
  //         fullLegalName: '',
  //         age: '',
  //         birthdate: '',
  //         muncipilityAndProvince: '', // Add the relevant data if available
  //         nowLivingWith: ''
  //       }
  //     ]
  //   }
  //   return childrenData
  // }

  const documentData = {
    courtName: selectCourt?.body[0]?.court_name,
    courtFileNumber: selectCourt?.body[0]?.file_number,
    courtOfficeAddress: selectCourt?.body[0]?.address,

    applicants: {
      applicant1:
        backgroundData.client.name +
        ' , ' +
        backgroundData.client.phone +
        ' , ' +
        backgroundData.client.email,
      applicant2: backgroundData.client.address
    },
    applicantsLawyer: {
      lawyer1:
        backgroundData.client.lawyerName +
        ' , ' +
        backgroundData.client.lawyerPhone +
        ' , ' +
        backgroundData.client.lawyerEmail,
      lawyer2: backgroundData.client.lawyerAddress
    },
    respondents: {
      respondent1:
        backgroundData.opposingParty.name +
        ' , ' +
        backgroundData.opposingParty.phone +
        ' , ' +
        backgroundData.opposingParty.email,
      respondent2: backgroundData.opposingParty.address
    },
    respondentsLawyer: {
      lawyer1:
        backgroundData.opposingParty.lawyerName +
        ' , ' +
        backgroundData.opposingParty.lawyerPhone +
        ' , ' +
        backgroundData.opposingParty.lawyerEmail,
      lawyer2: backgroundData.opposingParty.lawyerAddress
    },
    childrensLawyer: {
      lawyer1: '',
      lawyer2: ''
    },

    myName: backgroundData.client.name,
    valuationDate: '',

    dateOfSignature: '',
    signature: ''
  }


  const ApplicantData = [
    { label: 'Full legal name & address for service — street & number, municipality,postal code, telephone & fax numbers and e-mail address (if any).', value: documentData?.applicants.applicant1, type: 'textarea', update: 'applicants.applicant1' },
    { label: '', value: documentData?.applicants.applicant2, type: 'textarea', update: 'applicants.applicant2' },
  ];
  const ApplicantLawyerData = [
    { label: 'Lawyer’s name & address — street & number, municipality, postal code, telephone & fax numbers and e-mail address (if any).', value: documentData?.applicantsLawyer.lawyer1, type: 'textarea', update: 'applicantsLawyer.lawyer1' },
    { label: 'Applicant Lawyer 2:', value: documentData?.applicantsLawyer.lawyer2, type: 'textarea', update: 'applicantsLawyer.lawyer2' },
  ];

  const RespondentData = [
    { label: 'Full legal name & address for service — street & number, municipality,postal code, telephone & fax numbers and e-mail address (if any).', value: documentData?.respondents.respondent1, type: 'textarea', update: 'respondents.respondent1' },
    { label: '', value: documentData?.respondents.respondent2, type: 'textarea', update: 'respondents.respondent2' },
  ];

  const RespondentLawyerData = [
    { label: 'Lawyer’s name & address — street & number, municipality, postal code, telephone & fax numbers and e-mail address (if any).', value: documentData?.respondentsLawyer.lawyer1, type: 'textarea', update: 'respondentsLawyer.lawyer1' },
    { label: 'Address:', value: documentData?.respondentsLawyer.lawyer2, type: 'textarea', update: 'respondentsLawyer.lawyer2' },
  ];

  // const ChildrensLawyer = [
  //   { label: 'Lawyer’s name & address — street & number, municipality, postal code, telephone & fax numbers and e-mail address (if any).', value: documentData?.childrensLawyer.lawyer1, type: 'textarea', update: 'childrensLawyer.lawyer1' },
  //   { label: 'Address:', value: documentData?.childrensLawyer.lawyer2, type: 'textarea', update: 'childrensLawyer.lawyer2' },
  // ];

  useEffect(() => {
    if (!selectBackgroundLoading && !selectCourtLoading) {
      setLoading(false)
      setPdfData(documentData)
    }
    if (selectBackgroundLoading && selectCourtLoading) {
      setLoading(true)
    }
  }, [selectBackgroundLoading, selectCourtLoading])

  return {
    ApplicantData,
    ApplicantLawyerData,
    RespondentData,
    RespondentLawyerData,
    pdfData,
    loading
  }
}

export function Form14A(matterId) {
  const [loading, setLoading] = useState(true)
  const [pdfData, setPdfData] = useState()

  const { selectCourt, selectCourtLoading } = CourtData(matterId)

  const { selectBackground, selectBackgroundLoading } = BackgroundData(matterId)
  // const { selectChildrenData } =
  //   ChildrenData(matterId)


  const backgroundData = {
    client: selectBackground?.body?.find(data => data.role === 'Client') || {},
    opposingParty:
      selectBackground?.body?.find(data => data.role === 'Opposing Party') || {}
  }

  // const theChildrenData = () => {
  //   let childrenData = []

  //   if (selectChildrenData?.body?.length > 0) {
  //     childrenData = selectChildrenData.body.map(child => ({
  //       fullLegalName: child.childName,
  //       age: calculateAge(child.dateOfBirth),
  //       birthdate: child.dateOfBirth,
  //       muncipilityAndProvince: '', // Add the relevant data if available
  //       nowLivingWith: child.nowLivesWith
  //     }))
  //   } else {
  //     childrenData = [
  //       {
  //         fullLegalName: '',
  //         age: '',
  //         birthdate: '',
  //         muncipilityAndProvince: '', // Add the relevant data if available
  //         nowLivingWith: ''
  //       },
  //       {
  //         fullLegalName: '',
  //         age: '',
  //         birthdate: '',
  //         muncipilityAndProvince: '', // Add the relevant data if available
  //         nowLivingWith: ''
  //       },
  //       {
  //         fullLegalName: '',
  //         age: '',
  //         birthdate: '',
  //         muncipilityAndProvince: '', // Add the relevant data if available
  //         nowLivingWith: ''
  //       }
  //     ]
  //   }
  //   return childrenData
  // }

  const documentData = {
    courtName: selectCourt?.body[0]?.court_name,
    courtFileNumber: selectCourt?.body[0]?.file_number,
    courtOfficeAddress: selectCourt?.body[0]?.address,

    applicants: {
      applicant1:
        backgroundData.client.name +
        ' , ' +
        backgroundData.client.phone +
        ' , ' +
        backgroundData.client.email,
      applicant2: backgroundData.client.address
    },
    applicantsLawyer: {
      lawyer1:
        backgroundData.client.lawyerName +
        ' , ' +
        backgroundData.client.lawyerPhone +
        ' , ' +
        backgroundData.client.lawyerEmail,
      lawyer2: backgroundData.client.lawyerAddress
    },
    respondents: {
      respondent1:
        backgroundData.opposingParty.name +
        ' , ' +
        backgroundData.opposingParty.phone +
        ' , ' +
        backgroundData.opposingParty.email,
      respondent2: backgroundData.opposingParty.address
    },
    respondentsLawyer: {
      lawyer1:
        backgroundData.opposingParty.lawyerName +
        ' , ' +
        backgroundData.opposingParty.lawyerPhone +
        ' , ' +
        backgroundData.opposingParty.lawyerEmail,
      lawyer2: backgroundData.opposingParty.lawyerAddress
    },

    myName: backgroundData.client.name,
    valuationDate: '',

    dateOfSignature: '',
    signature: ''
  }

  useEffect(() => {
    if (!selectBackgroundLoading && !selectCourtLoading) {
      setLoading(false)
      setPdfData(documentData)
    }
    if (selectBackgroundLoading && selectCourtLoading) {
      setLoading(true)
    }
  }, [selectBackgroundLoading, selectCourtLoading])

  return {
    pdfData,
    loading
  }
}

export function Form25A(matterId) {
  const [loading, setLoading] = useState(true)
  const [pdfData, setPdfData] = useState()

  const { selectCourt, selectCourtLoading } = CourtData(matterId)

  const { selectBackground, selectBackgroundLoading } = BackgroundData(matterId)
  // const { selectChildrenData } =
  //   ChildrenData(matterId)
  // const children = selectChildrenData?.body

  const backgroundData = {
    client: selectBackground?.body?.find(data => data.role === 'Client') || {},
    opposingParty:
      selectBackground?.body?.find(data => data.role === 'Opposing Party') || {}
  }

  // const theChildrenData = () => {
  //   let childrenData = []

  //   if (selectChildrenData?.body?.length > 0) {
  //     childrenData = selectChildrenData.body.map(child => ({
  //       fullLegalName: child.childName,
  //       age: calculateAge(child.dateOfBirth),
  //       birthdate: child.dateOfBirth,
  //       muncipilityAndProvince: '', // Add the relevant data if available
  //       nowLivingWith: child.nowLivesWith
  //     }))
  //   } else {
  //     childrenData = [
  //       {
  //         fullLegalName: '',
  //         age: '',
  //         birthdate: '',
  //         muncipilityAndProvince: '', // Add the relevant data if available
  //         nowLivingWith: ''
  //       },
  //       {
  //         fullLegalName: '',
  //         age: '',
  //         birthdate: '',
  //         muncipilityAndProvince: '', // Add the relevant data if available
  //         nowLivingWith: ''
  //       },
  //       {
  //         fullLegalName: '',
  //         age: '',
  //         birthdate: '',
  //         muncipilityAndProvince: '', // Add the relevant data if available
  //         nowLivingWith: ''
  //       }
  //     ]
  //   }
  //   return childrenData
  // }

  const documentData = {
    courtName: selectCourt?.body[0]?.court_name,
    courtFileNumber: selectCourt?.body[0]?.file_number,
    courtOfficeAddress: selectCourt?.body[0]?.address,

    applicants: {
      applicant1:
        backgroundData.client.name +
        ' , ' +
        backgroundData.client.phone +
        ' , ' +
        backgroundData.client.email,
      applicant2: backgroundData.client.address
    },
    applicantsLawyer: {
      lawyer1:
        backgroundData.client.lawyerName +
        ' , ' +
        backgroundData.client.lawyerPhone +
        ' , ' +
        backgroundData.client.lawyerEmail,
      lawyer2: backgroundData.client.lawyerAddress
    },
    respondents: {
      respondent1:
        backgroundData.opposingParty.name +
        ' , ' +
        backgroundData.opposingParty.phone +
        ' , ' +
        backgroundData.opposingParty.email,
      respondent2: backgroundData.opposingParty.address
    },
    respondentsLawyer: {
      lawyer1:
        backgroundData.opposingParty.lawyerName +
        ' , ' +
        backgroundData.opposingParty.lawyerPhone +
        ' , ' +
        backgroundData.opposingParty.lawyerEmail,
      lawyer2: backgroundData.opposingParty.lawyerAddress
    },
    childrensLawyer: {
      lawyer1: '',
      lawyer2: ''
    },

    myName: backgroundData.client.name,
    valuationDate: '',

    dateOfSignature: '',
    signature: ''
  }

  const ApplicantData = [
    { label: 'Full legal name & address for service — street & number, municipality,postal code, telephone & fax numbers and e-mail address (if any).', value: documentData?.applicants.applicant1, type: 'textarea', update: 'applicants.applicant1' },
    { label: '', value: documentData?.applicants.applicant2, type: 'textarea', update: 'applicants.applicant2' },
  ];
  const ApplicantLawyerData = [
    { label: 'Lawyer’s name & address — street & number, municipality, postal code, telephone & fax numbers and e-mail address (if any).', value: documentData?.applicantsLawyer.lawyer1, type: 'textarea', update: 'applicantsLawyer.lawyer1' },
    { label: 'Applicant Lawyer 2:', value: documentData?.applicantsLawyer.lawyer2, type: 'textarea', update: 'applicantsLawyer.lawyer2' },
  ];

  const RespondentData = [
    { label: 'Full legal name & address for service — street & number, municipality,postal code, telephone & fax numbers and e-mail address (if any).', value: documentData?.respondents.respondent1, type: 'textarea', update: 'respondents.respondent1' },
    { label: '', value: documentData?.respondents.respondent2, type: 'textarea', update: 'respondents.respondent2' },
  ];

  const RespondentLawyerData = [
    { label: 'Lawyer’s name & address — street & number, municipality, postal code, telephone & fax numbers and e-mail address (if any).', value: documentData?.respondentsLawyer.lawyer1, type: 'textarea', update: 'respondentsLawyer.lawyer1' },
    { label: 'Address:', value: documentData?.respondentsLawyer.lawyer2, type: 'textarea', update: 'respondentsLawyer.lawyer2' },
  ];

  const ChildrensLawyer = [
    { label: 'Lawyer’s name & address — street & number, municipality, postal code, telephone & fax numbers and e-mail address (if any).', value: documentData?.childrensLawyer.lawyer1, type: 'textarea', update: 'childrensLawyer.lawyer1' },
    { label: 'Address:', value: documentData?.childrensLawyer.lawyer2, type: 'textarea', update: 'childrensLawyer.lawyer2' },
  ];

  useEffect(() => {
    if (!selectBackgroundLoading && !selectCourtLoading) {
      setLoading(false)
      setPdfData(documentData)
    }
    if (selectBackgroundLoading && selectCourtLoading) {
      setLoading(true)
    }
  }, [selectBackgroundLoading, selectCourtLoading])

  return {
    ApplicantData,
    ApplicantLawyerData,
    RespondentData,
    RespondentLawyerData,
    pdfData,
    ChildrensLawyer,
    loading
  }
}


export function OntComponents(matterId) {
  const [loading, setLoading] = useState(true)
  const [pdfData, setPdfData] = useState()

  const { selectCourt, selectCourtLoading } = CourtData(matterId)

  const { selectBackground, selectBackgroundLoading } = BackgroundData(matterId)
  const { selectChildrenData} = ChildrenData(matterId)

  const backgroundData = {
    client: selectBackground?.body?.find(data => data.role === 'Client') || {},
    opposingParty:
      selectBackground?.body?.find(data => data.role === 'Opposing Party') || {}
  }

  const theChildrenData = () => {
    let childrenData = []

    if (selectChildrenData?.body?.length > 0) {
      childrenData = selectChildrenData.body.map(child => ({
        fullLegalName: child.childName,
        age: calculateAge(child.dateOfBirth),
        birthdate: child.dateOfBirth,
        muncipilityAndProvince: '', // Add the relevant data if available
        nowLivingWith: child.nowLivesWith
      }))
    } else {
      childrenData = [
        {
          fullLegalName: '',
          age: '',
          birthdate: '',
          muncipilityAndProvince: '', // Add the relevant data if available
          nowLivingWith: ''
        },
        {
          fullLegalName: '',
          age: '',
          birthdate: '',
          muncipilityAndProvince: '', // Add the relevant data if available
          nowLivingWith: ''
        },
        {
          fullLegalName: '',
          age: '',
          birthdate: '',
          muncipilityAndProvince: '', // Add the relevant data if available
          nowLivingWith: ''
        }
      ]
    }
    return childrenData
  }

  const documentData = {
    courtName: selectCourt?.body[0]?.court_name || '',
    courtFileNumber: selectCourt?.body[0]?.file_number || '',
    courtOfficeAddress: selectCourt?.body[0]?.address || '',
    applicationType: '',
    applicants: {
      applicant1:
        backgroundData.client.name +
        ' , ' +
        backgroundData.client.phone +
        ' , ' +
        backgroundData.client.email,
      applicant2: backgroundData.client.address
    },
    applicantLawyer: {
      lawyer1:
        backgroundData.client.lawyerName +
        ' , ' +
        backgroundData.client.lawyerPhone +
        ' , ' +
        backgroundData.client.lawyerEmail,
      lawyer2: backgroundData.client.lawyerAddress
    },
    respondents: {
      respondent1:
        backgroundData.opposingParty.name +
        ' , ' +
        backgroundData.opposingParty.phone +
        ' , ' +
        backgroundData.opposingParty.email,
      respondent2: backgroundData.opposingParty.address
    },
    respondentLawyer: {
      lawyer1:
        backgroundData.opposingParty.lawyerName +
        ' , ' +
        backgroundData.opposingParty.lawyerPhone +
        ' , ' +
        backgroundData.opposingParty.lawyerEmail,
      lawyer2: backgroundData.opposingParty.lawyerAddress
    },
    applicant: {
      fullLegalName: backgroundData.client.name || '',
      address: backgroundData.client.address || '',
      phoneAndFax: backgroundData.client.phone || '',
      email: backgroundData.client.email || ''
    },
    applicantsLawyer: {
      fullLegalName: backgroundData.client.lawyerName || '',
      address: backgroundData.client.lawyerAddress || '',
      phoneAndFax: backgroundData.client.lawyerPhone || '',
      email: backgroundData.client.lawyerEmail || ''
    },
    respondent: {
      fullLegalName: backgroundData.opposingParty.name || '',
      address: backgroundData.opposingParty.name || '',
      phoneAndFax: backgroundData.opposingParty.phone || '',
      email: backgroundData.opposingParty.email || '',
    },
    respondentsLawyer: {
      fullLegalName: backgroundData.opposingParty.lawyerName || '',
      address: backgroundData.opposingParty.lawyerAddress || '',
      phoneAndFax: backgroundData.opposingParty.lawyerPhone || '',
      email: backgroundData.opposingParty.lawyerEmail || ''
    },
    assignee: {
      fullLegalName: '',
      address: '',
      phoneAndFax: '',
      email: ''
    },
    assigneeLawyer: {
      fullLegalName: '',
      address: '',
      phoneAndFax: '',
      email: ''
    },
    childrensLawyer: {
      lawyer1: '',
      lawyer2: ''
    },
    familyHistory: {
      theChildren: theChildrenData()
    }
  }

  useEffect(() => {
    if (!selectBackgroundLoading && !selectCourtLoading) {
      setLoading(false)
      setPdfData(documentData)
    }
    if (selectBackgroundLoading && selectCourtLoading) {
      setLoading(true)
    }
  }, [selectBackgroundLoading, selectCourtLoading])



  return {
    pdfData,
    loading
  }
}


export function FormInformation(matterId) {
  
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [documentInfo, setPdfData] = useState(null);
  const [matterInfo, setMatterInfo] = useState(null);
  const [matterData, setMatterData] = useState(null);


  useEffect(() => {
    dispatch(getMatterData(matterId));
    dispatch(getSingleMatter(matterId))
  }, [dispatch, matterId]);

  const selectSingleMatter = useSelector(selectSingleMatterData);
  
  const singleMatterLoading = useSelector(selectSingleMatterLoading);

  const selectAllData = useSelector(selectMatterData);
  const selectAllDataLoading = useSelector(selectMatterDataLoading);

  useEffect(() => {
    if (selectAllData) {
      setMatterInfo(selectAllData.body);
    } 

    if(selectSingleMatter){
      setMatterData(selectSingleMatter.body[0])
    }
  }, [selectAllData, selectSingleMatter]);

  const backgroundData = {
    client: matterInfo?.background?.find(data => data.role === 'Client') || {},
    opposingParty: matterInfo?.background?.find(data => data.role === 'Opposing Party') || {}
  };

  const courtInfo = {
    courtName: matterInfo?.court_info[0]?.court_name,
    courtFileNumber: matterInfo?.court_info[0]?.file_number,
    courtOfficeAddress: matterInfo?.court_info[0]?.address,
  }

  const { childrenData } = TheChildren(matterInfo?.children)

  const { ExpenseDetailsClient, ExpenseDetailsOpposingParty, clientSpecialExpenses, opposingPartySpecialExpenses } = ExpenseInfo(matterInfo?.expenses)



  const { assetDetailsArray } = AssetsInfo(
    matterInfo?.assets,
    matterId,
    selectSingleMatter
    
  )

  // incomeBenefit
  const incomeBenefit = {
    client: {
      income:
        matterInfo?.income_benefits.filter(
          data => data.role === 'Client' && data.incomeBenefit === 'income'
        ) || [],
      benefit:
        matterInfo?.income_benefits.filter(
          data => data.role === 'Client' && data.incomeBenefit === 'benefit'
        ) || []
    },
    opposingParty: {
      income:
        matterInfo?.income_benefits.filter(
          data =>
            data.role === 'opposingParty' && data.incomeBenefit === 'income'
        ) || [],
      benefit:
        matterInfo?.income_benefits.filter(
          data =>
            data.role === 'opposingParty' && data.incomeBenefit === 'benefit'
        ) || []
    }
  }

  const clientIncome = incomeBenefit.client.income
  const opposingPartyIncome = incomeBenefit.opposingParty.income

  const clientBenefits = incomeBenefit.client.benefit
  const opposingPartyBenefits = incomeBenefit.opposingParty.benefit

  const incomeSources = () => {
    // Initialize an object to store the totals
    const clientTotals = {}

    const opposingPartyTotals = {}

    // Calculate totals for each type of income
    clientIncome.forEach(item => {
      if (!clientTotals[item.type]) {
        clientTotals[item.type] = 0
      }
      clientTotals[item.type] += parseInt(item.monthlyAmount)
    })

    // Calculate totals for each type of income
    opposingPartyIncome.forEach(item => {
      if (!opposingPartyTotals[item.type]) {
        opposingPartyTotals[item.type] = 0
      }
      opposingPartyTotals[item.type] += parseInt(item.monthlyAmount)
    })

    // Log the totals
    const clientSources = {
      employmentIncome: clientTotals['Employment income (before deductions)'] || '',
      commissionTipsBonuses: clientTotals['Commissions, tips and bonuses'] || '',
      selfEmploymentIncome: clientTotals['Self-employment income'] || '',
      employmentInsuranceBenefits: clientTotals['Employment insurance benefits'] || '',
      workersCompensationBenefits: clientTotals["Workers' compensation benefits"] || '',
      socialAssistanceIncome: clientTotals['Social assistance income (including ODSP payments)'] || '',
      interestInvestmentIncome: clientTotals['Interest and investment income'] || '',
      pensionIncome: clientTotals['Pension income (including CPP and OAS)'] || '',
      spousalSupport: clientTotals['Spousal support received from a former spouse/partner'] || '',
      childTaxBenefits: clientTotals['Child tax benefits'] || '',
      otherIncome: clientTotals['Other sources of income'] || '',
      // totalMonthlyIncome: '', // Total monthly income (sum of all above incomes)
      // totalAnnualIncome: '' // Total annual income (multiply total monthly income by 12)
    }

    const opposingPartySources = {
      employmentIncome: opposingPartyTotals['Employment income (before deductions)'] || '',
      commissionTipsBonuses: opposingPartyTotals['Commissions, tips and bonuses'] || '',
      selfEmploymentIncome: opposingPartyTotals['Self-employment income'] || '',
      employmentInsuranceBenefits: opposingPartyTotals['Employment insurance benefits'] || '',
      workersCompensationBenefits: opposingPartyTotals["Workers' compensation benefits"] || '',
      socialAssistanceIncome: opposingPartyTotals['Social assistance income (including ODSP payments)'] || '',
      interestInvestmentIncome: opposingPartyTotals['Interest and investment income'] || '',
      pensionIncome: opposingPartyTotals['Pension income (including CPP and OAS)'] || '',
      spousalSupport: opposingPartyTotals['Spousal support received from a former spouse/partner'] || '',
      childTaxBenefits: opposingPartyTotals['Child tax benefits'] || '',
      otherIncome: opposingPartyTotals['Other sources of income'] || '',
      // totalMonthlyIncome: '', // Total monthly income (sum of all above incomes)
      // totalAnnualIncome: '' // Total annual income (multiply total monthly income by 12)
    }

    return { client: clientSources, opposingParty: opposingPartySources }
  }

  const benefitsSources = () => {
    // Initialize an object to store the totals
    const clientTotals = {}

    const opposingPartyTotals = {}

    // Calculate totals for each type of income
    clientBenefits.forEach(item => {
      if (!clientTotals[item.type]) {
        clientTotals[item.type] = 0
      }
      clientTotals[item.type] += parseInt(item.monthlyAmount)
    })

    // Calculate totals for each type of income
    opposingPartyBenefits.forEach(item => {
      if (!opposingPartyTotals[item.type]) {
        opposingPartyTotals[item.type] = 0
      }
      opposingPartyTotals[item.type] += parseInt(item.monthlyAmount)
    })

    // Log the totals
    const clientBenefitSources = {
      medicalInsuranceCover: clientTotals['Medical Insurance Coverage'] || '',
      companyCar: clientTotals['Use of Company Car'] || '',
      useOfRoom: clientTotals['Use of Room'] || '',
      otherBenefit: clientTotals['Other'] || '',
    }

    const opposingPartyBenefitSources = {
      medicalInsuranceCover: opposingPartyTotals['Medical Insurance Coverage'] || '',
      companyCar: opposingPartyTotals['Use of Company Car'] || '',
      useOfRoom: opposingPartyTotals['Use of Room'] || '',
      otherBenefit: opposingPartyTotals['Other'] || '',

    }

    return { client: clientBenefitSources, opposingParty: opposingPartyBenefitSources }
  }

  const source = incomeSources()

  const benefitSource = benefitsSources()

  const { employmentInfo } = EmploymentStatus(matterInfo?.employment)

  const filledBy = 'client'

  const documentData = {
    matter_data: {
      financial_year_expenses: matterData?.financial_year_expenses,
      financial_year_income_benefits:  matterData?.financial_year_income_benefits,
      valuation_date:  matterData?.valuation_date,
      matter_id: matterData?.matterNumber,
    },
    court_info: courtInfo,
    applicant: {
      fullLegalName: backgroundData.client.name || '',
      address: backgroundData.client.address || '',
      phoneAndFax: backgroundData.client.phone || '',
      email: backgroundData.client.email || '',
      province: backgroundData.client.province || '',
      municipality: backgroundData.client.municipality || '',
      dateOfBirth: backgroundData.client.dateOfBirth || ''
    },
    applicantsLawyer: {
      fullLegalName: backgroundData.client.lawyerName || '',
      address: backgroundData.client.lawyerAddress || '',
      phoneAndFax: backgroundData.client.lawyerPhone || '',
      email: backgroundData.client.lawyerEmail || '',

    },
    respondent: {
      fullLegalName: backgroundData.opposingParty.name || '',
      address: backgroundData.opposingParty.address || '',
      phoneAndFax: backgroundData.opposingParty.phone || '',
      email: backgroundData.opposingParty.email || '',
      province: backgroundData.opposingParty.province || '',
      municipality: backgroundData.opposingParty.municipality || '',
      dateOfBirth: backgroundData.opposingParty.dateOfBirth || ''
    },
    respondentsLawyer: {
      fullLegalName: backgroundData.opposingParty.lawyerName || '',
      address: backgroundData.opposingParty.lawyerAddress || '',
      phoneAndFax: backgroundData.opposingParty.lawyerPhone || '',
      email: backgroundData.opposingParty.lawyerEmail || ''
    },
    theChildren: childrenData,
    expenses: {
      client: {},
      opposingParty: {}
    },
    specialExpenses: {
      client: {},
      opposingParty: {}
    },
    applicationType: {},
    assets: {},
    debts: {},
    income: source,
    benefits: benefitSource,
    relationshipDates: {
      marriedOn: {
        checked: matterInfo?.relationship[0]?.dateOfMarriage
          ? true
          : false || '',
        date: matterInfo?.relationship[0]?.dateOfMarriage || ''
      },
      startedLivingTogetherOn: {
        checked: matterInfo?.relationship[0]?.startedLivingTogether
          ? true
          : false || '',
        date: matterInfo?.relationship[0]?.startedLivingTogether || ''
      },
      separatedOn: {
        checked: matterInfo?.relationship[0]?.dateOfSeparation
          ? true
          : false || '',
        date: matterInfo?.relationship[0]?.dateOfSeparation || ''
      },
      isNeverLivedTogether: {
        checked:
          matterInfo?.relationship[0]?.neverLivedTogether === 'No'
            ? true
            : false || ''
      },
      placeOfMarriage: matterInfo?.relationship[0]?.placeOfMarriage || ''
    },
    filledBy: filledBy,

    filler: {
      fullLegalName: backgroundData.client.name || '',
      province: backgroundData.client.province || ''
    },
    employmentStatus: employmentInfo,
    otherIncomeEarners: {
      liveAlone: false,
      isLivingWith: false,
      livingWith: '',
      isAdults: false,
      adults: '',
      isChildren: childrenData ? true : false,
      children: childrenData?.length,
      partner: {
        isWorks: '',
        worksAt: '',
        isEarns: 'no',
        earns: '',
        earnsPer: 'year',
        contributions: '',
        contributionsPer: ''
      }
    },
  };

  documentData.expenses.client = ExpenseDetailsClient.expenses
  documentData.expenses.opposingParty = ExpenseDetailsOpposingParty.expenses

  documentData.specialExpenses.client = Array.isArray(clientSpecialExpenses) ? clientSpecialExpenses?.map(item => ({
    name: item.childName,
    expenses: item.type,
    amount: item.amount,
    tax: item.taxCredits,
  })) : [];

  documentData.specialExpenses.opposingParty = Array.isArray(opposingPartySpecialExpenses) ? opposingPartySpecialExpenses?.map(item => ({
    name: item.childName,
    expenses: item.type,
    amount: item.amount,
    tax: item.taxCredits,
  })) : [];

  documentData.assets = assetDetailsArray?.assets


  let groupedData = {}
  let totalValue = 0

  if (matterInfo?.debts_liabilities) {
    groupedData = matterInfo?.debts_liabilities.reduce((acc, obj) => {
      const category = obj.category.toLowerCase().replace(/\s+/g, '')
      if (!acc[category]) {
        acc[category] = []
      }

      acc[category].push(obj)

      return acc
    }, {})

    totalValue = Object.values(groupedData).reduce((total, items) => {
      return (
        total +
        items.reduce((sum, item) => {
          return (
            sum +
            parseInt(item.on_date_of_marriage) +
            parseInt(item.on_valuation_date) +
            parseInt(item.today)
          )
        }, 0)
      )
    }, 0)
  }

  // Now you can set totalValue on groupedData
  groupedData.totalValue = totalValue

  documentData.debts = groupedData

  useEffect(() => {
    if (!singleMatterLoading && !selectAllDataLoading) {
      setLoading(false);
      setPdfData(documentData);
    } else {
      setLoading(true);
    }
  }, [matterInfo,matterData]); // Removed documentData from dependencies

  return {
    documentInfo,
    loading
  };
}

