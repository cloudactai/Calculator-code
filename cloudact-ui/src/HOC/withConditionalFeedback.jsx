import React from 'react'
import Loader from '../components/Loader';

const withConditionalFeedback = ({loadingMsg, noDataMsg, dataEmptyMsg}) => (ComponentEl) => (props) => {
    
    if (props.isLoading) return <Loader isLoading={props.isLoading} loadingMsg={loadingMsg || "Loading data."} />;
    if (!props.data) return <div>{noDataMsg || "No data loaded yet."}</div>;
    if (!props.data.length) return <div>{dataEmptyMsg || "Data is empty."}</div>;
    
    
    return <ComponentEl {...props}/>
}

export default withConditionalFeedback