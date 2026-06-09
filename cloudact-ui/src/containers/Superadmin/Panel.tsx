import React from 'react'
import { useHistory } from 'react-router';
import styles from "../../pages/superadmin/superadmin.module.css"
import {PanelProps} from "../../pages/superadmin/superadmininterface";

const Panel: React.FC<PanelProps> = ({
    icon,
    title,
    activeCount,
    activeLabel,
    inactiveCount,
    inactiveLabel,
    route
  }) => {
    const history = useHistory();
  
    return (
      <div className="col-md-3">
        <div className="panel panelH-min mb-4" style={{ minHeight: '300px' }}>
          <div className="pHead">
            <span className="h5">
              {icon}
              {title}
            </span>
            <div className="control">
              <button
                className="btn btnPrimary"
                type="button"
                onClick={() => history.push(route)}
              >
                View
              </button>
            </div>
          </div>
  
          <div className={styles["stats"]}>
            {/* Active Users/Subscribers/Loads */}
            <div className={styles["active-users"]}>
              <div className={styles["active-circle"]}></div>
              <div className={styles["count"]}>{activeCount}</div>
              <div className={styles["label"]}>{activeLabel}</div>
              <div className={styles["expand-icon"]}>
                {/* Expand Icon */}
                {/* <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 19L19 6M19 6V18.48M19 6H6.52" stroke="#171D34" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg> */}
              </div>
            </div>
  
            {/* Inactive Users/Subscribers/Loads */}
            <div className={styles["inactive-users"]}>
              <div className={styles["inactive-circle"]}></div>
              <div className={styles["count"]}>{inactiveCount}</div>
              <div className={styles["label"]}>{inactiveLabel}</div>
              <div className={styles['expand-icon']}>
                {/* <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 19L19 6M19 6V18.48M19 6H6.52" stroke="#171D34" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

export default Panel
