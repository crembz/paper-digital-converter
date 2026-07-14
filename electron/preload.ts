import { contextBridge, ipcRenderer } from 'electron';

export interface Config {
  provider: string;
  model: string;
  apiKey: string;
  baseUrl: string;
}

export interface ElectronAPI {
  loadConfig(): Promise<Config | null>;
  saveConfig(config: Config): Promise<void>;
  openFileDialog(filters?: string[][]): Promise<string[] | null>;
  saveFileDialog(defaultPath?: string): Promise<string | null>;
  readFile(path: string, asBase64?: boolean): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
}

const electronAPI: ElectronAPI = {
  loadConfig: async (): Promise<Config | null> => {
    return ipcRenderer.invoke('load-config');
  },

  saveConfig: async (config: Config): Promise<void> => {
    return ipcRenderer.invoke('save-config', config);
  },

  openFileDialog: async (filters?: string[][]): Promise<string[] | null> => {
    return ipcRenderer.invoke('open-file-dialog', { filters });
  },

  saveFileDialog: async (defaultPath?: string): Promise<string | null> => {
    return ipcRenderer.invoke('save-file-dialog', defaultPath);
  },

  readFile: async (filePath: string, asBase64 = false): Promise<string> => {
    return ipcRenderer.invoke('read-file', filePath, asBase64);
  },

  writeFile: async (filePath: string, content: string): Promise<void> => {
    return ipcRenderer.invoke('write-file', filePath, content);
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Global type declared in src/App.tsx to avoid duplicate declaration
