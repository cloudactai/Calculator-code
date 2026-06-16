import { Col, Row } from 'react-bootstrap';
import BorderLessInput from '../shared/BorderLessInput';


const PageHeaders = ({formID,formName,pageNumber,courtFileNumber}) => {

    return (
        <div class="row page-header middle-center ">
            <div class="col-2 p-0 text-center">{formID}</div>
            <div class="col-3 text-left">{formName}</div>
            <div class="col-4 text-left">{`(page ${pageNumber})`}</div>
            <div class="col-3 text-center">
                <input type="text" class="custom-input-control border-bottom p-0 text-center" id="at" name="at" value={`${courtFileNumber}`} />
                <span class="text-nowrap">Court File Number</span>
            </div>
            <div class="row">
                <div class="seperator-light"></div>
            </div>
        </div>
    )

}


export default PageHeaders;


