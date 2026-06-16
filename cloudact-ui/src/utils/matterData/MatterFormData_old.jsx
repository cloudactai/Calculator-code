import add_folder_linear from "../../assets/images/add_folder_linear.svg";

export function FormsArray(province) {

    let formsArrayData;

    if (province === 'Alberta') {
        formsArrayData = [
            {
                category: "Divorce",
                categoryId: "DIVORCE",
                icon: add_folder_linear,
                forms: [],
            },
            {
                category: "Completed",
                categoryId: "GENERAL",
                icon: add_folder_linear,
                forms: []
            },
            {
                category: "Working On",
                categoryId: "GENERAL",
                icon: add_folder_linear,
                forms: []
            },
            {
                category: "Child Protection",
                categoryId: "CHILD_PROTECTION",
                icon: add_folder_linear,
                forms: [],
            }]
    } 

    else if (province === 'Ontario') {
        formsArrayData = [
            {
                category: "Divorce",
                categoryId: "DIVORCE",
                icon: add_folder_linear,
                forms : [
                    {
                        "title": "Form 00 - Cover - Continuing Record",
                        "shortTitle": "Form 00",
                        "id": "Form00",
                        "checked": false,
                        "footer_text": "FLR-00",
                        "status": "active",
                        "file_name": "Form 00 - Cover - Continuing Record",
                        "docId": "Form00"
                    },
                    {
                        "title": "Form 4 - Notice of change in Representation",
                        "shortTitle": "Form 4",
                        "id": "Form4",
                        "checked": false,
                        "footer_text": "FLR-4",
                        "status": "active",
                        "file_name": "Form 4 - Notice of change in Representation",
                        "docId": "Form4"
                    },
                    {
                        "title": "Form 6A - Advertisement",
                        "shortTitle": "Form 6A",
                        "id": "Form6A",
                        "checked": false,
                        "footer_text": "FLR-6A",
                        "status": "active",
                        "file_name": "Form 6A - Advertisement",
                        "docId": "Form6A"
                    },
                    {
                        "title": "Form 12 - Notice of Withdrawal",
                        "shortTitle": "Form 12",
                        "id": "Form12",
                        "checked": false,
                        "footer_text": "FLR-12",
                        "status": "active",
                        "file_name": "Form 12 - Notice of Withdrawal",
                        "docId": "Form12"
                    },
                    {
                        "title": "Form 14D - Order on Motion Without Notice",
                        "shortTitle": "Form 14D",
                        "id": "Form14D",
                        "checked": false,
                        "footer_text": "FLR-14D",
                        "status": "active",
                        "file_name": "Form 14D - Order on Motion Without Notice",
                        "docId": "Form14D"
                    },
                    {
                        "title": "Form 17 - Conference Notice",
                        "shortTitle": "Form 17",
                        "id": "Form17",
                        "checked": false,
                        "footer_text": "FLR-17",
                        "status": "active",
                        "file_name": "Form 17 - Advertisement",
                        "docId": "Form17"
                    },
                    {
                        "title": "Form 20B - Letter of Request",
                        "shortTitle": "Form 20B",
                        "id": "Form20B",
                        "checked": false,
                        "footer_text": "FLR-20B",
                        "status": "active",
                        "file_name": "Form 20B - Letter of Request",
                        "docId": "Form20B"
                    },
                    {
                        "title": "Form 22 - Request to Admit",
                        "shortTitle": "Form 22",
                        "id": "Form22",
                        "checked": false,
                        "footer_text": "FLR-22",
                        "status": "active",
                        "file_name": "Form 22 - Request to Admit",
                        "docId": "Form22"
                    },
                    {
                        "title": "Form 23A - Summons to Witness Outside Ontario",
                        "shortTitle": "Form 23A",
                        "id": "Form23A",
                        "checked": false,
                        "footer_text": "FLR-23A",
                        "status": "active",
                        "file_name": "Form 23A - Summons to Witness Outside Ontario",
                        "docId": "Form23A"
                    },
                    {
                        "title": "Form 25F- Restraining Order",
                        "shortTitle": "Form 25F",
                        "id": "Form25F",
                        "checked": false,
                        "footer_text": "FLR-25F",
                        "status": "active",
                        "file_name": "Form 25F- Restraining Order",
                        "docId": "Form25F"
                    },
                    {
                        "title": "Form 25G - Restraining Order on Motion without Notice",
                        "shortTitle": "Form 25G",
                        "id": "Form25G",
                        "checked": false,
                        "footer_text": "FLR-25G",
                        "status": "active",
                        "file_name": "Form 25G - Restraining Order on Motion without Notice",
                        "docId": "Form25G"
                    },
                    {
                        "title": "Form 25H - Order Terminating Restraining Order",
                        "shortTitle": "Form 25H",
                        "id": "Form25H",
                        "checked": false,
                        "footer_text": "FLR-25H",
                        "status": "active",
                        "file_name": "Form 25H - Order Terminating Restraining Order",
                        "docId": "Form25H"
                    },
                    {
                        "title": "Form 31 - Notice of Contempt Motion",
                        "shortTitle": "Form 31",
                        "id": "Form31",
                        "checked": false,
                        "footer_text": "FLR-31",
                        "status": "active",
                        "file_name": "Form 31 - Notice of Contempt Motion",
                        "docId": "Form31"
                    },
                    {
                        "title": "Form 32 - Bond (Recognizance)",
                        "shortTitle": "Form 32",
                        "id": "Form32",
                        "checked": false,
                        "footer_text": "FLR-32",
                        "status": "active",
                        "file_name": "Form 32 - Bond (Recognizance)",
                        "docId": "Form32"
                    },
                    {
                        "title": "Form 32.1 - Request to Enforce a Family Arbitration Award",
                        "shortTitle": "Form 32.1",
                        "id": "Form32.1",
                        "checked": false,
                        "footer_text": "FLR-32.1",
                        "status": "active",
                        "file_name": "Form 32.1 - Request to Enforce a Family Arbitration Award",
                        "docId": "Form32.1"
                    },
                    {
                        "title": "Form 37 - Notice of Hearing",
                        "shortTitle": "Form 37",
                        "id": "Form37",
                        "checked": false,
                        "footer_text": "FLR-37",
                        "status": "active",
                        "file_name": "Form 37 - Notice of Hearing",
                        "docId": "Form37"
                    },
                    {
                        "title": "Form 8A - Application (Divorce)",
                        "shortTitle": "Form 8A",
                        "id": "FORM_8A",
                        "checked": false,
                        "footer_text": "FLR-8-E (2016/04)",
                        "status": "active",
                        "file_name": "Form 8A - Application (Divorce)",
                        "docId": "Form8A"
                    },
                    {
                        "title": "Form 8B",
                        "shortTitle": "Form 8B",
                        "id": "FORM_8B",
                        "checked": false,
                        "footer_text": "FLR-8-E (2016/04)",
                        "status": "active",
                        "file_name": "Form 8B",
                        "docId": "Form8B"
                    },
                    {
                        "title": "Form 13 - Financial Statement (Support Claims)",
                        "shortTitle": "Form 13",
                        "id": "FORM_13",
                        "checked": false,
                        "status": "active",
                        "file_name": "Form 13 - Financial Statement (Support Claims)",
                        "docId": "Form13"
                    },
                    {
                        "title": "Form 13.1 - Financial Statement (Property and Support Claims)",
                        "shortTitle": "Form 13.1",
                        "id": "FORM_13_1",
                        "checked": false,
                        "status": "active",
                        "file_name": "Form 13.1 - Financial Statement (Property and Support Claims)",
                        "docId": "Form13_1"
                    },
                    {
                        "title": "Form 13.A - Certificate of Financial Disclosure",
                        "shortTitle": "Form 13.A",
                        "id": "FORM_13_A",
                        "checked": false,
                        "status": "active",
                        "file_name": "Form 13.A - Certificate of Financial Disclosure",
                        "docId": "Form13A"
                    },
                    {
                        "title": "Form 13.B - Net Family Property",
                        "shortTitle": "Form 13.B",
                        "id": "FORM_13_B",
                        "checked": false,
                        "status": "active",
                        "file_name": "Form 13.B - Net Family Property",
                        "docId": "Form13B"
                    },
                    {
                        "title": "Form 6: Acknowledgement of Service",
                        "shortTitle": "Form 6",
                        "id": "ONTFORM6",
                        "checked": false,
                        "footer_text": "FLR-6-E (2005/09)",
                        "status": "active",
                        "file_name": "Form 6: Acknowledgement of Service",
                        "docId": "Form6"
                    },
                    {
                        "title": "Form 6B : Affidavit of Service",
                        "shortTitle": "Form 6B",
                        "id": "ONTFORM6B",
                        "checked": false,
                        "footer_text": "FLR-6B-E (2016/04)",
                        "status": "active",
                        "file_name": "Form 6B : Affidavit of Service",
                        "docId": "Form6B"
                    },
                    {
                        "title": "Form 8: Application (General)",
                        "shortTitle": "Form 8",
                        "id": "ONTFORM8",
                        "checked": false,
                        "footer_text": "FLR-8-E (2016/04)",
                        "status": "active",
                        "file_name": "Form 8: Application (General)",
                        "docId": "Form8"
                    },
                    {
                        "title": "Form 10: Answer",
                        "shortTitle": "Form 10",
                        "id": "ONTFORM10",
                        "checked": false,
                        "footer_text": "FLR 10 (February 1, 2022)",
                        "status": "active",
                        "file_name": "Form 10: Answer",
                        "docId": "Form10"
                    },
                    {
                        "title": "Form 10A: Reply",
                        "shortTitle": "Form 10A",
                        "id": "ONTFORM10A",
                        "checked": false,
                        "footer_text": "FLR-10A-E (2005/09)",
                        "status": "active",
                        "file_name": "Form 10A: Reply",
                        "docId": "Form10A"
                    },
                    {
                        "title": "Form 14: Notice of Motion",
                        "shortTitle": "Form 14",
                        "id": "ONTFORM14",
                        "checked": false,
                        "footer_text": "FLR 14 (March 1, 2018)",
                        "status": "active",
                        "file_name": "Form 14: Notice of Motion",
                        "docId": "Form14"
                    },
                    {
                        "title": "Form 14A: Affidavit (General - Case Reports)",
                        "shortTitle": "Form 14A",
                        "id": "ONTFORM14A",
                        "checked": false,
                        "footer_text": "FLR-14A-E (2005/09)",
                        "status": "active",
                        "file_name": "Form 14A: Affidavit (General - Case Reports)",
                        "docId": "Form14A"
                    },
                    {
                        "title": "Form 14B: Motion Form",
                        "shortTitle": "Form 14B",
                        "id": "ONTFORM14B",
                        "checked": false,
                        "footer_text": "FLR 14B (September 1, 2021)",
                        "status": "active",
                        "file_name": "Form 14B: Motion Form",
                        "docId": "Form14B"
                    },
                    {
                        "title": "Form 14C : Confirmation of motion",
                        "shortTitle": "Form 14C",
                        "id": "ONTFORM14C",
                        "checked": false,
                        "footer_text": "FLR 14C (March 1, 2018)",
                        "status": "active",
                        "file_name": "Form 14C : Confirmation of motion",
                        "docId": "Form14C"
                    },
                    {
                        "title": "Form 15: Motion to Change",
                        "shortTitle": "Form 15",
                        "id": "ONTFORM15",
                        "checked": false,
                        "footer_text": "FLR 15 (September 1, 2021)",
                        "status": "active",
                        "file_name": "Form 15: Motion to Change",
                        "docId": "Form15"
                    },
                    {
                        "title": "Form 15B: Response to Motion to Change",
                        "shortTitle": "Form 15B",
                        "id": "ONTFORM15B",
                        "checked": false,
                        "footer_text": "FLR 15B December 1, 2020)",
                        "status": "active",
                        "file_name": "Form 15B: Response to Motion to Change",
                        "docId": "Form15B"
                    },
                    {
                        "title": "Form 15C: Consent Motion to Change",
                        "shortTitle": "Form 15C",
                        "id": "ONTFORM15C",
                        "checked": false,
                        "footer_text": "FLR 15C (December 1, 2020)",
                        "status": "active",
                        "file_name": "Form 15C: Consent Motion to Change",
                        "docId": "Form15C"
                    },
                    {
                        "title": "Form 17A: Case Conference Brief - General",
                        "shortTitle": "Form 17A",
                        "id": "ONTFORM17A",
                        "checked": false,
                        "footer_text": "FLR 17A (December 1, 2020)",
                        "status": "active",
                        "file_name": "Form 17A: Case Conference Brief - General",
                        "docId": "Form17A"
                    },
                    {
                        "title": "Form 17C: Settlement Conference Brief - General",
                        "shortTitle": "Form 17C",
                        "id": "ONTFORM17C",
                        "checked": false,
                        "footer_text": "FLR 17C (December 1, 2020)",
                        "status": "active",
                        "file_name": "Form 17C: Settlement Conference Brief - General",
                        "docId": "Form17C"
                    },
                    {
                        "title": "Form 17E: Trial management conference brief",
                        "shortTitle": "Form 17E",
                        "id": "ONTFORM17E",
                        "checked": false,
                        "footer_text": "FLR 17E (December 1, 2020)",
                        "status": "active",
                        "file_name": "Form 17E: Trial management conference brief",
                        "docId": "Form17E"
                    },
                    {
                        "title": "Form 23: Summons to Witness",
                        "shortTitle": "Form 23",
                        "id": "ONTFORM23",
                        "checked": false,
                        "footer_text": "FLR-23-E (2005/09)",
                        "status": "active",
                        "file_name": "Form 23: Summons to Witness",
                        "docId": "Form23"
                    },
                    {
                        "title": "Form 25: Order (General)",
                        "shortTitle": "Form 25",
                        "id": "ONTFORM25",
                        "checked": false,
                        "footer_text": "FLR 25 (December 1, 2020)",
                        "status": "active",
                        "file_name": "Form 25: Order (General)",
                        "docId": "Form25"
                    },
                    {
                        "title": "Form 25A: Divorce Order",
                        "shortTitle": "Form 25A",
                        "id": "ONTFORM25A",
                        "checked": false,
                        "footer_text": "FLR-25A-E (2005/09)",
                        "status": "active",
                        "file_name": "Form 25A: Divorce Order",
                        "docId": "Form25A"
                    },
                    {
                        "title": "Form 26B: Affidavit for Filing Domestic Contract with Court",
                        "shortTitle": "Form 26B",
                        "id": "ONTFORM26B",
                        "checked": false,
                        "footer_text": "FLR 26B (April 12, 2016)",
                        "status": "active",
                        "file_name": "Form 26B: Affidavit for Filing Domestic Contract with Court",
                        "docId": "Form26B"
                    },
                    {
                        "title": "Form 36: Affidavit for Divorce",
                        "shortTitle": "Form 36",
                        "id": "ONTFORM36",
                        "checked": false,
                        "footer_text": "FLR 36 (December 1, 2020)",
                        "status": "active",
                        "file_name": "Form 36: Affidavit for Divorce",
                        "docId": "Form36"
                    }
                ]
                
            },
            {
                category: "Child Protection",
                categoryId: "CHILD_PROTECTION",
                icon: add_folder_linear,
                forms: [],
            }]
    } 
    else {
        formsArrayData = [
            {
                category: "Divorce",
                categoryId: "DIVORCE",
                icon: add_folder_linear,
                forms: []
            },
            {
                category: "Child Protection",
                categoryId: "CHILD_PROTECTION",
                icon: add_folder_linear,
                forms: [],
            }]
    }



    return { formsArrayData }
}
