import React from "react";

const CheckboxSvg = (props) => {
  let { title, icon, classNames = "matterSelect", titleClassNames = "matterName mt-2", name, checked, onClick } = props;

  return (
    <div className={classNames + (checked ? ` checked` : ``)} name={name} onClick={onClick}>
      <img src={icon} alt={title} name={name} />

      <span className={titleClassNames} name={name}>{title} {checked}</span>
    </div>
  );
};

export default CheckboxSvg;
