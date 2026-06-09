import React from "react";
import InputCustom from "../../components/InputCustom";

interface SectionD {
  CertifyName: string;
  Date: string;
  Signature: string;
}

interface SignatureProps {
  sectionD: SectionD;
  setSectionD: (section: SectionD) => void;
  SignatureOf: string;
}

const Signature: React.FC<SignatureProps> = ({ sectionD, setSectionD, SignatureOf }) => {
  return (
    <>
      <div>
        <span className="d-flex justify-content-between align-items-center heading-5">
          I,&nbsp;&nbsp;{" "}
          <input
            type="text"
            value={sectionD.CertifyName}
            onChange={(e) =>
              setSectionD({ ...sectionD, CertifyName: e.target.value })
            }
            style={{ fontSize: "1.6rem", padding: "0.5rem" }}
          />
        </span>

        <span className="heading-5 mt-4">
          certify that the foregoing information is complete and correct to the
          best of my knowledge.
        </span>
      </div>
      <InputCustom
        handleChange={(e) => setSectionD({ ...sectionD, Date: e.target.value })}
        type="date"
        margin="1.8rem 0rem"
        value={sectionD.Date}
      />
      <InputCustom
        label={SignatureOf}
        handleChange={(e) =>
          setSectionD({ ...sectionD, Signature: e.target.value })
        }
        type="text"
        margin="1.8rem 0rem"
        value={sectionD.Signature}
      />
    </>
  );
};

export default Signature;
