import * as React from "react";
import Typography from "@mui/material/Typography";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import { Link } from "react-router-dom";

function handleClick(event) {
  event.preventDefault();
  console.info("You clicked a breadcrumb.");
}

export default function BasicBreadcrumbs({ options, currentPage }) {
  return (
    <div className="my-4 mx-5" role="presentation" onClick={handleClick}>
      <Breadcrumbs aria-label="breadcrumb">
        {options.map((e, index) => (
          <Link key={index}
            className="heading-5"
            underline="hover"
            color="inherit"
            to={e.link}
          >
            {e.option}
          </Link>
        ))}
        <div className="heading-5">{currentPage}</div>
      </Breadcrumbs>
    </div>
  );
}
