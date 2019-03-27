import { window, ViewColumn, Uri } from 'vscode';
import { resolve as resolvePath } from 'path';

interface ResolveUri {
    (diskPath: string): Uri;
}

const cssDiskPath = 'resource/css/index.css';

function getTextContent(concepts: string[],
    existingConcepts: string[]) : string {
        let result = '';
        if (concepts && concepts.length !== 0) {
            result += 'About to generate code template for ' + concepts.join(', ') + '.';
        } else {
            result += 'No concept needs to be generated.';
        }

        if (existingConcepts && existingConcepts.length === 1) {
            result += ' ';
            result += existingConcepts[0] + ' is already existing.';
        } else if (existingConcepts && existingConcepts.length > 1) {
            result += ' ';
            result += existingConcepts.join(', ') + ' are already existing.';
        }

        return result;
    }

function getWebviewContent(
    templateName: string,
    resolveUri: ResolveUri,
    textContent: string
) {
    return `
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${templateName}</title>
        <link rel="stylesheet" type="text/css" href=${resolveUri(cssDiskPath)}>
    </head>
    <body>
        <div id="user-input-root">
            <div class="user-input-header">
                <h1 id="info"/>
            </div>
            <div class="user-input-submit-btns">
                <button class="user-input-confirm-btn">Confirm</button>
                <button class="user-input-cancel-btn">Cancel</button>
            </div>
        </div>
        <script>
            top.vscode = acquireVsCodeApi();
            const info = document.getElementById('info');
            info.textContent = '${textContent}';
            const confirmBtnEl = document.querySelector('.user-input-confirm-btn');
            const cancelBtnEl = document.querySelector('.user-input-cancel-btn');
            confirmBtnEl.addEventListener('click', () => {top.vscode.postMessage('confirm');});
            cancelBtnEl.addEventListener('click', () => {top.vscode.postMessage('cancel');});
        </script>
    </body>
</html>`;
}

export default function getUpdatedConcepts(
    templateName: string, 
    extensionPath: string,
    concepts: string[],
    existingConcepts: string[]
): Promise<string | undefined> {
    
    function resolveUri(diskPath: string): Uri {
        const diskUri = Uri.file(resolvePath(extensionPath, diskPath));
        return diskUri.with({ scheme: 'vscode-resource' });
    }

    return new Promise<string | undefined>(resolve => {
        const panel = window.createWebviewPanel(
            'codeTemplateVariablesSetter',
            templateName,
            ViewColumn.Active,
            { enableScripts: true, retainContextWhenHidden: true }
        );

        const textContent = getTextContent(concepts, existingConcepts);
        panel.webview.html = getWebviewContent(templateName, resolveUri, textContent);
        panel.webview.onDidReceiveMessage(response => {
            panel.dispose();
            if (response === 'cancel') {
                resolve('cancel');
            } else {
                resolve('confirm');
            }
        });
    });
}
