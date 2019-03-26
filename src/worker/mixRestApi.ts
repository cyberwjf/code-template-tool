import * as request from "request-promise-native";
import jsonpath = require("jsonpath");
import { getWorkspacePath } from "../utils/path";
import config from "../utils/config";
import { readFileSync } from "fs";
import ini = require("ini");

function getLocalCredentials() : any {
    const workspacePath = getWorkspacePath();
    const credentialsPath = workspacePath + "\\..\\mix\\python\\credentials.local";
    const encoding = config.encoding;
    return ini.parse(readFileSync(credentialsPath, encoding));    
}

function getApiKey(credentials :any) : string {
    return credentials.Edge.api_key;
}

function getServerUrl(credentials : any) : string {
    return credentials.Edge.server_url;
}

function getProjectId(domain : string | undefined) {
    if (!domain) {
        return '';
    }
    
    const workspacePath = getWorkspacePath();
    const pidPath = workspacePath + "\\..\\mix\\domains\\" + domain + "\\id.txt";
    const encoding = config.encoding;
    const content = readFileSync(pidPath, { encoding });

    return content;
}

function removeDuplicates(arr: Object[]): Object[] {
    for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
            if (arr[i] === arr[j]) {
                arr.splice(j--, 1);
            }
        }
    }

    return arr;
}

export function getConcepts(res : any, type: string) : any {
    let facets = jsonpath.query(res, "$..facets.*");
    facets = facets.filter(function (object) {
        return object.type === type && object.content !== '';
    });
    let concepts = jsonpath.query(facets, "$[*].content");
    concepts = removeDuplicates(concepts);
    return concepts;
}

export async function getDialogInteractions(domain : string | undefined) : Promise<any> {
    const projectId = getProjectId(domain);
    const credentials = getLocalCredentials();
    const apiKey = getApiKey(credentials);
    const serverUrl = getServerUrl(credentials);
    const baseUrl = `${serverUrl}/api/v1/projects/${projectId}/dialogs/interactions`;

    const queryString = '';
    // const queryString = '/20365492/localizedInteractions/20365493/escalationLevels/20365494/randomizations/20365507/facets/20365510';
    let options = {
        method: 'GET',
        uri: baseUrl + queryString,
        headers: {
            'X-Bolt-ApiKey': apiKey,
            'Content-Type': 'Application/json'
        },
        json: true
    };    
    return new Promise<any>(
        resolve => {
            request(options)
                .then((res) => {resolve(res);})
                .catch((err) => console.log("Wrong!"));
        });
}
