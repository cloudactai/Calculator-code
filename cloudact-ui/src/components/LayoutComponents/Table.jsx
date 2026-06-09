import React from "react";

const Table = ({ headings, data }) => {
  return (
    <table>
      <thead className="heading_row">
        <tr>{headings}</tr>
      </thead>
      <tbody>{data}</tbody>
    </table>
  );
};

export default Table;
