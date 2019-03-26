import { window, ViewColumn, Uri } from 'vscode';
import { resolve as resolvePath } from 'path';

interface ResolveUri {
    (diskPath: string): Uri;
}

const cssDiskPath = 'resource/css/index.css';

function getWebviewContent(
    templateName: string,
    resolveUri: ResolveUri
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
            <h1 id="info"></h1>
            <div class="user-input-submit-btns">
                <button class="user-input-confirm-btn">Confirm</button>
                <button class="user-input-cancel-btn">Cancel</button>
            </div>
        </div>
        <script>
            top.vscode = acquireVsCodeApi();
            const info = document.getElementById('info');
            info.textContent = 'Hello WebView';
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
    extensionPath: string
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

        panel.webview.html = getWebviewContent(templateName, resolveUri);
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
