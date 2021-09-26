'use strict';
const table = document.querySelector('table'); // markdown doesn't add ids but we know we want the first table
table.classList.add('streamer-table');


/******************************************************************************
 **** Sorting
 *****************************************************************************/

// Get the initialOrder of rows in table, we can trust this is 2-week activity sorted as it is set by a bot
const initialOrder = Array.from(table.rows);
let currentSort = 'initial';

function restoreInitialSort() {
  initialOrder.forEach(e => e.parentNode.appendChild(e));
  currentSort = 'initial';
}

function toggleOnlineSort(headerElement) {
  document.querySelectorAll('th[data-sort]').forEach(e => e.removeAttribute('data-sort'));
  switch (currentSort) {
    default:
    case 'initial':
      Array.from(table.rows)
        .map(r => [r, r.querySelector('td:nth-child(1)')?.innerText])
        .filter(r => r[1] !== undefined)
        .sort((a, b) => {
          if (a[1].includes('🟢') && !b[1].includes('🟢')) {
            return -1;
          } else if (b[1].includes('🟢') && !a[1].includes('🟢')) {
            return 1;
          }

          const aPos = initialOrder.indexOf(a[0]);
          const bPos = initialOrder.indexOf(b[0]);

          return aPos-bPos;
        })
        .forEach(r => r[0].parentNode.appendChild(r[0]));
      currentSort = 'online';
      headerElement.setAttribute('data-sort', 'forward');
      break;
    case 'online':
      Array.from(table.rows)
        .map(r => [r, r.querySelector('td:nth-child(1)')?.innerText])
        .filter(r => r[1] !== undefined)
        .sort((a, b) => {
          if (a[1].includes('🟢') && !b[1].includes('🟢')) {
            return 1;
          } else if (b[1].includes('🟢') && !a[1].includes('🟢')) {
            return -1;
          }

          const aPos = initialOrder.indexOf(a[0]);
          const bPos = initialOrder.indexOf(b[0]);

          return aPos-bPos;
        })
        .forEach(r => r[0].parentNode.appendChild(r[0]));
      currentSort = 'offline';
      headerElement.setAttribute('data-sort', 'backward');
      break;
    case 'offline':
      restoreInitialSort();
      headerElement.removeAttribute('data-sort');
      break;
  }
}

// Online/Offline sort
const onlineHeader = table.querySelector('th:nth-child(1)');
onlineHeader.addEventListener('click', function(e) {
  toggleOnlineSort(e.target);
});
onlineHeader.setAttribute('title', 'Sort by online status');
onlineHeader.setAttribute('role', 'button');

// Name sort
const nameHeader = table.querySelector('th:nth-child(2)');
nameHeader.addEventListener('click', function(e) {
  document.querySelectorAll('th[data-sort]').forEach(e => e.removeAttribute('data-sort'));
  switch (currentSort) {
    default:
    case 'initial':
      Array.from(table.rows)
        .map(r => [r, r.querySelector('td:nth-child(2)')?.innerText?.toLowerCase()])
        .filter(r => r[1] !== undefined)
        .sort((a, b) => a[1].localeCompare(b[1]))
        .forEach(r => r[0].parentNode.appendChild(r[0]));
      currentSort = 'nameForward';
      e.target.setAttribute('data-sort', 'forward');
      break;
    case 'nameForward':
      Array.from(table.rows)
        .map(r => [r, r.querySelector('td:nth-child(2)')?.innerText?.toLowerCase()])
        .filter(r => r[1] !== undefined)
        .sort((a, b) => b[1].localeCompare(a[1]))
        .forEach(r => r[0].parentNode.appendChild(r[0]));
      currentSort = 'nameBackward';
      e.target.setAttribute('data-sort', 'backward');
      break;
    case 'nameBackward':
      restoreInitialSort();
      e.target.removeAttribute('data-sort');
      break;
  }
});
nameHeader.setAttribute('title', 'Sort by streamer name');
nameHeader.setAttribute('role', 'button');


/*
const categoryHeader = table.querySelector('th:nth-child(6)');
categoryHeader.addEventListener('click', function(e) {
  document.querySelectorAll('th[data-sort]').forEach(e => e.removeAttribute('data-sort'));
  switch (currentSort) {
    default:
    case 'initial':
      Array.from(table.rows)
        .map(r => [r,r.querySelector('td:nth-child(6)')?.innerText])
        .filter(r => r[1] !== undefined)
        .sort((a, b) => a[1].localeCompare(b[1]))
        .forEach(r => r[0].parentNode.appendChild(r[0]));
      currentSort = 'categoryForward';
      e.target.setAttribute('data-sort', 'forward');
      break;
    case 'categoryForward':
      Array.from(table.rows)
        .map(r => [r,r.querySelector('td:nth-child(6)')?.innerText])
        .filter(r => r[1] !== undefined)
        .sort((a,b) => b[1].localeCompare(a[1]))
        .forEach(r => r[0].parentNode.appendChild(r[0]));
      currentSort = 'categoryBackward';
      e.target.setAttribute('data-sort', 'backward');
      break;
    case 'categoryBackward':
      restoreInitialSort();
      e.target.removeAttribute('data-sort');
      break;
  }
});
categoryHeader.setAttribute('title', 'Sort by category');
categoryHeader.setAttribute('role', 'button');
*/

// Initially start in a sort by online state
toggleOnlineSort(onlineHeader);

/******************************************************************************
 *** Filtering
 *****************************************************************************/

function getLanguages() {
  const langs = new Set();
  for (let td of table.querySelectorAll('td:nth-child(4)')) {
    const content = td.innerText.trim();
    if (content.length > 0) {
      langs.add(content);
      td.parentElement.setAttribute('data-language', content);
    }
  }
  return langs;
}

const filters = new Map();
getLanguages().forEach(l => filters.set(l, true));

const filterStyles = document.head.appendChild(document.createElement('link'));
filterStyles.rel = 'stylesheet';

function generateLanguageModal() {
  const modal = document.createElement('div');
  modal.setAttribute('role', 'modal');
  const fields = modal.appendChild(document.createElement('fieldset'));
  const legend = fields.appendChild(document.createElement('legend'));
  legend.innerText = 'Language filter';

  const inputs = new Array();
  for (let [language, filtered] of filters.entries()) {
    const ID = `filter-checkbox-${language}`;
    const input = fields.appendChild(document.createElement('input'));
    input.type = 'checkbox';
    input.name = language;
    input.checked = filtered;
    input.id = ID;
    const label = fields.appendChild(document.createElement('label'));
    label.setAttribute('for', ID);
    label.innerText = language;
    fields.appendChild(document.createElement('br'));

    inputs.push({ input, language });
  }

  const done = fields.appendChild(document.createElement('input'));
  done.type = 'submit';
  done.value = 'Done';
  done.addEventListener('click', () => {
    for (let input of inputs) {
      filters.set(input.language, input.input.checked);
    }
    modal.remove();

    // Update filters, sorry for complicated-ness
    URL.revokeObjectURL(filterStyles.href);
    const rules = Array.from(filters.entries()).filter(l => l[1] === false).map(l => `.streamer-table tr[data-language=${l[0]}]`);
    if (rules.length > 0) {
      const blob = new Blob([
        rules.join(',') + ' { display: none }',
      ], { type: 'text/css' });
      filterStyles.href = URL.createObjectURL(blob);
    } else {
      filterStyles.href = '';
    }
  }, { once: true });

  return modal;
}

const languageHeader = table.querySelector('th:nth-child(4)');
languageHeader.addEventListener('click', function(e) {
  document.body.appendChild(generateLanguageModal());
})
languageHeader.setAttribute('title', 'Filter by language');
languageHeader.setAttribute('role', 'button');
