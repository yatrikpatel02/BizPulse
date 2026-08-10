export const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

export const setCookie = (name, value, maxAgeSeconds) => {
  let cookieStr = `${name}=${value}; path=/; SameSite=Lax`;
  if (maxAgeSeconds) {
    cookieStr += `; max-age=${maxAgeSeconds}`;
  }
  document.cookie = cookieStr;
};

export const deleteCookie = (name) => {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
};
