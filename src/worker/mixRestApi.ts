import * as request from "request-promise-native";
import jsonpath = require("jsonpath");
import { getWorkspacePath } from "../utils/path";
import config from "../utils/config";
import { readFileSync } from "fs";

function getApiKey() : string {
    return 'fWtdL7bVQKvnxpIogC9F1krCIZBvEUk2toNzwdIm6r0';
}

function getProjectId(domain : string | undefined) {
    if (!domain) {
        return '';
    }
    let m = new Map<string, string>();
    m.set("emotion_detection", "emotion");
    
    let mixDomainName = m.get(domain);
    let workspacePath = getWorkspacePath();
    let pidPath = workspacePath + "\\..\\mix\\domains\\" + mixDomainName + "\\id.txt";
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
    let refinements = jsonpath.query(facets, "$[*].content");
    refinements = removeDuplicates(refinements);
    return refinements;
}

export async function getDialogInteractions(domain : string | undefined) : Promise<any> {
    let projectId = getProjectId(domain);

    let baseUrl = `http://10.56.10.112:443/api/v1/projects/${projectId}/dialogs/interactions`;

    const queryString = '';
    // const queryString = '/20365492/localizedInteractions/20365493/escalationLevels/20365494/randomizations/20365507/facets/20365510';
    let options = {
        method: 'GET',
        uri: baseUrl + queryString,
        headers: {
            'X-Bolt-ApiKey': getApiKey(),
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
