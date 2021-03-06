import { showInfoMsg } from '../utils/message';
import Worker from '../worker/Worker';

export default async function reloadTemplates() {
    const worker = Worker.getInstance();
    await worker.reloadTemplates();
    showInfoMsg('Reload templates successfully!');
}
