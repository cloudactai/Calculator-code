const CONSTANTS = {
  //screen 1:
  province: "Enter the province where the party lives.",
  Date_of_marriage:
    "Enter the date that parties got married or began living together, whichever is the earliest. The date of the relationship will have a direct impact on the amount of spousal support in case of spousal support only and will have an impact on the duration of the spousal support payment ",
  Date_of_separation:
    "Enter the date the parties were separated. Parties may be separated even if they are still living together in the same residence as long as they are truly living separately in the same residence. ",
  live_with:
    "Shared custody as defined by s.9  of the Child Support Guidelines describe the parenting situation where both parents have the children for more than 40% of the children's time. ",
  birth_date:
    "The software automatically includes the relevant tax deductions and benefits based on the age of the child ",
  background_party1:
    "The age of the recipient is the age at the date of separation",
  background_child1:
    "The age of children of the marriage should be as of the date of the determination of spousal support ",
  About_child:
    "The SSAG provide a number of different formulas to be applied, depending on the individual facts of each case. The three main formulas of the SSAG are : 1. Without Child Support Formula: applicable when there are no children of the relationship or when the children are no longer dependent and no child support is required to be paid  2. With Child Support Formula: applicable when there are dependent children living primarily with the recipient of spousal support or living in a shared custody arrangement where child support is required to be paid 3. Custodial Payor Formula: applicable when there are dependent children living primarily with the payor of spousal support and child support is required to be paid to the payor of spousal support There must be a finding (or agreement) on entitlement before applying the SSAG formulas. ",
  live_with:
    "Shared custody as defined by s.9  of the Child Support Guidelines describe the parenting situation where both parents have the children for more than 40% of the children's time. ",

  // screen 2 benefits:
  Canada_Child_Benefits:
    "Based on CCB payments in 2021, you could receive a maximum of: $6,833 per year ($569.41 per month) for each eligible child under the age of 6. $5,765 per year ($480.41 per month) for each eligible child aged 6 to 17.A one-time Grocery Rebate was introduced in 2023 to provide financial support to eligible individuals and families.",
  GSTHST_Benefits:
    " One is eligible for the GST/HST credit if you are considered a Canadian resident for income tax purposes the month before and at the beginning of the month in which the Canada Revenue Agency makes a payment and you are at least 19 years old.        The size/amount of your GST/HST credit depends on your net family income, your marital status and whether you have children. For the 2021 tax year (which pays out from July 2022 to June 2023), the maximums are: $467 if you are single. $612 if you are married or have a common-law partner.",
  Climate_action_incentive:
    "The CAIP is a tax-free amount paid to help individuals and families offset the cost of the federal pollution pricing. It is available to residents of Alberta,Saskatchewan, Manitoba and Ontario. It consists of a basic amount and a supplement for residents of small and rural communities.eligible for this credit if you are a resident of Canada and over 19 years old.",
  Disability_Tax_Credit:
    "The disability tax credit (DTC) is a non-refundable tax credit that helps people with impairments, or their supporting family member, reduce the amount of income tax they may have to pay.",
  Canada_Child_Disability_Benefit:
    "For the period of July 2023 to June 2024, you could get up to $3,173 ($264.41 per month) for each child who is eligible for the DTC.For families with one child eligible for the benefit, the reduction is 3.2% of the amount of adjusted family net income greater than $75,537.For families with two or more children eligible for the benefit, the reduction is 5.7% of the amount of adjusted family net income greater than $75,537.",
  Alberta_Child_and_Family_Benefit:
    "The Alberta Child and Family Benefit (ACFB) is a program that gives lower- and middle-income families with children under 18 financial assistance. The ACFB is a relatively new program that consolidates two programs into one: the Alberta Child Benefit (ACB) and the Alberta Family Employment Tax Credit (AFETC). This new consolidated program began in July 2020. The two programs were consolidated to streamline administration and maximize benefits for low-income Albertans.                        ",
  Ontario_Child_Benefit:
    "Ontario, parents may be eligible for the Ontario Child Benefit to help out.Eligible families can receive up to $1,509 per child per year, which works out to up to $125.75 per child every month. If your adjusted family net income is above the threshold, you may receive a partial benefit.",
  Ontario_Sales_tax_credit:
    "For payments based on your 2022 income tax and benefit return (July 2023 to June 2024), the program provides a maximum annual credit of $345 for each adult and each child in a family.",
  BC_Childhood_Opportunity_Benefit:
    "The B.C. family benefit provides a tax-free monthly payment to families with children under the age of 18.Budget 2023 permanently increased the B.C. family benefit amounts and added a new supplement for lower-income single parent families starting in July 2023. ",
  Total_Benefit: "Total Benefits",
  BCCATC:
    "The BC climate action tax credit (BCCATC) is a tax-free payment made to low-income individuals and families to help offset the carbon taxes they pay.",
  Sales_Tax_Credit:
    "It is a tax-free payment designed to provide relief to low- to moderate-income Ontario residents for the sales tax they pay.",

  //screen 2 incomes :
  Employment_Income:
    "Employment income consists of amounts that you receive as salary, wages, commissions (see line 10120), bonuses, tips, gratuities, and honoraria. Employment income is usually shown in box 14 of your T4 slip",
  Commissions_included_in_Employment_income:
    "this are earns from a self employed salesperson.in box 42 of all your T4 slips",
  Wage_loss_Replacement_contributions:
    "These are received payments from a wage-loss replacement plan (WLRP) shown in box 14 of your t4 slip you may not have to report the full amount on your return. Report the amount you received minus the contributions you made to the plan if you did not use them on a previous year’s return. ",
  other_employment_income:
    "Employment income not reported on a T4 slip, they include:Net research grants,Clergy's housing allowance or an amount for eligible utilities,Foreign employment incomeIncome-maintenance insurance plans (wage-loss replacement plans),Certain GST/HST and Quebec sales tax (QST) rebates,Royalties,Amounts you received under a supplementary unemployment benefit plan (a guaranteed annual wage plan),Taxable benefit for premiums paid to cover you under a group term life insurance plan,Employee profit-sharing plan,Veterans' benefits (box 127of your T4A slip),Medical premium benefits (box 118 of your T4A slip),Wage Earner Protection Program (box 132 of your T4A slip)",
  Old_Age_Security_Pension:
    "Amounts received from the old age security (OAS) pension from Employment and Social Development Canada during 2022, you will receive a T4A Slip.The net amount of any spouse's allowance and guaranteed income supplement (federal supplements) that you received in the tax year is shown in box 21 of your T4A(OAS) slip",
  CPP_QPP_Benefits:
    "Enter the amount of taxable Canada Pension Plan (CPP) or Quebec Pension Plan (QPP) benefits from box 20 of your T4A(P) Slip",
  Other_pensions_and_superannuation:
    "An annuity is a plan that makes payments to you on a regular basis. It might be a general annuity, a payment from a registered retirement income funf(RRIF)or a variable pension payment.Annuity payments are shown on a T4A,T4RIF and T5",
  Elected_Split_Pension:
    "After completely filling the T1032 form ,the receiving spouse or common-law partner must enter on line 11600 of their return the elected split-pension amount from line 22 of Form T1032.",
  Universal_child_care_benefit:
    "One with a spouse or partner on December 31, 2022, whoever has the lower net income must report the UCCB lump-sum payment.Include all of the UCCB lump-sum payment as income of the dependant you are claiming the amount for an eligible dependant for (line 30400 of your return). If there is no claim on line 30400, you can choose to include all of the UCCB amount as income of a child that you received the UCCB for. Box 10 of the RC62 slip.",
  Employment_insurance_and_other_benefits:
    "This are received employment insurance (EI) maternity and parental benefits or provincial parental insurance plan (PPIP) benefits. T4E Slip",
  Taxable_amount_of_dividends_from_taxable_canadian_corporations:
    "Canadian-source dividends are profits that you receive from your share of the ownership in a corporation.There are two types of dividends – eligible dividends and other than eligible dividends – that you may have received from taxable Canadian corporations.Dividends are usually shown on a T5,T4PS,T3 and T5013 slips",
  Interest_and_other_investment_income:
    "Interest, foreign interest and dividend income, foreign income, foreign non-business income, and certain other income are all amounts that you report on your return as interest and other investment income. They are usually shon in the T5,T4PS and T5013",
  Net_partnership_income:
    "This is the net income (or loss) from a partnership (other than from rental or farming operations) if you were one of the following: A limited partner or a partner who was not actively involved in the partnership and not otherwise involved in a business or profession similar to that carried on by the partnership.Fill form T5013",
  Registered_disability_savings_plan_income:
    "The income received from the RDSP should be shown in Box 131 of T4A",
  Rental_income:
    "Rental income is income you earn from renting property that you own or have use of. You can own the property by yourself or with someone else. Rental income includes income from renting a house, apartment, room, space in an office building, or other real or movable property. Fill form T4036",
  Taxable_capital_gains:
    "This income is from selling or transfering capital property. Some common types of capital property include land, buildings, shares, bonds, fund and trust units.T3, T4PS, T5, T5008 and T5013 slips",
  Support_payments_received:
    "This includes both spousal and child support payments received, as well as any support payments you received under a social assistance arrangement.Do not include amounts you received that are more than the amounts specified in the order or agreement, such as pocket money or gifts that your children received directly from the payer. Fill form T1198",
  Registered_retirement_savings_Plan_income:
    "Registered retirement savings plan (RRSP) income refers to money you withdraw from or receive out of an RRSP. This income will be shown on a T4RSP",
  Other_income:
    "Specify the type of income you are reporting in the space provided on line 13000. Shown in form T4A,T4RIF & T3",
  Taxable_scholarship_fellowship_bursaries_artists_project_grants:
    "Report amounts that you received as a scholarship, fellowship or bursary, or a prize for achievement in a field of endeavour ordinarily carried on by you (other than a prescribed prize) that were not received in connection with your employment or in the course of business, to the extent  that these amounts are more than your scholarship exemption. If you received a research grant",
  Self_employment_income:
    "self-employment income from a business, a profession, commission, farming, or fishing.Business income includes income from any activity that you carry out for profit or with reasonable expectation of profit.T4002",
  Workers_compensation_benefits:
    "Workers' compensation benefits are compensation paid in respect of an injury, disability, or death to a worker, under the law of Canada or a province or territory.T5007",
  Social_assitance_payments:
    "Social assistance payments are payments made to beneficiaries or third parties based on a means, needs, or income test and include payments for food, clothing, and shelter requirements.T5007",
  Net_federal_supplements_paid:
    "The guaranteed income supplement that you received in the tax year, in addition to the net amount of a spouse allowance.T4A(OAS)",

  //screen 2 credits:
  Basic_personal_amount:
    "This claim is determined by amount of days resided in Canada in the tax year. This amount offsets the payable taxes for low-income taxpayers.If your net income is $155,625 or less, enter $14,398 on line 30000. If net income is $221,708 or more, enter $12,719.",
  Age_Amount:
    "Claim this amount if you were 65 years of age or older on December 31, 2022, and your net income is less than $92,480. $39,826 or less, claim $7,898. form 428",
  Spouse_or_commonlaw_partner:
    "entiteled to claim both of the following amounts:• $2,350 in the calculation of line 30300• up to $7,525 on line 30425",
  Eligible_dependant_18_years_of_age_or_older:
    "claim the amount for an eligible dependant if, at any time in the year, you supported an eligible dependant and met certain conditions. both of the following amounts:• $2,350 in the calculation of line 30400• up to $7,525 on line 30425",
  canada_caregiver_amount_for_spouse_or_commonlaw_partner_or_eligible_dependant_age_18_or_older:
    "If eligible for the Canada caregiver amount for your spouse or common-law partner or dependant 18 years of age or older and their net income is between $7,544 and $25,195, you may be able to claim up to $7,525.You must first claim $2,350 when calculating the spouse or common-law partner amount",
  canada_caregiver_amount_for_the_other_infirm_dependants_age_18_or_older:
    "You can claim an amount up to $7,525 for each of your (or your spouse’s or common-law partner’s) dependents if that person was dependent on you because of an impairment in physical or mental functions and they were 18 years of age or older.",
  canada_caregiver_amount_for_infirm_children_under_18_years_of_age:
    "ou can claim $2,350 for each of your (or your spouse's or common-law partner's) children who meet all of the following conditions.",
  Base_CPP_or_QPP_contributions_through_employment_income:
    "  For 2022, the maximum CPP or QPP contribution amount that you can enter on line 30800 of your return is: $3,039.30 if you were a resident of a province or territory other than Quebec on December 31, 2022, and only contributed to the CPP, $3,315.60 if you were a resident of Quebec on December 31, 2022, and only contributed to the QPP",
  Base_CPP_or_QPP_contributions_on_self_employment_income_and_other_earnings:
    "Claim, in dollars and cents, the total base CPP and QPP contributions calculated on self-employment income and other earnings. Form 428",
  Employment_insurance_premiums_through_employment:
    "The employment insurance (EI) premiums that you pay are based on your insurable earnings.The maximum amount you can claim on line 31200 of your return is:$952.74 if you were not a resident of Quebec on December 31, 2022,$723.60 if you were a resident of Quebec on December 31, 2022, and worked only in Quebec during the year",
  Provincial_parental_insurance_plan_premiums_paid:
    "A resident of Quebec on December 31, 2022, who worked in Quebec during the year, claim (in dollars and cents) the total amount from box 55 of your T4.The maximum amount you can claim on line 31205 is $434.72. ",
  PPIP_premiums_payable_on_employment_income:
    "The maximum amount you can claim on line 31205 is $434.72. If your employment income (including from outside Canada) is $2,000 or more",
  PPIP_premiums_payable_on_self_employment_income:
    "The maximum amount you can claim on line 31215 of your return is $434.72.",
  Employment_insurance_premiums_on_self_employment_and_other_eligible_earnings:
    "If you are a resident of Quebec, claim the amount from line 10 of your Schedule 13 on line 31217 and line 42120 of your return.Self-employed individuals can choose to pay employment insurance (EI) premiums to be eligible to receive EI special benefits.",
  Volunteer_firefighters_amount:
    "You can claim $3,000 for the volunteer firefighters' amount (VFA) or search and rescue volunteers' amount (SRVA), but not both, if you meet all of the following conditions:You were a volunteer firefighter or a search and rescue volunteer during the year.or You completed at least 200 hours of eligible volunteer firefighting services or eligible search and rescue volunteer services in the year.",
  search_and_rescue_volunteers_amount:
    "You can claim $3,000 for the volunteer firefighters' amount (VFA) or search and rescue volunteers' amount (SRVA), but not both, if you meet all of the following conditions:You were a volunteer firefighter or a search and rescue volunteer during the year.or You completed at least 200 hours of eligible volunteer firefighting services or eligible search and rescue volunteer services in the year.",
  canada_employment_amount:
    "The Canada employment amount allows you to claim work-related expenses such as home computers, uniforms and supplies in the public and private sector.For example, if you are a cook who received $35,000 in employment income in 2022 that you reported on line 10100 of your return, you can claim $1,287 (the maximum amount)",
  Home_buyers_amount:
    "You can claim up to $10,000 for the purchase of a qualifying home in 2022 if both of the following apply:You (or your spouse or common-law partner) acquired a qualifying home or You did not live in another home that you (or your spouse or common-law partner) owned in the year of acquisition or in any of the four preceding years (first-time home buyer)",
  Home_accessibility_expenses:
    "A qualifying individual has more than one eligible dwelling in a year, the total eligible expenses for all such eligible dwellings of the qualifying individual cannot be more than $20,000.",
  Adoption_expenses: "The maximum claim for each child is $17,131.",
  Digital_news_subscription_expenses:
    "You can claim up to $500 for amounts that you paid in 2022",
  Pension_income_amount:
    "You may be able to claim up to $2,000 if you reported eligible pension, superannuation, or annuity payments",
  Disability_amount_for_self:
    "For the disability tax credit (DTC), you may be able to claim the disability amount of $8,870 on line 31600 of your 2022 tax return",
  Disability_tax_credit:
    "The disability tax credit (DTC) is a non-refundable tax credit that helps people with impairments, or their supporting family member, reduce the amount of income tax they may have to pay. Less the amount from the income.",
  Disability_amount_transferred_from_a_dependant:
    "A dependant is eligible for the disability tax credit (DTC) and does not need to claim all or part of the disability amount on their tax return to reduce their income tax, they may transfer it to you. This would allow you to claim all or part of the disability amount on your tax return on line 31800.",
  interest_paid_on_your_student_loans:
    "A student is eligible to claim an amount for the interest paid on your student loan in 2022 or the preceding 5 years for post-secondary education if you received it under: The canada student loans Act, The canada student Financial assistance Act and The Apprentice Loans Act.",
  your_tuition_education_and_text_book_amounts:
    "To claim your tuition fees, you may receive an official tax receipt from your educational institution instead to reflect the amount of eligible tuition fees you have paid for a calendar year.",
  tuition_amount_transferred_from_a_child_or_grandchild:
    "The student cannot transfer any amount they carried forward in a previous year. The maximum amount they are allowed to transfer is $5,000 less the amount they needed to use to reduce their own tax owing.",
  amounts_transferred_from_your_spouse_or_common_law_partner:
    "The maximum amount your spouse or common-law partner can transfer to you is $5,000 minus the current year amounts they use, even if there is still an unused part.",
  eligible_medical_expenses_you_can_claim_on_your_tax_return:
    "You can claim only eligible medical expenses on your tax return if you, or your spouse or common-law partner: paid for the medical expenses in any 12-month period ending in 2022 OR did not claim them in 2021",
  donations_and_gifts:
    "If you or your spouse or common-law partner made a gift of money or other property to certain institutions, you may be able to claim federal and provincial or territorial non-refundable tax credits when you file your income tax and benefit return. Generally, you can claim part or all of the eligible amount of your gifts, up to the limit of 75% of your net income for the year.",

  //screen 2 deductions
  Pension_adjustment:
    "The pension adjustment (PA) amount is the value of the benefits you earned in 2022 under your employer's registered pension plans (RPP) and deferred profit sharing plans (DPSP), and possibly some unregistered retirement plans or arrangements.The amount is shown in box 52 of your T4 slip or box 034 of your T4A slip.",
  Registered_pension_plan_deduction:
    "The total of your RPP contributions for current service will be deducted, on the 2022 Income Tax and Benefit Return. However, the amount cannot be carried forward to subsequent years.",
  RRSP_Deduction:
    "A registered retirement savings plan (RRSP) is a retirement savings plan that an individual establish and  register, to which he /she or your spouse or common-law partner contribute. It can aso be a pool registered pension plan for individuals who are self employed.Deductible RRSP and PRPP contributions can be used to reduce your tax. Generally, any income you earn in the RRSP or PRPP is exempt from tax as long as the funds remain in the plan, however, you usually have to pay tax when you receive payments from these plans.",
  PRPP: "the total of all amounts shown in the designated “employer contribution amount” box of your PRPP receipts. This amount are not deducted from the income taxable but used to calculate  registered retirement savings plan/PRPP deduction limit and to determine the excess-contribution tax",
  Deducted_for_elected_split_pension:
    "A transfering spouse ,who have jointly elected to split their pension income and filled the form T 1032 ,the transferring spouse must deduct on line 21000 on the return of the split pension.",
  Annual_union_professional_or_like_dues:
    "Claim the total of the following amounts that you paid (or that were paid for you and reported as income) in the year related to your employment: A. annual dues for membership in a trade union or an association of public servants (do not include initiation fees, licences, special assessments, or charges for anything other than the organization's ordinary operating costs.),B. professional board dues required under provincial or territorial law, C. professional or malpractice liability insurance premiums or professional membership dues required to keep a professional status recognized by law, D. parity or advisory committee (or similar body) dues required under provincial or territorial law",
  Universal_child_care_benefit_repayment:
    "The person who reported the Universal child care benefit (UCCB) income in the previous year can claim the related 2022 repayment amount on line 21300.Box 10(total benefit paid), Box 12(repayment on previous years benefits)",
  Childcare_expenses:
    "Child care expenses are amounts you or another person paid to have someone look after an eligible child so that you or the other person could do one of the following: Earn income from employment,carry on a business. The childmust have lived with either party when the expense was incurred. Form T778, Child Care Expenses Deduction for 2022",
  Disability_support_deduction:
    "If you have an impairment in physical or mental functions, you may be able to deduct the expenses that you paid in the year so that you could: work and school. Only the person with the disability can claim expenses for this deduction. Also as a resident in Canada one can claim expenses paid for a disabled person outside canada.",
  Business_investment_loss:
    "If you had a business investment loss in 2022, you may be able to deduct half of the loss from income. The amount of the loss you can deduct from your income is called your allowable business investment loss",
  Moving_expenses:
    "Generally, you can claim moving expenses you paid in the year if both of the following apply: you moved to work or to run a business at a new location, or you moved to study courses as a full-time student enrolled in a post-secondary program at a university, a college, or other educational institution and if your new home must be at least 40 kilometres closer (by the shortest public route) to your new work location or school.",
  Support_payments_made:
    "When claiming deductible support payments, enter on line 21999 of your tax return the total amount of support payments you paid under a court orders or written ,agreements. This includes any non-deductible child support payments you made.Enter on line 22000 of your tax return the deductible part of the support payments that you paid.",
  carrying_charges_interest_expenses_and_other_expenses:
    "Claim the following carrying charges and interest that you paid to earn income from investments: Fees to manage or take care of your investments  (other than fees you paid for services in connection with your pooled registered pension plan (PRPP), registered retirement income fund (RRIF), registered retirement savings plan (RRSP), specified pension plan (SPP), and your tax-free savings account (TFSA))",
  Deduction_for_CPP_or_QPP_contributions_on_self_employment_income_and_other_earnings:
    "Only for individual 60 to 70 years.The Canada Pension Plan (CPP) or Quebec Pension Plan (QPP) contributions you have to make, or choose to make, will depend on how much you have already contributed to the CPP or QPP as an employee, as shown in boxes 16 and 17 of your T4 slips.",
  Deduction_fir_CPP_or_QPP_enhance_contribution_on_employment_income:
    "You can claim a deduction for the enhanced contributions on Canada Pension Plan (CPP) and Quebec Pension Plan (QPP) pensionable earnings you made through your employment income.Whether you contributed to the CPP or QPP, the maximum allowable deduction is $460.50. Form RS381",
  Deduction_for_PPIP_premiums_on_self_employment_income:
    "If you were a resident of Quebec on December 31, 2022, you have to pay PPIP premiums if one of the following conditions applies:Your net self-employment income on lines 13499 to 14300 of your return is $2,000 or moreThe total of your employment income (including employment income from outside Canada) and your net self-employment income is $2,000 or moreto calculate your PPIP premiums and attach it to your paper return. On line 22300, you can claim 43.736% of the total of your PPIP premiums.The maximum amount you can claim on line 22300 of your return is $337.92.",
  Exploration_and_development_expenses: "",
  federal_COVID_19_benefits_repayment:
    "If you received and repaid federal COVID-19 benefits in 2022, your T4A slip for 2022 will show the net amount of federal COVID-19 benefits received. Enter this amount on line 13000 of your 2022 return. If you repay a benefit amount after December 31, 2022, you can only claim a deduction in the year that you make the repayment. ",
  social_benefits_repayment:
    "Your repayments are not part of your taxable income, but they are included at line 23500 of your return to increase your total payable",
  net_income: "net income",
  canadian_Armed_Forces_personnel_and_police_deduction:
    "A deduction may be claimed for certain members of the Canadian Armed Forces and Canadian police services if you were deployed outside Canada on a high-risk or current moderate-risk operational mission. If this applies to you, an amount will be shown in box 43 of your T4slips.",
  Security_options_deductions:
    "You may be able to claim a deduction for donating securities that you acquired through your employer's security options plan.",
  Limited_partnership_losses_for_the_other_years:
    "A limited partnership losses in previous years that you have not already claimed, you may be able to claim part of these losses this year, carry forward the losses indefinitely but you can only deduct them from the same partnership's income if you have a positive at-risk amount (ARA).",
  Non_capital_losses_for_the_other_years:
    "A non-capital loss for a particular year includes any loss incurred from employment, property or a business. If your loss ealized in the particular year is more than your other sources of income for the year, include the difference as part of your non-capital loss.",
  Net_capital_losses_for_other_years:
    "An allowable capital loss in a year, you have to apply it against your taxable capital gain for that year. If you still have a loss, it becomes part of the computation of your net capital loss for the year. You can use a net capital loss to reduce your taxable capital gain in any of the three preceding years or in any future year.",
  capital_gain_deduction:
    "capital gains arising from the disposition of certain properties, you may be eligible for the cumulative capital gains deduction, and may be able to reduce your taxable income.",

  // Fixed values
  canada_person_expected_life: 80,
};

export default CONSTANTS;
