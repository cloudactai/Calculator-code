import React from "react";

const TableHeading = ({ headings }) => {
  return (
    <thead>
      <tr>
        {headings.map((e, key) => {
          return (
            <th key={key} key={key}>
              {e}
            </th>
          );
        })}
      </tr>
    </thead>
  );
};

export default TableHeading;
