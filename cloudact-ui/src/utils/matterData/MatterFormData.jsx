import add_folder_linear from "../../assets/images/add_folder_linear.svg";
import axios from "../../utils/axios";

export async function FormsArray(province, production_ready, mapping_ready) {
    try {
        const normalizedProvince = {
            ontario: "ON",
            alberta: "AB",
            "british columbia": "BC",
        }[String(province || "").trim().toLowerCase()] || String(province || "").trim().toUpperCase();
        let api_url = `/forms?province=${normalizedProvince}`;
        if(production_ready){
            api_url = api_url + `&production_ready=${production_ready}`;
        }
        if(mapping_ready){
            api_url = api_url + `&mapping_ready=${mapping_ready}`;

        }
        const response = await axios.get(api_url);
        if (!response.status===200) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const forms = response.data.data;
        let formsArrayData = [];
        
        if (normalizedProvince === 'AB' || normalizedProvince === 'ON' || normalizedProvince === 'BC') {
            formsArrayData = [
                {
                    category: "Divorce",
                    categoryId: "DIVORCE",
                    icon: add_folder_linear,
                    forms: forms.filter(form => form.category === "Divorce").map(form => ({
                        "title": form.title,
                        "shortTitle": form.short_title,
                        "id": form.form_id,
                        "checked": false,
                        "footer_text": form.footer_text,
                        "status": form.status,
                        "file_name": form.file_name,
                        "docId": form.doc_id
                    })),
                },
                {
                    category: "Child Protection",
                    categoryId: "CHILD_PROTECTION",
                    icon: add_folder_linear,
                    forms: forms.filter(form => form.category === "Child Protection").map(form => ({
                        "title": form.title,
                        "shortTitle": form.short_title,
                        "id": form.form_id,
                        "checked": false,
                        "footer_text": form.footer_text,
                        "status": form.status,
                        "file_name": form.file_name,
                        "docId": form.doc_id
                    })),
                },
                ...normalizedProvince === 'AB' ? [
                  {
                      category: "Completed",
                      categoryId: "GENERAL",
                      icon: add_folder_linear,
                      forms: forms.filter(form => form.category === "Completed").map(form => ({
                          "title": form.title,
                          "shortTitle": form.short_title,
                          "id": form.form_id,
                          "checked": false,
                          "footer_text": form.footer_text,
                          "status": form.status,
                          "file_name": form.file_name,
                          "docId": form.doc_id
                      })),
                  },
                  {
                      category: "Working On",
                      categoryId: "GENERAL",
                      icon: add_folder_linear,
                      forms: forms.filter(form => form.category === "Working On").map(form => ({
                          "title": form.title,
                          "shortTitle": form.short_title,
                          "id": form.form_id,
                          "checked": false,
                          "footer_text": form.footer_text,
                          "status": form.status,
                          "file_name": form.file_name,
                          "docId": form.doc_id
                      })),
                  }
                ] : []
            ];
        } else {
            formsArrayData = [
                {
                    category: "Divorce",
                    categoryId: "DIVORCE",
                    icon: add_folder_linear,
                    forms: [],
                },
                {
                    category: "Child Protection",
                    categoryId: "CHILD_PROTECTION",
                    icon: add_folder_linear,
                    forms: [],
                }];
        }

        return formsArrayData;
    } catch (error) {
        console.error('Error fetching forms:', error);
        // Return a default or empty formsArrayData in case of an error
        return [
            {
                category: "Divorce",
                categoryId: "DIVORCE",
                icon: add_folder_linear,
                forms: [],
            },
            {
                category: "Child Protection",
                categoryId: "CHILD_PROTECTION",
                icon: add_folder_linear,
                forms: [],
            }
        ];
    }
}
