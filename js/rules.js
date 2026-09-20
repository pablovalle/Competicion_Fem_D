const rulesDialog = document.getElementById('rules-dialog');
const openButton = document.getElementById('open-rules');
const closeButton = document.getElementById('close-rules');

openButton.addEventListener('click', () => {
  rulesDialog.showModal();
  rulesDialog.scrollTop = 0;
  document.body.classList.add('dialog-open');
  closeButton.focus();
});

closeButton.addEventListener('click', () => rulesDialog.close());

rulesDialog.addEventListener('click', event => {
  if (event.target !== rulesDialog) return;
  const bounds = rulesDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom) {
    rulesDialog.close();
  }
});

rulesDialog.addEventListener('close', () => {
  if (!document.querySelector('dialog[open]')) document.body.classList.remove('dialog-open');
  openButton.focus();
});
