import React, { useState, useEffect } from 'react';
import { 
  Heart, Phone, Mail, MapPin, Plus, Save, Loader2, Check, Edit2, Trash2, X, AlertCircle, ShieldAlert, User, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Employee } from '../../types';

interface EmployeeEmergencyTabProps {
  emp: Employee;
  currentUser: any;
  onSaveEmployeeDetails: (updatedEmp: Partial<Employee>) => Promise<void>;
  isViewOnly?: boolean;
  onMarkDirty?: () => void;
}

export const EmployeeEmergencyTab: React.FC<EmployeeEmergencyTabProps> = ({
  emp,
  currentUser,
  onSaveEmployeeDetails,
  isViewOnly = false,
  onMarkDirty
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [contacts, setContacts] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null); // null means adding new

  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    is_primary: true,
    work_phone: '',
    ext: '',
    home_phone: '',
    mobile_phone: '',
    email: '',
    street_1: '',
    street_2: '',
    city: '',
    state: '',
    postcode: '',
    country: ''
  });

  // Load contacts on mount / employee change
  useEffect(() => {
    const personal = emp.personal_info || {};
    let loadedContacts: any[] = [];
    
    if (personal.emergency_contacts && Array.isArray(personal.emergency_contacts) && personal.emergency_contacts.length > 0) {
      loadedContacts = [...personal.emergency_contacts];
    } else if (personal.emergency_contact && typeof personal.emergency_contact === 'object' && personal.emergency_contact.name) {
      loadedContacts = [personal.emergency_contact];
    } else if (emp.emergency_contact_name || personal.emergency_contact_name) {
      loadedContacts = [{
        name: emp.emergency_contact_name || personal.emergency_contact_name || '',
        relationship: (emp as any).emergency_contact_relation || personal.emergency_contact_relation || 'Family',
        is_primary: true,
        work_phone: '',
        ext: '',
        home_phone: '',
        mobile_phone: emp.emergency_contact_phone || personal.emergency_contact_phone || '',
        email: '',
        street_1: (emp as any).emergency_contact_address || personal.emergency_contact_address || '',
        street_2: '',
        city: '',
        state: '',
        postcode: '',
        country: ''
      }];
    }
    setContacts(loadedContacts);
  }, [emp]);

  const handleInputChange = (field: string, value: any) => {
    onMarkDirty?.();
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStartAdd = () => {
    setFormData({
      name: '',
      relationship: '',
      is_primary: contacts.length === 0, // primary if first
      work_phone: '',
      ext: '',
      home_phone: '',
      mobile_phone: '',
      email: '',
      street_1: '',
      street_2: '',
      city: '',
      state: '',
      postcode: '',
      country: ''
    });
    setEditingIndex(null);
    setIsEditing(true);
  };

  const handleStartEdit = (index: number) => {
    setFormData({
      ...formData,
      ...contacts[index]
    });
    setEditingIndex(index);
    setIsEditing(true);
  };

  const handleDelete = async (indexToDelete: number) => {
    if (!window.confirm('Are you sure you want to delete this emergency contact?')) {
      return;
    }
    onMarkDirty?.();

    const updatedContacts = contacts.filter((_, idx) => idx !== indexToDelete);
    
    // If we deleted the primary contact, make another one primary if available
    if (contacts[indexToDelete]?.is_primary && updatedContacts.length > 0) {
      updatedContacts[0].is_primary = true;
    }

    setIsSaving(true);
    try {
      const personal = emp.personal_info || {};
      const updatedPersonalInfo = {
        ...personal,
        emergency_contacts: updatedContacts,
        emergency_contact: updatedContacts[0] || null // keep legacy singular synced
      };

      const primaryContact = updatedContacts.find(c => c.is_primary) || updatedContacts[0] || null;
      await onSaveEmployeeDetails({
        emergency_contact_name: primaryContact ? primaryContact.name : '',
        emergency_contact_phone: primaryContact ? (primaryContact.mobile_phone || primaryContact.work_phone || primaryContact.home_phone) : '',
        emergency_contact_relation: primaryContact ? primaryContact.relationship : '',
        emergency_contact_address: primaryContact ? (primaryContact.street_1 || primaryContact.city || '') : '',
        personal_info: updatedPersonalInfo
      });
      setContacts(updatedContacts);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.relationship.trim()) {
      alert('Please fill out Name and Relationship fields');
      return;
    }
    onMarkDirty?.();

    let updatedContacts = [...contacts];
    
    // If this one is set as primary, un-primary all others
    if (formData.is_primary) {
      updatedContacts = updatedContacts.map(c => ({ ...c, is_primary: false }));
    }

    if (editingIndex === null) {
      // Adding new
      updatedContacts.push(formData);
    } else {
      // Editing existing
      updatedContacts[editingIndex] = formData;
    }

    setIsSaving(true);
    try {
      const personal = emp.personal_info || {};
      const updatedPersonalInfo = {
        ...personal,
        emergency_contacts: updatedContacts,
        emergency_contact: updatedContacts.find(c => c.is_primary) || updatedContacts[0] || null
      };

      const primaryContact2 = updatedContacts.find(c => c.is_primary) || updatedContacts[0] || null;
      await onSaveEmployeeDetails({
        emergency_contact_name: primaryContact2 ? primaryContact2.name : '',
        emergency_contact_phone: primaryContact2 ? (primaryContact2.mobile_phone || primaryContact2.work_phone || primaryContact2.home_phone) : '',
        emergency_contact_relation: primaryContact2 ? primaryContact2.relationship : '',
        emergency_contact_address: primaryContact2 ? (primaryContact2.street_1 || primaryContact2.city || '') : '',
        personal_info: updatedPersonalInfo
      });
      setContacts(updatedContacts);
      setIsEditing(false);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-left" dir="ltr">
      {/* Top action bar */}
      <div className="flex justify-between items-center bg-white px-8 py-5 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#1b5e20]/10 flex items-center justify-center text-[#1b5e20] shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 leading-tight">Emergency Contacts</h2>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Emergency Contacts</p>
          </div>
        </div>
        
        {!isEditing && !isViewOnly && (
          <button 
            onClick={handleStartAdd}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-black text-white bg-[#1b5e20] hover:bg-[#123e15] rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Emergency Contact
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.form 
            onSubmit={handleSaveForm}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white border border-slate-200 shadow-md rounded-[32px] overflow-hidden"
          >
            <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500/10 animate-pulse" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                  {editingIndex === null ? 'Add Emergency Contact' : 'Edit Emergency Contact'}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Primary Settings */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-5 space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Full Name *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g. Kevin Abbott"
                    className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl px-4 py-3 outline-none text-slate-800 transition-all"
                  />
                </div>

                <div className="md:col-span-4 space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Relationship *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.relationship}
                    onChange={(e) => handleInputChange('relationship', e.target.value)}
                    placeholder="e.g. Husband, Mother, Friend"
                    className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl px-4 py-3 outline-none text-slate-800 transition-all"
                  />
                </div>

                <div className="md:col-span-3 flex items-center h-12 md:mt-6 pl-1">
                  <label className="inline-flex items-center cursor-pointer select-none gap-2.5">
                    <input 
                      type="checkbox" 
                      checked={formData.is_primary}
                      onChange={(e) => handleInputChange('is_primary', e.target.checked)}
                      className="rounded border-slate-300 text-[#1b5e20] focus:ring-[#1b5e20] w-4.5 h-4.5 cursor-pointer"
                    />
                    <span className="text-xs font-black text-slate-700">Set as Primary</span>
                  </label>
                </div>
              </div>

              {/* Contact Details */}
              <div>
                <h4 className="text-[10px] font-black text-[#1b5e20] uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">Phone & Email</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Mobile Phone</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={formData.mobile_phone}
                        onChange={(e) => handleInputChange('mobile_phone', e.target.value)}
                        placeholder="Mobile number"
                        className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl pl-10 pr-4 py-3 outline-none text-slate-800 transition-all"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Home Phone</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={formData.home_phone}
                        onChange={(e) => handleInputChange('home_phone', e.target.value)}
                        placeholder="Home number"
                        className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl pl-10 pr-4 py-3 outline-none text-slate-800 transition-all"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
                    <div className="relative">
                      <input 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="email@example.com"
                        className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl pl-10 pr-4 py-3 outline-none text-slate-800 transition-all"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Work Phone</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={formData.work_phone}
                        onChange={(e) => handleInputChange('work_phone', e.target.value)}
                        placeholder="Work phone"
                        className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl pl-10 pr-4 py-3 outline-none text-slate-800 transition-all"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Ext</label>
                    <input 
                      type="text" 
                      value={formData.ext}
                      onChange={(e) => handleInputChange('ext', e.target.value)}
                      placeholder="Extension"
                      className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl px-4 py-3 outline-none text-slate-800 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Address Details */}
              <div>
                <h4 className="text-[10px] font-black text-[#1b5e20] uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">Residential Address</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Street 1</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={formData.street_1}
                        onChange={(e) => handleInputChange('street_1', e.target.value)}
                        placeholder="Street line 1"
                        className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl pl-10 pr-4 py-3 outline-none text-slate-800 transition-all"
                      />
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Street 2</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={formData.street_2}
                        onChange={(e) => handleInputChange('street_2', e.target.value)}
                        placeholder="Street line 2"
                        className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl pl-10 pr-4 py-3 outline-none text-slate-800 transition-all"
                      />
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">City</label>
                    <input 
                      type="text" 
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="City"
                      className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl px-4 py-3 outline-none text-slate-800 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">State</label>
                    <input 
                      type="text" 
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="State / Region"
                      className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl px-4 py-3 outline-none text-slate-800 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Postcode</label>
                    <input 
                      type="text" 
                      value={formData.postcode}
                      onChange={(e) => handleInputChange('postcode', e.target.value)}
                      placeholder="Postcode"
                      className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl px-4 py-3 outline-none text-slate-800 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Country</label>
                    <input 
                      type="text" 
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      placeholder="Country"
                      className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl px-4 py-3 outline-none text-slate-800 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Form actions */}
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 py-3 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 bg-[#1b5e20] hover:bg-[#123e15] text-white rounded-xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5" />
                )}
                {isSaving ? 'Saving...' : 'Save Contact'}
              </button>
            </div>
          </motion.form>
        ) : (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {contacts.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-[32px] p-16 text-center shadow-xs">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-rose-500 stroke-[1.5]" />
                </div>
                <h3 className="text-base font-black text-slate-800">No Emergency Contacts Registered</h3>
                <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                  Please add at least one primary emergency contact to ensure we can reach out during urgent situations.
                </p>
                {!isViewOnly && (
                  <button 
                    onClick={handleStartAdd}
                    className="mt-6 inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-black text-white bg-[#1b5e20] hover:bg-[#123e15] rounded-xl transition-all cursor-pointer shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> Add First Contact
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {contacts.map((contact, idx) => (
                  <div 
                    key={idx} 
                    className={`bg-white border rounded-[32px] overflow-hidden shadow-xs hover:shadow-md transition-all relative flex flex-col justify-between ${
                      contact.is_primary ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'border-slate-200'
                    }`}
                  >
                    {/* Card Top / Header */}
                    <div className="p-6 pb-4 border-b border-slate-100 flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${
                          contact.is_primary ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {contact.name?.[0] || <User className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-slate-800 leading-none">{contact.name}</h3>
                            {contact.is_primary && (
                              <span className="bg-emerald-50 text-emerald-700 text-[8px] font-black px-2 py-0.5 rounded border border-emerald-200/50 uppercase tracking-wider">PRIMARY</span>
                            )}
                          </div>
                          <p className="text-[10px] font-bold text-[#1b5e20] uppercase tracking-wider mt-1">{contact.relationship}</p>
                        </div>
                      </div>

                      {/* Card actions */}
                      {!isViewOnly && (
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleStartEdit(idx)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Contact"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Contact"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-6 space-y-4 text-xs font-semibold text-slate-600 flex-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Mobile phone */}
                        {contact.mobile_phone && (
                          <div className="flex items-center gap-2.5">
                            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                            <div>
                              <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Mobile Phone</span>
                              <span className="font-bold text-slate-800">{contact.mobile_phone}</span>
                            </div>
                          </div>
                        )}

                        {/* Home phone */}
                        {contact.home_phone && (
                          <div className="flex items-center gap-2.5">
                            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                            <div>
                              <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Home Phone</span>
                              <span className="font-bold text-slate-800">{contact.home_phone}</span>
                            </div>
                          </div>
                        )}

                        {/* Work phone */}
                        {contact.work_phone && (
                          <div className="flex items-center gap-2.5">
                            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                            <div>
                              <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Work Phone</span>
                              <span className="font-bold text-slate-800">
                                {contact.work_phone} {contact.ext ? `(Ext. ${contact.ext})` : ''}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Email */}
                        {contact.email && (
                          <div className="flex items-center gap-2.5 col-span-1 sm:col-span-2">
                            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                            <div className="min-w-0">
                              <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Email Address</span>
                              <span className="font-bold text-slate-800 block truncate">{contact.email}</span>
                            </div>
                          </div>
                        )}

                        {/* Address */}
                        {(contact.street_1 || contact.city) && (
                          <div className="flex items-start gap-2.5 col-span-1 sm:col-span-2 border-t border-slate-50 pt-3 mt-1">
                            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Residential Address</span>
                              <span className="font-bold text-slate-800 block leading-tight">
                                {[contact.street_1, contact.street_2, contact.city, contact.state, contact.postcode, contact.country]
                                  .filter(Boolean)
                                  .join(', ')}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
