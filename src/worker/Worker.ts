import { workspace, ConfigurationChangeEvent, Disposable, ExtensionContext} from 'vscode';
import { existsSync } from 'fs';
import { isDirectory, mkdirp } from '../utils/fs';
import { NotDirError } from '../utils/error';
import config from '../utils/config';
import { ITemplateTable, IUserInputResponseDTO, IVariableDTO, IIdentifierStyleDTO, ITemplate } from '../model/types';
import TemplateTable from '../model/TemplateTable';
import CodesGenerator from './CodesGenerator';
import selectTemplate from './selectTemplate';
import getUserInput from './getUserInput';
import { getRefinements, getQueries } from './mixRestApi';
import { showErrMsg, showInfoMsg } from '../utils/message';
import getUpdatedConcepts from './getUpdatedConcepts';

export default class Worker {
    public static getInstance(): Worker {
        if (!this._instance) {
            this._instance = new Worker();
        }
        return this._instance;
    }

    public async init(context: ExtensionContext) {
        this._extensionContext = context;
        await this.initTemplates();
    }

    public async reloadTemplates() {
        this.disposeTemplates();
        await this.initTemplates();
    }

    public dispose() {
        this.disposeTemplates();
    }

    private getDomainName(destDir: string): string | undefined {
        return destDir.split("\\").pop();
    }

    public async generateCodes(destDir: string, templateName?: string) {
        const { templateTable } = this;
        
        const style : IIdentifierStyleDTO = {case: "AUTO", keepUpperCase: false, noTransformation: false, prefix: "", suffix: ""};

        let template = undefined;
        if (!templateName) {
            template = templateTable.size() === 1 ? templateTable.entries()[0] : await selectTemplate(templateTable);
            if (!template) {
                return;
            }
        } else {
            template = templateTable.getByName(templateName);
        }

        if (!template) {
            return;
        }

        template.reset();

        if (template['name'] === "Refinement Template" || template['name'] === "Query Template") {
            let domain = this.getDomainName(destDir);
            if (!domain) {
                showErrMsg("Please select a valid domain folder.");
                return;
            }

            let concepts : string[] | undefined = undefined;

            if (template['name'] === "Refinement Template") {
                concepts = await getRefinements(domain);
            } else if (template['name'] === "Query Template") {
                concepts = await getQueries(domain);
            } else {
                return;
            }

            let existingConcepts: string[] = [];

            if (concepts) {
                existingConcepts = await this.getExistingConcepts(concepts, destDir, template);

                concepts = concepts.filter((value) => {
                    if (existingConcepts.indexOf(value) === -1) {
                        return value;
                    }
                });
            } else {
                concepts = [];
            }

            const result = await getUpdatedConcepts(template.name, this.extensionContext.extensionPath, concepts, existingConcepts);
            if (result === 'cancel' || (concepts && concepts.length === 0)) {
                return;
            }

            if (concepts && concepts.length > 0) {
                for (let concept of concepts) {
                    let variables: IVariableDTO[] = [ {
                        name: 'conceptName',
                        style: style,
                        value: concept
                    },
                    {
                        name: 'domainName',
                        style: style,
                        value: this.getDomainName(destDir)
                    }

                    ];

                    if (variables) {
                        template.assignVariables(variables);
                    }

                    const destDirPath = destDir;
                    const codesGenerator = new CodesGenerator(template, destDirPath);
                    try {
                        await codesGenerator.execute();
                    } catch (e) {
                        showInfoMsg("File already exists!");
                    }
                }
            }
        } else {

            const userInputResponse: IUserInputResponseDTO | undefined = await getUserInput(
                template,
                destDir,
                this.extensionContext
            );
            if (!userInputResponse) {
                return;
            }

            const { variables } = userInputResponse;

            if (variables) {
                template.assignVariables(variables);
            }
            const destDirPath = userInputResponse.destDirAbsolutePath || destDir;
            const codesGenerator = new CodesGenerator(template, destDirPath);
            await codesGenerator.execute();
        }
    }

    private constructor() {}

    private async getExistingConcepts(concepts: string[], destDir: string, template: ITemplate) {
        const style : IIdentifierStyleDTO = {case: "AUTO", keepUpperCase: false, noTransformation: false, prefix: "", suffix: ""};
        let existingConcepts: string[] = [];
        for (let concept of concepts) {
            let variables: IVariableDTO[] = [{
                name: 'conceptName',
                style: style,
                value: concept
            },
            {
                name: 'domainName',
                style: style,
                value: this.getDomainName(destDir)
            }
            ];
            if (variables) {
                template.assignVariables(variables);
            }
            const destDirPath = destDir;
            const codesGenerator = new CodesGenerator(template, destDirPath);
            try {
                await codesGenerator.dryRun();
            }
            catch (e) {
                existingConcepts.push(concept);
            }
        }
        return existingConcepts;
    }

    private async initTemplates() {
        this._templatesPath = config.templatesPath;
        if (!existsSync(this._templatesPath)) {
            await mkdirp(this._templatesPath);
        } else if (!isDirectory(this._templatesPath)) {
            throw new NotDirError('`codeTemplateTool.templatesPath` must be a directory, check your user settings.');
        }

        this._templateTable = TemplateTable.getInstance(this._templatesPath);
        await this._templateTable.init();
        this.watchTemplates();
    }

    private disposeTemplates() {
        TemplateTable.freeInstance();
    }

    private watchTemplates() {
        const eventListeners = this._templatesEventListeners;
        eventListeners.push(workspace.onDidChangeConfiguration(this.onDidChangeTemplateConfig.bind(this)));
    }

    private async onDidChangeTemplateConfig (e: ConfigurationChangeEvent): Promise<void> {
        if (e.affectsConfiguration('codeTemplateTool')) {
            this.disposeTemplates();
            await this.initTemplates();
        }
    }

    private get templateTable(): ITemplateTable {
        return <ITemplateTable>this._templateTable;
    }

    private get extensionContext(): ExtensionContext {
        return <ExtensionContext>this._extensionContext;
    }

    private static _instance: Worker | undefined;
    private _templatesPath: string = '';
    private _templateTable: ITemplateTable | undefined;
    private _templatesEventListeners: Disposable[] = [];
    private _extensionContext: ExtensionContext | undefined;
}
