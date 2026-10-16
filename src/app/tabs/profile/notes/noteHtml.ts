// Notes keeps checklist state in ql-* classes because the API permits those
// classes, but deliberately strips interactive inputs and data attributes.
export function noteHtmlForStorage(html: string): string {
  const root = document.createElement('div');
  root.innerHTML = html;
  root.querySelectorAll('ul[data-checked]').forEach(list => {
    list.classList.add(list.getAttribute('data-checked') === 'true' ? 'ql-list-checked' : 'ql-list-unchecked');
    list.removeAttribute('data-checked');
  });
  return root.innerHTML;
}

export function noteHtmlForEditor(html: string): string {
  const root = document.createElement('div');
  root.innerHTML = html;
  root.querySelectorAll('del,strike').forEach(element => {
    const strike = document.createElement('s');
    strike.append(...element.childNodes);
    element.replaceWith(strike);
  });
  root.querySelectorAll('ul.ql-list-checked,ul.ql-list-unchecked').forEach(list => {
    list.setAttribute('data-checked', String(list.classList.contains('ql-list-checked')));
    list.classList.remove('ql-list-checked', 'ql-list-unchecked');
    if (!list.className) list.removeAttribute('class');
  });
  return root.innerHTML;
}
