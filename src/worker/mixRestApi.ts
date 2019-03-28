import * as request from "request-promise-native";
import jsonpath = require("jsonpath");
import { getWorkspacePath } from "../utils/path";
import config from "../utils/config";
import { readFileSync, existsSync } from "fs";
import ini = require("ini");
import { FileNotExistsError, NotAValidDomainError } from "../utils/error";

function getLocalCredentials() : any {
    const workspacePath = getWorkspacePath();
    const credentialsPath = workspacePath + "\\..\\mix\\python\\credentials.local";
    const encoding = config.encoding;

    if (!existsSync(credentialsPath)) {
        throw new FileNotExistsError(credentialsPath);
    }

    return ini.parse(readFileSync(credentialsPath, encoding)); 
}

function getApiKey(credentials :any) : string {
    return credentials.Edge.api_key;
}

function getServerUrl(credentials : any) : string {
    return credentials.Edge.server_url;
}

function getProjectId(domain : string | undefined) : string {
    if (!domain || domain === '') {
        return '';
    }
    
    const workspacePath = getWorkspacePath();
    const pidPath = workspacePath + "\\..\\mix\\domains\\" + domain + "\\id.txt";
    const encoding = config.encoding;

    if (!existsSync(pidPath)) {
        throw new NotAValidDomainError(domain);
    }

    return readFileSync(pidPath, { encoding });
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

export async function getQueries(domain: string) : Promise<string[]> {
    const res = await getDialogContentByQuery(domain, '/dialogs/intentions');
    let queries = jsonpath.query(res, "$.intentions[*].clientData[*].name");
    queries = removeDuplicates(queries);
    return queries;
}

export async function getRefinements(domain: string) : Promise<string[]> {
    const res = await getDialogContentByQuery(domain, '/dialogs/interactions');
    let facets = jsonpath.query(res, "$..facets.*");
    facets = facets.filter(function (object) {
        return object.type === 'refinement' && object.content !== '';
    });
    let refinements = jsonpath.query(facets, "$[*].content");
    refinements = removeDuplicates(refinements);
    return refinements;
}

async function getDialogContentByQuery(domain : string | undefined, 
    queryString: string
    ) : Promise<any> {
    const projectId = getProjectId(domain);
    const credentials = getLocalCredentials();
    const apiKey = getApiKey(credentials);
    const serverUrl = getServerUrl(credentials);
    const baseUrl = serverUrl + '/api/v1/projects/' + projectId;

    // const queryString = '/20365492/localizedInteractions/20365493/escalationLevels/20365494/randomizations/20365507/facets/20365510';
    const options = {
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
