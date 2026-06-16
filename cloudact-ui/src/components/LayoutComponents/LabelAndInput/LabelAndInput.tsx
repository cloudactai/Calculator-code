import React from "react";

type Props = {
  label: string;
  children: React.ReactChild;
  classes?: string;
  sublabel?: string;
};

const LabelAndInput: React.FC<Props> = ({
  label,
  children,
  classes,
  sublabel,
}) => {
  return (
    <div
      className={`d-flex align-items-center mx-5 ${classes} justify-content-between`}
    >
      <label htmlFor={label} className="mr-1">
        {label} {sublabel && <i>{sublabel}</i>}
      </label>
      {children}
    </div>
  );
};

export default LabelAndInput;
