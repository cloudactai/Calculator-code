const singleMatter = {
    "code": 200,
    "status": "success",
    "body": [
        {
            "id": 1,
            "client_id": "Allek Pottas",
            "matterNumber": 2114491207,
            "clientRole": "Client",
            "childrenInvolved": "Yes",
            "province": "Ontario",
            "checkedItems": "[\"divorce\", \"children_implications\"]",
            "sid": 21,
            "information_completed": 0,
            "status": 0,
            "source": "Internal",
            "created": "2024-03-10T15:23:15.000Z"
        }
    ]
};

const backgroundData = {
        "code": 200,
        "status": "success",
        "body": [
            {
                "id": 1,
                "sid": 21,
                "matter_id": 2114491207,
                "name": "Allek",
                "role": "Client",
                "province": "ON",
                "phone": "0844050611",
                "address": "8 Fourth Street",
                "email": "operations@matadordigital.co.za",
                "municipality": "ON",
                "representedBy": "Lawyer",
                "lawyerName": "Nick Jonas",
                "lawyerPostalCode": "12345",
                "lawyerAddress": "Nick Jonas",
                "lawyerPhone": "Nick Jonas",
                "lawyerEmail": "Nick Jonas",
                "lawyerProvince": "Nick Jonas",
                "lawyerMunicipality": "Nick Jonas",
                "dateOfBirth": "1987-03-04",
                "created": "2024-03-12T19:39:39.000Z",
                "postalCode": "123"
            },
            {
                "id": 2,
                "sid": 21,
                "matter_id": 2114491207,
                "name": "Allek",
                "role": "Opposing Party",
                "province": "ON",
                "phone": "0844050611",
                "address": "8 Fourth Street",
                "email": "operations@matadordigital.co.za",
                "municipality": "ON",
                "representedBy": "Lawyer",
                "lawyerName": "Nick Jonas",
                "lawyerPostalCode": "12345",
                "lawyerAddress": "Nick Jonas",
                "lawyerPhone": "Nick Jonas",
                "lawyerEmail": "Nick Jonas",
                "lawyerProvince": "Nick Jonas",
                "lawyerMunicipality": "Nick Jonas",
                "dateOfBirth": "1987-03-04",
                "created": "2024-03-12T19:39:39.000Z",
                "postalCode": "123"
            }
        ]
};

const courtData = {
    "code": 200,
    "status": "success",
    "body": [
        {
            "id": 1,
            "matter_id": 2114491207,
            "sid": 21,
            "created": "2024-03-10T15:20:35.000Z",
            "court_name": "Ahsan Ali Khan",
            "file_number": "12345",
            "address": "8 Fourth Street"
        }
    ]
};

const childData = {
    "code": 200,
    "status": "success",
    "body": [
        {
            "id": 1,
            "sid": 21,
            "matter_id": 2114491207,
            "childName": "Gert Pottas",
            "nowLivesWith": "Mother",
            "dateOfBirth": "2024-03-10",
            "age": "12",
            "representedByLawyer": "No",
            "lawyerName": "",
            "lawyerPhone": "",
            "lawyerAddress": "",
            "lawyerEmail": "",
            "created": "2024-03-10T15:20:35.000Z"
        },
        {
            "id": 2,
            "sid": 21,
            "matter_id": 2114491207,
            "childName": "Anton Pottas",
            "nowLivesWith": "Father",
            "dateOfBirth": "2024-03-10",
            "age": "16",
            "representedByLawyer": "No",
            "lawyerName": "",
            "lawyerPhone": "",
            "lawyerAddress": "",
            "lawyerEmail": "",
            "created": "2024-03-10T15:20:35.000Z"
        }
    ]
};

const employmentData = {
    "code": 200,
    "status": "success",
    "body": [
        {
            "id": 1,
            "sid": 21,
            "matter_id": 2114491207,
            "employmentStatus": "employed",
            "employerName": "Cloud Act",
            "employerAddress": "8 Fourth Street",
            "employedSince": "2024-03-10",
            "businessName": "",
            "businessAddress": "",
            "lastEmployed": "",
            "created": "2024-03-10T15:20:35.000Z",
            "role": "Client"
        },
        {
            "id": 2,
            "sid": 21,
            "matter_id": 2114491207,
            "employmentStatus": "self_employed",
            "employerName": "",
            "employerAddress": "",
            "employedSince": "",
            "businessName": "Matador Digital (PTY) LTD",
            "businessAddress": "30 Saddle Rock, Strerrietjie Street, Wilgeheuwel",
            "lastEmployed": "",
            "created": "2024-03-10T15:20:35.000Z",
            "role": "Opposing Party"
        }
    ]
};

const debtsData = {
    "code": 200,
    "status": "success",
    "body": [
        {
            "id": 1,
            "sid": 21,
            "matter_id": 2114491207,
            "category": "Loan",
            "details": "bank Loan",
            "on_date_of_marriage": "1234500",
            "on_valuation_date": "1234500",
            "today": "1234500",
            "created": "2024-03-10T15:20:36.000Z"
        }
    ]
};

const foldersData = {
    "code": 200,
    "status": "success",
    "body": [
        {
            "id": 1,
            "title": "Test Folder From API",
            "matter_id": 2114491207,
            "sid": 21,
            "type": "Folder",
            "created": "2024-03-10T17:37:54.000Z",
            "updated": "2024-03-10T21:29:02.000Z"
        },
        {
            "id": 1,
            "title": "Test Folder",
            "matter_id": 2114491207,
            "sid": 21,
            "type": "Folder",
            "created": "2024-03-10T17:37:54.000Z",
            "updated": "2024-03-10T21:29:02.000Z"
        }
    ]
};

const specialExpenses = {
    "code": 200,
    "status": "success",
    "body": [
        {
            "id": 1,
            "sid": 21,
            "matter_id": 2114491207,
            "childName": "Gert Pottas",
            "amount": "100",
            "type": "Household",
            "taxCredits": "3232",
            "role": "Client",
            "expenseType": "specialChildExpenses",
            "financialYear": "2024-03-10",
            "created": "2024-03-10T15:20:35.000Z"
        },
        {
            "id": 2,
            "sid": 21,
            "matter_id": 2114491207,
            "childName": "Gert Pottas",
            "amount": "150",
            "type": "Household",
            "taxCredits": "3232",
            "role": "Opposing Party",
            "expenseType": "specialChildExpenses",
            "financialYear": "2024-03-10",
            "created": "2024-03-10T15:20:35.000Z"
        },
        {
            "id": 3,
            "sid": 21,
            "matter_id": 2114491207,
            "childName": "Anton Pottas",
            "amount": "50",
            "type": "Household",
            "taxCredits": "3232",
            "role": "Opposing Party",
            "expenseType": "specialChildExpenses",
            "financialYear": "2024-03-10",
            "created": "2024-03-10T15:20:35.000Z"
        }
    ]
};

const relationshipData = {
    "code": 200,
    "status": "success",
    "body": [
        {
            "id": 1,
            "sid": 21,
            "matter_id": 2114491207,
            "dateOfMarriage": "2024-03-10",
            "placeOfMarriage": "Boksburg North",
            "startedLivingTogether": "2024-03-10",
            "neverLivedTogether": "No",
            "dateOfSeparation": "2024-03-10",
            "stillLivingTogether": 0,
            "created": "0000-00-00 00:00:00"
        }
    ]
};

const otherPersons = {
    "code": 200,
    "status": "success",
    "body": [
        {
            "id": 1,
            "sid": 21,
            "matter_id": 2114491207,
            "live_alone": "yes",
            "name_of_person_married_to": "",
            "name_of_other_adults": "",
            "number_of_children": "",
            "spouse_partner_work_status": "",
            "amount_spouse_partner_earns": "",
            "created": "2024-03-10T15:20:36.000Z"
        }
    ]
};

const incomeBenefitsdata = {
    "code": 200,
    "status": "success",
    "body": [
        {
            "id": 1,
            "sid": 21,
            "matter_id": 2114491207,
            "type": "Salary",
            "monthlyAmount": "650",
            "yearlyAmount": "78000",
            "role": "Client",
            "incomeBenefit": "income",
            "financialYear": "2024-03-10",
            "created": "2024-03-10T15:20:35.000Z"
        },
        {
            "id": 2,
            "sid": 21,
            "matter_id": 2114491207,
            "type": "Wages",
            "monthlyAmount": "1230",
            "yearlyAmount": "12230",
            "role": "Client",
            "incomeBenefit": "benefit",
            "financialYear": "2024-03-10",
            "created": "2024-03-10T15:20:35.000Z"
        },
        {
            "id": 3,
            "sid": 21,
            "matter_id": 2114491207,
            "type": "Wages",
            "monthlyAmount": "5000",
            "yearlyAmount": "50000",
            "role": "Opposing Party",
            "incomeBenefit": "income",
            "financialYear": "2024-03-10",
            "created": "2024-03-10T15:20:35.000Z"
        },
        {
            "id": 4,
            "sid": 21,
            "matter_id": 2114491207,
            "type": "Centrelink",
            "monthlyAmount": "340",
            "yearlyAmount": "34000",
            "role": "Opposing Party",
            "incomeBenefit": "benefit",
            "financialYear": "2024-03-10",
            "created": "2024-03-10T15:20:35.000Z"
        }
    ]
};

const landsData = {
    "code": 200,
    "status": "success",
    "body": [
        {
            "id": 1,
            "sid": 21,
            "matter_id": 2114491207,
            "nature_and_type_of_ownership": "Owned",
            "address_of_property": "30 Saddle Rock, Strerrietjie Street, Wilgeheuwel",
            "property_status": "excluded_property",
            "asset_type": "lands",
            "created": "0000-00-00 00:00:00"
        },
        {
            "id": 2,
            "sid": 21,
            "matter_id": 2114491207,
            "nature_and_type_of_ownership": "Owned",
            "address_of_property": "Lavender Grove Complex, Gooseberry Street, Honeydew Grove",
            "property_status": "disposed_property",
            "asset_type": "lands",
            "created": "0000-00-00 00:00:00"
        }
    ]
};

const landsMarketValueData = {
    "code": 200,
    "status": "success",
    "body": [
        {
            "id": 1,
            "sid": 21,
            "matter_id": 2114491207,
            "asset_id": 1,
            "on_date_of_marriage": "1234500",
            "on_valuation_date": "1234500",
            "today": "1234500",
            "role": "Client",
            "asset_type": "lands",
            "created": "2024-03-10T15:20:36.000Z"
        },
        {
            "id": 2,
            "sid": 21,
            "matter_id": 2114491207,
            "asset_id": 1,
            "on_date_of_marriage": "1234500",
            "on_valuation_date": "1234500",
            "today": "1234500",
            "role": "Opposing Party",
            "asset_type": "lands",
            "created": "2024-03-10T15:20:36.000Z"
        },
        {
            "id": 3,
            "sid": 21,
            "matter_id": 2114491207,
            "asset_id": 2,
            "on_date_of_marriage": "1234500",
            "on_valuation_date": "1234500",
            "today": "1234500",
            "role": "Client",
            "asset_type": "lands",
            "created": "2024-03-10T15:20:36.000Z"
        },
        {
            "id": 4,
            "sid": 21,
            "matter_id": 2114491207,
            "asset_id": 2,
            "on_date_of_marriage": "1234500",
            "on_valuation_date": "1234500",
            "today": "1234500",
            "role": "Opposing Party",
            "asset_type": "lands",
            "created": "2024-03-10T15:20:36.000Z"
        }
    ]
}

const clientBackground = {
    role: 'Client',
    province: 'Ontario',
    name: 'John Smith',
    postalCode: 'M5V 2T6',
    dateOfBirth: '1990-01-01',
    phone: '416-555-0123',
    address: '123 Main Street',
    email: 'john.smith@email.com',
    municipality: 'Toronto',
    representedBy: 'Self',
  
    // Lawyer fields (empty since representedBy is 'Self')
    lawyerPostalCode: '',
    lawyerName: '',
    lawyerAddress: '',
    lawyerEmail: '',
    lawyerPhone: '',
    lawyerProvince: '',
    lawyerMunicipality: ''
  }

  const opposingPartyBackground = {
    role: 'Opposing Party',
    province: 'Ontario',
    name: 'Jane Doe',
    postalCode: 'M4K 1N2',
    dateOfBirth: '1985-06-15',
    phone: '416-555-0456',
    address: '456 Queen Street',
    email: 'jane.doe@email.com',
    municipality: 'Toronto',
    representedBy: 'Self',
  
    // Lawyer fields (empty since representedBy is 'Self')
    lawyerPostalCode: '',
    lawyerName: '',
    lawyerAddress: '',
    lawyerEmail: '',
    lawyerPhone: '',
    lawyerProvince: '',
    lawyerMunicipality: ''
  }

export {
    backgroundData,
    singleMatter,
    courtData,
    childData,
    employmentData,
    debtsData,
    foldersData,
    specialExpenses,
    relationshipData,
    otherPersons,
    incomeBenefitsdata,
    landsData,
    landsMarketValueData,
    opposingPartyBackground,
    clientBackground
};
  