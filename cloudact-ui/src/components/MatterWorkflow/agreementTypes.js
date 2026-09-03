/**
 * Registry of agreement types the Draft Agreements task can draft.
 *
 * Adding a second agreement type is meant to be exactly this: one more entry
 * here, one more document component, one more system prompt on the Flask
 * side — nothing in SingleMatter.jsx's routing, AgreementTypeList.jsx, or the
 * persistence layer needs to change. `id` is also the `agreementType` value
 * stored on MatterAgreementDocument and sent to every /agreement-chat and
 * /v1/matters/:id/agreements/:agreementType call, so it must stay stable
 * once a matter has drafted one.
 */
export const AGREEMENT_TYPES = [
  {
    id: "separation_agreement",
    label: "Separation Agreement",
    description:
      "Drafts a separation agreement covering children, support, property, and debts.",
    available: true,
  },
];

export function getAgreementType(id) {
  return AGREEMENT_TYPES.find((type) => type.id === id) || null;
}
