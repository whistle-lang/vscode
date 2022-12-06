import * as vscode from "vscode";
// import { workspace } from "vscode";
import { handleDocumentOpen } from "./commands";
import { extensionContext } from "./context";
// import {
//   LanguageClient,
//   LanguageClientOptions,
//   ServerOptions,
//   TransportKind,
// } from "vscode-languageclient/node";

// let client!: LanguageClient;
export let buildDiagnosticCollection: vscode.DiagnosticCollection;
export const logChannel = vscode.window.createOutputChannel('Whistle');
export const whistleFormatStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);

export async function activate(context: vscode.ExtensionContext) {
  await vscode.window.showInformationMessage(
    "Whistle is now setup in this workspace.",
  );

  context.subscriptions.push(logChannel);
  buildDiagnosticCollection = vscode.languages.createDiagnosticCollection('whistle');
  context.subscriptions.push(buildDiagnosticCollection);
  
  // client = createLanguageClient();
  // client.start();
  // on document open
  vscode.workspace.onDidOpenTextDocument(
    handleDocumentOpen,
    extensionContext,
    context.subscriptions,
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("whistle.build.workspace", () =>
      console.log("build")),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("whistle.format.file", () =>
      console.log("test")),
  );
}

export function deactivate() {
  // if (!client) {
  //   return undefined;
  // }
  // return client.stop();
}

// function createLanguageClient(): LanguageClient {
//   const clientOptions: LanguageClientOptions = {
//     documentSelector: [{ scheme: "file", language: "whistle" }],
//     synchronize: {
//       fileEvents: [
//         workspace.createFileSystemWatcher("**/whistle.yml"),
//       ],
//     },
//   };

//   const serverOptions: ServerOptions = {
//     command: "whistle",
//     args: ["lsp"],
//     transport: TransportKind.stdio,
//     options: {
//       env: Object.assign(process.env, {
//         WHISTLE_LOG: "info",
//         WHISTLE_LOG_NOCOLOUR: "1",
//       }),
//     },
//   };

//   return new LanguageClient(
//     "whistle_language_server",
//     "Whistle Language Server",
//     serverOptions,
//     clientOptions,
//   );
// }
