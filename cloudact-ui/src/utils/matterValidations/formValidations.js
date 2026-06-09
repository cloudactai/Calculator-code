// FormValidation.js

export const validateForm = (formData) => {


    const errors = {};

    let isValid = true;

    // Validate client information
    if (!formData.Background) {
        isValid = false;
    }

    if (!formData.Court) {
        isValid = false;
    }

    if (!formData.Relationship) {
        isValid = false;
    }

    if (formData?.Background?.client) {
        const { role, province, name, postalCode, phone, address, email, } = formData?.Background?.client;
        if (!name) {
            errors.client = { ...errors.client, name: 'Client name is required' };
            isValid = false;
        }
        if (!province) {
            errors.client = { ...errors.client, province: 'Province is required' };
            isValid = false;
        }
        if (!role) {
            errors.client = { ...errors.client, role: 'Role is required' };
            isValid = false;
        }
        if (!postalCode) {
            errors.client = { ...errors.client, postalCode: 'Postal Code is required' };
            isValid = false;
        }
        if (!phone) {
            errors.client = { ...errors.client, phone: 'Phone number is required' };
            isValid = false;
        }
        if (!address) {
            errors.client = { ...errors.client, address: 'Address is required' };
            isValid = false;
        }
        if (!email) {
            errors.client = { ...errors.client, email: 'Email is required' };
            isValid = false;
        }

    }

    if (formData?.Background?.opposingParty) {
        const { role, province, name, postalCode, phone, address, email, } = formData?.Background?.opposingParty;
        if (!name) {
            errors.opposingParty = { ...errors.opposingParty, name: 'Opposing Party name is required' };
            isValid = false;
        }
        if (!province) {
            errors.opposingParty = { ...errors.opposingParty, province: 'Province is required' };
            isValid = false;
        }
        if (!role) {
            errors.opposingParty = { ...errors.opposingParty, role: 'Role is required' };
            isValid = false;
        }
        if (!postalCode) {
            errors.opposingParty = { ...errors.opposingParty, postalCode: 'Postal Code is required' };
            isValid = false;
        }
        if (!phone) {
            errors.opposingParty = { ...errors.opposingParty, phone: 'Phone number is required' };
            isValid = false;
        }
        if (!address) {
            errors.opposingParty = { ...errors.opposingParty, address: 'Address is required' };
            isValid = false;
        }
        if (!email) {
            errors.opposingParty = { ...errors.opposingParty, email: 'Email is required' };
            isValid = false;
        }

    }

    if (formData?.Court) {
        const { name, fileNumber, address} = formData?.Court;
        if (!name) {
            errors.court_info = { ...errors.court_info, name: 'Court name is required' };
            isValid = false;
        }
        if (!fileNumber) {
            errors.court_info = { ...errors.court_info, fileNumber: 'File Number is required' };
            isValid = false;
        }
        if (!address) {
            errors.court_info = { ...errors.court_info, address: 'Address is required' };
            isValid = false;
        }
    }

    if (formData?.Relationship) {
        const { dateOfMarriage,startedLivingTogether} = formData?.Relationship;
        if (!dateOfMarriage) {
            errors.relationship = { ...errors.relationship, dateOfMarriage: 'Date of Marriage is required' };
            isValid = false;
        }
        if (!startedLivingTogether) {
            errors.relationship = { ...errors.relationship, startedLivingTogether: 'Started Living Together is required' };
            isValid = false;
        }
    }

    // Validate opposing party information
    // if (formData.opposingParty) {
    //   const { opposingParty } = formData;
    //   if (!opposingParty.name) {
    //     errors.opposingParty = { ...errors.opposingParty, name: 'Opposing party name is required' };
    //     isValid = false;
    //   }
    //   // Add more validations for other opposing party fields if needed
    // }

    // Validate court information
    // if (!formData.Court) {
    //     if(!formData.Court){
    //         const { name,fileNumber, address } = formData.Court;
    //         errors.name = 'Court name is required';
    //         isValid = false;
    //     }

    // }

    return { errors, isValid };
};

export const requiredFields = () => {
    const requiredFields = {
            Background: {
                Client: {
                    role: true,
                    province: true,
                    name: true,
                    postalCode: true,
                    phone: true,
                    address: true,
                    email: true
                },
                OpposingParty: {
                    role: true,
                    province: true,
                    name: true,
                    postalCode: true,
                    phone: true,
                    address: true,
                    email: true
                }
            },
            Court: {
                name: true,
                fileNumber: true,
                address: true
            },
            Relationship: {
                dateOfMarriage: true,
                startedLivingTogether: true
            }
        }

    return requiredFields;

}