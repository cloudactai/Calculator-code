import { useEffect, useState } from "react";
import { fetchRequest } from "../../../fetchRequest";
import { getUserSID } from "../../../helpers";

/**
 * Fetches all sub-data for a matter (background, children, relationship,
 * income_benefits, etc.) and transforms it into the shape that Calculator.tsx
 * expects from `matterData`.
 */
export const FormInformation = (matterId) => {
  const [documentInfo, setDocumentInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!matterId) {
      setLoading(false);
      return;
    }

    let active = true;

    fetchRequest(
      "get",
      `get_single_matter_data_all/${getUserSID()}/${matterId}`
    )
      .then(({ data }) => {
        if (!active) return;
        const body = data?.data?.body ?? data?.data ?? {};

        const bg = Array.isArray(body.background) ? body.background : [];
        const client = bg.find((r) => r.role === "Client") || {};
        const opposing = bg.find((r) => r.role === "Opposing Party") || {};

        const children = Array.isArray(body.children) ? body.children : [];
        const rel = Array.isArray(body.relationship)
          ? body.relationship[0] || {}
          : {};

        const incomeBenefits = Array.isArray(body.income_benefits)
          ? body.income_benefits
          : [];

        // Build the shape Calculator.tsx expects
        const info = {
          applicant: {
            fullLegalName: client.name || "",
            address: client.address || "",
            phoneAndFax: client.phone || "",
            email: client.email || "",
            province: client.province || "ON",
            municipality: client.municipality || "",
            dateOfBirth: client.dateOfBirth || "",
          },
          respondent: {
            fullLegalName: opposing.name || "",
            address: opposing.address || "",
            phoneAndFax: opposing.phone || "",
            email: opposing.email || "",
            province: opposing.province || "ON",
            municipality: opposing.municipality || "",
            dateOfBirth: opposing.dateOfBirth || "",
          },
          relationshipDates: {
            marriedOn: {
              checked: !!rel.dateOfMarriage,
              date: rel.dateOfMarriage || "",
            },
            startedLivingTogetherOn: {
              checked: !!rel.dateOfCohabitation,
              date: rel.dateOfCohabitation || "",
            },
            separatedOn: {
              checked: !!rel.dateOfSeparation,
              date: rel.dateOfSeparation || "",
            },
            isNeverLivedTogether: { checked: "" },
            placeOfMarriage: rel.placeOfMarriage || "",
          },
          theChildren: children.map((c) => ({
            fullLegalName: c.childName || c.name || "",
            birthdate: c.dateOfBirth || c.birthdate || "",
            nowLivingWith: c.livesWith || c.nowLivingWith || "",
          })),
          income: {
            client: buildIncomeObj(incomeBenefits, "Client"),
            opposingParty: buildIncomeObj(incomeBenefits, "Opposing Party"),
          },
        };

        setDocumentInfo(info);
      })
      .catch((err) => {
        console.warn("[FormInformation] Failed to load matter data:", err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [matterId]);

  return { documentInfo, loading };
};

/**
 * Map income_benefits rows for a given role into the Calculator income object shape.
 */
function buildIncomeObj(rows, role) {
  const obj = {
    employmentIncome: "",
    commissionTipsBonuses: "",
    selfEmploymentIncome: "",
    employmentInsuranceBenefits: "",
    workersCompensationBenefits: "",
    socialAssistanceIncome: "",
    interestInvestmentIncome: "",
    pensionIncome: "",
    spousalSupport: "",
    childTaxBenefits: "",
    otherIncome: "",
  };

  const incomeRows = rows.filter(
    (r) => r.role === role && r.incomeBenefit === "income"
  );

  // Map known types to the Calculator fields
  const typeMap = {
    "Employment income": "employmentIncome",
    "Commissions, tips and bonuses": "commissionTipsBonuses",
    "Self-employment income": "selfEmploymentIncome",
    "Employment insurance benefits": "employmentInsuranceBenefits",
    "Workers compensation benefits": "workersCompensationBenefits",
    "Social assistance income": "socialAssistanceIncome",
    "Interest and investment income": "interestInvestmentIncome",
    "Pension income": "pensionIncome",
    "Spousal support": "spousalSupport",
    "Child tax benefits": "childTaxBenefits",
    "Other income": "otherIncome",
  };

  for (const row of incomeRows) {
    const field = typeMap[row.type];
    if (field) {
      obj[field] = row.yearlyAmount || row.monthlyAmount || "";
    }
  }

  return obj;
}
