export const calculateAge = (dateOfBirth) => {
    const dob = new Date(dateOfBirth);
    const now = new Date();
    
    let age = now.getFullYear() - dob.getFullYear();
    
    // Check if the birthday has occurred this year
    if (now.getMonth() < dob.getMonth() || 
        (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())) {
        age--;
    }
    
    return age;
}

export function getCurrentDate(separator='/'){

    let newDate = new Date()
    let date = newDate.getDate('dd');
    let month = newDate.getMonth() + 1;
    let year = newDate.getFullYear();
    if (date < 10) {
        date = '0' + date;
    }
    console.log(`${year}${separator}${month<10?`0${month}`:`${month}`}${separator}${date}`)
    return `${year}${separator}${month<10?`0${month}`:`${month}`}${separator}${date}`
}

export function formatDate(dateString, seperator = ',') {
    // Parse the date string
    const date = new Date(dateString);
  
    // Get day, month, and year
    const day = date.getDate();
    const month = date.getMonth() + 1; // Months are zero-indexed
    const year = date.getFullYear();
  
    // Return the formatted date
    return `${day}${seperator}${month}${seperator}${year}`;
  }