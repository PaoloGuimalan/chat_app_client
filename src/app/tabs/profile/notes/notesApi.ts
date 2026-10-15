import { firstPartyClient } from "@/reusables/hooks/requests";
import envs from "@/reusables/hooks/env_configs";
import type { Note, NoteValue } from "./noteSession";

export function notesApi(token: string) {
  const headers = { "x-access-token": token };
  const root = `${envs.USER_SERVICE_API}/api/notes/notes/`;
  return {
    list: async (page: number, search: string) => (await firstPartyClient.get<{ count: number; next: string | null; results: Note[] }>(root, { headers, params: { page, page_size: 24, search } })).data,
    get: async (id: string) => (await firstPartyClient.get<Note>(`${root}${id}/`, { headers })).data,
    save: async (value: NoteValue, previous: Note | null) => {
      const payload = { ...value, attachments: value.attachments.map(file => file.id ? { id: file.id } : { url: file.url }) };
      return previous
        ? (await firstPartyClient.patch<Note>(`${root}${previous.id}/`, { ...payload, version: previous.version }, { headers })).data
        : (await firstPartyClient.post<Note>(root, payload, { headers })).data;
    },
    remove: async (note: Note) => { await firstPartyClient.delete(`${root}${note.id}/`, { headers, data: { version: note.version } }); },
    reorder: async (id: string, before: string | null) => (await firstPartyClient.post<{ order: { id: string; sort: number }[] }>(`${root}reorder/`, { note_id: id, before_id: before }, { headers })).data,
  };
}
