import React, { useEffect, useState } from "react";
import { Document, Page } from "react-pdf";
import { Rnd } from "react-rnd";
import Select from "react-select";
import Layout from "../../components/LayoutComponents/Layout";
import { useSelector } from "react-redux";
import "react-resizable/css/styles.css";
import "../../components/FormPages/forms/App.css";
import ModernToolbar from "../../components/FormPages/forms/newComponents/ModernToolbar";
import axios from "../../utils/axios";
import { toast } from "react-hot-toast";
import { FormsArray } from "../../utils/matterData/MatterFormData";

const FormMapper = () => {
  const [fields, setFields] = useState([]);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.5);
  const [selectedFields, setSelectedFields] = useState({});
  const [options, setOptions] = useState({});
  const [concatenatedValue, setConcatenatedValue] = useState("");
  const [selectedForm, setSelectedForm] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [jsonData, setJsonData] = useState(null);
  const [data, setData] = useState(null);
  const { response } = useSelector((state) => state.userProfileInfo);
  const [loading, setLoading] = useState(false); // Track loading state
  const [forms, setForms] = useState([]);
  const [calculationType, setCalculationType] = useState("sum");
  const [sidebarTab, setSidebarTab] = useState("mapping");
  const [selectedFieldOrder, setSelectedFieldOrder] = useState([]);
  const [differenceSelectionStage, setDifferenceSelectionStage] =
    useState("source");
  const [subtractFieldOrder, setSubtractFieldOrder] = useState([]);
  const [factor, setFactor] = useState(1);
  const [selectedProvince, setSelectedProvince] = useState("ON");
  const [provinceOptions, setProvinceOptions] = useState([]);
  const [fieldFormat, setFieldFormat] = useState("text");
  const provinceNameMap = {
    AB: "Alberta (AB)",
    BC: "British Columbia (BC)",
    MB: "Manitoba (MB)",
    NB: "New Brunswick (NB)",
    NL: "Newfoundland and Labrador (NL)",
    NS: "Nova Scotia (NS)",
    NT: "Northwest Territories (NT)",
    NU: "Nunavut (NU)",
    ON: "Ontario (ON)",
    PE: "Prince Edward Island (PE)",
    QC: "Quebec (QC)",
    SK: "Saskatchewan (SK)",
    YT: "Yukon (YT)",
  };

  const fetchFormPdf = async (formName) => {
    try {
      const response = await axios.get(`/fetch-pdf?fileName=${formName}.pdf`, {
        responseType: "blob",
      });
      const pdfBlob = new Blob([response.data], { type: "application/pdf" });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setPdfUrl(pdfUrl);
    } catch (error) {
      console.error("Error fetching the PDF:", error);
    }
  };

  const fetchFormJson = async (jsonName) => {
    try {
      const response = await axios.get(`/fetch-json?fileName=${jsonName}.json`);
      setJsonData(response.data.staticFields);
    } catch (error) {
      console.error("Error fetching the JSON:", error);
    }
  };

  const fetchProvinces = async () => {
    try {
      const res = await axios.get("/get-form-provinces");
      const options = res.data.data.map((prov) => ({
        label: provinceNameMap[prov.province] || prov.province,
        value: prov.province,
      }));

      setProvinceOptions(options);

      if (options.length > 0 && !selectedProvince) {
        setSelectedProvince(options[0].value);
      }
    } catch (error) {
      console.error("Error fetching provinces:", error);
      toast.error("Failed to load provinces");
    }
  };

  useEffect(() => {
    fetchProvinces();
  }, []);

  const handleSetCalculatedField = () => {
    const selected = selectedFieldOrder
      .map((id) => fields.find((f) => f.id === id))
      .filter(Boolean);

    if (selected.length < 2) {
      toast.error("Select at least one target and one source field.");
      return;
    }

    const targetField = selected[0];
    const sourceFieldIds = selected.slice(1).map((f) => f.id);
    // let customCalculationType = calculationType; // fallback to default

    // if (calculationType === "difference") {
    //   customCalculationType = "sum";
    // } else if (calculationType === "divide") {
    //   customCalculationType = "multiply";
    // }
    const updatedFields = fields.map((field) => {
      if (field.id === targetField.id) {
        return {
          ...field,
          isCalculated: true,
          calculationType: calculationType,
          sourceFields: sourceFieldIds,
          ...(calculationType === "subtract" && {
            subtractFields: subtractFieldOrder,
          }),
          ...(calculationType === "multiply" && {
            isDerived: true,
            calculationValue: factor,
          }),
          ...(calculationType === "divide" && {
            isDerived: true,
            calculationValue: factor,
          }),
        };
      }
      return field;
    });

    setFields(updatedFields);
    toast.success("Calculated field set!");
  };

  useEffect(() => {
    if (selectedForm) {
      setLoading(true);
      Promise.all([
        fetchFormPdf(selectedForm),
        fetchFormJson(selectedForm),
        fetch(`/documents/data.json`).then((response) => response.json()),
      ])
        .then(([_, __, data]) => {
          setData(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error loading form data:", error);
          setLoading(false);
        });
    }
  }, [selectedForm]);

  useEffect(() => {
    const generateOptions = (obj) => {
      let categories = {};

      const processValue = (value, path) => {
        if (Array.isArray(value)) {
          return value.flatMap((item, index) =>
            processValue(item, `${path}[${index}]`)
          );
        } else if (typeof value === "object" && value !== null) {
          return Object.entries(value).flatMap(([key, val]) =>
            processValue(val, path ? `${path}.${key}` : key)
          );
        } else {
          return [
            {
              label: path,
              value: path,
              type: "simple",
              simpleValue: value,
            },
          ];
        }
      };

      Object.entries(obj).forEach(([categoryKey, categoryData]) => {
        categories[categoryKey] = processValue(categoryData, categoryKey);
      });

      return categories;
    };

    if (data) {
      setOptions(generateOptions(data));
    }
  }, [data]);

  useEffect(() => {
    if (jsonData) {
      setFields(jsonData);
      localStorage.setItem("jsonData", JSON.stringify(jsonData));
      localStorage.setItem("fields", JSON.stringify(jsonData));
    }
  }, [jsonData]);

  useEffect(() => {
    localStorage.setItem("fields", JSON.stringify(fields));
  }, [fields]);

  useEffect(() => {
    const newValue = concatenateObjectValues(selectedFields);
    setConcatenatedValue(newValue);
  }, [selectedFields]);

  useEffect(() => {
    const fetchForms = async () => {
      let userProvince = selectedProvince;
      // if (typeof userProvince === "string") {
      //   userProvince = userProvince.replace(/^"(.*)"$/, "$1");
      // }
      try {
        const formsArrayData = await FormsArray(userProvince, null, true);
        setForms(formsArrayData[0].forms);
      } catch (error) {
        console.error("Error fetching forms:", error);
        setForms([]);
      }
    };

    fetchForms();
  }, [selectedProvince]);

  const handleChange = (category, selectedOptions) => {
    setSelectedFields((prevSelectedFields) => ({
      ...prevSelectedFields,
      [category]: selectedOptions,
    }));
  };

  function concatenateObjectValues(obj) {
    return Object.entries(obj)
      .flatMap(([category, options]) => options.map((option) => option.value))
      .join(", ");
  }

  const handleFieldSelection = (event, field) => {
    event.stopPropagation();

    if (sidebarTab === "mapping") {
      setFields((prevFields) =>
        prevFields.map((f) => ({
          ...f,
          selected: f.id === field.id,
        }))
      );
      return;
    }

    // Toggle selected status visually
    setFields((prevFields) =>
      prevFields.map((f) =>
        f.id === field.id ? { ...f, selected: !f.selected } : f
      )
    );

    const isAlreadySelected = selectedFieldOrder.includes(field.id);
    const isAlreadySubtract = subtractFieldOrder.includes(field.id);

    // Target field logic: if it has pre-existing mappings
    if (field.isCalculated) {
      const initialSource = field.sourceFields || [];
      const initialSubtract = field.subtractFields || [];

      // Set selectedFieldOrder: target + unique source IDs
      setSelectedFieldOrder([
        field.id,
        ...initialSource.filter((id) => id !== field.id),
      ]);

      // Set subtractFieldOrder if applicable
      setSubtractFieldOrder(initialSubtract);

      return;
    }

    // Difference mode: handle source/subtract split
    if (sidebarTab === "calculation" && calculationType === "subtract") {
      if (differenceSelectionStage === "source") {
        if (isAlreadySelected) {
          setSelectedFieldOrder((prev) => prev.filter((id) => id !== field.id));
        } else {
          setSelectedFieldOrder((prev) => [...new Set([...prev, field.id])]);
        }
      } else {
        if (isAlreadySubtract) {
          setSubtractFieldOrder((prev) => prev.filter((id) => id !== field.id));
        } else {
          setSubtractFieldOrder((prev) => [...new Set([...prev, field.id])]);
        }
      }
    } else {
      if (isAlreadySelected) {
        setSelectedFieldOrder((prev) => prev.filter((id) => id !== field.id));
      } else {
        if (["multiply", "divide"].includes(calculationType)) {
          // Only allow one target and one source field max
          if (selectedFieldOrder.length === 0) {
            setSelectedFieldOrder([field.id]);
          } else if (selectedFieldOrder.length === 1) {
            setSelectedFieldOrder([...selectedFieldOrder, field.id]);
          } else {
            toast.error("Only one source field allowed for multiply/divide.");
          }
        } else {
          setSelectedFieldOrder((prev) => [...new Set([...prev, field.id])]);
        }
      }
    }
  };

  const handleEditField = (id, value) => {
    setFields((prevFields) =>
      prevFields.map((field) =>
        field.id === id ? { ...field, bind: value } : field
      )
    );
  };

  const handleEditCheckbox = (id, value) => {
    // console.log(value);
    let newValue = value;
    if (value === true || value === "true") {
      newValue = "checked";
    } else {
      newValue = "unchecked";
    }
    // console.log("newValue", newValue);
    setFields((prevFields) =>
      prevFields.map((field) =>
        field.id === id ? { ...field, bind: newValue } : field
      )
    );
  };

  const handleSaveJson = async () => {
    if (!pdfUrl || !fields) return;

    try {
      const dataToSave = fields;
      const formName = selectedForm.replace(".pdf", "");

      const response = await axios.post("/upload-json", {
        file_name: formName,
        data: { staticFields: dataToSave },
      });

      if (response.data.success) {
        toast.success("JSON saved successfully!");
      } else {
        toast.error("Failed to save JSON");
      }
    } catch (error) {
      toast.error("Error saving JSON");
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const clearAllSelections = () => {
    setSelectedFields({});
    setSelectedFieldOrder([]);
    setSubtractFieldOrder([]);
    setFields((prevFields) =>
      prevFields.map((field) => ({ ...field, selected: false }))
    );
  };

  const clearMapping = () => {
    const targetId = selectedFieldOrder[0]; // Preserve only the target

    setSelectedFields({});
    setSubtractFieldOrder([]);

    setFields((prevFields) =>
      prevFields.map((field) => {
        if (field.id === targetId) {
          const updatedField = { ...field };
          delete updatedField.isCalculated;
          delete updatedField.factor;
          delete updatedField.isDerived;
          delete updatedField.calculationType;
          delete updatedField.calculationValue;
          delete updatedField.sourceFields;
          delete updatedField.subtractFields;
          return {
            ...updatedField,
            selected: true,
          };
        }

        return {
          ...field,
          selected: false,
        };
      })
    );

    setSelectedFieldOrder(targetId ? [targetId] : []);
  };

  const handleMapToField = () => {
    setFields((prevFields) =>
      prevFields.map((field) => {
        if (field.selected) {
          const updatedField = {
            ...field,
            bind: concatenatedValue,
          };

          if (field.type !== "CheckBox") {
            updatedField.data_type =
              fieldFormat.value === "text" ? "text" : "number";
          }

          if (concatenatedValue.includes("theChildren")) {
            updatedField.source = "children";
            updatedField.sourceType = "theChildren";
          }

          return updatedField;
        }
        return field;
      })
    );
  };

  const getFieldHighlight = (field) => {
    if (sidebarTab === "mapping") {
      if (field.selected) {
        return "rgba(0, 123, 255, 0.5)"; // Blue for selected field in mapping tab
      }
      return "transparent";
    }

    // Find the currently selected target field (first in selectedFieldOrder)
    const targetId = selectedFieldOrder[0];
    // If this field is the selected target, highlight as target
    if (field.id === targetId) {
      return "rgba(255, 144, 0, 0.5)"; // Orange for target
    }
    if (sidebarTab === "calculation") {
      if (field.id === targetId) {
        return "rgba(255, 144, 0, 0.5)"; // Orange - Target
      } else if (selectedFieldOrder.includes(field.id)) {
        return "rgba(0, 123, 255, 0.5)"; // Blue - Source
      } else if (subtractFieldOrder.includes(field.id)) {
        return "rgba(220, 53, 69, 0.5)"; // Red - Subtract
      }
    } else {
      return field.id === targetId
        ? "rgba(255, 144, 0, 0.5)" // Orange - Target
        : "transparent"; // Blue - Default source
    }

    return "transparent";
  };

  return (
    <Layout title={`Welcome ${response.first_name} ${response.last_name}`}>
      <div>
        {loading && <div className="loader">Loading...</div>}
        <div className="form-dropdowns-inline">
          <div className="dropdown-container">
            <h3 className="mapping-dropdown-heading">Select Province:</h3>
            <Select
              options={provinceOptions}
              value={
                provinceOptions.find((opt) => opt.value === selectedProvince) ||
                null
              }
              onChange={(option) => setSelectedProvince(option?.value || "")}
              className="basic-single mapping-dropdown-drop"
              classNamePrefix="select"
              styles={{ menu: (base) => ({ ...base, zIndex: 9999 }) }}
            />
          </div>

          <div className="dropdown-container">
            <h3 className="mapping-dropdown-heading">Select Form (PDF):</h3>
            <Select
              options={forms.map((form) => ({
                value: form.docId,
                label: form.docId,
              }))}
              value={
                selectedForm
                  ? {
                      value: selectedForm,
                      label: selectedForm.replace(".pdf", ""),
                    }
                  : null
              }
              onChange={(option) => setSelectedForm(option?.value || "")}
              className="basic-single mapping-dropdown-drop"
              classNamePrefix="select"
              styles={{ menu: (base) => ({ ...base, zIndex: 9999 }) }}
            />
          </div>
        </div>

        <div className="fill-information-page panel trans">
          <div className="pBody">
            <div className="row">
              <div className={"col-md-9"}>
                <div className="page-content">
                  <div className="head d-flex justify-content-between align-items-right">
                    <div style={{ marginLeft: "auto" }}>
                      <button
                        className="btn btnPrimary"
                        onClick={handleSaveJson}
                      >
                        Save JSON
                      </button>
                    </div>
                  </div>
                  <div className="body" style={{ backgroundColor: "#e3e3e3" }}>
                    <div id="pdf-content">
                      <div className="toolbar">
                        <ModernToolbar
                          currentPage={currentPage}
                          numPages={numPages}
                          setCurrentPage={setCurrentPage}
                          setScale={setScale}
                          scale={scale}
                        />
                      </div>
                      <div
                        id="pdfContainer"
                        style={{ flex: 1, position: "relative" }}
                        onDragOver={(e) => e.preventDefault()}
                      >
                        <Document
                          file={pdfUrl}
                          onLoadSuccess={onDocumentLoadSuccess}
                        >
                          <Page
                            className="pdf-canvas"
                            pageNumber={currentPage}
                            scale={scale}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                          >
                            {fields
                              .filter((field) => field.page === currentPage)
                              .map((field) => (
                                <Rnd
                                  key={field.id}
                                  size={{
                                    width: field.width,
                                    height: field.height,
                                  }}
                                  position={{
                                    x: field.x * scale,
                                    y: field.y * scale,
                                  }}
                                  bounds="parent"
                                  disableDragging={true}
                                  enableResizing={false}
                                  style={{
                                    border: "1px solid #ff9000",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    background: "none",
                                  }}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleFieldSelection(event, field);
                                  }}
                                >
                                  <div
                                    style={{
                                      position: "relative",
                                      width: "100%",
                                      height: "100%",
                                      fontSize: field.fontSize,
                                      padding: "0",
                                      backgroundColor: getFieldHighlight(field),
                                    }}
                                  >
                                    {(field.type === "TextField" ||
                                      field.type === "TextArea") && (
                                      <textarea
                                        value={field.bind || ""}
                                        onChange={(e) =>
                                          handleEditField(
                                            field.id,
                                            e.target.value
                                          )
                                        }
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                          fontSize: "12px",
                                          border: "none",
                                          backgroundColor: "transparent",
                                          resize: "none",
                                        }}
                                      />
                                    )}
                                    {field.type === "CheckBox" && (
                                      <input
                                        id={field.id}
                                        type="checkbox"
                                        checked={field.bind === "checked"}
                                        onChange={(e) =>
                                          handleEditCheckbox(
                                            field.id,
                                            e.target.checked.toString()
                                          )
                                        }
                                        style={{
                                          width: "20px",
                                          height: "20px",
                                          cursor: "pointer",
                                          marginRight: "5px",
                                        }}
                                      />
                                    )}
                                    {field.isCalculated && (
                                      <div
                                        style={{
                                          position: "absolute",
                                          bottom: 0,
                                          left: 0,
                                          right: 0,
                                          fontSize: "10px",
                                          textAlign: "center",
                                          color: "black",
                                        }}
                                      >
                                        [{field.calculationType}]
                                      </div>
                                    )}
                                  </div>
                                </Rnd>
                              ))}
                          </Page>
                        </Document>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="page-sidebar">
                  <div className="head">Matter Data Mappings</div>
                  <div className="body">
                    <div className="tabs">
                      <div
                        style={{
                          display: "flex",
                          marginBottom: "15px",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                          overflow: "hidden",
                        }}
                      >
                        <button
                          onClick={() => setSidebarTab("mapping")}
                          className={`square-tab-button ${
                            sidebarTab === "mapping" ? "active-square-tab" : ""
                          }`}
                        >
                          Mapping
                        </button>
                        <button
                          onClick={() => setSidebarTab("calculation")}
                          className={`square-tab-button ${
                            sidebarTab === "calculation"
                              ? "active-square-tab"
                              : ""
                          }`}
                        >
                          Calculated Field
                        </button>
                      </div>

                      {sidebarTab === "mapping" && (
                        <>
                          <h3 className="mapping-dropdown-heading">
                            Concatenated Value:
                          </h3>
                          <textarea
                            value={concatenatedValue}
                            readOnly
                            style={{
                              width: "100%",
                              minHeight: "100px",
                              marginBottom: "10px",
                            }}
                          />
                          <div className="button-container">
                            <button
                              className="btn btnPrimary"
                              onClick={handleMapToField}
                            >
                              Map Field
                            </button>
                            <button
                              className="btn btnPrimary"
                              onClick={clearAllSelections}
                            >
                              Clear Mapping
                            </button>
                          </div>
                          <div key={"formatted-field"}>
                            <h3 className="mapping-dropdown">
                              {"Field Data Type"}
                            </h3>
                            <Select
                              options={[
                                { label: "Text / Number", value: "text" },
                                { label: "Formatted Number", value: "number" },
                              ]}
                              value={fieldFormat}
                              onChange={(selectedOption) =>
                                setFieldFormat(selectedOption)
                              }
                              className="basic-multi-select mapping-dropdown-drop"
                              classNamePrefix="select"
                            />
                          </div>
                          {Object.keys(options).map((category) => (
                            <div key={category}>
                              <h3 className="mapping-dropdown">{category}</h3>
                              <Select
                                isMulti
                                options={options[category].map(
                                  ({ label, value }) => ({ label, value })
                                )}
                                value={selectedFields[category] || []}
                                onChange={(selectedOptions) =>
                                  handleChange(category, selectedOptions)
                                }
                                className="basic-multi-select mapping-dropdown-drop"
                                classNamePrefix="select"
                              />
                            </div>
                          ))}
                        </>
                      )}

                      {sidebarTab === "calculation" && (
                        <>
                          {/* <h3 className="mapping-dropdown-heading">
                            Selected Fields:
                          </h3>
                          <ul style={{ paddingLeft: "20px", fontSize: "13px" }}>
                            {fields
                              .filter((f) => f.selected)
                              .map((f) => (
                                <li key={f.id}>{f.id}</li>
                              ))}
                          </ul> */}

                          <div style={{ marginTop: "10px" }}>
                            <label>Calculation Type:</label>
                            <select
                              className="form-control"
                              value={calculationType}
                              onChange={(e) => {
                                setCalculationType(e.target.value);
                                if (e.target.value === "subtract") {
                                  setDifferenceSelectionStage("source");
                                  setSelectedFieldOrder([]);
                                  setSubtractFieldOrder([]);
                                }
                              }}
                              style={{ width: "100%", marginBottom: "10px" }}
                            >
                              <option value="sum">Sum</option>
                              <option value="divide">Divide</option>
                              <option value="subtract">Subtract</option>
                              <option value="multiply">Multiply</option>
                            </select>

                            {(calculationType === "multiply" ||
                              calculationType === "divide") && (
                              <div style={{ marginBottom: "10px" }}>
                                <label>Factor:</label>
                                <input
                                  type="number"
                                  className="form-control"
                                  onChange={(e) => {
                                    const parsed = parseInt(e.target.value, 10);
                                    setFactor(isNaN(parsed) ? 1 : parsed);
                                  }}
                                  style={{ width: "100%" }}
                                />
                              </div>
                            )}

                            {calculationType === "subtract" && (
                              <div style={{ marginBottom: "10px" }}>
                                <button
                                  className={`btn ${
                                    differenceSelectionStage === "source"
                                      ? "btnDanger"
                                      : "btnPrimary"
                                  }`}
                                  onClick={() =>
                                    setDifferenceSelectionStage((prev) =>
                                      prev === "source" ? "subtract" : "source"
                                    )
                                  }
                                  style={{ width: "100%" }}
                                >
                                  {differenceSelectionStage === "source"
                                    ? "Select Subtract Fields"
                                    : "Select Source Fields"}
                                </button>
                              </div>
                            )}

                            <div
                              style={{
                                display: "flex",
                                gap: "10px",
                                marginBottom: "10px",
                              }}
                            >
                              <button
                                className="btn btnPrimary"
                                style={{ flex: 1 }}
                                onClick={handleSetCalculatedField}
                              >
                                Set Calculation
                              </button>
                              <button
                                className="btn btnPrimary"
                                style={{ flex: 1 }}
                                onClick={clearMapping}
                              >
                                Remove Calculation
                              </button>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                justifyContent: "center",
                              }}
                            >
                              <button
                                className="btn"
                                onClick={clearAllSelections}
                              >
                                Clear Selection
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FormMapper;
