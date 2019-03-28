import { getDestDirPath } from '../utils/path';
import { showErrMsg } from '../utils/message';
import Worker from '../worker/Worker';

export default async function newQueryFromTemplate(...contextArgs: any[]) {
    try {
        const destDir = getDestDirPath(...contextArgs);
        const worker = Worker.getInstance();
        await worker.generateCodes(destDir, 'Query Template');
    } catch (error) {
        showErrMsg(error.message);
    }
}
