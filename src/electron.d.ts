interface ElectronAPI {
  loadConfig(): Promise<{ provider: string; model: string; apiKey: string; baseUrl: string } | null>;
  saveConfig(config: { provider: string; model: string; apiKey: string; baseUrl: string }): Promise<void>;
  openFileDialog(filters?: string[][]): Promise<string[] | null>;
  saveFileDialog(defaultPath?: string): Promise<string | null>;
  readFile(path: string, asBase64?: boolean): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
}

interface Window {
  electronAPI: ElectronAPI;
}
