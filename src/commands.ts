import * as vscode from 'vscode';
import { LANGUAGES, EXTENSION_NS } from "./constants";
import { extensionContext } from "./context";

export async function handleDocumentOpen(...documents: vscode.TextDocument[]) {
    let didChange = false;
    for (const doc of documents) {
        if (!LANGUAGES.includes(doc.languageId)) {
            continue;
        }
        const { languageId, uri } = doc;

        extensionContext.documentSettings[doc.uri.fsPath] = {
            scope: { languageId, uri },
            settings: configToResourceSettings(
                vscode.workspace.getConfiguration(EXTENSION_NS, { languageId, uri }),
            ),
        };
        didChange = true;
    }
}

function configToResourceSettings(
    config: vscode.WorkspaceConfiguration,
): any {
    const resourceSettings = Object.create(null);
    for (const key of resourceSettingsKeys) {
        const value = config.inspect(key);
        assert(value);
        resourceSettings[key] = value.workspaceFolderLanguageValue ??
            value.workspaceFolderValue ?? value.workspaceLanguageValue ??
            value.workspaceValue ??
            value.globalValue ??
            value.defaultValue;
    }
    return resourceSettings;
}

