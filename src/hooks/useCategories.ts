import { useReducer, useCallback, useEffect, useRef } from "react";
import type {
  CategoryTreeNode,
  CategoryFormData,
  Keyword,
} from "../shared/types";
import {
  getAllCategoriesWithCounts,
  createCategory,
  updateCategory,
  deactivateCategory,
  getCategoryUsageCount,
  getChildrenUsageCount,
  getKeywordsByCategoryId,
  createKeyword,
  updateKeyword,
  deactivateKeyword,
  reinitializeCategories as reinitializeCategoriesSvc,
  hasDuplicateSortOrders,
  fixDuplicateSortOrders,
  getNextSortOrder,
  updateCategorySortOrders,
} from "../services/categoryService";

interface CategoriesState {
  categories: CategoryTreeNode[];
  tree: CategoryTreeNode[];
  selectedCategoryId: number | null;
  keywords: Keyword[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  editingCategory: CategoryFormData | null;
  isCreating: boolean;
}

type CategoriesAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_SAVING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_CATEGORIES"; payload: { flat: CategoryTreeNode[]; tree: CategoryTreeNode[] } }
  | { type: "SET_TREE"; payload: CategoryTreeNode[] }
  | { type: "SELECT_CATEGORY"; payload: number | null }
  | { type: "SET_KEYWORDS"; payload: Keyword[] }
  | { type: "START_CREATING" }
  | { type: "START_EDITING"; payload: CategoryFormData }
  | { type: "CANCEL_EDITING" };

const initialState: CategoriesState = {
  categories: [],
  tree: [],
  selectedCategoryId: null,
  keywords: [],
  isLoading: false,
  isSaving: false,
  error: null,
  editingCategory: null,
  isCreating: false,
};

function buildTree(flat: CategoryTreeNode[]): CategoryTreeNode[] {
  const map = new Map<number, CategoryTreeNode>();
  const roots: CategoryTreeNode[] = [];

  for (const cat of flat) {
    map.set(cat.id, { ...cat, children: [] });
  }

  for (const cat of map.values()) {
    if (cat.parent_id && map.has(cat.parent_id)) {
      map.get(cat.parent_id)!.children.push(cat);
    } else {
      roots.push(cat);
    }
  }

  return roots;
}

function flattenTreeToCategories(tree: CategoryTreeNode[]): CategoryTreeNode[] {
  const result: CategoryTreeNode[] = [];
  function recurse(nodes: CategoryTreeNode[]) {
    for (const node of nodes) {
      result.push(node);
      if (node.children.length > 0) {
        recurse(node.children);
      }
    }
  }
  recurse(tree);
  return result;
}

function reducer(state: CategoriesState, action: CategoriesAction): CategoriesState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_SAVING":
      return { ...state, isSaving: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false, isSaving: false };
    case "SET_CATEGORIES":
      return { ...state, categories: action.payload.flat, tree: action.payload.tree, isLoading: false };
    case "SET_TREE":
      return { ...state, tree: action.payload, categories: flattenTreeToCategories(action.payload) };
    case "SELECT_CATEGORY":
      return { ...state, selectedCategoryId: action.payload, editingCategory: null, isCreating: false, keywords: [] };
    case "SET_KEYWORDS":
      return { ...state, keywords: action.payload };
    case "START_CREATING":
      return {
        ...state,
        isCreating: true,
        selectedCategoryId: null,
        editingCategory: { name: "", type: "expense", color: "#4A90A4", parent_id: null, is_inputable: true, sort_order: 0 },
        keywords: [],
      };
    case "START_EDITING":
      return { ...state, isCreating: false, editingCategory: action.payload };
    case "CANCEL_EDITING":
      return { ...state, editingCategory: null, isCreating: false };
    default:
      return state;
  }
}

export function useCategories() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const fetchIdRef = useRef(0);
  const duplicateCheckDone = useRef(false);

  const loadCategories = useCallback(async () => {
    const fetchId = ++fetchIdRef.current;
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      if (!duplicateCheckDone.current) {
        duplicateCheckDone.current = true;
        const hasDups = await hasDuplicateSortOrders();
        if (hasDups) {
          await fixDuplicateSortOrders();
        }
      }

      const rows = await getAllCategoriesWithCounts();
      if (fetchId !== fetchIdRef.current) return;
      const flat = rows.map((r) => ({ ...r, children: [] as CategoryTreeNode[] }));
      const tree = buildTree(flat);
      dispatch({ type: "SET_CATEGORIES", payload: { flat, tree } });
    } catch (e) {
      if (fetchId !== fetchIdRef.current) return;
      dispatch({ type: "SET_ERROR", payload: e instanceof Error ? e.message : String(e) });
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const selectCategory = useCallback(async (id: number | null) => {
    dispatch({ type: "SELECT_CATEGORY", payload: id });
    if (id !== null) {
      try {
        const kws = await getKeywordsByCategoryId(id);
        dispatch({ type: "SET_KEYWORDS", payload: kws });
      } catch (e) {
        dispatch({ type: "SET_ERROR", payload: e instanceof Error ? e.message : String(e) });
      }
    }
  }, []);

  const startCreating = useCallback(() => {
    dispatch({ type: "START_CREATING" });
  }, []);

  const startEditing = useCallback(() => {
    const cat = state.categories.find((c) => c.id === state.selectedCategoryId);
    if (!cat) return;
    dispatch({
      type: "START_EDITING",
      payload: {
        name: cat.name,
        type: cat.type,
        color: cat.color ?? "#4A90A4",
        parent_id: cat.parent_id,
        is_inputable: cat.is_inputable,
        sort_order: cat.sort_order,
      },
    });
  }, [state.categories, state.selectedCategoryId]);

  const cancelEditing = useCallback(() => {
    dispatch({ type: "CANCEL_EDITING" });
  }, []);

  const saveCategory = useCallback(
    async (formData: CategoryFormData) => {
      dispatch({ type: "SET_SAVING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      try {
        if (state.isCreating) {
          const sortOrder = await getNextSortOrder(formData.parent_id);
          const newId = await createCategory({ ...formData, sort_order: sortOrder });
          await loadCategories();
          await selectCategory(newId);
        } else if (state.selectedCategoryId !== null) {
          await updateCategory(state.selectedCategoryId, formData);
          await loadCategories();
          await selectCategory(state.selectedCategoryId);
        }
        dispatch({ type: "SET_SAVING", payload: false });
      } catch (e) {
        dispatch({ type: "SET_ERROR", payload: e instanceof Error ? e.message : String(e) });
      }
    },
    [state.isCreating, state.selectedCategoryId, loadCategories, selectCategory]
  );

  const deleteCategory = useCallback(
    async (id: number): Promise<{ blocked: boolean; count: number }> => {
      const count = await getCategoryUsageCount(id);
      if (count > 0) {
        return { blocked: true, count };
      }
      // Also check children usage — they'll be promoted to root, not deleted
      const childrenCount = await getChildrenUsageCount(id);
      if (childrenCount > 0) {
        return { blocked: true, count: childrenCount };
      }
      dispatch({ type: "SET_SAVING", payload: true });
      try {
        await deactivateCategory(id);
        dispatch({ type: "SELECT_CATEGORY", payload: null });
        await loadCategories();
        dispatch({ type: "SET_SAVING", payload: false });
        return { blocked: false, count: 0 };
      } catch (e) {
        dispatch({ type: "SET_ERROR", payload: e instanceof Error ? e.message : String(e) });
        return { blocked: false, count: 0 };
      }
    },
    [loadCategories]
  );

  const reinitializeCategories = useCallback(async () => {
    dispatch({ type: "SET_SAVING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });
    try {
      await reinitializeCategoriesSvc();
      dispatch({ type: "SELECT_CATEGORY", payload: null });
      await loadCategories();
      dispatch({ type: "SET_SAVING", payload: false });
    } catch (e) {
      dispatch({ type: "SET_ERROR", payload: e instanceof Error ? e.message : String(e) });
    }
  }, [loadCategories]);

  const moveCategory = useCallback(
    async (categoryId: number, newParentId: number | null, newIndex: number) => {
      // Clone current tree
      const cloneNode = (n: CategoryTreeNode): CategoryTreeNode => ({
        ...n,
        children: n.children.map(cloneNode),
      });
      const newTree = state.tree.map(cloneNode);

      // Recursively find and remove the category from its current position
      function removeFromList(list: CategoryTreeNode[]): CategoryTreeNode | null {
        const idx = list.findIndex((n) => n.id === categoryId);
        if (idx !== -1) {
          return list.splice(idx, 1)[0];
        }
        for (const node of list) {
          const found = removeFromList(node.children);
          if (found) return found;
        }
        return null;
      }
      const movedNode = removeFromList(newTree);

      if (!movedNode) return;

      // Update parent_id
      movedNode.parent_id = newParentId;

      // Insert at new position
      if (newParentId === null) {
        newTree.splice(newIndex, 0, movedNode);
      } else {
        // Find parent anywhere in the tree
        function findNode(list: CategoryTreeNode[], id: number): CategoryTreeNode | null {
          for (const n of list) {
            if (n.id === id) return n;
            const found = findNode(n.children, id);
            if (found) return found;
          }
          return null;
        }
        const newParent = findNode(newTree, newParentId);
        if (!newParent) return;
        newParent.children.splice(newIndex, 0, movedNode);
      }

      // Optimistic update
      dispatch({ type: "SET_TREE", payload: newTree });

      // Compute batch updates for all nodes in the tree (3 levels)
      const updates: Array<{ id: number; sort_order: number; parent_id: number | null }> = [];

      function collectUpdates(nodes: CategoryTreeNode[], parentId: number | null) {
        nodes.forEach((n, i) => {
          updates.push({ id: n.id, sort_order: i + 1, parent_id: parentId });
          collectUpdates(n.children, n.id);
        });
      }
      collectUpdates(newTree, null);

      try {
        await updateCategorySortOrders(updates);
      } catch {
        // Revert on error
        await loadCategories();
      }
    },
    [state.tree, loadCategories]
  );

  const loadKeywords = useCallback(async (categoryId: number) => {
    try {
      const kws = await getKeywordsByCategoryId(categoryId);
      dispatch({ type: "SET_KEYWORDS", payload: kws });
    } catch (e) {
      dispatch({ type: "SET_ERROR", payload: e instanceof Error ? e.message : String(e) });
    }
  }, []);

  const addKeyword = useCallback(
    async (keyword: string, priority: number) => {
      if (state.selectedCategoryId === null) return;
      try {
        await createKeyword(state.selectedCategoryId, keyword, priority);
        await loadKeywords(state.selectedCategoryId);
        await loadCategories();
      } catch (e) {
        dispatch({ type: "SET_ERROR", payload: e instanceof Error ? e.message : String(e) });
      }
    },
    [state.selectedCategoryId, loadKeywords, loadCategories]
  );

  const editKeyword = useCallback(
    async (id: number, keyword: string, priority: number) => {
      try {
        await updateKeyword(id, keyword, priority);
        if (state.selectedCategoryId !== null) {
          await loadKeywords(state.selectedCategoryId);
        }
      } catch (e) {
        dispatch({ type: "SET_ERROR", payload: e instanceof Error ? e.message : String(e) });
      }
    },
    [state.selectedCategoryId, loadKeywords]
  );

  const removeKeyword = useCallback(
    async (id: number) => {
      try {
        await deactivateKeyword(id);
        if (state.selectedCategoryId !== null) {
          await loadKeywords(state.selectedCategoryId);
          await loadCategories();
        }
      } catch (e) {
        dispatch({ type: "SET_ERROR", payload: e instanceof Error ? e.message : String(e) });
      }
    },
    [state.selectedCategoryId, loadKeywords, loadCategories]
  );

  return {
    state,
    selectCategory,
    startCreating,
    startEditing,
    cancelEditing,
    saveCategory,
    deleteCategory,
    addKeyword,
    editKeyword,
    removeKeyword,
    reinitializeCategories,
    moveCategory,
  };
}
