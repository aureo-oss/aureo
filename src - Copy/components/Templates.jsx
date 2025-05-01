import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../context/ThemeContext';
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
import { Trash2, Edit, Plus, Save, FileText, Mail, ChevronDown, Clipboard, Check } from 'react-feather';

const Templates = () => {
  const { currentUser } = useAuth();
  const { darkMode } = useTheme();
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
  
  // Refs
  const subjectRef = useRef(null);
  const contentRef = useRef(null);

  // Available variables
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

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTemplate(prev => ({ ...prev, [name]: value }));
  };

  // Filter templates based on search and active tab
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         template.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'invoices' && template.name.toLowerCase().includes('invoice')) ||
                      (activeTab === 'welcome' && template.name.toLowerCase().includes('welcome'));
    return matchesSearch && matchesTab;
  });

  // Insert variable at cursor position
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

    // Focus back on the element
    setTimeout(() => {
      element.focus();
      element.setSelectionRange(
        startPos + variable.length,
        startPos + variable.length
      );
    }, 0);
  };

  // Copy template content to clipboard
  const copyToClipboard = (text, templateId) => {
    navigator.clipboard.writeText(text);
    setCopied(templateId);
    setTimeout(() => setCopied(null), 2000);
    toast.success('Copied to clipboard');
  };

  // Fetch templates
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

  // CRUD Operations
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

  // Styles
  const styles = {
    page: {
      padding: '24px',
      backgroundColor: darkMode ? '#121212' : '#f5f5f5',
      color: darkMode ? '#ffffff' : '#333333',
      minHeight: '100vh'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
      flexWrap: 'wrap',
      gap: '16px'
    },
    headerText: {
      maxWidth: '800px'
    },
    tabs: {
      display: 'flex',
      gap: '8px',
      marginBottom: '20px',
      borderBottom: `1px solid ${darkMode ? '#333' : '#ddd'}`,
      paddingBottom: '8px'
    },
    tab: {
      padding: '8px 16px',
      borderRadius: '4px',
      cursor: 'pointer',
      border: 'none',
      backgroundColor: 'transparent',
      color: darkMode ? '#aaa' : '#666'
    },
    activeTab: {
      backgroundColor: darkMode ? '#333' : '#e0e0e0',
      color: darkMode ? '#fff' : '#333',
      fontWeight: '500'
    },
    searchContainer: {
      marginBottom: '24px',
      position: 'relative'
    },
    searchInput: {
      width: '100%',
      padding: '12px 16px 12px 40px',
      borderRadius: '8px',
      border: `1px solid ${darkMode ? '#333' : '#ddd'}`,
      backgroundColor: darkMode ? '#1e1e1e' : '#fff',
      color: darkMode ? '#fff' : '#333',
      fontSize: '14px'
    },
    searchIcon: {
      position: 'absolute',
      left: '16px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: darkMode ? '#aaa' : '#777'
    },
    formContainer: {
      backgroundColor: darkMode ? '#1e1e1e' : '#fff',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
      marginBottom: '32px'
    },
    formGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '500',
      color: darkMode ? '#eee' : '#444'
    },
    input: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: `1px solid ${darkMode ? '#333' : '#ddd'}`,
      backgroundColor: darkMode ? '#2a2a2a' : '#fff',
      color: darkMode ? '#fff' : '#333',
      fontSize: '14px'
    },
    textarea: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: `1px solid ${darkMode ? '#333' : '#ddd'}`,
      backgroundColor: darkMode ? '#2a2a2a' : '#fff',
      color: darkMode ? '#fff' : '#333',
      minHeight: '200px',
      resize: 'vertical',
      fontSize: '14px'
    },
    variableButtons: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      marginTop: '8px'
    },
    variableButton: {
      backgroundColor: darkMode ? '#333' : '#e0e0e0',
      color: darkMode ? '#fff' : '#333',
      border: 'none',
      borderRadius: '6px',
      padding: '6px 12px',
      fontSize: '12px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    formActions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
      marginTop: '24px'
    },
    primaryButton: {
      backgroundColor: darkMode ? '#3d5afe' : '#3d5afe',
      color: '#fff',
      padding: '10px 20px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontWeight: '500'
    },
    secondaryButton: {
      backgroundColor: darkMode ? '#333' : '#e0e0e0',
      color: darkMode ? '#fff' : '#333',
      padding: '10px 20px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    listContainer: {
      backgroundColor: darkMode ? '#1e1e1e' : '#fff',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)'
    },
    templateGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '20px'
    },
    templateCard: {
      backgroundColor: darkMode ? '#2a2a2a' : '#fff',
      borderRadius: '8px',
      padding: '16px',
      border: `1px solid ${darkMode ? '#333' : '#eee'}`,
      transition: 'transform 0.2s, box-shadow 0.2s'
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '12px',
      cursor: 'pointer'
    },
    cardActions: {
      display: 'flex',
      gap: '8px'
    },
    actionButton: {
      backgroundColor: darkMode ? '#333' : '#f0f0f0',
      color: darkMode ? '#fff' : '#333',
      border: 'none',
      borderRadius: '4px',
      padding: '6px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center'
    },
    cardContent: {
      marginBottom: '12px',
      color: darkMode ? '#ccc' : '#555'
    },
    cardFooter: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '12px',
      color: darkMode ? '#777' : '#888'
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px 20px',
      color: darkMode ? '#aaa' : '#666'
    },
    loadingSpinner: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '200px'
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: `4px solid ${darkMode ? '#333' : '#ddd'}`,
      borderTopColor: darkMode ? '#3d5afe' : '#3d5afe',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    },
    required: {
      color: '#ff4444',
      marginLeft: '4px'
    }
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerText}>
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileText size={28} /> Email Templates
          </h1>
          <p style={{ margin: '8px 0 0', color: darkMode ? '#aaa' : '#666' }}>
            Create and manage templates for your email communications
          </p>
        </div>
        <button 
          style={{ 
            ...styles.primaryButton,
            visibility: editingId ? 'hidden' : 'visible'
          }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <Plus size={18} /> New Template
        </button>
      </div>

      {/* Search and Filter */}
      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
        <Mail size={18} style={styles.searchIcon} />
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={activeTab === 'all' ? { ...styles.tab, ...styles.activeTab } : styles.tab}
          onClick={() => setActiveTab('all')}
        >
          All Templates
        </button>
        <button
          style={activeTab === 'invoices' ? { ...styles.tab, ...styles.activeTab } : styles.tab}
          onClick={() => setActiveTab('invoices')}
        >
          Invoices
        </button>
        <button
          style={activeTab === 'welcome' ? { ...styles.tab, ...styles.activeTab } : styles.tab}
          onClick={() => setActiveTab('welcome')}
        >
          Welcome Emails
        </button>
      </div>

      {/* Template Form */}
      {(editingId || activeTab === 'all') && (
        <div style={styles.formContainer}>
          <h2 style={{ marginTop: 0, marginBottom: '24px' }}>
            {editingId ? 'Edit Template' : 'Create New Template'}
          </h2>
          
          {/* Template Name */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Template Name <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="name"
              value={newTemplate.name}
              onChange={handleInputChange}
              placeholder="e.g., Invoice Reminder, Welcome Email"
              style={styles.input}
            />
          </div>

          {/* Email Subject */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Email Subject <span style={styles.required}>*</span>
            </label>
            <input
              ref={subjectRef}
              type="text"
              name="subject"
              value={newTemplate.subject}
              onChange={handleInputChange}
              placeholder="Subject line that recipients will see"
              style={styles.input}
            />
            <div style={styles.variableButtons}>
              {variables.map((variable) => (
                <button
                  key={`subject-${variable.value}`}
                  style={styles.variableButton}
                  onClick={() => insertVariable(variable.value, 'subject')}
                  title={variable.name}
                >
                  {variable.name}
                </button>
              ))}
            </div>
          </div>

          {/* Email Content */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Email Content <span style={styles.required}>*</span>
            </label>
            <textarea
              ref={contentRef}
              name="content"
              value={newTemplate.content}
              onChange={handleInputChange}
              placeholder="Write your email template here..."
              style={styles.textarea}
            />
            <div style={styles.variableButtons}>
              {variables.map((variable) => (
                <button
                  key={`content-${variable.value}`}
                  style={styles.variableButton}
                  onClick={() => insertVariable(variable.value, 'content')}
                  title={variable.name}
                >
                  {variable.name}
                </button>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div style={styles.formActions}>
            {editingId && (
              <button
                style={styles.secondaryButton}
                onClick={cancelEditing}
              >
                Cancel
              </button>
            )}
            <button
              style={styles.primaryButton}
              onClick={editingId ? handleUpdateTemplate : handleCreateTemplate}
              disabled={!newTemplate.name || !newTemplate.subject || !newTemplate.content}
            >
              <Save size={18} /> {editingId ? 'Update Template' : 'Create Template'}
            </button>
          </div>
        </div>
      )}

      {/* Template List */}
      <div style={styles.listContainer}>
        <h2 style={{ marginTop: 0, marginBottom: '24px' }}>
          {activeTab === 'all' ? 'All Templates' : 
           activeTab === 'invoices' ? 'Invoice Templates' : 'Welcome Templates'}
        </h2>
        
        {loading ? (
          <div style={styles.loadingSpinner}>
            <div style={styles.spinner}></div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div style={styles.emptyState}>
            <Mail size={48} style={{ marginBottom: '16px', color: darkMode ? '#555' : '#ccc' }} />
            <h3 style={{ margin: '0 0 8px' }}>No templates found</h3>
            <p style={{ margin: 0 }}>
              {searchTerm ? 'Try a different search' : 'Create your first template to get started'}
            </p>
          </div>
        ) : (
          <div style={styles.templateGrid}>
            {filteredTemplates.map(template => (
              <div 
                key={template.id} 
                style={styles.templateCard}
              >
                <div 
                  style={styles.cardHeader}
                  onClick={() => toggleExpand(template.id)}
                >
                  <div>
                    <h3 style={{ margin: 0, color: darkMode ? '#fff' : '#333' }}>
                      {template.name}
                    </h3>
                    <p style={{ 
                      margin: '4px 0 0', 
                      color: darkMode ? '#aaa' : '#666',
                      fontSize: '14px'
                    }}>
                      {template.subject}
                    </p>
                  </div>
                  <div style={styles.cardActions}>
                    <button
                      style={styles.actionButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(template.content, template.id);
                      }}
                      title="Copy to clipboard"
                    >
                      {copied === template.id ? <Check size={16} /> : <Clipboard size={16} />}
                    </button>
                    <button
                      style={styles.actionButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(template);
                      }}
                      title="Edit template"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      style={styles.actionButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTemplate(template.id, template.name);
                      }}
                      title="Delete template"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div style={styles.cardContent}>
                  {isExpanded === template.id ? (
                    <div style={{ whiteSpace: 'pre-wrap' }}>{template.content}</div>
                  ) : (
                    <div>
                      {template.content.length > 150
                        ? `${template.content.substring(0, 150)}...`
                        : template.content}
                    </div>
                  )}
                </div>
                
                {template.content.length > 150 && (
                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      color: darkMode ? '#3d5afe' : '#3d5afe',
                      cursor: 'pointer',
                      padding: '4px 0',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(template.id);
                    }}
                  >
                    {isExpanded === template.id ? 'Show Less' : 'Show More'}
                  </button>
                )}
                
                <div style={styles.cardFooter}>
                  <span>
                    Created: {new Date(template.createdAt?.seconds * 1000).toLocaleDateString()}
                  </span>
                  {template.updatedAt && (
                    <span>
                      Updated: {new Date(template.updatedAt?.seconds * 1000).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Global styles */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        button:hover {
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
};

export default Templates;