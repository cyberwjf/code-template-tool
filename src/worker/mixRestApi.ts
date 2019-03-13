import * as request from "request-promise-native";
import { IVariableDTO } from "../model/types";
import jsonpath = require("jsonpath");

const baseUrl = 'http://10.56.10.112:443/api/v1/projects/1059/dialogs/interactions';
const queryString = '';
// const queryString = '/20365492/localizedInteractions/20365493/escalationLevels/20365494/randomizations/20365507/facets/20365510';
let options = {
    method: 'GET',
    uri: baseUrl + queryString,
    headers: {
        'X-Bolt-ApiKey': 'fWtdL7bVQKvnxpIogC9F1krCIZBvEUk2toNzwdIm6r0',
        'Content-Type': 'Application/json'
    },
    json: true
};

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

export function resolve(res : any):void {
    let facets = jsonpath.query(res, "$..facets.*");
    facets = facets.filter(function (object) {
        return object.type === 'refinement' && object.content !== '';
    });
    let refinements = jsonpath.query(facets, "$[*].content");
    refinements = removeDuplicates(refinements);
}

export async function getConceptName(variables: IVariableDTO[]) {
    request(options)
        .then(resolve)
        .catch((err) => console.log("Wrong!"));
}
