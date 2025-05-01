import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-hot-toast';
import { Trash2, Edit, Plus, Save, FileText, Mail, ChevronDown, Clipboard, Check, Search } from 'react-feather';
import './Templates.css';

const Templates = () => {
  const { currentUser } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    subject: '',
    content: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [isExpanded, setIsExpanded] = useState(null);
  const [copied, setCopied] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  const subjectRef = useRef(null);
  const contentRef = useRef(null);

  const variables = [
    { name: 'Client Name', value: '{name}' },
    { name: 'Client Email', value: '{email}' },
    { name: 'Client Phone', value: '{phone}' },
    { name: 'Invoice Number', value: '{invoice}' },
    { name: 'Current Date', value: '{date}' },
    { name: 'Company Name', value: '{company}' },
    { name: 'Due Date', value: '{dueDate}' },
    { name: 'Amount Due', value: '{amount}' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTemplate(prev => ({ ...prev, [name]: value }));
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         template.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'invoices' && template.name.toLowerCase().includes('invoice')) ||
                      (activeTab === 'welcome' && template.name.toLowerCase().includes('welcome'));
    return matchesSearch && matchesTab;
  });

  const insertVariable = (variable, field) => {
    const element = field === 'subject' ? subjectRef.current : contentRef.current;
    if (!element) return;

    const startPos = element.selectionStart;
    const endPos = element.selectionEnd;
    const currentValue = field === 'subject' ? newTemplate.subject : newTemplate.content;

    const newValue = 
      currentValue.substring(0, startPos) + 
      variable + 
      currentValue.substring(endPos);

    if (field === 'subject') {
      setNewTemplate({ ...newTemplate, subject: newValue });
    } else {
      setNewTemplate({ ...newTemplate, content: newValue });
    }

    setTimeout(() => {
      element.focus();
      element.setSelectionRange(
        startPos + variable.length,
        startPos + variable.length
      );
    }, 0);
  };

  const copyToClipboard = (text, templateId) => {
    navigator.clipboard.writeText(text);
    setCopied(templateId);
    setTimeout(() => setCopied(null), 2000);
    toast.success('Copied to clipboard');
  };

  useEffect(() => {
    const fetchTemplates = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const q = query(
          collection(db, 'templates'),
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const templatesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTemplates(templatesData);
      } catch (error) {
        console.error('Error fetching templates:', error);
        toast.error('Failed to load templates');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [currentUser]);

  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.content) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const templateData = {
        ...newTemplate,
        userId: currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'templates'), templateData);
      setTemplates(prev => [...prev, { id: docRef.id, ...templateData }]);
      setNewTemplate({ name: '', subject: '', content: '' });
      toast.success('Template created successfully');
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    }
  };

  const handleUpdateTemplate = async () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.content) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const templateRef = doc(db, 'templates', editingId);
      await updateDoc(templateRef, {
        ...newTemplate,
        updatedAt: new Date()
      });

      setTemplates(prev => prev.map(t => 
        t.id === editingId ? { ...t, ...newTemplate } : t
      ));
      setEditingId(null);
      setNewTemplate({ name: '', subject: '', content: '' });
      toast.success('Template updated successfully');
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
    }
  };

  const handleDeleteTemplate = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await deleteDoc(doc(db, 'templates', id));
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast.success('Template deleted');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const startEditing = (template) => {
    setEditingId(template.id);
    setNewTemplate({
      name: template.name,
      subject: template.subject,
      content: template.content
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setNewTemplate({ name: '', subject: '', content: '' });
  };

  const toggleExpand = (id) => {
    setIsExpanded(isExpanded === id ? null : id);
  };

  return (
    <div className="templates-container">
      <div className="templates-header">
        <div className="templates-header-text">
          <h1>Templates</h1>
          <p>Create and manage email templates for your clients</p>
        </div>
      </div>

      <div className="templates-search-container">
        <Search size={18} className="templates-search-icon" />
        <input
          type="text"
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="templates-search-input"
        />
      </div>

      <div className="templates-tabs">
        <button
          className={`templates-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Templates
        </button>
        <button
          className={`templates-tab ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          Invoices
        </button>
        <button
          className={`templates-tab ${activeTab === 'welcome' ? 'active' : ''}`}
          onClick={() => setActiveTab('welcome')}
        >
          Welcome Emails
        </button>
      </div>

      <div className="templates-form-container">
        <h2>{editingId ? 'Edit Template' : 'Create New Template'}</h2>
        
        <div className="templates-form-group">
          <label className="templates-label">
            Template Name <span className="templates-required">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={newTemplate.name}
            onChange={handleInputChange}
            className="templates-input"
            placeholder="e.g., Invoice Reminder"
          />
        </div>

        <div className="templates-form-group">
          <label className="templates-label">
            Subject <span className="templates-required">*</span>
          </label>
          <input
            type="text"
            name="subject"
            value={newTemplate.subject}
            onChange={handleInputChange}
            className="templates-input"
            placeholder="Email subject line"
            ref={subjectRef}
          />
          <div className="templates-variable-buttons">
            {variables.map((varItem) => (
              <button
                key={`subject-${varItem.value}`}
                className="templates-variable-button"
                onClick={() => insertVariable(varItem.value, 'subject')}
              >
                {varItem.name}
              </button>
            ))}
          </div>
        </div>

        <div className="templates-form-group">
          <label className="templates-label">
            Content <span className="templates-required">*</span>
          </label>
          <textarea
            name="content"
            value={newTemplate.content}
            onChange={handleInputChange}
            className="templates-textarea"
            placeholder="Write your email content here..."
            ref={contentRef}
          />
          <div className="templates-variable-buttons">
            {variables.map((varItem) => (
              <button
                key={`content-${varItem.value}`}
                className="templates-variable-button"
                onClick={() => insertVariable(varItem.value, 'content')}
              >
                {varItem.name}
              </button>
            ))}
          </div>
        </div>

        <div className="templates-form-actions">
          {editingId && (
            <button
              className="templates-secondary-button"
              onClick={cancelEditing}
            >
              Cancel
            </button>
          )}
          <button
            className="templates-primary-button"
            onClick={editingId ? handleUpdateTemplate : handleCreateTemplate}
          >
            {editingId ? (
              <>
                <Save size={16} />
                Update Template
              </>
            ) : (
              <>
                <Plus size={16} />
                Create Template
              </>
            )}
          </button>
        </div>
      </div>

      <div className="templates-list-container">
        <h2>Your Templates</h2>
        
        {loading ? (
          <div className="templates-loading-spinner">
            <div className="templates-spinner"></div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="templates-empty-state">
            <FileText size={48} />
            <h3>No templates found</h3>
            <p>Create your first template to get started</p>
          </div>
        ) : (
          <div className="templates-grid">
            {filteredTemplates.map((template) => (
              <div key={template.id} className="templates-card">
                <div 
                  className="templates-card-header" 
                  onClick={() => toggleExpand(template.id)}
                >
                  <h3>{template.name}</h3>
                  <div className="templates-card-actions">
                    <button
                      className="templates-action-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(template);
                      }}
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="templates-action-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTemplate(template.id, template.name);
                      }}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      className="templates-action-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(template.content, template.id);
                      }}
                      title="Copy Content"
                    >
                      {copied === template.id ? (
                        <Check size={16} />
                      ) : (
                        <Clipboard size={16} />
                      )}
                    </button>
                  </div>
                </div>
                
                {isExpanded === template.id && (
                  <>
                    <div className="templates-card-content">
                      <p>
                        <strong>Subject:</strong> {template.subject}
                      </p>
                      <div className="templates-card-content-text">
                        {template.content}
                      </div>
                    </div>
                    <div className="templates-card-footer">
                      <span>
                        Created: {new Date(template.createdAt?.seconds * 1000).toLocaleDateString()}
                      </span>
                      <span>
                        Last updated: {new Date(template.updatedAt?.seconds * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Templates;