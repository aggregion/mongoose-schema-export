const util = require('util');
const fs = require('fs');

module.exports = {
  getId,
  createEl,
  addEl,
  writeFile: util.promisify(fs.writeFile)
};

let ids = 5000;
function getId() {
  return ids++;
}

function createEl(tag, attrs, doc) {
  const el = doc.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  return el;
}

function addEl(parentNode, tag, attrs = {}) {
  const el = createEl(tag, attrs, parentNode.ownerDocument);
  parentNode.appendChild(el);

  return el;
}
