import { window, ViewColumn, ExtensionContext, Uri } from 'vscode';
import { relative, resolve as resolvePath } from 'path';
import { getWorkspacePath } from '../utils/path';
import {
    IUserInputRequestDTO,
    IUserInputResponseDTO,
    ITemplate,
    IVariableDTO,
} from '../model/types';

interface ResolveUri {
    (diskPath: string): Uri;
}

const cssDiskPath = 'resource/css/index.css';
const jsDiskPath = 'resource/js/index.js';

function getWebviewContent(
    templateName: string,
    userInputRequest: IUserInputRequestDTO,
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
        <div id="user-input-root"></div>
        <script type="text/javascript" src=${resolveUri(jsDiskPath)}></script>
        <script>
            (function() {
                const { templateUserInput } = top;
                templateUserInput.start.bind(templateUserInput)(${JSON.stringify(
                    userInputRequest
                )});
            })()
        </script>
    </body>
</html>`;
}

export default function getUserInput(
    template: ITemplate,
    destDir: string,
    extensionContext: ExtensionContext
): Promise<IUserInputResponseDTO | undefined> {
    const workspacePath = getWorkspacePath();
    const destDirRelativePath = relative(workspacePath, destDir);
    const templateName = template.name;

    function resolveUri(diskPath: string): Uri {
        const diskUri = Uri.file(resolvePath(extensionContext.extensionPath, diskPath));
        return diskUri.with({ scheme: 'vscode-resource' });
    }

    return new Promise<IUserInputResponseDTO | undefined>(resolve => {
        const panel = window.createWebviewPanel(
            'codeTemplateVariablesSetter',
            templateName,
            ViewColumn.Active,
            { enableScripts: true, retainContextWhenHidden: true }
        );

        const variables = template.variableTable.variables();
        const userInputRequest: IUserInputRequestDTO = {
            templateName,
            variables: variables.map(({ name, style, value }) => ({ name, style, value })),
            destDir: {
                basePath: workspacePath,
                relativePath: destDirRelativePath,
            },
        };
        panel.webview.html = getWebviewContent(templateName, userInputRequest, resolveUri);
        panel.webview.onDidReceiveMessage(response => {
            panel.dispose();
            if (response === 'cancel') {
                resolve(undefined);
            } else {
                const {
                    variables,
                    destDir: { basePath, relativePath },
                } = response;
                const userInputResponse: IUserInputResponseDTO = {
                    variables: <IVariableDTO[]>variables,
                    destDirAbsolutePath: resolvePath(basePath || '/', relativePath),
                };
                resolve(userInputResponse);
            }
        });
    });
}