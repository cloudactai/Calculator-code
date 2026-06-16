import { momentFunction } from '../../../utils/moment'
import { removeNegSignAndWrapInBrackets } from '../../../pages/calculator/reports'

const DashboardTable = ({ data }) => {

    console.log('checkWhathereee',data)

    return (
        <div className="tableOuter maxHeight">
            <table className="table customGrid">
                <thead>
                    <tr>
                        {
                            data?.heading.map((element) => {
                                return <th>{element}</th>

                            })
                        }
                    </tr>
                </thead>
                <tbody>
                    {
                        data?.body?.length !== 0 ? data?.body?.map((element) => {
                            return <tr>
                                {/* {element?.task_type && <td><span>{element?.task_type}</span></td>} */}
                                {/* we add condition due date null cause in db adding a key so remove due date ==null in future */}
                                {/* {element?.task_due_date && <td><span>{element?.task_due_date == null ? 'Not available' : momentFunction.formatDate(element?.task_due_date,"DD/MM/YYYY")}</span></td>}
                                
                              {element?.client_name && <td><span>{element?.client_name}</span></td>} */}
                                {/* {element?.Matter_display_number && <td><span>{element?.Matter_display_number}</span></td>} */}
                                {element?.Count && <td><span>{element?.Count}</span></td>}
                                {element?.Balance && <td><span className="redColor">{removeNegSignAndWrapInBrackets(element?.Balance)}</span></td>}
                                {element?.task_status && <td><span>{element?.task_status == 'INPROGRESS' ? 'In progress' : ''}</span></td>}


                            </tr>
                        }) :
                            <tr>
                                <td>
                                    <span> No data Available</span>
                                </td>
                            </tr>

                    }



                </tbody>
            </table>
        </div>
    )
}

export default DashboardTable