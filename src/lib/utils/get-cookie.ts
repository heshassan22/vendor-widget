export default function getCookie(name: string): string | null {
  const encodedName = `${encodeURIComponent(name)}=`;
  const allCookies = document.cookie.split(';');

  for (const cookie of allCookies) {
    const trimmed = cookie.trim();
    if (trimmed.startsWith(encodedName)) {
      return decodeURIComponent(trimmed.slice(encodedName.length));
    }
  }

  return null;
}

