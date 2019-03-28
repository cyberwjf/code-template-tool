import { window, ViewColumn, Uri } from 'vscode';
import { resolve as resolvePath } from 'path';

interface ResolveUri {
    (diskPath: string): Uri;
}

const cssDiskPath = 'resource/css/index.css';
const jsDiskPath = 'resource/js/concepts.js';

function getWebviewContent(
    templateName: string,
    resolveUri: ResolveUri,
    concepts: string[],
    existingConcepts: string[],
    errorMessage: string | undefined
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
            <div id="user-input-root"></div>
            <script type="text/javascript" src=${resolveUri(jsDiskPath)}></script>
            <script>
                (function() {
                    const { templateUserInput } = top;
                    templateUserInput.start.bind(templateUserInput)(${JSON.stringify(
                        {concepts, existingConcepts, templateName, errorMessage}
                    )});
                })()
            </script>
        </body>
    </html>`;
}

export function showErrorMessageBox(
    templateName: string, 
    extensionPath: string,
    errorMessage: string
) {
    getUpdatedConcepts(templateName, extensionPath, [], [], errorMessage);
}

export default function getUpdatedConcepts(
    templateName: string, 
    extensionPath: string,
    concepts: string[],
    existingConcepts: string[],
    errorMessage?: string
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

        panel.webview.html = getWebviewContent(templateName, resolveUri, concepts, existingConcepts, errorMessage);
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
