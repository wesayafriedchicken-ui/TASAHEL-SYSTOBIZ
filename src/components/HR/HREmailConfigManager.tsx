import React, { useState, useEffect } from "react";
import { Mail, Settings, Plus, Trash2, Edit, Save, FileText, CheckCircle2, Key, Server, User, Braces, X, Play } from "lucide-react";

interface EmailTemplate {
  id?: number;
  name: string;
  subject: string;
  body: string;
}

interface SMTPConfig {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_pass: string;
  sender_name: string;
  sender_email: string;
}

export default function HREmailConfigManager() {
  const [activeTab, setActiveTab] = useState<"templates" | "smtp">("templates");
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [smtpConfig, setSmtpConfig] = useState<SMTPConfig>({
    smtp_host: "",
    smtp_port: 587,
    smtp_user: "",
    smtp_pass: "",
    sender_name: "",
    sender_email: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Template Form State
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateSubject, setTemplateSubject] = useState("");
  const [templateBody, setTemplateBody] = useState("");

  const PLACEHOLDERS = [
    { tag: "{Candidate First Name}", desc: "First name of candidate" },
    { tag: "{Candidate Last Name}", desc: "Last name of candidate" },
    { tag: "{Sender First Name}", desc: "Your first name" },
    { tag: "{Sender Last Name}", desc: "Your last name" },
    { tag: "{Sender Phone}", desc: "Your phone number" },
    { tag: "{Sender Extension}", desc: "Your extension number" },
    { tag: "{Sender Job Title}", desc: "Your HR job title" },
    { tag: "{Job Opening Name}", desc: "Name of the job opening" },
  ];

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/hr/recruitment/email-templates");
      if (res.ok) {
        setTemplates(await res.json());
      }
    } catch (err) {
      console.error("Error fetching templates:", err);
    }
  };

  const fetchSMTPConfig = async () => {
    try {
      const res = await fetch("/api/hr/recruitment/email-config");
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setSmtpConfig(data);
        }
      }
    } catch (err) {
      console.error("Error fetching SMTP config:", err);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchSMTPConfig();
  }, []);

  const showFeedback = (msg: string, isError = false) => {
    if (isError) {
      setError(msg);
      setTimeout(() => setError(null), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleSaveSMTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/hr/recruitment/email-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(smtpConfig),
      });
      if (res.ok) {
        showFeedback("SMTP Gateway Configuration saved successfully!");
        fetchSMTPConfig();
      } else {
        showFeedback("Failed to save configuration", true);
      }
    } catch (err) {
      showFeedback("Network error saving configuration", true);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNewTemplate = () => {
    setEditingTemplate(null);
    setTemplateName("");
    setTemplateSubject("");
    setTemplateBody("");
    setShowTemplateForm(true);
  };

  const handleOpenEditTemplate = (tpl: EmailTemplate) => {
    setEditingTemplate(tpl);
    setTemplateName(tpl.name);
    setTemplateSubject(tpl.subject);
    setTemplateBody(tpl.body);
    setShowTemplateForm(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim() || !templateSubject.trim() || !templateBody.trim()) {
      showFeedback("Please fill out all fields", true);
      return;
    }

    const payload = {
      name: templateName,
      subject: templateSubject,
      body: templateBody,
    };

    setLoading(true);
    try {
      let res;
      if (editingTemplate?.id) {
        res = await fetch(`/api/hr/recruitment/email-templates/${editingTemplate.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/hr/recruitment/email-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        showFeedback(editingTemplate ? "Email template updated!" : "New email template created!");
        setShowTemplateForm(false);
        fetchTemplates();
      } else {
        showFeedback("Failed to save email template", true);
      }
    } catch (err) {
      showFeedback("Network error saving template", true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      const res = await fetch(`/api/hr/recruitment/email-templates/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showFeedback("Template deleted successfully");
        fetchTemplates();
      } else {
        showFeedback("Failed to delete template", true);
      }
    } catch (err) {
      showFeedback("Error deleting template", true);
    }
  };

  const insertPlaceholder = (tag: string) => {
    setTemplateBody(prev => prev + tag);
  };

  return (
    <div className="space-y-6 text-slate-800 text-left">
      {/* Toast Feedbacks */}
      {successMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-2.5 font-bold animate-bounce text-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-100" />
          {successMsg}
        </div>
      )}
      {error && (
        <div className="fixed bottom-5 right-5 z-50 bg-rose-600 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-2.5 font-bold text-xs">
          <X className="w-5 h-5 text-rose-100" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => { setActiveTab("templates"); setShowTemplateForm(false); }}
          className={`px-4 py-3 text-xs font-black uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all ${
            activeTab === "templates"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <Mail className="w-4 h-4" /> Email Templates
        </button>
        <button
          onClick={() => { setActiveTab("smtp"); setShowTemplateForm(false); }}
          className={`px-4 py-3 text-xs font-black uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all ${
            activeTab === "smtp"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <Settings className="w-4 h-4" /> SMTP Email Server Config
        </button>
      </div>

      {activeTab === "templates" && (
        <div className="space-y-6">
          {!showTemplateForm ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">Recruitment Email Templates</h4>
                  <p className="text-xs text-slate-400 font-bold mt-0.5">Manage default reusable message templates used in the hiring module</p>
                </div>
                <button
                  onClick={handleOpenNewTemplate}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Create Template
                </button>
              </div>

              {templates.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 border border-slate-200 rounded-3xl">
                  <Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-xs text-slate-400 font-bold">No templates found. Create one to get started!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map(tpl => (
                    <div key={tpl.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all space-y-3 relative group">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h5 className="text-xs font-black text-slate-800 block">{tpl.name}</h5>
                          <span className="text-[10px] text-slate-400 font-bold block max-w-xs truncate">Subject: {tpl.subject}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditTemplate(tpl)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => tpl.id && handleDeleteTemplate(tpl.id)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-rose-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-[11px] text-slate-600 font-medium font-mono line-clamp-3 leading-relaxed whitespace-pre-wrap">
                        {tpl.body}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSaveTemplate} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-150 pb-3">
                <h4 className="text-sm font-black text-slate-900 uppercase">
                  {editingTemplate ? `Edit Template: ${editingTemplate.name}` : "Create New Template"}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowTemplateForm(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="space-y-1.5 text-xs font-bold">
                    <label className="text-slate-600 block">Template Name</label>
                    <input
                      type="text"
                      required
                      value={templateName}
                      onChange={e => setTemplateName(e.target.value)}
                      placeholder="e.g. Reject Application"
                      className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-1.5 text-xs font-bold">
                    <label className="text-slate-600 block">Email Subject</label>
                    <input
                      type="text"
                      required
                      value={templateSubject}
                      onChange={e => setTemplateSubject(e.target.value)}
                      placeholder="e.g. Update regarding your application - Tasahel"
                      className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-1.5 text-xs font-bold">
                    <label className="text-slate-600 block flex justify-between items-center">
                      <span>Email Body Message</span>
                      <span className="text-[10px] text-emerald-600">Tip: Click placeholders on the right to insert!</span>
                    </label>
                    <textarea
                      rows={10}
                      required
                      value={templateBody}
                      onChange={e => setTemplateBody(e.target.value)}
                      placeholder="Type your email body here. Use curly bracket placeholders..."
                      className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs font-medium font-sans leading-relaxed"
                    />
                  </div>
                </div>

                {/* Right Placeholders Sidebar */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
                    <Braces className="w-4 h-4 text-emerald-600" />
                    <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">Useful Placeholders</h5>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold leading-normal">
                    These keywords will be dynamically replaced with real-time candidate and sender info before sending the email. Click any tag below to insert it at the end of your message.
                  </p>
                  <div className="space-y-2">
                    {PLACEHOLDERS.map(p => (
                      <button
                        key={p.tag}
                        type="button"
                        onClick={() => insertPlaceholder(p.tag)}
                        className="w-full text-left p-2.5 bg-white border border-slate-200 rounded-xl hover:border-emerald-500 hover:ring-1 hover:ring-emerald-200 hover:bg-emerald-50/20 transition-all block group"
                      >
                        <span className="text-[10px] font-mono font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md block w-fit mb-1 group-hover:bg-emerald-100">
                          {p.tag}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold block">{p.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTemplateForm(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-black transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {loading ? "Saving..." : "Save Template"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {activeTab === "smtp" && (
        <form onSubmit={handleSaveSMTP} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">SMTP Outbound Mail Server Config</h4>
            <p className="text-xs text-slate-400 font-bold mt-0.5">Configure the SMTP gateway through which candidate emails will be routed</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5 text-xs font-bold">
              <label className="text-slate-600 block flex items-center gap-1">
                <Server className="w-3.5 h-3.5 text-slate-400" /> SMTP Host Server
              </label>
              <input
                type="text"
                required
                value={smtpConfig.smtp_host}
                onChange={e => setSmtpConfig({ ...smtpConfig, smtp_host: e.target.value })}
                placeholder="smtp.example.com"
                className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs font-bold"
              />
            </div>

            <div className="space-y-1.5 text-xs font-bold">
              <label className="text-slate-600 block flex items-center gap-1">
                <Settings className="w-3.5 h-3.5 text-slate-400" /> SMTP Port
              </label>
              <input
                type="number"
                required
                value={smtpConfig.smtp_port}
                onChange={e => setSmtpConfig({ ...smtpConfig, smtp_port: parseInt(e.target.value) || 587 })}
                placeholder="587"
                className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs font-bold"
              />
            </div>

            <div className="space-y-1.5 text-xs font-bold">
              <label className="text-slate-600 block flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" /> Username / Authenticated Email
              </label>
              <input
                type="text"
                required
                value={smtpConfig.smtp_user}
                onChange={e => setSmtpConfig({ ...smtpConfig, smtp_user: e.target.value })}
                placeholder="recruitment@company.com"
                className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs font-bold"
              />
            </div>

            <div className="space-y-1.5 text-xs font-bold">
              <label className="text-slate-600 block flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-slate-400" /> Secure App Password / Credentials
              </label>
              <input
                type="password"
                required
                value={smtpConfig.smtp_pass}
                onChange={e => setSmtpConfig({ ...smtpConfig, smtp_pass: e.target.value })}
                placeholder="••••••••••••••••"
                className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs font-bold"
              />
            </div>

            <div className="space-y-1.5 text-xs font-bold">
              <label className="text-slate-600 block flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" /> Default Sender Name
              </label>
              <input
                type="text"
                required
                value={smtpConfig.sender_name}
                onChange={e => setSmtpConfig({ ...smtpConfig, sender_name: e.target.value })}
                placeholder="e.g. Tasahel Recruitment Team"
                className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs font-bold"
              />
            </div>

            <div className="space-y-1.5 text-xs font-bold">
              <label className="text-slate-600 block flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> Default Sender Email Address
              </label>
              <input
                type="email"
                required
                value={smtpConfig.sender_email}
                onChange={e => setSmtpConfig({ ...smtpConfig, sender_email: e.target.value })}
                placeholder="e.g. recruitment@tasahel.com"
                className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? "Saving config..." : "Save SMTP Gateway Settings"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
