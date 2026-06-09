import React from "react";

const useTable = ({ headings, data, isEditable, typeOfArray }) => {
  const headers = headings.map((e, index) => {
    if (e == "#"){
      return (
        <th style={{width: "40px"}}>{e}</th>
      );
    }else{
        return (
          <th>{e}</th>
        );
    }
  });

  let rows;
  if (isEditable) {
    rows = typeOfArray;
  } else {
    rows = data.map((e, index) => {
      let keys = Object.keys(e);
      return (
        <tr key={index}>
          {keys.map((event, index) => {
            return <td style={{ padding: "0.6rem" }}>{e[event]}</td>;
          })}
        </tr>
      );
    });
  }

  return { headers, rows };
};

export default useTable;
