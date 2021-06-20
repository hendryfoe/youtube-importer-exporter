export function Storage() {
  return {
    set(item: string, payload: any) {
      localStorage.setItem(item, payload);
    },
    get(item: string) {
      return localStorage.getItem(item);
    },
    remove(item) {
      localStorage.removeItem(item);
    },
  };
}