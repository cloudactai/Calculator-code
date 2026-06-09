import { Col, Row } from 'react-bootstrap';
import BorderLessInput from '../shared/BorderLessInput';


const PageFooters = ({ footerName,onPage,totalPages }) => {

    return (
        <div class="row page-footer">
            <div class="row">
                <div class="col-6 text-left">{footerName}</div>
                <div class="col-6 text-right">{`Page ${onPage} of ${totalPages}`}</div>
            </div>
        </div>
    )

}


export default PageFooters;











