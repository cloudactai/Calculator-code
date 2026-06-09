import React from 'react'
import { Table } from "react-bootstrap";

import folder_outline from "../../../assets/images/folder_outline.svg";

const AllDocuments = ({
    dirState,
    handleDirClick,

}) => {
    return (
        <div className="docs-container">
            <div className="documents-table">
                <Table
                    hover
                    className="reports-table reports-table-primary"
                >
                    <thead>
                        <tr>
                            <th>Folder</th>
                            <th>Created On</th>
                            <th>Type</th>
                            <th>Status</th>
                            {/* <th>Actions</th> */}
                        </tr>
                    </thead>
                    <tbody>

                        {dirState.dirStack[dirState.dirStack.length - 1].contents && dirState.dirStack[dirState.dirStack.length - 1].contents.map((dir, index) => (
                            <tr key={index}>
                                <td className="folder" onClick={() => handleDirClick(dir)}>
                                    <span className="folder-icon" style={{ backgroundImage: `url(${folder_outline})` }}></span>
                                    <span className="folder-name">{dir.title}</span>
                                </td>
                                <td>{dir.created}</td>
                                <td>{dir.type}</td>
                                <td>
                                    <span onClick={() => handleDirClick(dir)} className="statusBadge">Open</span>
                                </td>
                                {/* <td>
                                    <span onClick={() => handleDirClick(dir)} className="btn btn-icon btn-outline-primary  btn-sm mr-2"><i class="fa-solid fa-trash"></i></span>
                                    
                                </td> */}
                            </tr>
                        ))}

                    </tbody>
                </Table>
            </div>
        </div>
    )
}

export default AllDocuments