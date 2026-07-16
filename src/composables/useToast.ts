import { readonly, ref } from "vue";

export interface ToastMessage { id: string; text: string; tone: "info" | "error" | "success" }
const messages = ref<ToastMessage[]>([]);

export function useToast() {
  function show(text: string, tone: ToastMessage["tone"] = "info") {
    const id = crypto.randomUUID();
    messages.value.push({ id, text, tone });
    setTimeout(() => { messages.value = messages.value.filter((item) => item.id !== id); }, 3200);
  }
  return { messages: readonly(messages), show };
}
