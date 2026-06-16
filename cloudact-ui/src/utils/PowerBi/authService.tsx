import { POWERBI } from '../../config';
import * as Msal from 'msal';


export default class AuthService {
    private static clientId: string = POWERBI.client_id;
    private static authority: string = POWERBI.AUTHORITY + POWERBI.tenant_id;

    private static requestScopesPowerBi = {
        scopes: [POWERBI.scope]
    }

    public static userIsAuthenticated: boolean = false;
    public static userDisplayName: string = '';
    public static username: string = '';
    public static accessToken: string = '';
    public static uiUpdateCallback: any = '';

    private static msalConfig: Msal.Configuration = {
        auth: {
            clientId: AuthService.clientId,
            authority: AuthService.authority
        },
        cache: {
            cacheLocation: 'localStorage',
            storeAuthStateInCookie: true
        }
    }

    private static userAgent: Msal.UserAgentApplication = new Msal.UserAgentApplication(AuthService.msalConfig)

    static init = () => {
        let userAccount = AuthService.userAgent.getAccount();

        if(userAccount){
            console.log("user account info retrieved");
        }else{

        }
    }

    static login = () => {
        AuthService.userAgent.loginPopup(AuthService.requestScopesPowerBi).then((loginResponse: any) => {
            console.log("login success....");
            let account = AuthService.userAgent.getAccount();
            AuthService.username = loginResponse.account.userName;
            AuthService.userDisplayName = loginResponse.account.name;
            AuthService.userIsAuthenticated = true;
            AuthService.uiUpdateCallback();
        }).catch(function(err){
            console.log("log in error...")
        })

        if(AuthService.uiUpdateCallback){
            AuthService.uiUpdateCallback();
        }
    }

    // static logout = () => {

    // }


}