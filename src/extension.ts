import * as vscode from 'vscode';

import { handleDocumentOpen } from "./commands";
import {extensionContext} from "./context";

export let buildDiagnosticCollection: vscode.DiagnosticCollection;
export const logChannel = vscode.window.createOutputChannel('whistle');
export const whistleFormatStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);

export async function activate(context: vscode.ExtensionContext) {
    await vscode.window.showInformationMessage(
        "Whistle is now setup in this workspace.",
    );
    context.subscriptions.push(logChannel);
    buildDiagnosticCollection = vscode.languages.createDiagnosticCollection('whistle');
    context.subscriptions.push(buildDiagnosticCollection);

    // on document open
    vscode.workspace.onDidOpenTextDocument(
        handleDocumentOpen,
        extensionContext,
        context.subscriptions,
    );

    context.subscriptions.push(vscode.commands.registerCommand('whistle.build.workspace', () => console.log("build")));
    context.subscriptions.push(vscode.commands.registerCommand('whistle.format.file', () => console.log('test')));
}

export function deactivate() {
}