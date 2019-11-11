var COOKIE_NAME = 'ratelAutoloadUrl';
var COOKIE_VALUE = '?latest';

var cookieCheckbox = document.getElementById('cookieCheckbox');
cookieCheckbox.checked = localStorage.getItem(COOKIE_NAME) == COOKIE_VALUE;
cookieCheckbox.addEventListener('change', function onChange(evt) {
  localStorage.setItem(COOKIE_NAME, evt.target.checked ? COOKIE_VALUE : '');
});
