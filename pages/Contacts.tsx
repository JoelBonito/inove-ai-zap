import React, { useState } from 'react';
import { Contact, Category } from '../types';
import { useContactsContext } from '../hooks/useContacts';
import { useCategoriesContext } from '../hooks/useCategories';
import { useUI } from '../hooks/useUI';
import { ImportContactsModal } from '../components/ui/ImportContactsModal';
import { CategoryModal, DeleteCategoryModal } from '../components/ui/CategoryModal';
import { ContactModal } from '../components/ui/ContactModal';
import { DeleteContactModal } from '../components/ui/DeleteContactModal';
import { CATEGORY_COLOR_CLASSES, DEFAULT_BADGE_CLASSES } from '../lib/categoryColors';

const Contacts = () => {
  // Story 3.1 - Hook de gerenciamento de contatos
  const {
    contacts,
    isLoading: contactsLoading,
    error: contactsError,
    importResult,
    parseProgress,
    parseFile,
    confirmImport,
    cancelImport,
    // Story 3.4 - Seleção e atribuição
    selectedContacts,
    toggleContactSelection,
    selectAllContacts,
    clearSelection,
    assignCategory,
    removeCategory,
    // Story 3.5 - CRUD de Contatos
    addContact,
    updateContact,
    deleteContact: removeContact, // Renomeado para evitar conflito com deleteCategory
  } = useContactsContext();

  // Story 3.3 - Hook de gerenciamento de categorias
  const {
    categories,
    isLoading: categoriesLoading,
    error: categoriesError,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useCategoriesContext();

  // Story 3.1 - Modal de Importação usando contexto global
  const {
    isImportContactsModalOpen: isImportModalOpen,
    setIsImportContactsModalOpen: setIsImportModalOpen,
    isNewContactModalOpen: isContactModalOpen,
    setIsNewContactModalOpen: setIsContactModalOpen
  } = useUI();

  // Story 3.3 - Estados dos modais de categorias
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Story 3.4 - Estado do dropdown de ação em lote
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Story 3.5 - Estados dos modais de contato
  const [isDeleteContactModalOpen, setIsDeleteContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>(undefined);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);

  // Filtros locais
  const [searchTerm, setSearchTerm] = useState('');

  // Lógica de filtragem combinada (Categoria + Busca)
  const filteredContacts = contacts.filter(contact => {
    // Filtro por Categoria Sidebar
    if (selectedCategoryId && !contact.categoryIds?.includes(selectedCategoryId)) {
      return false;
    }

    // Filtro por Busca (Nome, Email, Telefone)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesName = contact.name.toLowerCase().includes(term);
      const matchesEmail = contact.email?.toLowerCase().includes(term);
      const matchesPhone = contact.phone.includes(term);

      if (!matchesName && !matchesEmail && !matchesPhone) {
        return false;
      }
    }

    return true;
  });

  // Handlers de importação
  const handleOpenImportModal = () => {
    cancelImport();
    setIsImportModalOpen(true);
  };

  const handleCloseImportModal = () => {
    setIsImportModalOpen(false);
    cancelImport();
  };

  // Story 3.5 - Handlers de CRUD de Contatos
  const handleOpenNewContact = () => {
    setEditingContact(undefined);
    setIsContactModalOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setIsContactModalOpen(true);
  };

  const handleDeleteContactClick = (contact: Contact) => {
    setDeletingContact(contact);
    setIsDeleteContactModalOpen(true);
  };

  const handleCloseContactModal = () => {
    setIsContactModalOpen(false);
    setEditingContact(undefined);
  };

  const handleCloseDeleteContactModal = () => {
    setIsDeleteContactModalOpen(false);
    setDeletingContact(null);
  };

  const handleSaveContact = async (data: Partial<Contact>) => {
    if (editingContact) {
      await updateContact(editingContact.id, data);
    } else {
      const payload: Omit<Contact, 'id' | 'initials' | 'color'> = {
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        tags: data.tags || [],
        categoryIds: data.categoryIds || [],
        lastCampaign: data.lastCampaign,
      };
      await addContact(payload);
    }
  };

  const handleConfirmDeleteContact = async () => {
    if (deletingContact) {
      await removeContact(deletingContact.id);
    }
  };

  // Story 3.3 - Handlers de categorias
  const handleOpenNewCategory = () => {
    setEditingCategory(undefined);
    setIsCategoryModalOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsCategoryModalOpen(true);
  };

  const handleCloseCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setEditingCategory(undefined);
  };

  const handleSaveCategory = async (name: string, color: Category['color']) => {
    if (editingCategory) {
      await updateCategory(editingCategory.id, { name, color });
    } else {
      await addCategory(name, color);
    }
  };

  const handleOpenDeleteCategory = (category: Category) => {
    setDeletingCategory(category);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingCategory(null);
  };

  const handleConfirmDelete = async () => {
    if (deletingCategory) {
      await deleteCategory(deletingCategory.id);
    }
  };

  // Converte categorias do context para formato do modal de importação
  const categoriesForImport = categories.map(c => ({ id: c.id, name: c.name }));

  const getTagStyle = (tag: string) => {
    // Procura a categoria pelo nome para usar a cor correta
    const category = categories.find(c => c.name === tag);
    if (category) {
      return CATEGORY_COLOR_CLASSES[category.color]?.badge || DEFAULT_BADGE_CLASSES;
    }

    // Fallback para tags conhecidas
    switch (tag) {
      case 'Lead Quente':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-100 dark:border-purple-800/50';
      case 'Vendas':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-100 dark:border-blue-800/50';
      case 'Suporte':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800/50';
      case 'VIP':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-100 dark:border-amber-800/50';
      case 'Inativo':
        return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-100 dark:border-red-800/50';
      case 'Importado':
        return 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 border-cyan-100 dark:border-cyan-800/50';
      default:
        return DEFAULT_BADGE_CLASSES;
    }
  };

  // Calcula total de contatos (mock + importados)
  const totalContacts = contacts.length;

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      {/* Story 3.1 - Modal de Importação */}
      <ImportContactsModal
        isOpen={isImportModalOpen}
        onClose={handleCloseImportModal}
        onFileSelect={parseFile}
        onConfirmImport={confirmImport}
        importResult={importResult}
        parseProgress={parseProgress}
        isLoading={contactsLoading}
        error={contactsError}
        categories={categoriesForImport}
      />

      {/* Story 3.3 - Modal de Categoria */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={handleCloseCategoryModal}
        onSave={handleSaveCategory}
        category={editingCategory}
        isLoading={categoriesLoading}
        error={categoriesError}
      />

      {/* Story 3.3 - Modal de Exclusão */}
      <DeleteCategoryModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        category={deletingCategory}
        isLoading={categoriesLoading}
      />

      {/* Story 3.5 - Modais de Contato */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={handleCloseContactModal}
        onSave={handleSaveContact}
        contact={editingContact}
        categories={categories}
        isLoading={contactsLoading}
      />

      <DeleteContactModal
        isOpen={isDeleteContactModalOpen}
        onClose={handleCloseDeleteContactModal}
        onConfirm={handleConfirmDeleteContact}
        contact={deletingContact}
        isLoading={contactsLoading}
      />





      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Contatos', value: filteredContacts.length.toLocaleString('pt-BR') },
          { label: 'Novos Leads (Mês)', value: '-', note: 'Em breve' },
          { label: 'Clientes Ativos', value: '-', note: 'Em breve' },
          { label: 'Opt-out / Bloqueios', value: '-', note: 'Em breve' },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col"
          >
            <span className="text-xs font-medium text-slate-500 uppercase">
              {stat.label}
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {stat.value}
              </span>
              {stat.note && (
                <span className="text-xs font-medium text-slate-400">
                  {stat.note}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Sidebar Categories - Largura alinhada com Card 1 */}
        <aside className="hidden lg:flex flex-col gap-2 col-span-1">
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-3">
            <h3 className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Categorias
            </h3>
            <nav className="space-y-1">
              <button className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg bg-primary/10 text-primary-dark dark:text-primary transition-colors">
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">
                    label
                  </span>
                  Todos
                </span>
                <span className="bg-white dark:bg-slate-700 px-2 py-0.5 rounded-full text-xs text-slate-600 dark:text-slate-300">
                  12.4k
                </span>
              </button>
              {/* Story 3.3 - Lista de categorias do context */}
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="group relative"
                >
                  <button
                    onClick={() => setSelectedCategoryId(selectedCategoryId === cat.id ? null : cat.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${selectedCategoryId === cat.id
                      ? 'bg-primary/10 text-primary-dark dark:text-primary'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${CATEGORY_COLOR_CLASSES[cat.color]?.dot || 'bg-slate-500'}`}></span>
                      <span className="truncate">{cat.name}</span>
                    </span>

                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-xs text-slate-500 group-hover:hidden">
                      {cat.contactCount.toLocaleString('pt-BR')}
                    </span>
                  </button>
                  {/* Dropdown de ações */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden group-hover:flex gap-1 bg-white dark:bg-surface-dark pl-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCategory(cat);
                      }}
                      className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                      title="Editar"
                      aria-label="Editar categoria"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDeleteCategory(cat);
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                      title="Excluir"
                      aria-label="Excluir categoria"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </nav>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleOpenNewCategory}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">
                  add
                </span>
                Nova Categoria
              </button>
            </div>
          </div>
        </aside>

        {/* Contacts List - Ocupa 3 colunas (alinhado com Cards 2, 3 e 4) */}
        <div className="flex flex-col gap-4 min-w-0 col-span-3">

          {/* Filters & Actions Bar - FIXED OVERFLOW & ALIGNMENT */}
          <div className="bg-white dark:bg-surface-dark p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col xl:flex-row gap-3 items-start xl:items-center justify-between">
            {/* Search & Select Group */}
            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[20px]">
                  search
                </span>
                <input
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-400"
                  placeholder="Buscar contato..."
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Origin Filter - FIXED ICON OVERLAP */}
              <div className="relative w-full sm:w-auto">
                <select className="appearance-none pl-4 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary cursor-pointer w-full sm:w-[180px]">
                  <option value="all">Origem: Todos</option>
                  <option value="manual">Manual</option>
                  <option value="import">Importação</option>
                  <option value="api">API</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-500 text-[20px]">
                    expand_more
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Buttons Group - FULLY WRAPPED */}
            <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">


              <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

              <div className="flex gap-2">
                <button
                  className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="Filtros Avançados"
                  aria-label="Filtros avancados"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    filter_list
                  </span>
                </button>
                <button
                  className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                  title="Exportar CSV"
                  aria-label="Exportar contatos em CSV"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    download
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Story 3.4 - Barra de Ações em Lote */}
          {selectedContacts.length > 0 && (
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 flex items-center justify-between animate-in slide-in-from-top-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-primary-dark dark:text-primary">
                  {selectedContacts.length} selecionado{selectedContacts.length > 1 ? 's' : ''}
                </span>
                <button
                  onClick={clearSelection}
                  className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-white"
                >
                  Limpar seleção
                </button>
              </div>
              <div className="flex items-center gap-2">
                {/* Dropdown para atribuir categoria */}
                <div className="relative">
                  <button
                    onClick={() => setShowBulkActions(!showBulkActions)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <span className="material-symbols-outlined text-[18px]">label</span>
                    Atribuir Categoria
                    <span className="material-symbols-outlined text-[16px]">expand_more</span>
                  </button>
                  {showBulkActions && (
                    <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20">
                      <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-semibold text-slate-500 uppercase">Categorias</span>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {categories.map(cat => (
                          <button
                            key={cat.id}
                            onClick={() => {
                              assignCategory(selectedContacts, cat.id);
                              setShowBulkActions(false);
                              clearSelection();
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            <span className={`size-2 rounded-full ${CATEGORY_COLOR_CLASSES[cat.color]?.dot || 'bg-slate-500'}`}></span>
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
                    {/* Story 3.4 - Checkbox de seleção geral */}
                    {/* Checkbox */}
                    <th className="p-4 pl-4 w-12">
                      <input
                        type="checkbox"
                        checked={selectedContacts.length === contacts.length && contacts.length > 0}
                        onChange={() => {
                          if (selectedContacts.length === contacts.length) {
                            clearSelection();
                          } else {
                            selectAllContacts();
                          }
                        }}
                        className="size-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary"
                      />
                    </th>
                    {/* Nome - Flexível */}
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Nome
                    </th>
                    {/* Número - Fixo */}
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[140px]">
                      Número
                    </th>
                    {/* Categorias - Flexível */}
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                      Categorias
                    </th>
                    {/* Última Campanha - Oculto em telas menores - Apenas em 2XL+ */}
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden 2xl:table-cell w-[180px]">
                      Última Campanha
                    </th>
                    {/* Ações - Fixo */}
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right pr-6 w-[100px]">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredContacts.map((contact) => (
                    <tr
                      key={contact.id}
                      className={`group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selectedContacts.includes(contact.id) ? 'bg-primary/5' : ''
                        }`}
                    >
                      {/* Story 3.4 - Checkbox individual */}
                      <td className="p-4 pl-4 w-12">
                        <input
                          type="checkbox"
                          checked={selectedContacts.includes(contact.id)}
                          onChange={() => toggleContactSelection(contact.id)}
                          className="size-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary"
                        />
                      </td>
                      <td className="p-4 overflow-hidden max-w-[200px]">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div
                            className={`size-8 rounded-full ${CATEGORY_COLOR_CLASSES[contact.color]?.avatarBg || 'bg-slate-200'} ${CATEGORY_COLOR_CLASSES[contact.color]?.avatarText || 'text-slate-600'} flex items-center justify-center text-xs font-bold flex-shrink-0`}
                          >
                            {contact.initials}
                          </div>
                          <div className="flex flex-col overflow-hidden min-w-0">
                            <span className="font-bold text-slate-900 dark:text-white text-sm truncate" title={contact.name}>
                              {contact.name}
                            </span>
                            <span className="text-xs text-slate-400 truncate" title={contact.email}>
                              {contact.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-sm text-slate-600 dark:text-slate-300">
                          {contact.phone}
                        </span>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1 max-h-16 overflow-hidden">
                          {/* Story 3.4 - Mostrar categorias por ID */}
                          {(contact.categoryIds || []).map((catId) => {
                            const cat = categories.find(c => c.id === catId);
                            if (!cat) return null;
                            return (
                              <span
                                key={catId}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${CATEGORY_COLOR_CLASSES[cat.color]?.badge || DEFAULT_BADGE_CLASSES}`}
                              >
                                <span className={`size-1.5 rounded-full ${CATEGORY_COLOR_CLASSES[cat.color]?.dot || 'bg-slate-500'} flex-shrink-0`}></span>
                                <span className="truncate max-w-[100px]">{cat.name}</span>
                              </span>
                            );
                          })}
                          {/* Fallback para tags se não houver categoryIds */}
                          {(!contact.categoryIds || contact.categoryIds.length === 0) && contact.tags.map((tag) => (
                            <span
                              key={tag}
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getTagStyle(tag)}`}
                            >
                              {tag}
                            </span>
                          ))}
                          {(!contact.categoryIds || contact.categoryIds.length === 0) && contact.tags.length === 0 && (
                            <span className="text-xs text-slate-400 italic">Sem categoria</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 hidden 2xl:table-cell">
                        {contact.lastCampaign ? (
                          <div className="flex flex-col">
                            <span className="text-sm text-slate-900 dark:text-white truncate max-w-[150px]" title={contact.lastCampaign.name}>
                              {contact.lastCampaign.name}
                            </span>
                            <span className="text-xs text-slate-500">
                              {contact.lastCampaign.date}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Nenhuma campanha
                          </span>
                        )}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex justify-end gap-1">
                          {/* Story 3.5 - Botão Editar */}
                          <button
                            onClick={() => handleEditContact(contact)}
                            className="text-slate-400 hover:text-blue-500 p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Editar Contato"
                            aria-label="Editar contato"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              edit
                            </span>
                          </button>
                          {/* Story 3.5 - Botão Excluir */}
                          <button
                            onClick={() => handleDeleteContactClick(contact)}
                            className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Excluir Contato"
                            aria-label="Excluir contato"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              delete
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Mostrando{' '}
                <span className="font-medium text-slate-900 dark:text-white">{filteredContacts.length > 0 ? 1 : 0}</span>{' '}
                a <span className="font-medium text-slate-900 dark:text-white">{Math.min(filteredContacts.length, 10)}</span>{' '}
                de{' '}
                <span className="font-medium text-slate-900 dark:text-white">
                  {filteredContacts.length.toLocaleString('pt-BR')}
                </span>{' '}
                contatos
              </span>
              <div className="flex items-center gap-2">
                <button
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  disabled
                  aria-label="Pagina anterior"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    chevron_left
                  </span>
                </button>
                <button
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Proxima pagina"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contacts;
