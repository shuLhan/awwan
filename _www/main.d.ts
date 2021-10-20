declare module "wui/response" {
    export interface WuiResponseInterface {
        code: number;
        message: string;
        data?: any;
    }
}
declare module "wui/vfs/vfs" {
    import { WuiResponseInterface } from "wui/response";
    export interface WuiVfsNodeInterface {
        name: string;
        path: string;
        is_dir: boolean;
        content_type: string;
        mod_time: number;
        size: number;
        mode: string;
        childs: WuiVfsNodeInterface[];
        content: string;
    }
    export interface WuiVfsOptions {
        id: string;
        Open(path: string, is_dir: boolean): Promise<WuiResponseInterface>;
        OpenNode(node: WuiVfsNodeInterface): Promise<WuiResponseInterface>;
    }
    export class WuiVfs {
        opts: WuiVfsOptions;
        private el;
        private com_path;
        private com_list;
        constructor(opts: WuiVfsOptions);
        OpenNode(node: WuiVfsNodeInterface): void;
        OpenDir(path: string): Promise<void>;
        Set(node: WuiVfsNodeInterface): void;
    }
}
declare module "wui/editor/editor" {
    import { WuiVfsNodeInterface } from "wui/vfs/vfs";
    export interface WuiEditorOptions {
        id: string;
        is_editable: boolean;
        OnSelection(begin: number, end: number): void;
        OnSave(content: string): void;
    }
    export class WuiEditor {
        opts: WuiEditorOptions;
        id: string;
        is_editable: boolean;
        lines: WuiEditorLine[];
        private el;
        private sel;
        private active_file;
        private active_text;
        private range_begin;
        private range_end;
        private raw_lines;
        private range;
        private is_key_control;
        private unre;
        constructor(opts: WuiEditorOptions);
        GetContent(): string;
        GetSelectionRange(): WuiEditorSelectionRangeInterface;
        OnClickText(text: HTMLElement): void;
        OnKeyup(x: number, text: HTMLElement, ev: KeyboardEvent): boolean | undefined;
        OnKeydownOnLine(x: number, el_text: HTMLElement, ev: KeyboardEvent): false | undefined;
        OnMouseDownAtLine(x: number): void;
        OnMouseUpAtLine(x: number): void;
        SetEditOff(): void;
        SetEditOn(): void;
        Open(node: WuiVfsNodeInterface): void;
        private clearSelection;
        private initStyle;
        private doJoin;
        private doSplit;
        private doUpdate;
        private doRedo;
        private doUndo;
        private deleteLine;
        private insertNewline;
        private onKeyupDocument;
        private render;
        private setCaret;
    }
    class WuiEditorLine {
        x: number;
        text: string;
        private line_num;
        el: HTMLElement;
        el_number: HTMLElement;
        el_text: HTMLElement;
        constructor(x: number, text: string, ed: WuiEditor);
        SetNumber(x: number): void;
        SetEditOn(): void;
        SetEditOff(): void;
    }
    interface WuiEditorSelectionRangeInterface {
        begin_at: number;
        end_at: number;
    }
}
declare module "wui/notif/notif" {
    export class WuiNotif {
        private el;
        private timeout;
        constructor();
        Info(msg: string): void;
        Error(msg: string): void;
        private initStyle;
    }
}
declare module "awwan" {
    import { WuiResponseInterface } from "wui/response";
    import { WuiVfsNodeInterface } from "wui/vfs/vfs";
    export function renderHtml(): void;
    export class Awwan {
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
}
declare module "main" { }
