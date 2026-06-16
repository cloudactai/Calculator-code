import React from "react";
import { Link } from "react-router-dom";

const Menu = ({ open, menuList }) => {
  return (
    <div className={`${!open && "hide"} dropdownList`}>
      {menuList.map((e) => {
        // return e.option === "divider" ? (<hr className="line" />) : (<Link className="py-3 px-4" to={e.link}>{e.option}</Link>);
        return e.option === "divider" ? ('') : (<Link to={e.link}>{e.option}</Link>);
      })}
    </div>
  );
};

export default Menu;
