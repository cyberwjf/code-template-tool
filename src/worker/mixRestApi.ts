import * as request from "request-promise-native";
import jsonpath = require("jsonpath");



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

function getRefinements(res : any) : any {
    let facets = jsonpath.query(res, "$..facets.*");
    facets = facets.filter(function (object) {
        return object.type === 'refinement' && object.content !== '';
    });
    let refinements = jsonpath.query(facets, "$[*].content");
    refinements = removeDuplicates(refinements);
    return refinements;
}

export function getConceptName() : Promise<any> | undefined {
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
    return new Promise<any>(
        resolve => {
            request(options)
                .then((res) => {resolve(getRefinements(res));})
                .catch((err) => console.log("Wrong!"));
        });
}
