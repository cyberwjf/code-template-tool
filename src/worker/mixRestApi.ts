import * as request from "request-promise-native";
import jsonpath = require("jsonpath");
import { getWorkspacePath } from "../utils/path";
import config from "../utils/config";
import { readFileSync, existsSync } from "fs";
import ini = require("ini");
import { FileNotExistsError, NotAValidDomainError } from "../utils/error";

function getCredentials(path: string) : any {
    const workspacePath = getWorkspacePath();
    const credentialsPath = workspacePath + "\\" + path;
    const encoding = config.encoding;

    if (!existsSync(credentialsPath)) {
        throw new FileNotExistsError(credentialsPath);
    }

    return ini.parse(readFileSync(credentialsPath, encoding)); 
}

function getServerTag(credentials: any) : string {
    return credentials.General.mix_env;
}

function getApiKey(credentials :any, serverTag : string) : string {
    return credentials[serverTag].api_key;
}

function getServerUrl(credentials : any, serverTag : string) : string {
    return credentials[serverTag].server_url;
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
    let credentials = getCredentials("..\\mix\\python\\credentials.ini");
    const serverTag = getServerTag(credentials);
    const serverUrl = getServerUrl(credentials, serverTag);
        credentials = getCredentials("..\\mix\\python\\credentials.local");
    const apiKey = getApiKey(credentials, serverTag);
    
    const baseUrl = serverUrl + '/api/v1/projects/' + projectId;

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
