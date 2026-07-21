"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Circle,
  CheckCircle2,
  Trash2,
  Upload,
  FileText,
  ExternalLink,
  X,
  Loader2,
} from "lucide-react";

type ModalState =
  | { type: "client" }
  | { type: "project"; clientId: Id<"clients"> }
  | { type: "invoice"; projectId: Id<"projects"> }
  | { type: null };

export default function ClientsPage() {
  const clients = useQuery(api.clients.list, {});
  const createClient = useMutation(api.clients.create);
  const createProject = useMutation(api.projects.create);
  const updateProject = useMutation(api.projects.update);
  const removeProject = useMutation(api.projects.remove);
  const addTask = useMutation(api.projects.addTask);
  const toggleTask = useMutation(api.projects.toggleTask);
  const removeTask = useMutation(api.projects.removeTask);

  const [expandedClient, setExpandedClient] = useState<Id<"clients"> | null>(null);
  const [expandedProject, setExpandedProject] = useState<Id<"projects"> | null>(null);
  const [modal, setModal] = useState<ModalState>({ type: null });

  const [newClient, setNewClient] = useState({ clientName: "", company: "", email: "", phone: "" });
  const [newProject, setNewProject] = useState({ clientId: "" as Id<"clients">, projectName: "", description: "", status: "Active", startDate: "", totalValue: 0 });
  const [submitting, setSubmitting] = useState(false);

  if (clients === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-lg">Loading...</div>
      </div>
    );
  }

  const handleCreateClient = async () => {
    if (!newClient.clientName || !newClient.company) return;
    setSubmitting(true);
    await createClient({
      clientName: newClient.clientName,
      company: newClient.company,
      email: newClient.email,
      phone: newClient.phone,
    });
    setNewClient({ clientName: "", company: "", email: "", phone: "" });
    setSubmitting(false);
    setModal({ type: null });
  };

  const handleCreateProject = async () => {
    if (!newProject.projectName) return;
    setSubmitting(true);
    const projectStartDate = newProject.startDate || new Date().toISOString().split("T")[0];
    await createProject({
      clientId: newProject.clientId,
      projectName: newProject.projectName,
      description: newProject.description,
      status: newProject.status,
      startDate: projectStartDate,
      totalValue: newProject.totalValue,
    });
    setNewProject({ clientId: "" as Id<"clients">, projectName: "", description: "", status: "Active", startDate: "", totalValue: 0 });
    setSubmitting(false);
    setModal({ type: null });
  };

  const handleAddTask = async (projectId: Id<"projects">, taskName: string) => {
    if (!taskName.trim()) return;
    await addTask({ projectId, taskName: taskName.trim() });
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Clients & Projects</h1>
        <button
          onClick={() => setModal({ type: "client" })}
          className="flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          <Plus size={16} /> Add Client
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">No clients yet.</p>
          <p className="text-sm mt-1">Clients are automatically created when a lead is marked as Won.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((client) => (
            <ClientCard
              key={client._id}
              client={client}
              expanded={expandedClient === client._id}
              onToggle={() => setExpandedClient(expandedClient === client._id ? null : client._id)}
              expandedProject={expandedProject}
              onToggleProject={(pid) => setExpandedProject(expandedProject === pid ? null : pid)}
              onAddProject={() => {
                setNewProject({ ...newProject, clientId: client._id });
                setModal({ type: "project", clientId: client._id });
              }}
              onAddTask={handleAddTask}
              toggleTask={toggleTask}
              removeTask={removeTask}
              updateProject={updateProject}
              removeProject={removeProject}
              onAddInvoice={(projectId) => setModal({ type: "invoice", projectId })}
            />
          ))}
        </div>
      )}

      {modal.type === "client" && (
        <Modal onClose={() => setModal({ type: null })} title="Add Client">
          <div className="space-y-3">
            <input
              placeholder="Client Name *"
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm"
              value={newClient.clientName}
              onChange={(e) => setNewClient({ ...newClient, clientName: e.target.value })}
            />
            <input
              placeholder="Company *"
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm"
              value={newClient.company}
              onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
            />
            <input
              placeholder="Email"
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm"
              value={newClient.email}
              onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
            />
            <input
              placeholder="Phone"
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm"
              value={newClient.phone}
              onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
            />
            <button
              onClick={handleCreateClient}
              disabled={submitting || !newClient.clientName || !newClient.company}
              className="w-full bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50"
            >
              {submitting ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Create Client"}
            </button>
          </div>
        </Modal>
      )}

      {modal.type === "project" && (
        <Modal onClose={() => setModal({ type: null })} title="Add Project">
          <div className="space-y-3">
            <input
              placeholder="Project Name *"
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm"
              value={newProject.projectName}
              onChange={(e) => setNewProject({ ...newProject, projectName: e.target.value })}
            />
            <textarea
              placeholder="Description"
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm"
              rows={3}
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            />
            <div className="flex gap-3">
              <select
                className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-sm"
                value={newProject.status}
                onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
              >
                <option>Active</option>
                <option>On-Hold</option>
                <option>Completed</option>
                <option>Cancelled</option>
              </select>
              <input
                type="number"
                placeholder="Total Value"
                className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-sm"
                value={newProject.totalValue || ""}
                onChange={(e) => setNewProject({ ...newProject, totalValue: Number(e.target.value) })}
              />
            </div>
            <input
              type="date"
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm"
              value={newProject.startDate}
              onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
            />
            <button
              onClick={handleCreateProject}
              disabled={submitting || !newProject.projectName}
              className="w-full bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50"
            >
              {submitting ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Create Project"}
            </button>
          </div>
        </Modal>
      )}

      {modal.type === "invoice" && (
        <InvoiceModal
          projectId={modal.projectId}
          onClose={() => setModal({ type: null })}
        />
      )}
    </div>
  );
}

function ClientCard({
  client, expanded, onToggle, expandedProject, onToggleProject,
  onAddProject, onAddTask,
  toggleTask, removeTask, updateProject, removeProject, onAddInvoice,
}: {
  client: { _id: Id<"clients">; clientName: string; company: string; email: string; phone: string; createdAt: string };
  expanded: boolean;
  onToggle: () => void;
  expandedProject: Id<"projects"> | null;
  onToggleProject: (id: Id<"projects">) => void;
  onAddProject: () => void;
  onAddTask: (projectId: Id<"projects">, taskName: string) => Promise<void>;
  toggleTask: ReturnType<typeof useMutation<typeof api.projects.toggleTask>>;
  removeTask: ReturnType<typeof useMutation<typeof api.projects.removeTask>>;
  updateProject: ReturnType<typeof useMutation<typeof api.projects.update>>;
  removeProject: ReturnType<typeof useMutation<typeof api.projects.remove>>;
  onAddInvoice: (projectId: Id<"projects">) => void;
}) {
  const projects = useQuery(api.projects.getByClientId, { clientId: client._id });

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown size={18} className="text-zinc-400" /> : <ChevronRight size={18} className="text-zinc-400" />}
          <div>
            <span className="font-semibold">{client.clientName}</span>
            <span className="text-zinc-400 text-sm ml-2">{client.company}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm text-zinc-400">
          {client.email && <span>{client.email}</span>}
          {projects && <span className="bg-zinc-100 px-2 py-0.5 rounded-full text-xs font-medium text-zinc-600">{projects.length} projects</span>}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-zinc-100 p-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {client.email && (
              <div>
                <span className="text-zinc-400 text-xs">Email</span>
                <p>{client.email}</p>
              </div>
            )}
            {client.phone && (
              <div>
                <span className="text-zinc-400 text-xs">Phone</span>
                <p>{client.phone}</p>
              </div>
            )}
            <div>
              <span className="text-zinc-400 text-xs">Created</span>
              <p>{new Date(client.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm text-zinc-500 uppercase tracking-wider">Projects</h3>
            <button
              onClick={onAddProject}
              className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              <Plus size={14} /> Add Project
            </button>
          </div>

          {projects?.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-4">No projects yet</p>
          ) : (
            <div className="space-y-2">
              {projects?.map((project) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  expanded={expandedProject === project._id}
                  onToggle={() => onToggleProject(project._id)}
                  onAddTask={(taskName: string) => onAddTask(project._id, taskName)}
                  toggleTask={toggleTask}
                  removeTask={removeTask}
                  updateProject={updateProject}
                  removeProject={removeProject}
                  onAddInvoice={() => onAddInvoice(project._id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProjectCard({
  project, expanded, onToggle, onAddTask,
  toggleTask, removeTask, updateProject, removeProject, onAddInvoice,
}: {
  project: { _id: Id<"projects">; projectName: string; description: string; status: string; startDate: string; deadline?: string; totalValue: number; notes?: string };
  expanded: boolean;
  onToggle: () => void;
  onAddTask: (taskName: string) => Promise<void>;
  toggleTask: ReturnType<typeof useMutation<typeof api.projects.toggleTask>>;
  removeTask: ReturnType<typeof useMutation<typeof api.projects.removeTask>>;
  updateProject: ReturnType<typeof useMutation<typeof api.projects.update>>;
  removeProject: ReturnType<typeof useMutation<typeof api.projects.remove>>;
  onAddInvoice: () => void;
}) {
  const tasks = useQuery(api.projects.listTasks, { projectId: project._id });
  const invoices = useQuery(api.invoices.getByProjectId, { projectId: project._id });

  const statusColor: Record<string, string> = {
    Active: "bg-blue-100 text-blue-700",
    "On-Hold": "bg-amber-100 text-amber-700",
    Completed: "bg-green-100 text-green-700",
    Cancelled: "bg-zinc-100 text-zinc-500",
  };

  const [editingStatus, setEditingStatus] = useState(false);
  const [localTask, setLocalTask] = useState("");

  const handleStatusChange = async (newStatus: string) => {
    await updateProject({ id: project._id, status: newStatus });
    setEditingStatus(false);
  };

  const handleRemoveProject = async () => {
    if (confirm("Delete this project and all its tasks/invoices?")) {
      await removeProject({ id: project._id });
    }
  };

  return (
    <div className="border border-zinc-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-zinc-50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown size="16" className="text-zinc-400" /> : <ChevronRight size="16" className="text-zinc-400" />}
          <span className="font-medium text-sm">{project.projectName}</span>
          {editingStatus ? (
            <select
              className="text-xs border rounded px-1 py-0.5"
              value={project.status}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => handleStatusChange(e.target.value)}
              autoFocus
              onBlur={() => setEditingStatus(false)}
            >
              <option>Active</option>
              <option>On-Hold</option>
              <option>Completed</option>
              <option>Cancelled</option>
            </select>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setEditingStatus(true); }}
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusColor[project.status] || "bg-zinc-100 text-zinc-600"}`}
            >
              {project.status}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span>${project.totalValue.toLocaleString()}</span>
          {tasks && <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-[11px]">{tasks.filter(t => t.completed).length}/{tasks.length} tasks</span>}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-zinc-100 p-3 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-zinc-600">
            {project.description && (
              <div className="col-span-full">
                <span className="text-zinc-400">Description:</span>
                <p className="mt-0.5">{project.description}</p>
              </div>
            )}
            <div>
              <span className="text-zinc-400">Start:</span>
              <p>{new Date(project.startDate).toLocaleDateString()}</p>
            </div>
            {project.deadline && (
              <div>
                <span className="text-zinc-400">Deadline:</span>
                <p>{new Date(project.deadline).toLocaleDateString()}</p>
              </div>
            )}
            <div>
              <span className="text-zinc-400">Value:</span>
              <p className="font-medium">${project.totalValue.toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Tasks</h4>
            </div>
            <div className="space-y-1">
              {tasks?.map((task) => (
                <div key={task._id} className="flex items-center gap-2 group">
                  <button
                    onClick={() => toggleTask({ id: task._id, completed: !task.completed })}
                    className="shrink-0"
                  >
                    {task.completed ? (
                      <CheckCircle2 size={16} className="text-green-500" />
                    ) : (
                      <Circle size={16} className="text-zinc-300 group-hover:text-zinc-400" />
                    )}
                  </button>
                  <span className={`text-sm flex-1 ${task.completed ? "line-through text-zinc-400" : ""}`}>
                    {task.taskName}
                  </span>
                  <button
                    onClick={() => removeTask({ id: task._id })}
                    className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {tasks?.length === 0 && (
                <p className="text-xs text-zinc-400 py-1">No tasks yet</p>
              )}
            </div>
            <div className="flex gap-2">
              <input
                placeholder="Add a task..."
                className="flex-1 border border-zinc-200 rounded-lg px-3 py-1.5 text-sm"
                value={localTask}
                onChange={(e) => setLocalTask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && localTask.trim()) {
                    onAddTask(localTask);
                    setLocalTask("");
                  }
                }}
              />
              <button
                onClick={() => {
                  onAddTask(localTask);
                  setLocalTask("");
                }}
                disabled={!localTask.trim()}
                className="bg-black text-white px-3 py-1.5 rounded-lg text-sm disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Invoices</h4>
              <button
                onClick={onAddInvoice}
                className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium"
              >
                <Upload size={12} /> Upload Invoice
              </button>
            </div>
            {invoices?.length === 0 ? (
              <p className="text-xs text-zinc-400 py-1">No invoices yet</p>
            ) : (
              <div className="space-y-1">
                {invoices?.map((inv) => (
                  <InvoiceRow key={inv._id} invoice={inv} />
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleRemoveProject}
            className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
          >
            Delete project
          </button>
        </div>
      )}
    </div>
  );
}

function InvoiceRow({ invoice }: {
  invoice: {
    _id: Id<"invoices">;
    invoiceNumber: string;
    amount: number;
    status: string;
    fileId?: Id<"_storage">;
    fileName?: string;
    notes?: string;
  };
}) {
  const fileUrl = useQuery(
    api.invoices.getFileUrl,
    invoice.fileId ? { storageId: invoice.fileId } : "skip"
  );
  const updateInvoice = useMutation(api.invoices.update);
  const removeInvoice = useMutation(api.invoices.remove);

  const statusColor: Record<string, string> = {
    Pending: "bg-amber-100 text-amber-700",
    Paid: "bg-green-100 text-green-700",
    Overdue: "bg-red-100 text-red-700",
    Cancelled: "bg-zinc-100 text-zinc-500",
  };

  const [editingStatus, setEditingStatus] = useState(false);

  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-zinc-50 group">
      <div className="flex items-center gap-2 min-w-0">
        <FileText size={14} className="text-zinc-400 shrink-0" />
        <span className="text-sm font-medium truncate">{invoice.invoiceNumber}</span>
        <span className="text-sm text-zinc-500">${invoice.amount.toLocaleString()}</span>
        {editingStatus ? (
          <select
            className="text-[11px] border rounded px-1 py-0.5"
            value={invoice.status}
            onChange={(e) => { updateInvoice({ id: invoice._id, status: e.target.value }); setEditingStatus(false); }}
            autoFocus
            onBlur={() => setEditingStatus(false)}
          >
            <option>Pending</option>
            <option>Paid</option>
            <option>Overdue</option>
            <option>Cancelled</option>
          </select>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); setEditingStatus(true); }}
            className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${statusColor[invoice.status] || "bg-zinc-100 text-zinc-600"}`}
          >
            {invoice.status}
          </button>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
        {fileUrl && (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 text-zinc-400 hover:text-zinc-600"
            title="View PDF"
          >
            <ExternalLink size={14} />
          </a>
        )}
        <button
          onClick={() => { if (confirm("Delete this invoice?")) removeInvoice({ id: invoice._id }); }}
          className="p-1 text-zinc-400 hover:text-red-500"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-zinc-100">
          <h2 className="font-semibold">{title}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X size={18} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function InvoiceModal({ projectId, onClose }: { projectId: Id<"projects">; onClose: () => void }) {
  const generateUploadUrl = useMutation(api.invoices.generateUploadUrl);
  const createInvoice = useMutation(api.invoices.create);

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [amount, setAmount] = useState(0);
  const [status, setStatus] = useState("Pending");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    if (!invoiceNumber || amount <= 0) return;
    setUploading(true);

    try {
      let fileId: Id<"_storage"> | undefined;
      let fileName: string | undefined;

      if (file) {
        const uploadUrl = await generateUploadUrl();
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(uploadUrl, { method: "POST", body: formData });
        const result = await res.json();
        fileId = result.storageId;
        fileName = file.name;
      }

      await createInvoice({
        projectId,
        invoiceNumber,
        amount,
        status,
        fileId,
        fileName,
        notes: notes || undefined,
      });

      onClose();
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Upload Invoice">
      <div className="space-y-3">
        <input
          placeholder="Invoice Number *"
          className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm"
          value={invoiceNumber}
          onChange={(e) => setInvoiceNumber(e.target.value)}
        />
        <div className="flex gap-3">
          <input
            type="number"
            placeholder="Amount *"
            className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-sm"
            value={amount || ""}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
          <select
            className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option>Pending</option>
            <option>Paid</option>
            <option>Overdue</option>
          </select>
        </div>
        <label className="flex items-center gap-2 border border-zinc-300 rounded-lg px-3 py-2 text-sm cursor-pointer hover:bg-zinc-50">
          <Upload size={16} className="text-zinc-400" />
          <span className={file ? "text-zinc-800" : "text-zinc-400"}>
            {file ? file.name : "Upload PDF"}
          </span>
          <input
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>
        <textarea
          placeholder="Notes (optional)"
          className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button
          onClick={handleSubmit}
          disabled={uploading || !invoiceNumber || amount <= 0}
          className="w-full bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {uploading ? "Uploading..." : "Save Invoice"}
        </button>
      </div>
    </Modal>
  );
}
