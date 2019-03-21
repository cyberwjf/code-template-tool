//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import { getDialogInteractions, getConcepts } from '../worker/mixRestApi';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
// import * as vscode from 'vscode';
// import * as myExtension from '../extension';

// Defines a Mocha test suite to group tests of similar kind together
describe('Extension Tests', function() {
    it('Mix RESTful API Test', async function() {
        let res = await getDialogInteractions('emotion_detection');
        let refinements = getConcepts(res, 'refinement');
        assert.equal(refinements[0], "FIND_GAS_STATION_NEARBY");
        assert.equal(refinements[1], "START_NTT");
    });
});
