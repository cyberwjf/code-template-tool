import { getDestDirPath } from '../utils/path';
import { showErrMsg } from '../utils/message';
import Worker from '../worker/Worker';

export default async function newRefinementFromTemplate(...contextArgs: any[]) {
    try {
        const destDir = getDestDirPath(...contextArgs);
        const worker = Worker.getInstance();
        await worker.generateCodes(destDir, 'Refinement Template');
    } catch (error) {
        showErrMsg(error.message);
    }
}
