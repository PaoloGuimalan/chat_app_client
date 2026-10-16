// A shared, non-interactive HTML document for both writing apps. ql-* classes
// also survive the Notes API sanitizer without storing checkbox form controls.
export function writingHtmlForStorage(html: string): string {
  const root = document.createElement('div');
  root.innerHTML = html;
  root.querySelectorAll('div.checklist').forEach(list => {
    const groups: HTMLElement[] = [];
    [...list.children].filter(item => item.classList.contains('checklist-item')).forEach(item => {
      const checked = item.querySelector('input[type="checkbox"]')?.hasAttribute('checked');
      const label = item.querySelector('label');
      const li = document.createElement('li');
      li.innerHTML = label ? label.innerHTML : item.innerHTML;
      li.querySelectorAll('input').forEach(input => input.remove());
      [...item.classList].filter(name => name.startsWith('ql-')).forEach(name => li.classList.add(name));
      if (li.firstChild?.nodeType === Node.TEXT_NODE) {
        li.firstChild.textContent = li.firstChild.textContent?.replace(/^\u00a0/, '') || '';
      }
      if (item.hasAttribute('style')) li.setAttribute('style', item.getAttribute('style')!);
      const className = checked ? 'ql-list-checked' : 'ql-list-unchecked';
      let group = groups.at(-1);
      if (!group?.classList.contains(className)) {
        group = document.createElement('ul');
        group.className = className;
        groups.push(group);
      }
      group.append(li);
    });
    list.replaceWith(...groups);
  });
  root.querySelectorAll('del,strike').forEach(element => {
    const strike = document.createElement('s');
    strike.append(...element.childNodes);
    element.replaceWith(strike);
  });
  root.querySelectorAll('hr').forEach(rule => {
    const divider = document.createElement('div');
    divider.className = 'ql-divider';
    rule.replaceWith(divider);
  });
  root.querySelectorAll<HTMLElement>('[style]').forEach(element => {
    // The earlier native encoder measured one indent as 32px.
    const padding = element.style.paddingLeft;
    if (/^\d+px$/.test(padding)) {
      const width = parseInt(padding, 10);
      if (width > 0 && width % 32 === 0) {
        element.classList.add(`ql-indent-${width / 32}`);
        element.style.removeProperty('padding-left');
      }
    }
  });
  root.querySelectorAll<HTMLElement>('blockquote').forEach(quote => {
    // The old native codec embeds its own quote border and spacing. Let the
    // shared writing theme render those instead of keeping platform defaults.
    Array.from({ length: quote.style.length }, (_, index) => quote.style.item(index))
      .filter(property => property === 'margin' || property.startsWith('margin-')
        || property === 'border-left' || property.startsWith('border-left-')
        || property === 'padding-left')
      .forEach(property => quote.style.removeProperty(property));
  });
  root.querySelectorAll('ul[data-checked]').forEach(list => {
    list.classList.remove('ql-list-checked', 'ql-list-unchecked');
    list.classList.add(list.getAttribute('data-checked') === 'true' ? 'ql-list-checked' : 'ql-list-unchecked');
    list.removeAttribute('data-checked');
  });
  // Older native entries contain nested lists, while Quill represents levels
  // on flat li elements. Retain both the item order and the original levels.
  [...root.querySelectorAll('ul,ol')].filter(list => !list.parentElement?.closest('ul,ol')).forEach(list => {
    if (!list.querySelector('ul,ol')) return;
    const groups: HTMLElement[] = [];
    const collect = (current: Element, depth: number) => {
      [...current.children].forEach(item => {
        if (item.matches('ul,ol')) {
          collect(item, depth + 1);
          return;
        }
        if (item.tagName !== 'LI') return;
        const li = item.cloneNode(true) as HTMLElement;
        li.querySelectorAll('ul,ol').forEach(nested => nested.remove());
        const explicit = [...li.classList].find(name => /^ql-indent-\d+$/.test(name));
        if (!explicit && depth > 0) li.classList.add(`ql-indent-${depth}`);
        const state = current.classList.contains('ql-list-checked') ? 'ql-list-checked'
          : current.classList.contains('ql-list-unchecked') ? 'ql-list-unchecked' : '';
        let group = groups.at(-1);
        if (group?.tagName !== current.tagName || group.className !== state) {
          group = document.createElement(current.tagName.toLowerCase());
          group.className = state;
          groups.push(group);
        }
        group.append(li);
        [...item.children].filter(child => child.matches('ul,ol')).forEach(child => collect(child, depth + 1));
      });
    };
    collect(list, 0);
    list.replaceWith(...groups);
  });
  return root.innerHTML;
}

export function writingHtmlForEditor(html: string): string {
  const root = document.createElement('div');
  root.innerHTML = writingHtmlForStorage(html);
  root.querySelectorAll('ul.ql-list-checked,ul.ql-list-unchecked').forEach(list => {
    list.setAttribute('data-checked', String(list.classList.contains('ql-list-checked')));
    list.classList.remove('ql-list-checked', 'ql-list-unchecked');
    if (!list.className) list.removeAttribute('class');
  });
  return root.innerHTML;
}
