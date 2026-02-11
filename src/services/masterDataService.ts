// ═══════════════════════════════════════════════════════════════════════════
// Master Data Service - Brands, Stores, Collections, Categories, SKU Catalog
// ═══════════════════════════════════════════════════════════════════════════
import api from './api';

export const masterDataService = {
  // Get all brands
  async getBrands() {
    const response: any = await api.get('/master/brands');
    return response.data.data || response.data;
  },

  // Get all stores
  async getStores() {
    const response: any = await api.get('/master/stores');
    return response.data.data || response.data;
  },

  // Get all collections
  async getCollections() {
    const response: any = await api.get('/master/collections');
    return response.data.data || response.data;
  },

  // Get all genders
  async getGenders() {
    const response: any = await api.get('/master/genders');
    return response.data.data || response.data;
  },

  // Get all categories (with hierarchy)
  async getCategories() {
    const response: any = await api.get('/master/categories');
    return response.data.data || response.data;
  },

  // Get seasons configuration
  async getSeasons() {
    const response: any = await api.get('/master/seasons');
    return response.data.data || response.data;
  },

  // Get SKU catalog with filters
  async getSkuCatalog(params: any = {}) {
    const response: any = await api.get('/master/sku-catalog', { params });
    return response.data;
  },

  // Get all sub-categories (flatten from categories hierarchy — direct endpoint not yet implemented)
  async getSubCategories() {
    const categories: any = await this.getCategories();
    const list: any[] = Array.isArray(categories) ? categories : [];
    const subs: any[] = [];
    list.forEach((cat: any) => {
      (cat.subCategories || []).forEach((sub: any) => {
        subs.push({
          ...sub,
          parent: { id: cat.id, name: cat.name, code: cat.code }
        });
      });
    });
    return subs;
  }
};

export default masterDataService;
