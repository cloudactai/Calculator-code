import { useState } from 'react'

import { Accordion } from "react-bootstrap";
import Dropdown from "../../components/Matters/Form/Dropdown";
import { Table } from "react-bootstrap";

import financial_summary from "../../assets/images/financial_summary.svg";

const FinancialSummary = () => {
    const [viewBy, setViewBy] = useState("Year");

    const viewByList = [
        {
            name: "Year",
            value: "Year",
        },
        {
            name: "Month",
            value: "Month",
        },
    ];

    return (
        <Accordion.Item eventKey={10}>
            <Accordion.Header className="">
                <img src={financial_summary} alt="" />
                <div className="w-100 px-2" style={{ marginRight: "8%" }}>
                    <div className="d-flex justify-content-between">
                        <div>Financial summary</div>
                        <div>{30}%</div>
                    </div>
                    <div className="progress-bar"></div>
                </div>
            </Accordion.Header>
            <Accordion.Body>
                <div className="pb-20px">
                    <div className="sub-heading">Income and Expenses</div>
                    <div className="inputs-row pb-10px">
                        <div className="inputs inputs-4">
                            <label className="form-label mb-0">View by:</label>
                            <Dropdown
                                list={viewByList}
                                curListItem={viewBy}
                                handleChange={(e, li) => setViewBy(li.value)}
                            ></Dropdown>
                        </div>
                        <div className="action">
                            <button className="btn btn-link">
                                Add projected budget
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pb-50px">
                    <Table
                        hover
                        className="reports-table reports-table-primary"
                    >
                        <thead>
                            <tr>
                                <th colSpan="5">Income and expenses report</th>
                                <th colSpan="2">Client</th>
                                <th colSpan="2">Opposing Party</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan="5">Year</td>
                                <td className="fw-bold" colSpan="2">
                                    2023
                                </td>
                                <td className="fw-bold" colSpan="2">
                                    2024
                                </td>
                            </tr>
                            <tr>
                                <td colSpan="5">Type of budget</td>
                                <td className="fw-bold">Actual</td>
                                <td className="fw-bold">Projected</td>
                                <td className="fw-bold">Actual</td>
                                <td className="fw-bold">Projected</td>
                            </tr>
                            <tr>
                                <td colSpan="5">Total Income</td>
                                <td>7,580</td>
                                <td>8,000</td>
                                <td>1,582</td>
                                <td>2,000</td>
                            </tr>
                            <tr>
                                <td colSpan="5">Total Expenses</td>
                                <td>-3,641</td>
                                <td>-4,000</td>
                                <td>-550</td>
                                <td>-600</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="5">Net</td>
                                <td>3,939</td>
                                <td>4,000</td>
                                <td>1,032</td>
                                <td>1,400</td>
                            </tr>
                        </tfoot>
                    </Table>
                </div>

                <div className="pb-50px">
                    <Table hover className="reports-table">
                        <thead>
                            <tr>
                                <th colSpan="5">Income</th>
                                <th colSpan="2"></th>
                                <th colSpan="2"></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan="5">Employment Income</td>
                                <td>7,580</td>
                                <td>8,000</td>
                                <td>1,582</td>
                                <td>2,000</td>
                            </tr>
                            <tr>
                                <td colSpan="5">Commissions, tips and bonuses</td>
                                <td>-3,641</td>
                                <td>-4,000</td>
                                <td>-550</td>
                                <td>-600</td>
                            </tr>
                            <tr>
                                <td colSpan="5">Self employment income</td>
                                <td>-3,641</td>
                                <td>-4,000</td>
                                <td>-550</td>
                                <td>-600</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="5">Total</td>
                                <td>3,939</td>
                                <td>4,000</td>
                                <td>1,032</td>
                                <td>1,400</td>
                            </tr>
                        </tfoot>
                    </Table>
                </div>

                <div className="pb-50px">
                    <Table hover className="reports-table">
                        <thead>
                            <tr>
                                <th colSpan="5">Expenses</th>
                                <th colSpan="2"></th>
                                <th colSpan="2"></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan="5">Housing</td>
                                <td>7,580</td>
                                <td>8,000</td>
                                <td>1,582</td>
                                <td>2,000</td>
                            </tr>
                            <tr>
                                <td colSpan="5">Transportation</td>
                                <td>-3,641</td>
                                <td>-4,000</td>
                                <td>-550</td>
                                <td>-600</td>
                            </tr>
                            <tr>
                                <td colSpan="5">Education</td>
                                <td>-3,641</td>
                                <td>-4,000</td>
                                <td>-550</td>
                                <td>-600</td>
                            </tr>
                            <tr>
                                <td colSpan="5">Life insurance</td>
                                <td>-3,641</td>
                                <td>-4,000</td>
                                <td>-550</td>
                                <td>-600</td>
                            </tr>
                            <tr>
                                <td colSpan="5">Medical expense</td>
                                <td>-3,641</td>
                                <td>-4,000</td>
                                <td>-550</td>
                                <td>-600</td>
                            </tr>
                            <tr>
                                <td colSpan="5">Daycare</td>
                                <td>-3,641</td>
                                <td>-4,000</td>
                                <td>-550</td>
                                <td>-600</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="5">Total</td>
                                <td>3,939</td>
                                <td>4,000</td>
                                <td>1,032</td>
                                <td>1,400</td>
                            </tr>
                        </tfoot>
                    </Table>
                </div>

                <div className="pb-50px">
                    <Table
                        hover
                        className="reports-table reports-table-primary"
                    >
                        <thead>
                            <tr>
                                <th colSpan="5">Net Family Property report</th>
                                <th colSpan="2">Client</th>
                                <th colSpan="2">Opposing Party</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan="5">Value of all property owned</td>
                                <td colSpan="2">7,580</td>
                                <td colSpan="2">8,000</td>
                            </tr>
                            <tr>
                                <td colSpan="5">
                                    Value of all debts and other liabilities
                                </td>
                                <td colSpan="2">-3,641</td>
                                <td colSpan="2">-4,000</td>
                            </tr>
                            <tr>
                                <td colSpan="5">
                                    Net Value of all property owned on date of marriage
                                </td>
                                <td colSpan="2">-3,641</td>
                                <td colSpan="2">-4,000</td>
                            </tr>
                            <tr>
                                <td colSpan="5">Value of excluded property</td>
                                <td colSpan="2">-3,641</td>
                                <td colSpan="2">-4,000</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="5">Net</td>
                                <td colSpan="2">3,939</td>
                                <td colSpan="2">4,000</td>
                            </tr>
                        </tfoot>
                    </Table>
                </div>

                <div className="pb-50px">
                    <Table hover className="reports-table">
                        <thead>
                            <tr>
                                <th colSpan="5">Property Owned</th>
                                <th colSpan="2"></th>
                                <th colSpan="2"></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan="5">Land</td>
                                <td colSpan="2">7,580</td>
                                <td colSpan="2">8,000</td>
                            </tr>
                            <tr>
                                <td colSpan="5">Vehicles</td>
                                <td colSpan="2">-3,641</td>
                                <td colSpan="2">-4,000</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="5">Total</td>
                                <td colSpan="2">3,939</td>
                                <td colSpan="2">4,000</td>
                            </tr>
                        </tfoot>
                    </Table>
                </div>

                <div className="pb-50px">
                    <Table hover className="reports-table">
                        <thead>
                            <tr>
                                <th colSpan="5">Excluded Property</th>
                                <th colSpan="2"></th>
                                <th colSpan="2"></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan="5">Inheritance</td>
                                <td colSpan="2">7,580</td>
                                <td colSpan="2">8,000</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="5">Total</td>
                                <td colSpan="2">3,939</td>
                                <td colSpan="2">4,000</td>
                            </tr>
                        </tfoot>
                    </Table>
                </div>
            </Accordion.Body>
        </Accordion.Item>
    )
}

export default FinancialSummary