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
        const forms = Array.isArray(response.data.data) ? response.data.data : [];

        // Build the category folders dynamically from whatever categories the API
        // returns (ordered by the template sortOrder), so every catalogued category
        // shows up as its own folder instead of only a hardcoded Divorce / Child
        // Protection pair. The /forms route already orders by sortOrder, then title.
        const toCategoryId = (category) =>
            String(category || "Other").trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_") || "OTHER";
        const mapForm = (form) => ({
            "title": form.title,
            "shortTitle": form.short_title,
            "id": form.form_id,
            "checked": false,
            "footer_text": form.footer_text,
            "status": form.status,
            "file_name": form.file_name,
            "docId": form.doc_id,
        });

        const groups = new Map();
        for (const form of forms) {
            const category = (form.category && String(form.category).trim()) || "Other";
            if (!groups.has(category)) {
                groups.set(category, {
                    category,
                    categoryId: toCategoryId(category),
                    icon: add_folder_linear,
                    forms: [],
                });
            }
            groups.get(category).forms.push(mapForm(form));
        }

        return Array.from(groups.values());
    } catch (error) {
        console.error('Error fetching forms:', error);
        // Return an empty list in case of an error; the picker renders no folders.
        return [];
    }
}
