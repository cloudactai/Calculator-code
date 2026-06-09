import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import PropTypes from "prop-types";
import * as React from "react";

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <>{children}</>
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `full-width-tab-${index}`,
    "aria-controls": `full-width-tabpanel-${index}`,
  };
}

export default function FullWidthTabs({
  children,
  activeTabNumber,
  changeTabNumber,
}) {
  const theme = useTheme();
  const handleChange = (event, newValue) => {
    changeTabNumber(newValue);
  };

  return (
    <Box>
      <Tabs value={activeTabNumber} onChange={handleChange} textColor="inherit" variant="fullWidth" aria-label="full width tabs example">
        <Tab label="All" {...a11yProps(0)}/>
        <Tab label="In Progress" {...a11yProps(0)}/>
        <Tab label="Approved"{...a11yProps(1)}/>
      </Tabs>
      {children.map((e, index) => {
        return (
          <TabPanel key={index} value={activeTabNumber} index={index} dir={theme.direction}>{e}</TabPanel>
        );
      })}
    </Box>
  );
}
