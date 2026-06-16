import React from "react";
import { Table } from "react-bootstrap";
import { useState } from "react";
import axios from "../../../utils/axios";
import toast from "react-hot-toast";

import folder_outline from "../../../assets/images/folder_outline.svg";
import { getUserRole } from "../../../utils/helpers";

const AllFolders = ({ dirState, handleDirClick }) => {
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [editedFolderName, setEditedFolderName] = useState("");

  const startRenaming = (folder) => {
    setEditingFolderId(folder.folder_id || folder.id);
    setEditedFolderName(folder.title);
  };

  const cancelRename = () => {
    setEditingFolderId(null);
    setEditedFolderName("");
  };

  const saveRename = async (folder) => {
    const folderId = folder.folder_id || folder.id;
    if (!editedFolderName.trim()) return;

    try {
      await axios.put(`/rename_folder/${folderId}`, {
        title: editedFolderName,
      });

      folder.title = editedFolderName; // update UI immediately
      setEditingFolderId(null);
      setEditedFolderName("");
      toast.success("Folder renamed successfully");
    } catch (err) {
      console.error("Rename folder failed:", err);
      toast.error("Something went wrong");
    }
  };

  const handleDelete = async (folder) => {
    const folderId = folder.folder_id || folder.id;
    let user_info = getUserRole();

    if (
      !window.confirm(`Delete folder "${folder.title}" and all its contents?`)
    )
      return;

    try {
      await axios.delete(
        `/delete_folder/${folder.sid}/${user_info[0].short_firmname}/${folder.matter_id}/${folderId}`
      );
      toast.success("Folder deleted successfully");
      // setFolders(prev => prev.filter(f => (f.folder_id || f.id) !== folderId));
    } catch (err) {
      console.error("Delete folder failed:", err);
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="docs-container">
      <div className="documents-table">
        <Table hover className="reports-table reports-table-primary">
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
            {dirState &&
              dirState.map((folder, index) => (
                <tr key={index}>
                  <td className="folder" onClick={() => handleDirClick(folder)}>
                    <span
                      className="folder-icon"
                      style={{ backgroundImage: `url(${folder_outline})` }}
                    ></span>

                    {editingFolderId === (folder.folder_id || folder.id) ? (
                      <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <input
                        value={editedFolderName}
                        onChange={(e) => setEditedFolderName(e.target.value)}
                        onBlur={() => {
                          if (editedFolderName.trim() !== (folder.title || "").trim()) {
                            saveRename(folder);
                          } else {
                            cancelRename();
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveRename(folder);
                          if (e.key === "Escape") cancelRename();
                        }}
                        autoFocus
                        className="form-control d-inline w-auto"
                      />
                      <i
                        className="fas fa-check text-success"
                        style={{ cursor: "pointer", fontSize: 14 }}
                        onClick={() => saveRename(folder)}
                        title="Save"
                      ></i>
                      <i
                        className="fas fa-times text-danger"
                        style={{ cursor: "pointer", fontSize: 14 }}
                        onClick={cancelRename}
                        title="Cancel"
                      ></i>
                    </div>
                    
                    ) : (
                      <>
                        <span className="folder-name">{folder.title}</span>
                        {(folder.folder_id || folder.id) !== "pdf" && (
                          <>
                            <i
                              className="fas fa-pen mx-2"
                              style={{ cursor: "pointer", fontSize: 14 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                startRenaming(folder);
                              }}
                            ></i>
                            <i
                              className="fas fa-trash-alt text-danger"
                              style={{ cursor: "pointer", fontSize: 14 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(folder);
                              }}
                            ></i>
                          </>
                        )}
                      </>
                    )}
                  </td>

                  <td>{folder.created}</td>
                  <td>{folder.type}</td>
                  <td>
                    <span
                      onClick={() => handleDirClick(folder)}
                      className="statusBadge"
                    >
                      Open
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default AllFolders;
