import { WuiEditor, WuiEditorOptions } from "./wui/editor/editor"
import { WuiNotif } from "./wui/notif/notif"
import { WuiResponseInterface } from "./wui/response"
import {
	WuiVfs,
	WuiVfsOptions,
	WuiVfsNode,
	WuiVfsNodeInterface,
} from "./wui/vfs/vfs"

const ID_BTN_LOCAL = "com_btn_local"
const ID_BTN_REMOTE = "com_btn_remote"
const ID_BTN_SAVE = "com_btn_save"
const ID_VFS_PATH = "vfs_path"
const ID_STDOUT = "stdout"
const ID_STDERR = "stderr"
const MAX_FILE_SIZE = 3000000

interface RequestInterface {
	mode: string
	script: string
	content: string
	begin_at: number
	end_at: number
}

export function renderHtml() {
	let el = document.createElement("div")
	el.classList.add("awwan")
	el.innerHTML = `
			<div class="awwan_nav_left">
				<div id="vfs"></div>
			</div>
			<div class="awwan_content">
				<div class="editor_action">
					File: <span id="${ID_VFS_PATH}">-</span>
					<button id="${ID_BTN_SAVE}">Save</button>
				</div>
				<div id="editor"></div>
				<div class="execute_action">
					Execute script on
					<button id="${ID_BTN_LOCAL}">Local</button>
					or
					<button id="${ID_BTN_REMOTE}">Remote</button>
				</div>
				<p>Hints:</p>
				<ul>
					<li>
						Click and drag on the line numbers to select the specific line to be
						executed.
					</li>
					<li>Press ESC to clear selection.</li>
				</ul>
				<div class="boxheader">Standard output:</div>
				<div id="${ID_STDOUT}"></div>
				<div class="boxheader">Standard error:</div>
				<div id="${ID_STDERR}"></div>
			</div>
		`
	document.body.appendChild(el)
}

export class Awwan {
	private com_btn_local!: HTMLElement
	private com_btn_remote!: HTMLElement
	private com_btn_save!: HTMLElement
	private com_file_path!: HTMLElement
	private com_stdout!: HTMLElement
	private com_stderr!: HTMLElement
	private request: RequestInterface = {
		mode: "local",
		script: "",
		content: "",
		begin_at: 0,
		end_at: 0,
	}
	private wui_editor: WuiEditor
	private wui_notif: WuiNotif
	private wui_vfs: WuiVfs

	constructor() {
		let el = document.getElementById(ID_BTN_LOCAL)
		if (el) {
			this.com_btn_local = el
			this.com_btn_local.onclick = () => { this.execLocal() }
		}
		el = document.getElementById(ID_BTN_REMOTE)
		if (el) {
			this.com_btn_remote = el
			this.com_btn_remote.onclick = () => { this.execRemote() }
		}
		el = document.getElementById(ID_BTN_SAVE)
		if (el) {
			this.com_btn_save = el
			this.com_btn_save.onclick = () => { this.onClickSave() }
		}
		el = document.getElementById(ID_VFS_PATH)
		if (el) {
			this.com_file_path = el
		}
		el = document.getElementById(ID_STDOUT)
		if (el) {
			this.com_stdout = el
		}
		el = document.getElementById(ID_STDERR)
		if (el) {
			this.com_stderr = el
		}

		let editor_opts: WuiEditorOptions = {
			id: "editor",
			is_editable: true,
			OnSelection: (begin_at: number, end_at: number) => {
				this.editorOnSelection(begin_at, end_at)
			},
			OnSave: this.editorOnSave,
		}
		this.wui_editor = new WuiEditor(editor_opts)

		this.wui_notif = new WuiNotif()

		let wui_vfs_opts: WuiVfsOptions = {
			id: "vfs",
			Open: (path: string, is_dir: boolean): Promise<WuiResponseInterface> => {
				return this.Open(path, is_dir)
			},
			OpenNode: (node: WuiVfsNode): Promise<WuiResponseInterface> => {
				return this.OpenNode(node)
			},
		}
		this.wui_vfs = new WuiVfs(wui_vfs_opts)

		window.onhashchange = (ev: Event): any => {
			ev.preventDefault()
			let hashchange = ev as HashChangeEvent
			let url = new URL(hashchange.newURL)
			this.onHashChange(url.hash)
		}

		// Open path based on hash.
		this.onHashChange(window.location.hash)
	}

	onHashChange(hash: string) {
		if (hash === "") {
			hash = "#/"
		}

		hash = hash.substring(1)
		this.wui_vfs.OpenDir(hash)
	}

	// Open fetch the node content from remote server.
	async Open(
		path: string,
		is_dir: boolean,
	): Promise<WuiResponseInterface> {
		let http_res = await fetch("/awwan/api/fs?path=" + path)
		let res = await http_res.json()
		if (res.code != 200) {
			this.wui_notif.Error(
				`Failed to open ${path}: ${res.message}`,
			)
			return res
		}
		if (is_dir) {
			window.location.hash = "#" + path
			return res
		}

		let resAllow = this.isEditAllowed(res.data)
		if (resAllow.code != 200) {
			this.wui_notif.Error(resAllow.message)
			return resAllow
		}

		this.com_file_path.innerText = path
		this.request.script = path
		this.wui_editor.Open(res.data)
		return res
	}

	// OpenNode is an handler that will called when user click on of the
	// item in the list.
	async OpenNode(node: WuiVfsNode): Promise<WuiResponseInterface> {
		let resAllow = this.isEditAllowed(node)
		if (resAllow.code != 200) {
			this.wui_notif.Error(resAllow.message)
			return resAllow
		}

		let res = await this.Open(node.path, node.is_dir)
		return res
	}

	isEditAllowed(node: WuiVfsNode): WuiResponseInterface {
		let res: WuiResponseInterface = {
			code: 412,
			message: "",
		}

		let is_type_allowed = false
		if (
			node.content_type.indexOf("json") >= 0 ||
			node.content_type.indexOf("message") >= 0 ||
			node.content_type.indexOf("script") >= 0 ||
			node.content_type.indexOf("text") >= 0 ||
			node.content_type.indexOf("xml") >= 0
		) {
			is_type_allowed = true
		}
		if (!is_type_allowed) {
			res.message = `The file "${node.name}" with content type "${node.content_type}" is not allowed to be opened`
			return res
		}
		if (node.size > MAX_FILE_SIZE) {
			res.message = `The file "${node.name}" with size ${
				node.size / 1000000
			}MB is greater than maximum ${
				MAX_FILE_SIZE / 1000000
			}MB.`
			return res
		}
		res.code = 200
		return res
	}

	onClickSave() {
		if (this.request.script == "") {
			return
		}
		let content = this.wui_editor.GetContent()
		let l = content.length
		if (l > 0 && content[l - 1] != "\n") {
			content += "\n"
		}
		this.request.content = content
		this.doSaveFile(this.request.script, this.request.content)
	}

	editorOnSave(content: string) {
		this.doSaveFile(this.request.script, content)
	}

	async doSaveFile(path: string, content: string) {
		let req = {
			path: path,
			content: btoa(content),
		}
		let http_res = await fetch("/awwan/api/fs", {
			method: "PUT",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify(req),
		})
		let res = await http_res.json()
		if (res.code != 200) {
			this.wui_notif.Error(
				`Failed to save file ${path}: ${res.message}`,
			)
			return null
		}

		this.wui_notif.Info(`File ${path} has been saved.`)
		return res
	}

	editorOnSelection(begin: number, end: number) {
		let stmts = this.wui_editor.lines.slice(begin, end + 1)
		for (const stmt of stmts) {
			console.log("stmt:", stmt.x, stmt.text)
		}
	}

	// execLocal request to execute the selected script on local system.
	execLocal() {
		if (this.request.script == "") {
			this.wui_notif.Error(
				`Execute on local: no file selected`,
			)
			return
		}
		this.httpApiExecute("local")
	}

	// execRemote request to execute the selected script on remote system.
	execRemote() {
		if (this.request.script == "") {
			this.wui_notif.Error(
				`Execute on remote: no file selected`,
			)
			return
		}
		this.httpApiExecute("remote")
	}

	async httpApiExecute(mode: string) {
		let selection_range = this.wui_editor.GetSelectionRange()
		if (selection_range.begin_at < 0) {
			this.request.begin_at = 0
		} else {
			this.request.begin_at = selection_range.begin_at + 1
		}
		if (selection_range.end_at < 0) {
			this.request.end_at = 0
		} else {
			this.request.end_at = selection_range.end_at + 1
		}

		this.request.mode = mode
		this.request.content = btoa(this.wui_editor.GetContent())

		let http_res = await fetch("/awwan/api/execute", {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify(this.request),
		})

		let res = await http_res.json()
		if (res.code != 200) {
			this.wui_notif.Error(`Execute failed: ${res.message}`)
			return
		}

		this.com_stdout.innerText = atob(res.data.stdout)
		if (res.data.stderr) {
			this.com_stderr.innerText = atob(res.data.stderr)
		}

		this.wui_notif.Info(
			`Successfully execute ${this.request.script} on ${mode}.`,
		)
	}
}
