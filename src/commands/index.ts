import newFromTemplate from './newFromTemplate';
import editTemplates from './editTemplates';
import reloadTemplates from './reloadTemplates';
import newQueryFromTemplate from './newQueryFromTemplate';
import newRefinementFromTemplate from './newRefinementFromTemplate';

interface CommandTable {
    [propName: string]: (...args: any[]) => void | Promise<void>;
}

const commandTable: CommandTable = {
    'extension.newFromTemplate': newFromTemplate,
    'extension.editTemplates': editTemplates,
    'extension.reloadTemplates': reloadTemplates,
    'extension.newQueryFromTemplate': newQueryFromTemplate,
    'extension.newRefinementFromTemplate': newRefinementFromTemplate
};

export default commandTable;
