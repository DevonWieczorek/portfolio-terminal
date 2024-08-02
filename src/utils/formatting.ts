const removeCitations = (str: string) => str.replace(/【\d+:\d+†source】/g, '');

const removeMultipleSpaces = (str: string) => str.replace(/\s\s+/g, ' ');

const replaceNewlinesWithBr = (str: string) => str.replace(/\n/g, '<br/>');

export { removeCitations, removeMultipleSpaces, replaceNewlinesWithBr };