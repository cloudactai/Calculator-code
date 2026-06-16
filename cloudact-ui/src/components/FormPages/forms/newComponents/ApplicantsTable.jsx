import { Col, Row } from 'react-bootstrap';
import BorderLessInput from '../shared/BorderLessInput';


const ApplicationTable = ({ heading, data, onChange, type = '', judgeSide, applicant, respondent, fillFormData }) => {


  let applicationsData = []

  let applicationsDataOne = []

  if (applicant) {
    applicationsData = {
      name_address: data?.applicant?.fullLegalName + ' , ' + data?.applicant?.address,
      phone_email: data?.applicant?.phoneAndFax + ' , ' + data?.applicant?.email,
      lawyer_address: data?.applicantsLawyer?.fullLegalName + ' , ' + data?.applicantsLawyer?.address,
      lawyer_phone_email: data?.applicantsLawyer?.phoneAndFax + ' , ' + data?.applicantsLawyer?.email,
    }

    applicationsDataOne = {
      name_address: data?.applicant?.fullLegalName + ' , ' + data?.applicant?.address + ' , ' + data?.applicant?.phoneAndFax + ' , ' + data?.applicant?.email,
      lawyer_address: data?.applicantsLawyer?.fullLegalName + ' , ' + data?.applicantsLawyer?.address + ' , ' + data?.applicantsLawyer?.phoneAndFax + ' , ' + data?.applicantsLawyer?.email,
    }
  }

  if (respondent) {
    applicationsData = {
      name_address: (data?.respondent?.fullLegalName + ' , ' + data?.respondent?.address) || '',
      phone_email: (data?.respondent?.phoneAndFax + ' , ' + data?.respondent?.email) || '',
      lawyer_address: (data?.respondentsLawyer?.fullLegalName + ' , ' + data?.respondentsLawyer?.address) || '',
      lawyer_phone_email: (data?.respondentsLawyer?.phoneAndFax + ' , ' + data?.respondentsLawyer?.email) || '',
    }

    applicationsDataOne = {
      name_address: data?.respondent?.fullLegalName + ' , ' + data?.respondent?.address + ' , ' + data?.respondent?.phoneAndFax + ' , ' + data?.respondent?.email,
      lawyer_address: data?.respondentsLawyer?.fullLegalName + ' , ' + data?.respondentsLawyer?.address + ' , ' + data?.respondentsLawyer?.phoneAndFax + ' , ' + data?.respondentsLawyer?.email,
    }
  }

  const generic = () => {
    return (
      <>
        <div className='title pb-2'>{heading}</div>

        <table style={{ width: "100%" }}>
          <tbody>
            {data?.map((item, index) => (
              <tr key={index}>
                <td className='data-group inputs'>
                  <div className="data-input">
                    <div className='label'>{item?.label}</div>
                    <input
                      type={item?.type}
                      className='custom-input-control p-0 border-0'
                      value={item?.value}
                      onChange={onChange(item?.update)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    )
  }


  return (
    <>
      {/* {type === 'two-rows' && !judgeSide && (
        <>

          <div className="fw-bolder">{heading}</div>
          {applicationsData && (
            <>
              <Col xs={6}> <div className="data-group">
                <label className='font13'>
                  Full legal name & address for service — street & number, municipality, postal code, telephone & fax numbers and e-mail address (if any).
                </label>
                <textarea
                  rows="2"
                  value={data?.applicationsData?.name_address ? data?.applicationsData?.name_address : applicationsData.name_address}
                  onChange={fillFormData(`applicationsData.name_address`)}
                ></textarea>
                <textarea
                  rows="2"
                  value={data?.applicationsData?.phone_email ? data?.applicationsData?.phone_email : applicationsData.phone_email}
                  onChange={fillFormData(`applicationsData.phone_email}`)}
                ></textarea>
              </div>

              </Col>
              <Col xs={6}>
                <div className="data-group">
                  <label className='font13'>
                    Lawyer’s name & address — street & number, municipality, postal code, telephone & fax numbers and e-mail address (if any).
                  </label>
                  <textarea
                    rows="2"
                    value={data?.applicationsData?.lawyer_address ? data?.applicationsData?.lawyer_address : applicationsData.lawyer_address}
                    onChange={fillFormData(`applicationsData.lawyer_address}`)}
                  ></textarea>
                  <textarea
                    rows="2"
                    value={data?.applicationsData?.lawyer_phone_email ? data?.applicationsData?.lawyer_phone_email : applicationsData.lawyer_phone_email}
                    onChange={fillFormData(`applicationsData.lawyer_phone_email}`)}
                  ></textarea>
                </div>

              </Col>
            </>
          )}

        </>
      )}
      {type === 'two-rows' && judgeSide && (
        <>
          {applicationsData && (
            <>
              <Row className='pb-2'>
                <Col xs={2} className='mt-5 d-flex justify-content-center' style={{ alignItems: "center" }}>
                  {applicant && (
                    <BorderLessInput
                      label={"Judge (print or type name)"}
                      type={"text"}
                      fileno
                      onChange={fillFormData}
                      update={'judge.name'}
                      value={data?.judge?.name}
                      style={{ padding: "10px 0", marginTop: "10px 0" }}
                    />
                  )}
                  {respondent && (
                    <BorderLessInput
                      label={"Date of order"}
                      type={"text"}
                      fileno
                      onChange={fillFormData}
                      update={'date_of_order.date'}
                      value={data?.date_of_order?.date}
                      style={{ padding: "10px 0", marginTop: "10px 0" }}
                    />
                  )}

                </Col>
                <Col xs={10}>
                  <div className="fw-bolder">{heading}</div>
                  <Row>
                    <Col md={6} className='pe-0'>

                      <div className="data-group" >
                        <label >
                          Full legal name & address for service — street & number, municipality,
                          postal code, telephone & fax numbers and e-mail address (if any).
                        </label>
                        <textarea
                          rows="2"
                          value={data?.applicationsData?.name_address ? data?.applicationsData?.name_address : applicationsData.name_address}
                          onChange={fillFormData(`applicationsData.name_address`)}
                        ></textarea>
                        <textarea
                          rows="2"
                          value={data?.applicationsData?.phone_email ? data?.applicationsData?.phone_email : applicationsData.phone_email}
                          onChange={fillFormData(`applicationsData.phone_email}`)}
                        ></textarea>
                      </div>
                    </Col>
                    <Col md={6} className='pe-0'>
                      <div className="data-group">
                        <label >
                          Lawyer’s name & address — street & number, municipality, postal
                          code, telephone & fax numbers and e-mail address (if any).
                        </label>
                        <textarea
                          rows="2"
                          value={data?.applicationsData?.lawyer_address ? data?.applicationsData?.lawyer_address : applicationsData.lawyer_address}
                          onChange={fillFormData(`applicationsData.lawyer_address}`)}
                        ></textarea>
                        <textarea
                          rows="2"
                          value={data?.applicationsData?.lawyer_phone_email ? data?.applicationsData?.lawyer_phone_email : applicationsData.lawyer_phone_email}
                          onChange={fillFormData(`applicationsData.lawyer_phone_email}`)}
                        ></textarea>
                      </div>
                    </Col>
                  </Row>


                </Col>
              </Row>
            </>
          )}

        </>
      )}
      {type === 'one-row' && (
        <>
          <div className="fw-bolder">{heading}</div>
          <Col xs={6}> <div className="data-group">
            <label>
              Full legal name & address for service — street & number, municipality, postal code, telephone & fax numbers and e-mail address (if any).
            </label>
            <textarea rows="3" value={applicationsData.name_address}
            ></textarea>

          </div>

          </Col>
          <Col xs={6}>
            <div className="data-group">
              <label>
                Lawyer’s name & address — street & number, municipality, postal code, telephone & fax numbers and e-mail address (if any).
              </label>
              <textarea rows="3" value={applicationsData.lawyer_address}
              ></textarea>

            </div>

          </Col>
        </>
      )}
       */}
       {type === '' && (
        generic()
      )}
    </>
  );
}

export default ApplicationTable;
