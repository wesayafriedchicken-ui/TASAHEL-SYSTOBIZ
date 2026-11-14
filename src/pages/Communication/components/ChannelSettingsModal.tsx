import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Hash,
  Lock,
  Users,
  UserPlus,
  UserMinus,
  Trash2,
  Edit3,
  Search,
  Check,
  AlertTriangle,
  Loader2,
  Shield,
  Clock,
  Building
} from 'lucide-react';
import { useComm } from '../context/CommContext';
import { CommChannel, CommUser, PresenceStatus } from '../types';

interface ChannelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: CommChannel;
  initialTab?: 'members' | 'edit' | 'danger';
  onChannelDeleted?: () => void;
  onChannelUpdated?: (updated: CommChannel) => void;
}

export const ChannelSettingsModal: React.FC<ChannelSettingsModalProps> = ({
  isOpen,
  onClose,
  channel,
  initialTab = 'members',
  onChannelDeleted,
  onChannelUpdated,
}) => {
  const {
    currentUser,
    employees,
    userPresences,
    updateChannel,
    deleteChannel,
    getChannelMembers,
    addChannelMember,
    removeChannelMember,
  } = useComm();

  const [activeTab, setActiveTab] = useState<'members' | 'edit' | 'danger'>(initialTab);

  // Edit details state
  const [name, setName] = useState(channel.name || '');
  const [description, setDescription] = useState(channel.description || '');
  const [isPrivate, setIsPrivate] = useState(!!channel.is_private);
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsSuccess, setDetailsSuccess] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Members state
  const [members, setMembers] = useState<CommUser[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [showAddMembersPanel, setShowAddMembersPanel] = useState(false);
  const [newMemberSearchQuery, setNewMemberSearchQuery] = useState('');
  const [selectedToAdd, setSelectedToAdd] = useState<number[]>([]);
  const [addingMembers, setAddingMembers] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<{ id: number; name: string; isSelf: boolean } | null>(null);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [memberSuccess, setMemberSuccess] = useState<string | null>(null);

  // Delete channel state
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Reset states when channel changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setName(channel.name || '');
      setDescription(channel.description || '');
      setIsPrivate(!!channel.is_private);
      setDetailsError(null);
      setDetailsSuccess(false);
      setShowAddMembersPanel(false);
      setSelectedToAdd([]);
      setDeleteConfirmText('');
      setDeleteError(null);
      loadMembers();
    }
  }, [isOpen, channel.id, initialTab]);

  const loadMembers = async () => {
    setLoadingMembers(true);
    setMemberError(null);
    try {
      const data = await getChannelMembers(channel.id);
      setMembers(data);
    } catch (err: any) {
      setMemberError(err.message || 'Failed to load channel members');
    } finally {
      setLoadingMembers(false);
    }
  };

  // Filter existing members
  const filteredMembers = useMemo(() => {
    if (!memberSearchQuery.trim()) return members;
    const q = memberSearchQuery.toLowerCase();
    return members.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        (m as any).department_name?.toLowerCase().includes(q)
    );
  }, [members, memberSearchQuery]);

  // Workspace employees who are NOT yet in the channel
  const availableEmployeesToAdd = useMemo(() => {
    const memberIds = new Set(members.map((m) => m.id));
    let available = employees.filter((emp) => !memberIds.has(emp.id));
    if (newMemberSearchQuery.trim()) {
      const q = newMemberSearchQuery.toLowerCase();
      available = available.filter(
        (emp) =>
          emp.name?.toLowerCase().includes(q) ||
          emp.email?.toLowerCase().includes(q) ||
          emp.department?.toLowerCase().includes(q)
      );
    }
    return available;
  }, [employees, members, newMemberSearchQuery]);

  if (!isOpen) return null;

  // Handle Edit Channel Details Submit
  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setDetailsError('Channel name cannot be empty');
      return;
    }

    setSavingDetails(true);
    setDetailsError(null);
    setDetailsSuccess(false);

    try {
      const updated = await updateChannel(channel.id, {
        name: name.trim(),
        description: description.trim(),
        is_private: isPrivate,
      });
      setDetailsSuccess(true);
      if (onChannelUpdated) {
        onChannelUpdated(updated);
      }
      setTimeout(() => setDetailsSuccess(false), 3000);
    } catch (err: any) {
      setDetailsError(err.message || 'Failed to update channel details');
    } finally {
      setSavingDetails(false);
    }
  };

  // Handle Add Members
  const handleAddSelectedMembers = async () => {
    if (selectedToAdd.length === 0) return;
    setAddingMembers(true);
    setMemberError(null);
    setMemberSuccess(null);

    try {
      await addChannelMember(channel.id, selectedToAdd);
      setMemberSuccess(`Successfully added ${selectedToAdd.length} member(s)`);
      setSelectedToAdd([]);
      setShowAddMembersPanel(false);
      await loadMembers();
      setTimeout(() => setMemberSuccess(null), 3000);
    } catch (err: any) {
      setMemberError(err.message || 'Failed to add members');
    } finally {
      setAddingMembers(false);
    }
  };

  // Toggle selection for adding
  const toggleSelectUserToAdd = (userId: number) => {
    setSelectedToAdd((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Handle Remove Member
  const requestRemoveMember = (userId: number, userName: string) => {
    const isSelf = userId === currentUser?.id;
    setMemberToRemove({ id: userId, name: userName, isSelf });
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;
    const { id: userId, name: userName, isSelf } = memberToRemove;

    setRemovingMemberId(userId);
    setMemberError(null);
    try {
      await removeChannelMember(channel.id, userId);
      setMembers((prev) => prev.filter((m) => m.id !== userId));
      setMemberSuccess(`${userName} was removed from the channel`);
      setMemberToRemove(null);
      setTimeout(() => setMemberSuccess(null), 3000);

      // If user removed themselves, close modal and trigger channel navigation
      if (isSelf && onChannelDeleted) {
        onClose();
        onChannelDeleted();
      }
    } catch (err: any) {
      setMemberError(err.message || 'Failed to remove member');
    } finally {
      setRemovingMemberId(null);
    }
  };

  // Handle Delete Channel
  const handleDeleteChannel = async () => {
    if (deleteConfirmText.trim().toLowerCase() !== channel.name.toLowerCase()) {
      setDeleteError(`Please type "${channel.name}" exactly to confirm deletion.`);
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteChannel(channel.id);
      onClose();
      if (onChannelDeleted) {
        onChannelDeleted();
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete channel');
      setIsDeleting(false);
    }
  };

  const getPresenceColor = (status?: PresenceStatus) => {
    switch (status) {
      case 'online':
        return 'bg-emerald-500 ring-white';
      case 'busy':
        return 'bg-rose-500 ring-white';
      case 'away':
        return 'bg-amber-500 ring-white';
      default:
        return 'bg-slate-400 ring-white';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              {channel.is_private ? <Lock className="w-5 h-5" /> : <Hash className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800">#{channel.name}</h3>
                {channel.is_private && (
                  <span className="text-[10px] bg-amber-50 text-amber-700 font-semibold px-1.5 py-0.5 rounded border border-amber-200">
                    Private
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">Channel Management & Permissions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 px-6 bg-white gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 text-xs font-bold transition-colors ${
              activeTab === 'members'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Members</span>
            <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold">
              {members.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 text-xs font-bold transition-colors ${
              activeTab === 'edit'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Channel Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('danger')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 text-xs font-bold transition-colors ml-auto ${
              activeTab === 'danger'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-400 hover:text-rose-600'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Danger Zone</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* TAB 1: MEMBERS */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              {memberError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-between">
                  <span>{memberError}</span>
                  <button onClick={() => setMemberError(null)} className="text-rose-400 hover:text-rose-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {memberSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{memberSuccess}</span>
                </div>
              )}

              {/* Members Top Toolbar */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    placeholder="Search channel members..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                  />
                  {memberSearchQuery && (
                    <button
                      onClick={() => setMemberSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddMembersPanel(!showAddMembersPanel)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shrink-0 shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{showAddMembersPanel ? 'Close Add' : 'Add Members'}</span>
                </button>
              </div>

              {/* Add Members Drawer / Panel */}
              {showAddMembersPanel && (
                <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-indigo-900">Add Workspace Colleagues</h4>
                      <p className="text-[11px] text-indigo-700">
                        Select team members to grant access to #{channel.name}
                      </p>
                    </div>
                    {availableEmployeesToAdd.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedToAdd.length === availableEmployeesToAdd.length) {
                            setSelectedToAdd([]);
                          } else {
                            setSelectedToAdd(availableEmployeesToAdd.map((e) => e.id));
                          }
                        }}
                        className="text-[11px] text-indigo-600 font-semibold hover:underline"
                      >
                        {selectedToAdd.length === availableEmployeesToAdd.length
                          ? 'Deselect All'
                          : 'Select All'}
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={newMemberSearchQuery}
                      onChange={(e) => setNewMemberSearchQuery(e.target.value)}
                      placeholder="Filter employees by name, email or department..."
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-indigo-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  {/* Employees to select */}
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-indigo-100/60">
                    {availableEmployeesToAdd.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-2 text-center">
                        All workspace employees are already members of this channel.
                      </p>
                    ) : (
                      availableEmployeesToAdd.map((emp) => {
                        const isSelected = selectedToAdd.includes(emp.id);
                        return (
                          <div
                            key={emp.id}
                            onClick={() => toggleSelectUserToAdd(emp.id)}
                            className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-indigo-100 text-indigo-950 font-semibold'
                                : 'hover:bg-white text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                                {emp.name?.charAt(0) || 'U'}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-semibold truncate">{emp.name}</div>
                                <div className="text-[10px] text-slate-500 truncate">{emp.email}</div>
                              </div>
                            </div>

                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'bg-indigo-600 border-indigo-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {availableEmployeesToAdd.length > 0 && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-indigo-200/60">
                      <button
                        type="button"
                        onClick={() => setShowAddMembersPanel(false)}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddSelectedMembers}
                        disabled={selectedToAdd.length === 0 || addingMembers}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                      >
                        {addingMembers ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <UserPlus className="w-3.5 h-3.5" />
                        )}
                        <span>Add Selected ({selectedToAdd.length})</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Members List */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  <span>Channel Members ({filteredMembers.length})</span>
                </div>

                {loadingMembers ? (
                  <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span>Loading channel members...</span>
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400 italic">No members found</p>
                ) : (
                  <div className="space-y-1 divide-y divide-slate-100">
                    {filteredMembers.map((member) => {
                      const presence = userPresences[member.id]?.status || (member as any).presence_status || 'offline';
                      const isCurrentUser = member.id === currentUser?.id;

                      return (
                        <div
                          key={member.id}
                          className="flex items-center justify-between py-2 px-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative shrink-0">
                              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                                {member.name?.charAt(0) || 'U'}
                              </div>
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${getPresenceColor(
                                  presence
                                )}`}
                                title={`Status: ${presence}`}
                              />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-800 truncate">
                                  {member.name}
                                </span>
                                {isCurrentUser && (
                                  <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-1.5 py-0.2 rounded border border-indigo-200">
                                    You
                                  </span>
                                )}
                                {member.role && (
                                  <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded font-medium">
                                    {member.role}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-400 truncate">
                                <span>{member.email}</span>
                                {(member as any).department_name && (
                                  <>
                                    <span>•</span>
                                    <span>{(member as any).department_name}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions: Remove member */}
                          <div>
                            <button
                              type="button"
                              onClick={() => requestRemoveMember(member.id, member.name)}
                              disabled={removingMemberId === member.id}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title={isCurrentUser ? 'Leave channel' : 'Remove member from channel'}
                            >
                              {removingMemberId === member.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <UserMinus className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Inline Confirmation Dialog for Removing Member */}
                {memberToRemove && (
                  <div className="fixed inset-0 bg-black/40 z-60 flex items-center justify-center p-4 backdrop-blur-2xs animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
                      <div className="flex items-center gap-3 text-amber-600">
                        <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">
                            {memberToRemove.isSelf ? 'Leave Channel?' : 'Remove Member?'}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {memberToRemove.isSelf
                              ? `Are you sure you want to leave #${channel.name}?`
                              : `Remove ${memberToRemove.name} from #${channel.name}?`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setMemberToRemove(null)}
                          disabled={removingMemberId !== null}
                          className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-semibold rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={confirmRemoveMember}
                          disabled={removingMemberId !== null}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors disabled:opacity-50"
                        >
                          {removingMemberId !== null ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <UserMinus className="w-3.5 h-3.5" />
                          )}
                          <span>{memberToRemove.isSelf ? 'Leave Channel' : 'Remove Member'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: EDIT CHANNEL DETAILS */}
          {activeTab === 'edit' && (
            <form onSubmit={handleSaveDetails} className="space-y-4">
              {detailsError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                  {detailsError}
                </div>
              )}

              {detailsSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Channel details updated successfully!</span>
                </div>
              )}

              {/* Channel Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Channel Name
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      const sanitized = e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/[^a-z0-9_-]/g, '');
                      setName(sanitized);
                    }}
                    placeholder="e.g. project-updates"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:bg-white font-mono"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Channel names must be lowercase and contain no spaces.
                </p>
              </div>

              {/* Channel Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description / Topic (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this channel about?"
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:bg-white resize-none"
                />
              </div>

              {/* Channel Privacy Toggle */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isPrivate ? (
                      <Lock className="w-4 h-4 text-amber-600" />
                    ) : (
                      <Hash className="w-4 h-4 text-indigo-600" />
                    )}
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        {isPrivate ? 'Private Channel' : 'Public Channel'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {isPrivate
                          ? 'Only explicitly added members can view or participate.'
                          : 'Anyone in the company can see and join this channel.'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsPrivate(!isPrivate)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      isPrivate ? 'bg-amber-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        isPrivate ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDetails}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  {savingDetails ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: DANGER ZONE / DELETE CHANNEL */}
          {activeTab === 'danger' && (
            <div className="space-y-4">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-rose-900">Delete #{channel.name}</h4>
                    <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                      Permanently delete this channel, including all conversation messages, shared attachments, audio recordings, and member history.
                    </p>
                    <p className="text-[11px] font-bold text-rose-800 mt-1">
                      ⚠️ This action is irreversible and cannot be undone.
                    </p>
                  </div>
                </div>

                {deleteError && (
                  <div className="p-2.5 bg-rose-100/70 border border-rose-300 text-rose-800 text-xs rounded-xl">
                    {deleteError}
                  </div>
                )}

                <div className="pt-2 border-t border-rose-200 space-y-2">
                  <label className="block text-[11px] font-semibold text-rose-800">
                    To confirm, please type <span className="font-mono font-bold select-all">"{channel.name}"</span> below:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder={channel.name}
                    className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-xs text-rose-900 font-mono focus:outline-hidden focus:border-rose-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleDeleteChannel}
                    disabled={
                      deleteConfirmText.trim().toLowerCase() !== channel.name.toLowerCase() ||
                      isDeleting
                    }
                    className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    <span>Delete Channel Permanently</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
