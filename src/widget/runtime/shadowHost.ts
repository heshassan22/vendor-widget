export function createShadowHost(): { host: HTMLElement; shadowRoot: ShadowRoot } {
  const host = document.createElement('uniwidget-host');
  host.setAttribute('data-uniwidget', 'true');
  document.body.append(host);
  const shadowRoot = host.attachShadow({ mode: 'open' });
  return { host, shadowRoot };
}

