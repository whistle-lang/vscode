import * as vscode from 'vscode';
import { LANGUAGES, EXTENSION_NS } from "./constants";
import { extensionContext } from "./context";

export async function handleDocumentOpen(...documents: vscode.TextDocument[]) {
    let didChange = false;
    for (const doc of documents) {
        if (!LANGUAGES.includes(doc.languageId)) {
            continue;
        }
    }
}
