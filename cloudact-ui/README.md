# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.


## CloudAct Frontend
This project is made on top of React, TypeScript, Redux, Bootstrap, React Material UI, SASS/SCSS.

It is an tax accounting software used to managing clients, roles and law firms, creating new users, changing password, sending email notifications,  building reports, calculating taxes and support for parties while splitting, creating tasks.

### Overview
Everything in the app works to the basis of SID (Subscriber ID). All the data from API is fetched based on SID and changed on frontend when SID is changed. SID is the law firm number and UID is the user in the law firm. One law firm (SID) can have as many users (UID).

Users (UID) can have one of the three roles 

1. ADMIN: This role has access to all the features like Onboarding process (Setup Wizard), settings page, creating tasks, generate reports, manage users, review forms. Admin can assign the tasks to REVIEWER and PREPARER.   
2. REVIEWER: This role can generate reports, review forms but cannot manage users, does not have access to settings page, creating tasks, onboarding process. 
3. PREPARER: This role can generate reports, review forms but cannot manage users, does not have access to settings page, creating tasks, onboarding process. It is quite similar to REVIEWER.

The main responsibilities of the PREPARER and REVIEWER is to fill and complete the tasks (compliance forms, yearly, quarterly, monthly checklist) as tasks need signature of both PREPARER and REVIEWER.

### `Dashboard`: 
Dashboard is made by using components(component which is reuseable and needs data from other components.), containers (component which fetching data from api and is not dependent on any other state. It is independent component).

- It is the default page of the application when the user is logged in. When user is logged in means the cookies in the browser has user Information such as allUserInfo, currentUserRole.

- Dashboard page shows the number of tasks, reports and calculations. 

### `Sidenav`: 
Sidenav contains the links such as Dashboard, reports, tasks, family law calculator, operational dashboard, settings and logout. 

- For showning or hiding the links we use the accessPages redux state. We can hide or show the links by changing in the DB for a particular user's ID (UID). This access page API is fetching when user enters the dashboard route.

### `Navbar or InfoHeader`: 
Navbar shows the name of current User from currentUserRole cookies, the profile picture, the current law firm, current user role and user profile page.

- We can change the roles for the user to (ADMIN, PREPARER, REVIEWER). All the roles are in allUserInfo cookies. When the user, role or law firm is changed, then everything changes as the sid or law firm ID (Subscriber ID) or uid (user ID) will change. All the API's data is fetched using SID and the application is refreshed to load the new data.

### `Profile`:
Profile page is for changing the user personal and profile Information like profile picture, Name, job title, to change password and to enable or disable MFA.

### `Reports`:
Reports link on sidebar has two child links.

- Law Society compliance reports: This page is for generating new reports.

- Report history: This page is for showning and downloading the reports which are generated. You can also bulk download the reports, search for a particular report name.

### `Tasks`:
Tasks are the forms which can be generated on monthly, yearly or quarterly basis.

Four types are forms can be created:
1. Compliance Forms: These forms are government forms in which company Info is automatically shown using in companyInfo redux state. These forms are shown based on the province and region of the particular user role (currentUserRole in Cookies). 

2. Monthly Checklist: This checklist is meant to be generated monthly. These forms are of three types Trust Monthly, General Monthly, Credit Monthly.

3. Quarterly Checklist: In development. Separate route created in Routes.jsx.

4. Yearly Checklist: In development. Separate route created in Routes.jsx.

### `Calculator`:
Calculator is for calculating the supports each party would be giving or receiving depending on this income, dependents, credits and benefits. This page includes the existing calculations and the new calculations we want to create. All the values are saved in the existing calculations.

This calculator is built using the excel sheets provided. The logic from excel sheets is coded.

- All the values for calculation are stored in useRef. Initially everything was stored in useState, but useState is async in nature. It did not update the values instantanously. 

- On the calculator starting screen, we can make calculator depending on which type of support we want to find out. Child Support, Spousal Support or both (Child and spousal support).

- Calculator has four main scenerios. These scenerios are according to the values we enter in on screen 1 (Background and Children), screen 2 (Income and Taxes). All the final results of the calculations and calculation report are shown on the last screen (Result). The four scenerios in calculator are:

In all the cases below, low, mid and high conditions are calculated. Low calculations are the lowest amount one party can give to other party, high is the maximum amount one party can give to another.

1. High Case: This case is when Party 1 income > Party 2 income and Party 1 Children > Party 2 Children. Basically when the one party's income and children is greater than other party.

2. Majority Parenting Case: This case is when Party 1 income > Party 2 income and Party 1 Children < Party 2 Children. 

3. Shared Parenting Case: This case is when the children lives on shared basis. The spousal support will be given to the party who has less child support as compared to the another party.

4. Hybrid Parenting Case: This case is when one child lives on shared basis and other child lives with a party. The spousal support will be given to the party who has less child support as compared to the another party.

- The spousal support is calculated using an iterative method. The calculation keeps occuring till the same value is received five times. All these values are stored in arrays for tracking if the values are same.

- All the state for the calculator is shared in 3 screens. All the data for screen 1 is passed to parent state, then from parent state it is shared with screen 2 and further to screen 3 (last screen).

### `Operational Dashboard`:
This dashboard is an embedded Power BI report. This dashboard displays the client information for a particular SID. The refresh token for the dashboard is created when it is rendered. The refresh token lasts for 60 minutes.

- For embedding the report powerbi-client-react library is used. 

### `Settings`:
This page shows the status of the 3rd party integration like clio, QBO (Intuit), Onboarding process, managing user roles, adding, deleting or changing. This shows all the users in the law firm. Each user here has a separate UID (UID).

### `Onboarding or Setup Wizard`:
Onboarding process is the default page when the new law firm (UID) is created.

Onboarding has 4 Steps. 
- Add a law firm: Law firm name and short name for the firm name. Short firm name cannot be changed. 
- Connect to Clio: We need a clio account for connecting with clio. All the details in clio are fetched in the app.
- Connect to QBO: We need a Intuit account for connecting with QBO. All the details in QBO are fetched in the app.
- Account Details: This includes 7 steps for setting up law firm and law firm photo.

### Folder Structure

### `Redux`
It is a global state management tool. 

The folders structure for redux is as follows: 
  ### store:
   - index.js: Boilerplate and reducers.
   - store.ts: Interfaces and types for State.

  ### actions:
   - accessPagesActions.js: Logic for AccessPageApi. This is the data to know if the current user has access to which links and functionality. This data is also stored in cookies so that it is not lost when app is refreshed.
   - companyActions.js: 
   - matterActions.js: 
   - userActions.js: All the logic for changing user Information, logging in, signing up, user profile changing, full refresh for data, MFA state, OPT verification, changing current user or role.

  ### reducers:
  - accessPagesReducer.js: This has the logic of changing the state of accessPage reducer depending upon the action type.
  - companyReducer.js: This has the logic of changing the state of companyInfo reducer. This state is used in the task forms.
  - matterReducer.js: This is the reducer for loading, fetching the clients in law firms.
  - userReducers.js: This holds the state for user Information such as user name, user roles, user sid etc. 

  ### constants:
  This folder contains the const values to be used in Actions and reducers to avoid typo error.


### `routes`
- Routes.jsx: All the routes are defined in this file.
- Role.types.ts: All the user roles enums are defined in this folder. Three roles are ADMIN, PREPARER, REVIEWER.
- Routes.types.ts: This folder contains the enums for all routes. Routes are divided into AUTH_ROUTES and UN_AUTH_ROUTES.

### `styles`
This folder contains the scss used for styling. Styles are further divided into pages, layout, components, base and main.scss file.

### `hooks`
This folder contains custom hooks. These are made for conviniance.

- useAPI.tsx: This hook returns API data, it's status whether an error has occurred or still fetching data from backend. This hook is not used everywhere but can be replaced where it is not used.

- useTable.jsx: This hook returns jsx for table row.

- useQuery.jsx: This hook returns the query after the ? sign.

### `containers`
Containers are the independent components. In this folder, the containers are divided into folder based on whether these components are used.

### `utils`
This folder contains the APIS, helpers functions and other library functions used throughout the application.

### `public`
This folder has all the images and assets used in application.

### `HOC`
This folder has Higher Order Components. These components modify the component logic and returns a new Component.

## Challenges: 
- Refactor calculator.


## Learn More
You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
