import { WuiResponseInterface } from "./wui/response.js";
import { WuiVfsNodeInterface } from "./wui/vfs/vfs.js";
export declare function renderHtml(): void;
export declare class Awwan {
    private com_btn_local;
    private com_btn_new_dir;
    private com_btn_new_file;
    private com_btn_remote;
    private com_btn_save;
    private com_file_path;
    private com_inp_vfs_new;
    private com_stdout;
    private com_stderr;
    private current_node;
    private request;
    private wui_editor;
    private wui_notif;
    private wui_vfs;
    constructor();
    onHashChange(hash: string): void;
    Open(path: string, is_dir: boolean): Promise<WuiResponseInterface>;
    OpenNode(node: WuiVfsNodeInterface): Promise<WuiResponseInterface>;
    isEditAllowed(node: WuiVfsNodeInterface): WuiResponseInterface;
    onClickSave(): void;
    editorOnSave(content: string): void;
    doSaveFile(path: string, content: string): Promise<any>;
    editorOnSelection(begin: number, end: number): void;
    execLocal(): void;
    execRemote(): void;
    httpApiExecute(mode: string): Promise<void>;
    private newNode;
}
