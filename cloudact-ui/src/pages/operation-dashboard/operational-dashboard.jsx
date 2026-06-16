import { factories, IEmbedConfiguration, models, service } from "powerbi-client";
import React from "react";
import Layout from "../../components/LayoutComponents/Layout";
import { POWERBI } from "../../config";
import axios from "../../utils/axios";
import { getAllUserInfo, getBodyStatusCode, getUserSID } from "../../utils/helpers";

const powerbi = new service.Service(factories.hpmFactory, factories.wpmpFactory, factories.routerFactory);

let accessToken = "";
let embedUrl = "";
let reportContainer: HTMLElement;
let reportRef: React.Ref<HTMLDivElement>;
let loading: JSX.Element;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface AppProps { };
interface AppState { accessToken: string; embedUrl: string; error: string[] };

class OperationalDashboard extends React.Component<AppProps, AppState> {
    constructor(props: AppProps) {
        super(props);

        this.state = { accessToken: "", embedUrl: "", error: [] };

        reportRef = React.createRef();

        // Report container
        loading = (
            <Layout title="Operational Dashboard">
                <div
                    id="reportContainer"
                    style={{ width: "100%", height: '90vh' }}
                    ref={reportRef} >
                    Loading the report...
                </div>
            </Layout>
        );
    }

    // React function
    render(): JSX.Element {

        if (this.state.error.length) {

            // Cleaning the report container contents and rendering the error message in multiple lines
            reportContainer.textContent = "";
            this.state.error.forEach(line => {
                reportContainer.appendChild(document.createTextNode(line));
                reportContainer.appendChild(document.createElement("br"));
            });
        }
        else if (this.state.accessToken !== "" && this.state.embedUrl !== "") {
            const embedConfiguration: IEmbedConfiguration = {
                type: "report",
                tokenType: models.TokenType.Aad,
                accessToken,
                embedUrl,
                id: POWERBI.report_id,
                // filters: filter
            };

            const report = powerbi.embed(reportContainer, embedConfiguration);

            // Clear any other loaded handler events
            report.off("loaded");

            // Triggers when a content schema is successfully loaded
            report.on("loaded", function () {
                report.getFilters()
                    .then(filters => {
                        console.log("filters, ", filters);
                        filters[0].values = [getUserSID()]
                        return report.setFilters(filters);
                    });
                console.log("Report load successful");
            });

            // Clear any other rendered handler events
            report.off("rendered");

            // Triggers when a content is successfully embedded in UI
            report.on("rendered", function () {
                console.log("Report render successful");
            });

            // Clear any other error handler event
            report.off("error");

            // Below patch of code is for handling errors that occur during embedding
            report.on("error", function (event) {
                const errorMsg = event.detail;
                // Use errorMsg variable to log error in any destination of choice
                console.error(errorMsg);
            });
        }

        return loading;
    }

    // React function
    componentDidMount(): void {

        if (reportRef !== null) {
            reportContainer = reportRef["current"];
        }

        // User input - null check
        if (POWERBI.group_id === "" || POWERBI.report_id === "") {
            this.setState({ error: ["Please assign values to workspace Id and report Id in Config.ts file"] })
        } else {

            // Authenticate the user and generate the access token
            this.authenticate();
        }
    }

    // React function
    componentWillUnmount(): void {
        powerbi.reset(reportContainer);
    }

    // Authenticating to get the access token
    authenticate(): void {
        // const thisObj = this;

        // const msalConfig = {
        //     auth: {
        //         clientId: POWERBI.client_id
        //     }
        // };

        // const loginRequest = {
        //     scopes: POWERBI.scope
        // };

        // const msalInstance: UserAgentApplication = new UserAgentApplication(msalConfig);

        // function successCallback(response: AuthResponse): void {
        //     if (response.tokenType === "id_token") {
        //         thisObj.authenticate();

        //     } else if (response.tokenType === "access_token") {

        //         accessToken = response.accessToken;
        //         thisObj.setUsername(response.account.name);

        //         console.log("acc", accessToken, loginRequest, msalConfig, thisObj)
        //         // Refresh User Permissions
        //         thisObj.tryRefreshUserPermissions();
        //         thisObj.getembedUrl();

        //     } else {

        //         thisObj.setState({ error: [("Token type is: " + response.tokenType)] });
        //     }
        // }

        // function failCallBack(error: AuthError): void {
        //     thisObj.setState({ error: ["Redirect error: " + error] });
        // }

        // msalInstance.handleRedirectCallback(successCallback, failCallBack);

        // // check if there is a cached user
        // if (msalInstance.getAccount()) {

        //     console.log("login request", loginRequest)
        //     // get access token silently from cached id-token
        //     msalInstance.acquireTokenSilent(loginRequest)
        //         .then((response: AuthResponse) => {

        //             // get access token from response: response.accessToken
        //             accessToken = response.accessToken;
        //             this.setUsername(response.account.name);
        //             this.getembedUrl();
        //         })
        //         .catch((err: AuthError) => {

        //             // refresh access token silently from cached id-token
        //             // makes the call to handleredirectcallback
        //             if (err.name === "InteractionRequiredAuthError") {
        //                 msalInstance.acquireTokenRedirect(loginRequest);
        //             }
        //             else {
        //                 thisObj.setState({ error: [err.toString()] })
        //             }
        //         });
        // } else {

        //     // user is not logged in or cached, you will need to log them in to acquire a token
        //     msalInstance.loginRedirect(loginRequest);
        // }

        axios.get("/operationalBoard/generate_token").then((res) => {
             const { body } = getBodyStatusCode(res);
              console.log("boyd", body); 

            this.setState((prev) => ({ ...prev, accessToken: body.access_token}));
            accessToken = body.access_token;
            this.setUsername(getAllUserInfo().username);
            this.getembedUrl()
            }).catch((err) => console.log("error", err))
    }

    // Power BI REST API call to refresh User Permissions in Power BI
    // Refreshes user permissions and makes sure the user permissions are fully updated
    // https://docs.microsoft.com/rest/api/power-bi/users/refreshuserpermissions
    tryRefreshUserPermissions(): void {
        fetch("https://api.powerbi.com/v1.0/myorg/RefreshUserPermissions", {
            headers: {
                "Authorization": "Bearer " + this.state.accessToken
            },
            method: "POST"
        })
            .then(function (response) {
                if (response.ok) {
                    console.log("User permissions refreshed successfully.");
                } else {
                    // Too many requests in one hour will cause the API to fail
                    if (response.status === 429) {
                        console.error("Permissions refresh will be available in up to an hour.");
                    } else {
                        console.error(response);
                    }
                }
            })
            .catch(function (error) {
                console.error("Failure in making API call." + error);
            });
    }

    // Power BI REST API call to get the embed URL of the report
    getembedUrl(): void {
        const thisObj: this = this;

        fetch(`https://api.powerbi.com/v1.0/myorg/groups/${POWERBI.group_id}/reports/${POWERBI.report_id}`, {
            headers: {
                "Authorization": "Bearer " + this.state.accessToken
            },
            method: "GET",
        })
            .then(function (response) {
                console.log(
                    "reponse", response
                )
                const errorMessage: string[] = [];
                errorMessage.push("Error occurred while fetching the embed URL of the report")
                errorMessage.push("Request Id: " + response.headers.get("requestId"));

                response.json()
                    .then(function (body) {
                        // Successful response

                        if (response.ok) {
                            embedUrl = body["embedUrl"];
                            thisObj.setState({ accessToken: accessToken, embedUrl: embedUrl });
                        }
                        // If error message is available
                        else {
                            errorMessage.push("Error " + response.status + ": " + body.error.code);

                            thisObj.setState({ error: errorMessage });
                        }

                    })
                    .catch(function () {
                        errorMessage.push("Error " + response.status + ":  An error has occurred");

                        thisObj.setState({ error: errorMessage });
                    });
            })
            .catch(function (error) {

                // Error in making the API call
                thisObj.setState({ error: error });
            })
    }

    // Show username in the UI
    setUsername(username: string): void {
        const welcome = document.getElementById("welcome");
        if (welcome !== null)
            welcome.innerText = "Welcome, " + username;
    }
}

export default OperationalDashboard;