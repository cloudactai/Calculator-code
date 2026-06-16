const regexPhoneNumber = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im

const formatNumber = (val) => {
    console.log("val", val)
    return val.toFixed(3).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

export {
    formatNumber,
    regexPhoneNumber
}

