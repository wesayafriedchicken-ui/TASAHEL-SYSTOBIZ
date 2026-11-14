import React, { useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { 
  Hash, 
  Lock, 
  Plus, 
  Search, 
  AtSign, 
  Settings, 
  ChevronDown, 
  Smile, 
  Users, 
  CircleDot,
  Check,
  X
} from 'lucide-react';
import { useComm } from '../context/CommContext';
import { PresenceStatus, CommUser, CommChannel } from '../types';
import { CreateChannelModal } from './CreateChannelModal';
import { ChannelSettingsModal } from './ChannelSettingsModal';

const STATUS_CONFIG: Record<PresenceStatus, { label: string; color: string; dot: string }> = {
  online: { label: 'Online', color: 'text-emerald-600', dot: 'bg-emerald-500' },
  busy: { label: 'Busy / In Meeting', color: 'text-rose-600', dot: 'bg-rose-500' },
  away: { label: 'Away', color: 'text-amber-500', dot: 'bg-amber-400' },
  offline: { label: 'Appear Offline', color: 'text-slate-400', dot: 'bg-slate-400' },
};

export const CommSidebar: React.FC = () => {
  const navigate = useNavigate();
  const { channelId, recipientUserId } = useParams<{ channelId?: string; recipientUserId?: string }>();
  
  const { 
    currentUser, 
    channels, 
    dms, 
    employees, 
    userPresences, 
    myStatus, 
    setMyStatus, 
    myCustomStatus, 
    setMyCustomStatus,
    unreadActivityCount,
    getOrCreateDmRoom,
    refreshRooms
  } = useComm();

  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [customStatusInput, setCustomStatusInput] = useState(myCustomStatus);
  const [isEditingCustomStatus, setIsEditingCustomStatus] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [manageChannel, setManageChannel] = useState<CommChannel | null>(null);

  // Search filter inside sidebar
  const [searchQuery, setSearchQuery] = useState('');

  // Filter channels
  const filteredChannels = channels.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter employees for DMs
  const filteredEmployees = employees.filter(e => 
    Number(e.id) !== Number(currentUser?.id) &&
    (e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (e.department && e.department.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const handleSaveCustomStatus = async () => {
    await setMyCustomStatus(customStatusInput.trim());
    setIsEditingCustomStatus(false);
  };

  const handleStartDm = async (empId: number) => {
    try {
      await getOrCreateDmRoom(empId);
      navigate(`/comm/dm/${empId}`);
    } catch (e) {
      console.error(e);
    }
  };

  // Helper for presence of user
  const getUserPresence = (userId: number): PresenceStatus => {
    return userPresences[userId]?.status || 'offline';
  };

  return (
    <div className="w-64 sm:w-72 h-full bg-slate-900 text-slate-300 flex flex-col select-none border-r border-slate-800 shadow-lg shrink-0">
      {/* Workspace & Current User Profile Header */}
      <div className="p-3 border-b border-slate-800/80 bg-slate-950/40 relative">
        <div 
          onClick={() => setShowStatusMenu(!showStatusMenu)}
          className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/80 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* User Avatar with Presence Dot */}
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
              <span 
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${STATUS_CONFIG[myStatus].dot}`} 
              />
            </div>

            <div className="min-w-0">
              <h2 className="text-xs font-bold text-white truncate leading-tight">
                {currentUser?.name || 'My Workspace'}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[10px] font-semibold ${STATUS_CONFIG[myStatus].color}`}>
                  {STATUS_CONFIG[myStatus].label}
                </span>
                {myCustomStatus && (
                  <span className="text-[10px] text-slate-400 truncate max-w-[90px]" title={myCustomStatus}>
                    • {myCustomStatus}
                  </span>
                )}
              </div>
            </div>
          </div>

          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        </div>

        {/* Status Switcher Popover Menu */}
        {showStatusMenu && (
          <div className="absolute top-full left-3 right-3 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-2 z-40 animate-fadeIn text-xs">
            <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Set Presence Status
            </div>
            
            <div className="space-y-1 mt-1">
              {(['online', 'busy', 'away', 'offline'] as PresenceStatus[]).map((statusKey) => (
                <button
                  key={statusKey}
                  onClick={() => {
                    setMyStatus(statusKey);
                    setShowStatusMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-700 transition-colors ${
                    myStatus === statusKey ? 'bg-slate-700/80 font-bold text-white' : 'text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${STATUS_CONFIG[statusKey].dot}`} />
                    <span>{STATUS_CONFIG[statusKey].label}</span>
                  </div>
                  {myStatus === statusKey && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              ))}
            </div>

            <div className="border-t border-slate-700 my-2 pt-2">
              <div className="flex items-center justify-between px-2 text-[10px] font-bold text-slate-400">
                <span>Custom Status</span>
                <Smile className="w-3 h-3 text-slate-400" />
              </div>
              <div className="flex items-center gap-1 mt-1">
                <input
                  type="text"
                  value={customStatusInput}
                  onChange={(e) => setCustomStatusInput(e.target.value)}
                  placeholder="e.g. In meeting, Traveling..."
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveCustomStatus()}
                />
                <button
                  onClick={handleSaveCustomStatus}
                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Global Quick Navigation */}
      <div className="px-3 py-2 space-y-0.5 border-b border-slate-800/60">
        <NavLink
          to="/comm/activity"
          className={({ isActive }) =>
            `flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              isActive
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`
          }
        >
          <div className="flex items-center gap-2">
            <AtSign className="w-4 h-4" />
            <span>Activity & Mentions</span>
          </div>
          {unreadActivityCount > 0 && (
            <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-bold rounded-full">
              {unreadActivityCount}
            </span>
          )}
        </NavLink>

        <NavLink
          to="/comm/settings"
          className={({ isActive }) =>
            `flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              isActive
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`
          }
        >
          <Settings className="w-4 h-4" />
          <span>Preferences & Audio</span>
        </NavLink>
      </div>

      {/* Search filter */}
      <div className="p-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter channels or people..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-800/70 border border-slate-700/80 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable list of Channels & Direct Messages */}
      <div className="flex-1 overflow-y-auto px-2 space-y-4 pb-4">
        {/* CHANNELS SECTION */}
        <div>
          <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Channels ({filteredChannels.length})</span>
            <button
              onClick={() => setShowCreateChannel(true)}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
              title="Create new channel"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-1 space-y-0.5">
            {filteredChannels.length === 0 ? (
              <p className="px-2 py-1 text-[11px] text-slate-500 italic">No channels found</p>
            ) : (
              filteredChannels.map((channel) => {
                const isSelected = String(channel.id) === String(channelId);
                return (
                  <NavLink
                    key={channel.id}
                    to={`/comm/channels/${channel.id}`}
                    className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-bold shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {channel.is_private ? (
                        <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      ) : (
                        <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span className="truncate">{channel.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {channel.total_messages && channel.total_messages > 0 ? (
                        <span className="text-[10px] opacity-60 font-mono group-hover:hidden">
                          {channel.total_messages}
                        </span>
                      ) : null}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setManageChannel(channel);
                        }}
                        className={`p-1 rounded-md transition-all ${
                          isSelected
                            ? 'text-white/80 hover:text-white hover:bg-white/20'
                            : 'text-slate-400 hover:text-white hover:bg-slate-700 opacity-0 group-hover:opacity-100'
                        }`}
                        title="Channel settings & members"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </NavLink>
                );
              })
            )}
          </div>
        </div>

        {/* DIRECT MESSAGES SECTION */}
        <div>
          <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Direct Messages ({filteredEmployees.length})</span>
          </div>

          <div className="mt-1 space-y-0.5">
            {filteredEmployees.length === 0 ? (
              <p className="px-2 py-1 text-[11px] text-slate-500 italic">No colleagues found</p>
            ) : (
              filteredEmployees.map((emp) => {
                const presence = getUserPresence(emp.id);
                const isSelected = String(emp.id) === String(recipientUserId);

                return (
                  <button
                    key={emp.id}
                    onClick={() => handleStartDm(emp.id)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-xl text-left transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-bold shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Avatar with live status dot */}
                      <div className="relative shrink-0">
                        {emp.avatar_url ? (
                          <img
                            src={emp.avatar_url}
                            alt=""
                            className="w-6 h-6 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-lg bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center justify-center">
                            {emp.name.charAt(0)}
                          </div>
                        )}
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-slate-900 ${STATUS_CONFIG[presence].dot}`}
                          title={`Status: ${STATUS_CONFIG[presence].label}`}
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate leading-tight">{emp.name}</p>
                        {emp.department && (
                          <p className="text-[10px] text-slate-400 truncate leading-none mt-0.5">
                            {emp.department}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Create Channel Modal */}
      <CreateChannelModal
        isOpen={showCreateChannel}
        onClose={() => setShowCreateChannel(false)}
        onChannelCreated={(id) => navigate(`/comm/channels/${id}`)}
      />

      {/* Channel Settings & Members Modal */}
      {manageChannel && (
        <ChannelSettingsModal
          isOpen={!!manageChannel}
          onClose={() => setManageChannel(null)}
          channel={manageChannel}
          onChannelUpdated={() => {
            refreshRooms();
          }}
          onChannelDeleted={() => {
            const deletedId = manageChannel.id;
            setManageChannel(null);
            refreshRooms();
            if (String(deletedId) === String(channelId)) {
              navigate('/comm');
            }
          }}
        />
      )}
    </div>
  );
};
