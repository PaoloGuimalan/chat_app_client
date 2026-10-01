/**
 * A stored file reference comes in two forms:
 *
 * - `<url>%%%<name>` - the older Cloud Storage uploads, which carried the name
 *   beside the URL.
 * - a bare URL - the current uploads (server `storage.js`), whose last path
 *   segment IS the name the file was saved under.
 *
 * Reading only the first form left every current file nameless - in the chat
 * quote and the conversation/channel info modal's Files tab alike.
 */
export const fileMessageName = (reference: string) =>
  reference.includes("%%%")
    ? reference.split("%%%")[1]
    : reference.split("/")[reference.split("/").length - 1];

/** Where to open it - the URL half, with a `###` in an old name escaped. */
export const fileMessageUrl = (reference: string) =>
  reference.split("%%%")[0].replace("###", "%23%23%23");
