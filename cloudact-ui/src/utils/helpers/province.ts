import { getCurrentUserFromCookies } from "../helpers";

export const checkProvince = {
    isBC: () => {
        return getCurrentUserFromCookies().province === "BC"
    },
    isAB: () => {
        return getCurrentUserFromCookies().province === "AB"
    },
    isON: () => {
        return getCurrentUserFromCookies().province === "ON"
    },
    isQB: () => {
        return getCurrentUserFromCookies().province === "QB"
    },
    isMB: () => {
        return getCurrentUserFromCookies().province === "MB"
    },
    isSK: () => {
        return getCurrentUserFromCookies().province === "SK"
    },
}

export const getProvinceForm = (province: string) => {
    const obj: Record<string, string> = {
        "ON": "Ontario",
        "BC": "British Columbia",
        "AB": "Alberta",
        "QC": "Quebec",
        "SK": "Saskatchewan",
        "MB": "Manitoba"
    };

    return obj[province];
}