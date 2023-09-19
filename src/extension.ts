// deno-lint-ignore-file require-await no-explicit-any no-unused-vars
import {
  CancellationToken,
  commands,
  EventEmitter,
  ExtensionContext,
  InlayHint,
  InlayHintsProvider,
  languages,
  ProviderResult,
  Range,
  Selection,
  TextDocument,
  TextDocumentChangeEvent,
  TextEdit,
  Uri,
  window,
  workspace,
  WorkspaceEdit,
} from "vscode";

import {
  Disposable,
  Executable,
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
} from "vscode-languageclient/node";

let client: LanguageClient;

function createLanguageClient() {
  const command = workspace.getConfiguration("whistle").get("whistlePath");
  console.log(command);
  const run: Executable = {
    command,
    args: ["lsp"],
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
  };

  return new LanguageClient(
    "whistle-language-server",
    "whistle language server",
    serverOptions,
    clientOptions,
  );
}

export async function activate(context: ExtensionContext) {
  const restartCommand = commands.registerCommand(
    "whistle.restartServer",
    async () => {
      if (!client) {
        window.showErrorMessage("whistle client not found");
        return;
      }

      try {
        if (client.isRunning()) {
          await client.restart();

          window.showInformationMessage("whistle server restarted.");
        } else {
          await client.start();
        }
      } catch (err) {
        client.error("Restarting client failed", err, "force");
      }
    },
  );

  context.subscriptions.push(restartCommand);

  client = createLanguageClient();
  activateInlayHints(context);
  client.start();
}

export function deactivate() {
  return client?.stop();
}

export function activateInlayHints(ctx: ExtensionContext) {
  const maybeUpdater = {
    hintsProvider: null as Disposable | null,
    updateHintsEventEmitter: new EventEmitter<void>(),

    async onConfigChange() {
      this.dispose();

      const event = this.updateHintsEventEmitter.event;
      this.hintsProvider = languages.registerInlayHintsProvider(
        { scheme: "file", language: "whistle" },
        new (class implements InlayHintsProvider {
          onDidChangeInlayHints = event;
          resolveInlayHint(
            hint: InlayHint,
            _token: CancellationToken,
          ): ProviderResult<InlayHint> {
            const ret = {
              label: hint.label,
              ...hint,
            };
            return ret;
          }
          async provideInlayHints(
            document: TextDocument,
            _range: Range,
            _token: CancellationToken,
          ): Promise<InlayHint[]> {
            const hints = (await client
              .sendRequest("custom/inlay_hint", {
                path: document.uri.toString(),
              })
              .catch((_err: unknown) => null)) as [number, number, string][];
            if (hints == null) {
              return [];
            } else {
              return hints.map((item) => {
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
        })(),
      );
    },

    onDidChangeTextDocument(
      { contentChanges, document }: TextDocumentChangeEvent,
    ) {
      // this.updateHintsEventEmitter.fire();
    },

    dispose() {
      this.hintsProvider?.dispose();
      this.hintsProvider = null;
      this.updateHintsEventEmitter.dispose();
    },
  };

  workspace.onDidChangeConfiguration(
    maybeUpdater.onConfigChange,
    maybeUpdater,
    ctx.subscriptions,
  );
  workspace.onDidChangeTextDocument(
    maybeUpdater.onDidChangeTextDocument,
    maybeUpdater,
    ctx.subscriptions,
  );

  maybeUpdater.onConfigChange().catch(console.error);
}
