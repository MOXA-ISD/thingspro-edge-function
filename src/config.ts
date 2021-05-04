import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { runInThisContext } from 'vm';
const TOML = require('@iarna/toml')


export class ConfigManager {

    config: any;
    config_path: string;

    constructor() {
        this.config = {}
        this.config_path = ""
    };

    private __rootPath(): string {
        return Array.isArray(vscode.workspace.workspaceFolders) ? vscode.workspace.workspaceFolders[0].uri.fsPath : "";
    };

    private __config_default(): any {
        return {
            'username': '',
            'password': '',
            'ipaddr': '',
            'token': '',
        };
    }
    public async initialization(): Promise<boolean> {
        this.config_path = this.get_config_path('.tpfunc', false);
        if (!fs.existsSync(this.config_path)) {
            this.config.init = this.__config_default()
            return false
        }
        let config_uri = vscode.Uri.parse(this.config_path)
        let generate = vscode.workspace.openTextDocument(config_uri).then(async (document) => {
            let config = TOML.parse(document.getText())
            if (!config.init) {
                config.init = this.__config_default()
            }
            return config;
        });
        this.config = await generate
        return true
    }

    public create_file(_path: string): boolean {
        if (_path != "" && !fs.existsSync(_path)) {
            if (fs.openSync(_path, 'as') < 0) {
                return false
            }
        }
        return true
    }
    
    public get_config_path(name: string, auto_create: boolean): string {
        let cpath = this.__rootPath() != "" ? path.join(this.__rootPath(), name) : ""
        if (auto_create && !this.create_file(cpath)) {
            throw "file create exception: " + cpath
        }
        return cpath
    };

    public get_value(key: string): string {
        return this.config.init[key]
    }

    public set_value(key: string, value: string) {
        this.config.init[key] = value
    }

    public write_to_file() {
        if (this.create_file(this.config_path)) {
            let dump = TOML.stringify(this.config)
            fs.writeFileSync(this.config_path, dump, 'utf8');
        }
    }
};
