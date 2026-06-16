import React from 'react';

const UserAgreement = () => {
    const containerStyle = {
        textAlign: 'justify',
        wordWrap: 'break-word',
        whiteSpace: 'pre-line'
    };

    return (
        <div style={containerStyle}>
            <h3>Terms of Use</h3>  

            These Terms of Use apply to <span style={{color: "#307FF4"}}>www.cloudforlawfirms.com</span> and all of its products and services for which Terms of Use are not provided separately.
            By accessing <span style={{color: "#307FF4"}}>Cloudforlawfirms.com</span>, you are indicating that you have read, understood and agreed to these Terms of Use. If you are not willing to abide by our Terms of Use, or if you have withheld any factual information about you or your organization, you may not use and must refrain from using <span style={{color: "#307FF4"}}>Cloudforlawfirms.com.</span> <br/><br/>

            <h5>Informational purposes only</h5>
            The content available on the <span style={{color: "#307FF4"}}>Cloudforlawfirms.com</span> website is for informational purposes only and should not be considered as professional advice. Furthermore, you cannot use it to operate or promote your business, or for any other personal or professional interests. Consult with experts before initiating any decision-making process. <br/><br/>

            <h5>Intellectual property</h5>
            <h5>Our Content</h5>
            Except where stated otherwise, all Content, source code, processes, designs, technologies, URLs, domain names, marks, and logos forming any part of the Websites (collectively termed as “Our Content”) are <br/>
            • Fully owned by us, our licensors, or our suppliers <br/>
            • Protected by applicable copyrights, patents, trademarks, trade secrets, and other proprietary rights, and laws. <br/><br/>

            <h6 style={{fontWeight:600}}>Unless authorized by us in writing, you can’t:</h6>
            • Copy, modify, deep-link, rent, lease, loan, sell, assign, sublicense, grant a security interest in or otherwise transfer any right or interest in Our Content. <br/>
            • Remove any proprietary notices or labels on or in Our Content. <br/>
            • Allow any other person or entity to engage in any of the foregoing. <br/><br/>

            <h5>Our Content</h5> 
            You agree that you have all the rights necessary to grant the licenses referred to in these Terms of Use. You further warrant that your Submissions are(a) complete and accurate and (b) are not fraudulent, or violate any applicable law or any right of any third party. <br/><br/>

            <h5>Third-Party Content</h5> 
            The <span style={{color: "#307FF4"}}>Cloudforlawfirms.com</span> website may contain links to external websites and other materials provided to us by third parties. If you are using such functionality, you are allowing us to access, route and transmit to you the applicable Third Party Content. <br/><br/>
            Third-Party Content may be bound and protected by applicable copyrights, trademarks, patents, trade secrets or other proprietary rights and laws. You don’t have any right, title or interest in or to this Third Party Content except for the limited right as set out in these Terms of Use.
            We are not endorsing and cannot be held responsible for any Third Party Content. You are using all the Third Party Content at your own risk and bound by the terms, conditions, and policies applicable to them.
           <br/> 
           <br/>

           <h5>Open Source</h5> 
   
            <span style={{color: "#307FF4"}}> {""}Cloudforlawfirms.com</span> and its services may consist of some open-source modules or components. We have their license for use and distribution under applicable open-source licenses. Their use is governed by and subject to the terms and conditions of the applicable open-source license. <br/><br/>
            <h5 style={{fontWeight:600}}>User Account, Password, and Security</h5>
            If you require opening an account to access any of the Site features, you have to complete the registration process by providing us with current, complete and accurate information as mentioned in the applicable registration form. You also have to decide on a username and password. You are solely responsible for keeping your password and account confidential. Furthermore, you are completely responsible for any and all activities occurring in your account. You agree to notify <span style={{color: "#307FF4"}}>Cloudforlawfirms.com</span> immediately of any unauthorized activity in your account or any other breach of security. <span style={{color: "#307FF4"}}>Cloudforlawfirms.com</span> will not be held responsible for any loss as a result of someone else using your password or account, either with or without your knowledge. However, you could be held liable for losses incurred by <span style={{color: "#307FF4"}}>Cloudforlawfirms.com</span> or another party due to the unauthorized use of your account or password. You are not allowed to access any other account, without the written permission of the account holder.
        </div>
    );
}

export default UserAgreement;
