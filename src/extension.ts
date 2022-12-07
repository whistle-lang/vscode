// deno-lint-ignore-file require-await no-explicit-any no-unused-vars
import {
  languages,
  workspace,
  EventEmitter,
  ExtensionContext,
  window,
  InlayHintsProvider,
  TextDocument,
  CancellationToken,
  Range,
  InlayHint,
  TextDocumentChangeEvent,
  ProviderResult,
  commands,
  WorkspaceEdit,
  TextEdit,
  Selection,
  Uri,
} from "vscode";

import {
  Disposable,
  Executable,
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
} from "vscode-languageclient/node";

let client: LanguageClient;


export async function activate(context: ExtensionContext) {
  const disposable = commands.registerCommand("helloworld.helloWorld", async (_uri: any) => {
    const editor = window.activeTextEditor;
    const range = new Range(1, 1, 1, 1)
    editor.selection = new Selection(range.start, range.end);
  });

  context.subscriptions.push(disposable);
  const traceOutputChannel = window.createOutputChannel("Whistle Language Server trace");
  const command = "whistle_lsp";
  const run: Executable = {
    command,
    options: {
      env: {
        ...process.env,
        RUST_LOG: "debug",
      },
    },
  };
  const serverOptions: ServerOptions = {
    run,
    debug: run,
  };
  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: "file", language: "whistle" }],
    synchronize: {
      fileEvents: workspace.createFileSystemWatcher("**/.clientrc"),
    },
    traceOutputChannel,
  };

  client = new LanguageClient("whistle-language-server", "whistle language server", serverOptions, clientOptions);
  activateInlayHints(context);
  client.start();
  await window.showInformationMessage(
    "Whistle is now setup in this workspace.",
  );
}

export function deactivate() {
  if (!client) {
    return undefined;
  }
  return client.stop();
}

export function activateInlayHints(ctx: ExtensionContext) {
  const maybeUpdater = {
    hintsProvider: null as Disposable | null,
    updateHintsEventEmitter: new EventEmitter<void>(),

    async onConfigChange() {
      this.dispose();

      const event = this.updateHintsEventEmitter.event;
      this.hintsProvider = languages.registerInlayHintsProvider(
        { scheme: "file", language: "nrs" },
        new (class implements InlayHintsProvider {
          onDidChangeInlayHints = event;
          resolveInlayHint(hint: InlayHint, _token: CancellationToken): ProviderResult<InlayHint> {
            const ret = {
              label: hint.label,
              ...hint,
            };
            return ret;
          }
          async provideInlayHints(
            document: TextDocument,
            _range: Range,
            _token: CancellationToken
          ): Promise<InlayHint[]> {
            const hints = (await client
              .sendRequest("custom/inlay_hint", { path: document.uri.toString() })
              .catch((_err: unknown) => null)) as [number, number, string][];
            if (hints == null) {
              return [];
            } else {
              return hints.map(item => {
                const [start, end, label] = item;
                const _startPosition = document.positionAt(start);
                const endPosition = document.positionAt(end);
                return {
                  position: endPosition,
                  paddingLeft: true,
                  label: [
                    {
                      value: `${label}`,
                      command: {
                        title: "hello world",
                        command: "helloworld.helloWorld",
                        arguments: [document.uri],
                      },
                    },
                  ],
                };
              });
            }
          }
        })()
      );
    },

    onDidChangeTextDocument({ contentChanges, document }: TextDocumentChangeEvent) {
      // debugger
      // this.updateHintsEventEmitter.fire();
    },

    dispose() {
      this.hintsProvider?.dispose();
      this.hintsProvider = null;
      this.updateHintsEventEmitter.dispose();
    },
  };

  workspace.onDidChangeConfiguration(maybeUpdater.onConfigChange, maybeUpdater, ctx.subscriptions);
  workspace.onDidChangeTextDocument(maybeUpdater.onDidChangeTextDocument, maybeUpdater, ctx.subscriptions);

  maybeUpdater.onConfigChange().catch(console.error);
}