import React, { useEffect } from "react";
import '../../../assets/css/pages/drawer.css'

const CustomDrawer = ({ isVisible, onClose, children, title }) => {

    return (
        <div className="offcanvas customDrawer" tabindex="-1" id="offcanvasRight" aria-labelledby="offcanvasRightLabel">
            <div className="offcanvas-header header">
                <h5 className="offcanvas-title" id="offcanvasExampleLabel">{title}</h5>
                <button type="button" className="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
            </div>
            <div className="offcanvas-body">
                {children}
            </div>
        </div>
    )
}

export default CustomDrawer;