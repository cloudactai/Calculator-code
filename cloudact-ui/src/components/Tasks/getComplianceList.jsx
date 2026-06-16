
const getBritishColumbiaList = [
    {
        province: "BC",
        label: "Electronic Transfer of Trust Funds",
        multiple: true,
        maxSelection: 100,
        multiplefile: true,
        MatterDropdown: true,
        ReasonofPayment: true,
        dateRange: true,
        trustAccount: true
    },

    {
        province: "BC",
        label: "Withdrawal from Trust by Bank Draft",
        multiple: true,
        maxSelection: 1,
        multiplefile: true,
        MatterDropdown: true,
        ReasonofPayment: false,
        dateRange: false,
        trustAccount: true
    },
    {
        province: "BC",
        label: "Payment of Unclaimed Trust Money to the Law Society",
        multiple: true,
        maxSelection: 100,
        multiplefile: true,
        MatterDropdown: true,
        ReasonofPayment: false,
        dateRange: false,
        trustAccount: true
    },
    {
        label: "Confirmation of Law Foundation of BC Interest Remittance",
        province: "BC",
        multiple: false,
        maxSelection: 0,
        multiplefile: true,
        MatterDropdown: false,
        ReasonofPayment: false,
        dateRange: false,
        trustAccount: true
    },
    {
        province: "BC",
        label: "Insolvent Lawyer – Schedule 3",
        multiple: false,
        maxSelection: 0,
        multiplefile: true,
        MatterDropdown: false,
        ReasonofPayment: false,
        dateRange: false,
        trustAccount: true
    },
    {
        province: "BC",
        label: "Letter - New Trust Account",
        multiple: false,
        maxSelection: 0,
        multiplefile: true,
        MatterDropdown: false,
        ReasonofPayment: false,
        dateRange: false,
        trustAccount: true
    }
]
const getAlbertaList =
    [
        {
            province: "AB",
            label: "Electronic Banking Withdrawal",
            multiple: true,
            maxSelection: 100,
            multiplefile: true,
            MatterDropdown: true,
            ReasonofPayment: true,
            dateRange: true,
            trustAccount: true
        },
        {
            province: "AB",
            label: "Bank Drafts and Money Orders",
            multiple: true,
            maxSelection: 1,
            multiplefile: true,
            MatterDropdown: true,
            ReasonofPayment: false,
            dateRange: false,
            trustAccount: true
        },
        {
            province: "AB",
            label: "Matter to Matter Trust transfers",
            multiple: true,
            maxSelection: 100,
            multiplefile: true,
            MatterDropdown: true,
            ReasonofPayment: false,
            dateRange: false,
            trustAccount: true
        },
        {
            province: "AB",
            label:
                "Trust Account and Client Ledger Shortages",
            multiple: true,
            maxSelection: 1,
            multiplefile: false,
            MatterDropdown: true,


            ReasonofPayment: false, dateRange: false,
            trustAccount: true
        },
        {
            province: "AB",
            label: "Undisbursable Trust Money – Long Form",
            multiple: true,
            maxSelection: 1,
            multiplefile: false,
            MatterDropdown: true,


            ReasonofPayment: false, dateRange: false,
            trustAccount: true
        },
        {
            province: "AB",
            label: "Undisbursable Trust Money – Short Form",
            multiple: true,
            maxSelection: 10,
            multiplefile: true,
            MatterDropdown: true,


            ReasonofPayment: false, dateRange: false,
            trustAccount: true
        },
        {
            province: "AB",
            label: "Claim to Trust Money",
            multiple: true,
            maxSelection: 1,
            multiplefile: true,
            MatterDropdown: true,


            ReasonofPayment: false, dateRange: false,
            trustAccount: true
        },
        {
            label: "Financial Institution Authorization Release Form",
            province: "AB",
            multiple: false,
            maxSelection: 0,
            multiplefile: false,
            MatterDropdown: false,


            ReasonofPayment: false, dateRange: false,
            trustAccount: true
        },
        {
            province: "AB",
            label: "Representative Capacity Undertaking",
            multiple: true,
            maxSelection: 100,
            multiplefile: true,
            MatterDropdown: true,


            ReasonofPayment: false, dateRange: false,
            trustAccount: true
        },
        {
            province: "AB",
            label: "Letter of direction - bank interest on trust  account",
            multiple: true,
            maxSelection: 1,
            multiplefile: false,
            MatterDropdown: false,
            ReasonofPayment: false, 
            dateRange: false,
            trustAccount: true
        }


    ]

const getOntarioList =
    [
        {
            label: "Form 9A - Electronic Trust Transfer Requisition",
            province: "ON",
            multiple: true,
            maxSelection: 100,
            multiplefile: true,
            MatterDropdown: true,
            ReasonofPayment: true, 
            dateRange: true,
            trustAccount: true

        },
        {
            province: "ON",
            label: "Form 9B - Authorization of Withdrawal By Teranet",
            multiple: true,
            maxSelection: 100,
            multiplefile: true,
            MatterDropdown: true,
            ReasonofPayment: false, 
            dateRange: false,
            trustAccount: true

        },
        {
            province: "ON",
            label: "Form 9C - Electronic Trust Transfer Requisition: Closing Funds",
            multiple: true,
            maxSelection: 100,
            multiplefile: true,
            MatterDropdown: true,
            ReasonofPayment: false,
            dateRange: false,
            trustAccount: true
        },
        {
            province: "ON",
            label: "Form 9D - Investment Authority",
            multiple: true,
            maxSelection: 100,
            multiplefile: true,
            MatterDropdown: false,
            ReasonofPayment: false, 
            dateRange: false,
            trustAccount: false
        },
        {
            province: "ON",
            label: "Form 9E - Report on the Investment",
            multiple: true,
            maxSelection: 100,
            multiplefile: true,
            MatterDropdown: false,
            ReasonofPayment: false,
            dateRange: false,
            trustAccount: false
        },

    ]

export { getBritishColumbiaList, getAlbertaList, getOntarioList }



