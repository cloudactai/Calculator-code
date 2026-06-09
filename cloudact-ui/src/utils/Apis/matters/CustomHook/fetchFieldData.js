// fetchFieldData.js
export async function fetchFieldData(jsonForm) {

    try {
        const response = await fetch(`/documents/json_data/${jsonForm}.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        return jsonData.staticFields; // Return the fetched data
    } catch (error) {
        console.log("🚀 ~ fetchFieldData ~ error:", error);
        throw error; // Re-throw the error to handle it in the calling component
    }
}
