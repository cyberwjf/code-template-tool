import { resolve } from 'path';

export class NotAValidDomainError extends Error {
    constructor(domain: string) {
        super(`InvalidDomainError: ENOTEXIST: Domain ${domain} not exists`);
    }
}

export class FileNotExistsError extends Error {
    constructor(filePath: string) {
        super(`InvalidPathError: ENOTEXIST: ${resolve(filePath)}`);
    }
}

export class FileAlreadyExistsError extends Error {
    constructor(filePath: string) {
        super(`InvalidPathError: EEXIST: ${resolve(filePath)}`);
    }
}

export class NotDirError extends Error {
    constructor(desc?: string) {
        super(`InvalidPathError: ENOTDIR: Not a directory${desc ? '' : ', ' + desc}`);
    }
}
