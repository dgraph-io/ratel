var COOKIE_VALUE = 'latest';

var cookieCheckbox = document.getElementById('cookieCheckbox');
cookieCheckbox.checked = localStorage.getItem(RATEL_AUTOLOAD_URL_STORAGE_KEY) == COOKIE_VALUE;
cookieCheckbox.addEventListener('change', function onChange(evt) {
  localStorage.setItem(RATEL_AUTOLOAD_URL_STORAGE_KEY, evt.target.checked ? COOKIE_VALUE : '');
});
