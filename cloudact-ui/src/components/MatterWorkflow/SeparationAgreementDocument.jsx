import React from "react";
import { AGREEMENT_DOCUMENT_CSS, fillOrPlaceholder } from "./agreementDocumentStyles";

/**
 * Live Separation Agreement document — reproduces
 * "Agreements tool /Separation Agreement (1).docx" verbatim, paragraph by
 * paragraph, wherever the source text applies: fixed clauses keep the
 * source's exact wording and paragraph breaks, and only the blanks the field
 * ledger identifies (names, dates, amounts, free-text schedules) are
 * substituted in place. Conditional sections that would be empty (no
 * children, no shared home, support not applicable) don't render at all,
 * rather than printing a blank clause. Built once, used two ways — live in
 * the browser here, and handed to Flask's /agreement-pdf (xhtml2pdf) for
 * export by serializing this same rendered HTML, so the PDF matches what the
 * lawyer reviewed.
 *
 * Two places the source docx doesn't give a template to copy, because its
 * sample only ever demonstrates one branch of a Yes/No field:
 *   - Decision-Making Responsibility (¶104-116): the sample always shows the
 *     "joint" outcome. The joint paragraphs below are copied verbatim for
 *     that case; a sole-responsibility case (not in the sample) gets a
 *     shorter substituted sentence instead of inventing "sole" boilerplate
 *     with no ground truth to match.
 *   - Matrimonial Home "selling" (the sample only shows "transferring") and
 *     Equalization "paid" (the sample only shows "waived") — the ledger's
 *     Yes/No fields require both branches to exist; the branch the docx
 *     doesn't demonstrate is written to match the style of the branch that
 *     does, not copied from anywhere.
 *
 * One correction to the source docx: its "Child Support" section (¶66-70)
 * reads "...will pay SPOUSAL support..." under a CHILD SUPPORT heading — a
 * copy-paste artifact from the Spousal Support clause below it. Reproduced
 * here as "child support" to match its own heading; nothing else about the
 * clause's wording changes.
 *
 * Props: { agreementData } — see agreementResolver.buildAgreementData().
 */

function Fill({ value, placeholder }) {
  const { text, isPlaceholder } = fillOrPlaceholder(value, placeholder);
  return isPlaceholder ? <span className="ad-placeholder">{text}</span> : <span>{text}</span>;
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

/** The docx's own sample only shows joint decision-making; detect that case
 * from the free-text answer so the exact joint paragraphs render only when
 * they're actually true. Anything else (a named sole party, a description
 * that doesn't say "joint") gets the shorter substituted sentence. */
function isJointResponsibility(responsibility) {
  return /\bjoint\b/i.test(String(responsibility || ""));
}

export default function SeparationAgreementDocument({ agreementData }) {
  if (!agreementData) return null;
  const d = agreementData;
  const p1Name = d.party1.name || "Party 1";
  const p2Name = d.party2.name || "Party 2";
  const joint = isJointResponsibility(d.decisionMaking.responsibility);

  return (
    <div className="agreement-doc">
      <style>{AGREEMENT_DOCUMENT_CSS}</style>

      <h1 className="ad-title">SEPARATION AGREEMENT</h1>

      <p className="ad-p">
        This Separation Agreement (the &ldquo;Agreement&rdquo;) is entered into on{" "}
        {formatDate(new Date())}.
      </p>

      <div className="ad-between">BETWEEN:</div>
      <div className="ad-party-block">
        <p className="ad-party">
          <strong><Fill value={p1Name} placeholder="[Party 1 name]" /></strong>
        </p>
        <p className="ad-party"><Fill value={d.party1.address} placeholder="[Party 1 address]" /></p>
      </div>

      <div className="ad-and">AND</div>
      <div className="ad-party-block">
        <p className="ad-party">
          <strong><Fill value={p2Name} placeholder="[Party 2 name]" /></strong>
        </p>
        <p className="ad-party"><Fill value={d.party2.address} placeholder="[Party 2 address]" /></p>
      </div>

      <h2 className="ad-heading">Background</h2>
      <h3 className="ad-subheading">A. Relationship:</h3>
      <p className="ad-p">
        <Fill value={p1Name} /> and <Fill value={p2Name} /> (referred to collectively as the
        &ldquo;Parties&rdquo;, and individually as a &ldquo;Party&rdquo;) were legally married
        on <Fill value={formatDate(d.dateOfMarriage)} placeholder="[date of marriage]" />, in{" "}
        <Fill value={d.placeOfMarriage} placeholder="[place of marriage]" />. They have mutually
        chosen to separate and live independently, pursuant to the terms set forth in this
        Agreement.
      </p>
      <h3 className="ad-subheading">B. Full Disclosure:</h3>
      <p className="ad-p">
        Each Party declares that they have provided complete, accurate, and honest disclosure
        regarding all pertinent financial matters relevant to this Agreement.
      </p>
      <h3 className="ad-subheading">C. Purpose:</h3>
      <p className="ad-p">
        This Agreement is intended to address and resolve the issues set out herein. It may be
        incorporated into a divorce judgment, unless superseded by a later written agreement
        signed by both Parties.
      </p>
      <h3 className="ad-subheading">D. Voluntary Consent:</h3>
      <p className="ad-p">
        Each Party affirms that they are entering into this Agreement of their own free will,
        without any duress, coercion, or undue pressure, and that they are of sound mind and
        capable of understanding its contents.
      </p>

      <h2 className="ad-heading">Terms of Agreement</h2>
      <h3 className="ad-subheading">Living Separately</h3>
      <p className="ad-p">
        The Parties confirm that they have been living separate and apart since{" "}
        <Fill value={formatDate(d.dateOfSeparation)} placeholder="[date of separation]" />.
        Neither Party shall enter or attend the residence or place of work of the other without
        clear prior consent.
      </p>
      <h3 className="ad-subheading">Personal Autonomy and Non-Interference</h3>
      <p className="ad-p">
        Both Parties shall enjoy full independence and are free to determine their residence,
        employment, and personal affairs. Neither Party shall harass, intimidate, disturb, or
        otherwise interfere with the other, including interference with the other&rsquo;s
        family, friends, or place of employment.
      </p>

      {d.hasChildren && (
        <>
          <h2 className="ad-heading">Children</h2>
          <h3 className="ad-subheading">Children from the Relationship</h3>
          <p className="ad-p">The Parties acknowledge that they share the following children together:</p>
          {d.children.map((child, i) => (
            <p className="ad-p" key={i}>
              Name of the Child: {child.name || <span className="ad-placeholder">[name]</span>}
              <br />
              DOB of the Child: {formatDate(child.dateOfBirth) || <span className="ad-placeholder">[date of birth]</span>}
            </p>
          ))}
          <p className="ad-p">Yes, child support will be paid</p>

          <h3 className="ad-subheading">Child Support</h3>
          <p className="ad-p">
            The Parties acknowledge that, in the event of the breakdown of their relationship,{" "}
            <Fill value={d.childSupport.payer} placeholder="[payor]" /> will pay child support to{" "}
            <Fill value={d.childSupport.recipient} placeholder="[recipient]" /> in the amount of $
            <Fill value={d.childSupport.amount} placeholder="[amount]" />, payable monthly,
            starting on the <Fill value={d.childSupport.paymentDay} placeholder="[day]" /> day of
            the first month following the date of separation. This amount is based on the Federal
            Child Support Guidelines and corresponds to the payor&rsquo;s income and the number of
            children for whom support is provided. The Parties agree that: The amount of child
            support may be reviewed yearly or upon any material change in circumstances, including
            a change in income, parenting arrangements, or the children&rsquo;s needs; Child
            support shall continue per applicable laws until each child is no longer considered a
            &ldquo;child of the relationship&rdquo; under the Family Law Act or until otherwise
            agreed in writing or ordered by a court; Special or extraordinary expenses (also known
            as section 7 expenses), such as child care, educational, and medical costs, shall be
            shared proportionately to each Party&rsquo;s income unless otherwise agreed to in
            writing. Nothing in this Agreement prevents either Party from applying to a court for
            child support in accordance with the Family Law Act or the Child Support Guidelines if
            the agreed-upon amount becomes inappropriate in the future.
          </p>

          {d.parentingTime.party1.include && (
            <>
              <h3 className="ad-subheading">Parenting Time for {p1Name}</h3>
              <p className="ad-p">
                <Fill value={p1Name} /> shall have parenting time with the child(ren) in
                accordance with the following schedule:
              </p>
              <p className="ad-p ad-schedule-label">PARENTING SCHEDULE</p>
              <p className="ad-p"><Fill value={d.parentingTime.party1.schedule} placeholder="[parenting time schedule]" /></p>
              <p className="ad-p">
                The parties agree that this schedule is in the best interests of the child(ren)
                and provides for regular, meaningful, and ongoing contact between the child(ren)
                and <Fill value={p1Name} />. The parties shall each ensure that the child(ren) are
                available for parenting time as agreed, and shall cooperate to facilitate
                transitions and maintain a consistent routine for the child(ren).
              </p>
              <p className="ad-p">
                Both parties further agree to communicate respectfully and promptly with one
                another regarding any necessary changes to the parenting time schedule, and to
                make reasonable efforts to accommodate each other&rsquo;s needs and the best
                interests of the child(ren).
              </p>
            </>
          )}

          {d.parentingTime.party2.include && (
            <>
              <h3 className="ad-subheading">Parenting Time for {p2Name}</h3>
              <p className="ad-p">
                <Fill value={p2Name} /> shall have parenting time with the child(ren) in
                accordance with the following schedule:
              </p>
              <p className="ad-p ad-schedule-label">PARENTING TIME</p>
              <p className="ad-p"><Fill value={d.parentingTime.party2.schedule} placeholder="[parenting time schedule]" /></p>
              <p className="ad-p">
                The parties agree that this schedule is in the best interests of the child(ren)
                and provides for regular, meaningful, and ongoing contact between the child(ren)
                and <Fill value={p2Name} />. The parties shall each ensure that the child(ren) are
                available for parenting time as agreed, and shall cooperate to facilitate
                transitions and maintain a consistent routine for the child(ren).
              </p>
              <p className="ad-p">
                Both parties further agree to communicate respectfully and promptly with one
                another regarding any necessary changes to the parenting time schedule, and to
                make reasonable efforts to accommodate each other&rsquo;s needs and the best
                interests of the child(ren).
              </p>
            </>
          )}

          <h3 className="ad-subheading">Decision-Making Responsibility</h3>
          {joint ? (
            <>
              <p className="ad-p">
                The parties agree that they shall share joint and equal decision-making
                responsibility for the child(ren) of the relationship. This means that both{" "}
                <Fill value={p1Name} /> and <Fill value={p2Name} /> shall jointly make all major
                decisions regarding the child(ren)&rsquo;s health care, education, religious
                upbringing, and general welfare. All such decisions shall be made in a manner that
                prioritizes the best interests of the child(ren).
              </p>
              <p className="ad-p">
                The parties shall consult with one another in a timely, respectful, and meaningful
                way before making any significant decisions affecting the child(ren), and shall
                make reasonable efforts to reach a mutual agreement. Neither Party shall make
                unilateral decisions on major matters unless it is an emergency and immediate
                action is required to protect the health or safety of the child(ren).
              </p>
            </>
          ) : (
            <p className="ad-p">
              The parties agree that decision-making responsibility for the child(ren) of the
              relationship shall be held as follows:{" "}
              <Fill value={d.decisionMaking.responsibility} placeholder="[decision-making arrangement]" />
              . Decisions regarding the child(ren)&rsquo;s health care, education, religious
              upbringing, and general welfare shall be made in a manner that prioritizes the best
              interests of the child(ren).
            </p>
          )}
          <p className="ad-p">
            Each Party shall have equal rights to access information from schools, health care
            providers, and other third parties concerning the child(ren), and shall keep the other
            parent reasonably informed of all significant developments related to the
            child(ren)&rsquo;s care and well-being.
          </p>
          <p className="ad-p">
            If the parties are unable to reach an agreement on any matter requiring joint
            decision-making, they agree to attempt to resolve the disagreement through alternative
            dispute resolution methods, such as negotiation, mediation, or other mutually
            acceptable process, before seeking a court order.
          </p>

          {d.visitation.include && (
            <>
              <h3 className="ad-subheading">Children&rsquo;s Visiting Schedule with Parties</h3>
              <p className="ad-p">
                The parties would like to follow the visiting schedule outlined below, beginning
                on <Fill value={formatDate(d.visitation.startDate)} placeholder="[start date]" />:
              </p>
              <p className="ad-p"><Fill value={d.visitation.schedule} placeholder="[visiting schedule]" /></p>
            </>
          )}
        </>
      )}

      {d.spousalSupport.include && (
        <>
          <h2 className="ad-heading">Spousal Support</h2>
          <p className="ad-p">
            The parties acknowledge that <Fill value={d.spousalSupport.payer} placeholder="[payor]" />{" "}
            will pay spousal support to <Fill value={d.spousalSupport.recipient} placeholder="[recipient]" />{" "}
            in the amount of $<Fill value={d.spousalSupport.amount} placeholder="[amount]" />,
            payable monthly, starting on{" "}
            <Fill value={d.spousalSupport.paymentStartDay} placeholder="[day]" /> day of the first
            month following the date of separation.
          </p>
          <p className="ad-p">
            Spousal support shall terminate automatically upon the death of either party, the
            remarriage of the recipient, or if the recipient begins residing with another person
            in a conjugal relationship. Unless otherwise agreed in writing, no further spousal
            support shall be payable following the occurrence of any of these events, and all
            support obligations shall cease without the need for further action by either party.
          </p>
          <p className="ad-p">
            This support is payable in accordance with the Family Law Act and shall be
            tax-deductible to the payor and taxable to the recipient, in accordance with the
            Income Tax Act of Canada. Each party waives any further claim for spousal support
            beyond the terms set out in this Agreement.
          </p>
        </>
      )}

      {d.matrimonialHome.hasSharedHome && (
        <>
          <h2 className="ad-heading">Matrimonial Home</h2>
          <p className="ad-p">
            The Parties jointly own a property located at{" "}
            <Fill value={d.matrimonialHome.address} placeholder="[property address]" /> (the
            &ldquo;Matrimonial Home&rdquo;).
          </p>
          {d.matrimonialHome.sellingOrTransferring === "selling" && (
            <p className="ad-p">
              The Matrimonial Home shall be sold. The sale proceeds shall be shared as follows:{" "}
              <Fill value={d.matrimonialHome.saleProceedsSharing} placeholder="[how proceeds are shared]" />
              . <Fill value={d.matrimonialHome.recipientName} placeholder="[recipient]" /> shall
              receive $<Fill value={d.matrimonialHome.amount} placeholder="[amount]" /> from the
              proceeds of sale.
            </p>
          )}
          {d.matrimonialHome.sellingOrTransferring === "transferring" && (
            <p className="ad-p">
              <Fill value={d.matrimonialHome.transferRecipient} placeholder="[recipient]" /> shall
              receive exclusive ownership of the matrimonial home.{" "}
              <Fill value={d.matrimonialHome.transferGivingUp} placeholder="[party giving up their share]" />{" "}
              shall transfer all interest in the home on or before{" "}
              <Fill value={formatDate(d.matrimonialHome.transferDate)} placeholder="[transfer date]" />{" "}
              and shall execute all documents required to complete the transfer.
            </p>
          )}
        </>
      )}

      <h2 className="ad-heading">Division of Assets and Property</h2>
      <h3 className="ad-subheading">Agreement on Property Division</h3>
      <p className="ad-p">
        The Parties confirm that all jointly held and personal property, including any assets,
        belongings, or financial interests acquired individually or together during the course of
        their relationship, have been divided in a manner that both Parties acknowledge to be
        fair, final, and satisfactory.
      </p>
      <p className="ad-p">
        The Parties agree to the following division of jointly held Assets and property, which
        reflects either mutual agreement or transfer of ownership. Each Party waives any future
        claim or entitlement to the jointly held property allocated to the other.
      </p>

      {d.assets.party1.hasKeptAssets && (
        <>
          <h3 className="ad-subheading">Acknowledgement of Exclusive Assets of {p1Name}</h3>
          <p className="ad-p">
            The Parties agree that the assets listed below are the exclusive property of{" "}
            <Fill value={p1Name} /> (the &ldquo;Owner&rdquo;). These assets were acquired either
            prior to the relationship, personally during the relationship, or have otherwise been
            retained by mutual agreement. <Fill value={p2Name} /> irrevocably waives any and all
            present or future rights, claims, or entitlements to the following property:
          </p>
          {d.assets.party1.items.length > 0 ? (
            d.assets.party1.items.map((item, i) => (
              <p className="ad-p" key={i}>
                Asset Type: {item.type || "—"} Asset Value: {item.value !== "" && item.value != null ? `$${item.value}` : "—"}
              </p>
            ))
          ) : (
            <p className="ad-empty-note">[asset list to be completed]</p>
          )}
        </>
      )}

      {d.assets.party2.hasKeptAssets && (
        <>
          <h3 className="ad-subheading">Acknowledgement of Exclusive Assets of {p2Name}</h3>
          <p className="ad-p">
            The Parties agree that the assets listed below are the exclusive property of{" "}
            <Fill value={p2Name} /> (the &ldquo;Owner&rdquo;). These assets were acquired either
            prior to the relationship, personally during the relationship, or have otherwise been
            retained by mutual agreement. <Fill value={p1Name} /> irrevocably waives any and all
            present or future rights, claims, or entitlements to the following property:
          </p>
          {d.assets.party2.items.length > 0 ? (
            d.assets.party2.items.map((item, i) => (
              <p className="ad-p" key={i}>
                Asset Type: {item.type || "—"} Asset Value: {item.value !== "" && item.value != null ? `$${item.value}` : "—"}
              </p>
            ))
          ) : (
            <p className="ad-empty-note">[asset list to be completed]</p>
          )}
        </>
      )}

      {d.assets.joint.hasJointAssets && (
        <>
          <h3 className="ad-subheading">Acknowledgment of Continued Joint Ownership of Assets</h3>
          <p className="ad-p">
            The Parties agree that, notwithstanding their separation, they shall continue to
            jointly own the following assets (the &ldquo;Joint Property&rdquo;):
          </p>
          {d.assets.joint.items.length > 0 ? (
            d.assets.joint.items.map((item, i) => (
              <p className="ad-p" key={i}>
                Asset Type: {item.type || "—"} Asset Value: {item.value !== "" && item.value != null ? `$${item.value}` : "—"}
              </p>
            ))
          ) : (
            <p className="ad-empty-note">[asset list to be completed]</p>
          )}
        </>
      )}

      <h2 className="ad-heading">Equalization of Net Family Property</h2>
      <h3 className="ad-subheading">Equalization</h3>
      <p className="ad-p">
        Each Party acknowledges their rights and obligations under the Family Law Act relating to
        the equalization of net family property.
      </p>
      {d.equalization.include ? (
        <p className="ad-p">
          The Parties agree that an equalization payment shall be made.{" "}
          <Fill value={d.equalization.payer} placeholder="[payor]" /> shall pay{" "}
          <Fill value={d.equalization.recipient} placeholder="[recipient]" /> the amount of $
          <Fill value={d.equalization.amount} placeholder="[amount]" /> on or before{" "}
          <Fill value={formatDate(d.equalization.paymentDate)} placeholder="[payment date]" />, in
          full satisfaction of the equalization of net family property under the Family Law Act.
        </p>
      ) : (
        <>
          <p className="ad-p">
            Each Party waives any right to equalization of net family property under the Family
            Law Act and confirms that this waiver is informed, voluntary, and final.
          </p>
          <p className="ad-p">
            If equalization is waived, each Party confirms that they understand the nature of the
            rights being waived and agrees that this waiver is final.
          </p>
        </>
      )}

      <h2 className="ad-heading">Debts and Liabilities</h2>
      <h3 className="ad-subheading">Responsibility for Debts and Liabilities</h3>
      <p className="ad-p">
        Each Party shall remain solely responsible for all liabilities, debts, and loans incurred
        in their own name, whether or not such debts are associated with an asset retained under
        this Agreement or specifically listed herein. This includes, without limitation, all
        personal loans, lines of credit, credit card balances, tax obligations, and other
        financial liabilities.
      </p>
      <p className="ad-p">
        Each Party shall indemnify and hold the other harmless from any claim, demand, or
        obligation relating to such individual debts and liabilities.
      </p>

      {d.debts.hasJointDebts && (
        <>
          <p className="ad-p">
            The Parties further acknowledge the existence of the following debts, which are
            jointly held or mutually agreed to be shared obligations:
          </p>
          {d.debts.items.length > 0 ? (
            d.debts.items.map((item, i) => (
              <p className="ad-p" key={i}>
                Type of Debt: {item.type || "—"} Amount of Debt: {item.amount !== "" && item.amount != null ? item.amount : "—"}
              </p>
            ))
          ) : (
            <p className="ad-empty-note">[debt list to be completed]</p>
          )}
          <p className="ad-p">
            The Parties agree to share responsibility for the repayment of the above-listed debts
            equally. Each Party shall be responsible for 50% of the outstanding balances and shall
            take all reasonable steps to ensure timely and full payment of their share. The
            Parties further agree to cooperate in managing these debts, including communicating
            with creditors if necessary, and shall indemnify one another in the event of any
            default or non-payment by either Party on their respective share.
          </p>
        </>
      )}

      <h3 className="ad-subheading">Special and Extraordinary Expenses</h3>
      <p className="ad-p">
        If applicable, special or extraordinary expenses shall be shared between the Parties in
        proportion to their incomes unless otherwise agreed.
      </p>
      <h3 className="ad-subheading">Prohibition on Creating Future Debt Obligations</h3>
      <p className="ad-p">
        Neither Party shall incur, or attempt to incur, any new debt or financial obligation in
        the name of, or on the credit of, the other Party from the date of this Agreement
        forward. Each Party shall be solely responsible for any debts incurred in their own name.
      </p>
      <p className="ad-p">
        All debts and financial obligations incurred prior to the date of this Agreement shall
        remain the sole responsibility of the Party who incurred them, regardless of whether the
        debt is associated with a jointly held account or credit facility. Each Party agrees to
        indemnify and hold harmless the other from any liability arising from such debts.
      </p>

      <h2 className="ad-heading">Signatures</h2>
      <div className="ad-sig-block">
        <p className="ad-sig-line"><strong>{p1Name}</strong></p>
        <p className="ad-sig-line">Signature: ______________________________</p>
        <p className="ad-sig-line">Print Name: ______________________________</p>
        <p className="ad-sig-line">Address: {d.party1.address || "______________________________"}</p>
        <p className="ad-sig-line">Date: ______________________________</p>
      </div>
      <div className="ad-sig-block">
        <p className="ad-sig-line"><strong>{p2Name}</strong></p>
        <p className="ad-sig-line">Signature: ______________________________</p>
        <p className="ad-sig-line">Print Name: ______________________________</p>
        <p className="ad-sig-line">Address: {d.party2.address || "______________________________"}</p>
        <p className="ad-sig-line">Date: ______________________________</p>
      </div>
      <div className="ad-sig-block">
        <p className="ad-sig-line"><strong>Witness for {p1Name}</strong></p>
        <p className="ad-sig-line">Signature: ______________________________</p>
        <p className="ad-sig-line">Print Name: ______________________________</p>
        <p className="ad-sig-line">Address: ______________________________</p>
        <p className="ad-sig-line">Date: ______________________________</p>
      </div>
      <div className="ad-sig-block">
        <p className="ad-sig-line"><strong>Witness for {p2Name}</strong></p>
        <p className="ad-sig-line">Signature: ______________________________</p>
        <p className="ad-sig-line">Print Name: ______________________________</p>
        <p className="ad-sig-line">Address: ______________________________</p>
        <p className="ad-sig-line">Date: ______________________________</p>
      </div>
    </div>
  );
}
