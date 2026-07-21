"use client";

import { useState, useEffect } from "react";
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
  X,
  Loader2,
  Download,
  Eye,
  Check,
  XCircle,
  Briefcase,
} from "lucide-react";

type ModalState =
  | { type: "client" }
  | { type: "project"; clientId: Id<"clients"> }
  | { type: "invoice"; projectId: Id<"projects"> }
  | { type: "service"; clientId: Id<"clients"> }
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
  const backfill = useMutation(api.migrations.backfillClientsFromWonLeads);

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

      <div className="mb-4 flex justify-end">
        <BackfillButton onBackfill={backfill} />
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">No clients yet.</p>
          <p className="text-sm mt-1">Clients are automatically created when a lead is marked as Won.</p>
          <div className="mt-4 flex justify-center">
            <BackfillButton onBackfill={backfill} />
          </div>
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
              onAddService={() => {
                setModal({ type: "service", clientId: client._id });
              }}
            />
          ))}
        </div>
      )}

      {modal.type === "service" && (
        <ServiceModal
          clientId={modal.clientId}
          onClose={() => setModal({ type: null })}
        />
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
  onAddService,
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
  onAddService: () => void;
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

          <div className="border-t border-zinc-100 pt-4 mt-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm text-zinc-500 uppercase tracking-wider">Services & Quotes</h3>
              <button
                onClick={onAddService}
                className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium"
              >
                <Plus size={14} /> Add Service
              </button>
            </div>
            <ServicesList clientId={client._id} />
          </div>
        </div>
      )}
    </div>
  );
}

function ServicesList({ clientId }: { clientId: Id<"clients"> }) {
  const services = useQuery(api.services.listByClient, { clientId });
  const updateStatus = useMutation(api.services.updateStatus);
  const removeService = useMutation(api.services.remove);

  const [viewQuote, setViewQuote] = useState<{ storageId: Id<"_storage">; fileName: string } | null>(null);

  if (!services) return <div className="text-sm text-zinc-400">Loading...</div>;

  if (services.length === 0) {
    return <p className="text-sm text-zinc-400 text-center py-4">No services added yet</p>;
  }

  return (
    <div className="space-y-2">
      {services.map((s) => (
        <ServiceRow
          key={s._id}
          service={s}
          onAccept={() => updateStatus({ id: s._id, status: "Accepted" })}
          onDecline={() => updateStatus({ id: s._id, status: "Declined" })}
          onRemove={() => { if (confirm("Remove this service?")) removeService({ id: s._id }); }}
                  onViewQuote={() => setViewQuote({ storageId: s.quoteFileId!, fileName: s.quoteFileName || "Quote.pdf" })}
        />
      ))}
      {viewQuote && (
        <PdfPreviewModal
          storageId={viewQuote.storageId}
          fileName={viewQuote.fileName}
          onClose={() => setViewQuote(null)}
          onDownload={() => {}}
        />
      )}
    </div>
  );
}

function ServiceRow({
  service, onAccept, onDecline, onRemove, onViewQuote,
}: {
  service: {
    _id: Id<"services">;
    category: string;
    serviceName: string;
    description?: string;
    quoteAmount: number;
    quoteFileId?: Id<"_storage">;
    quoteFileName?: string;
    status: string;
  };
  onAccept: () => void;
  onDecline: () => void;
  onRemove: () => void;
  onViewQuote: () => void;
}) {
  const quoteUrl = useQuery(
    api.services.getFileUrl,
    service.quoteFileId ? { storageId: service.quoteFileId } : "skip"
  );

  return (
    <div className="border border-zinc-200 rounded-lg p-3 flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Briefcase size={14} className="text-zinc-400 shrink-0" />
          <span className="text-sm font-medium truncate">{service.serviceName}</span>
          <span className="text-[10px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">
            {service.category}
          </span>
        </div>
        {service.description && (
          <p className="text-xs text-zinc-500 mt-1">{service.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-sm font-semibold">${service.quoteAmount.toLocaleString()}</span>
          <StatusBadge status={service.status} />
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {quoteUrl && (
          <button
            onClick={() => { onViewQuote(); }}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-md transition-colors"
            title="View Quote"
          >
            <Eye size={15} />
          </button>
        )}
        {service.status === "Pending" && (
          <>
            <button
              onClick={onAccept}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
              title="Accept"
            >
              <Check size={15} />
            </button>
            <button
              onClick={onDecline}
              className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
              title="Decline"
            >
              <XCircle size={15} />
            </button>
          </>
        )}
        <button
          onClick={onRemove}
          className="p-1.5 text-zinc-400 hover:text-red-500 rounded-md transition-colors"
          title="Remove"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Pending: "bg-amber-100 text-amber-700",
    Accepted: "bg-green-100 text-green-700",
    Declined: "bg-red-100 text-red-700",
  };
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${colors[status] || "bg-zinc-100 text-zinc-500"}`}>
      {status}
    </span>
  );
}

function ServiceModal({ clientId, onClose }: { clientId: Id<"clients">; onClose: () => void }) {
  const generateUploadUrl = useMutation(api.services.generateUploadUrl);
  const createService = useMutation(api.services.create);

  const [category, setCategory] = useState("Software Development");
  const [serviceName, setServiceName] = useState("");
  const [description, setDescription] = useState("");
  const [quoteAmount, setQuoteAmount] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const serviceOptions: Record<string, string[]> = {
    "Software Development": [
      "Web Application", "Mobile App (iOS)", "Mobile App (Android)",
      "API Development", "Database Design & Architecture",
      "Cloud Migration & Infrastructure", "DevOps & CI/CD Setup",
      "Code Audit & Refactoring", "UI/UX Design & Prototyping",
      "E-commerce Platform", "CMS Development", "Custom CRM Development",
      "SaaS Platform Development", "Blockchain / DLT Solution",
      "Smart Contract Development", "QA & Automated Testing",
      "Security Audit & Penetration Testing",
      "Legacy System Migration", "Microservices Architecture",
      "Real-time System (WebSocket/SSE)",
    ],
    "Marketing Services": [
      "SEO Optimization", "PPC Campaign Management",
      "Social Media Management", "Content Marketing Strategy",
      "Email Marketing & Automation", "Brand Strategy & Identity",
      "Market Research & Analysis", "Conversion Rate Optimization",
      "Marketing Automation Setup", "Influencer Marketing",
      "Video Production & Editing", "Copywriting & Content Creation",
      "PR & Communications", "Analytics & Reporting Dashboard",
      "Growth Strategy Consulting",
    ],
    "AI Services": [
      "Custom AI Model Development", "Chatbot / Conversational AI",
      "Data Pipeline & ETL Engineering", "NLP / Text Analytics Solution",
      "Computer Vision System", "RAG (Retrieval Augmented Generation)",
      "AI Consulting & Strategy", "ML Ops & Model Deployment",
      "Predictive Analytics Engine", "Recommendation System",
      "Document Intelligence (OCR/Extraction)",
      "Voice AI / Speech Recognition",
    ],
  };

  const currentServices = serviceOptions[category] ?? [];

  const handleSubmit = async () => {
    if (!serviceName || quoteAmount <= 0) return;
    setUploading(true);
    try {
      let quoteFileId: Id<"_storage"> | undefined;
      let quoteFileName: string | undefined;
      if (file) {
        const uploadUrl = await generateUploadUrl();
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(uploadUrl, { method: "POST", body: formData });
        const result = await res.json();
        quoteFileId = result.storageId;
        quoteFileName = file.name;
      }
      await createService({
        clientId,
        category,
        serviceName,
        description: description || undefined,
        quoteAmount,
        quoteFileId,
        quoteFileName,
      });
      onClose();
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Add Service / Quote">
      <div className="space-y-3">
        <select
          className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm"
          value={category}
          onChange={(e) => { setCategory(e.target.value); setServiceName(""); }}
        >
          <option>Software Development</option>
          <option>Marketing Services</option>
          <option>AI Services</option>
        </select>

        <select
          className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm"
          value={serviceName}
          onChange={(e) => setServiceName(e.target.value)}
        >
          <option value="">Select a service...</option>
          {currentServices.map((s: string) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <textarea
          placeholder="Description (optional)"
          className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          type="number"
          placeholder="Quote Amount *"
          className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm"
          value={quoteAmount || ""}
          onChange={(e) => setQuoteAmount(Number(e.target.value))}
        />

        <label className="flex items-center gap-2 border border-zinc-300 rounded-lg px-3 py-2 text-sm cursor-pointer hover:bg-zinc-50">
          <Upload size={16} className="text-zinc-400" />
          <span className={file ? "text-zinc-800" : "text-zinc-400"}>
            {file ? file.name : "Upload Quote PDF"}
          </span>
          <input
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>

        <button
          onClick={handleSubmit}
          disabled={uploading || !serviceName || quoteAmount <= 0}
          className="w-full bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          {uploading ? "Uploading..." : "Add Service"}
        </button>
      </div>
    </Modal>
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

  const [showPdf, setShowPdf] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const statusColor: Record<string, string> = {
    Pending: "bg-amber-100 text-amber-700",
    Paid: "bg-green-100 text-green-700",
    Overdue: "bg-red-100 text-red-700",
    Cancelled: "bg-zinc-100 text-zinc-500",
  };

  const [editingStatus, setEditingStatus] = useState(false);

  const handleDownload = async () => {
    if (!fileUrl) return;
    setDownloading(true);
    try {
      const res = await fetch(fileUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = invoice.fileName || `invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
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
            <>
              <button
                onClick={() => setShowPdf(true)}
                className="p-1 text-zinc-400 hover:text-zinc-600"
                title="View PDF"
              >
                <Eye size={14} />
              </button>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="p-1 text-zinc-400 hover:text-zinc-600"
                title="Download PDF"
              >
                {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              </button>
            </>
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

      {showPdf && fileUrl && (
        <PdfPreviewModal
          fileUrl={fileUrl}
          fileName={invoice.fileName || `invoice-${invoice.invoiceNumber}.pdf`}
          onClose={() => setShowPdf(false)}
          onDownload={handleDownload}
        />
      )}
    </>
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

function PdfPreviewModal({ fileUrl, fileName, onClose, onDownload, storageId }: {
  fileUrl?: string;
  fileName: string;
  onClose: () => void;
  onDownload: () => void;
  storageId?: Id<"_storage">;
}) {
  const resolvedUrl = useQuery(
    api.services.getFileUrl,
    storageId ? { storageId } : "skip"
  );
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const src = storageId ? resolvedUrl : fileUrl;

  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    fetch(src)
      .then((res) => res.blob())
      .then((blob) => {
        if (!cancelled) {
          const url = URL.createObjectURL(blob);
          setLocalUrl(url);
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
    return () => { cancelled = true; };
  }, [src]);

  useEffect(() => {
    return () => { if (localUrl) URL.revokeObjectURL(localUrl); };
  }, [localUrl]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-0">
      <div className="bg-white w-full h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-zinc-200 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <FileText size={18} className="text-red-500 shrink-0" />
            <span className="font-medium text-sm truncate">{fileName}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onDownload}
              className="flex items-center gap-1.5 text-xs bg-black text-white px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <Download size={14} />
              Download
            </button>
            <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="flex-1 bg-zinc-100 overflow-hidden">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 size={32} className="animate-spin text-zinc-400" />
            </div>
          ) : localUrl ? (
            <iframe
              src={localUrl}
              className="w-full h-full border-0"
              title={fileName}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-zinc-400">Failed to load PDF</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BackfillButton({ onBackfill }: { onBackfill: ReturnType<typeof useMutation<typeof api.migrations.backfillClientsFromWonLeads>> }) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number; totalWon: number } | null>(null);

  const handleClick = async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await onBackfill();
      setResult(res);
    } catch (e) {
      console.error(e);
      alert("Backfill failed. Check console.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {result && (
        <span className="text-xs text-green-600">
          Created {result.created} client{result.created !== 1 ? "s" : ""}
          {result.skipped > 0 ? ` (${result.skipped} already existed)` : ""}
        </span>
      )}
      <button
        onClick={handleClick}
        disabled={running}
        className="flex items-center gap-1.5 text-xs text-zinc-500 border border-zinc-300 px-3 py-1.5 rounded-lg hover:bg-zinc-50 disabled:opacity-50"
      >
        {running ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
        {running ? "Syncing..." : "Sync Won Leads"}
      </button>
    </div>
  );
}
