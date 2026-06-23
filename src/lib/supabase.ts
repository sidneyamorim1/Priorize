import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | any;

if (supabaseUrl && supabaseAnonKey) {
  // Real client – use provided credentials
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // ---- Mock implementation with LocalStorage persistence ------------------------
  class MockQueryBuilder {
    table: string;
    operation: 'select' | 'insert' | 'update' | 'delete' = 'select';
    payload: any = null;
    filters: Array<{ field: string; value: any }> = [];
    orderByField?: string;
    orderAscending?: boolean;

    constructor(table: string) {
      this.table = table;
    }

    private getData(): any[] {
      const key = `priorize_${this.table}`;
      const raw = localStorage.getItem(key);
      if (!raw) {
        if (this.table === 'categories') {
          const defaults = [
            { id: 'cat-1', name: 'Trabalho', color: 'bg-blue-50 text-blue-700 border-blue-100', text_color: 'text-blue-700', border_color: 'border-blue-100' },
            { id: 'cat-2', name: 'Estudos', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', text_color: 'text-emerald-700', border_color: 'border-emerald-100' },
            { id: 'cat-3', name: 'Pessoal', color: 'bg-amber-50 text-amber-700 border-amber-100', text_color: 'text-amber-700', border_color: 'border-amber-100' },
            { id: 'cat-4', name: 'Urgente', color: 'bg-rose-50 text-rose-700 border-rose-100', text_color: 'text-rose-700', border_color: 'border-rose-100' }
          ];
          localStorage.setItem(key, JSON.stringify(defaults));
          return defaults;
        }
        return [];
      }
      return JSON.parse(raw);
    }

    private saveData(data: any[]) {
      localStorage.setItem(`priorize_${this.table}`, JSON.stringify(data));
    }

    select(_columns?: string) {
      return this;
    }

    order(field: string, options?: { ascending?: boolean }) {
      this.orderByField = field;
      this.orderAscending = options?.ascending ?? true;
      return this;
    }

    insert(row: any) {
      this.operation = 'insert';
      this.payload = row;
      return this;
    }

    update(values: any) {
      this.operation = 'update';
      this.payload = values;
      return this;
    }

    delete() {
      this.operation = 'delete';
      return this;
    }

    eq(field: string, value: any) {
      this.filters.push({ field, value });
      return this;
    }

    async single() {
      const res = await this.execute();
      return {
        data: res.data && res.data.length > 0 ? res.data[0] : null,
        error: res.data && res.data.length > 0 ? null : { message: 'Registro não encontrado' }
      };
    }

    async execute() {
      let data = this.getData();

      if (this.operation === 'insert') {
        const rows = Array.isArray(this.payload) ? this.payload : [this.payload];
        const processed = rows.map(r => ({
          ...r,
          created_at: r.created_at || new Date().toISOString()
        }));
        data.push(...processed);
        this.saveData(data);
        return { data: processed, error: null };
      }

      if (this.operation === 'update') {
        let updated: any[] = [];
        const newData = data.map((item: any) => {
          const matches = this.filters.every(f => {
            const key = f.field === 'category_id' && item.category_id === undefined && item.categoryId !== undefined ? 'categoryId' : f.field;
            return item[key] === f.value;
          });
          if (matches) {
            const newItem = { ...item, ...this.payload };
            updated.push(newItem);
            return newItem;
          }
          return item;
        });
        this.saveData(newData);
        return { data: updated, error: null };
      }

      if (this.operation === 'delete') {
        let deleted: any[] = [];
        const newData = data.filter((item: any) => {
          const matches = this.filters.every(f => {
            const key = f.field === 'category_id' && item.category_id === undefined && item.categoryId !== undefined ? 'categoryId' : f.field;
            return item[key] === f.value;
          });
          if (matches) {
            deleted.push(item);
            return false;
          }
          return true;
        });
        this.saveData(newData);
        return { data: deleted, error: null };
      }

      // Default: select
      let filtered = data;
      if (this.filters.length > 0) {
        filtered = data.filter((item: any) => {
          return this.filters.every(f => {
            const key = f.field === 'category_id' && item.category_id === undefined && item.categoryId !== undefined ? 'categoryId' : f.field;
            return item[key] === f.value;
          });
        });
      }

      if (this.orderByField) {
        const f = this.orderByField;
        const asc = this.orderAscending ?? true;
        filtered.sort((a: any, b: any) => {
          let valA = a[f];
          let valB = b[f];
          if (f === 'created_at' && a.created_at === undefined && a.createdAt !== undefined) {
            valA = a.createdAt;
            valB = b.createdAt;
          }
          if (valA < valB) return asc ? -1 : 1;
          if (valA > valB) return asc ? 1 : -1;
          return 0;
        });
      }

      return { data: filtered, error: null };
    }

    then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
      return this.execute().then(onfulfilled, onrejected);
    }
  }

  const mockAuth = {
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const usersRaw = localStorage.getItem('priorize_users');
      let users = usersRaw ? JSON.parse(usersRaw) : [];
      if (users.length === 0) {
        users = [{ email: 'sid.amorim1@gmail.com', password: 'testelocal00', name: 'Sidney Amorim' }];
        localStorage.setItem('priorize_users', JSON.stringify(users));
      }

      const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
      if (user && user.password === password) {
        return { data: { user: { email: user.email, user_metadata: { full_name: user.name } } }, error: null };
      }
      return { data: null, error: { message: 'E-mail ou senha incorretos.', name: 'AuthError' } };
    },
    async signUp({ email, password, options }: { email: string; password: string; options?: any }) {
      const usersRaw = localStorage.getItem('priorize_users');
      let users = usersRaw ? JSON.parse(usersRaw) : [];
      if (users.length === 0) {
        users = [{ email: 'sid.amorim1@gmail.com', password: 'testelocal00', name: 'Sidney Amorim' }];
      }

      if (users.some((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
        return { data: null, error: { message: 'Este e-mail já está cadastrado.', name: 'AuthError' } };
      }

      const fullName = options?.data?.full_name ?? email.split('@')[0];
      const newUser = { email, password, name: fullName };
      users.push(newUser);
      localStorage.setItem('priorize_users', JSON.stringify(users));

      return { data: { user: { email, user_metadata: { full_name: fullName } } }, error: null };
    },
    async signOut() {
      return { error: null };
    },
    async resetPasswordForEmail(email: string, _options?: any) {
      console.log(`[Mock Auth] Enviando link de recuperação para ${email}`);
      return { data: {}, error: null };
    },
  };

  const mockDb = {
    from: (table: string) => new MockQueryBuilder(table),
  };

  supabase = { auth: mockAuth, ...mockDb };
}

export { supabase };
